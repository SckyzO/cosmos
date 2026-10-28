import { clsx } from 'clsx';
import { useId, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../ui/Button';
import { FIELD_PAD_X, FIELD_PAD_Y, FIELD_PLACEHOLDER, fieldClass } from '../forms/fieldRecipe';
import type { ResolvedLabels } from './labels';
import { normalizeLinkUrl } from './linkUrl';

type LinkFormProps = {
  editor: Editor;
  labels: ResolvedLabels;
  /** After the link was applied or removed, or on Escape. */
  onDone: () => void;
  className?: string;
};

/**
 * The URL field of the link button, in a popover (`toolbar`) or in place of the buttons
 * (`bubble`). Not a `<form>`: it can sit inside the host's own form, and a nested one is invalid.
 * Enter applies, a URL the editor's rule refuses is flagged and never reaches the document.
 */
export function LinkForm({ editor, labels, onDone, className }: LinkFormProps) {
  const errorId = useId();
  // The link under the caret, else nothing: read once, when the field opens.
  const [value, setValue] = useState(() => (editor.getAttributes('link').href as string) ?? '');
  const [invalid, setInvalid] = useState(false);
  const hasLink = editor.isActive('link');

  const apply = () => {
    const href = normalizeLinkUrl(value);
    if (!href) {
      setInvalid(true);
      return;
    }
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !hasLink) {
      // No text selected: the address itself becomes the link's text.
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] });
    } else {
      chain.extendMarkRange('link').setLink({ href });
    }
    chain.run();
    onDone();
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onDone();
  };

  return (
    <div
      role="group"
      aria-label={labels.linkDialog}
      className={clsx('flex flex-col gap-2', className)}
    >
      <input
        type="text"
        inputMode="url"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        aria-label={labels.linkUrl}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        placeholder="https://"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          } else if (e.key === 'Escape') {
            // The text keeps the focus, as when a bubble or a popover closes.
            e.preventDefault();
            e.stopPropagation();
            onDone();
            editor.commands.focus();
          }
        }}
        className={clsx(
          'block w-full',
          fieldClass({ size: 'sm', invalid, fixedHeight: false }),
          FIELD_PAD_X.sm,
          FIELD_PAD_Y.sm,
          FIELD_PLACEHOLDER
        )}
      />
      {invalid && (
        <span id={errorId} className="text-xs text-red-700 dark:text-red-400">
          {labels.linkInvalid}
        </span>
      )}
      <div className="flex items-center justify-end gap-2">
        {hasLink && (
          <Button type="button" variant="ghost" size="xs" onClick={remove}>
            {labels.linkRemove}
          </Button>
        )}
        <Button type="button" size="xs" onClick={apply}>
          {labels.linkApply}
        </Button>
      </div>
    </div>
  );
}
