import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export type SimpleRowProps = {
  /** Label on the left (typically a property name) */
  label: string;
  /** Value on the right (typically the property value) */
  value: ReactNode;
  /** Render value in monospace font (for IDs, hashes, paths…) */
  mono?: boolean;
  className?: string;
};

/**
 * SimpleRow — flat key/value row for metadata or properties.
 *
 * Use inside a SectionCard with `divide-y` for visually separated rows:
 *
 *   <SectionCard title="Metadata">
 *     <div className="divide-y divide-[var(--color-border)]">
 *       <SimpleRow label="ID" value="rack-01-a" mono />
 *       <SimpleRow label="Status" value={<StatusBadge status="OK" />} />
 *     </div>
 *   </SectionCard>
 */
export const SimpleRow = ({ label, value, mono = false, className }: SimpleRowProps) => (
  <div className={clsx('flex items-center justify-between py-2.5', className)}>
    <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    <span
      className={clsx(
        'text-sm font-medium text-[var(--color-text-primary)]',
        mono && 'font-mono text-xs'
      )}
    >
      {value}
    </span>
  </div>
);
