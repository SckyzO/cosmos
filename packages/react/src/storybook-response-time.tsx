import { clsx } from 'clsx';

// A response-time line for the monitoring stories. react does not depend on the charts package
// (a consumer who does not draw charts ships no chart library), so the stories draw the line
// themselves: with charts, this is a `LineAreaChart` from @sckyzo/cosmos-charts, its `referenceBands`
// shading the down periods.

export type ResponseTimeChartProps = {
  /** One value per sample, in milliseconds; `null` for a sample nothing answered. */
  points: (number | null)[];
  /** Accessible name of the chart. */
  ariaLabel: string;
  className?: string;
};

const WIDTH = 100;
const HEIGHT = 40;

export const ResponseTimeChart = ({ points, ariaLabel, className }: ResponseTimeChartProps) => {
  const known = points.filter((p): p is number => p !== null);
  const max = Math.max(...known, 1);
  const x = (index: number) => (index / Math.max(points.length - 1, 1)) * WIDTH;
  const y = (value: number) => HEIGHT - 2 - (value / max) * (HEIGHT - 6);

  // The line breaks over a gap: one segment per run of samples that answered.
  const runs: { index: number; value: number }[][] = [];
  const down: [number, number][] = [];
  points.forEach((value, index) => {
    if (value === null) {
      const last = down[down.length - 1];
      if (last && last[1] === index - 1) last[1] = index;
      else down.push([index, index]);
      return;
    }
    const run = runs[runs.length - 1];
    if (run && run[run.length - 1]!.index === index - 1) run.push({ index, value });
    else runs.push([{ index, value }]);
  });

  return (
    <div className={clsx('min-w-0', className)}>
      <div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]">
        <span>{Math.round(max).toLocaleString('en-US')} ms</span>
        <span>0</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="h-32 w-full overflow-visible"
      >
        {down.map(([from, to]) => (
          <rect
            key={from}
            x={x(from) - 0.5}
            y={0}
            width={x(to) - x(from) + 1}
            height={HEIGHT}
            fill="var(--color-status-crit)"
            opacity={0.18}
          />
        ))}
        {runs.map((run) => {
          const line = run.map((p) => `${x(p.index)},${y(p.value)}`).join(' ');
          return (
            <g key={run[0]!.index}>
              <polygon
                points={`${x(run[0]!.index)},${HEIGHT} ${line} ${x(run[run.length - 1]!.index)},${HEIGHT}`}
                fill="var(--color-brand-500)"
                opacity={0.12}
              />
              <polyline
                points={line}
                fill="none"
                stroke="var(--color-brand-500)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>
      {down.length > 0 && (
        <p className="m-0 mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[2px] bg-[var(--color-status-crit)] opacity-40"
          />
          Down: no response
        </p>
      )}
    </div>
  );
};
