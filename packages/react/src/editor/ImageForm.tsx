import { clsx } from 'clsx';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../ui/Button';
import { Checkbox } from '../forms/Checkbox';
import { FIELD_PAD_X, FIELD_PAD_Y, FIELD_PLACEHOLDER, fieldClass } from '../forms/fieldRecipe';
import { imagePosition, selectedImage } from './image';
import { normalizeImageUrl } from './imageUrl';
import type { ResolvedLabels } from './labels';

type ImageFormProps = {
  editor: Editor;
  labels: ResolvedLabels;
  /** After the image was inserted or changed, or on Escape. */
  onDone: () => void;
  className?: string;
};

const LABEL = 'text-xs font-medium text-gray-700 dark:text-gray-300';
const ERROR = 'text-xs text-red-700 dark:text-red-400';

/**
 * The fields of the image button, in a popover (`toolbar`) or in place of the buttons (`bubble`):
 * the address, which must be http(s), and the description, the image's `alt`. A description is
 * required, or the image is marked decorative, which writes `alt=""`: an image never goes in
 * without one of the two. Not a `<form>`, for the reason `LinkForm` gives. Enter applies. With an
 * image selected, the fields open on it and apply to it; otherwise the image goes in after the
 * selection, which stays as it was.
 */
export function ImageForm({ editor, labels, onDone, className }: ImageFormProps) {
  const urlId = useId();
  const altId = useId();
  const urlErrorId = useId();
  const altErrorId = useId();
  const urlRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  // The image under the selection, read once, when the fields open.
  const [selected] = useState(() => selectedImage(editor));
  const [src, setSrc] = useState(selected?.src ?? '');
  const [alt, setAlt] = useState(selected?.alt ?? '');
  // An existing `alt=""` is a decorative image; a missing `alt` is one still to describe.
  const [decorative, setDecorative] = useState(selected?.alt === '');
  const [invalid, setInvalid] = useState<'url' | 'alt' | null>(null);

  const apply = () => {
    const address = normalizeImageUrl(src);
    if (!address) {
      setInvalid('url');
      urlRef.current?.focus();
      return;
    }
    const description = decorative ? '' : alt.trim();
    if (!decorative && !description) {
      setInvalid('alt');
      altRef.current?.focus();
      return;
    }
    const attrs = { src: address, alt: description };
    const chain = editor.chain().focus();
    const at = imagePosition(editor);
    if (selected) chain.updateAttributes('image', attrs);
    // The button is idle where no image can go, so this is the selection having moved there.
    else if (at !== undefined) chain.insertContentAt(at, { type: 'image', attrs });
    chain.run();
    onDone();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
  };

  const input = (side: 'url' | 'alt') =>
    clsx(
      'block w-full',
      fieldClass({ size: 'sm', invalid: invalid === side, fixedHeight: false }),
      FIELD_PAD_X.sm,
      FIELD_PAD_Y.sm,
      FIELD_PLACEHOLDER
    );

  return (
    <div
      role="group"
      aria-label={labels.imageDialog}
      className={clsx('flex flex-col gap-3', className)}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={urlId} className={LABEL}>
          {labels.imageUrl}
        </label>
        <input
          ref={urlRef}
          id={urlId}
          type="text"
          inputMode="url"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          // An address reads left to right, whatever the page does.
          dir="ltr"
          aria-invalid={invalid === 'url' || undefined}
          aria-describedby={invalid === 'url' ? urlErrorId : undefined}
          placeholder="https://"
          value={src}
          onChange={(e) => {
            setSrc(e.target.value);
            setInvalid(null);
          }}
          onKeyDown={onKeyDown}
          className={input('url')}
        />
        {invalid === 'url' && (
          <span id={urlErrorId} className={ERROR}>
            {labels.imageInvalid}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={altId} className={LABEL}>
          {labels.imageAlt}
        </label>
        <input
          ref={altRef}
          id={altId}
          type="text"
          autoComplete="off"
          disabled={decorative}
          aria-invalid={invalid === 'alt' || undefined}
          aria-describedby={invalid === 'alt' ? altErrorId : undefined}
          value={alt}
          onChange={(e) => {
            setAlt(e.target.value);
            setInvalid(null);
          }}
          onKeyDown={onKeyDown}
          className={clsx(input('alt'), 'disabled:cursor-not-allowed disabled:opacity-50')}
        />
        {invalid === 'alt' && (
          <span id={altErrorId} className={ERROR}>
            {labels.imageAltRequired}
          </span>
        )}
      </div>
      <Checkbox
        size="sm"
        label={labels.imageDecorative}
        checked={decorative}
        onChange={(checked) => {
          setDecorative(checked);
          setInvalid((was) => (was === 'alt' ? null : was));
        }}
      />
      <div className="flex items-center justify-end">
        <Button type="button" size="xs" onClick={apply}>
          {labels.imageApply}
        </Button>
      </div>
    </div>
  );
}
