// Typewriter animation hook
// Full implementation in Phase 4

export function useTypewriter(_text: string, _speed = 50) {
  // TODO: Character-by-character reveal animation
  return { displayedText: _text, isTyping: false };
}
