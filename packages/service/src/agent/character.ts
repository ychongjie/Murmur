// Character Agent — generates dialogue for a specific character

import pino from 'pino';
import type {
  WorldTemplate,
  WorldEvent,
  CharacterMessage,
  Result as ResultType,
} from '@murmur/types';
import { ResultUtil as Result } from '@murmur/types';
import { LLM, HISTORY_CONTEXT_LIMIT } from '@murmur/config';
import { callLlm } from './llm-client.js';
import {
  buildCharacterSystemPrompt,
  formatHistoryForCharacter,
} from './prompt-builder.js';

const logger = pino({ name: 'character-agent' });

export interface CharacterResult {
  message: CharacterMessage;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

/** Ask a Character agent to generate their dialogue response */
export async function runCharacter(
  characterId: string,
  template: WorldTemplate,
  history: WorldEvent[],
  currentTurn: number,
  instanceId: string,
): Promise<ResultType<CharacterResult, Error>> {
  const character = template.characters.find((c) => c.id === characterId);
  if (!character) {
    return Result.err(
      new Error(`Character "${characterId}" not found in template`),
    );
  }

  const recentHistory = history.slice(-HISTORY_CONTEXT_LIMIT);
  const systemPrompt = buildCharacterSystemPrompt(character, template);
  const messages = formatHistoryForCharacter(
    recentHistory,
    characterId,
    template,
  );

  const llmResult = await callLlm({
    system: systemPrompt,
    messages,
    temperature: LLM.characterTemperature,
    maxTokens: 512,
    instanceId,
    turn: currentTurn,
    label: `character:${characterId}`,
  });

  if (!llmResult.ok) return llmResult;

  const parsed = parseCharacterOutput(
    characterId,
    llmResult.value.content,
  );

  logger.info({
    event: 'character_response',
    instanceId,
    turn: currentTurn,
    characterId,
    characterName: character.name,
    contentLength: parsed.content.length,
    hasInnerThought: !!parsed.innerThought,
  });

  return Result.ok({
    message: parsed,
    promptTokens: llmResult.value.promptTokens,
    completionTokens: llmResult.value.completionTokens,
    latencyMs: llmResult.value.latencyMs,
  });
}

/** Parse character output, extracting inner thoughts in parentheses */
export function parseCharacterOutput(
  characterId: string,
  raw: string,
): CharacterMessage {
  const trimmed = raw.trim();

  // Extract inner thoughts: lines wrapped in （）or ()
  const thoughtPattern = /[（(](.+?)[）)]/g;
  const thoughts: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = thoughtPattern.exec(trimmed)) !== null) {
    thoughts.push(match[1]!);
  }

  // Remove inner thoughts from the dialogue content
  const content = trimmed
    .replace(/[（(].+?[）)]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  return {
    characterId,
    content: content || trimmed,
    innerThought: thoughts.length > 0 ? thoughts.join('；') : undefined,
  };
}
