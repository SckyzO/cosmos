import { ACTION_SPECS, type RichTextAction, type RichTextChoice } from './actions';

type Named = RichTextAction | RichTextChoice;

/**
 * Every text the editor draws itself, so a host can translate it. All optional. The buttons are
 * named by their action (`bold`, `heading`, `align`, `image`…) and the items of the heading and
 * alignment menus by their choice (`paragraph`, `heading1`, `alignCenter`…).
 */
export type RichTextLabels = Partial<Record<Named, string>> & {
  /** Accessible name of the toolbar. Default `Text formatting`. */
  toolbar?: string;
  /** Accessible name of the field where a link's URL is typed. Default `Link URL`. */
  linkUrl?: string;
  /** Accessible name of the link popover. Default `Edit link`. */
  linkDialog?: string;
  /** Default `Apply`. */
  linkApply?: string;
  /** Default `Remove link`. */
  linkRemove?: string;
  /** Shown when the URL is refused. Default `Enter an http(s), mailto or relative link.` */
  linkInvalid?: string;
  /** Accessible name of the image popover. Default `Image details`. */
  imageDialog?: string;
  /** Label of the field where an image's URL is typed. Default `Image URL`. */
  imageUrl?: string;
  /** Label of the description field, the image's `alt`. Default `Description (alt text)`. */
  imageAlt?: string;
  /** Label of the box that marks an image as decorative. Default `Decorative image, no description`. */
  imageDecorative?: string;
  /** Default `Apply`. */
  imageApply?: string;
  /** Shown when the URL is refused. Default `Enter an http(s) image address.` */
  imageInvalid?: string;
  /** Shown when an image has no description and is not marked decorative. Default `Describe the image, or mark it decorative.` */
  imageAltRequired?: string;
};

export type ResolvedLabels = Record<Named, string> & Required<Omit<RichTextLabels, Named>>;

const DEFAULTS = {
  toolbar: 'Text formatting',
  linkUrl: 'Link URL',
  linkDialog: 'Edit link',
  linkApply: 'Apply',
  linkRemove: 'Remove link',
  linkInvalid: 'Enter an http(s), mailto or relative link.',
  imageDialog: 'Image details',
  imageUrl: 'Image URL',
  imageAlt: 'Description (alt text)',
  imageDecorative: 'Decorative image, no description',
  imageApply: 'Apply',
  imageInvalid: 'Enter an http(s) image address.',
  imageAltRequired: 'Describe the image, or mark it decorative.',
};

// The name of each button, then of each item of the menus they open: what `labels` replaces.
const NAMED_DEFAULTS = Object.fromEntries([
  ...Object.entries(ACTION_SPECS).map(([action, spec]) => [action, spec.label]),
  ...Object.values(ACTION_SPECS).flatMap(({ menu }) =>
    (menu?.choices ?? []).map((choice) => [choice.id, choice.label])
  ),
]) as Record<Named, string>;

export const resolveLabels = (labels: RichTextLabels = {}): ResolvedLabels => {
  const named = Object.fromEntries(
    (Object.keys(NAMED_DEFAULTS) as Named[]).map((key) => [key, labels[key] ?? NAMED_DEFAULTS[key]])
  ) as Record<Named, string>;
  return {
    ...named,
    toolbar: labels.toolbar ?? DEFAULTS.toolbar,
    linkUrl: labels.linkUrl ?? DEFAULTS.linkUrl,
    linkDialog: labels.linkDialog ?? DEFAULTS.linkDialog,
    linkApply: labels.linkApply ?? DEFAULTS.linkApply,
    linkRemove: labels.linkRemove ?? DEFAULTS.linkRemove,
    linkInvalid: labels.linkInvalid ?? DEFAULTS.linkInvalid,
    imageDialog: labels.imageDialog ?? DEFAULTS.imageDialog,
    imageUrl: labels.imageUrl ?? DEFAULTS.imageUrl,
    imageAlt: labels.imageAlt ?? DEFAULTS.imageAlt,
    imageDecorative: labels.imageDecorative ?? DEFAULTS.imageDecorative,
    imageApply: labels.imageApply ?? DEFAULTS.imageApply,
    imageInvalid: labels.imageInvalid ?? DEFAULTS.imageInvalid,
    imageAltRequired: labels.imageAltRequired ?? DEFAULTS.imageAltRequired,
  };
};
