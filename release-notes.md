Important for Release channel users (**154 and later**): With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages like [issue #690]. While I regularly test QuickFolders against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/QuickFolders/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.

Read the full [version history](https://quickfolders.org/version.html#6.17.2).

**Maintenance Release 6.17.2**

- Compatibility with Thunderbird 157.
- Fixed startup handling when Thunderbird's extension storage is unavailable, showing clear diagnostic instructions instead of leaving QuickFolders partially initialized. The toolbar placeholder now reports storage initialization progress and directs users to the Error Console if startup fails. We also corrected missing default values during legacy preference migration.

    Obsolete defaults are no longer registered in legacy preferences; only existing preferences that the user has explicitly set remain, reducing clutter in Thunderbird's Config Editor. [issue #706]
- Fixed: The Advanced search settings dialog showed localization placeholders instead of translated text. [issue #705]
- Fixed: QuickFolders styling affected the background color of activated buttons in Thunderbird's Quick Filter toolbar. [issue #700]
- Improved the drag-over indicator when dragging to subfolder menus. [issue #703]
- Fixed: The folder move confirmation could show *undefined* instead of the folder name. [issue #702]



**Maintenance Release 6.17.1**
- Fixed: QuickFolders could become stuck at 'initialising QuickFolders' in the toolbar on some systems with Thunderbird 154. [issue #697]
- Fixed: The renewal referrer was set to `undefined`, which could result in an incorrect renewal date when the current license had not yet expired. [issue #699]
- Fixed: quickMove shows stale folder name. [issue #696]
- Fixed: Tabs lose color after upgrade to v6.17. Now supports saving / restoring palette entry per status in config files. [issue #698]

**Improvements (6.17)**

- QuickFolders is now compatible with Thunderbird 155.
- A custom width can now be configured for individual tab separators - via QuickFolders commands submenu. [issue #686]
- Modernized quickFilters integration to use background communications instead of direct code access side-effect. [issue #680]
- Converted storage from legacy preferences (about:config) to local storage API. [issue #677] Settings can now be reset to defaults by uninstalling the add-on — back up your settings first using **Store Configuration** under **Backup and Restore**.

**Bug Fixes (6.17)**

- Fixed: messages window content area truncated at the top. [issue #673]
- Fixed: Tab Category Selector not rendering. [issue #692]
- Fixed: Find related mails doesn't stay in current folder when desired. [issue #694]
- Fixed: Empty Junk and other context menu items stopped working in Thunderbird 153. [issue #695]
- To ensure compatibility with Thunderbird 155, URL loading is now forced in unsafe mode.  [issue #690] According to [Bug 1974213](https://bugzilla.mozilla.org/show_bug.cgi?id=1974213), Add-on Subscripts cannot be loaded anymore with the simple `scriptloader.loadSubScript` method - making them fail in Thunderbird 155.

**Miscellaneous**

- Simplified WindowListener by removing pre 140 compatibility code.
- WIP: quickMove shortcut to open recent folders menu. [issue #687]
