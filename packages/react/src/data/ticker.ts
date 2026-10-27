import { MAX_TIMEOUT } from './time';

// One timer for every subscriber (every RelativeTime of a list, every Clock of a world clock):
// it sleeps until the earliest of their due times, wakes only the ones that are due, and
// stops when none is left.

type Entry = {
  listener: () => void;
  delay: () => number | null;
  due: number;
};

const entries = new Set<Entry>();
let timer: ReturnType<typeof setTimeout> | undefined;
let scheduledFor = Infinity;

const arm = (entry: Entry) => {
  const delay = entry.delay();
  // 1 ms at least, or an entry whose delay is 0 would wake the timer in a loop.
  entry.due = delay === null ? Infinity : Date.now() + Math.max(delay, 1);
};

const reschedule = () => {
  let next = Infinity;
  for (const entry of entries) next = Math.min(next, entry.due);
  if (next === scheduledFor) return;
  clearTimeout(timer);
  timer = undefined;
  scheduledFor = next;
  if (next === Infinity) return;
  timer = setTimeout(tick, Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT));
};

const tick = () => {
  timer = undefined;
  scheduledFor = Infinity;
  const now = Date.now();
  // A copy: a listener may unsubscribe its own entry, or another one.
  for (const entry of [...entries]) {
    if (!entries.has(entry) || entry.due > now) continue;
    arm(entry);
    entry.listener();
  }
  reschedule();
};

/**
 * Calls `listener` whenever `delay()` milliseconds have passed since the last call (or since
 * subscribing), until the returned function unsubscribes. A `delay()` of `null` parks the
 * subscriber for good. The clock is `Date.now()`, never the count of ticks: a late timer (a
 * background tab) does not drift.
 */
export const subscribeTicker = (delay: () => number | null, listener: () => void) => {
  const entry: Entry = { listener, delay, due: Infinity };
  arm(entry);
  entries.add(entry);
  reschedule();
  return () => {
    entries.delete(entry);
    reschedule();
  };
};
