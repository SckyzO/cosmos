import { Command, useCommandState } from 'cmdk';
import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { createPortal } from 'react-dom';
import { isTypingTarget, matchesHotkey } from './hotkey';

// ── Root (wraps cmdk's Command.Dialog) ───────────────────────────────────────

export type CommandPaletteProps = ComponentPropsWithoutRef<typeof Command.Dialog> & {
  /**
   * Optional global hotkey that toggles the palette open/closed when the
   * matching keyboard combination is pressed. Common values: `'mod+k'`
   * (Cmd on macOS, Ctrl elsewhere), `'mod+shift+p'`, `'/'`. Pass `null`
   * to skip registering a hotkey.
   */
  hotkey?: 'mod+k' | 'mod+/' | '/' | string | null;
};

const CommandPaletteRoot = ({
  hotkey = 'mod+k',
  open,
  onOpenChange,
  className,
  overlayClassName,
  contentClassName,
  children,
  label = 'Command palette',
  ...rest
}: CommandPaletteProps) => {
  useEffect(() => {
    if (!hotkey) return;
    // A bare key (`/`) is a character: leave it to whatever field is being typed in.
    const bareKey = !/\b(mod|meta|cmd|ctrl|alt|option)\b/i.test(hotkey);
    const handler = (e: KeyboardEvent) => {
      if (bareKey && isTypingTarget(e.target)) return;
      if (matchesHotkey(e, hotkey)) {
        e.preventDefault();
        onOpenChange?.(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [hotkey, open, onOpenChange]);

  // Escape: the Radix dialog under cmdk closes in the capture phase and prevents
  // the default, which the overlay stack (`useOverlayLayer`) takes as handled, so
  // one Escape closes the palette and leaves a modal under it open.
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      overlayClassName={clsx(
        'fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm',
        overlayClassName
      )}
      contentClassName={clsx(
        'fixed top-[20%] left-1/2 z-[9999] w-[640px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900',
        contentClassName
      )}
      className={className}
      {...rest}
    >
      {children}
    </Command.Dialog>
  );
};

// ── Input ────────────────────────────────────────────────────────────────────

export type CommandPaletteInputProps = ComponentPropsWithRef<typeof Command.Input> & {
  /**
   * Shows a close button at the end of the input, which calls this (usually
   * `() => onOpenChange(false)`). No button without it.
   */
  onClose?: () => void;
};

function CommandPaletteInput({ className, onClose, ref, ...rest }: CommandPaletteInputProps) {
  return (
    <div className="focus-within:border-brand-500 flex items-center gap-3 border-b border-gray-100 px-4 dark:border-gray-800">
      <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <Command.Input
        ref={ref}
        className={clsx(
          'h-ctrl-48 flex w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-400',
          className
        )}
        {...rest}
      />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-visible:focus-indicator h-ctrl-28 w-ctrl-28 flex shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────

export type CommandPaletteListProps = ComponentPropsWithRef<typeof Command.List>;

// A `listbox` owns options and groups only, and the loading indicator of `cmdk` is a
// `progressbar` (`aria-required-children`). The list keeps a slot right after the listbox,
// and `CommandPalette.Loading` renders there, wherever it was written in the list, and so
// does `CommandPalette.Empty`: a search with no match leaves the listbox with no option, so
// the list is hidden then and the message sits outside it.
// `undefined`: not in a list. `null`: the list has not mounted its slot yet.
const LoadingSlotContext = createContext<HTMLElement | null | undefined>(undefined);

function CommandPaletteList({ className, ref, ...rest }: CommandPaletteListProps) {
  const [loadingSlot, setLoadingSlot] = useState<HTMLDivElement | null>(null);
  const noMatch = useCommandState((state) => state.filtered.count === 0);
  return (
    <LoadingSlotContext.Provider value={loadingSlot}>
      <Command.List
        ref={ref}
        hidden={noMatch || undefined}
        className={clsx('max-h-[420px] overflow-y-auto p-2', className)}
        {...rest}
      />
      <div ref={setLoadingSlot} />
    </LoadingSlotContext.Provider>
  );
}

// ── Group ────────────────────────────────────────────────────────────────────

export type CommandPaletteGroupProps = ComponentPropsWithRef<typeof Command.Group>;

function CommandPaletteGroup({ className, ref, ...rest }: CommandPaletteGroupProps) {
  return (
    <Command.Group
      ref={ref}
      className={clsx(
        '[&_[cmdk-group-heading]]:text-2xs px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase dark:[&_[cmdk-group-heading]]:text-gray-400',
        className
      )}
      {...rest}
    />
  );
}

// ── Item ─────────────────────────────────────────────────────────────────────

export type CommandPaletteItemProps = Omit<
  ComponentPropsWithRef<typeof Command.Item>,
  'children'
> & {
  icon?: ElementType;
  /** Right-aligned keyboard shortcut hint (e.g. "⌘D"). */
  shortcut?: ReactNode;
  /** Second line under the label: what the command does. The item stays one line without it. */
  description?: ReactNode;
  /** Trailing text before the shortcut: a path, a count, a type. */
  meta?: ReactNode;
  children: ReactNode;
};

function CommandPaletteItem({
  icon: Icon,
  shortcut,
  description,
  meta,
  children,
  className,
  ref,
  ...rest
}: CommandPaletteItemProps) {
  return (
    <Command.Item
      ref={ref}
      className={clsx(
        'py-row-8 flex cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition-colors outline-none select-none',
        'data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900',
        'dark:text-gray-200 dark:data-[selected=true]:bg-white/5 dark:data-[selected=true]:text-white',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
        className
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description && (
          <span className="text-2xs block truncate text-gray-600 dark:text-gray-400">
            {description}
          </span>
        )}
      </span>
      {meta && (
        <span className="text-2xs max-w-[40%] shrink-0 truncate text-gray-600 dark:text-gray-400">
          {meta}
        </span>
      )}
      {shortcut && (
        <kbd className="text-3xs shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

function CommandPaletteSeparator({
  className,
  alwaysRender,
  ref,
  ...rest
}: Omit<ComponentPropsWithRef<typeof Command.Separator>, 'asChild'>) {
  // The separator of `cmdk` is `role="separator"`, which a `listbox` may not own
  // (`aria-required-children`), and it can't be overridden. Between groups, a rule is only
  // visual: hidden from assistive technology, and hidden while searching, as `cmdk`'s is.
  const searching = useCommandState((state) => state.search !== '');
  if (searching && !alwaysRender) return null;
  return (
    <div
      ref={ref}
      cmdk-separator=""
      aria-hidden
      className={clsx('my-1 h-px bg-gray-100 dark:bg-gray-800', className)}
      {...rest}
    />
  );
}

// ── Empty ────────────────────────────────────────────────────────────────────

function CommandPaletteEmpty({
  className,
  ref,
  ...rest
}: ComponentPropsWithRef<typeof Command.Empty>) {
  const slot = useContext(LoadingSlotContext);
  if (slot === null) return null;
  const empty = (
    <Command.Empty
      ref={ref}
      className={clsx('px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400', className)}
      {...rest}
    />
  );
  return slot ? createPortal(empty, slot) : empty;
}

// ── Loading ──────────────────────────────────────────────────────────────────

function CommandPaletteLoading({
  className,
  ref,
  ...rest
}: ComponentPropsWithRef<typeof Command.Loading>) {
  const slot = useContext(LoadingSlotContext);
  if (slot === null) return null;
  const loading = (
    <Command.Loading
      ref={ref}
      className={clsx('px-2 py-6 text-center text-xs text-gray-500 dark:text-gray-400', className)}
      {...rest}
    />
  );
  return slot ? createPortal(loading, slot) : loading;
}

// ── Footer (Cosmos addition — keyboard hints) ────────────────────────────────

export type CommandPaletteFooterProps = {
  className?: string;
  children: ReactNode;
};

const CommandPaletteFooter = ({ className, children }: CommandPaletteFooterProps) => (
  <div
    className={clsx(
      'text-2xs flex items-center justify-between border-t border-gray-100 px-4 py-2 text-gray-500 dark:border-gray-800 dark:text-gray-400',
      className
    )}
  >
    {children}
  </div>
);

// ── Compound export ──────────────────────────────────────────────────────────

export const CommandPalette = Object.assign(CommandPaletteRoot, {
  Input: CommandPaletteInput,
  List: CommandPaletteList,
  Group: CommandPaletteGroup,
  Item: CommandPaletteItem,
  Separator: CommandPaletteSeparator,
  Empty: CommandPaletteEmpty,
  Loading: CommandPaletteLoading,
  Footer: CommandPaletteFooter,
});
