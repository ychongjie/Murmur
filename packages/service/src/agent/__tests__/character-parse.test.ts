import { describe, it, expect } from 'vitest';
import { parseCharacterOutput } from '../character.js';

describe('parseCharacterOutput', () => {
  it('extracts plain dialogue', () => {
    const result = parseCharacterOutput('alice', '你们在说什么？');
    expect(result.content).toBe('你们在说什么？');
    expect(result.innerThought).toBeUndefined();
  });

  it('extracts Chinese parentheses inner thoughts', () => {
    const raw = '我没什么好说的。\n（心想：他一定在撒谎。）';
    const result = parseCharacterOutput('alice', raw);
    expect(result.content).toBe('我没什么好说的。');
    expect(result.innerThought).toBe('心想：他一定在撒谎。');
  });

  it('extracts English parentheses inner thoughts', () => {
    const raw = '真的吗？(心想：不可能)';
    const result = parseCharacterOutput('bob', raw);
    expect(result.content).toBe('真的吗？');
    expect(result.innerThought).toBe('心想：不可能');
  });

  it('handles multiple inner thoughts', () => {
    const raw = '好吧。（他在试探我）我知道了。（我要小心）';
    const result = parseCharacterOutput('alice', raw);
    expect(result.content).toContain('好吧');
    expect(result.content).toContain('我知道了');
    expect(result.innerThought).toBe('他在试探我；我要小心');
  });

  it('preserves content when only thoughts present', () => {
    const raw = '（全是内心戏）';
    const result = parseCharacterOutput('alice', raw);
    // When content is empty after removal, use original
    expect(result.content).toBe('（全是内心戏）');
    expect(result.innerThought).toBe('全是内心戏');
  });
});
