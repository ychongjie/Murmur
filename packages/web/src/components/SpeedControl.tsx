'use client';

import type { SpeedSetting } from '@murmur/types';

interface SpeedControlProps {
  current: SpeedSetting;
  onChange: (speed: SpeedSetting) => void;
}

const SPEEDS: { value: SpeedSetting; label: string; icon: string }[] = [
  { value: 'slow', label: 'Slow', icon: '⏪' },
  { value: 'normal', label: 'Normal', icon: '▶' },
  { value: 'fast', label: 'Fast', icon: '⏩' },
];

export function SpeedControl({ current, onChange }: SpeedControlProps) {
  return (
    <div className="flex items-center gap-1">
      {SPEEDS.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`rounded px-2 py-1 text-xs font-mono transition-colors ${
            current === value
              ? 'bg-[var(--terminal-text)] text-[var(--terminal-bg)]'
              : 'text-[var(--terminal-text-dim)] hover:text-[var(--terminal-text)]'
          }`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
