import { Command } from 'cmdk';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ElementType,
  type ReactNode,
} from 'react';

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

const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
  // Lightweight matcher: lowercase, split on '+', check each modifier + key.
  const parts = hotkey.toLowerCase().split('+');
  const expectMod = parts.includes('mod');
  const expectMeta = parts.includes('meta') || parts.includes('cmd');
  const expectCtrl = parts.includes('ctrl');
  const expectShift = parts.includes('shift');
  const expectAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1];

  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  if (expectMod && !modPressed) return false;
  if (expectMeta && !e.metaKey) return false;
  if (expectCtrl && !e.ctrlKey) return false;
  if (expectShift && !e.shiftKey) return false;
  if (expectAlt && !e.altKey) return false;
  return e.key.toLowerCase() === key;
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
    const handler = (e: KeyboardEvent) => {
      if (matchesHotkey(e, hotkey)) {
        e.preventDefault();
        onOpenChange?.(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [hotkey, open, onOpenChange]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      overlayClassName={clsx(
        'fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm',
        overlayClassName,
      )}
      contentClassName={clsx(
        'fixed left-1/2 top-[20%] z-[9999] w-[640px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900',
        contentClassName,
      )}
      className={className}
      {...rest}
    >
      {children}
    </Command.Dialog>
  );
};

// ── Input ────────────────────────────────────────────────────────────────────

export type CommandPaletteInputProps = ComponentPropsWithoutRef<typeof Command.Input>;

const CommandPaletteInput = forwardRef<
  ElementRef<typeof Command.Input>,
  CommandPaletteInputProps
>(function CommandPaletteInput({ className, ...rest }, ref) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-gray-800">
      <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <Command.Input
        ref={ref}
        className={clsx(
          'flex h-12 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white',
          className,
        )}
        {...rest}
      />
    </div>
  );
});

// ── List ─────────────────────────────────────────────────────────────────────

export type CommandPaletteListProps = ComponentPropsWithoutRef<typeof Command.List>;

const CommandPaletteList = forwardRef<
  ElementRef<typeof Command.List>,
  CommandPaletteListProps
>(function CommandPaletteList({ className, ...rest }, ref) {
  return (
    <Command.List
      ref={ref}
      className={clsx('max-h-[420px] overflow-y-auto p-2', className)}
      {...rest}
    />
  );
});

// ── Group ────────────────────────────────────────────────────────────────────

export type CommandPaletteGroupProps = ComponentPropsWithoutRef<typeof Command.Group>;

const CommandPaletteGroup = forwardRef<
  ElementRef<typeof Command.Group>,
  CommandPaletteGroupProps
>(function CommandPaletteGroup({ className, ...rest }, ref) {
  return (
    <Command.Group
      ref={ref}
      className={clsx(
        'px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400 dark:[&_[cmdk-group-heading]]:text-gray-500',
        className,
      )}
      {...rest}
    />
  );
});

// ── Item ─────────────────────────────────────────────────────────────────────

export type CommandPaletteItemProps = Omit<
  ComponentPropsWithoutRef<typeof Command.Item>,
  'children'
> & {
  icon?: ElementType;
  /** Right-aligned keyboard shortcut hint (e.g. "⌘D"). */
  shortcut?: ReactNode;
  children: ReactNode;
};

const CommandPaletteItem = forwardRef<
  ElementRef<typeof Command.Item>,
  CommandPaletteItemProps
>(function CommandPaletteItem({ icon: Icon, shortcut, children, className, ...rest }, ref) {
  return (
    <Command.Item
      ref={ref}
      className={clsx(
        'flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 outline-none transition-colors',
        'data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900',
        'dark:text-gray-200 dark:data-[selected=true]:bg-white/5 dark:data-[selected=true]:text-white',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <kbd className="shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
});

// ── Separator ────────────────────────────────────────────────────────────────

const CommandPaletteSeparator = forwardRef<
  ElementRef<typeof Command.Separator>,
  ComponentPropsWithoutRef<typeof Command.Separator>
>(function CommandPaletteSeparator({ className, ...rest }, ref) {
  return (
    <Command.Separator
      ref={ref}
      className={clsx('my-1 h-px bg-gray-100 dark:bg-gray-800', className)}
      {...rest}
    />
  );
});

// ── Empty ────────────────────────────────────────────────────────────────────

const CommandPaletteEmpty = forwardRef<
  ElementRef<typeof Command.Empty>,
  ComponentPropsWithoutRef<typeof Command.Empty>
>(function CommandPaletteEmpty({ className, ...rest }, ref) {
  return (
    <Command.Empty
      ref={ref}
      className={clsx(
        'px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400',
        className,
      )}
      {...rest}
    />
  );
});

// ── Loading ──────────────────────────────────────────────────────────────────

const CommandPaletteLoading = forwardRef<
  ElementRef<typeof Command.Loading>,
  ComponentPropsWithoutRef<typeof Command.Loading>
>(function CommandPaletteLoading({ className, ...rest }, ref) {
  return (
    <Command.Loading
      ref={ref}
      className={clsx(
        'px-2 py-6 text-center text-xs text-gray-500 dark:text-gray-400',
        className,
      )}
      {...rest}
    />
  );
});

// ── Footer (Cosmos addition — keyboard hints) ────────────────────────────────

export type CommandPaletteFooterProps = {
  className?: string;
  children: ReactNode;
};

const CommandPaletteFooter = ({ className, children }: CommandPaletteFooterProps) => (
  <div
    className={clsx(
      'flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400',
      className,
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
