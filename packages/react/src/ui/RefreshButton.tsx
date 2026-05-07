import { clsx } from 'clsx';
import { Check, ChevronDown, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RefreshOption = { label: string; ms: number };

export const REFRESH_OPTIONS: RefreshOption[] = [
  { label: 'Off', ms: 0 },
  { label: '15s', ms: 15_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
  { label: '2m', ms: 120_000 },
  { label: '5m', ms: 300_000 },
  { label: '10m', ms: 600_000 },
  { label: '30m', ms: 1_800_000 },
  { label: '1h', ms: 3_600_000 },
];

/**
 * Hook that manages auto-refresh state for a page key, persisted to localStorage.
 * Pass a stable `pageKey` (e.g. "room", "rack", "alerts").
 */
export const useAutoRefresh = (pageKey: string, onRefresh: () => void | Promise<void>) => {
  const storageKey = `cosmos.refresh.${pageKey}`;

  const [autoRefreshMs, setAutoRefreshMs] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage.getItem(storageKey);
    return stored ? Number(stored) : 0;
  });

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (autoRefreshMs === 0) return;
    const timer = setInterval(() => void onRefreshRef.current(), autoRefreshMs);
    return () => clearInterval(timer);
  }, [autoRefreshMs]);

  const onIntervalChange = useCallback(
    (ms: number) => {
      setAutoRefreshMs(ms);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, String(ms));
      }
    },
    [storageKey]
  );

  return { autoRefreshMs, onIntervalChange };
};

export type RefreshButtonProps = {
  refreshing?: boolean;
  autoRefreshMs: number;
  onRefresh: () => void | Promise<void>;
  onIntervalChange: (ms: number) => void;
  options?: RefreshOption[];
  className?: string;
};

export const RefreshButton = ({
  refreshing = false,
  autoRefreshMs,
  onRefresh,
  onIntervalChange,
  options = REFRESH_OPTIONS,
  className,
}: RefreshButtonProps) => {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.ms === autoRefreshMs)?.label ?? '?';
  const isAutoActive = autoRefreshMs > 0;

  return (
    <div
      className={clsx(
        'relative flex items-stretch rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <button
        type="button"
        onClick={() => void onRefresh()}
        disabled={refreshing}
        className="flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
        <span>Refresh</span>
        {isAutoActive && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            {currentLabel}
          </span>
        )}
      </button>

      <div className="w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Choose refresh interval"
          className="flex h-full items-center rounded-r-lg px-2 text-gray-400 transition-colors hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-700"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute top-full right-0 z-30 mt-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.ms}
                  onClick={() => {
                    onIntervalChange(opt.ms);
                    setOpen(false);
                  }}
                  className={clsx(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
                    autoRefreshMs === opt.ms
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {opt.label}
                  {autoRefreshMs === opt.ms && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
