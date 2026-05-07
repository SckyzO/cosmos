export type ColBoxProps = {
  /** Label shown centered (typically a percentage like "50%") */
  label: string;
  /** Min height in px. Default: 80 */
  height?: number;
  className?: string;
};

/**
 * ColBox — styled placeholder box for layout demos.
 *
 * Useful when prototyping page layouts to visualize column proportions
 * (e.g. "20% / 60% / 20%"). Same visual treatment as SectionCard but
 * with a centered monospace label.
 */
export const ColBox = ({ label, height = 80, className }: ColBoxProps) => (
  <div
    className={`flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4 ${
      className ?? ''
    }`}
    style={{ minHeight: height }}
  >
    <span className="font-mono text-sm font-semibold text-[var(--color-text-muted)]">{label}</span>
  </div>
);
