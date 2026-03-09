import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { DirectorDecision } from '@murmur/types';

// Replicate the director decision schema for isolated testing
const directorDecisionSchema = z
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

describe('directorDecisionSchema', () => {
  it('parses character_turn decision', () => {
    const input = {
      type: 'character_turn',
      next_speaker: 'laozhang',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.type).toBe('character_turn');
    expect(result.nextSpeaker).toBe('laozhang');
  });

  it('parses narration decision', () => {
    const input = {
      type: 'narration',
      narration: '雨越下越大了。',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.type).toBe('narration');
    expect(result.narration).toBe('雨越下越大了。');
  });

  it('parses event decision', () => {
    const input = {
      type: 'event',
      event_description: '突然停电了！',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.type).toBe('event');
    expect(result.eventDescription).toBe('突然停电了！');
  });

  it('parses ending decision', () => {
    const input = {
      type: 'ending',
      ending_summary: '真相大白，凶手被揭露。',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.type).toBe('ending');
    expect(result.endingSummary).toBe('真相大白，凶手被揭露。');
  });

  it('rejects invalid type', () => {
    const input = { type: 'invalid_type' };
    expect(() => directorDecisionSchema.parse(input)).toThrow();
  });

  it('handles extra fields gracefully', () => {
    const input = {
      type: 'character_turn',
      next_speaker: 'ali',
      extra_field: 'ignored',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.type).toBe('character_turn');
    expect(result.nextSpeaker).toBe('ali');
  });

  it('transforms snake_case to camelCase', () => {
    const input = {
      type: 'event',
      event_description: '有人敲门',
      next_speaker: 'nobody',
    };
    const result = directorDecisionSchema.parse(input);
    expect(result.eventDescription).toBe('有人敲门');
    expect(result.nextSpeaker).toBe('nobody');
    // Verify snake_case keys are not on the result
    expect('event_description' in result).toBe(false);
    expect('next_speaker' in result).toBe(false);
  });
});
