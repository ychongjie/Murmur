// Director Agent — decides what happens next in the world

import { z } from 'zod';
import pino from 'pino';
import type {
  WorldTemplate,
  WorldEvent,
  DirectorDecision,
  Result as ResultType,
} from '@murmur/types';
import { ResultUtil as Result } from '@murmur/types';
import { LLM, HISTORY_CONTEXT_LIMIT } from '@murmur/config';
import { callLlmJson } from './llm-client.js';
import {
  buildDirectorSystemPrompt,
  formatHistoryForDirector,
} from './prompt-builder.js';

const logger = pino({ name: 'director-agent' });

/** Zod schema for parsing the director's JSON output */
export const directorDecisionSchema = z
  .object({
    type: z.enum(['narration', 'character_turn', 'event', 'ending']),
    next_speaker: z.string().optional(),
    narration: z.string().optional(),
    event_description: z.string().optional(),
    ending_summary: z.string().optional(),
  })
  .transform(
    (raw): DirectorDecision => ({
      type: raw.type,
      nextSpeaker: raw.next_speaker,
      narration: raw.narration,
      eventDescription: raw.event_description,
      endingSummary: raw.ending_summary,
    }),
  );

export interface DirectorResult {
  decision: DirectorDecision;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

/** Ask the Director to decide the next action for the world */
export async function runDirector(
  template: WorldTemplate,
  history: WorldEvent[],
  currentTurn: number,
  instanceId: string,
): Promise<ResultType<DirectorResult, Error>> {
  // Check max turns — force ending
  if (currentTurn >= template.maxTurns) {
    logger.info({
      event: 'director_max_turns_reached',
      instanceId,
      currentTurn,
      maxTurns: template.maxTurns,
    });
    return Result.ok({
      decision: {
        type: 'ending',
        endingSummary: `世界达到了最大回合数（${template.maxTurns}回合），故事在此落幕。`,
      },
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
    });
  }

  const recentHistory = history.slice(-HISTORY_CONTEXT_LIMIT);
  const systemPrompt = buildDirectorSystemPrompt(template, currentTurn);
  const messages = formatHistoryForDirector(recentHistory, template);

  // On first turn with no history, add a kickoff message
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content:
        '世界刚刚开始，这是第一回合。请决定如何开场。输出 JSON。',
    });
  }

  const llmResult = await callLlmJson(
    {
      system: systemPrompt,
      messages,
      temperature: LLM.directorTemperature,
      instanceId,
      turn: currentTurn,
      label: 'director',
    },
    directorDecisionSchema,
  );

  if (!llmResult.ok) return llmResult;

  const decision = llmResult.value.data;
  const validationError = validateDecision(decision, template);
  if (validationError) {
    logger.warn({
      event: 'director_decision_invalid',
      instanceId,
      turn: currentTurn,
      decision,
      error: validationError,
    });
    return Result.err(new Error(validationError));
  }

  logger.info({
    event: 'director_decision',
    instanceId,
    turn: currentTurn,
    decisionType: decision.type,
    nextSpeaker: decision.nextSpeaker,
  });

  return Result.ok({
    decision,
    promptTokens: llmResult.value.usage.promptTokens,
    completionTokens: llmResult.value.usage.completionTokens,
    latencyMs: llmResult.value.usage.latencyMs,
  });
}

function validateDecision(
  decision: DirectorDecision,
  template: WorldTemplate,
): string | null {
  if (decision.type === 'character_turn') {
    if (!decision.nextSpeaker) {
      return 'character_turn 类型必须包含 next_speaker';
    }
    const validIds = template.characters.map((c) => c.id);
    if (!validIds.includes(decision.nextSpeaker)) {
      return `next_speaker "${decision.nextSpeaker}" 不是有效的角色 id。有效值: ${validIds.join(', ')}`;
    }
  }
  if (decision.type === 'narration' && !decision.narration) {
    return 'narration 类型必须包含 narration 内容';
  }
  if (decision.type === 'event' && !decision.eventDescription) {
    return 'event 类型必须包含 event_description';
  }
  if (decision.type === 'ending' && !decision.endingSummary) {
    return 'ending 类型必须包含 ending_summary';
  }
  return null;
}
