import { clsx } from 'clsx';

export type SkProps = {
  /** Tailwind height class — default `h-4`. */
  h?: string;
  /** Tailwind width class — default `w-full`. */
  w?: string;
  /** Tailwind border-radius class — default `rounded`. */
  round?: string;
  className?: string;
};

/**
 * Sk — primitive skeleton block (animated pulsing rectangle). Compose with
 * the Skeleton presets (SkeletonText / SkeletonTable / SkeletonList) or
 * use directly for custom placeholders.
 */
export const Sk = ({ h = 'h-4', w = 'w-full', round = 'rounded', className }: SkProps) => (
  <div className={clsx('animate-pulse bg-gray-200 dark:bg-gray-700', h, w, round, className)} />
);

export type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

const TEXT_WIDTHS = ['w-full', 'w-5/6', 'w-4/6', 'w-2/3'] as const;

export const SkeletonText = ({ lines = 4, className }: SkeletonTextProps) => (
  <div className={clsx('space-y-3', className)}>
    <Sk h="h-5" w="w-3/4" />
    {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
      <Sk key={i} h="h-4" w={TEXT_WIDTHS[i % TEXT_WIDTHS.length]} />
    ))}
  </div>
);

export type SkeletonTableProps = {
  rows?: number;
  cols?: number;
  className?: string;
};

export const SkeletonTable = ({ rows = 4, cols = 4, className }: SkeletonTableProps) => (
  <div
    className={clsx(
      'overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800',
      className
    )}
  >
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Sk key={i} h="h-3" w="w-3/4" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div
        key={row}
        className="border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800"
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <Sk key={col} h="h-3" w={col === 0 ? 'w-full' : col === cols - 1 ? 'w-1/2' : 'w-5/6'} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export type SkeletonListProps = {
  rows?: number;
  showAction?: boolean;
  className?: string;
};

export const SkeletonList = ({ rows = 4, showAction = true, className }: SkeletonListProps) => (
  <div className={clsx('animate-pulse space-y-0', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 last:border-0 dark:border-gray-800"
      >
        <Sk h="h-9" w="w-9" round="rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="flex items-center gap-2">
            <Sk h="h-3.5" w="w-16" round="rounded-full" />
            <Sk h="h-4" w="w-32" />
            <Sk h="h-5" w="w-14" round="rounded-full" />
          </div>
          <Sk h="h-3.5" w={i % 2 === 0 ? 'w-2/3' : 'w-1/2'} />
          <Sk h="h-3" w="w-40" />
        </div>
        {showAction && <Sk h="h-8" w="w-16" round="rounded-lg" className="shrink-0" />}
      </div>
    ))}
  </div>
);
