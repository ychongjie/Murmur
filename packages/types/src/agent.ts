// Agent system types
// Full definitions in Phase 1

export type DirectorDecisionType =
  | 'narration'
  | 'character_turn'
  | 'event'
  | 'ending';

export interface DirectorDecision {
  type: DirectorDecisionType;
  nextSpeaker?: string;
  narration?: string;
  eventDescription?: string;
  endingSummary?: string;
}

export interface CharacterMessage {
  characterId: string;
  content: string;
  innerThought?: string;
}
