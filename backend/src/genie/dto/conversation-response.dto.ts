export class ConversationResponseDto {
  conversation_id: string;
  message: string;
  qualification_score: number;
  lead_tier: 'solo_exploratory' | 'enterprise_agency' | 'undetermined';
  recommended_action: 'free_trial' | 'live_demo' | 'undecided';
  suggested_questions?: string[];
  signals_detected?: Record<string, any>;
}
