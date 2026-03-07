// Observer system types
// Full definitions in Phase 1

export type SpeedSetting = 'slow' | 'normal' | 'fast';

export const SPEED_INTERVALS: Record<SpeedSetting, number> = {
  slow: 15_000,
  normal: 8_000,
  fast: 3_000,
};

export interface ObserverSession {
  connectionId: string;
  instanceId: string;
  speed: SpeedSetting;
  connectedAt: Date;
  lastHeartbeat: Date;
}
