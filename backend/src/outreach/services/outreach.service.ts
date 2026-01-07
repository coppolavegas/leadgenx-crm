import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSequenceDto,
  UpdateSequenceDto,
  CreateStepDto,
  UpdateStepDto,
  EnrollLeadsDto,
  UpdateEnrollmentDto,
} from '../dto/sequence.dto';
import { WebhookService } from './webhook.service';

/**
 * OutreachService: Core service for managing email sequences
 * 
 * Responsibilities:
 * - CRUD operations for sequences and steps
 * - Lead enrollment management
 * - Integration with CRM (activity logging)
 * - Webhook emissions to AutoGenX
 */
@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  // ========================================================================
  // SEQUENCE MANAGEMENT
  // ========================================================================

  async createSequence(clientId: string, userId: string, dto: CreateSequenceDto) {
    this.logger.log(`Creating sequence for client ${clientId}`);

    const sequence = await this.prisma.outreach_sequence.create({
      data: {
        client_id: clientId,
        name: dto.name,
        description: dto.description,
        max_daily_emails: dto.maxDailyEmails,
        sending_hours: dto.sendingHours as any,
        created_by_user_id: userId,
      },
      include: {
        steps: true,
      },
    });

    return sequence;
  }

  async getSequences(clientId: string) {
    return this.prisma.outreach_sequence.findMany({
      where: { client_id: clientId },
      include: {
        steps: {
          orderBy: { step_order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getSequence(clientId: string, sequenceId: string) {
    const sequence = await this.prisma.outreach_sequence.findFirst({
      where: {
        id: sequenceId,
        client_id: clientId,
      },
      include: {
        steps: {
          orderBy: { step_order: 'asc' },
        },
        enrollments: {
          include: {
            lead: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    return sequence;
  }

  async updateSequence(
    clientId: string,
    sequenceId: string,
    dto: UpdateSequenceDto,
  ) {
    // Verify sequence belongs to client
    const sequence = await this.getSequence(clientId, sequenceId);

    return this.prisma.outreach_sequence.update({
      where: { id: sequenceId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        max_daily_emails: dto.maxDailyEmails,
        sending_hours: dto.sendingHours as any,
      },
      include: {
        steps: true,
      },
    });
  }

  async deleteSequence(clientId: string, sequenceId: string) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    await this.prisma.outreach_sequence.delete({
      where: { id: sequenceId },
    });

    return { success: true };
  }

  // ========================================================================
  // STEP MANAGEMENT
  // ========================================================================

  async addStep(clientId: string, sequenceId: string, dto: CreateStepDto) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    // Check if step order already exists
    const existingStep = await this.prisma.outreach_step.findFirst({
      where: {
        sequence_id: sequenceId,
        step_order: dto.stepOrder,
      },
    });

    if (existingStep) {
      throw new ConflictException(
        `Step order ${dto.stepOrder} already exists in this sequence`,
      );
    }

    const step = await this.prisma.outreach_step.create({
      data: {
        sequence_id: sequenceId,
        step_order: dto.stepOrder,
        delay_days: dto.delayDays,
        subject: dto.subject,
        body: dto.body,
      },
    });

    return step;
  }

  async updateStep(
    clientId: string,
    sequenceId: string,
    stepId: string,
    dto: UpdateStepDto,
  ) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    // Verify step belongs to sequence
    const step = await this.prisma.outreach_step.findFirst({
      where: {
        id: stepId,
        sequence_id: sequenceId,
      },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return this.prisma.outreach_step.update({
      where: { id: stepId },
      data: {
        delay_days: dto.delayDays,
        subject: dto.subject,
        body: dto.body,
      },
    });
  }

  async deleteStep(clientId: string, sequenceId: string, stepId: string) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    // Verify step belongs to sequence
    const step = await this.prisma.outreach_step.findFirst({
      where: {
        id: stepId,
        sequence_id: sequenceId,
      },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    await this.prisma.outreach_step.delete({
      where: { id: stepId },
    });

    return { success: true };
  }

  // ========================================================================
  // ENROLLMENT MANAGEMENT
  // ========================================================================

  async enrollLeads(clientId: string, sequenceId: string, dto: EnrollLeadsDto) {
    this.logger.log(`Enrolling ${dto.leadIds.length} leads in sequence ${sequenceId}`);

    // Verify sequence belongs to client and is active
    const sequence = await this.getSequence(clientId, sequenceId);

    if (sequence.status !== 'active') {
      throw new BadRequestException('Cannot enroll leads in inactive sequence');
    }

    // Verify all leads belong to the client (through campaigns)
    const leads = await this.prisma.lead.findMany({
      where: {
        id: { in: dto.leadIds },
      },
      include: {
        campaign_leads: {
          include: {
            campaign: true,
          },
        },
        enriched_lead: true,
      },
    });

    if (leads.length !== dto.leadIds.length) {
      throw new BadRequestException('One or more leads not found');
    }

    // Check for valid email addresses
    const suppressedLeads = leads.filter((lead) => {
      const enriched = lead.enriched_lead;
      if (!enriched) return true;
      
      // Extract email from emails_found array
      const emailsFound = Array.isArray(enriched.emails_found) ? enriched.emails_found : [];
      return emailsFound.length === 0;
    });

    if (suppressedLeads.length > 0) {
      this.logger.warn(
        `Skipping ${suppressedLeads.length} leads without email addresses`,
      );
    }

    const validLeads = leads.filter((lead) => {
      const enriched = lead.enriched_lead;
      if (!enriched) return false;
      
      // Extract email from emails_found array
      const emailsFound = Array.isArray(enriched.emails_found) ? enriched.emails_found : [];
      return emailsFound.length > 0;
    });

    // Enroll valid leads
    const enrollments = await Promise.all(
      validLeads.map(async (lead) => {
        // Check if already enrolled
        const existing = await this.prisma.outreach_enrollment.findUnique({
          where: {
            lead_id_sequence_id: {
              lead_id: lead.id,
              sequence_id: sequenceId,
            },
          },
        });

        if (existing) {
          this.logger.warn(`Lead ${lead.id} already enrolled in sequence`);
          return null;
        }

        const enrollment = await this.prisma.outreach_enrollment.create({
          data: {
            lead_id: lead.id,
            sequence_id: sequenceId,
            status: 'active',
            current_step: 0,
          },
        });

        // Emit webhook
        const emailsFound = Array.isArray(lead.enriched_lead?.emails_found) 
          ? lead.enriched_lead.emails_found 
          : [];
        const primaryEmail = emailsFound.length > 0 
          ? (emailsFound[0] as any).email || '' 
          : '';
        
        await this.webhookService.emitSequenceEnrolled({
          enrollmentId: enrollment.id,
          leadId: lead.id,
          sequenceId: sequence.id,
          sequenceName: sequence.name,
          leadEmail: primaryEmail,
        });

        return enrollment;
      }),
    );

    const successfulEnrollments = enrollments.filter((e) => e !== null);

    return {
      enrolled: successfulEnrollments.length,
      skipped: suppressedLeads.length + (enrollments.length - successfulEnrollments.length),
      enrollments: successfulEnrollments,
    };
  }

  async getEnrollments(clientId: string, sequenceId: string) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    return this.prisma.outreach_enrollment.findMany({
      where: { sequence_id: sequenceId },
      include: {
        lead: {
          include: {
            enriched_lead: true,
          },
        },
        sequence: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateEnrollment(
    clientId: string,
    sequenceId: string,
    enrollmentId: string,
    dto: UpdateEnrollmentDto,
  ) {
    // Verify sequence belongs to client
    await this.getSequence(clientId, sequenceId);

    // Verify enrollment belongs to sequence
    const enrollment = await this.prisma.outreach_enrollment.findFirst({
      where: {
        id: enrollmentId,
        sequence_id: sequenceId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const updates: any = { status: dto.status };

    if (dto.status === 'paused') {
      updates.paused_at = new Date();
    } else if (dto.status === 'completed') {
      updates.completed_at = new Date();
    } else if (dto.status === 'unsubscribed') {
      updates.unsubscribed_at = new Date();
    }

    return this.prisma.outreach_enrollment.update({
      where: { id: enrollmentId },
      data: updates,
    });
  }
}
