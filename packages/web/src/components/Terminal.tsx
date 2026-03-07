// Retro terminal container component
// Full implementation in Phase 4

export function Terminal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-lg border border-[var(--border-color)] bg-[var(--terminal-bg-secondary)] p-4 scanlines">
      {children}
    </div>
  );
}
