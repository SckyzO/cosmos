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
import type { JobLogLabels, LogViewerLabels } from '../logs/labels';
import type {
  BreadcrumbLabels,
  NavbarLabels,
  PaginationLabels,
  RecordPagerLabels,
  StepperLabels,
  StickyScrollNavLabels,
  VerticalNavigationLabels,
} from '../navigation/labels';
import type {
  NewPasswordFormLabels,
  ResetPasswordFormLabels,
  SignInFormLabels,
  SignUpFormLabels,
  SocialAuthButtonsLabels,
  TwoStepVerificationLabels,
} from '../pages/labels';
import type {
  AppearanceLabels,
  AppearanceMenuLabels,
  AppearanceSettingsLabels,
  CustomizerLabels,
} from '../settings/labels';
import type {
  HealthMatrixLabels,
  HealthStatusLabels,
  HealthSummaryLabels,
  NodeGridLabels,
  StaleBadgeLabels,
  StatusBadgeLabels,
} from '../status/labels';
import type {
  ActiveFiltersBarLabels,
  ColumnFilterDropdownLabels,
  ColumnHeaderLabels,
  DataTableLabels,
  RowActionsMenuLabels,
} from '../table/labels';
import type { SectionCardLabels } from '../templates/labels';
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
import type { UptimeLabels } from '../uptime/labels';

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
  appearance: AppearanceLabels;
  appearanceMenu: AppearanceMenuLabels;
  appearanceSettings: AppearanceSettingsLabels;
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
  customizer: CustomizerLabels;
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
  healthMatrix: HealthMatrixLabels;
  healthStatus: HealthStatusLabels;
  healthSummary: HealthSummaryLabels;
  helpOverlay: HelpOverlayLabels;
  integrationCard: IntegrationCardLabels;
  jobLog: JobLogLabels;
  kanbanBoard: KanbanBoardLabels;
  kpiCard: KpiCardLabels;
  lightbox: LightboxLabels;
  lineItemsEditor: LineItemsLabels;
  loadingState: LoadingStateLabels;
  logViewer: LogViewerLabels;
  miniCalendar: MiniCalendarLabels;
  modal: ModalLabels;
  multiSelect: MultiSelectLabels;
  navbar: NavbarLabels;
  newPasswordForm: NewPasswordFormLabels;
  nodeGrid: NodeGridLabels;
  notificationCard: NotificationCardLabels;
  notificationRow: NotificationRowLabels;
  notificationsPanel: NotificationsPanelLabels;
  numberInput: NumberInputLabels;
  otpInput: OtpInputLabels;
  pagination: PaginationLabels;
  passwordInput: PasswordInputLabels;
  passwordPolicyChecker: PasswordPolicyLabels;
  passwordStrengthMeter: PasswordStrengthLabels;
  phoneInput: PhoneInputLabels;
  pipelineStages: PipelineStagesLabels;
  planCard: PlanCardLabels;
  progressBar: ProgressBarLabels;
  rating: RatingLabels;
  recordPager: RecordPagerLabels;
  refreshButton: RefreshButtonLabels;
  resetPasswordForm: ResetPasswordFormLabels;
  rowActionButton: RowActionButtonLabels;
  rowActionsMenu: RowActionsMenuLabels;
  searchInput: SearchInputLabels;
  secretValue: SecretValueLabels;
  sectionCard: SectionCardLabels;
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
  staleBadge: StaleBadgeLabels;
  statefulSaveButton: StatefulSaveButtonLabels;
  statusBadge: StatusBadgeLabels;
  stepper: StepperLabels;
  stickyScrollNav: StickyScrollNavLabels;
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
  uptime: UptimeLabels;
  userMenu: UserMenuLabels;
  verticalNavigation: VerticalNavigationLabels;
  videoEmbed: VideoEmbedLabels;
  zoomBar: ZoomBarLabels;
};
