import { EMPTY_STATE_LABELS, ERROR_STATE_LABELS, LOADING_STATE_LABELS } from '../feedback/labels';
import {
  AVATAR_UPLOADER_LABELS,
  CALENDAR_LABELS,
  CARD_EXPIRY_INPUT_LABELS,
  CARD_FIELDS_LABELS,
  COLOR_INPUT_LABELS,
  COMBOBOX_LABELS,
  DATE_PICKER_LABELS,
  DROPZONE_LABELS,
  ERROR_SUMMARY_LABELS,
  FILE_INPUT_LABELS,
  FORM_FOOTER_LABELS,
  LINE_ITEMS_LABELS,
  MULTI_SELECT_LABELS,
  NUMBER_INPUT_LABELS,
  OTP_INPUT_LABELS,
  PASSWORD_INPUT_LABELS,
  PASSWORD_POLICY_LABELS,
  PASSWORD_STRENGTH_LABELS,
  PHONE_INPUT_LABELS,
  SEARCH_INPUT_LABELS,
  SLIDER_LABELS,
  TAG_INPUT_LABELS,
  UPLOAD_QUEUE_LABELS,
  ZOOM_BAR_LABELS,
} from '../forms/labels';
import { BREADCRUMB_LABELS } from '../navigation/labels';
import {
  NEW_PASSWORD_FORM_LABELS,
  RESET_PASSWORD_FORM_LABELS,
  SIGN_IN_FORM_LABELS,
  SIGN_UP_FORM_LABELS,
  SOCIAL_AUTH_BUTTONS_LABELS,
  TWO_STEP_VERIFICATION_FORM_LABELS,
} from '../pages/labels';
import type { CosmosLabels } from './cosmosLabels';

/**
 * The English every component writes by default, the whole `CosmosLabels`: the start of a
 * translation. Each component reads its own defaults from its group's `labels` module, so an app
 * that never imports this object ships none of the others.
 */
export const englishLabels: CosmosLabels = {
  avatarUploader: AVATAR_UPLOADER_LABELS,
  breadcrumb: BREADCRUMB_LABELS,
  calendar: CALENDAR_LABELS,
  cardExpiryInput: CARD_EXPIRY_INPUT_LABELS,
  cardFields: CARD_FIELDS_LABELS,
  colorInput: COLOR_INPUT_LABELS,
  combobox: COMBOBOX_LABELS,
  datePicker: DATE_PICKER_LABELS,
  dropzone: DROPZONE_LABELS,
  emptyState: EMPTY_STATE_LABELS,
  errorState: ERROR_STATE_LABELS,
  errorSummary: ERROR_SUMMARY_LABELS,
  fileInput: FILE_INPUT_LABELS,
  formFooter: FORM_FOOTER_LABELS,
  lineItemsEditor: LINE_ITEMS_LABELS,
  loadingState: LOADING_STATE_LABELS,
  multiSelect: MULTI_SELECT_LABELS,
  newPasswordForm: NEW_PASSWORD_FORM_LABELS,
  numberInput: NUMBER_INPUT_LABELS,
  otpInput: OTP_INPUT_LABELS,
  passwordInput: PASSWORD_INPUT_LABELS,
  passwordPolicyChecker: PASSWORD_POLICY_LABELS,
  passwordStrengthMeter: PASSWORD_STRENGTH_LABELS,
  phoneInput: PHONE_INPUT_LABELS,
  resetPasswordForm: RESET_PASSWORD_FORM_LABELS,
  searchInput: SEARCH_INPUT_LABELS,
  signInForm: SIGN_IN_FORM_LABELS,
  signUpForm: SIGN_UP_FORM_LABELS,
  slider: SLIDER_LABELS,
  socialAuthButtons: SOCIAL_AUTH_BUTTONS_LABELS,
  tagInput: TAG_INPUT_LABELS,
  twoStepVerificationForm: TWO_STEP_VERIFICATION_FORM_LABELS,
  uploadQueue: UPLOAD_QUEUE_LABELS,
  zoomBar: ZOOM_BAR_LABELS,
};
