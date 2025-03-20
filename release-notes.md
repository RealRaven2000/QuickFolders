

**Maintenance v 6.10.1**

*   Improved svg icon coloring for tabs, to avoid dark icons on dark backgrounds - this is achieved by adding color-scheme rules for palette based colors. [issue #553]
*   Improved keyboard focus + navigation in QuickFolders Tabs; 
*   QuickFolders toolbar unintended "preview mode" bug (when opening options in dialog) [issue #557]
*   Default to showing QuickFolders options in tab instead of dialog 
*   Select a subfolder from tab popup with [Enter]  [issue #560]
*   Fixed: "Cancel quickMove" feature missing in 6.10 [issue #558]


**Improvements**

*   New option to always display QuickFolders Options in a tab. 
*   quickJump feature - Use [CTRL] key to open folder in a new TB tab. [issue #540]
*   quickJump - Modifier key [Alt] to open folder in new window. [issue #542]
*   Option to disable highlighting invalid tabs. Some IMAP implementations have problems telling the Add-on that certain folders really exist. You can find this option on Settings / Advanced under the group Updates. [issue #478]
*   accessibility: quickJump / quickMove prority for QF bookmarks in results & screenreader support. [issue #548]
*   accessibility: Support adding QuickFolders (bookmark folders) using keyboard. [issue #550]
*   accessibility: Accessibility option: Remove 'customize icon' command from folder context. [issue #551]
*   accessibility: Support keyboard navigation of the QuickFolders toolbar [issue #552]
  

**Bug Fixes**

*   Fixed: CTRL+click Tab popup folder opens 2 Thunderbird tabs. [issue #541]
*   Fixed: No cursive tab on new mails if "display unread tabs as bold" is disabled. [issue #539]
*   Fixed: can no longer remove customized icon from tab. [issue #546]

**Miscellanei**

*   Compatibility with Thunderbird 137.*
*   Using wx API function for opening support websites - Tb 135 created an unwanted alert.
*   Removed inline event handlers which will be deprecated in Thunderbird 136. [issue #543]
*   Thunderbird 136 retires `ChromeUtils.import` - replace with `importESModule`. [issue #547]
*   streamlined onboarding / update screens
*   Fixed an issue with dark icons on active options tab for better visibility. [issue #553]

