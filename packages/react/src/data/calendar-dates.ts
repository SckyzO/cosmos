// Date helpers shared by MiniCalendar and EventCalendar: local time, ISO weeks
// (Monday first). Internal: not re-exported from the package.

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** `YYYY-MM-DD` in local time. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Days since the Monday of `d`'s week: JS 0=Sun..6=Sat → ISO 0=Mon..6=Sun. */
export const isoWeekday = (d: Date) => (d.getDay() + 6) % 7;
