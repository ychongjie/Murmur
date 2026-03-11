'use client';

import { useState, useEffect, useRef } from 'react';

export function useTypewriter(text: string, speed = 40) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const timer = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(timer);
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isTyping };
}
