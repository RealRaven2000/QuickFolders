
**Maintenance Release 6.13.1**
*   Made compatible with Thunderbird 145.*

    There is a bug on thunderbird.net that may not be propagated to some users when we increase max version compatibility; this can lead to a false report of the Add-on appearing as incompatible with the current version.

    I raised a bug with Thunderbird to address this problem: <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1986027">[Bugzilla 1986027]</a>. Please vote with us for getting this fixed!
*   Added Norwegian locale.


**Improvements 6.13**

*   Made compatible with Thunderbird 143
*   Fixed missing/broken menu icons in all popup menus of Thunderbird 143 [issue #602]
*   Minimized impact of "News Flag" — now displayed as a badge icon 🟠 [issue #607]
*   Intermittently, current folder bar was not displayed on main 3pane (first) tab [issue #608]
*   Toolbar button icons sometimes don’t update immediately when changing themes [issue #611]
  

**Bug Fixes**

*   Fixed: QuickFolders toolbar was not displayed on startup in Thunderbird 143, with toggle button not working [issue #609]
*   Folder navigation buttons can now be removed independently of Message Navigation buttons - they were falsely linked to the message navigation settings [issue #610]



**Unconfirmed**

*   quickMove with history should move mail but jumps to folder instead [issue #606] I have seen this rare behavior intermittently and am currently investigating how to fully replicate it
