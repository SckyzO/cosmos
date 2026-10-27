import type { Beat, BeatStatus, UptimeDay } from './uptime/types';

// Fixed data for the uptime stories: one moment, and a seeded generator, so the same story draws
// the same bars on every run.

/** The moment the stories end their history at. */
export const UPTIME_NOW = Date.UTC(2026, 0, 15, 10, 0, 0);

// mulberry32: a small seeded generator, so a latency is the same every run.
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const LETTER: Record<string, BeatStatus> = {
  u: 'up',
  d: 'down',
  g: 'degraded',
  m: 'maintenance',
  p: 'pending',
};

const MESSAGE: Partial<Record<BeatStatus, string>> = {
  down: 'Timeout after 5 s',
  degraded: 'Slow response: above 1 s',
  maintenance: 'Planned maintenance',
};

/**
 * Beats from a pattern, oldest first, one letter each: `u` up, `d` down, `g` degraded,
 * `m` maintenance, `p` pending. The last one is at `UPTIME_NOW`, `everySeconds` apart.
 * Latency follows the status: ~180 ms up, above 1 s degraded, the timeout when down, none while
 * pending.
 */
export const beatsFrom = (pattern: string, everySeconds = 60, seed = 7): Beat[] => {
  const random = seeded(seed);
  return [...pattern].map((letter, index) => {
    const status = LETTER[letter];
    if (!status) throw new Error(`beatsFrom: unknown status letter "${letter}"`);
    const time = UPTIME_NOW - (pattern.length - 1 - index) * everySeconds * 1000;
    const latency =
      status === 'up'
        ? Math.round(150 + random() * 80)
        : status === 'degraded'
          ? Math.round(1100 + random() * 900)
          : status === 'down'
            ? 5003
            : undefined;
    return { time, status, latency, message: MESSAGE[status] };
  });
};

/** 60 checks: three timeouts, one slow answer, a maintenance window. */
export const MIXED_BEATS = beatsFrom(
  'uuuuuuuuuuuuuuuuuudduuuuuuuuuguuuuuuuuuummuuuuuuuuuuuuuuudup'
);

/** A monitor that keeps going down and coming back. */
export const FLAPPING_BEATS = beatsFrom(
  'uuuuduudduuuudduudduuduuddudduuududdudduuuduudduuddudduduuddudud'
);

/** Long gaps: a monitor not checked for a while, then paused. */
export const GAPPY_BEATS = beatsFrom(
  'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuppppppppppppppppppppppppuuuuuuuuuuuuuupppppppppppppppp'
);

const DAY_MS = 24 * 3_600_000;

/**
 * Days from exceptions, oldest first, the last one today (15 January 2026). A day not listed
 * holds 100 % of uptime; the key is how many days ago, the value the uptime or `null` for no
 * data. `incidents` names the days that had some.
 */
export const daysFrom = (
  exceptions: Record<number, number | null>,
  count = 90,
  incidents: Record<number, number> = {}
): UptimeDay[] =>
  Array.from({ length: count }, (_, index) => {
    const ago = count - 1 - index;
    const uptime = ago in exceptions ? (exceptions[ago] ?? null) : 1;
    return {
      date: new Date(UPTIME_NOW - ago * DAY_MS).toISOString().slice(0, 10),
      uptime,
      incidents: incidents[ago],
    };
  });

/** 90 days: three amber days, one red, a stretch with no data at the start. */
export const API_DAYS = daysFrom(
  { 5: 0.9985, 28: 0.9992, 27: 0.972, 66: 0.9962, 89: null, 88: null, 87: null },
  90,
  { 5: 1, 27: 2, 28: 1, 66: 1 }
);

/** A service that is mostly red and amber. */
export const SHAKY_DAYS = daysFrom(
  {
    85: 0.995,
    49: 0.9992,
    48: 0.9715,
    47: 0.9961,
    12: 0.9993,
    2: 0.9788,
    1: 0.9421,
    0: 0.9966,
  },
  90,
  { 85: 1, 48: 3, 2: 2, 1: 4, 0: 1 }
);

/**
 * Response times in milliseconds, one per sample, from a seeded generator: a steady line around
 * `base` that climbs to a slow stretch and, over the samples in `outage`, is missing (the
 * monitor was down, nothing answered): those come back as `null`.
 */
export const responseSeries = (
  count: number,
  base = 180,
  outage: [number, number] | null = null,
  seed = 11
): (number | null)[] => {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    if (outage && index >= outage[0] && index <= outage[1]) return null;
    const slow = index > count * 0.62 && index < count * 0.7 ? 5 : 1;
    return Math.round((base + random() * 60 - 30) * slow);
  });
};
