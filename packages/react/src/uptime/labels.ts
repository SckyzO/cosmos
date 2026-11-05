// The English the uptime components write, their part of `CosmosLabels` (`englishLabels`).

import type { BeatStatus } from './types';

/**
 * The words of `HeartbeatBar`, `UptimeBars`, `UptimeStat` and `MonitorRow`, which share them. The
 * names of the five beat statuses are keyed by status.
 */
export type UptimeLabels = Record<BeatStatus, string> & {
  /** `MonitorRow`'s paused state. Default `Paused`. */
  paused: string;
  /** A period or a day with no figure. Default `No data`. */
  noData: string;
  /** The time of a beat that has none readable. Default `Unknown time`. */
  unknownTime: string;
  /** The date of a day that has none readable. Default `Unknown date`. */
  unknownDate: string;
  /** How many beats had a status, in the summary of a bar. `status` is its name. Default `54 up`. */
  beatCount: (count: number, status: string) => string;
  /** What a bar with no beat says. Default `No checks yet`. */
  noChecks: string;
  /** The name of a bar, from how many beats it shows and their `summary`. Default `Last 60 checks: 54 up, 3 down`. */
  lastChecks: (count: number, summary: string) => string;
  /** Name of the legends. Default `Legend`. */
  legend: string;
  /** The shape of a down beat in a `bars` legend. Default `taller bar`. */
  downBars: string;
  /** The shape of a down beat in a `blocks` legend. Default `crossed block`. */
  downBlocks: string;
  /** The shape of a down beat in a `dots` legend. Default `square dot`. */
  downDots: string;
  /** The down entry of a legend, from its name and its shape. Default `Down (taller bar)`. */
  downLegend: (name: string, shape: string) => string;
  /** A day with no incident. Default `no incident`. */
  noIncident: string;
  /** A day with incidents. Default `1 incident`, `3 incidents`. */
  incidents: (count: number) => string;
  /** An uptime in words, from the figure. Default `99.95% uptime`. */
  uptimeOf: (uptime: string) => string;
  /** Name of a strip of days with none. Default `No daily uptime`. */
  noDays: string;
  /** Name of a strip of days, from how many it shows. Default `Daily uptime over 90 days`. */
  dailyUptime: (count: number) => string;
  /** The oldest end of a strip, from how many days it shows. Default `90 days ago`. */
  daysAgo: (count: number) => string;
  /** The newest end of a strip. Default `Today`. */
  today: string;
  /** The legend of the best level, from the limit. Default `99.9% and up`. */
  limitAndUp: (limit: string) => string;
  /** The legend of the middle level. Default `99% to 99.9%`. */
  limitRange: (from: string, to: string) => string;
  /** The legend of the worst level. Default `Below 99%`. */
  limitBelow: (limit: string) => string;
  /** A period with no downtime. Default `No downtime`. */
  noDowntime: string;
  /** A downtime in seconds. Default `42 s`. */
  seconds: (seconds: number) => string;
  /** A downtime in minutes. Default `39 min`. */
  minutes: (minutes: number) => string;
  /** A downtime in hours, with the minutes left when there are some. Default `2 h`, `2 h 5 min`. */
  hours: (hours: number, minutes: number) => string;
  /** A downtime in days, with the hours left when there are some. Default `3 d`, `3 d 4 h`. */
  days: (days: number, hours: number) => string;
  /** The downtime of a card, from the duration. Default `39 min down`. */
  downFor: (duration: string) => string;
  /** A certificate that has expired. Default `Expired`. */
  expired: string;
  /** A certificate that expires today. Default `Expires today`. */
  expiresToday: string;
  /** A certificate with days left. Default `12 days left`, `1 day left`. */
  daysLeft: (days: number) => string;
  /** Name of the `row` of `UptimeStat` when the host gives no `ariaLabel`. Default `Uptime`. */
  uptimeGroup: string;
  /** The label of the `card` of `UptimeStat`, from the name of the period. Default `Uptime, 30 days`. */
  uptimeCard: (period: string) => string;
  /** Name of the days of the `card`, from the period, `period` when there is none. Default `Daily uptime, 30 days`. */
  dailyUptimeCard: (period: string) => string;
  /** The word for a period that has no label. Default `period`. */
  period: string;
  /** The label of the response time. Default `Avg. response`. */
  avgResponse: string;
  /** The label of the certificate. Default `Certificate`. */
  certificate: string;
  /** Name of the icon of a certificate close to its expiry. Default `Warning`. */
  warning: string;
  /** The state of `MonitorRow` as the chip names it when its data is stale, from the state. Default `Down, stale`. */
  staleState: (state: string) => string;
  /** The label of the 24 h uptime of a `MonitorRow` card. Default `24 h uptime`. */
  uptime24h: string;
  /** The label of the latency of a `MonitorRow` card. Default `Latency`. */
  latency: string;
  /** Read out where a `MonitorRow` has no response time. Default `No response time`. */
  noResponseTime: string;
  /** Name of the beats of a `MonitorRow`, from its name. Default `API: recent checks`. */
  recentChecks: (name: string) => string;
};

export const UPTIME_LABELS: UptimeLabels = {
  up: 'Up',
  down: 'Down',
  degraded: 'Degraded',
  maintenance: 'Maintenance',
  pending: 'Pending',
  paused: 'Paused',
  noData: 'No data',
  unknownTime: 'Unknown time',
  unknownDate: 'Unknown date',
  beatCount: (count, status) => `${count} ${status.toLowerCase()}`,
  noChecks: 'No checks yet',
  lastChecks: (count, summary) => `Last ${count} ${count === 1 ? 'check' : 'checks'}: ${summary}`,
  legend: 'Legend',
  downBars: 'taller bar',
  downBlocks: 'crossed block',
  downDots: 'square dot',
  downLegend: (name, shape) => `${name} (${shape})`,
  noIncident: 'no incident',
  incidents: (count) => `${count} ${count === 1 ? 'incident' : 'incidents'}`,
  uptimeOf: (uptime) => `${uptime} uptime`,
  noDays: 'No daily uptime',
  dailyUptime: (count) => `Daily uptime over ${count} ${count === 1 ? 'day' : 'days'}`,
  daysAgo: (count) => `${count} days ago`,
  today: 'Today',
  limitAndUp: (limit) => `${limit} and up`,
  limitRange: (from, to) => `${from} to ${to}`,
  limitBelow: (limit) => `Below ${limit}`,
  noDowntime: 'No downtime',
  seconds: (seconds) => `${seconds} s`,
  minutes: (minutes) => `${minutes} min`,
  hours: (hours, minutes) => (minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`),
  days: (days, hours) => (hours === 0 ? `${days} d` : `${days} d ${hours} h`),
  downFor: (duration) => `${duration} down`,
  expired: 'Expired',
  expiresToday: 'Expires today',
  daysLeft: (days) => `${days} ${days === 1 ? 'day' : 'days'} left`,
  uptimeGroup: 'Uptime',
  uptimeCard: (period) => `Uptime, ${period}`,
  dailyUptimeCard: (period) => `Daily uptime, ${period}`,
  period: 'period',
  avgResponse: 'Avg. response',
  certificate: 'Certificate',
  warning: 'Warning',
  staleState: (state) => `${state}, stale`,
  uptime24h: '24 h uptime',
  latency: 'Latency',
  noResponseTime: 'No response time',
  recentChecks: (name) => `${name}: recent checks`,
};
