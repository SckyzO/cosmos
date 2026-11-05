import type {
  ChatbotLabels,
  ChatComposerLabels,
  ChatConversationListLabels,
  ChatMessageActionsLabels,
  ChatMessageLabels,
  ChatSourcesLabels,
  ChatSuggestionsLabels,
  ChatThreadLabels,
  ChatToolCallLabels,
  ChatTypingIndicatorLabels,
} from '../chat/labels';
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
import type {
  ShellLabels,
  SidebarLabels,
  SidebarToggleLabels,
  SiteFooterLabels,
  TopbarLabels,
} from '../layout/labels';
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
import type {
  AlertBannerLabels,
  AnnouncementBarLabels,
  AvatarGroupLabels,
  BackToTopFabLabels,
  CarouselLabels,
  ClipboardLabels,
  CodeBlockLabels,
  CommandPaletteLabels,
  CommandPaletteTriggerLabels,
  ConfirmationModalLabels,
  CookieBannerLabels,
  DrawerLabels,
  DropdownLabels,
  HelpOverlayLabels,
  LightboxLabels,
  ModalLabels,
  NotificationCardLabels,
  NotificationRowLabels,
  NotificationsPanelLabels,
  ProgressBarLabels,
  RatingLabels,
  RefreshButtonLabels,
  RowActionButtonLabels,
  SecretValueLabels,
  SpinnerLabels,
  StatefulSaveButtonLabels,
  TagLabels,
  ThemeToggleLabels,
  ToasterLabels,
  TooltipHelpLabels,
  UnsavedIndicatorLabels,
  UserMenuLabels,
  VideoEmbedLabels,
} from '../ui/labels';

/**
 * Every text the components write themselves, one key per component, so an app translates them
 * once with `LabelsProvider`. A text that holds a value is a function of it, so word order and
 * plurals stay with the app: `breadcrumb.showHidden: (count) => …`.
 *
 * `englishLabels` holds the defaults, a starting point for a translation.
 */
export type CosmosLabels = {
  activeFiltersBar: ActiveFiltersBarLabels;
  alertBanner: AlertBannerLabels;
  announcementBar: AnnouncementBarLabels;
  auditDiff: AuditDiffLabels;
  avatarGroup: AvatarGroupLabels;
  avatarUploader: AvatarUploaderLabels;
  backToTopFab: BackToTopFabLabels;
  barList: BarListLabels;
  breadcrumb: BreadcrumbLabels;
  calendar: CalendarLabels;
  cardExpiryInput: CardExpiryInputLabels;
  cardFields: CardFieldsLabels;
  carousel: CarouselLabels;
  chatComposer: ChatComposerLabels;
  chatConversationList: ChatConversationListLabels;
  chatMessage: ChatMessageLabels;
  chatMessageActions: ChatMessageActionsLabels;
  chatSources: ChatSourcesLabels;
  chatSuggestions: ChatSuggestionsLabels;
  chatThread: ChatThreadLabels;
  chatToolCall: ChatToolCallLabels;
  chatTypingIndicator: ChatTypingIndicatorLabels;
  chatbot: ChatbotLabels;
  clipboard: ClipboardLabels;
  codeBlock: CodeBlockLabels;
  colorInput: ColorInputLabels;
  columnFilterDropdown: ColumnFilterDropdownLabels;
  columnHeader: ColumnHeaderLabels;
  combobox: ComboboxLabels;
  commandPalette: CommandPaletteLabels;
  commandPaletteTrigger: CommandPaletteTriggerLabels;
  comment: CommentLabels;
  commentComposer: CommentComposerLabels;
  commentThread: CommentThreadLabels;
  confirmationModal: ConfirmationModalLabels;
  cookieBanner: CookieBannerLabels;
  countdown: CountdownLabels;
  dataTable: DataTableLabels;
  datePicker: DatePickerLabels;
  drawer: DrawerLabels;
  dropdown: DropdownLabels;
  dropzone: DropzoneLabels;
  emptyState: EmptyStateLabels;
  errorState: ErrorStateLabels;
  errorSummary: ErrorSummaryLabels;
  eventCalendar: EventCalendarLabels;
  fileInput: FileInputLabels;
  fileTile: FileTileLabels;
  formFooter: FormFooterLabels;
  helpOverlay: HelpOverlayLabels;
  integrationCard: IntegrationCardLabels;
  kanbanBoard: KanbanBoardLabels;
  kpiCard: KpiCardLabels;
  lightbox: LightboxLabels;
  lineItemsEditor: LineItemsLabels;
  loadingState: LoadingStateLabels;
  miniCalendar: MiniCalendarLabels;
  modal: ModalLabels;
  multiSelect: MultiSelectLabels;
  newPasswordForm: NewPasswordFormLabels;
  notificationCard: NotificationCardLabels;
  notificationRow: NotificationRowLabels;
  notificationsPanel: NotificationsPanelLabels;
  numberInput: NumberInputLabels;
  otpInput: OtpInputLabels;
  passwordInput: PasswordInputLabels;
  passwordPolicyChecker: PasswordPolicyLabels;
  passwordStrengthMeter: PasswordStrengthLabels;
  phoneInput: PhoneInputLabels;
  pipelineStages: PipelineStagesLabels;
  planCard: PlanCardLabels;
  progressBar: ProgressBarLabels;
  rating: RatingLabels;
  refreshButton: RefreshButtonLabels;
  resetPasswordForm: ResetPasswordFormLabels;
  rowActionButton: RowActionButtonLabels;
  rowActionsMenu: RowActionsMenuLabels;
  searchInput: SearchInputLabels;
  secretValue: SecretValueLabels;
  shell: ShellLabels;
  sidebar: SidebarLabels;
  sidebarToggle: SidebarToggleLabels;
  signInForm: SignInFormLabels;
  signUpForm: SignUpFormLabels;
  siteFooter: SiteFooterLabels;
  slider: SliderLabels;
  socialAuthButtons: SocialAuthButtonsLabels;
  spinner: SpinnerLabels;
  stackedList: StackedListLabels;
  statefulSaveButton: StatefulSaveButtonLabels;
  tag: TagLabels;
  tagInput: TagInputLabels;
  themeToggle: ThemeToggleLabels;
  toaster: ToasterLabels;
  tooltipHelp: TooltipHelpLabels;
  topbar: TopbarLabels;
  trendDelta: TrendDeltaLabels;
  twoStepVerificationForm: TwoStepVerificationLabels;
  unsavedIndicator: UnsavedIndicatorLabels;
  uploadQueue: UploadQueueLabels;
  userMenu: UserMenuLabels;
  videoEmbed: VideoEmbedLabels;
  zoomBar: ZoomBarLabels;
};
