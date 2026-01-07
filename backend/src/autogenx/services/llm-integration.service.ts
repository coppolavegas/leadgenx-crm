import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * LLM Integration Service
 * Wrapper for OpenAI-compatible API calls
 * Uses ABACUSAI_API_KEY from environment
 */
@Injectable()
export class LlmIntegrationService {
  private readonly logger = new Logger(LlmIntegrationService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ABACUSAI_API_KEY') || '';
    this.apiUrl = this.configService.get<string>('LLM_API_URL') || 'https://routellm.abacus.ai/v1';
    this.model = this.configService.get<string>('LLM_MODEL') || 'gpt-4o-mini';

    if (!this.apiKey) {
      this.logger.warn('ABACUSAI_API_KEY not configured - LLM features will not work');
    }
  }

  /**
   * Call LLM with system prompt and user prompt
   */
  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'json_object' | 'text';
    },
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('LLM API key not configured');
    }

    const temperature = options?.temperature ?? 0.3;
    const maxTokens = options?.maxTokens ?? 2000;
    const responseFormat = options?.responseFormat ?? 'json_object';

    try {
      const payload: any = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      };

      // Add response_format only if json_object
      if (responseFormat === 'json_object') {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`LLM API error: ${response.status} - ${errorText}`);
        throw new Error(`LLM API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      this.logger.debug(`LLM generated ${content.length} characters`);
      return content;
    } catch (error) {
      this.logger.error(`LLM generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if LLM is configured and available
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
