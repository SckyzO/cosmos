# Changelog

All notable changes to `@sckyzo/cosmos-react` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0](https://github.com/SckyzO/cosmos/compare/@sckyzo/cosmos-react@0.2.0...@sckyzo/cosmos-react@0.3.0) (2026-10-27)


### ⚠ BREAKING CHANGES

* **react:** the default look of every toast changes. The status toasts (`success`, `info`, `warning`, `error`) are the AlertBanner tints on an opaque background in every theme, with a title in the intent color and a neutral description, where sonner's rich colors were. The untyped toast is the Cosmos neutral card in every theme (12px radius, gray border, opaque panel background), where sonner's black card showed in the dark themes. The Toaster no longer sets `richColors`, and `invert` has no effect on it. A `toastOptions` of your own replaces `unstyled` and the classes, as it replaced the classes before.
* **react:** Sidebar.Brand and Sidebar.Section no longer draw a line by default (pass `divider` to keep it), and rows have a 20px margin and a 40px height.

### Features

* **react:** Accordion trigger icon and open-item accent ([7902fef](https://github.com/SckyzO/cosmos/commit/7902fef8724c790ef722789e9c21ce05425723a3)), closes [#410](https://github.com/SckyzO/cosmos/issues/410)
* **react:** add a badge to SegmentedControl options ([caa8caf](https://github.com/SckyzO/cosmos/commit/caa8caf255dd318f928b3c061c4efd522bd81632))
* **react:** add a columns menu to DataTable ([228c2de](https://github.com/SckyzO/cosmos/commit/228c2de020a0b5c3d866f86b0183de80af22eea9))
* **react:** add a leading icon tile to PageHeader ([02d7ed5](https://github.com/SckyzO/cosmos/commit/02d7ed5595ebe03e4eeb0e2277356b1b2de033b0))
* **react:** add a masonry layout to ImageGrid ([7a41a01](https://github.com/SckyzO/cosmos/commit/7a41a01db1959639c4c206ede3e4e6e2d702d4f9))
* **react:** add a pills variant to Tabs ([ba42e49](https://github.com/SckyzO/cosmos/commit/ba42e4906c772e6a7936e2249b71cef5f174bee7))
* **react:** add a plain style to Clipboard ([472c114](https://github.com/SckyzO/cosmos/commit/472c11483013e9e754b60f4bfcda177477b012c9))
* **react:** add a rows-per-page select to DataTable ([43f2a79](https://github.com/SckyzO/cosmos/commit/43f2a7916459364f7fd2504b427aec8b4d99af68))
* **react:** add a Slider component ([65d8846](https://github.com/SckyzO/cosmos/commit/65d8846c4f1b8a2ad29c9bb8be5dff9488df70e3)), closes [#399](https://github.com/SckyzO/cosmos/issues/399)
* **react:** add a sm size to Toggle ([3101bdd](https://github.com/SckyzO/cosmos/commit/3101bdd4ebe2b91bace42b01535917c2299e43b0))
* **react:** add a stacked-card layout to DataTable on phones ([696978e](https://github.com/SckyzO/cosmos/commit/696978edca5860a4b8788b33936b2f98c5c355c7))
* **react:** add a success intent to Button ([711fcb7](https://github.com/SckyzO/cosmos/commit/711fcb7650a35711b3a037e4c8262ebd236b41a6))
* **react:** add a tooltip to collapsed sidebar items ([756cddb](https://github.com/SckyzO/cosmos/commit/756cddbba60de9cb2c0af480eb76fc7885136b2f))
* **react:** add an internal row windowing hook ([fa70617](https://github.com/SckyzO/cosmos/commit/fa70617bc5850858afd34bb13d75578a57c6bc54))
* **react:** add an opt-in system option to ThemeToggleTri ([c094a95](https://github.com/SckyzO/cosmos/commit/c094a95905c67f74a9c252e4285fb454ab08fc2f))
* **react:** add AuditDiff ([06a403c](https://github.com/SckyzO/cosmos/commit/06a403cd26ecce4ea4f839bfe5cc1feb3be6d964))
* **react:** add autoResize and maxRows to Textarea ([a34f9c4](https://github.com/SckyzO/cosmos/commit/a34f9c4c7ed70b43bec9eeb432748fbeb7d3aeab))
* **react:** add AvatarGroup and a status dot on Avatar ([ea63e78](https://github.com/SckyzO/cosmos/commit/ea63e784f09d2a9ae73ce885194a4af4c4f1f8d0))
* **react:** add BarList ([8d3373f](https://github.com/SckyzO/cosmos/commit/8d3373f6a14aa843ecb60284544a12c635f23300)), closes [#338](https://github.com/SckyzO/cosmos/issues/338)
* **react:** add Carousel.Thumbnails ([230d909](https://github.com/SckyzO/cosmos/commit/230d9090dfd5cd8b3edd6afb8c750685cea44428))
* **react:** add ChatMessageActions and the actions slot of ChatMessage ([345e923](https://github.com/SckyzO/cosmos/commit/345e9237e03291088e2fa6d64cf173c2a9a11eee))
* **react:** add ChatSources ([7525e90](https://github.com/SckyzO/cosmos/commit/7525e9099969db4745c61b451c8ee5957eb52062))
* **react:** add ChatToolCall ([0a47366](https://github.com/SckyzO/cosmos/commit/0a47366e19e343c1496adead54764303d78e299c))
* **react:** add children, bubble and aria-busy to ChatMessage ([0a4b489](https://github.com/SckyzO/cosmos/commit/0a4b4892efd00ece698097ad9f077da43dc370ad))
* **react:** add ColorInput ([65df73e](https://github.com/SckyzO/cosmos/commit/65df73e1166b327aa99b54202449be156860b46a))
* **react:** add CommentThread, Comment and CommentComposer ([910b80d](https://github.com/SckyzO/cosmos/commit/910b80d148e6c0941af32def2e8fea2b03300f50))
* **react:** add CSV export and a print layout to DataTable ([e09ab03](https://github.com/SckyzO/cosmos/commit/e09ab03161f79bc9fa9966e184bf1b3c480d4e9f))
* **react:** add danger intent and type-to-confirm to ConfirmationModal ([d7e68b1](https://github.com/SckyzO/cosmos/commit/d7e68b1a31b9dbdc9c1488cfb934206ae2a7edea))
* **react:** add DateTime, RelativeTime, Clock and Countdown ([e23b8be](https://github.com/SckyzO/cosmos/commit/e23b8be0f1dfb9819e6a7303f340c8c14db1b3e8))
* **react:** add FileTile ([314c024](https://github.com/SckyzO/cosmos/commit/314c024583c717910c8f6e685da4139c7c99ff82))
* **react:** add footer and a Stop button to ChatComposer ([39c3bd3](https://github.com/SckyzO/cosmos/commit/39c3bd39057fde653f48ac4e8a4ba4d18211fdc3))
* **react:** add icon, delta, chart, intent, loading and link to KpiCard ([8a4b691](https://github.com/SckyzO/cosmos/commit/8a4b6910f2374907b29b6d5d6c928cf8d612c7b9))
* **react:** add identity, id, description and amount table cells ([0d14284](https://github.com/SckyzO/cosmos/commit/0d142846af5e96723cfe213b55e1d1094f424514))
* **react:** add IntegrationCard meta slot, size category text-2xs ([ea17c88](https://github.com/SckyzO/cosmos/commit/ea17c88af8fb4e95427c4f9dcf1c3a7ae91eee29))
* **react:** add KanbanBoard ([8297ca9](https://github.com/SckyzO/cosmos/commit/8297ca9e0558307cc6dbe39a0ef30b00674fa30f))
* **react:** add LinkProvider for router links ([30805b9](https://github.com/SckyzO/cosmos/commit/30805b9eb0d091646ec65ad7dee80fba33ca61d8)), closes [#385](https://github.com/SckyzO/cosmos/issues/385)
* **react:** add manual mode and rowCount to DataTable ([e7759f5](https://github.com/SckyzO/cosmos/commit/e7759f5a3044a7023071741e0c9c68b4e39f150e))
* **react:** add Menu.CheckboxItem ([69f64b8](https://github.com/SckyzO/cosmos/commit/69f64b844b3045845b8f22079a0e2dc62ef201b0))
* **react:** add Menu.RadioItem ([11c3ee0](https://github.com/SckyzO/cosmos/commit/11c3ee0e03a03c362b28321d7d623dd582a1fd70))
* **react:** add MultiSelect ([db6620a](https://github.com/SckyzO/cosmos/commit/db6620a6b1186e8d1a3b646586c736698560f10b))
* **react:** add onFilesAdded and onReject to Dropzone ([4b3a50e](https://github.com/SckyzO/cosmos/commit/4b3a50e029a70b618f59032e8628516c16eafc0d))
* **react:** add onRowClick and rowHref to DataTable ([5e242c0](https://github.com/SckyzO/cosmos/commit/5e242c03a14b9743e9423ae2c43cbb240bfe6e96))
* **react:** add PhoneInput ([e4b2632](https://github.com/SckyzO/cosmos/commit/e4b26327ad6e0ea4184e9ce8a48ea706491d3076))
* **react:** add PipelineStages ([14c80c9](https://github.com/SckyzO/cosmos/commit/14c80c93307a1d1e1276219cafd15a14b54d3bb2))
* **react:** add ProfileHeader ([086f1ec](https://github.com/SckyzO/cosmos/commit/086f1ecfe5b86173f8a2651aed88b620eb009d5a))
* **react:** add ProgressRing ([8dfe17d](https://github.com/SckyzO/cosmos/commit/8dfe17d525cc0b52174079f5054b825ffc597b85))
* **react:** add Rating ([5aa2374](https://github.com/SckyzO/cosmos/commit/5aa237470cb51d7e38a9c9bd17b430832c656566))
* **react:** add RecordPager for detail pages ([6b2e64d](https://github.com/SckyzO/cosmos/commit/6b2e64dc8e2849c6f01446a4142a652cdfb36635))
* **react:** add RowActionsMenu for DataTable row actions ([50e0808](https://github.com/SckyzO/cosmos/commit/50e08083ad3e072f604d9a2bcd672cedb0c0dde3))
* **react:** add saved views to DataTable ([daabde1](https://github.com/SckyzO/cosmos/commit/daabde12033be60ac3fd1bf07af13ec01fbc172c))
* **react:** add SecretValue ([7aacbcd](https://github.com/SckyzO/cosmos/commit/7aacbcd5520d3ac6dbd7f3802e8a62068ff555c2))
* **react:** add segments and a legend to ProgressBar ([5d10d7b](https://github.com/SckyzO/cosmos/commit/5d10d7bab7517dc8863ce6b316ffa0730cf87fa3))
* **react:** add showEdges to Pagination ([d950c5a](https://github.com/SckyzO/cosmos/commit/d950c5a08330780e1e187e6f28ffa0747a4907b6))
* **react:** add Spinner intent, xs size and onDark ([712fb56](https://github.com/SckyzO/cosmos/commit/712fb56a1bacb5ef70e3bb972df5e7ea1cdb8d3b)), closes [#409](https://github.com/SckyzO/cosmos/issues/409)
* **react:** add split and cover variants to AuthLayout ([e478d9d](https://github.com/SckyzO/cosmos/commit/e478d9da30b7fe9af80679c0988865aabb7cd7ba))
* **react:** add SplitView ([30f8a1a](https://github.com/SckyzO/cosmos/commit/30f8a1a3e886d075beffb935722d6dfba63e30ae))
* **react:** add status tabs and controllable filters to DataTable ([697cc6c](https://github.com/SckyzO/cosmos/commit/697cc6c1f7c217e6f0a1c1e33d016a128c81ef7a))
* **react:** add swipe-to-close to Drawer ([8da63ed](https://github.com/SckyzO/cosmos/commit/8da63ed6bdc4cb849b807e7103d9a2c64eb2615d))
* **react:** add Tag ([5f89bd6](https://github.com/SckyzO/cosmos/commit/5f89bd6852899f6e02b9b45afb97b4dfdd283e3b))
* **react:** add TagInput ([24ff439](https://github.com/SckyzO/cosmos/commit/24ff439a56b8bdc7b82b8ac286490bf44b3f2761))
* **react:** add toCsv and a column exportValue ([efb9201](https://github.com/SckyzO/cosmos/commit/efb9201ae9760fe6dc234b960b8bf23a0dba0a4e))
* **react:** add TrendDelta ([51c7628](https://github.com/SckyzO/cosmos/commit/51c76281ade8eb573e3edd7e01973452a2d9abc2))
* **react:** add UploadQueue ([6b86985](https://github.com/SckyzO/cosmos/commit/6b86985ebcc0352128239ba293d5c194155dc25f))
* **react:** add VideoEmbed click-to-load facade ([5f1fe61](https://github.com/SckyzO/cosmos/commit/5f1fe61dba7ebeb4598d732621a90d007913cafe))
* **react:** add virtualize to DataTable ([14502b6](https://github.com/SckyzO/cosmos/commit/14502b6b6293129e6966e64d6b002069231f242f))
* **react:** AlertBanner accent appearance ([173982d](https://github.com/SckyzO/cosmos/commit/173982d55891ba8246d784123b012ed39451e7a8)), closes [#408](https://github.com/SckyzO/cosmos/issues/408)
* **react:** Avatar shape, ring and intent ([02f460f](https://github.com/SckyzO/cosmos/commit/02f460f95e18dd921c46a535c9fccba9c95b8097)), closes [#407](https://github.com/SckyzO/cosmos/issues/407)
* **react:** Badge lg size and shape ([9181ee3](https://github.com/SckyzO/cosmos/commit/9181ee3c8efcbbc71db6a6bc2b050f339f18ea40)), closes [#412](https://github.com/SckyzO/cosmos/issues/412)
* **react:** Button warning intent, square shape and link variant ([c3911c3](https://github.com/SckyzO/cosmos/commit/c3911c39146cdc271bba255055a927aacb578749)), closes [#406](https://github.com/SckyzO/cosmos/issues/406)
* **react:** Carousel indicators inside the slide ([a9fa334](https://github.com/SckyzO/cosmos/commit/a9fa3343cf6b6738013ad954814a8668cabfd7bb)), closes [#412](https://github.com/SckyzO/cosmos/issues/412)
* **react:** control the sort and the page of DataTable ([a85792c](https://github.com/SckyzO/cosmos/commit/a85792c11e21e05850dd8372e493e38d38a597bc))
* **react:** Drawer bottom sheet ([14a3965](https://github.com/SckyzO/cosmos/commit/14a396582a74aa360c91d2e4cbc4b182c7295457)), closes [#404](https://github.com/SckyzO/cosmos/issues/404)
* **react:** expand the collapsed Sidebar on hover ([2d832e5](https://github.com/SckyzO/cosmos/commit/2d832e5dfa8453ea98489eccb79c5ee43ac4a739)), closes [#383](https://github.com/SckyzO/cosmos/issues/383)
* **react:** extract ChatSuggestions from Chatbot ([f2b500e](https://github.com/SckyzO/cosmos/commit/f2b500e3ade5a8418e4fd03ad0ac0963f5055da9))
* **react:** fade the scrolling edges of tables, pin the first column ([cd35ff8](https://github.com/SckyzO/cosmos/commit/cd35ff822695789fbc71e398f6d9fb988b7ebfcd))
* **react:** guard the CSV header row against formulas ([91476f3](https://github.com/SckyzO/cosmos/commit/91476f3eac054192094769939fcd5013c71724f0))
* **react:** icon and intent on EmptyState ([28abe46](https://github.com/SckyzO/cosmos/commit/28abe465b5e3c511f4c3ec96cad30bed4c60c520)), closes [#400](https://github.com/SckyzO/cosmos/issues/400)
* **react:** intent per Timeline item ([d553a1e](https://github.com/SckyzO/cosmos/commit/d553a1e1ca1141ea1be8742126d2574a1fe0d968)), closes [#403](https://github.com/SckyzO/cosmos/issues/403)
* **react:** keep DataTable rows on screen while it reloads ([558b3c1](https://github.com/SckyzO/cosmos/commit/558b3c11e4884455c0e3802f22cc2640947d3513))
* **react:** Link intent ([2aa5895](https://github.com/SckyzO/cosmos/commit/2aa589528d672132d5026cac8f459bfaff5def7c)), closes [#412](https://github.com/SckyzO/cosmos/issues/412)
* **react:** make DataTable's density controllable, type its sort ([4d84d01](https://github.com/SckyzO/cosmos/commit/4d84d01c1a78b430ab184197c6aa83cdc01fde99))
* **react:** make virtualized row height follow the text size ([02be2f7](https://github.com/SckyzO/cosmos/commit/02be2f7bf66220517a5419944e6e8195956a166d))
* **react:** open the Shell sidebar as a drawer below lg ([a617101](https://github.com/SckyzO/cosmos/commit/a61710184f08b74befdaa4705c56befdd4f89bea))
* **react:** Pagination Previous and Next text labels ([be3f6ab](https://github.com/SckyzO/cosmos/commit/be3f6ab9701e45d46905ab2864d5ca01036f8f0c)), closes [#411](https://github.com/SckyzO/cosmos/issues/411)
* **react:** pin AppearanceMenu headings and add a Reset action ([1c1e615](https://github.com/SckyzO/cosmos/commit/1c1e6152c3a04eff554a874ad48e018566bf2717))
* **react:** ProgressBar neutral intent ([e5f5337](https://github.com/SckyzO/cosmos/commit/e5f5337d86f04a60d5358c2450baba9e1f48dae7)), closes [#412](https://github.com/SckyzO/cosmos/issues/412)
* **react:** render internal links through LinkProvider ([0aa9e6c](https://github.com/SckyzO/cosmos/commit/0aa9e6c8db0f832a7bc52de9b46760cc59bcaff1)), closes [#385](https://github.com/SckyzO/cosmos/issues/385)
* **react:** Ribbon pill shape ([af98e8c](https://github.com/SckyzO/cosmos/commit/af98e8c98dd75f5d4f5a37cda9cd2df109eab719)), closes [#412](https://github.com/SckyzO/cosmos/issues/412)
* **react:** show the brand in the Topbar on small screens ([f14ef59](https://github.com/SckyzO/cosmos/commit/f14ef597e20d55230b28c860404345b15f319347))
* **react:** Sidebar defaults and styles from rackscope ([5e51966](https://github.com/SckyzO/cosmos/commit/5e51966f50ebb536c1d46caf8e3a9bb49365efa5)), closes [#381](https://github.com/SckyzO/cosmos/issues/381)
* **react:** Sidebar width follows its content up to maxWidth ([f87c439](https://github.com/SckyzO/cosmos/commit/f87c439fb21b7653d67607748a44274fffcffae1)), closes [#384](https://github.com/SckyzO/cosmos/issues/384)
* **react:** success state on fields and OtpInput ([e6e7092](https://github.com/SckyzO/cosmos/commit/e6e70922aa46054b48d597619d843ceef3938d29)), closes [#405](https://github.com/SckyzO/cosmos/issues/405)
* **react:** Tabs raised variant ([9a9e292](https://github.com/SckyzO/cosmos/commit/9a9e292c126d13fdec4ceebe36a51ce1dce49b1d)), closes [#402](https://github.com/SckyzO/cosmos/issues/402)
* **react:** Toast uses the shared intent palette ([8c3e435](https://github.com/SckyzO/cosmos/commit/8c3e4358398315552ee540d537906a9e63b49e89)), closes [#401](https://github.com/SckyzO/cosmos/issues/401) [#326](https://github.com/SckyzO/cosmos/issues/326)
* **react:** tree rendering for nested Sidebar sub-menus ([93365d8](https://github.com/SckyzO/cosmos/commit/93365d87e2e60812b9fbe180b7d0c6d850198e8a)), closes [#382](https://github.com/SckyzO/cosmos/issues/382)


### Bug Fixes

* **react:** build the saved state on the success intent ([5b6ca38](https://github.com/SckyzO/cosmos/commit/5b6ca388bcfb6c221d93fdda300e861b04263f0a))
* **react:** give DataTable and Table one header cell style ([ed27503](https://github.com/SckyzO/cosmos/commit/ed2750349ef407982cfee7099303e6d0e2dcc206))
* **react:** hide a closed Drawer that runs no slide-out ([548c4f1](https://github.com/SckyzO/cosmos/commit/548c4f12db4ca710529ba38268f81a3ad5f5631c)), closes [#397](https://github.com/SckyzO/cosmos/issues/397)
* **react:** keep a Tabs strip reachable when no tab is selected ([3c565cc](https://github.com/SckyzO/cosmos/commit/3c565cc97fe779f17e9bc8fdbda01d94fc191932))
* **react:** keep AvatarGroup initials clear of the next avatar ([a18233a](https://github.com/SckyzO/cosmos/commit/a18233a8f5754b171c639576ba35461be85d03c4)), closes [#339](https://github.com/SckyzO/cosmos/issues/339)
* **react:** keep DataTable selection and action columns at their width ([248ba4e](https://github.com/SckyzO/cosmos/commit/248ba4e05cd8cc2185ee8f475bd7eba1f5a51d79))
* **react:** keep the AvatarUploader spinner white in dark themes ([652911b](https://github.com/SckyzO/cosmos/commit/652911ba2776202fa1a918d7911858464acdfae4)), closes [#409](https://github.com/SckyzO/cosmos/issues/409)
* **react:** keep the CommandPalette listbox valid when nothing matches ([d11c639](https://github.com/SckyzO/cosmos/commit/d11c639f041b679e23ea6366fd64762b6ed68eaa))
* **react:** keep the neutral light badge visible on dark cards ([e9843e8](https://github.com/SckyzO/cosmos/commit/e9843e813aed4023f7d0a220b461602f328b0943))
* **react:** keep the table header while loading, empty or failed ([8fe5903](https://github.com/SckyzO/cosmos/commit/8fe59033a4e092b459d6a6c0e21e6bcb0af85ad5))
* **react:** make disabled and folder tabs readable ([50cb9cf](https://github.com/SckyzO/cosmos/commit/50cb9cfd9f06c2b5903553b63c32caac22b9f2ec))
* **react:** make Resend code a 44px ghost button ([4a02857](https://github.com/SckyzO/cosmos/commit/4a0285786eeae9d660fd4160db0de332559038a4))
* **react:** make Table stripes visible in dark themes ([47edfd9](https://github.com/SckyzO/cosmos/commit/47edfd9999493fceaa275558acc43ca038b1eb67))
* **react:** measure table overflow before the first paint ([b3a6172](https://github.com/SckyzO/cosmos/commit/b3a617216bc07c8cb400f2b2c184c1704757d11c))
* **react:** raise the ErrorPage numeral to 3:1 contrast ([d9a0c37](https://github.com/SckyzO/cosmos/commit/d9a0c3735bca45dc5fd97c6e0005ad4d0b95b55c))
* **react:** render the card's brand title as a paragraph ([60c3cf3](https://github.com/SckyzO/cosmos/commit/60c3cf374fd1253b32e6ddc4021c00917c9587d4)), closes [#446](https://github.com/SckyzO/cosmos/issues/446)
* **react:** set sticky StackedList headings apart as a band ([0984336](https://github.com/SckyzO/cosmos/commit/0984336b37cb6e778889338268c8076cf4514c48))
* **react:** show a sort icon on every sortable DataTable column ([228f38d](https://github.com/SckyzO/cosmos/commit/228f38df7cdb6ecee47ecdd22daac86fb19cc6d2))
* **react:** stack the sign-up name fields below sm ([9e2b187](https://github.com/SckyzO/cosmos/commit/9e2b187df08f1220f6bf8dd2fd0b95128fc16a05))
* **react:** stack vertical CheckboxGroup and RadioGroup options ([e0556b7](https://github.com/SckyzO/cosmos/commit/e0556b78a76267dde47ef6cf1f7f3ce2e8fd1405)), closes [#388](https://github.com/SckyzO/cosmos/issues/388)
* **react:** stop ChatComposer scrolling a multi-line message ([84b891f](https://github.com/SckyzO/cosmos/commit/84b891fe7e73d33dacb23def3a937feeaf19f50a))
* **react:** strengthen the Card border in dark themes ([3010bde](https://github.com/SckyzO/cosmos/commit/3010bde6e2b10168190968022ed72e1c9fbff267))
* **react:** trim a link's trailing punctuation in linear time ([92eb174](https://github.com/SckyzO/cosmos/commit/92eb17437570df9c3606f2875d56443adccdf855))

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
