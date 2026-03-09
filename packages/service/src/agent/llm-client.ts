// DeepSeek API client wrapper with token tracking and structured logging
// Uses OpenAI-compatible SDK since DeepSeek exposes an OpenAI-compatible API

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import pino from 'pino';
import { loadEnv } from '@murmur/config';
import { LLM } from '@murmur/config';
import { ResultUtil as Result } from '@murmur/types';

const logger = pino({ name: 'llm-client' });

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const env = loadEnv();
  _client = new OpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    baseURL: `${env.DEEPSEEK_BASE_URL}/v1`,
  });
  return _client;
}

export interface LlmCallOptions {
  system: string;
  messages: ChatCompletionMessageParam[];
  temperature: number;
  maxTokens?: number;
  instanceId?: string;
  turn?: number;
  label?: string;
}

export interface LlmCallResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export async function callLlm(
  opts: LlmCallOptions,
): Promise<Result<LlmCallResult, Error>> {
  const client = getClient();
  const start = Date.now();

  const allMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: opts.system },
    ...opts.messages,
  ];

  let response: OpenAI.Chat.Completions.ChatCompletion;
  try {
    response = await client.chat.completions.create({
      model: LLM.model,
      messages: allMessages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens ?? LLM.maxTokens,
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    logger.error({
      event: 'llm_call_failed',
      label: opts.label,
      instanceId: opts.instanceId,
      turn: opts.turn,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    });
    return Result.err(
      err instanceof Error ? err : new Error(String(err)),
    );
  }

  const latencyMs = Date.now() - start;
  const content = response.choices[0]?.message?.content ?? '';
  const usage = response.usage;

  const result: LlmCallResult = {
    content,
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    latencyMs,
  };

  logger.info({
    event: 'llm_call_completed',
    label: opts.label,
    instanceId: opts.instanceId,
    turn: opts.turn,
    model: LLM.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs,
  });

  return Result.ok(result);
}

/**
 * Call LLM and parse the response as JSON using a zod schema.
 * Returns Result.err if the LLM call fails or the response doesn't parse.
 */
export async function callLlmJson<T>(
  opts: LlmCallOptions,
  schema: z.ZodType<T>,
): Promise<Result<{ data: T; usage: Omit<LlmCallResult, 'content'> }, Error>> {
  const llmResult = await callLlm(opts);
  if (!llmResult.ok) return llmResult;

  const parseResult = safeParseJson(llmResult.value.content, schema);
  if (!parseResult.ok) {
    logger.warn({
      event: 'llm_json_parse_failed',
      label: opts.label,
      instanceId: opts.instanceId,
      turn: opts.turn,
      rawContent: llmResult.value.content.slice(0, 500),
      error: parseResult.error.message,
    });
    return parseResult;
  }

  return Result.ok({
    data: parseResult.value,
    usage: {
      promptTokens: llmResult.value.promptTokens,
      completionTokens: llmResult.value.completionTokens,
      latencyMs: llmResult.value.latencyMs,
    },
  });
}

function safeParseJson<T>(
  raw: string,
  schema: z.ZodType<T>,
): Result<T, Error> {
  // Try to extract JSON from markdown code blocks if present
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return Result.err(new Error(`Invalid JSON: ${jsonStr.slice(0, 200)}`));
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return Result.err(
      new Error(`Schema validation failed: ${result.error.message}`),
    );
  }
  return Result.ok(result.data);
}

/** Reset client (for testing) */
export function _resetClient(): void {
  _client = null;
}
