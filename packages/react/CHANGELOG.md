# Changelog

All notable changes to `@sckyzo/cosmos-react` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.2.0...@sckyzo/cosmos-react@0.3.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* **react:** ColumnFilterDropdown lost its `absolute top-full left-0 z-50 mt-1` classes and renders in the flow. Rendered on its own under a relative parent, it must now be positioned by the host; ColumnHeader does it.
* **react:** ConfirmationModal's `onStay` prop is renamed `onClose`, with the same calls. Its dialog role is now `alertdialog`.
* **react:** ThemeToggle's `onToggle` prop is now `onChange(isDark)`, called with the next value of `isDark`.
* **react:** Shell's `onSidebarToggle` and Topbar's `onToggleSidebar` are now `onCollapsedChange`, and Topbar's receives the next collapsed state as an argument.
* **react:** TimelineItem's `tone` and CalendarEvent's `tone` are now `intent`. `TimelineTone` is replaced by `TimelineIntent` and `EventCalendarTone` by `EventCalendarIntent`.
* **react:** NotificationCard's `intent="error"` is now `intent="danger"`.
* **react:** NotificationsPanel.Item's `severity` prop is now `intent`, with `crit` becoming `danger` and `warn` becoming `warning`. `NotificationSeverity` is replaced by `NotificationsPanelIntent`.
* **react:** SelectInput, SelectInputProps and SelectInputOption are removed. Use <Select> from the forms group: onChange receives the native change event, so onChange={setValue} becomes onChange={(e) => setValue(e.target.value)}; pass fullWidth={false} for the inline-block layout, and className now lands on the <select> instead of the wrapper. SelectInputOption is SelectOption.
* **react:** UserMenu.Item's `variant` prop is now `intent` (`default` becomes `neutral`), and `UserMenuItemVariant` is replaced by `UserMenuItemIntent`.
* **react:** PageActionButton and PageActionIconButton no longer accept `brand-outline` or `danger-outline` as `variant`; use `variant="outline"` with `intent="brand"` or `intent="danger"`.
* **react:** Button no longer accepts `variant="danger"`; use `intent="danger"` (with the default `primary`, or any other variant). FormFooter and IntegrationCard take `submitIntent` and `actionIntent` for a destructive action, and `ButtonIntent` is new.
* **react:** StepperInput and StepperInputProps are removed; use <NumberInput controls="stacked" /> with the same props.
* **react:** Tooltip and TooltipHelp no longer accept `brand`, `success`, `warning` or `danger` as `variant`; pass them as `intent`. `TooltipVariant` is now `dark | white`, and `TooltipIntent` is new.
* **react:** AlertBanner's `variant` prop is now `intent`, `error` becomes `danger`, and the `AlertVariant` type is replaced by `AlertBannerIntent`.
* **react:** Badge's `variant` prop is now `intent`, and the `BadgeVariant` type is removed; use `Intent`.
* **react:** Calendar and DatePicker no longer import react-day-picker's styles. Add @import '@sckyzo/cosmos-react/calendar.css'; to your stylesheet.
* **react:** STATUS_COLOR is replaced by STATUS_DOT (class names).

### Features

* **react:** add a locale prop to MiniCalendar and EventCalendar ([7cfd347](https://github.com/SckyzO/cosmos/commit/7cfd347c68f5e2663a95a1e441f4559664cc230d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** add chat building blocks ([c8df6e8](https://github.com/SckyzO/cosmos/commit/c8df6e83e9d6a4e5ce8778c8d390c0e231810df5)), closes [#207](https://github.com/SckyzO/cosmos/issues/207)
* **react:** add default props to navigation, pickers and Sidebar ([eb5e9a0](https://github.com/SckyzO/cosmos/commit/eb5e9a077bb20cd9052d1c2baab00c44c193f7aa)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** add placeholder, fullWidth and FormRow support to Select ([62eb87b](https://github.com/SckyzO/cosmos/commit/62eb87be4c548af805801ea99928911e27794941)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** add stacked controls to NumberInput ([6b30dfa](https://github.com/SckyzO/cosmos/commit/6b30dfa0d502879a0cf4de813236a7e3340bc166)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** add table primitives ([36f97a8](https://github.com/SckyzO/cosmos/commit/36f97a8cbc3b3786b92dede9710bb6a7a854cb14)), closes [#205](https://github.com/SckyzO/cosmos/issues/205)
* **react:** add the chatbot widget ([39e01af](https://github.com/SckyzO/cosmos/commit/39e01afa3aa7603201a4d76d20e4f718b04d71a1)), closes [#207](https://github.com/SckyzO/cosmos/issues/207)
* **react:** control the open state of every non-modal overlay ([5d72b1f](https://github.com/SckyzO/cosmos/commit/5d72b1fc9e4e38159140a560e82011e39bff0c9a)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** flip and clamp floating panels at the viewport edge ([186447b](https://github.com/SckyzO/cosmos/commit/186447b2842eed52e9be54ba8bc62522b0ce5b36)), closes [#269](https://github.com/SckyzO/cosmos/issues/269)
* **react:** forward refs on buttons and custom controls ([d45a8e9](https://github.com/SckyzO/cosmos/commit/d45a8e930fe4751787a9ed86308d560be0f1f569)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** let controlled-only form controls run uncontrolled ([3eb4520](https://github.com/SckyzO/cosmos/commit/3eb4520d5b3c9dd559220e08ff74c8750e4b6aa6)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)


### Bug Fixes

* **react,charts:** give the CommonJS entry its own type declarations ([40dbb78](https://github.com/SckyzO/cosmos/commit/40dbb7865d59b5de1df2d19155d176fb0df8d1e8)), closes [#260](https://github.com/SckyzO/cosmos/issues/260)
* **react,charts:** keep the "use client" directive in dist ([958fd31](https://github.com/SckyzO/cosmos/commit/958fd319a6daca7b3c8aa9b3b4d10bd992eb5f7a)), closes [#259](https://github.com/SckyzO/cosmos/issues/259)
* **react:** add aria-sort and named filter buttons to column headers ([7c0d806](https://github.com/SckyzO/cosmos/commit/7c0d806b7f06d66a80075d6066e91169bf510d77)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** add the WAI-ARIA keyboard pattern to Tabs ([6ef6232](https://github.com/SckyzO/cosmos/commit/6ef6232ca146fa181b37857eb964a90b65b36662)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** anchor the range DatePicker to the trigger that opened it ([5d1ae7d](https://github.com/SckyzO/cosmos/commit/5d1ae7d73c22a7bed4cffc7e8646b08a823c3af7)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** apply the AccentPicker smCols from the sm breakpoint ([41c88fc](https://github.com/SckyzO/cosmos/commit/41c88fcd78cb55bf2491cdc8b811be2c1a869b3b)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** centre DataTable checkboxes and actions in flex boxes ([61f6e02](https://github.com/SckyzO/cosmos/commit/61f6e02a7af9655509ac1638abe9bf8c6ffa2cea))
* **react:** close Combobox on blur and skip disabled options ([a1d522c](https://github.com/SckyzO/cosmos/commit/a1d522cc4419b1e15224b98265dcb81cf93a2f7f)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** close only the innermost overlay on Escape ([2405db5](https://github.com/SckyzO/cosmos/commit/2405db5871fe53d44d0771e4a55c4e54c95856a9)), closes [#269](https://github.com/SckyzO/cosmos/issues/269)
* **react:** compare two empty values equal when sorting DataTable rows ([dcd2e97](https://github.com/SckyzO/cosmos/commit/dcd2e9765f0b346a20d537fda1fba537091a1feb)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** dim Calendar chevrons at their limit ([1442e42](https://github.com/SckyzO/cosmos/commit/1442e4251d85e8a7b37c40e77f1103b42f1d302c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** expose MiniCalendar selected and today days to assistive tech ([21477fe](https://github.com/SckyzO/cosmos/commit/21477fed1520b3a2bbad1c252cd59fed5d06b976)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** expose Sidebar.Group open state with aria-expanded ([6d800cf](https://github.com/SckyzO/cosmos/commit/6d800cf23da0b191fae5eb4ec21d2d5204ab8a47)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** expose the HealthDot status as text ([b91d5a2](https://github.com/SckyzO/cosmos/commit/b91d5a2f66bbf62821bb7b7330415f19076080d5)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** expose the selected segment and pill as a checked radio ([2d657b8](https://github.com/SckyzO/cosmos/commit/2d657b86719e7434350df97732449e232d96b2d3)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** give Avatar an img role and retry when src changes ([45aa945](https://github.com/SckyzO/cosmos/commit/45aa94586a4baa9ef5e2bbfe47bf37211797a679)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** give Dropzone a single named control ([72431a1](https://github.com/SckyzO/cosmos/commit/72431a107235fef90152801c797d1498f03e4630)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** hide the closed Drawer once its slide ends ([19bb0c2](https://github.com/SckyzO/cosmos/commit/19bb0c21c1566eb3ba2715e13a6499e957b3d2c9)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** hide the ErrorPage code from assistive tech ([358f2a3](https://github.com/SckyzO/cosmos/commit/358f2a385b03d311003f68de944ae40ab00e9a17)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** ignore a bare CommandPalette hotkey while typing ([8a7bec3](https://github.com/SckyzO/cosmos/commit/8a7bec344a64d3a6abdf0d7cdaaba26fe4a81f99)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** ignore Shift for digits in matchesHotkey ([87ca8cb](https://github.com/SckyzO/cosmos/commit/87ca8cb723bac26e8078978f3c6af57be953d7e1)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** keep closed Drawer and HelpOverlay out of keyboard reach ([54a863e](https://github.com/SckyzO/cosmos/commit/54a863edb8128236a85839d3c575a94eb239577c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** keep defaultOpen panels from stealing focus ([5379357](https://github.com/SckyzO/cosmos/commit/537935703e89cabe6ca778ec7596c68160b2a45f)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** keep noopener noreferrer on an external Link with its own rel ([947024a](https://github.com/SckyzO/cosmos/commit/947024a9f4846a9fc878cefe2eae80d09da08d59)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** label Modal only by a rendered title, alertdialog for Alert ([787c23f](https://github.com/SckyzO/cosmos/commit/787c23f49f086569812c03f75e71a20c4ba317f0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** land StickyScrollNav jumps below the nav ([d3e6d10](https://github.com/SckyzO/cosmos/commit/d3e6d1066d59b7deecf61ef85bdb90ef40602863)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** leave a portaled panel on Tab from a tabIndex -1 item ([87a1da6](https://github.com/SckyzO/cosmos/commit/87a1da69fb66708b9d8ca7ae09fee602bc5b7caf)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** leave modified arrow keys to the browser in radio groups ([cbc609d](https://github.com/SckyzO/cosmos/commit/cbc609dbc5be54ed1fbe6de35c702cbdfb1e817c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** let a Breadcrumb take its own aria-label ([47302bd](https://github.com/SckyzO/cosmos/commit/47302bd1360bb3f23c7a00b6674e5aef5bff6713)), closes [#265](https://github.com/SckyzO/cosmos/issues/265)
* **react:** let number inputs hold a draft while typing ([44b7228](https://github.com/SckyzO/cosmos/commit/44b722854b9828bf43a2d72bd46e6e4bb37a0dec)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** link help and error text in Input, Select, Combobox ([0483dfb](https://github.com/SckyzO/cosmos/commit/0483dfbf9b891106f9f8b9b5d248183e5715a065)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** make a scrolling Table reachable from the keyboard ([52e42b5](https://github.com/SckyzO/cosmos/commit/52e42b5cc02f8b02b2bca9bc89d5accb2562956a)), closes [#265](https://github.com/SckyzO/cosmos/issues/265)
* **react:** make the settings pickers radio groups ([c53ee9c](https://github.com/SckyzO/cosmos/commit/c53ee9c82a16fd79d4b8d20298c0370a53eea65c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** make toasts follow the Cosmos theme, not the OS ([c5cd749](https://github.com/SckyzO/cosmos/commit/c5cd7494c03b356658a516d97f5e8f5e07e94f62)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** mark the last Breadcrumb item as the current page ([455afed](https://github.com/SckyzO/cosmos/commit/455afeda419dc4543fc25b20383da89fa5b74f80)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** mark the selected Dropdown item as a checked menuitemradio ([632b61e](https://github.com/SckyzO/cosmos/commit/632b61e974f5c5751e18eac06c1c4fe4f10968ac)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** match hotkey modifiers exactly in matchesHotkey ([c7aa60c](https://github.com/SckyzO/cosmos/commit/c7aa60c1bd4d45d0ab2da47bdfda74b440d1a262)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** move focus into portaled panels and back ([68b6fd8](https://github.com/SckyzO/cosmos/commit/68b6fd88512388082a7a0b5de63c0e6c09c4f6b0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** name a scrolling Table region only when it has a caption ([b8530d1](https://github.com/SckyzO/cosmos/commit/b8530d1f527f139ba67d88494c20e1d61c2cb287)), closes [#265](https://github.com/SckyzO/cosmos/issues/265)
* **react:** name controls placed in a FormRow ([2f3117f](https://github.com/SckyzO/cosmos/commit/2f3117f3826b459e15e5689007e995a7a515a439)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** name the ProgressBar with aria-label or aria-labelledby ([b3cafb2](https://github.com/SckyzO/cosmos/commit/b3cafb21883870c9498bbc0c79f3270b93e4ba55)), closes [#265](https://github.com/SckyzO/cosmos/issues/265)
* **react:** open the column filter before any filter is set ([347f4fd](https://github.com/SckyzO/cosmos/commit/347f4fd4b612092e66e12db6b85811d13e834033)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** paint HealthDot with the theme's status palette ([187ac81](https://github.com/SckyzO/cosmos/commit/187ac811298fa779868a10d093454e9ece3c76b8)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise contrast of section labels, swatches, palette groups ([d4e2a92](https://github.com/SckyzO/cosmos/commit/d4e2a929ccdbd4145da86d4d1ef811203db1b41f)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise error text and danger button contrast ([0e9896a](https://github.com/SckyzO/cosmos/commit/0e9896a31a47a871f3caa5c600346645a44cf6ed)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise muted text contrast in data views ([d3e971e](https://github.com/SckyzO/cosmos/commit/d3e971e1e0b5bcd979e0fbbf99a2054595f11b7d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise muted text contrast in forms ([c2d99e3](https://github.com/SckyzO/cosmos/commit/c2d99e36488057af91631327f85b9042925a190e)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise muted text contrast in tables, nav and panels ([4ce59db](https://github.com/SckyzO/cosmos/commit/4ce59dbcfbddcb10c6b48e9077c6f9b87da0084d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** raise placeholder text to 4.5:1 in every theme ([330fdc2](https://github.com/SckyzO/cosmos/commit/330fdc220e102e64ce62b69bc6c674bdee4bf61e)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** re-check the Modal title only when its content changes ([0065ca3](https://github.com/SckyzO/cosmos/commit/0065ca3b29177025bfd45c467b1ef423369f196d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** reach 3:1 on the Toggle track and overlay close icons ([323ec82](https://github.com/SckyzO/cosmos/commit/323ec82bfd10befe9cdea53a4b706c3fb8cdb62a)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** render Dropdown, Combobox and Tooltip panels in a portal ([dd0f0e6](https://github.com/SckyzO/cosmos/commit/dd0f0e6a1bd3c86a654040102fa400fb0f7558f8)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** render floating panels inside the dialog they open from ([1660d20](https://github.com/SckyzO/cosmos/commit/1660d206a1b2967f9fcebec7bc8f60fb4f587c72)), closes [#269](https://github.com/SckyzO/cosmos/issues/269)
* **react:** render the column filter and RefreshButton menus in a portal ([b1d661b](https://github.com/SckyzO/cosmos/commit/b1d661b3f9482d6808b2c72847d19dc5372c63a0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** run the cleanup a React 19 callback ref returns ([a4a2a43](https://github.com/SckyzO/cosmos/commit/a4a2a43c8e3bb19bed729e807b1310900276f026)), closes [#261](https://github.com/SckyzO/cosmos/issues/261)
* **react:** sandbox the VideoEmbed iframe and set its referrer policy ([242a922](https://github.com/SckyzO/cosmos/commit/242a9228b0cecfeb0a5e5510437d20e204d050f7)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** ship the Calendar styles as a separate CSS export ([3abd2d1](https://github.com/SckyzO/cosmos/commit/3abd2d1ca1f2c4325e0bb319f7a7f94d90b0eab5)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** show 1 MB minus a byte as 1.0 MB, not 1024.0 KB ([fb1558b](https://github.com/SckyzO/cosmos/commit/fb1558b7df6a5a6356a6187bfd3d86a2f89f35c7)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** show focus on NumberInput and align focus borders ([1e4a3cb](https://github.com/SckyzO/cosmos/commit/1e4a3cbfb75494682151fc81a4399559d3d83da0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** stop importing CSS from the Calendar bundle ([cbeb23c](https://github.com/SckyzO/cosmos/commit/cbeb23c0c473f0e15511d97c44059859e9f6229b)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** type the caption lookup of the scrolling Table ([4746996](https://github.com/SckyzO/cosmos/commit/47469960a433e14cedfc1c6b9a0464f70b3d2094)), closes [#265](https://github.com/SckyzO/cosmos/issues/265)
* **theme:** lift brand-500 to 3:1 on deep-blue for four accents ([e1ab5fd](https://github.com/SckyzO/cosmos/commit/e1ab5fdd5ca889750071e5fe188ab39d454b732c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)


### Code Refactoring

* **react:** add the shared Intent type, rename Badge variant to intent ([2e77087](https://github.com/SckyzO/cosmos/commit/2e77087206b880d90e1deadcdeaaa500a4cf4a2f)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** align the sidebar collapse callbacks on onCollapsedChange ([a9086cb](https://github.com/SckyzO/cosmos/commit/a9086cbf9ac31e84120bd100d7a2375d5019bd7a)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** build ConfirmationModal on Dialog, rename onStay to onClose ([4e6a617](https://github.com/SckyzO/cosmos/commit/4e6a617e9965d06b454c69d42e9ad6ff2c327a8d)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** give ThemeToggle an onChange with the next value ([11bcc18](https://github.com/SckyzO/cosmos/commit/11bcc18acec98c658829272129522e45428d5e31)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** remove SelectInput in favor of Select ([d123340](https://github.com/SckyzO/cosmos/commit/d12334058e2a4d0dc50c99782f0f52698c1bc741)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** remove StepperInput in favor of NumberInput ([9b391b8](https://github.com/SckyzO/cosmos/commit/9b391b87f3704fef58e9d00fcccbc1c647e8ade0)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** rename AlertBanner variant to intent, error to danger ([e22dda9](https://github.com/SckyzO/cosmos/commit/e22dda98e64e5b023c5f59af681a0b5689d56905)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** rename NotificationCard error to danger, add warning ([1911218](https://github.com/SckyzO/cosmos/commit/191121883868d756b34218802aaa15ace1bbb6a2)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** rename NotificationsPanel.Item severity to intent ([e8de54e](https://github.com/SckyzO/cosmos/commit/e8de54ee2ad7b0ced7f745f4c32897fbedf86579)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** rename Timeline and EventCalendar tone to intent ([8aa90fe](https://github.com/SckyzO/cosmos/commit/8aa90fef57d457569ce106307cf331a025e74fbd)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** rename UserMenu.Item variant to intent ([41faf8a](https://github.com/SckyzO/cosmos/commit/41faf8acb07df8a89847adea63d34372223492c8)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** split Button variant into an emphasis and an intent ([a579667](https://github.com/SckyzO/cosmos/commit/a57966796140191d063666f0bfcb0fa6f6cfd578)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** split PageActionButton variant into an emphasis and an intent ([e56a9a0](https://github.com/SckyzO/cosmos/commit/e56a9a004fe23c329f4505e83bf04c53a78d4e1c)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)
* **react:** split Tooltip variant into a surface and an intent ([11e31c1](https://github.com/SckyzO/cosmos/commit/11e31c1b3aeef0e98c951ce688702fe62274e492)), closes [#151](https://github.com/SckyzO/cosmos/issues/151)

## [0.2.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.1.0...@sckyzo/cosmos-react@0.2.0) (2026-10-21)


### ⚠ BREAKING CHANGES

* **react:** remove the unused PageCard

### Features

* **react:** add a built-in collapse button to Sidebar ([3c0a686](https://github.com/SckyzO/cosmos/commit/3c0a686c31995ac740e310228ed3a4395851818a)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add a comfortable density to DataTable ([1b373b8](https://github.com/SckyzO/cosmos/commit/1b373b8a0bddee77443ea4b546bbc11028de571d)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add a folder variant to Tabs ([120883f](https://github.com/SckyzO/cosmos/commit/120883f9c1357a4f40996a4b4cffd172c9bd3fd4)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add a title line to Tooltip ([d0b9cf8](https://github.com/SckyzO/cosmos/commit/d0b9cf85b584fafe2026fa55aa05b37428dfc435)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add an alternating Timeline variant ([f2e177a](https://github.com/SckyzO/cosmos/commit/f2e177a584281022a25ce36529bd2d0890792b28)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add arrow and delay props to Tooltip ([8c8f010](https://github.com/SckyzO/cosmos/commit/8c8f010908a19cc8a7c1daca7adffae56abe9fdb)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add EventCalendar month view ([35d0972](https://github.com/SckyzO/cosmos/commit/35d097276b9cbdb7a4fb2deb1207880c4b97c6ae)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add font and text size pickers to AppearanceSettings ([54c19e6](https://github.com/SckyzO/cosmos/commit/54c19e681b16a6cf6355f040c0aa4a120af92dad)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add font and text size to applyAppearance ([91274a4](https://github.com/SckyzO/cosmos/commit/91274a48dd1a590b41b91fcc09b571b368a03024)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add group and meta fields to Timeline items ([10d3ad4](https://github.com/SckyzO/cosmos/commit/10d3ad4d0101e51ca4f92a3a480803fb78a5201a)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** add success, warning and danger Tooltip variants ([efb3d2c](https://github.com/SckyzO/cosmos/commit/efb3d2c659837eb38e47c459ab44398cddb346af)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** let CodeBlock take a highlight function ([8ca9d7d](https://github.com/SckyzO/cosmos/commit/8ca9d7d4b7e40d10d4fb7128770f70b952ef4933))
* **react:** let Shell put the collapse control in the sidebar ([5b2e820](https://github.com/SckyzO/cosmos/commit/5b2e8208a4ddba03ac5fa9e1dc2d62eb66491141)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** nest Sidebar sub-menus and indent them automatically ([478b553](https://github.com/SckyzO/cosmos/commit/478b553f2202d32be282c434b01f7cc23f8dd726)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** open collapsed Sidebar sub-menus in a side panel ([51fe834](https://github.com/SckyzO/cosmos/commit/51fe834574686b71cff0e51cb2fac91eedeb933e)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** show keyboard shortcuts in Tooltip ([a3b8e32](https://github.com/SckyzO/cosmos/commit/a3b8e32077f709a1f6debf196c813683665c363d)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)


### Bug Fixes

* **react:** draw the Navbar menu button focus ring in the accent colour ([73171ef](https://github.com/SckyzO/cosmos/commit/73171efbe804c24d46dddd86eccadda6de93d3a3)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** drop the straight divider between Stepper panels ([3f0aa26](https://github.com/SckyzO/cosmos/commit/3f0aa267b84f2bd95cd5853cedbd878fc52a5d39)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** focus OtpInput on mount without scrolling the page ([5be2f51](https://github.com/SckyzO/cosmos/commit/5be2f5159e217588451c6a123615a89f896bdc3c)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** give the dark Navbar its own text colour ([99f3fca](https://github.com/SckyzO/cosmos/commit/99f3fcaaa2e84168fa97e2a25845f854ad9570e4)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** give the light Navbar menu button dark-theme colours ([63ecfb3](https://github.com/SckyzO/cosmos/commit/63ecfb39355c37a46d113c6b17cc7f8e47418a6a)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** keep ContentStackedList meta items on one line ([54c53b6](https://github.com/SckyzO/cosmos/commit/54c53b648f13042c3a29529cada28ade045d6d6d)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** keep PageHeader meta icons at full size ([a041e37](https://github.com/SckyzO/cosmos/commit/a041e378a1faf7283fb213a8b0b244813e521896)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** keep StackedList trailing actions above the row link ([fc1b669](https://github.com/SckyzO/cosmos/commit/fc1b6693fbf9aabb60f6f23b37a10bd06f222d56)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** keep the active Navbar item unchanged on hover ([1ae1615](https://github.com/SckyzO/cosmos/commit/1ae1615f461c2d0839b450d56743209144bb5e0e)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** keep the StepperInput arrows inside the control ([2db4de4](https://github.com/SckyzO/cosmos/commit/2db4de49641717b59e02a439fbe5cf34a3a52574))
* **react:** let Navbar parts inherit the theme of their Navbar ([59df5a6](https://github.com/SckyzO/cosmos/commit/59df5a61db52f7b1c0b27ddce88a05ec03fba9f7)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** let the AppearanceMenu panel scroll on short screens ([8a8a9a3](https://github.com/SckyzO/cosmos/commit/8a8a9a32635cb680ad99a2920848f7330e16e289)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** make the NarrowStackedList header opaque in dark themes ([3b9e8d8](https://github.com/SckyzO/cosmos/commit/3b9e8d80523e4d68e49ac77a6c3e38c918542e43)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** open Tooltip on keyboard focus and close it on Escape ([0e0df6d](https://github.com/SckyzO/cosmos/commit/0e0df6de85b776e5044f6a7ff2d24f51d3d2f75a)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** render NarrowStackedList trailing next to a description ([6702de7](https://github.com/SckyzO/cosmos/commit/6702de7f9fb6c442052de9979f8e25eb0fd15149)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** round the outer corner of each GridList footer action ([b2aa540](https://github.com/SckyzO/cosmos/commit/b2aa540688582a0e77abfaff50caddcb6c4e6f3b)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)
* **react:** show focus on the StepperInput ([05ad9c2](https://github.com/SckyzO/cosmos/commit/05ad9c29c78557116b2ee2c43658f5d328d51c55))
* **react:** stop circular Buttons from squeezing their icon ([e5f803a](https://github.com/SckyzO/cosmos/commit/e5f803a54d6223a649cee2556e8eaf9a1ee0d946))
* **react:** wrap PageHeader actions under the title when narrow ([3ea70ff](https://github.com/SckyzO/cosmos/commit/3ea70ffc83a46e898247048c652848e1dda12d2e)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)


### Code Refactoring

* **react:** remove the unused PageCard ([b307885](https://github.com/SckyzO/cosmos/commit/b307885d42cb8df9c84a19455d642bf65bf86676)), closes [#157](https://github.com/SckyzO/cosmos/issues/157)

## [0.1.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.0.3...@sckyzo/cosmos-react@0.1.0) (2026-10-20)


### ⚠ BREAKING CHANGES

* **react:** ThemeToggleTri's 'oled' mode is now 'deep-blue' and the oledLabel prop is replaced by deepBlueLabel.

### Features

* **react:** add align and aria-label to Popover.Content ([d4c39bd](https://github.com/SckyzO/cosmos/commit/d4c39bd28e9b0e27fadd08f932aa6debbecaff01))
* **react:** add AppearanceMenu for picking theme and accent in a top bar ([5181ad7](https://github.com/SckyzO/cosmos/commit/5181ad7eb3d06c693fbc602500901536383978a6))
* **react:** add AppearanceSettings and deep-blue ThemeToggleTri mode ([597f714](https://github.com/SckyzO/cosmos/commit/597f714ba4a22076dd9d11ffeffca222b34d0df6))


### Bug Fixes

* **react:** stretch PaletteCard label rows to the card's height ([de3aba7](https://github.com/SckyzO/cosmos/commit/de3aba7397b0ceb8bb8540e47997fe8ec9168b7f))

## [0.0.3](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.0.2...@sckyzo/cosmos-react@0.0.3) (2026-07-17)


### Bug Fixes

* **react:** accessibility of overlay components ([d9ca403](https://github.com/SckyzO/cosmos/commit/d9ca40360bd7e7d7f61a6a23d406018996b6dee5))
* **react:** add menu semantics and keyboard nav to Dropdown ([f60d06f](https://github.com/SckyzO/cosmos/commit/f60d06fe451af570967824d970a359001d9ba0a1))
* **react:** export the 7 unreachable page components ([1b7d60c](https://github.com/SckyzO/cosmos/commit/1b7d60c647d609b02ea704374fca56aa3a7018b5))
* **react:** give ConfirmationModal a unique title id and focus trap ([0a703c4](https://github.com/SckyzO/cosmos/commit/0a703c43e13a514b061d31dc8aeda2cbd9ee5b86))
* **react:** trap focus and name Modal and Drawer dialogs ([53564d1](https://github.com/SckyzO/cosmos/commit/53564d1a65e96c29849e8581b1b22c25d04545bd))

## [0.0.2] - 2026-05-21

Packaging/metadata only — no component or API changes.

### Changed

- Sharper npm package description.
- First release published via npm OIDC trusted publishing (provenance attached).

## [0.0.1] - 2026-05-20

First test release.

### Added

- 135+ React 19 components organised by responsibility across the Storybook
  sidebar groups: Atoms, Forms, Data, Status, Feedback, Overlays, Navigation,
  Actions, Layout, Lists, Tables, Settings, Typography, plus full-page
  templates under Pages and Foundations.
- Ships ESM + CJS + type declarations (`dist/`), built with tsup.
- `@sckyzo/cosmos-theme` as a dependency for the design tokens; `react` and
  `react-dom` 19 as peer dependencies.
- Dark/light theming throughout via the Cosmos CSS variables.
