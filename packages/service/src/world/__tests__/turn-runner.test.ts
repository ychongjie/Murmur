import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorldTemplate } from '@murmur/types';
import type { TurnRunnerDeps } from '../turn-runner.js';

// Mock the agent modules before importing turn-runner
vi.mock('../../agent/director.js');
vi.mock('../../agent/character.js');

// Import after mocks are set up
const { runDirector } = await import('../../agent/director.js');
const { runCharacter } = await import('../../agent/character.js');
const { runTurn } = await import('../turn-runner.js');

const mockRunDirector = vi.mocked(runDirector);
const mockRunCharacter = vi.mocked(runCharacter);

const template: WorldTemplate = {
  id: 'test-world',
  name: '测试世界',
  genre: '测试',
  description: '测试描述',
  coverEmoji: '🧪',
  setting: { background: '背景', tone: '轻松', era: '当代' },
  characters: [
    {
      id: 'alice',
      name: '爱丽丝',
      role: '调查员',
      personality: '冷静',
      secret: '卧底',
      relationships: { bob: '怀疑' },
      speechStyle: '简洁',
    },
    {
      id: 'bob',
      name: '鲍勃',
      role: '商人',
      personality: '圆滑',
      secret: '走私',
      relationships: { alice: '警惕' },
      speechStyle: '客气',
    },
  ],
  director: {
    pacing: '慢慢来',
    eventTriggers: [{ condition: '停滞', action: '注入事件' }],
    endingConditions: ['真相大白'],
  },
  maxTurns: 40,
};

function makeMockDeps(): TurnRunnerDeps {
  return {
    eventRepo: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      findRecent: vi.fn().mockResolvedValue([]),
      findByInstanceId: vi.fn().mockResolvedValue([]),
      countByInstanceId: vi.fn().mockResolvedValue(0),
    } as unknown as TurnRunnerDeps['eventRepo'],
    instanceRepo: {
      incrementTurn: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(null),
      findByTemplateId: vi.fn().mockResolvedValue([]),
      updateObserverCount: vi.fn().mockResolvedValue(null),
      updateWorldState: vi.fn().mockResolvedValue(null),
    } as unknown as TurnRunnerDeps['instanceRepo'],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runTurn', () => {
  it('handles narration decision', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'narration', narration: '夜幕降临。' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 1, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.eventType).toBe('narration');
    expect(result.value.event.content).toBe('夜幕降临。');
    expect(result.value.ended).toBe(false);
    expect(result.value.promptTokens).toBe(100);
    expect(deps.eventRepo.create).toHaveBeenCalledOnce();
    expect(deps.instanceRepo.incrementTurn).toHaveBeenCalledOnce();
    expect(deps.instanceRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('handles character_turn decision', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'character_turn', nextSpeaker: 'alice' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });
    mockRunCharacter.mockResolvedValue({
      ok: true,
      value: {
        message: { characterId: 'alice', content: '有人在吗？' },
        promptTokens: 80,
        completionTokens: 15,
        latencyMs: 300,
      },
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 2, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.eventType).toBe('dialogue');
    expect(result.value.event.characterId).toBe('alice');
    expect(result.value.event.content).toBe('有人在吗？');
    // Token counts are summed: director + character
    expect(result.value.promptTokens).toBe(180);
    expect(result.value.completionTokens).toBe(35);
    expect(result.value.latencyMs).toBe(800);
  });

  it('handles event decision', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'event', eventDescription: '突然停电了！' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 5, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.eventType).toBe('event');
    expect(result.value.event.content).toBe('突然停电了！');
    expect(result.value.ended).toBe(false);
  });

  it('handles ending decision and updates instance status', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'ending', endingSummary: '真相大白。' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 39, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.eventType).toBe('ending');
    expect(result.value.ended).toBe(true);
    expect(deps.instanceRepo.updateStatus).toHaveBeenCalledWith(
      'inst-1',
      'ended',
    );
  });

  it('propagates director error', async () => {
    mockRunDirector.mockResolvedValue({
      ok: false,
      error: new Error('LLM call failed'),
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 1, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe('LLM call failed');
    expect(deps.eventRepo.create).not.toHaveBeenCalled();
  });

  it('propagates character error', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'character_turn', nextSpeaker: 'alice' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });
    mockRunCharacter.mockResolvedValue({
      ok: false,
      error: new Error('Character failed'),
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 2, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe('Character failed');
    expect(deps.eventRepo.create).not.toHaveBeenCalled();
  });

  it('stores inner thoughts in metadata', async () => {
    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'character_turn', nextSpeaker: 'bob' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });
    mockRunCharacter.mockResolvedValue({
      ok: true,
      value: {
        message: {
          characterId: 'bob',
          content: '没什么。',
          innerThought: '他在试探我',
        },
        promptTokens: 80,
        completionTokens: 15,
        latencyMs: 300,
      },
    });

    const deps = makeMockDeps();
    const result = await runTurn('inst-1', template, 3, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.metadata).toEqual({
      innerThought: '他在试探我',
    });
  });

  it('loads recent events from repo in correct order', async () => {
    const mockEvents = [
      {
        id: 2,
        instanceId: 'inst-1',
        turn: 2,
        eventType: 'dialogue',
        characterId: 'alice',
        content: '你好',
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: 1,
        instanceId: 'inst-1',
        turn: 1,
        eventType: 'narration',
        characterId: null,
        content: '开场',
        metadata: null,
        createdAt: new Date(),
      },
    ];

    mockRunDirector.mockResolvedValue({
      ok: true,
      value: {
        decision: { type: 'narration', narration: '继续。' },
        promptTokens: 100,
        completionTokens: 20,
        latencyMs: 500,
      },
    });

    const deps = makeMockDeps();
    (deps.eventRepo.findRecent as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockEvents,
    );
    await runTurn('inst-1', template, 3, deps);

    // Verify director received history in chronological order (reversed from desc)
    const directorCall = mockRunDirector.mock.calls[0]!;
    const history = directorCall[1]; // second arg is history
    expect(history[0]!.turn).toBe(1);
    expect(history[1]!.turn).toBe(2);
  });
});
