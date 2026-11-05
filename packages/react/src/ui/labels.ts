// The English the ui components write, their part of `CosmosLabels` (`englishLabels`).

import type { CosmosThemeChoice } from '../settings/appearance';

export type AlertBannerLabels = {
  /** Name of the close button, shown with `onDismiss`. Default `Dismiss alert`. */
  dismiss: string;
};

export type AnnouncementBarLabels = {
  /** Name of the close button, shown with `dismissible`. Default `Dismiss announcement`. */
  dismiss: string;
};

export type AvatarGroupLabels = {
  /** Name of the "+N" that stands for the people left out. Default `1 more person`, `3 more people`. */
  overflow: (hidden: number) => string;
};

export type BackToTopFabLabels = {
  /** Name of the button. Default `Back to top`. */
  label: string;
};

export type CarouselLabels = {
  /** Name of the previous arrow. Default `Previous slide`. */
  previous: string;
  /** Name of the next arrow. Default `Next slide`. */
  next: string;
  /** Name of the dot or thumbnail of the 1-based `position`. Default `Go to slide 3`. */
  goTo: (position: number) => string;
  /** Name of the strip of thumbnails. Default `Slide thumbnails`. */
  thumbnails: string;
};

export type ClipboardLabels = {
  /** Name and text of the button. Default `Copy`. */
  copy: string;
  /** Name and text of the button once the value is copied. Default `Copied!` */
  copied: string;
};

export type CodeBlockLabels = {
  /** What a block with no file name and no language is called. Default `Code`. */
  untitled: string;
  /** Name of the scrolling code region, from the file name, the language or `untitled`. Default `app.ts, code`. */
  region: (name: string) => string;
};

export type CommandPaletteLabels = {
  /** Name of the dialog when the host gives no `label`. Default `Command palette`. */
  dialog: string;
  /** Name of the close button of the input. Default `Close`. */
  close: string;
};

export type CommandPaletteTriggerLabels = {
  /** The text of the field-like button. Below `sm` it is read out only. Default `Search…`. */
  placeholder: string;
};

export type ConfirmationModalLabels = {
  /** The title when the host gives none. Default `Unsaved changes`. */
  title: string;
  /** The message when the host gives none. Default `You have unsaved changes. What would you like to do?` */
  message: string;
  /** The button that closes the dialog and changes nothing. Default `Stay`. */
  stay: string;
  /** The button that calls `onDiscard`. Default `Discard`. */
  discard: string;
  /** The button that calls `onSave`. Default `Save & go`. */
  save: string;
  /** Label of the field that gates the discard button, from the `requireText`. Default `Type "name" to confirm`. */
  requireText: (text: string) => string;
  /** Name of the close icon. Default `Close`. */
  close: string;
};

export type CookieBannerLabels = {
  /** The title when the host gives none. Default `We use cookies`. */
  title: string;
  /** The settings button, shown with `onSettings`. Default `Cookie settings`. */
  settings: string;
  /** The deny button, shown with `onDeny`. Default `Deny all`. */
  deny: string;
  /** The accept button. Default `Accept all`. */
  accept: string;
};

export type DrawerLabels = {
  /** Name of the close buttons (the header's and the one on the scrim). Default `Close drawer`. */
  close: string;
};

export type DropdownLabels = {
  /** The trigger's text when nothing is selected and the host gives no `placeholder` or `label`. Default `Select…`. */
  placeholder: string;
};

export type HelpOverlayLabels = {
  /** The title when the host gives none. Default `Keyboard shortcuts`. */
  title: string;
  /** Name of the close button. Default `Close keyboard shortcuts`. */
  close: string;
  /** The words before the Esc key in the footer hint. Default `Press`. */
  closeHintBefore: string;
  /** The words after the Esc key in the footer hint. Default `to close`. */
  closeHintAfter: string;
  /** Between the two combos of a sequence (`g` then `h`). Default `then`. */
  then: string;
};

export type LightboxLabels = {
  /** Name of the viewer. Default `Picture viewer`. */
  viewer: string;
  /** Name of the previous arrow. Default `Previous picture`. */
  previous: string;
  /** Name of the next arrow. Default `Next picture`. */
  next: string;
  /** Name of the close button. Default `Close`. */
  close: string;
  /** What is read out when the picture changes, from the 1-based `position`. Default `Picture 3 of 12`. */
  counter: (position: number, total: number) => string;
  /** Name of the strip of thumbnails. Default `Picture thumbnails`. */
  thumbnails: string;
  /** Name of the thumbnail of the 1-based `position`. Default `Go to picture 3`. */
  thumbnail: (position: number, total: number) => string;
  /** Shown when a picture can't be loaded. Default `This picture could not be loaded.` */
  error: string;
  /** The button that loads the picture again. Default `Try again`. */
  retry: string;
};

export type ModalLabels = {
  /** Name of the close button of `Modal.Header`. Default `Close modal`. */
  close: string;
  /** The primary button of `Modal.Alert`. Default `OK`. */
  confirm: string;
};

export type NotificationCardLabels = {
  /** Name of the close button, shown with `onDismiss`. Default `Dismiss notification`. */
  dismiss: string;
};

export type NotificationRowLabels = {
  /** Read out before the title of an unread row. Default `Unread:`. */
  unread: string;
  /** The badge of a `danger` row when the host gives no `badgeLabel`. Default `CRIT`. */
  crit: string;
  /** The badge of a `warning` row. Default `WARN`. */
  warn: string;
  /** The badge of an `info` row. Default `INFO`. */
  info: string;
  /** The badge of a `success` row. Default `OK`. */
  ok: string;
};

export type NotificationsPanelLabels = {
  /**
   * Name of the trigger. `count` is the number as the badge shows it (`9999+` past 9999) and ''
   * when there is none. Default `Notifications`, `Notifications (muted), 12`.
   */
  trigger: (count: string, muted: boolean) => string;
  /** Name of the panel. Default `Notifications`. */
  panel: string;
  /** The button of the header, shown with `onMarkAllRead`. Default `Mark all as read`. */
  markAllRead: string;
  /** The title of `Empty` when the host gives none. Default `No active alerts`. */
  emptyTitle: string;
  /** The line under it when the host gives none. Default `All systems nominal.` */
  emptySubtitle: string;
};

export type ProgressBarLabels = {
  /** What is left on the track of a segmented bar, when `free.label` is not given. Default `Free`. */
  free: string;
};

export type RatingLabels = {
  /** Name of the group of stars when the host gives no `label`. Default `Rating`. */
  group: string;
  /** Name of a read-only rating with no `label`. Default `Rated 4.5 out of 5`. */
  rated: (value: number, max: number) => string;
  /** Name of a read-only rating, from its `label`. Default `Product: 4.5 out of 5`. */
  ratedSubject: (subject: string, value: number, max: number) => string;
  /** Name of the star (or half star) that picks `value`. Default `1 star`, `3.5 stars`. */
  star: (value: number) => string;
};

export type RefreshButtonLabels = {
  /** The text of the button. Default `Refresh`. */
  refresh: string;
  /** Name of the button that opens the intervals. Default `Choose refresh interval`. */
  chooseInterval: string;
  /** The default option that stops the refresh. Default `Off`. */
  off: string;
};

export type RowActionButtonLabels = {
  /** The text when the host gives no `children`. Default `View`. */
  view: string;
};

export type SecretValueLabels = {
  /** Name of the button that shows the secret, from its `label`. Default `Show API key`. */
  show: (label: string) => string;
  /** Name of the button that masks it again. Default `Hide API key`. */
  hide: (label: string) => string;
  /** Name of the copy button. Default `Copy API key`. */
  copy: (label: string) => string;
  /** Name of the copy button once the secret is copied. Default `Copied!` */
  copied: string;
};

export type SpinnerLabels = {
  /** Name of the spinner. Default `Loading`. */
  loading: string;
};

export type StatefulSaveButtonLabels = {
  /** The idle and dirty states. Default `Save Changes`. */
  save: string;
  /** The saving state. Default `Saving…`. */
  saving: string;
  /** The saved state. Default `Saved`. */
  saved: string;
  /** The error state, what the click does next. Default `Try again`. */
  retry: string;
};

export type TagLabels = {
  /** Name of the remove button, from the text of the tag (empty when it has none). Default `Remove Paris`, `Remove`. */
  remove: (name: string) => string;
};

/** What the click switches to, by the theme it goes to. Default `Switch to dark theme`… */
export type ThemeToggleLabels = Record<CosmosThemeChoice, string>;

export type ToasterLabels = {
  /** Name of the close button of a toast. Default `Close toast`. */
  close: string;
  /** Name of the region that holds the toasts, before the hotkey. Default `Notifications`. */
  region: string;
};

export type TooltipHelpLabels = {
  /** Name of the help button. Default `Help`. */
  label: string;
};

export type UnsavedIndicatorLabels = {
  /** The text. Default `Unsaved changes`. */
  unsaved: string;
};

export type UserMenuLabels = {
  /** Read out before the user's name in the trigger's name. Default `User menu for`. */
  trigger: string;
  /** Name of the menu. Default `User menu`. */
  menu: string;
};

export type VideoEmbedLabels = {
  /** Name of the play button of a `facade`, from the video's `title`. Default `Play Intro video`. */
  play: (title: string) => string;
};

export const ALERT_BANNER_LABELS: AlertBannerLabels = { dismiss: 'Dismiss alert' };

export const ANNOUNCEMENT_BAR_LABELS: AnnouncementBarLabels = { dismiss: 'Dismiss announcement' };

export const AVATAR_GROUP_LABELS: AvatarGroupLabels = {
  overflow: (hidden) => (hidden === 1 ? '1 more person' : `${hidden} more people`),
};

export const BACK_TO_TOP_FAB_LABELS: BackToTopFabLabels = { label: 'Back to top' };

export const CAROUSEL_LABELS: CarouselLabels = {
  previous: 'Previous slide',
  next: 'Next slide',
  goTo: (position) => `Go to slide ${position}`,
  thumbnails: 'Slide thumbnails',
};

export const CLIPBOARD_LABELS: ClipboardLabels = { copy: 'Copy', copied: 'Copied!' };

export const CODE_BLOCK_LABELS: CodeBlockLabels = {
  untitled: 'Code',
  region: (name) => `${name}, code`,
};

export const COMMAND_PALETTE_LABELS: CommandPaletteLabels = {
  dialog: 'Command palette',
  close: 'Close',
};

export const COMMAND_PALETTE_TRIGGER_LABELS: CommandPaletteTriggerLabels = {
  placeholder: 'Search…',
};

export const CONFIRMATION_MODAL_LABELS: ConfirmationModalLabels = {
  title: 'Unsaved changes',
  message: 'You have unsaved changes. What would you like to do?',
  stay: 'Stay',
  discard: 'Discard',
  save: 'Save & go',
  requireText: (text) => `Type "${text}" to confirm`,
  close: 'Close',
};

export const COOKIE_BANNER_LABELS: CookieBannerLabels = {
  title: 'We use cookies',
  settings: 'Cookie settings',
  deny: 'Deny all',
  accept: 'Accept all',
};

export const DRAWER_LABELS: DrawerLabels = { close: 'Close drawer' };

export const DROPDOWN_LABELS: DropdownLabels = { placeholder: 'Select…' };

export const HELP_OVERLAY_LABELS: HelpOverlayLabels = {
  title: 'Keyboard shortcuts',
  close: 'Close keyboard shortcuts',
  closeHintBefore: 'Press',
  closeHintAfter: 'to close',
  then: 'then',
};

export const LIGHTBOX_LABELS: LightboxLabels = {
  viewer: 'Picture viewer',
  previous: 'Previous picture',
  next: 'Next picture',
  close: 'Close',
  counter: (position, total) => `Picture ${position} of ${total}`,
  thumbnails: 'Picture thumbnails',
  thumbnail: (position) => `Go to picture ${position}`,
  error: 'This picture could not be loaded.',
  retry: 'Try again',
};

export const MODAL_LABELS: ModalLabels = { close: 'Close modal', confirm: 'OK' };

export const NOTIFICATION_CARD_LABELS: NotificationCardLabels = {
  dismiss: 'Dismiss notification',
};

export const NOTIFICATION_ROW_LABELS: NotificationRowLabels = {
  unread: 'Unread:',
  crit: 'CRIT',
  warn: 'WARN',
  info: 'INFO',
  ok: 'OK',
};

export const NOTIFICATIONS_PANEL_LABELS: NotificationsPanelLabels = {
  trigger: (count, muted) =>
    `${muted ? 'Notifications (muted)' : 'Notifications'}${count ? `, ${count}` : ''}`,
  panel: 'Notifications',
  markAllRead: 'Mark all as read',
  emptyTitle: 'No active alerts',
  emptySubtitle: 'All systems nominal.',
};

export const PROGRESS_BAR_LABELS: ProgressBarLabels = { free: 'Free' };

export const RATING_LABELS: RatingLabels = {
  group: 'Rating',
  rated: (value, max) => `Rated ${value} out of ${max}`,
  ratedSubject: (subject, value, max) => `${subject}: ${value} out of ${max}`,
  star: (value) => `${value} ${value === 1 ? 'star' : 'stars'}`,
};

export const REFRESH_BUTTON_LABELS: RefreshButtonLabels = {
  refresh: 'Refresh',
  chooseInterval: 'Choose refresh interval',
  off: 'Off',
};

export const ROW_ACTION_BUTTON_LABELS: RowActionButtonLabels = { view: 'View' };

export const SECRET_VALUE_LABELS: SecretValueLabels = {
  show: (label) => `Show ${label}`,
  hide: (label) => `Hide ${label}`,
  copy: (label) => `Copy ${label}`,
  copied: 'Copied!',
};

export const SPINNER_LABELS: SpinnerLabels = { loading: 'Loading' };

export const STATEFUL_SAVE_BUTTON_LABELS: StatefulSaveButtonLabels = {
  save: 'Save Changes',
  saving: 'Saving…',
  saved: 'Saved',
  retry: 'Try again',
};

export const TAG_LABELS: TagLabels = {
  remove: (name) => (name ? `Remove ${name}` : 'Remove'),
};

export const THEME_TOGGLE_LABELS: ThemeToggleLabels = {
  light: 'Switch to light theme',
  sand: 'Switch to sand theme',
  dark: 'Switch to dark theme',
  'deep-blue': 'Switch to deep blue theme',
  system: 'Switch to system theme',
};

export const TOASTER_LABELS: ToasterLabels = { close: 'Close toast', region: 'Notifications' };

export const TOOLTIP_HELP_LABELS: TooltipHelpLabels = { label: 'Help' };

export const UNSAVED_INDICATOR_LABELS: UnsavedIndicatorLabels = { unsaved: 'Unsaved changes' };

export const USER_MENU_LABELS: UserMenuLabels = {
  trigger: 'User menu for',
  menu: 'User menu',
};

export const VIDEO_EMBED_LABELS: VideoEmbedLabels = { play: (title) => `Play ${title}` };
