import type { CommentComposerLabels, CommentLabels, CommentThreadLabels } from '../comments/labels';
import type {
  AuditDiffLabels,
  BarListLabels,
  CountdownLabels,
  EventCalendarLabels,
  IntegrationCardLabels,
  KanbanBoardLabels,
  KpiCardLabels,
  MiniCalendarLabels,
  PipelineStagesLabels,
  PlanCardLabels,
  TrendDeltaLabels,
} from '../data/labels';
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
  PasswordStrengthLabels,
  PhoneInputLabels,
  SearchInputLabels,
  SliderLabels,
  TagInputLabels,
  UploadQueueLabels,
  ZoomBarLabels,
} from '../forms/labels';
import type { FileTileLabels, StackedListLabels } from '../lists/labels';
import type { BreadcrumbLabels } from '../navigation/labels';
import type {
  NewPasswordFormLabels,
  ResetPasswordFormLabels,
  SignInFormLabels,
  SignUpFormLabels,
  SocialAuthButtonsLabels,
  TwoStepVerificationLabels,
} from '../pages/labels';
import type {
  ActiveFiltersBarLabels,
  ColumnFilterDropdownLabels,
  ColumnHeaderLabels,
  DataTableLabels,
  RowActionsMenuLabels,
} from '../table/labels';

/**
 * Every text the components write themselves, one key per component, so an app translates them
 * once with `LabelsProvider`. A text that holds a value is a function of it, so word order and
 * plurals stay with the app: `breadcrumb.showHidden: (count) => …`.
 *
 * `englishLabels` holds the defaults, a starting point for a translation.
 */
export type CosmosLabels = {
  activeFiltersBar: ActiveFiltersBarLabels;
  auditDiff: AuditDiffLabels;
  avatarUploader: AvatarUploaderLabels;
  barList: BarListLabels;
  breadcrumb: BreadcrumbLabels;
  calendar: CalendarLabels;
  cardExpiryInput: CardExpiryInputLabels;
  cardFields: CardFieldsLabels;
  colorInput: ColorInputLabels;
  columnFilterDropdown: ColumnFilterDropdownLabels;
  columnHeader: ColumnHeaderLabels;
  combobox: ComboboxLabels;
  comment: CommentLabels;
  commentComposer: CommentComposerLabels;
  commentThread: CommentThreadLabels;
  countdown: CountdownLabels;
  dataTable: DataTableLabels;
  datePicker: DatePickerLabels;
  dropzone: DropzoneLabels;
  emptyState: EmptyStateLabels;
  errorState: ErrorStateLabels;
  errorSummary: ErrorSummaryLabels;
  eventCalendar: EventCalendarLabels;
  fileInput: FileInputLabels;
  fileTile: FileTileLabels;
  formFooter: FormFooterLabels;
  integrationCard: IntegrationCardLabels;
  kanbanBoard: KanbanBoardLabels;
  kpiCard: KpiCardLabels;
  lineItemsEditor: LineItemsLabels;
  loadingState: LoadingStateLabels;
  miniCalendar: MiniCalendarLabels;
  multiSelect: MultiSelectLabels;
  newPasswordForm: NewPasswordFormLabels;
  numberInput: NumberInputLabels;
  otpInput: OtpInputLabels;
  passwordInput: PasswordInputLabels;
  passwordPolicyChecker: PasswordPolicyLabels;
  passwordStrengthMeter: PasswordStrengthLabels;
  phoneInput: PhoneInputLabels;
  pipelineStages: PipelineStagesLabels;
  planCard: PlanCardLabels;
  resetPasswordForm: ResetPasswordFormLabels;
  rowActionsMenu: RowActionsMenuLabels;
  searchInput: SearchInputLabels;
  signInForm: SignInFormLabels;
  signUpForm: SignUpFormLabels;
  slider: SliderLabels;
  socialAuthButtons: SocialAuthButtonsLabels;
  stackedList: StackedListLabels;
  tagInput: TagInputLabels;
  trendDelta: TrendDeltaLabels;
  twoStepVerificationForm: TwoStepVerificationLabels;
  uploadQueue: UploadQueueLabels;
  zoomBar: ZoomBarLabels;
};
