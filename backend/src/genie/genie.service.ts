import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { BookDemoDto } from './dto/book-demo.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QualificationSignals {
  company_size?: 'solo' | 'small' | 'medium' | 'enterprise';
  decision_maker?: boolean;
  budget_mentioned?: boolean;
  timeline?: 'immediate' | 'short_term' | 'long_term' | 'exploring';
  pain_points?: string[];
  objections?: string[];
  enthusiasm_level?: 'low' | 'medium' | 'high';
}

@Injectable()
export class GenieService {
  private readonly logger = new Logger(GenieService.name);
  private readonly llmApiUrl = 'https://apps.abacus.ai/v1/chat/completions';
  private readonly llmApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.llmApiKey = this.configService.get<string>('ABACUSAI_API_KEY') || '';
  }

  /**
   * Start a new conversation with Genie
   */
  async startConversation(
    organizationId: string,
    dto: StartConversationDto,
  ): Promise<ConversationResponseDto> {
    this.logger.log(`Starting new Genie conversation for org: ${organizationId}`);

    // Create new conversation
    const conversation = await this.prisma.genie_conversation.create({
      data: {
        organization_id: organizationId,
        visitor_email: dto.visitor_email,
        visitor_name: dto.visitor_name,
        visitor_company: dto.visitor_company,
        visitor_role: dto.visitor_role,
        session_metadata: dto.session_metadata || {},
        status: 'active',
      },
    });

    // Create initial system message (save for later, don't block the response)
    const systemMessage = this.getSystemPrompt();
    this.prisma.genie_message.create({
      data: {
        conversation_id: conversation.id,
        role: 'system',
        content: systemMessage,
      },
    }).catch(err => this.logger.error('Error saving system message:', err));

    // Create welcome message
    const welcomeMessage = this.getWelcomeMessage(dto.visitor_name);
    this.prisma.genie_message.create({
      data: {
        conversation_id: conversation.id,
        role: 'assistant',
        content: welcomeMessage,
      },
    }).catch(err => this.logger.error('Error saving welcome message:', err));

    return {
      conversation_id: conversation.id,
      message: welcomeMessage,
      qualification_score: 0,
      lead_tier: 'undetermined',
      recommended_action: 'undecided',
      suggested_questions: [
        'What does LeadGenX do?',
        'How much does it cost?',
        'Can I see a demo?',
      ],
    };
  }

  /**
   * Send a message to Genie and get response
   */
  async sendMessage(
    conversationId: string,
    organizationId: string,
    dto: SendMessageDto,
  ): Promise<ConversationResponseDto> {
    this.logger.log(`Processing message for conversation: ${conversationId}`);

    // Verify conversation belongs to organization
    const conversation = await this.prisma.genie_conversation.findFirst({
      where: {
        id: conversationId,
        organization_id: organizationId,
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Save user message
    await this.prisma.genie_message.create({
      data: {
        conversation_id: conversationId,
        role: 'user',
        content: dto.message,
      },
    });

    // Prepare conversation history for LLM
    const messages: Message[] = conversation.messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current user message
    messages.push({
      role: 'user',
      content: dto.message,
    });

    // Get AI response
    const aiResponse = await this.getAIResponse(messages);

    // Save assistant message
    await this.prisma.genie_message.create({
      data: {
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // Update conversation timestamp
    await this.prisma.genie_conversation.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });

    // Analyze conversation for qualification
    const signals = await this.analyzeQualificationSignals(messages);
    const qualificationScore = this.calculateQualificationScore(signals);
    const leadTier = this.determineLeadTier(signals, qualificationScore);
    const recommendedAction = this.getRecommendedAction(leadTier, signals);

    // Update conversation with qualification data
    await this.prisma.genie_conversation.update({
      where: { id: conversationId },
      data: {
        qualification_score: qualificationScore,
        lead_tier: leadTier,
        recommended_action: recommendedAction,
        context_data: signals as any,
      },
    });

    // Update or create qualification record
    await this.updateQualification(
      conversationId,
      organizationId,
      signals,
      qualificationScore,
      leadTier,
      recommendedAction,
    );

    return {
      conversation_id: conversationId,
      message: aiResponse,
      qualification_score: qualificationScore,
      lead_tier: leadTier,
      recommended_action: recommendedAction,
      signals_detected: signals,
      suggested_questions: this.getSuggestedQuestions(leadTier, signals),
    };
  }

  /**
   * Book a demo
   */
  async bookDemo(
    conversationId: string,
    organizationId: string,
    dto: BookDemoDto,
  ) {
    this.logger.log(`Booking demo for conversation: ${conversationId}`);

    // Verify conversation
    const conversation = await this.prisma.genie_conversation.findFirst({
      where: {
        id: conversationId,
        organization_id: organizationId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create demo request
    const demoRequest = await this.prisma.genie_demo_request.create({
      data: {
        conversation_id: conversationId,
        organization_id: organizationId,
        contact_email: dto.contact_email,
        contact_name: dto.contact_name,
        contact_phone: dto.contact_phone,
        company_name: dto.company_name,
        company_size: dto.company_size,
        industry: dto.industry,
        preferred_date: dto.preferred_date ? new Date(dto.preferred_date) : null,
        preferred_time_slot: dto.preferred_time_slot,
        timezone: dto.timezone,
        use_case_description: dto.use_case_description,
        additional_notes: dto.additional_notes,
        status: 'pending',
      },
    });

    // Update conversation status
    await this.prisma.genie_conversation.update({
      where: { id: conversationId },
      data: { status: 'scheduled' },
    });

    return {
      success: true,
      demo_request_id: demoRequest.id,
      message: 'Demo request submitted successfully! Our team will reach out within 24 hours.',
    };
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string, organizationId: string) {
    const conversation = await this.prisma.genie_conversation.findFirst({
      where: {
        id: conversationId,
        organization_id: organizationId,
      },
      include: {
        messages: {
          where: {
            role: { in: ['user', 'assistant'] }, // Exclude system messages
          },
          orderBy: { created_at: 'asc' },
        },
        qualifications: true,
        demo_requests: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get all conversations for an organization
   */
  async listConversations(organizationId: string, status?: string) {
    return this.prisma.genie_conversation.findMany({
      where: {
        organization_id: organizationId,
        ...(status && { status: status as any }),
      },
      include: {
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
        qualifications: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { last_message_at: 'desc' },
      take: 100,
    });
  }

  // ======================
  // PRIVATE HELPER METHODS
  // ======================

  private async getAIResponse(messages: Message[]): Promise<string> {
    try {
      const response = await fetch(this.llmApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.llmApiKey}`,
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 500,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';
    } catch (error) {
      this.logger.error('Error calling LLM API:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }

  private async analyzeQualificationSignals(messages: Message[]): Promise<QualificationSignals> {
    // Extract signals from conversation using LLM
    const analysisPrompt = `Analyze the following conversation and extract qualification signals. Return ONLY a valid JSON object with these fields:
- company_size: "solo" | "small" | "medium" | "enterprise" | null
- decision_maker: boolean | null
- budget_mentioned: boolean
- timeline: "immediate" | "short_term" | "long_term" | "exploring" | null
- pain_points: string[] (array of identified pain points)
- objections: string[] (array of objections raised)
- enthusiasm_level: "low" | "medium" | "high"

Conversation:
${messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n')}

Return ONLY the JSON object, no additional text.`;

    try {
      const response = await fetch(this.llmApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.llmApiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.3,
          max_tokens: 300,
          stream: false,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const signals = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      return signals;
    } catch (error) {
      this.logger.error('Error analyzing qualification signals:', error);
      return {
        enthusiasm_level: 'medium',
        pain_points: [],
        objections: [],
      };
    }
  }

  private calculateQualificationScore(signals: QualificationSignals): number {
    let score = 0;

    // Company size (0-25 points)
    if (signals.company_size === 'enterprise') score += 25;
    else if (signals.company_size === 'medium') score += 20;
    else if (signals.company_size === 'small') score += 15;
    else if (signals.company_size === 'solo') score += 10;

    // Decision maker (0-25 points)
    if (signals.decision_maker === true) score += 25;
    else if (signals.decision_maker === false) score += 10;

    // Budget (0-20 points)
    if (signals.budget_mentioned) score += 20;

    // Timeline (0-15 points)
    if (signals.timeline === 'immediate') score += 15;
    else if (signals.timeline === 'short_term') score += 12;
    else if (signals.timeline === 'long_term') score += 8;
    else if (signals.timeline === 'exploring') score += 5;

    // Enthusiasm (0-15 points)
    if (signals.enthusiasm_level === 'high') score += 15;
    else if (signals.enthusiasm_level === 'medium') score += 10;
    else if (signals.enthusiasm_level === 'low') score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  private determineLeadTier(
    signals: QualificationSignals,
    score: number,
  ): 'solo_exploratory' | 'enterprise_agency' | 'undetermined' {
    // Enterprise/Agency indicators
    if (
      signals.company_size === 'enterprise' ||
      signals.company_size === 'medium' ||
      (signals.decision_maker && score >= 60)
    ) {
      return 'enterprise_agency';
    }

    // Solo/Exploratory indicators
    if (
      signals.company_size === 'solo' ||
      signals.timeline === 'exploring' ||
      score < 40
    ) {
      return 'solo_exploratory';
    }

    return 'undetermined';
  }

  private getRecommendedAction(
    leadTier: string,
    signals: QualificationSignals,
  ): 'free_trial' | 'live_demo' | 'undecided' {
    // High-value leads → Live Demo
    if (leadTier === 'enterprise_agency') {
      return 'live_demo';
    }

    // Solo/Exploratory → Free Trial
    if (leadTier === 'solo_exploratory') {
      return 'free_trial';
    }

    // Timeline-based decision
    if (signals.timeline === 'immediate' || signals.enthusiasm_level === 'high') {
      return 'live_demo';
    }

    return 'undecided';
  }

  private async updateQualification(
    conversationId: string,
    organizationId: string,
    signals: QualificationSignals,
    score: number,
    leadTier: string,
    recommendedAction: string,
  ) {
    // Find existing qualification
    const existing = await this.prisma.genie_qualification.findFirst({
      where: { conversation_id: conversationId },
    });

    const qualificationData = {
      qualification_score: score,
      lead_tier: leadTier as any,
      recommended_action: recommendedAction as any,
      company_size: signals.company_size,
      timeline: signals.timeline,
      decision_maker: signals.decision_maker,
      pain_points: signals.pain_points || [],
      objections_raised: signals.objections || [],
      signals_detected: signals as any,
      qualified_at: new Date(),
    };

    if (existing) {
      await this.prisma.genie_qualification.update({
        where: { id: existing.id },
        data: qualificationData,
      });
    } else {
      await this.prisma.genie_qualification.create({
        data: {
          ...qualificationData,
          conversation_id: conversationId,
          organization_id: organizationId,
        },
      });
    }
  }

  private getSystemPrompt(): string {
    return `You are Genie, LeadGenX's professional AI assistant with a warm, rose-gold metallic persona. Your role is to:

1. **Qualify Leads**: Identify if visitors are:
   - Solo/Exploratory: Individual users, small businesses, or early-stage exploration
   - Enterprise/Agency: Established companies, marketing agencies, or high-value prospects

2. **Understand Needs**: Ask intelligent questions to uncover:
   - Company size and industry
   - Current lead generation challenges
   - Budget and timeline
   - Decision-making authority

3. **Handle Objections**: Address concerns professionally:
   - Pricing questions → Emphasize ROI and value
   - Technical concerns → Highlight ease of use
   - Competition → Focus on unique features

4. **Guide to Action**:
   - Solo/Exploratory → Recommend Free Trial (quick win, low friction)
   - Enterprise/Agency → Recommend Live Demo (personalized, high-touch)

**Key Features to Highlight**:
- AI-powered lead discovery (Google Maps, Yelp, Reddit intent)
- Automated enrichment (emails, contact pages, decision-makers)
- Multi-channel outreach (email, LinkedIn, SMS)
- CRM integration and workflow automation
- ROI analytics and conversion tracking

**Tone**: Professional yet warm, confident but not pushy, helpful and consultative.
**Goal**: Qualify leads efficiently and route them to the right next step.

Always be concise (2-3 sentences max) and ask one clear question at a time.`;
  }

  private getWelcomeMessage(visitorName?: string): string {
    const greeting = visitorName ? `Hi ${visitorName}!` : 'Hello!';
    return `${greeting} I'm Genie, your AI assistant for LeadGenX. 🌟

I'm here to help you discover how LeadGenX can transform your lead generation with AI-powered automation. Whether you're exploring options or ready to scale, I can guide you to the perfect solution.

What brings you to LeadGenX today?`;
  }

  private getSuggestedQuestions(
    leadTier: string,
    signals: QualificationSignals,
  ): string[] {
    if (leadTier === 'enterprise_agency') {
      return [
        'Can I schedule a personalized demo?',
        'What integrations do you support?',
        'How does your enterprise pricing work?',
      ];
    }

    if (leadTier === 'solo_exploratory') {
      return [
        'Can I start a free trial?',
        'How much does it cost?',
        'How easy is it to set up?',
      ];
    }

    return [
      'What makes LeadGenX different?',
      'How does pricing work?',
      'Can I see a demo?',
    ];
  }
}
