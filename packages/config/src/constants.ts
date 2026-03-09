/** Turn interval per speed setting (ms) */
export const TURN_INTERVALS = {
  slow: 15_000,
  normal: 8_000,
  fast: 3_000,
} as const;

/** WebSocket heartbeat settings */
export const HEARTBEAT = {
  /** Client sends heartbeat every N ms */
  intervalMs: 30_000,
  /** Server considers client dead after N ms without heartbeat */
  timeoutMs: 60_000,
} as const;

/** History context window for LLM calls */
export const HISTORY_CONTEXT_LIMIT = 50;

/** Default max turns for a world instance */
export const DEFAULT_MAX_TURNS = 80;

/** LLM model configuration */
export const LLM = {
  model: 'deepseek-chat',
  directorTemperature: 0.9,
  characterTemperature: 0.95,
  maxTokens: 1024,
} as const;

/** How many recent messages to load when observer joins */
export const OBSERVER_HISTORY_LOAD = 20;
