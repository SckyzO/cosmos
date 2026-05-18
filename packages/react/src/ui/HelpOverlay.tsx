import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Fragment, useEffect, useState, type ReactNode } from 'react';

// ── Hotkey matcher ───────────────────────────────────────────────────────────
// Lightweight matcher mirroring CommandPalette — kept inline to avoid
// cross-component coupling. Lowercase, split on '+', match modifiers + key.

const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.toLowerCase().split('+');
  const expectMod = parts.includes('mod');
  const expectMeta = parts.includes('meta') || parts.includes('cmd');
  const expectCtrl = parts.includes('ctrl');
  const expectShift = parts.includes('shift');
  const expectAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  if (expectMod && !modPressed) return false;
  if (expectMeta && !e.metaKey) return false;
  if (expectCtrl && !e.ctrlKey) return false;
  if (expectShift && !e.shiftKey) return false;
  if (expectAlt && !e.altKey) return false;
  return e.key.toLowerCase() === key;
};

// Skip the hotkey when the user is typing in a form control — opening the
// help overlay while typing "?" in a textarea would surprise the user.
const isTypingInFormControl = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

// ── Key rendering ────────────────────────────────────────────────────────────

const KEY_LABEL: Record<string, string> = {
  mod: '⌘',
  cmd: '⌘',
  meta: '⌘',
  ctrl: 'Ctrl',
  shift: '⇧',
  alt: '⌥',
  option: '⌥',
  enter: '↵',
  escape: 'Esc',
  esc: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  backspace: '⌫',
  delete: '⌦',
  tab: 'Tab',
  space: '␣',
};

const formatKey = (raw: string, isMac: boolean): string => {
  const key = raw.toLowerCase();
  if (key === 'mod') return isMac ? '⌘' : 'Ctrl';
  if (KEY_LABEL[key]) return KEY_LABEL[key];
  return raw.length === 1 ? raw.toUpperCase() : raw;
};

const Kbd = ({ children, className }: { children: ReactNode; className?: string }) => (
  <kbd
    className={clsx(
      'inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[11px] font-medium text-gray-700 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
      className
    )}
  >
    {children}
  </kbd>
);

// ── Root ─────────────────────────────────────────────────────────────────────

export type HelpOverlayProps = {
  /** Controlled open state. Omit to use the internal hotkey-driven state. */
  open?: boolean;
  /** Called when the overlay opens or closes (controlled or uncontrolled). */
  onOpenChange?: (open: boolean) => void;
  /**
   * Global hotkey that toggles the overlay. Defaults to `'?'`. Pass `null`
   * to skip registering a hotkey (controlled-only usage).
   */
  hotkey?: string | null;
  /** Header title. Defaults to `'Keyboard shortcuts'`. */
  title?: ReactNode;
  /** Optional descriptive subtitle below the title. */
  description?: ReactNode;
  /** Footer hint text. Defaults to `Press Esc to close`. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

const HelpOverlayRoot = ({
  open: controlledOpen,
  onOpenChange,
  hotkey = '?',
  title = 'Keyboard shortcuts',
  description,
  footer,
  className,
  children,
}: HelpOverlayProps) => {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // Hotkey toggles open/close; Esc always closes (handled while open).
  useEffect(() => {
    if (!hotkey) return;
    const handler = (e: KeyboardEvent) => {
      if (isTypingInFormControl(e.target)) return;
      if (matchesHotkey(e, hotkey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // setOpen is stable enough — depends only on isControlled/onOpenChange/open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkey, open, isControlled, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Keyboard shortcuts'}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        className={clsx(
          'relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close keyboard shortcuts"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 overflow-y-auto px-5 py-5 sm:grid-cols-2">
          {children}
        </div>
        {(footer ?? true) && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-2.5 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
            {footer ?? (
              <>
                Press <Kbd>Esc</Kbd> to close
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section ──────────────────────────────────────────────────────────────────

export type HelpOverlaySectionProps = {
  title: ReactNode;
  className?: string;
  children: ReactNode;
};

const HelpOverlaySection = ({ title, className, children }: HelpOverlaySectionProps) => (
  <section className={clsx('space-y-2', className)}>
    <h3 className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
      {title}
    </h3>
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">{children}</ul>
  </section>
);

// ── Shortcut ─────────────────────────────────────────────────────────────────

export type HelpOverlayShortcutProps = {
  /**
   * Either a single combo (`'mod+k'`) or a sequence of combos to press in
   * order (`['g', 'h']`). For chord display, separate parts with `+`
   * inside each string.
   */
  keys: string | string[];
  description: ReactNode;
  className?: string;
};

const HelpOverlayShortcut = ({ keys, description, className }: HelpOverlayShortcutProps) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const sequence = Array.isArray(keys) ? keys : [keys];

  return (
    <li className={clsx('flex items-center justify-between gap-3 py-1.5 text-sm', className)}>
      <span className="text-gray-700 dark:text-gray-300">{description}</span>
      <span className="flex shrink-0 items-center gap-1">
        {sequence.map((combo, idx) => {
          const parts = combo.split('+');
          return (
            <Fragment key={`${combo}-${idx}`}>
              {idx > 0 && (
                <span className="px-0.5 text-[10px] text-gray-400 uppercase dark:text-gray-500">
                  then
                </span>
              )}
              <span className="flex items-center gap-1">
                {parts.map((part, pIdx) => (
                  <Fragment key={`${part}-${pIdx}`}>
                    {pIdx > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
                    )}
                    <Kbd>{formatKey(part, isMac)}</Kbd>
                  </Fragment>
                ))}
              </span>
            </Fragment>
          );
        })}
      </span>
    </li>
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const HelpOverlay = Object.assign(HelpOverlayRoot, {
  Section: HelpOverlaySection,
  Shortcut: HelpOverlayShortcut,
});
