import { describe, it, expect } from 'vitest';
import type { WorldTemplate, WorldEvent } from '@murmur/types';
import {
  buildDirectorSystemPrompt,
  buildCharacterSystemPrompt,
  formatHistoryForDirector,
  formatHistoryForCharacter,
} from '../prompt-builder.js';

const template: WorldTemplate = {
  id: 'test-world',
  name: '测试世界',
  genre: '测试',
  description: '测试世界描述',
  coverEmoji: '🧪',
  setting: {
    background: '这是一个测试背景。',
    tone: '轻松',
    era: '当代',
  },
  characters: [
    {
      id: 'alice',
      name: '爱丽丝',
      role: '调查员',
      personality: '冷静、观察力强',
      secret: '她是卧底',
      relationships: { bob: '怀疑对方' },
      speechStyle: '简洁有力',
    },
    {
      id: 'bob',
      name: '鲍勃',
      role: '商人',
      personality: '圆滑、善于交际',
      secret: '他在走私',
      relationships: { alice: '好奇但警惕' },
      speechStyle: '客气中带着算计',
    },
  ],
  director: {
    pacing: '前 10 回合试探，10-20 回合冲突升级',
    eventTriggers: [
      { condition: '对话停滞', action: '注入突发事件' },
    ],
    endingConditions: ['真相大白', '达到最大回合'],
  },
  maxTurns: 40,
};

describe('buildDirectorSystemPrompt', () => {
  it('includes world setting and character info', () => {
    const prompt = buildDirectorSystemPrompt(template, 5);
    expect(prompt).toContain('这是一个测试背景');
    expect(prompt).toContain('爱丽丝');
    expect(prompt).toContain('鲍勃');
    expect(prompt).toContain('她是卧底');
    expect(prompt).toContain('他在走私');
  });

  it('includes current turn progress', () => {
    const prompt = buildDirectorSystemPrompt(template, 25);
    expect(prompt).toContain('第 25 / 40 回合');
  });

  it('includes pacing and ending conditions', () => {
    const prompt = buildDirectorSystemPrompt(template, 1);
    expect(prompt).toContain('前 10 回合试探');
    expect(prompt).toContain('真相大白');
  });

  it('includes output format instructions', () => {
    const prompt = buildDirectorSystemPrompt(template, 1);
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('character_turn');
    expect(prompt).toContain('narration');
  });
});

describe('buildCharacterSystemPrompt', () => {
  it('includes character personality and secret', () => {
    const prompt = buildCharacterSystemPrompt(
      template.characters[0]!,
      template,
    );
    expect(prompt).toContain('爱丽丝');
    expect(prompt).toContain('调查员');
    expect(prompt).toContain('冷静、观察力强');
    expect(prompt).toContain('她是卧底');
  });

  it('resolves relationship names from template', () => {
    const prompt = buildCharacterSystemPrompt(
      template.characters[0]!,
      template,
    );
    expect(prompt).toContain('鲍勃');
    expect(prompt).toContain('怀疑对方');
  });

  it('includes speech style and rules', () => {
    const prompt = buildCharacterSystemPrompt(
      template.characters[0]!,
      template,
    );
    expect(prompt).toContain('简洁有力');
    expect(prompt).toContain('1-3 句');
    expect(prompt).toContain('不要打破第四面墙');
  });
});

describe('formatHistoryForDirector', () => {
  const events: WorldEvent[] = [
    {
      id: 1,
      instanceId: 'inst-1',
      turn: 1,
      eventType: 'narration',
      characterId: null,
      content: '夜幕降临',
      metadata: null,
      createdAt: new Date(),
    },
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
  ];

  it('formats events as messages', () => {
    const msgs = formatHistoryForDirector(events, template);
    expect(msgs.length).toBe(3); // 2 events + 1 prompt
    expect(msgs[0]!.content).toContain('旁白');
    expect(msgs[0]!.content).toContain('夜幕降临');
    expect(msgs[1]!.content).toContain('爱丽丝');
  });

  it('appends decision prompt at the end', () => {
    const msgs = formatHistoryForDirector(events, template);
    const last = msgs[msgs.length - 1]!;
    expect(last.content).toContain('请决定下一步');
  });

  it('returns empty array for no events', () => {
    const msgs = formatHistoryForDirector([], template);
    expect(msgs).toHaveLength(0);
  });
});

describe('formatHistoryForCharacter', () => {
  const events: WorldEvent[] = [
    {
      id: 1,
      instanceId: 'inst-1',
      turn: 1,
      eventType: 'narration',
      characterId: null,
      content: '夜幕降临',
      metadata: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      instanceId: 'inst-1',
      turn: 2,
      eventType: 'dialogue',
      characterId: 'alice',
      content: '有人在吗？',
      metadata: null,
      createdAt: new Date(),
    },
    {
      id: 3,
      instanceId: 'inst-1',
      turn: 3,
      eventType: 'dialogue',
      characterId: 'bob',
      content: '我在这里',
      metadata: null,
      createdAt: new Date(),
    },
  ];

  it('marks own dialogue as assistant role', () => {
    const msgs = formatHistoryForCharacter(
      events,
      'alice',
      template,
    );
    // narration(user) + alice dialogue(assistant) + bob dialogue(user) + prompt(user)
    expect(msgs[1]!.role).toBe('assistant');
    expect(msgs[1]!.content).toBe('有人在吗？');
  });

  it('marks other dialogue as user role', () => {
    const msgs = formatHistoryForCharacter(
      events,
      'alice',
      template,
    );
    expect(msgs[2]!.role).toBe('user');
    expect(msgs[2]!.content).toContain('鲍勃');
  });

  it('appends action prompt at the end', () => {
    const msgs = formatHistoryForCharacter(
      events,
      'alice',
      template,
    );
    const last = msgs[msgs.length - 1]!;
    expect(last.content).toContain('轮到你了');
  });
});
