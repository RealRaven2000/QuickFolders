**Release 6.16.3**

- Fixed: Thunderbird 152 had a regression not resetting the quick search field when clicking go to next unread mail after using the 'Find related mails' function. [issue #676]
- Set max version to 153.* for supporting the upcoming  ESR channel.


**Release 6.16.2**

We fixed a serious regression in v6.12.1 where the messages window content area was cut off at the top [issue #673]. You may have to restart Thunderbird to see this fix fully working.

**Release 6.16.1**

This release updates QuickFolders to reflect recent changes in Thunderbird’s add-on platform planning. A previously announced restriction affecting Experiment APIs on the Release channel has been postponed to a future ESR cycle (currently targeted for 2027).

No action is required at this time. QuickFolders continues to work on both Release and ESR versions of Thunderbird where supported.

Users who rely on advanced or experimental functionality may prefer the ESR channel for a more stable environment with fewer platform changes. The best point in time to migrate your existing profile from Release to ESR is when Thunderbird 153 will be published in July 2026.


**Improvements**

* Set minimum version to Thunderbird 140 to avoid problems with deprecated APIs and to focus on modern Thunderbird versions [issue #664].
* Added compatibility for Thunderbird 152.

**Bug Fixes**

* quickJump search box could lose focus on macOS Tahoe 26.4 [issue #658].
* Drag & Drop in subfolders menu broken on macOS Tahoe 26.4 [issue #659].
* Settings window could leave current folder label in a stuck state [issue #666].
* Unstyled buttons in v6.15 registration dialog (Extend / Renew license) [issue #660].

**Miscellaneous**

* Created new GitHub default branch aligned with ESR140 for upcoming Thunderbird 140+ development track.