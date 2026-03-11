export function Terminal({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="relative rounded-lg border border-[var(--border-color)] bg-[var(--terminal-bg-secondary)] scanlines">
      {title && (
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-xs text-[var(--terminal-text-dim)]">
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
