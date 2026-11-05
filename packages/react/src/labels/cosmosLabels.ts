import type { EmptyStateLabels, ErrorStateLabels, LoadingStateLabels } from '../feedback/labels';
import type {
  AvatarUploaderLabels,
  CalendarLabels,
  CardExpiryInputLabels,
  CardFieldsLabels,
  ColorInputLabels,
  ComboboxLabels,
  DatePickerLabels,
  DropzoneLabels,
  ErrorSummaryLabels,
  FileInputLabels,
  FormFooterLabels,
  LineItemsLabels,
  MultiSelectLabels,
  NumberInputLabels,
  OtpInputLabels,
  PasswordInputLabels,
  PasswordPolicyLabels,
  PhoneInputLabels,
  SearchInputLabels,
  SliderLabels,
  TagInputLabels,
  UploadQueueLabels,
  ZoomBarLabels,
} from '../forms/labels';
import type { BreadcrumbLabels } from '../navigation/labels';
import type {
  NewPasswordFormLabels,
  ResetPasswordFormLabels,
  SignInFormLabels,
  SignUpFormLabels,
  SocialAuthButtonsLabels,
  TwoStepVerificationLabels,
} from '../pages/labels';

/**
 * Every text the components write themselves, one key per component, so an app translates them
 * once with `LabelsProvider`. A text that holds a value is a function of it, so word order and
 * plurals stay with the app: `breadcrumb.showHidden: (count) => …`.
 *
 * `englishLabels` holds the defaults, a starting point for a translation.
 */
export type CosmosLabels = {
  avatarUploader: AvatarUploaderLabels;
  breadcrumb: BreadcrumbLabels;
  calendar: CalendarLabels;
  cardExpiryInput: CardExpiryInputLabels;
  cardFields: CardFieldsLabels;
  colorInput: ColorInputLabels;
  combobox: ComboboxLabels;
  datePicker: DatePickerLabels;
  dropzone: DropzoneLabels;
  emptyState: EmptyStateLabels;
  errorState: ErrorStateLabels;
  errorSummary: ErrorSummaryLabels;
  fileInput: FileInputLabels;
  formFooter: FormFooterLabels;
  lineItemsEditor: LineItemsLabels;
  loadingState: LoadingStateLabels;
  multiSelect: MultiSelectLabels;
  newPasswordForm: NewPasswordFormLabels;
  numberInput: NumberInputLabels;
  otpInput: OtpInputLabels;
  passwordInput: PasswordInputLabels;
  passwordPolicyChecker: PasswordPolicyLabels;
  phoneInput: PhoneInputLabels;
  resetPasswordForm: ResetPasswordFormLabels;
  searchInput: SearchInputLabels;
  signInForm: SignInFormLabels;
  signUpForm: SignUpFormLabels;
  slider: SliderLabels;
  socialAuthButtons: SocialAuthButtonsLabels;
  tagInput: TagInputLabels;
  twoStepVerificationForm: TwoStepVerificationLabels;
  uploadQueue: UploadQueueLabels;
  zoomBar: ZoomBarLabels;
};
