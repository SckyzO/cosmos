export type ColBoxProps = {
  /** Label shown centered, typically the width the layout gives the box, like "50%" or "18rem". */
  label: string;
  /** Min height in px. Default: 80 */
  height?: number;
  className?: string;
};

/**
 * ColBox — placeholder boxes for layout demos.
 *
 * A bordered panel with a centered monospace label, in the same treatment as
 * SectionCard. It fills the cell its parent gives it, so the grid or the width
 * around it sets the proportions; the label says what they are (e.g. "20%",
 * "60%", "20%").
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
