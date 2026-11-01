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
import { directionOf } from '../hooks/direction';
import { mergeRefs } from '../ui/mergeRefs';
import { Menu } from '../ui/Menu';
import { Popover } from '../ui/Popover';
import { Tooltip } from '../ui/Tooltip';
import {
  ACTION_SPECS,
  ariaShortcut,
  shortcutKeys,
  type RichTextAction,
  type RichTextChoice,
  type RichTextForm,
} from './actions';
import { ImageForm } from './ImageForm';
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
   * The field that is open, if any (the link's, the image's). In a popover under its button
   * (`toolbar`), or in place of the buttons (`bubble`).
   */
  form: RichTextForm | null;
  onFormChange: (form: RichTextForm | null) => void;
  formMode: 'popover' | 'inline';
  /** Escape in the toolbar: the focus goes back to the text. */
  onEscape?: () => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * The buttons of `RichTextEditor` as one `role="toolbar"` and one Tab stop: the arrow keys, Home
 * and End move between them (roving tabindex). A button reports its state with `aria-pressed`, a
 * button with nothing to do (undo with no history) with `aria-disabled`, so it stays reachable.
 * A button opens a menu (the heading, the alignment) or a field (the link, the image).
 */
export function FormattingToolbar({
  editor,
  actions,
  labels,
  disabled,
  form,
  onFormChange,
  formMode,
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
            choice: ACTION_SPECS[action].menu?.current(current),
          },
        ])
      ) as Record<
        RichTextAction,
        { active: boolean; idle: boolean; choice: RichTextChoice | undefined }
      >,
  });
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const tabStop = Math.min(stop, actions.length - 1);

  const buttons = () =>
    Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button[data-rt-action]') ?? []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A menu or a popover is portaled out of the toolbar, but its events still bubble through it:
    // a key pressed there is that panel's own (Home and End move inside a menu).
    if (!(event.target instanceof Node) || !root.current?.contains(event.target)) return;
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }
    // A key typed in a field is that field's own.
    if (!(event.target instanceof HTMLButtonElement)) return;
    const list = buttons();
    const at = list.indexOf(event.target);
    // The buttons run along the line, so the arrows swap in right to left.
    const toEnd = directionOf(root.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const next =
      event.key === toEnd
        ? (at + 1) % list.length
        : event.key === (toEnd === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight')
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

  const field = (which: RichTextForm) => {
    const props = {
      editor,
      labels,
      onDone: () => onFormChange(null),
      className: formMode === 'inline' ? 'w-64 p-2' : undefined,
    };
    return which === 'link' ? <LinkForm {...props} /> : <ImageForm {...props} />;
  };

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={labels.toolbar}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={clsx('flex flex-wrap items-center gap-0.5', className)}
    >
      {formMode === 'inline' && form
        ? field(form)
        : actions.map((action, index) => {
            const spec = ACTION_SPECS[action];
            const { active, idle, choice } = state[action];
            const inert = disabled || idle;
            // A menu's button shows the item that is checked, when it is not the one at rest.
            const shown =
              active && spec.menu ? spec.menu.choices.find(({ id }) => id === choice) : undefined;
            const Icon = shown?.icon ?? spec.icon;
            const common = {
              'data-rt-action': action,
              'aria-label': labels[action],
              'aria-keyshortcuts': spec.shortcut && ariaShortcut(spec.shortcut),
              'aria-pressed': active,
              'aria-disabled': inert || undefined,
              tabIndex: index === tabStop ? 0 : -1,
              onFocus: () => setStop(index),
              // Keeps the focus, and so the selection, in the text on a mouse press.
              onMouseDown: (e: MouseEvent) => e.preventDefault(),
              className: clsx(BUTTON, active ? PRESSED : IDLE),
            };
            const icon = (
              <Icon
                aria-hidden
                className={clsx(
                  'h-4 w-4',
                  (shown ? shown.mirror : spec.mirror) && 'rtl:-scale-x-100'
                )}
              />
            );

            const tooltip = (child: ReactElement) => (
              <Tooltip
                key={action}
                content={labels[action]}
                shortcut={spec.shortcut && shortcutKeys(spec.shortcut)}
                position="top"
              >
                {child}
              </Tooltip>
            );

            if (spec.menu) {
              return (
                <Menu key={action}>
                  {tooltip(
                    <Menu.Trigger
                      {...common}
                      // A button with nothing to do stays reachable and opens nothing.
                      onClick={(e) => inert && e.preventDefault()}
                      onKeyDown={(e) => {
                        if (inert && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {icon}
                    </Menu.Trigger>
                  )}
                  <Menu.Content width="w-44">
                    {spec.menu.choices.map((item) => (
                      <Menu.RadioItem
                        key={item.id}
                        checked={item.id === choice}
                        aria-keyshortcuts={item.shortcut && ariaShortcut(item.shortcut)}
                        onSelect={() => item.run(editor)}
                      >
                        {labels[item.id]}
                      </Menu.RadioItem>
                    ))}
                  </Menu.Content>
                </Menu>
              );
            }
            if (spec.form && formMode === 'popover') {
              return (
                <Popover
                  key={action}
                  open={form === spec.form && !inert}
                  onOpenChange={(open) => onFormChange(open ? (spec.form ?? null) : null)}
                >
                  {tooltip(<Popover.Trigger {...common}>{icon}</Popover.Trigger>)}
                  <Popover.Content
                    aria-label={spec.form === 'image' ? labels.imageDialog : labels.linkDialog}
                    position="bottom"
                    width={spec.form === 'image' ? 'w-80' : 'w-72'}
                    padding="p-3"
                  >
                    {field(spec.form)}
                  </Popover.Content>
                </Popover>
              );
            }
            if (spec.form) {
              const opens = spec.form;
              return tooltip(
                <button type="button" {...common} onClick={() => !inert && onFormChange(opens)}>
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
