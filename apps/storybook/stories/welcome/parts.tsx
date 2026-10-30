import type { ReactNode } from 'react';
import { MONO, PAGE, cx } from './styles';

type SectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  /** Beside the heading, at the end of the line. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A section of the page: an eyebrow, its `h2`, a lead and the content. */
export const Section = ({
  id,
  eyebrow,
  title,
  lead,
  action,
  className,
  children,
}: SectionProps) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className={cx('scroll-mt-16 border-t border-[var(--color-border)] py-12 sm:py-16', className)}
  >
    <div className={PAGE}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl min-w-0">
          <p className={cx(MONO, 'text-brand-600 dark:text-brand-400 uppercase')}>{eyebrow}</p>
          <h2
            id={`${id}-title`}
            className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl"
          >
            {title}
          </h2>
          {lead && <p className="mt-2 text-base text-[var(--color-text-secondary)]">{lead}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  </section>
);

/** An attribute or a class, as written in code. */
export const Code = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-[0.9em] text-[var(--color-text-primary)]">{children}</code>
);
