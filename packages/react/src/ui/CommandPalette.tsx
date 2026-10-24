import { Command } from 'cmdk';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import {
  useEffect,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
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

export type CommandPaletteInputProps = ComponentPropsWithRef<typeof Command.Input>;

function CommandPaletteInput({ className, ref, ...rest }: CommandPaletteInputProps) {
  return (
    <div className="focus-within:border-brand-500 flex items-center gap-3 border-b border-gray-100 px-4 dark:border-gray-800">
      <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <Command.Input
        ref={ref}
        className={clsx(
          'flex h-12 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-400',
          className
        )}
        {...rest}
      />
    </div>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────

export type CommandPaletteListProps = ComponentPropsWithRef<typeof Command.List>;

function CommandPaletteList({ className, ref, ...rest }: CommandPaletteListProps) {
  return (
    <Command.List
      ref={ref}
      className={clsx('max-h-[420px] overflow-y-auto p-2', className)}
      {...rest}
    />
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
  children: ReactNode;
};

function CommandPaletteItem({
  icon: Icon,
  shortcut,
  children,
  className,
  ref,
  ...rest
}: CommandPaletteItemProps) {
  return (
    <Command.Item
      ref={ref}
      className={clsx(
        'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 transition-colors outline-none select-none',
        'data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900',
        'dark:text-gray-200 dark:data-[selected=true]:bg-white/5 dark:data-[selected=true]:text-white',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
        className
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
      <span className="flex-1 truncate">{children}</span>
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
  ref,
  ...rest
}: ComponentPropsWithRef<typeof Command.Separator>) {
  return (
    <Command.Separator
      ref={ref}
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
  return (
    <Command.Empty
      ref={ref}
      className={clsx('px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400', className)}
      {...rest}
    />
  );
}

// ── Loading ──────────────────────────────────────────────────────────────────

function CommandPaletteLoading({
  className,
  ref,
  ...rest
}: ComponentPropsWithRef<typeof Command.Loading>) {
  return (
    <Command.Loading
      ref={ref}
      className={clsx('px-2 py-6 text-center text-xs text-gray-500 dark:text-gray-400', className)}
      {...rest}
    />
  );
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
