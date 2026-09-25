Important for Release channel users (**154 and later**): With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages like [issue #690]. While I regularly test QuickFolders against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/QuickFolders/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.

Read the full [version history](https://quickfolders.org/version.html#6.17.3).

**Release 6.18 (WIP)**

- If launching the external browser fails, QuickFolders now shows the attempted URL in a selectable field so it can be copied into a browser manually. [Issue #713]

- Fixed Save Configuration failing to open the save dialog after migration to local storage. Backups now read the saved folder model instead of the obsolete legacy preference. Loading a configuration waits for folder storage to finish and refreshes folder caches in all main windows. [Issue #717].

- Avoided global stylesheet registration via nsIStyleSheetService.sheetRegistered(uri, sss.USER_SHEET). [Issue #715].

- Hardened startup handling and added startup progress to the toolbar placeholder. [Issue #716].

- Fixed transparent backgrounds on default buttons when hovering in Thunderbird 156. [Issue #718].

- Fixed various layout regressions in Thunderbird 157: This mainly affects theme compatibility ans spacing in the settings window.
