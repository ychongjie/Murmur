// Service layer public API

// Agent components
export { callLlm, callLlmJson } from './agent/llm-client.js';
export type { LlmCallOptions, LlmCallResult } from './agent/llm-client.js';

export { runDirector } from './agent/director.js';
export type { DirectorResult } from './agent/director.js';

export { runCharacter } from './agent/character.js';
export type { CharacterResult } from './agent/character.js';

export {
  buildDirectorSystemPrompt,
  buildCharacterSystemPrompt,
  formatHistoryForDirector,
  formatHistoryForCharacter,
} from './agent/prompt-builder.js';

// World management
export { runTurn } from './world/turn-runner.js';
export type { TurnResult, TurnRunnerDeps } from './world/turn-runner.js';
