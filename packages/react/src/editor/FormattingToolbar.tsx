import { clsx } from 'clsx';
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { mergeRefs } from '../ui/mergeRefs';
import { Popover } from '../ui/Popover';
import { Tooltip } from '../ui/Tooltip';
import { ACTION_SPECS, ariaShortcut, shortcutKeys, type RichTextAction } from './actions';
import { LinkForm } from './LinkForm';
import type { ResolvedLabels } from './labels';

const BUTTON =
  'focus-visible:focus-indicator flex size-ctrl-28 shrink-0 items-center justify-center rounded-md transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-40';
const PRESSED = 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400';
const IDLE =
  'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 aria-disabled:hover:bg-transparent dark:aria-disabled:hover:bg-transparent';

type FormattingToolbarProps = {
  editor: Editor;
  actions: readonly RichTextAction[];
  labels: ResolvedLabels;
  /** Buttons stay, but do nothing. */
  disabled: boolean;
  /**
   * Whether the link field is open. In a popover under the button (`toolbar`), or in place of
   * the buttons (`bubble`).
   */
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
  linkMode: 'popover' | 'inline';
  /** Escape in the toolbar: the focus goes back to the text. */
  onEscape?: () => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * The buttons of `RichTextEditor` as one `role="toolbar"` and one Tab stop: the arrow keys, Home
 * and End move between them (roving tabindex). A button reports its state with `aria-pressed`, a
 * button with nothing to do (undo with no history) with `aria-disabled`, so it stays reachable.
 */
export function FormattingToolbar({
  editor,
  actions,
  labels,
  disabled,
  linkOpen,
  onLinkOpenChange,
  linkMode,
  onEscape,
  className,
  ref,
}: FormattingToolbarProps) {
  const root = useRef<HTMLDivElement | null>(null);
  const [stop, setStop] = useState(0);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      Object.fromEntries(
        actions.map((action) => [
          action,
          {
            active: ACTION_SPECS[action].isActive(current),
            idle: ACTION_SPECS[action].isIdle?.(current) ?? false,
          },
        ])
      ) as Record<RichTextAction, { active: boolean; idle: boolean }>,
  });
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const tabStop = Math.min(stop, actions.length - 1);

  const buttons = () =>
    Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button[data-rt-action]') ?? []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }
    // A key typed in the link field is that field's own.
    if (!(event.target instanceof HTMLButtonElement)) return;
    const list = buttons();
    const at = list.indexOf(event.target);
    const next =
      event.key === 'ArrowRight'
        ? (at + 1) % list.length
        : event.key === 'ArrowLeft'
          ? (at - 1 + list.length) % list.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? list.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    list[next]?.focus();
  };

  const linkField = (
    <LinkForm
      editor={editor}
      labels={labels}
      onDone={() => onLinkOpenChange(false)}
      className={linkMode === 'inline' ? 'w-64 p-2' : undefined}
    />
  );

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={labels.toolbar}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={clsx('flex flex-wrap items-center gap-0.5', className)}
    >
      {linkMode === 'inline' && linkOpen
        ? linkField
        : actions.map((action, index) => {
            const spec = ACTION_SPECS[action];
            const { active, idle } = state[action];
            const Icon = spec.icon;
            const inert = disabled || idle;
            const common = {
              'data-rt-action': action,
              'aria-label': labels[action],
              'aria-keyshortcuts': ariaShortcut(spec.shortcut),
              'aria-pressed': active,
              'aria-disabled': inert || undefined,
              tabIndex: index === tabStop ? 0 : -1,
              onFocus: () => setStop(index),
              // Keeps the focus, and so the selection, in the text on a mouse press.
              onMouseDown: (e: MouseEvent) => e.preventDefault(),
              className: clsx(BUTTON, active ? PRESSED : IDLE),
            };
            const icon = <Icon aria-hidden className="h-4 w-4" />;

            const tooltip = (child: ReactElement) => (
              <Tooltip
                key={action}
                content={labels[action]}
                shortcut={shortcutKeys(spec.shortcut)}
                position="top"
              >
                {child}
              </Tooltip>
            );

            if (action === 'link' && linkMode === 'popover') {
              return (
                <Popover key={action} open={linkOpen && !disabled} onOpenChange={onLinkOpenChange}>
                  {tooltip(<Popover.Trigger {...common}>{icon}</Popover.Trigger>)}
                  <Popover.Content
                    aria-label={labels.linkDialog}
                    position="bottom"
                    width="w-72"
                    padding="p-3"
                  >
                    {linkField}
                  </Popover.Content>
                </Popover>
              );
            }
            if (action === 'link') {
              return tooltip(
                <button
                  type="button"
                  {...common}
                  onClick={() => !disabled && onLinkOpenChange(true)}
                >
                  {icon}
                </button>
              );
            }
            return tooltip(
              <button type="button" {...common} onClick={() => !inert && spec.run?.(editor)}>
                {icon}
              </button>
            );
          })}
    </div>
  );
}
