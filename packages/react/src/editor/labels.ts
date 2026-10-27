import { ACTION_SPECS, type RichTextAction } from './actions';

/** Every text the editor draws itself, so a host can translate it. All optional. */
export type RichTextLabels = Partial<Record<RichTextAction, string>> & {
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
};

export type ResolvedLabels = Record<RichTextAction, string> &
  Required<Omit<RichTextLabels, RichTextAction>>;

const DEFAULTS = {
  toolbar: 'Text formatting',
  linkUrl: 'Link URL',
  linkDialog: 'Edit link',
  linkApply: 'Apply',
  linkRemove: 'Remove link',
  linkInvalid: 'Enter an http(s), mailto or relative link.',
};

export const resolveLabels = (labels: RichTextLabels = {}): ResolvedLabels => {
  const actions = Object.fromEntries(
    (Object.keys(ACTION_SPECS) as RichTextAction[]).map((action) => [
      action,
      labels[action] ?? ACTION_SPECS[action].label,
    ])
  ) as Record<RichTextAction, string>;
  return {
    ...actions,
    toolbar: labels.toolbar ?? DEFAULTS.toolbar,
    linkUrl: labels.linkUrl ?? DEFAULTS.linkUrl,
    linkDialog: labels.linkDialog ?? DEFAULTS.linkDialog,
    linkApply: labels.linkApply ?? DEFAULTS.linkApply,
    linkRemove: labels.linkRemove ?? DEFAULTS.linkRemove,
    linkInvalid: labels.linkInvalid ?? DEFAULTS.linkInvalid,
  };
};
