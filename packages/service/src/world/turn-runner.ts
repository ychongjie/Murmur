// Turn progression engine — orchestrates a single world turn

import pino from 'pino';
import type {
  WorldTemplate,
  WorldEvent,
  WorldEventType,
  DirectorDecision,
  Result as ResultType,
} from '@murmur/types';
import { ResultUtil as Result } from '@murmur/types';
import type { EventRepo, InstanceRepo } from '@murmur/db';
import { runDirector } from '../agent/director.js';
import { runCharacter } from '../agent/character.js';

const logger = pino({ name: 'turn-runner' });

export interface TurnResult {
  event: {
    instanceId: string;
    turn: number;
    eventType: WorldEventType;
    characterId: string | null;
    content: string;
    metadata: Record<string, unknown> | null;
  };
  ended: boolean;
  eventId: number;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export interface TurnRunnerDeps {
  eventRepo: EventRepo;
  instanceRepo: InstanceRepo;
}

/** Run a single turn for a world instance */
export async function runTurn(
  instanceId: string,
  template: WorldTemplate,
  currentTurn: number,
  deps: TurnRunnerDeps,
): Promise<ResultType<TurnResult, Error>> {
  logger.info({
    event: 'turn_start',
    instanceId,
    turn: currentTurn,
  });

  // 1. Load recent history
  const recentEvents = await deps.eventRepo.findRecent(instanceId, 50);
  const history: WorldEvent[] = recentEvents
    .reverse()
    .map(mapDbEventToWorldEvent);

  // 2. Director decides what happens
  const directorResult = await runDirector(
    template,
    history,
    currentTurn,
    instanceId,
  );
  if (!directorResult.ok) return directorResult;

  const { decision } = directorResult.value;
  let totalPrompt = directorResult.value.promptTokens;
  let totalCompletion = directorResult.value.completionTokens;
  let totalLatency = directorResult.value.latencyMs;

  // 3. Execute based on decision type
  const execResult = await executeDecision(
    decision,
    instanceId,
    currentTurn,
    template,
    history,
  );
  if (!execResult.ok) return execResult;

  const { turnEvent, ended } = execResult.value;
  totalPrompt += execResult.value.extraPromptTokens;
  totalCompletion += execResult.value.extraCompletionTokens;
  totalLatency += execResult.value.extraLatencyMs;

  // 4. Persist to database
  const savedEvent = await deps.eventRepo.create(turnEvent);
  await deps.instanceRepo.incrementTurn(instanceId);
  if (ended) {
    await deps.instanceRepo.updateStatus(instanceId, 'ended');
  }

  logger.info({
    event: 'turn_completed',
    instanceId,
    turn: currentTurn,
    decisionType: decision.type,
    speaker: decision.nextSpeaker,
    ended,
    promptTokens: totalPrompt,
    completionTokens: totalCompletion,
    latencyMs: totalLatency,
  });

  return Result.ok({
    event: turnEvent,
    eventId: savedEvent.id,
    ended,
    promptTokens: totalPrompt,
    completionTokens: totalCompletion,
    latencyMs: totalLatency,
  });
}

interface ExecResult {
  turnEvent: TurnResult['event'];
  ended: boolean;
  extraPromptTokens: number;
  extraCompletionTokens: number;
  extraLatencyMs: number;
}

async function executeDecision(
  decision: DirectorDecision,
  instanceId: string,
  currentTurn: number,
  template: WorldTemplate,
  history: WorldEvent[],
): Promise<ResultType<ExecResult, Error>> {
  const base = { extraPromptTokens: 0, extraCompletionTokens: 0, extraLatencyMs: 0 };

  switch (decision.type) {
    case 'narration':
      return Result.ok({
        ...base,
        turnEvent: mkEvent(instanceId, currentTurn, 'narration', null, decision.narration ?? ''),
        ended: false,
      });

    case 'character_turn': {
      if (!decision.nextSpeaker) {
        return Result.err(new Error('character_turn decision missing nextSpeaker'));
      }
      const charResult = await runCharacter(
        decision.nextSpeaker,
        template,
        history,
        currentTurn,
        instanceId,
      );
      if (!charResult.ok) return charResult;

      const { message } = charResult.value;
      return Result.ok({
        turnEvent: mkEvent(
          instanceId, currentTurn, 'dialogue', message.characterId, message.content,
          message.innerThought ? { innerThought: message.innerThought } : null,
        ),
        ended: false,
        extraPromptTokens: charResult.value.promptTokens,
        extraCompletionTokens: charResult.value.completionTokens,
        extraLatencyMs: charResult.value.latencyMs,
      });
    }

    case 'event':
      return Result.ok({
        ...base,
        turnEvent: mkEvent(instanceId, currentTurn, 'event', null, decision.eventDescription ?? ''),
        ended: false,
      });

    case 'ending':
      return Result.ok({
        ...base,
        turnEvent: mkEvent(instanceId, currentTurn, 'ending', null, decision.endingSummary ?? ''),
        ended: true,
      });
  }
}

function mkEvent(
  instanceId: string,
  turn: number,
  eventType: WorldEventType,
  characterId: string | null,
  content: string,
  metadata: Record<string, unknown> | null = null,
): TurnResult['event'] {
  return { instanceId, turn, eventType, characterId, content, metadata };
}

/** Map a database row to a WorldEvent */
function mapDbEventToWorldEvent(row: {
  id: number;
  instanceId: string;
  turn: number;
  eventType: string;
  characterId: string | null;
  content: string;
  metadata: unknown;
  createdAt: Date;
}): WorldEvent {
  return {
    id: row.id,
    instanceId: row.instanceId,
    turn: row.turn,
    eventType: row.eventType as WorldEventType,
    characterId: row.characterId,
    content: row.content,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.createdAt,
  };
}
