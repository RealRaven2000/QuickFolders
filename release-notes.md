Important for Release channel users (**154 and later**): With Thunderbird's new 2-week release cycle, there is an elevated risk of unexpected breakages like #690. While I regularly test QuickFolders against daily builds, timely fixes depend on **early reporting** from Release users. Please follow the <a href='https://github.com/RealRaven2000/QuickFolders/issues'>issue tracker</a> and report any regressions promptly to help maintain compatibility.

Additional regressions are expected within the Thunderbird release branch and will be addressed as they occur. Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes.

Read the full [version history](https://quickfolders.org/version.html#6.18.1).

**Maintenance Release 6.18.2 **

- QuickFolders is now compatible with Thunderbird 160.
- Fixed message drag-and-drop after Thunderbird 159 removed `messenger.msgHdrFromURI()`. Both message-header lookups now use `MailServices.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri)`. This preserves source-folder detection when dragging messages onto QuickFolders targets, including from search results, and when creating a folder from dragged messages with the quickFilters Assistant active, including from virtual folders. #720.
- Changed the ColorZilla and license purchase links flagged during ATN review to use HTTPS.
- Removed the bundled thunderbird.svg logo file as requested during ATN review. Replaced the older menu logo with Thunderbird's MPL-licensed TB-symbolic.svg to identify the popup menu containing Thunderbird commands.

**Maintenance Release 6.18.1**

- Compatibility with Thunderbird 159
- Fixed the Current Folder toolbar missing after a slow Thunderbird startup by waiting longer for the folder view to finish loading. #712

**Release 6.18**

- If launching the external browser fails, QuickFolders now shows the attempted URL in a selectable field so it can be copied into a browser manually. #713
- Fixed Save Configuration failing to open the save dialog after migration to local storage. Backups now read the saved folder model instead of the obsolete legacy preference. Loading a configuration waits for folder storage to finish and refreshes folder caches in all main windows. #717.
- Avoided global stylesheet registration via nsIStyleSheetService.sheetRegistered(uri, sss.USER_SHEET). #715.
- Hardened startup handling and added startup progress to the toolbar placeholder. #716.
- Fixed transparent backgrounds on default buttons when hovering in Thunderbird 156. #718.
- Fixed various layout regressions in Thunderbird 157: This mainly affects theme compatibility and spacing in the settings window.
