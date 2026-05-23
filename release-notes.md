**Release 6.16**

This release prepares QuickFolders for upcoming Thunderbird platform changes. Starting with Thunderbird 153, legacy and privileged add-ons will require the ESR channel. Users on the regular release track may need to switch to Thunderbird ESR 153 to continue using full functionality.

We strongly recommend ensuring you are on a supported ESR version if you rely on advanced QuickFolders features.


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