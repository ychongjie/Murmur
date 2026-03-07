// World Template & Instance types
// Full definitions in Phase 1

export interface WorldTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverEmoji: string;
  setting: WorldSetting;
  characters: CharacterTemplate[];
  director: DirectorConfig;
  maxTurns: number;
}

export interface WorldSetting {
  background: string;
  tone: string;
  era: string;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  role: string;
  personality: string;
  secret: string;
  relationships: Record<string, string>;
  speechStyle: string;
}

export interface DirectorConfig {
  pacing: string;
  eventTriggers: EventTrigger[];
  endingConditions: string[];
}

export interface EventTrigger {
  condition: string;
  action: string;
}

export type WorldStatus = 'frozen' | 'running' | 'ended';

export interface WorldInstance {
  id: string;
  templateId: string;
  status: WorldStatus;
  currentTurn: number;
  observerCount: number;
  worldState: Record<string, unknown> | null;
  createdAt: Date;
  endedAt: Date | null;
}
