// The English the form components write, their part of `CosmosLabels` (`englishLabels`).

import { createElement, Fragment, type ReactNode } from 'react';
import { formatBytes } from './formatBytes';

export type AvatarUploaderLabels = {
  /** The upload button while there is no photo. Default `Upload photo`. */
  upload: string;
  /** The upload button once there is a photo. Default `Change photo`. */
  change: string;
  /** The remove button, shown with `onRemove`. Default `Remove`. */
  remove: string;
  /** The line under the buttons when the host gives no `helperText`. Default `JPG, PNG or GIF — max 5 MB`. */
  helper: (maxSizeMB: number) => string;
  /** The error for a file that is not an image. Default `Please select an image file`. */
  notImage: string;
  /** The error for a file over the limit. Default `File too large — max 5 MB`. */
  tooLarge: (maxSizeMB: number) => string;
  /** The error when `onUpload` fails with something that carries no message. Default `Upload failed`. */
  failed: string;
  /** Name of the spinner shown while the file goes up. Default `Uploading`. */
  uploading: string;
  /** Name of the hidden file input. Default `Upload avatar`. */
  input: string;
};

/**
 * What a calendar writes: the names of its buttons, and of a day. The month and weekday names
 * come from react-day-picker's `locale`, not from here. A key the app gives reaches
 * react-day-picker as its `labels`; one it leaves out stays react-day-picker's, in the language
 * of the `locale` when that has its own.
 */
export type CalendarLabels = {
  /** Name of the navigation bar that holds the month buttons. Default `Navigation bar`. */
  navigation: string;
  /** Name of the button to the month before. Default `Go to the Previous Month`. */
  previousMonth: string;
  /** Name of the button to the month after. Default `Go to the Next Month`. */
  nextMonth: string;
  /** Name of the month dropdown, with `captionLayout="dropdown"`. Default `Choose the Month`. */
  monthDropdown: string;
  /** Name of the year dropdown, with `captionLayout="dropdown"`. Default `Choose the Year`. */
  yearDropdown: string;
  /**
   * Name of a day: `date` is its full date, written by the calendar's `locale`, `state` says if
   * it is today and if it is selected (a day with no `mode` is never). Default `Today, Thursday,
   * May 7th, 2026, selected`.
   */
  day: (date: string, state: { today: boolean; selected: boolean }) => string;
  /** Name of a week number, with `showWeekNumber`. Default `Week 12`. */
  weekNumber: (week: number) => string;
  /** Name of the column of week numbers. Default `Week Number`. */
  weekNumberHeader: string;
};

export type CardExpiryInputLabels = {
  /** The placeholder when the host gives none. Default `MM / YY`. */
  placeholder: string;
};

export type CardFieldsLabels = {
  /** Label of the number field. Default `Card number`. */
  number: string;
  /** Label of the expiry field. Default `Expiry date`. */
  expiry: string;
  /** Label of the security code field. Default `Security code`. */
  cvc: string;
};

export type ColorInputLabels = {
  /** Name of the group of swatches. Default `Preset colours`. */
  presets: string;
  /** Name of the hex field when it has no label of its own. Default `Hex value`. */
  hex: string;
  /** The error under a hex field left with an invalid draft. Default `Enter a hex colour, such as #14b8a6.` */
  invalid: string;
  /** Name of the default red swatch. Default `Red`. */
  red: string;
  /** Name of the default orange swatch. Default `Orange`. */
  orange: string;
  /** Name of the default amber swatch. Default `Amber`. */
  amber: string;
  /** Name of the default green swatch. Default `Green`. */
  green: string;
  /** Name of the default teal swatch. Default `Teal`. */
  teal: string;
  /** Name of the default blue swatch. Default `Blue`. */
  blue: string;
  /** Name of the default violet swatch. Default `Violet`. */
  violet: string;
  /** Name of the default pink swatch. Default `Pink`. */
  pink: string;
};

export type ComboboxLabels = {
  /** The line the open list shows when no option matches the typed text. Default `No matches found.` */
  empty: string;
  /**
   * With `allowCustomValue`, the line the open list shows when nothing matches: the typed text is
   * accepted, so the list stays closed unless this is set ("Press Enter to use this text."). None
   * by default.
   */
  emptyCustom?: string;
  /** Name of the button that opens and closes the list. Default `Toggle options`. */
  toggle: string;
};

export type DatePickerLabels = {
  /** The placeholder of the single date trigger when the host gives none. Default `Pick a date`. */
  placeholder: string;
  /** The placeholder of the start date trigger of a range. Default `Start date`. */
  fromPlaceholder: string;
  /** The placeholder of the end date trigger of a range. Default `End date`. */
  toPlaceholder: string;
  /** The word between the two triggers of a range. Default `to`. */
  to: string;
  /** The footer button that picks today, in `single` mode. Default `Today`. */
  today: string;
  /** The footer button that empties a range. Default `Clear`. */
  clear: string;
  /** The footer button that closes the calendar of a range. Default `Done`. */
  done: string;
  /** Name of the group of range presets. Default `Date range presets`. */
  presets: string;
  /** Name of the calendar panel when the field has no label. Default `Calendar`. */
  calendar: string;
  /** Name of the calendar panel of a field labelled `label`. Default `Due date calendar`. */
  calendarOf: (label: string) => string;
  /** Read after the label of a required field, for assistive technology only. Default `(required)`. */
  required: string;
};

export type DropzoneLabels = {
  /** The link-coloured start of the prompt. Default `Click to upload`. */
  upload: string;
  /** The rest of the prompt, after a space. Default `or drag and drop`. */
  orDrop: string;
  /** The error for a file of a type `accept` turns down. Default `"photo.gif" type not allowed (image/png).` */
  notAllowed: (name: string, accept: string) => string;
  /** The error for a file over `maxSize`; `size` is `maxSize` written by `fileSize`. Default `"photo.png" exceeds 2.0 MB.` */
  tooLarge: (name: string, size: string) => string;
  /** The error when a drop goes over `maxFiles`. Default `Too many files (max 3).` */
  tooMany: (max: number) => string;
  /** The `reason` of an `onReject` rejection for a type that is not allowed. Default `Type not allowed (image/png).` */
  reasonNotAllowed: (accept: string) => string;
  /** The `reason` of an `onReject` rejection for a file over `maxSize`. Default `Exceeds 2.0 MB.` */
  reasonTooLarge: (size: string) => string;
  /** The `reason` of an `onReject` rejection once the list is full. Default `Too many files (max 3).` */
  reasonTooMany: (max: number) => string;
  /** Name of the button that removes a file from the list. Default `Remove photo.png`. */
  remove: (name: string) => string;
  /** A size in bytes, as shown next to a file and in the errors. Default `2.0 MB`. */
  fileSize: (bytes: number) => string;
};

export type ErrorSummaryLabels = {
  /** The bold first line of the banner when the host gives no `title`. Default `There is a problem`. */
  title: string;
  /**
   * The sentence under the title. It gets the number of fields and a link to each, in order, and
   * returns what to draw around them. Default `Fix 3 fields and try again: A, B and C need
   * attention.` (`Fix 1 field and try again: A needs attention.`).
   */
  message: (count: number, links: ReactNode[]) => ReactNode;
};

export type FileInputLabels = {
  /** The button that opens the file picker. Default `Browse`. */
  browse: string;
  /** What the field says while no file is chosen, when the host gives no `placeholder`. Default `No file chosen`. */
  placeholder: string;
  /** One file chosen; `size` is `undefined` with `showSize={false}`. Default `report.pdf — 1.2 MB`. */
  file: (name: string, size?: string) => string;
  /** Several files chosen; `total` is `undefined` with `showSize={false}`. Default `3 files — 4.5 MB total`. */
  files: (count: number, total?: string) => string;
  /** A size in bytes. Default `1.2 MB`. */
  fileSize: (bytes: number) => string;
};

export type FormFooterLabels = {
  /** The cancel button, shown with `onCancel`. Default `Cancel`. */
  cancel: string;
  /** The submit button. Default `Save changes`. */
  submit: string;
};

/** The words of the editor, for another language. Every one has an English default. */
export type LineItemsLabels = {
  /** Column titles, and the names of the fields ("Quantity, line 2"). */
  item: string;
  quantity: string;
  rate: string;
  amount: string;
  /** Placeholder of the item field, whatever the editor holds: it wins over `selectItem` and `describeItem`. */
  itemPlaceholder?: string;
  /** Placeholder of the item field when there is a catalogue. Default `Select or type an item`. */
  selectItem: string;
  /** Placeholder of the item field when there is none. Default `Describe the item`. */
  describeItem: string;
  add: string;
  /** The row of the default totals block. */
  subtotal: string;
  emptyTitle: string;
  emptyDescription: string;
  /** The title of a line in the stacked layout. */
  line: (n: number) => string;
  /** The name of the field of `column` on line `n`. */
  fieldName: (column: string, n: number) => string;
  /** The name of the remove button of line `n`, whose item is `item` (possibly empty). */
  remove: (n: number, item: string) => string;
  /** Announced once line `n` is added, with the number of lines now. */
  added: (n: number, count: number) => string;
  /** Announced once line `n` is removed, with the number of lines left. */
  removed: (n: number, count: number) => string;
  /** Announced when a cell is committed and the subtotal changed. `amount` is written. */
  subtotalAnnouncement: (amount: string) => string;
};

export type MultiSelectLabels = {
  /** The line the open list shows when no option matches the typed text. Default `No matches found.` */
  empty: string;
  /** Name of the button that opens and closes the list. Default `Toggle options`. */
  toggle: string;
  /** The count while nothing is chosen. Default `None selected`. */
  none: string;
  /** The count. Default `2 selected`. */
  selected: (count: number) => string;
  /** The count with `maxItems`. Default `2 of 5 selected`. */
  selectedOfMax: (count: number, max: number) => string;
  /** Announced once an option is chosen, with the number chosen now. Default `Admin added, 2 selected`. */
  added: (label: string, count: number) => string;
  /** Announced once an option is removed, with the number chosen now. Default `Admin removed, 1 selected`. */
  removed: (label: string, count: number) => string;
};

export type NumberInputLabels = {
  /** Name of the button that adds a step. Default `Increase`. */
  increase: string;
  /** Name of the button that takes a step off. Default `Decrease`. */
  decrease: string;
};

export type OtpInputLabels = {
  /** Name of the group of cells when the host gives no `ariaLabel`. Default `Verification code`. */
  code: string;
  /** Name of one cell, from the name of the group and its place (`n`, from 1). Default `Verification code digit 2`. */
  digit: (name: string, n: number) => string;
};

export type PasswordInputLabels = {
  /** Name of the button that shows the password. Default `Show password`. */
  show: string;
  /** Name of the button that hides it again. Default `Hide password`. */
  hide: string;
};

/** What a screen reader hears after each rule, since the tick and the cross are drawn. */
export type PasswordPolicyLabels = {
  /** The title above the rules when the host gives no `title`. Default `Password requirements`. */
  title: string;
  /** The line shown when there is no rule. Default `No requirements defined.` */
  empty: string;
  /** Said after a rule that holds, for a screen reader only. Default `met`. */
  met: string;
  /** Said after a rule that does not hold, for a screen reader only. Default `not met`. */
  notMet: string;
};

export type PhoneInputLabels = {
  /** Name of the country button, before its visible text; `name` is the country. Default `Country: France,`. */
  country: (name: string) => string;
  /** Name of the search field of the list. Default `Search countries`. */
  searchCountries: string;
  /** Placeholder of that search field. Default `Search`. */
  search: string;
  /** Name of the list of countries. Default `Countries`. */
  countries: string;
  /** The line shown when no country matches. Default `No matches found.` */
  noMatches: string;
  /** The error under a number that is left with too few or too many digits. Default `Enter a phone number with 4 to 15 digits.` */
  invalid: string;
};

export type SearchInputLabels = {
  /** The placeholder when the host gives none. Default `Search…` */
  placeholder: string;
};

export type SliderLabels = {
  /** Name of the first handle of a range slider, from the name of the slider. Default `Price minimum`. */
  minimum: (name: string) => string;
  /** Name of the second handle of a range slider. Default `Price maximum`. */
  maximum: (name: string) => string;
};

export type TagInputLabels = {
  /** Name of the list of suggestions. Default `Suggestions`. */
  suggestions: string;
  /**
   * The helper line when the host gives no `helperText`: `keys` are the names of the
   * `separators`, in order (`Enter`, `comma`…). Default `Press Enter or comma to add a tag.`
   */
  helper: (keys: string[]) => string;
  /** The name of the comma key, in the helper line. Default `comma`. */
  comma: string;
  /** The name of the semicolon key, in the helper line. Default `semicolon`. */
  semicolon: string;
  /** The name of the space key, in the helper line. Default `space`. */
  space: string;
  /** The error under the field when `validate` turns `tag` down and the host gives no `invalidMessage`. Default `"abc" is not a valid tag.` */
  invalid: (tag: string) => string;
  /** The count shown with `maxTags`. Default `3 / 5`. */
  count: (count: number, max: number) => string;
  /** Shown in place of the count once `maxTags` is reached. Default `Limit reached`. */
  limit: string;
  /** The count read with the field, without `maxTags`. Default `1 tag`, `3 tags`. */
  tagCount: (count: number) => string;
  /** The count read with the field, with `maxTags`. Default `3 of 5 tags`. */
  tagCountOfMax: (count: number, max: number) => string;
  /** Announced once tags are added, with the number held now. Default `a, b added, 3 tags`. */
  added: (tags: string[], count: number) => string;
  /** Announced once a tag is removed, with the number held now. Default `a removed, 2 tags`. */
  removed: (tag: string, count: number) => string;
  /** Announced when the text typed is a tag already there. Default `design is already added`. */
  alreadyAdded: (tag: string) => string;
  /** Announced when `maxTags` is reached. Default `Maximum of 5 tags reached`. */
  maxReached: (max: number) => string;
};

export type UploadQueueLabels = {
  /** The title of the card and the name of the region when the host gives no `label`. Default `Uploads`. */
  title: string;
  /** How many uploads are done. Default `2 of 5 done`. */
  progress: (done: number, total: number) => string;
  /** The size line of a file on its way: what went up, the whole size, and the percentage. Default `1.2 MB of 4.5 MB · 27%`. */
  uploaded: (sent: string, total: string, percent: number) => string;
  /** Name of the progress bar of a file. Default `Upload progress of report.pdf`. */
  uploadProgress: (name: string) => string;
  /** The line of a failed upload that carries no `error`. Default `Upload failed.` */
  failed: string;
  /** The line of a finished upload. Default `Done`. */
  done: string;
  /** The line of an upload that has not started. Default `Waiting`. */
  waiting: string;
  /** The visible text of the retry button. Default `Retry`. */
  retry: string;
  /** Name of the retry button of a file. Default `Retry report.pdf`. */
  retryFile: (name: string) => string;
  /** Name of the button of a queued or running upload, shown with `onRemove`. Default `Cancel report.pdf`. */
  cancel: (name: string) => string;
  /** Name of the button of a finished upload. Default `Dismiss report.pdf`. */
  dismiss: (name: string) => string;
  /** Name of the button of a failed upload. Default `Remove report.pdf`. */
  remove: (name: string) => string;
  /** Announced when an upload finishes. Default `report.pdf: upload complete`. */
  announceDone: (name: string) => string;
  /** Announced when an upload fails. Default `report.pdf: upload failed`. */
  announceFailed: (name: string) => string;
  /** A size in bytes. Default `1.2 MB`. */
  fileSize: (bytes: number) => string;
};

export type ZoomBarLabels = {
  /** Tooltip and name of the zoom out button. Default `Zoom out`. */
  zoomOut: string;
  /** Tooltip and name of the zoom in button. Default `Zoom in`. */
  zoomIn: string;
  /** Tooltip and name of the fit button, shown with `onFit`. Default `Fit to canvas`. */
  fit: string;
  /** Tooltip and name of the reset button, shown with `onReset`. Default `Reset to 100%`. */
  reset: string;
};

export const AVATAR_UPLOADER_LABELS: AvatarUploaderLabels = {
  upload: 'Upload photo',
  change: 'Change photo',
  remove: 'Remove',
  helper: (maxSizeMB) => `JPG, PNG or GIF — max ${maxSizeMB} MB`,
  notImage: 'Please select an image file',
  tooLarge: (maxSizeMB) => `File too large — max ${maxSizeMB} MB`,
  failed: 'Upload failed',
  uploading: 'Uploading',
  input: 'Upload avatar',
};

export const CALENDAR_LABELS: CalendarLabels = {
  navigation: 'Navigation bar',
  previousMonth: 'Go to the Previous Month',
  nextMonth: 'Go to the Next Month',
  monthDropdown: 'Choose the Month',
  yearDropdown: 'Choose the Year',
  day: (date, { today, selected }) =>
    `${today ? 'Today, ' : ''}${date}${selected ? ', selected' : ''}`,
  weekNumber: (week) => `Week ${week}`,
  weekNumberHeader: 'Week Number',
};

export const CARD_EXPIRY_INPUT_LABELS: CardExpiryInputLabels = { placeholder: 'MM / YY' };

export const CARD_FIELDS_LABELS: CardFieldsLabels = {
  number: 'Card number',
  expiry: 'Expiry date',
  cvc: 'Security code',
};

export const COLOR_INPUT_LABELS: ColorInputLabels = {
  presets: 'Preset colours',
  hex: 'Hex value',
  invalid: 'Enter a hex colour, such as #14b8a6.',
  red: 'Red',
  orange: 'Orange',
  amber: 'Amber',
  green: 'Green',
  teal: 'Teal',
  blue: 'Blue',
  violet: 'Violet',
  pink: 'Pink',
};

export const COMBOBOX_LABELS: ComboboxLabels = {
  empty: 'No matches found.',
  toggle: 'Toggle options',
};

export const DATE_PICKER_LABELS: DatePickerLabels = {
  placeholder: 'Pick a date',
  fromPlaceholder: 'Start date',
  toPlaceholder: 'End date',
  to: 'to',
  today: 'Today',
  clear: 'Clear',
  done: 'Done',
  presets: 'Date range presets',
  calendar: 'Calendar',
  calendarOf: (label) => `${label} calendar`,
  required: '(required)',
};

export const DROPZONE_LABELS: DropzoneLabels = {
  upload: 'Click to upload',
  orDrop: 'or drag and drop',
  notAllowed: (name, accept) => `"${name}" type not allowed (${accept}).`,
  tooLarge: (name, size) => `"${name}" exceeds ${size}.`,
  tooMany: (max) => `Too many files (max ${max}).`,
  reasonNotAllowed: (accept) => `Type not allowed (${accept}).`,
  reasonTooLarge: (size) => `Exceeds ${size}.`,
  reasonTooMany: (max) => `Too many files (max ${max}).`,
  remove: (name) => `Remove ${name}`,
  fileSize: formatBytes,
};

// The links are joined by commas and an "and", the count words the sentence.
export const ERROR_SUMMARY_LABELS: ErrorSummaryLabels = {
  title: 'There is a problem',
  message: (count, links) =>
    createElement(
      Fragment,
      null,
      `Fix ${count} ${count === 1 ? 'field' : 'fields'} and try again: `,
      links.map((link, i) =>
        createElement(
          Fragment,
          { key: i },
          i > 0 && (i === links.length - 1 ? ' and ' : ', '),
          link
        )
      ),
      ` ${count === 1 ? 'needs' : 'need'} attention.`
    ),
};

export const FILE_INPUT_LABELS: FileInputLabels = {
  browse: 'Browse',
  placeholder: 'No file chosen',
  file: (name, size) => (size === undefined ? name : `${name} — ${size}`),
  files: (count, total) =>
    total === undefined ? `${count} files` : `${count} files — ${total} total`,
  fileSize: formatBytes,
};

export const FORM_FOOTER_LABELS: FormFooterLabels = {
  cancel: 'Cancel',
  submit: 'Save changes',
};

const lines = (count: number) => (count === 1 ? 'line' : 'lines');

export const LINE_ITEMS_LABELS: LineItemsLabels = {
  item: 'Item',
  quantity: 'Quantity',
  rate: 'Rate',
  amount: 'Amount',
  selectItem: 'Select or type an item',
  describeItem: 'Describe the item',
  add: 'Add line',
  subtotal: 'Subtotal',
  emptyTitle: 'No lines yet',
  emptyDescription: 'Add the first item to start the total.',
  line: (n) => `Line ${n}`,
  fieldName: (column, n) => `${column}, line ${n}`,
  remove: (n, item) => `Remove line ${n}${item ? `: ${item}` : ''}`,
  added: (n, count) => `Line ${n} added. ${count} ${lines(count)}.`,
  removed: (n, count) => `Line ${n} removed. ${count} ${lines(count)} left.`,
  subtotalAnnouncement: (amount) => `Subtotal ${amount}`,
};

export const MULTI_SELECT_LABELS: MultiSelectLabels = {
  empty: 'No matches found.',
  toggle: 'Toggle options',
  none: 'None selected',
  selected: (count) => `${count} selected`,
  selectedOfMax: (count, max) => `${count} of ${max} selected`,
  added: (label, count) => `${label} added, ${count} selected`,
  removed: (label, count) => `${label} removed, ${count} selected`,
};

export const NUMBER_INPUT_LABELS: NumberInputLabels = {
  increase: 'Increase',
  decrease: 'Decrease',
};

export const OTP_INPUT_LABELS: OtpInputLabels = {
  code: 'Verification code',
  digit: (name, n) => `${name} digit ${n}`,
};

export const PASSWORD_INPUT_LABELS: PasswordInputLabels = {
  show: 'Show password',
  hide: 'Hide password',
};

export const PASSWORD_POLICY_LABELS: PasswordPolicyLabels = {
  title: 'Password requirements',
  empty: 'No requirements defined.',
  met: 'met',
  notMet: 'not met',
};

export const PHONE_INPUT_LABELS: PhoneInputLabels = {
  country: (name) => `Country: ${name},`,
  searchCountries: 'Search countries',
  search: 'Search',
  countries: 'Countries',
  noMatches: 'No matches found.',
  invalid: 'Enter a phone number with 4 to 15 digits.',
};

export const SEARCH_INPUT_LABELS: SearchInputLabels = { placeholder: 'Search…' };

export const SLIDER_LABELS: SliderLabels = {
  minimum: (name) => `${name} minimum`,
  maximum: (name) => `${name} maximum`,
};

export const TAG_INPUT_LABELS: TagInputLabels = {
  suggestions: 'Suggestions',
  helper: (keys) => {
    const list =
      keys.length === 1 ? keys[0] : `${keys.slice(0, -1).join(', ')} or ${keys[keys.length - 1]}`;
    return `Press ${list} to add a tag.`;
  },
  comma: 'comma',
  semicolon: 'semicolon',
  space: 'space',
  invalid: (tag) => `"${tag}" is not a valid tag.`,
  count: (count, max) => `${count} / ${max}`,
  limit: 'Limit reached',
  tagCount: (count) => `${count} ${count === 1 ? 'tag' : 'tags'}`,
  tagCountOfMax: (count, max) => `${count} of ${max} tags`,
  added: (tags, count) => `${tags.join(', ')} added, ${count} tags`,
  removed: (tag, count) => `${tag} removed, ${count} tags`,
  alreadyAdded: (tag) => `${tag} is already added`,
  maxReached: (max) => `Maximum of ${max} tags reached`,
};

export const UPLOAD_QUEUE_LABELS: UploadQueueLabels = {
  title: 'Uploads',
  progress: (done, total) => `${done} of ${total} done`,
  uploaded: (sent, total, percent) => `${sent} of ${total} · ${percent}%`,
  uploadProgress: (name) => `Upload progress of ${name}`,
  failed: 'Upload failed.',
  done: 'Done',
  waiting: 'Waiting',
  retry: 'Retry',
  retryFile: (name) => `Retry ${name}`,
  cancel: (name) => `Cancel ${name}`,
  dismiss: (name) => `Dismiss ${name}`,
  remove: (name) => `Remove ${name}`,
  announceDone: (name) => `${name}: upload complete`,
  announceFailed: (name) => `${name}: upload failed`,
  fileSize: formatBytes,
};

export const ZOOM_BAR_LABELS: ZoomBarLabels = {
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  fit: 'Fit to canvas',
  reset: 'Reset to 100%',
};
