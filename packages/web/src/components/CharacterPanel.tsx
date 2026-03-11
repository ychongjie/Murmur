'use client';

interface CharacterInfo {
  id: string;
  name: string;
  role: string;
  personality: string;
}

interface CharacterPanelProps {
  characters: CharacterInfo[];
  speakingCharacterId: string | null;
}

const CHAR_COLOR_COUNT = 5;

export function getCharacterColorClass(index: number): string {
  return `char-color-${index % CHAR_COLOR_COUNT}`;
}

export function getCharacterBgClass(index: number): string {
  return `char-bg-${index % CHAR_COLOR_COUNT}`;
}

export function CharacterPanel({
  characters,
  speakingCharacterId,
}: CharacterPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-[var(--terminal-text-dim)]">
        CHARACTERS
      </h2>
      {characters.map((char, i) => {
        const colorClass = getCharacterColorClass(i);
        const bgClass = getCharacterBgClass(i);
        const isSpeaking = char.id === speakingCharacterId;
        return (
          <div
            key={char.id}
            className={`rounded border px-3 py-2 transition-colors ${
              isSpeaking
                ? 'border-[var(--terminal-text)] bg-[var(--terminal-bg)]'
                : 'border-[var(--border-color)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${bgClass}`}
              />
              <span className={`text-sm font-bold ${colorClass}`}>
                {char.name}
              </span>
              {isSpeaking && (
                <span className="text-xs text-[var(--terminal-green)]">
                  speaking
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--terminal-text-dim)]">
              {char.role}
            </p>
          </div>
        );
      })}
    </div>
  );
}
