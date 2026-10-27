import { clsx } from 'clsx';
import type { AnsiColor, AnsiStyle } from './ansi';
import type { LogTone } from './LogLevelBadge';
import type { JobStatus } from './job-log';

// The classes of `JobLog`. Every class is written out whole so Tailwind finds it. The ANSI
// colours hold 4.5:1 on their ground in the four themes: the terminal tone is a fixed dark panel
// (the themes do not touch the slate and hue palettes), the surface tone steps up in the dark
// themes. The axe contrast passes check every colour, in both tones, in the `ANSI` story.

/** The text colour of each ANSI foreground. */
const FOREGROUND: Record<LogTone, Record<AnsiColor, string>> = {
  terminal: {
    black: 'text-slate-400',
    red: 'text-red-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    magenta: 'text-fuchsia-400',
    cyan: 'text-cyan-400',
    white: 'text-slate-200',
    brightBlack: 'text-slate-400',
    brightRed: 'text-red-300',
    brightGreen: 'text-green-300',
    brightYellow: 'text-yellow-300',
    brightBlue: 'text-blue-300',
    brightMagenta: 'text-fuchsia-300',
    brightCyan: 'text-cyan-300',
    brightWhite: 'text-white',
  },
  surface: {
    black: 'text-gray-900 dark:text-gray-100',
    red: 'text-red-800 dark:text-red-400',
    green: 'text-green-800 dark:text-green-400',
    yellow: 'text-yellow-800 dark:text-yellow-400',
    blue: 'text-blue-800 dark:text-blue-400',
    magenta: 'text-fuchsia-800 dark:text-fuchsia-400',
    cyan: 'text-cyan-800 dark:text-cyan-400',
    white: 'text-gray-600 dark:text-gray-300',
    brightBlack: 'text-gray-600 dark:text-gray-400',
    brightRed: 'text-red-700 dark:text-red-300',
    brightGreen: 'text-green-700 dark:text-green-300',
    brightYellow: 'text-yellow-800 dark:text-yellow-300',
    brightBlue: 'text-blue-700 dark:text-blue-300',
    brightMagenta: 'text-fuchsia-700 dark:text-fuchsia-300',
    brightCyan: 'text-cyan-800 dark:text-cyan-300',
    brightWhite: 'text-gray-950 dark:text-white',
  },
};

/** The fill of each ANSI background. Its text colour is in `ON_BACKGROUND`: one text colour per element. */
const BACKGROUND: Record<LogTone, Record<AnsiColor, string>> = {
  terminal: {
    black: 'bg-slate-800',
    red: 'bg-red-900',
    green: 'bg-green-900',
    yellow: 'bg-yellow-900',
    blue: 'bg-blue-900',
    magenta: 'bg-fuchsia-900',
    cyan: 'bg-cyan-900',
    white: 'bg-slate-200',
    brightBlack: 'bg-slate-400',
    brightRed: 'bg-red-300',
    brightGreen: 'bg-green-300',
    brightYellow: 'bg-yellow-300',
    brightBlue: 'bg-blue-300',
    brightMagenta: 'bg-fuchsia-300',
    brightCyan: 'bg-cyan-300',
    brightWhite: 'bg-white',
  },
  surface: {
    black: 'bg-gray-200 dark:bg-gray-700',
    red: 'bg-red-100 dark:bg-red-900',
    green: 'bg-green-100 dark:bg-green-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
    blue: 'bg-blue-100 dark:bg-blue-900',
    magenta: 'bg-fuchsia-100 dark:bg-fuchsia-900',
    cyan: 'bg-cyan-100 dark:bg-cyan-900',
    white: 'bg-gray-100 dark:bg-gray-200',
    brightBlack: 'bg-gray-300 dark:bg-gray-600',
    brightRed: 'bg-red-300 dark:bg-red-800',
    brightGreen: 'bg-green-300 dark:bg-green-800',
    brightYellow: 'bg-yellow-300 dark:bg-yellow-800',
    brightBlue: 'bg-blue-300 dark:bg-blue-800',
    brightMagenta: 'bg-fuchsia-300 dark:bg-fuchsia-800',
    brightCyan: 'bg-cyan-300 dark:bg-cyan-800',
    brightWhite: 'bg-gray-900 dark:bg-white',
  },
};

/** The text colour that reads on each background, when the style sets no foreground. */
const ON_BACKGROUND: Record<LogTone, Record<AnsiColor, string>> = {
  terminal: {
    black: 'text-slate-100',
    red: 'text-red-50',
    green: 'text-green-50',
    yellow: 'text-yellow-50',
    blue: 'text-blue-50',
    magenta: 'text-fuchsia-50',
    cyan: 'text-cyan-50',
    white: 'text-slate-950',
    brightBlack: 'text-slate-950',
    brightRed: 'text-slate-950',
    brightGreen: 'text-slate-950',
    brightYellow: 'text-slate-950',
    brightBlue: 'text-slate-950',
    brightMagenta: 'text-slate-950',
    brightCyan: 'text-slate-950',
    brightWhite: 'text-slate-950',
  },
  surface: {
    black: 'text-gray-900 dark:text-gray-50',
    red: 'text-red-950 dark:text-red-50',
    green: 'text-green-950 dark:text-green-50',
    yellow: 'text-yellow-950 dark:text-yellow-50',
    blue: 'text-blue-950 dark:text-blue-50',
    magenta: 'text-fuchsia-950 dark:text-fuchsia-50',
    cyan: 'text-cyan-950 dark:text-cyan-50',
    white: 'text-gray-950 dark:text-gray-950',
    brightBlack: 'text-gray-950 dark:text-white',
    brightRed: 'text-red-950 dark:text-white',
    brightGreen: 'text-green-950 dark:text-white',
    brightYellow: 'text-yellow-950 dark:text-white',
    brightBlue: 'text-blue-950 dark:text-white',
    brightMagenta: 'text-fuchsia-950 dark:text-white',
    brightCyan: 'text-cyan-950 dark:text-white',
    brightWhite: 'text-white dark:text-gray-950',
  },
};

const DIM: Record<LogTone, string> = {
  terminal: 'text-slate-400',
  surface: 'text-gray-600 dark:text-gray-400',
};

/** The classes of a run of text: its colours and attributes, on the given tone. */
export const ansiClass = (style: AnsiStyle, tone: LogTone): string | undefined => {
  const foreground =
    style.fg !== null
      ? FOREGROUND[tone][style.fg]
      : style.bg !== null
        ? ON_BACKGROUND[tone][style.bg]
        : style.dim
          ? DIM[tone]
          : null;
  return (
    clsx(
      style.bg !== null && BACKGROUND[tone][style.bg],
      foreground,
      // A dim colour is the colour a little fainter; a dim default is the muted text of the tone.
      style.dim && (style.fg !== null || style.bg !== null) && 'opacity-80',
      style.bold && 'font-semibold',
      style.italic && 'italic',
      style.underline && 'underline underline-offset-2'
    ) || undefined
  );
};

type StatusLook = { icon: string; pill: string };

/** The colour of a status: its icon, and its pill in the header of the log. */
export const STATUS: Record<LogTone, Record<JobStatus, StatusLook>> = {
  terminal: {
    passed: { icon: 'text-green-400', pill: 'bg-green-500/15 text-green-300' },
    failed: { icon: 'text-red-400', pill: 'bg-red-500/15 text-red-300' },
    running: { icon: 'text-sky-300', pill: 'bg-sky-500/15 text-sky-300' },
    queued: { icon: 'text-slate-400', pill: 'bg-white/10 text-slate-300' },
    skipped: { icon: 'text-slate-400', pill: 'bg-white/10 text-slate-300' },
  },
  surface: {
    passed: {
      icon: 'text-green-700 dark:text-green-400',
      pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    },
    failed: {
      icon: 'text-red-700 dark:text-red-400',
      pill: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    },
    running: {
      icon: 'text-blue-700 dark:text-blue-400',
      pill: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    },
    queued: {
      icon: 'text-gray-600 dark:text-gray-400',
      pill: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
    },
    skipped: {
      icon: 'text-gray-600 dark:text-gray-400',
      pill: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
    },
  },
};

/** What `LogViewer`'s tones do not carry: the frame, the step headers, the controls. */
export const FRAME = {
  terminal: {
    border: 'border-slate-800',
    title: 'text-slate-50',
    // Opaque, because the open step's header sticks above the lines that scroll under it.
    stepClosed: 'bg-slate-950 text-slate-300 hover:bg-slate-900',
    stepOpen: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
    stepMuted: 'text-slate-400',
    link: 'text-slate-400 hover:text-white',
    linkCurrent: 'text-sky-300',
    field: 'border-slate-700 bg-transparent text-slate-400',
    input: 'text-slate-100 placeholder:text-slate-400',
    iconButton: 'text-slate-400 hover:bg-white/10 hover:text-white',
    iconButtonOn: 'bg-white/10 text-slate-100 hover:bg-white/15',
    footerButton: 'border-slate-700 text-slate-200 hover:bg-white/10',
    dot: 'bg-green-400',
  },
  surface: {
    border: 'border-gray-200 dark:border-gray-800',
    title: 'text-gray-900 dark:text-white',
    stepClosed:
      'bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
    stepOpen:
      'bg-gray-50 text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700',
    stepMuted: 'text-gray-600 dark:text-gray-400',
    link: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
    linkCurrent: 'text-brand-700 dark:text-brand-300',
    field:
      'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
    input:
      'text-gray-900 placeholder:text-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400',
    iconButton:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white',
    iconButtonOn:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
    footerButton:
      'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
    dot: 'bg-green-600 dark:bg-green-400',
  },
} as const;
