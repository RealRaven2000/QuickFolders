"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/*===============
  Project History
  ===============
	
	legacy history (0.9.3 - 5.16) moved to file: history_legacy.txt
    
=== 6.0 - FORKED CODE BASE FOR THUNDERBIRD 115 and later ===  
    
  6.0 QuickFolders Pro - 30/07/2023
    ## [issue 351] Compatibity with Thunderbird 115 (ESR 2023/24)
    ## Update "# licensed days left" at midnight. 
    ## - TO DO: new browser action button
    ## - messageServiceFromURI moved to MailServices
    ## - rewrote QI.rebuildSummary() function
    ## replaced deprecated {OS}
    ## TO DO: find replacement for OS.Path.fromFileURI() - see repairTreeIcons()
    ## replace IOUtils.read with IOUtils.readJSON where appropriate
    ## moved navigation bar into 3pane document. (Util.document3pane)

    
  6.1  QuickFolders Pro - 08/08/2023
    ## [issue 371] Deal with Console error “receiving end does not exist”
    ## [issue 372] Changing 'minimum height'  opens help topic (bug 25021)
    ## [issue 374] Fixed integration of main toolbar with single message tab 
    ##             select current folder in toolbar when switching to single mail tab
    ## [issue 376] Bookmarks: in Thunderbird 115 "Add current item" not working
    ## [issue 381] New subfolder while dragging to tab throws error
    ## [issue 382] quickJump shortcut '=' to show most recent used folders broken
    ## [issue 370] support showing contained folders of a Tab representing unified folders.
    ## Various improvements of navigation behavior in single message tab and single mail window
    ## [issue 375] Added configuration Option to close tab after mail is moved from single message view
    ## eliminated <description> tags from options.html
    ## [issue 383] Custom navigation bar icon color picker doesn't work and may lead to unreadable current folder button
    ## Numerous layout improvements in settings screen including dark theme support
    ## Moved [F9] command to toggle folder pane to [F10]
    ## [issue 385] Moving multiple messages via quickMove - fails the filter assistant 
    ## [issue 354] Display correct number of moved mails (after quickMove)

  6.1.1 QuickFolders Pro - 08/08/2023
    ## [issue 386] Toggle toolbar button and toggle folder pane only work after install, 
    ##                                                           not next session issue 


  6.2 QuickFolders Pro - 30/08/3023
    ## [issue 395] Fix navigation bar (current folder bar) positioning when switching between classic and vertical layout
    ## [issue 396] Add 'compact density' support
    ## improved "Apple Pills" theme
    ## Make sure current folder tab is changed when different theme is selected.
    ## [issue 397] Fixed:  Filter Assistant Auto-start not working with quickMove function 
    ## [issue 389] quickJump switches to matching single mail tab instead of jumping to Folder in current tab
    ## [issue 392] Keyboard collision with quick filter toolbar
    ## [issue 387] Number shortcuts not working - move mail with Option+Shift+Number
    ## [issue 391] Display license expiry date in registration dialog as local date (not as YYYY-MM-DD)
    ## [issue 380] Retired option to set QuickFolders toolbar position
    ## Repaired: set keyboard focus back to thread pane after quickmove
    ## [issue 394] Make menu font size configurable - setting separate font size for all popup menus
    ## Allow setting tab font size in "Apple Pills" theme
    ## Improved coloring & Layout for Apple theme
    ## After the license was viewed via the menu "check license status", now reset 
          the "renew license" button for the day and return to normal toolbar icon 
          (remove special coloring / message)

  6.3 QuickFolders Pro - 30/10/2023
    ## [issue 399] Add custom icons in folder tree in Thunderbird 115
    ## [issue 398] Fixed: Open folder from QF Tab while viewing a message 
    ## [issue 400] Make registration screen less tall / easily resizable
    ## [issue 404] Fixed toolbar issues in Single Message window: "null" element 
    ## [issue 409] Navigation Bar: Avoid horizontal overflow in columns view
    ## [issue 407] Support svg icons in tabs - make icon size configurable
    ## [issue 408] Tab specific properties panel cut off at bottom
    ## [issue 406] Fixed: "Empty Junk" command intermittently hidden from context menus
    ## [issue 412] Dragging mail to Current Folder tab does not open subfolders popup
    ## [issue 417] Message list scrolls to top when switching folders
    ## [issue 420] Drag to new subfolder command missing

  6.4 QuickFolders Pro - 04/12/2023
    ## [issue 441] Make advanced settings for QuickFolders Settings accessible to all operating systems
    ## [issue 425] Load configuration doesn't work
    ## [issue 427] Removed unwanted text shadow in quickJump help panel
    ## [issue 428] Popup menus not removed when dragging across QuickFolders tabs
    ## [issue 410] Dragging mail to quickMove Button leaves folder popup menu hanging on first tab
    ## [issue 430] Fixed disappearing 'Customize Icon' context menu item
    ## [issue 434] quickfilter search box loses focus 1 second after clicking a QF tab
    ## [issue 436] Shift-M shortcut not working for folders in version 6.3 of QF and 115 of TB.
    ## [issue 437] Advanced Properties - default to / from fields not working in Tb115
    ## [issue 433] Problems in tab-specific properties panel on Mac (Tb 115)
    ## [issue 439] Thunderbird 122 beta - cannot add new tabs to toolbar

  6.4.1 QuickFolders Pro - 10/12/2023
    ## Improvement: activate the correct settings page (license check, Support or help) if the 
    ##   settings dialog or tab is already open

  6.5 QuickFolders Pro - 15/04/2024
    ## Improved Italian Translations thanks to Leopoldo Saggin 
    ## Localized hard coded English strings (thanks to Leopoldo Saggin for finding these)
    ## Fixed layout issues in advanced tab settings
    ## [issue 461] Accessibility improvements for fonts (quickJump) - increase font size of category and find folder elements
    ## [issue 462] Accessibility Improvement: increased (vertical) space around quickJump and reading list buttons
    ## [issue 458] Feature: Mark Newsgroup Read
    ## [issue 459] Ctrl+Right-click QuickFolders Commands don't work
    ## [issue 455] Reading list: add current item to list not working 
    ## [issue 457] Paint Mode - brush icon too big
    ## Opening support sites in a tab is now using API method
    ## [issue 451] quickMove error in conversation view (when results are restricted to current mail account)
    ## [issue 464] Advanced Search Settings - unchecking more multiple Accounts failed to save
    ## Add Alias to register dialog if already set in a license
    ## Added tip about using tbkeys-lite on ALT+Number settings page

  6.5.1 QuickFolders Pro - 16/04/2024
    ## [issue 467] Mark as Read (and similar commands) in Navigation bar may address wrong folder

  6.6 QuickFolders Pro - 21/07/2024
    ## [issue 454] Made QuickFolders compatible with Thunderbird 128
    ## [issue 468] Improved readability & layout for "newly arrived" mail - outlined instead of text shadow
                   (biffstate - true) and added an option to disable special font
    ## [issue 471] Settings Advanced - Hardcoded Localisation for 'Open in New Tab'
    ## [issue 474] Ctrl+click on a subfolder should open new tab, this was fixed.
    ## optimize licenser (omit folders while listing accounts)
    ## [issue 475] Support moving multiple folders with quickMove
    ## [issue 476] Fix file picker which is broken in Thunderbird 125 [bug 1882701]
    ## [issue 480] Fixed: quickMove doesn't fully complete on Tb 128

  6.6.1 QuickFolders Pro - 21/07/2024
    ## removed non-conditional debugger statements.
    ## Holidays!

  6.7 QuickFolders Pro - 17/08/2024
    ## Added compatibility with Thunderbird 130
    ## [issue 488] Experimental feature: regex filter based on currently selected mail 
    ## [issue 489] Improved Dark theme support - Make coloring of svg icons without requiring
                   the  Mozilla specific config switch svg.context-properties.content.enabled
                   also removed font dependence by converting all texts to paths
    ## Added option to remove skip unread folder
    ## [issue 486] Fixed: notification popup for restricted features leads to exception + icon not displayed 
    ## [issue 491] Keyboard shortcuts (such as ALT+Left ALT+Right) stopped working in Tb 128.
    ## Shortcuts (such as Shift+M and Shift+J) are unexpectedly triggered when typed in quick search
    ## improved tooltips in settings window

  6.8 QuickFolders Pro - 25/11/2024
    ## [issue 488] Find Related Mails: extended UI to add a selection of multiple searches 
    ## [issue 494] Added an option to reset quick filter when clicking "Move to next mail"
    ## [issue 493] Move mail to folder using CTRL+Number not working
    ## [issue 497] quickMove / quickJump steals focus while typing shortcut combos in QNote.
    ## hide current folder bar in search results tab
    ## [issue 506] Folder names containing single quotes break navigation
    ## added icon to get messages menuitems 
    ## completed Vietnamese translations
    ## Support compatibility with Thunderbird 133

  6.8.1 QuickFolders Pro - 01/12/2024
    ## findRelated: improved transmitting regex options to regex101
    ## [issue 509] Tb 129+ deal with removal of MozElements.NotificationBox.shown() #
    ## Support compatibility with Thunderbird 134

  6.8.2 QuickFolders Pro - 08/12/2024
    ## fix "edit regex" button of find Related mail [issue 488]
    ## prepare for removal of ESMIfy fallback (Thunderbird 136)

  6.9 QuickFolders Pro - 09/01/2025
    ## [issue 463] Improved auto-fill performance of quickMove / quickJump while typing
    ## [issue 512] Creating a subfolder with space in name from quickMove raises an error
    ## [issue 513] Skip unread and Next / Previous sibling folder don't follow tree order (lexical)
    ## [issue 514] QuickFolders blocks native Thunderbird keystrokes that contain Option (metaKey)
    ## [issue 518] Fixed: Tab-Specific Properties broken in Thunderbird beta 134
    ## [issue 507] Open Message from reading list / quickMove in tab broken 
    ## [issue 524] Display QuickFolders toolbar when its settings tab is shown
    ## added a prompt for using find related search pattern (right-click to select)
    ## Added full Czech translation for the User Interface (531 entitites).
    ## Improved mail system icons for dark mode

  6.9.1 QuickFolders Pro - 18/01/2025
    ## [issue 526] Fixed: Shortcut Key configured for quickMove / quickJump are ignored
    ## [issue 531] Fixed: ALT-1/2/3 shortcuts working sporadically; sometimes takes mutliple tries
    ## Completed some missing Czech translations that were accidentally left in English.
    ## [issue 534] Added advanced search setting to not collapse quickMove box after use.
    ## [issue 530] Fixed: toggle toolbar button broken.
    ## Support compatibility with Thunderbird 135

  6.9.2 QuickFolders Pro - 26/01/2025
    ## [issue 532] Return key no longer moves emails when search finds only one folder

  6.10 QuickFolders Pro - 17/03/2025
    ## New option to always display QuickFolders Options in a tab
    ## [issue 540] quickJump feature - Shortcut key to open specified folder in a new TB tab
    ## [issue 542] quickJump - Modifier key [Alt] to open folder in new window 
    ## [issue 548] accessibility: quickJump / quickMove prority for QF bookmarks in results & screenreader support
    ## [issue 550] accessibility: Support adding QuickFolders (bookmark folders) using keyboard
    ## [issue 551] accessibility: new Accessibility option: Remove 'customize icon' command from folder context
    ## [issue 552] accessibility: Support keyboard navigation of the QuickFolders toolbar
    ## [issue 478] option to disable highlighting tabs with invalid folders 🧹
    ---
    ## [issue 539] Fixed: No cursive tab on new mails if "display unread tabs as bold" is disabled.
    ## [issue 541] Fixed: CTRL+click Tab popup folder opens 2 Thunderbird tabs
    ## [issue 546] Fixed: can no longer remove customized icon from tab
    ---
    ## made compatible with Tb 138.*
    ## Using wx API function for opening support websites - no more unwanted alert
    ## Replaced XPCOMUtils.defineLazyGetter => ChromeUtils.defineLazyGetter  (removed in Fx137)
    ## [issue 543] Removed inline event handlers which will be deprecated in Thunderbird 136
    ## [issue 547] Thunderbird 136 retires ChromeUtils.import - replace with importESModule
    ## [issue 555] Support keyboard navigation / screen readers in QuickFolders settings [WIP]
    ## [issue 553] Fixed an issue with dark icons on active options tab for better visibility. 

  6.10.1 QuickFolders Pro - 20/03/2025
    ## [issue 553] improve svg icon coloring for tabs, to avoid dark icons on dark backgrounds
    ##             this is achieved by adding color-scheme rules for palette based colors
    ## Improved keyboard focus + navigation in QuickFolders Tabs; 
    ## [issue 558] "Cancel quickMove" feature missing in 6.10
    ## [issue 557] QuickFolders toolbar unintended "preview mode" bug (when opening options in dialog)
    ## Default to showing QuickFolders options in tab instead of dialog
    ## [issue 560] Select a subfolder from tab popup with [Enter]  (WIP)

  6.10.2 QuickFolders Pro - 22/03/2025
    ## [issue 562] Add Recent folders tab to keyboard flow

  6.10.3 QuickFolders Pro - 24/03/2025
    ## Added missing translations for context menu command to add new QuickFolder.

  6.10.4 QuickFolders Pro - 05/05/2025
    ## Compatibility with Thunderbird 139.*
    ## [issue 559] - Thunderbird folder tree doesn't scroll to current folder (Tb 115)
    ## [issue 571] - (Preview Mode) label not removed from QuickFolders toolbar
    ## Removed (null) behind QF toolbar label in Thunderbird's View menu

  6.11 QuickFolders Pro - 24/06/2025
    ## Remove deprecated nsILocalFile
    ## [issue 581] Saving config file can fail b/c of bad files.path value
    ## [issue 577] new feature: Open folder in Tab as default
    ## [issue 580] Better tooltips in Tab-Specific Properties
    ## [issue 589] Added command to remove license warning panel
    ## Fixed a problem in find orphaned tabs on unified folders.
    ## repairTreeIcons: removed OS.Path.fromFileURI()

  6.11.1 QuickFolders Pro - 25/06/2025
    ## [issue 591] Version 6.11 Not Displaying Sub-Folders on Drag + Drop
    ## [issue 592] Link to the Add-on Compatibility Check appears to do nothing
    ##             also fixed link to point to official Add-on Compatibility Check

  6.12 QuickFolders Pro - 23/07/2025
    ## Make compatible with Thunderbird 141. (bumped to 142 on ATN)
    ## [issue 595] `nsIMsgFolder.prettyName` removed in Thunderbird 141 
    ## [issue 596] `search-textbox` removed in Thunderbird 141 
    ## [issue 598] QuickFolders toolbar not showing in new tab due 
    ##             to mailTabs.query not ready

  6.13 QuickFolders Pro - 19/09/2025
    ## Make compatible with Thunderbird 143.
    ## [issue 602] Thunderbird 143: menu icons of all popup menus missing / broken
    ## [issue 609] Thunderbird 143: QuickFolders toolbar not displayed on startup, toggle button not working 
    ## [issue 606] quickMove with history should move mail, but jumps to folder instead
    ## [issue 607] Minimize impact of "News Flag" - use a badge icon 🟠 instead
    ## [issue 608] Intermittently, current folder bar is not displayed on main 3pane (1st) tab
    ## [issue 610] Bug: folder navigation buttons cannot be removed independently of Message Navigation buttons
    ## [issue 611] Toolbar button icons sometimes don’t update immediately when changing themes

  6.13.1 QuickFolders Pro - 19/10/2025
    ## Made compatible with Thunderbird 145
    ## [issue 602] More icon compatibility fixes
    ## [issue 617] Added Norwegian Locale

  6.14 QuickFolders Pro - 15/12/2025
    ## Made compatible with Thunderbird 148
    ## [issue 600] Added option to reverse alphabetic sorting of subfolder menus
    ## [issue 623] quickMove: Update cursor position while  typing in folder searchbox
    ## [issue 624] Remove duplicate 🔎 and ✕ icons in quickMove search - Tb Release (142+)
    ## [issue 620] Fixed: Recent folders button missing on Current Folder Toolbar
    ## fixed "rectangle" icons in current folder popups
    ## fixed > chevron positions on all popup menus
    ## fixed icons in mail commands popups
    ## [issue 621] less debug logs polluting error console mostly related to 'loadDictionary'
    ## [issue 626] Add an option to disable folder notifications after folder compaction (e.g. empty trash)

  6.14.1 QuickFolders Pro - 18/12/2025
    ## renamed to RESTRICT_UPDATEMSG
    ## Fixed an issue with setting the "has news" flag: these were omitted since 6.11.1.
    
  6.14.2 QuickFolders Pro - 21/12/2025
    ## Made compatible with Thunderbird 149
    ## Added missing translations and disabled a superflous update message. silent update for users of 6.14.1

  6.15 QuickFolders Pro - 22/03/2026
    ## [issue 652] Added “Switch to Free version” option and license backup / recovery after key expiry
    ## [issue 655] Toolbar Icons should reflect the main theme color
    ## [issue 619] automatically resize icons in folder tree to avoid cropping
    ## [issue 639] 3 menu items from QuickFolders Commands submenu do not work
    ## [issue 633] Duplicate custom icons in folder tree - Thunderbird 148
    ## [issue 646] Flat Style Improvement: use the color of custom colored tab for active folder
    ## [issue 647] Fixed broken xhtml dialog "Change order of tabs"
    ## [issue 648] New Pro feature: show account name of current folder instead of QuickFolders label
    ## [issue 643] Redesigned  the themes "Native Tabs" and "Pushbuttons" with a fresh layout
    ## [issue 650] Improve selecting / changing QuickFolders themes by removing overwritten layout rules
    ## [issue 651] Removed custom folder icon reappears after relaunch
    ## [issue 653] Bug 1935334 - Remove usage of PluralForm.sys.mjs from Thunderbird code 
    ## [issue 654] Changes in Advanced search setting ("quickMove Advanced Settings") are not stored

    ## [issue 630] misc: removed unnecessary console errors from quickfolders-util.js

  6.15.1 QuickFolders Pro - 30/03/2026
    ## Made compatible with Thunderbird 151
    ## [issue 657] Thunderbird 149 - toggle navigation button remains green
    ## [issue 651] Fixed: Last removed custom folder icon reappears after relaunch (Tb 149)

  6.16.1 QuickFolders Pro - 29/05/2026
    ## Made compatible with Thunderbird 152
    ## [issue 664] Set Minimum Version to Thunderbird 140 to avoid problems with deprecated APIs
    ## [issue 660] v6.15 Registration dialog: Unstyled buttons to Extend / Renew license
    ## [issue 658] quickJump searchbox losing focus - Mac OS Tahoe 26.4
    ## [issue 659] Drag & Drop in subfolders menu broken - MacOS Tahoe 26.4
    ## [issue 666] After opening QuickFolders Settings, current folder can get "stuck" 
    ## new Github Default branch ESR140, THunderbird 140 and later will be supported with new features going forward
  
  6.16.2 QuickFolders Pro - 10/06/2026
    ## [issue 673] serious regression in v6.16.1 - messages window content area truncated at the top.
    ##             this was caused by alternative xhtml injector
  
	TO DO next
	==========
    ## WIP: command handler for tbkeys-lite! see "shortcut" in qf-background.js
    ## [issue 504] Clicking a QuickFolders tab from a search result (show as list) should open a new tab.
    ## [issue 494] Global Settings tab for find related functions (go next = to delete quick search)
    ## [issue 423] Color Tabs with unread messages
    ## [issue ] convert Tab-Specific Properties to HTML
    ## [issue ]

	Future Work
	===========
    ## [issue ]
    ## [issue 354] Add permanent notifications for messages moved.
    ## [issue 103] Feature Request: Support copying folders
	  ## [Bug 26400] Option to show QuickFolders toolbar at bottom of mail window
    ## [issue 56] Folders intermittently displayed as invalid / non existent (on startup)

    
	Known Issues
	============
		Thunderbird 66 compatibility - more to do for 67! https://privatebin.net/?2c1a1bcc9bebca9c#9Z15ZXr7zj+AOM4CUMDyQBasYCRPb8or+X0nvYcxzHM=
	
		## To Do: without quickFilters installed - the filter mode icon is not 
		          working with full themes (TT deepdark) and neither is filter assistant triggered when a mail
							is dropped in the folder tree.
		## in some themes / languages the icons on the advanced options tab may appear stretched vertically
		   styling max-height for #mailCommandsCustomize .checkbox-icon will also negativeely affect the
			 height for the attached .checkbox-label causing vertical overflows
	  ## changing palette of uncolored folder doesn't update font color (test with TT deepdark)
    ## [Bug 26559] Drag Menu Item to toolbar not creating new QF tab  (Phoenity)
    ## [Bug 26560] Drag Current folder to toolbar not creating new QF tab  (Phoenity)
		## currently you can only drag single emails to a file using the envelope icon in Current Folder Toolbar.
		## when using the DOWN key to go to the search results of find folder, DOWN has to be pressed twice. (Tb+Pb only)
		## search in SeaMonkey delays highlighting the current tab when switching to the folder.
		## when deleting the current folder we should change into the parent folder to avoid confusion 
		##      at the moment we are in the folder after it's moved to trash which makes it look as if 
		##      it still a useful folder (Postbox)
	
###VERSION###

  PRESS
	=====
 
  www.makeuseof.com/tag/10-must-have-thunderbird-addons-25-more/


  KNOWN ISSUES
  ============


  OPEN BUGS
  ============


	A complete list of bugs can be viewed at https://quickfolders.org/bugs.html
  PLANNED FEATURES
  ================
	- persist categories in separate JSON list for more flexibility (e.g. rename)
	- size of category dropdown should expand with length of list

  WISHLIST
  ========
	- drag to thread finds quickfolder with correct thread and drops message there


*/

/* GLOBAL VARIABLES */
var QuickFolders_globalHidePopupId = "",
    QuickFolders_globalLastChildPopup = null,
    QuickFolders_globalWin = Services.wm.getMostRecentWindow("mail:3pane"),
    QuickFolders_globalDoc = document;

var QuickFolders_getWindow = function() {
	return QuickFolders_globalWin;
}

var QuickFolders_getDocument= function() {
	return QuickFolders_globalDoc;
}

if (window.QuickFolders) {
  // take care of previous keylisteners...
  const options = { color: "rgb(253, 229, 50)", background: "rgb(141, 13, 4)" };
  const txt = "There is still a reference to QuickFolders! Removing old key listener…";
  console.log(
    `QuickFolders %c${txt}`,
    `color: ${options.color}; background: ${options.background}`
  );  
  delete window.QuickFolders.keyListen;
  window.QuickFolders = {}
}

var QuickFolders = {
  doc: null,
  win: null,
  WL: {},
  keyAbortController: null,
  findFolderNameStackCount: 0,
  isQuickFolders: true, // to verify this
  // keyListen: EventListener,
  folderPaneListen: false,
  dragPopupState: {
    timer: null,
    popup: null,
    init: function (evt){
      this.lastX = evt?.clientX || null;
      this.lastY = evt?.clientY || null;
    },
    wasMoved: function (evt){
      const threshold = QuickFolders.Preferences.getIntPref("drag.moveTolerance");
      if (this.lastX == null) {
        return false;
      }
      if (this.lastY == null) {
        return false;
      }

      const x = evt.clientX;
      const y = evt.clientY;

      const dx = Math.abs(x - this.lastX);
      const dy = Math.abs(y - this.lastY);
      this.lastX = x;
      this.lastY = y;

      return dx > threshold || dy > threshold;
    }
  },
  _tabContainer: null,
  get tabContainer() {
    if (!this._tabContainer) {
      let d = this.doc || document;
      this._tabContainer =
        d.getElementById("tabmail").tabContainer || d.getElementById("tabmail-tabs");
    }
    return this._tabContainer;
  },
  currentURI: "",
  initDone: false,
  compactReportFolderCompacted: false,
  compactReportCommandType: "",
  compactLastFolderSize: 0,
  compactLastFolderUri: null,
  selectedOptionsTab: -1, // preselect a tab -1 = default; remember last viewed tab!

  // helper function to do init from options dialog!
  initDocAndWindow: function initDocAndWindow(win) {
    const util = QuickFolders.Util;
    let mainWindow;
    if (win && win.document && win.document.documentURI.indexOf("/messenger.xhtml") > 0) {
      mainWindow = win;
    } else if (win && win.document.documentURI.indexOf("/messageWindow.xhtml") > 0) {
      mainWindow = win; // allow passing in single message window also
    } else {
      if (win || (!win && window.documentURI.indexOf("/messageWindow.xhtml") == -1)) {
        mainWindow = util.getMail3PaneWindow();
      }
    }

    if (mainWindow) {
      QuickFolders_globalDoc = mainWindow.document;
      QuickFolders_globalWin = mainWindow;
    } else {
      QuickFolders_globalDoc = document;
      QuickFolders_globalWin = window;
    }
    this.doc = QuickFolders_globalDoc;
    this.win = QuickFolders_globalWin;

    util.logDebug(
      "initDocAndWindow()\nQuickFolders_globalDoc = " + QuickFolders_globalDoc.location,
    );
  },

  initDelayed: async function (WLorig) {
    const prefs = QuickFolders.Preferences,
      util = QuickFolders.Util,
      QI = QuickFolders.Interface;
    if (this.initDone) {
      return;
    }

    // from the time we passed in the window as win
    let win = window;

    if (WLorig) {
      QuickFolders.WL = WLorig;
    }

    // iterate all tabs, Tb115
    QuickFolders.Util.logDebug("restore categories from tab session");
    const tabmail = document.getElementById("tabmail");
    if (tabmail) {
      let tabInfoCount = util.getTabInfoLength(tabmail);
      for (let i = 0; i < tabInfoCount; i++) {
        let info = util.getTabInfoByIndex(tabmail, i);
        if (
          info &&
          (util.getTabMode(info) == "mail3PaneTab" || util.getTabMode(info) == "mailMessageTab")
        ) {
          /******* RESTORE CATEGORIES PER TAB   **********/
          // read from tab session (wx API 115)
          let cats = await QuickFolders.Interface.readTabCategorySession(info);
          // the session is currently deleted
          if (typeof cats == "undefined") {
            QuickFolders.Util.logDebug("no session info for tab category…");
            if (info.QuickFoldersCategory) {
              // re-store for next Tb restart
              await QuickFolders.Interface.storeTabCategorySession(info.QuickFoldersCategory, info);
            }
          } else {
            info.QuickFoldersCategory = cats; // restore from session
          }
          let status = await QuickFolders.Interface.readTabToolbarSession(info);
          if (status && typeof status != "undefined") {
            info.QuickFolders_ToolbarStatus = status;
          }
        }
      }
    }

    let sWinLocation,
      nDelay = prefs.getIntPref("initDelay");

    QuickFolders.initDocAndWindow(win);
    nDelay = nDelay ? nDelay : 750;
    sWinLocation = new String(win.location);

    if (QuickFolders.isCorrectWindow(win)) {
      util.logDebug(
        `initDelayed ==== correct window: ${sWinLocation} - ${win.document.title}\n` +
          `wait ${nDelay} msec until init()…`,
      );

      win.setTimeout(function () {
        QuickFolders.init(win);
      }, nDelay);

      util.logDebug("Adding Search Input event handler…");
      let findFolderBox = QI.FindFolderBox; // #QuickFolders-FindFolder
      if (findFolderBox) {
        // note, keypress events are hanler by QuickFolders.Interface.findFolderKeyDown
        findFolderBox.addEventListener("input", async (event) => {
          const el = event.target;
          if (event && !event.data) {
            switch (event?.inputType) {
              case "deleteContentBackward": // [BACKSPACE] fallthrough
              case "deleteContentForward": // [DEL]
                break;
              default:
                util.logDebug(
                  `find folder box - ìnput event without data: ${event?.inputType}, not calling findFolderName()`,
                  event,
                );
                return;
            }
          }
          util.logDebugOptional(
            "interface.findFolder",
            "findFolderBox - input event, calling setTimeout findFolderName()",
            event,
          );
          setTimeout(() => {
            // [issue 623] use setTimeout to allow cursor position to update
            QI.findFolderName(el);
          }, 0);
        });
      } else {
        util.logDebug("element not found: QuickFolders-FindFolder");
      }

      // [issue 397] Filter Assistant Auto-start not working with quickMove function
      if (prefs.getFiltersBoolPref("autoStart", false) && typeof window.quickFilters == "object") {
        // quickFilters started before QF and automatically started assistant mode
        // but didn't toggle the QuickFolders assistant mode!
        if (!QuickFolders.FilterWorker.FilterMode) {
          if (window.quickFilters.Util.AssistantActive) {
            await QuickFolders.FilterWorker.toggle_FilterMode(true);
          }
        }
      }

      this.initDone = true;
    }
  },

  patchFolderTree: function (tabInfo) {
    let fTree = tabInfo.chromeBrowser.contentWindow.folderTree;
    // add an onSelect event!
    if (fTree) {
      fTree.addEventListener("select", QuickFolders.FolderTreeSelect, false);
    }
  },

  initSingleMsg: async function (WLorig) {
    const prefs = QuickFolders.Preferences,
      util = QuickFolders.Util,
      QI = QuickFolders.Interface;
    let win = window;

    if (WLorig) {
      QuickFolders.WL = WLorig;
    }

    try {
      let doc = win.document; // in case a stand alone messageWindow is opened (e..g double clicking an eml file)
      let wt = doc.getElementById("messengerWindow").getAttribute("windowtype");
      util.logDebug(
        "initSingleMsg() window type(messengerWindow): " + wt + "\ndocument.title: " + doc.title,
      );

      if (wt === "mail:messageWindow") {
        util.logDebug("QuickFolders.initSingleMsg() - Calling displayNavigationToolbar()");
        await QuickFolders.Interface.displayNavigationToolbar({
          display: prefs.isShowCurrentFolderToolbar("messageWindow"),
          doc: win.gTabmail.currentTabInfo.chromeBrowser.contentWindow,
          selector: "messageWindow",
        });
        // set current folder tab label
        if (win.arguments) {
          let args = win.arguments,
            fld;
          // from messageWindow.js actuallyLoadMessage()
          if (args.length && args[0] instanceof Components.interfaces.nsIMsgDBHdr) {
            let msgHdr = args[0];
            fld = msgHdr.folder;
          }

          let cF = QuickFolders.Interface.CurrentFolderTab;
          // force loading main stylesheet (for single message window)
          QI.ensureStyleSheetLoaded("quickfolders-layout.css", "QuickFolderStyles");
          if (fld) {
            QI.initCurrentFolderTab(cF, fld);
          }
          QI.updateUserStyles();
        }
      } else {
        util.logDebug("window type : " + wt);
      }
    } catch (e) {
      if (prefs.isDebug) {
        util.logException("QuickFolders.initDelayed()", e);
      }
    } //-- always thrown when options dialog is up!
  },

  isCorrectWindow: function isCorrectWindow(win) {
    try {
      return (
        win.document.getElementById("messengerWindow").getAttribute("windowtype") === "mail:3pane"
      );
    } catch {
      return false;
    }
  },

  initKeyListeners: function (win) {
    if (!win) {
      win = QuickFolders.Util.getMail3PaneWindow();
    }
    if (QuickFolders.keyListen) {
      QuickFolders.removeKeyListeners(win);
      delete QuickFolders.keyListen;
      // [issue 526]
      QuickFolders.Interface.boundKeyListener = false;
    }
    // only add event listener on startup if necessary
    if (!QuickFolders.Preferences.isKeyboardListeners) {
      return;
    }

    if (!QuickFolders.Interface.boundKeyListener) {
      if (QuickFolders.Preferences.isDebug) {
        QuickFolders.Util.logHighlight("Adding shortcut key listener.", {
          color: "lightyellow",
          background: "#AF3C00",
        });
      }
      win.addEventListener(
        "keyup",
        (QuickFolders.keyListen = function (e) {
          QuickFolders.Interface.windowKeyPress(e, "down");
        }),
        true,
      );
      if (QuickFolders.Preferences.getBoolPref("focusSearchFromMenu")) {
        win.addEventListener(
          "keydown",
          (QuickFolders.keyListen2 = function (e) {
            QuickFolders.Interface.windowMenuKeyPress(e);
          }),
          true,
        );
      }
      QuickFolders.Interface.boundKeyListener = true;
    }
  },

  removeKeyListeners: function (win) {
    if (QuickFolders.keyListen) {
      if (QuickFolders.Preferences.isDebug) {
        QuickFolders.Util.logHighlight("Removing shortcut key listener.", {
          color: "lightyellow",
          background: "#AF3C00",
        });
      }
      win.removeEventListener("keyup", QuickFolders.keyListen);
      delete QuickFolders.keyListen;
    }
    if (QuickFolders.keyListen2) {
      win.removeEventListener("keydown", QuickFolders.keyListen2);
      delete QuickFolders.keyListen2;
    }
  },

  initTabsFromEntries: function (folderEntries) {
    const util = QuickFolders.Util,
      that = this.isQuickFolders ? this : QuickFolders,
      QI = that.Interface; // main window Interface!

    let tabMode = null;

    util.logDebug("initTabsFromEntries()");
    if (!folderEntries.length) {
      return;
    }

    try {
      that.Model.selectedFolders = folderEntries;
      QI.updateUserStyles();

      const tabmail = document.getElementById("tabmail"),
        idx = QuickFolders.tabContainer.tabbox.selectedIndex || 0,
        tab = util.getTabInfoByIndex(tabmail, idx);

      if (!tab) {
        util.logDebug("init: could not retrieve tab / tabMode\n tab=" + tab);
        return;
      }
      tabMode = util.getTabMode(tab);
      // is this a new Thunderbird window?
      let cats;
      if (typeof tab.QuickFoldersCategory == "undefined") {
        let lc = QuickFolders.Preferences.lastActiveCats;
        // if (currentFolder) {
        // select first (or all?) category of any tab referencing this folder
        // if there is an originating window, try to inherit the categories from the last one
        if (lc) {
          cats = lc;
        } else {
          cats = QuickFolders.FolderCategory.ALL; // retrieve list!
        }
        // }
      } else {
        cats = tab.QuickFoldersCategory;
      }

      util.logDebug("init: setting categories to " + cats);
      if (["folder", "message", "mail3PaneTab"].includes(tabMode)) {
        // restore categories of first tab; set to "all" if not set
        QI.currentActiveCategories = cats;
      }
    } catch (ex) {
      util.logException("init: folderEntries", ex);
    } finally {
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: false });
      // selectCategory already called updateFolders!  was that.Interface.updateFolders(true,false)
      // make sure tabs not in active category are hidden - this at least doesn't happen if we load the extension from the debugging tab
      // [issue 283][issue 279] avoid selecting category here - test in 91 too!

      if (
        (tabMode == "folder" || tabMode == "mail3PaneTab") &&
        QI.currentActiveCategories != QuickFolders.FolderCategory.INIT
      ) {
        util.logDebugOptional("categories", "forcing selectCategory");
        const bkCat = QI.currentActiveCategories; // force redraw by deleting it
        QI._selectedCategories = null;
        QI.selectCategory(bkCat, false);
      }
    }
  },

  init: async function (win) {
    const util = QuickFolders.Util,
      that = this.isQuickFolders ? this : QuickFolders,
      prefs = that.Preferences;

    if (prefs?.isDebug) {
      const myver = that.Util.Version,
        ApVer = that.Util?.ApplicationVersion || "?",
        ApName = that.Util?.Application || "?";
      that.LocalErrorLogger(
        `QuickFolders.init() - QuickFolders Version ${myver}\n` +
          `Running on ${ApName} Version ${ApVer}`,
      );
    }

    that.addTabEventListener();
    QuickFolders.initKeyListeners(win);

    // [issue 208] - wait for folders to be ready to avoid "invalid" tabs - WIP
    await new Promise((resolve) => {
      let { gMailInit } = win;
      if (!gMailInit || !gMailInit.delayedStartupFinished) {
        util.logDebug(
          "delayedStartupFinished is not set yet - waiting for event to initialize folders…",
        );
        let obs = (finishedWindow, _topic, _data) => {
          if (finishedWindow != win) {
            return;
          }
          Services.obs.removeObserver(obs, "mail-delayed-startup-finished");
          util.logDebug("mail-delayed-startup-finished fired!");
          resolve();
        };
        Services.obs.addObserver(obs, "mail-delayed-startup-finished");
      } else {
        resolve();
      }
    });

    // move out to allow reload / editing feature
    let folderEntries = prefs.loadFolderEntries();
    // issue 189 - prepare conversion for account specific relative path storage
    QuickFolders.Model.correctFolderEntries(folderEntries);
    this.initTabsFromEntries(folderEntries);

    // only load in main window(?)
    // [issue 399] needs to be moved to the 3pane document code!!!!!!!!!!!!!!

    // add tab listeners to automatically main toolbar when it is not needed
    QuickFolders.Interface.initToolbarTabListener();

    that.Util.logDebug("QuickFolders.init() ends.");
    // now make it visible!
    QuickFolders.Interface.Toolbar.style.display = "flex"; // -moz-inline-box

    if (QuickFolders.Preferences.getBoolPref("contextMenu.hideFilterMode")) {
      if (QuickFolders.Interface.FilterToggleButton) {
        QuickFolders.Interface.FilterToggleButton.collapsed = true;
      }
    }
    // QuickFolders.addFolderPaneListener();

    // Reading list
    if (QuickFolders.bookmarks) {
      QuickFolders.bookmarks.load();
    }
    QuickFolders.initLicensedUI();
    QuickFolders.Interface.updateMainWindow(false);
  },

  // all main window elements that change depending on license status (e.g. display "Expired" instead of QuickFolders label)
  initLicensedUI: function initLicensedUI() {
    let State = QuickFolders.Util.licenseInfo.status,
      hasLicense = QuickFolders.Util.hasValidLicense();
    QuickFolders.Util.logDebug(
      "initLicensedUI - hasLicense = " + hasLicense + "\n licenseInfo:",
      QuickFolders.Util.licenseInfo,
    );
    if (hasLicense) {
      // reset licenser (e.g. in new window)
      QuickFolders.Util.logDebug("License found - removing Animations()…");
      QuickFolders.Interface.removeAnimations("quickfolders-layout.css");
    }
    let menuRegister = document.getElementById("QuickFolders-ToolbarPopup-register");
    if (menuRegister) {
      switch (State) {
        case "Valid":
          menuRegister.classList.add("paid");
          menuRegister.classList.remove("free");
          menuRegister.label = QuickFolders.Util.getBundleString(
            "qf.menuitem.quickfolders.register",
          );
          break;
        case "Expired":
          menuRegister.label =
            "QuickFolders Pro: " +
            QuickFolders.Util.getBundleString("qf.notification.premium.btn.renewLicense") +
            "\u2026";
          menuRegister.classList.add("expired");
          menuRegister.classList.remove("free");
          break;
        default:
          menuRegister.label = QuickFolders.Util.getBundleString(
            "qf.menuitem.quickfolders.register",
          );
          menuRegister.classList.add("free");
      }
    }
    QuickFolders.Interface.updateQuickFoldersLabel.call(QuickFolders.Interface); // this is also called when udpating the main toolbar with QI.updateFolders()
  },

  sayHello: function sayHello() {
    QuickFolders.Util.alert("Hello from QuickFolders");
  },

  // handler for dropping folder shortcuts (and emails!)
  toolbarDragObserver: {
    get util() {
      return QuickFolders.Util;
    },
    get prefs() {
      return QuickFolders.Preferences;
    },
    win: QuickFolders_getWindow(),
    doc: QuickFolders_getDocument(),

    canHandleMultipleItems: false,

    getSupportedFlavours: function () {
      let flavours = new FlavourSet();
      flavours.appendFlavour("text/x-moz-folder"); // folder tree items
      flavours.appendFlavour("text/x-moz-newsfolder");
      flavours.appendFlavour("text/unicode"); // buttons
      flavours.appendFlavour("text/currentfolder"); // custom flavour for dragging current
      return flavours;
    },

    dragLeave: function (evt) {
      this.util.logDebugOptional("dnd", "toolbarDragObserver.dragLeave");
      if (QuickFolders_globalHidePopupId) {
        let doc = evt.target.ownerDocument || this.doc;
        QuickFolders.Interface.removeLastPopup(QuickFolders_globalHidePopupId, doc);
      }
    },

    dragEnter: function (evt) {
      let t = evt.currentTarget,
        dTxt = "target: " + t.nodeName + "  '" + t.id + "'",
        ot = evt.originalTarget;
      if (ot) {
        dTxt += "\noriginal target:" + ot.nodeName + "  '" + ot.id + "'";
      }
      this.util.logDebugOptional("dnd", "toolbarDragObserver.dragEnter - \n" + dTxt);
      if (ot && ot.nodeName.includes("arrowscrollbox")) {
        this.util.logDebugOptional("dnd", "dragEnter on arrowscrollbox - creating scroll event");
        let event = document.createEvent("Event");
        setTimeout(function () {
          event.initEvent("scroll", true, true);
          ot.dispatchEvent(event);
        });
        return true;
      }
      evt.preventDefault();
      return false;
    },

    dragOver: function (evt) {
      const Ci = Components.interfaces,
        Cc = Components.classes;
      evt.preventDefault();

      let dragSession = Cc["@mozilla.org/widget/dragservice;1"]
        .getService(Ci.nsIDragService)
        .getCurrentSession();
      let types = Array.from(evt.dataTransfer.mozTypesAt(0)),
        contentType = types[0];
      // [Bug 26560] add text/plain
      // only allow folders or  buttons!
      if (
        [
          "text/x-moz-folder",
          "text/x-moz-newsfolder",
          "text/currentfolder",
          "text/unicode",
          "text/plain",
        ].includes(contentType)
      ) {
        dragSession.canDrop = true;
        evt.preventDefault(); // allow dropping
      } else {
        dragSession.canDrop = false;
      }
    },

    canDrop: function (e, s) {
      try {
        // this.util.logDebugOptional("dnd","toolbarDragObserver.canDrop - Session.canDrop = " +  s.canDrop);
        
        if (this.prefs.isDebugOption("dnd") && (!s || (s && !s.canDrop))) {
          // eslint-disable-next-line no-debugger
          debugger;
        }
        if (s) {
          s.canDrop = true;
        }
      } catch { ; }
      return true;
    },

    drop: function (evt, dragSession, eventDetail = null) {
      const Ci = Components.interfaces,
        Cc = Components.classes;

      function addFolder(src) {
        if (src) {
          let msg = "",
            maxTabs,
            warnLevel;
          if (!QuickFolders.Util.hasValidLicense()) {
            // max tab
            maxTabs = QuickFolders.Model.MAX_UNPAID_TABS;
            msg = QuickFolders.Util.getBundleString("license_restriced.unpaid.maxtabs", [maxTabs]);
            warnLevel = 2;
          } else if (QuickFolders.Util.hasStandardLicense()) {
            maxTabs = QuickFolders.Model.MAX_STANDARD_TABS;
            msg = QuickFolders.Util.getBundleString("license_restriced.standard.maxtabs", [
              maxTabs,
            ]);
            warnLevel = 0;
          }
          if (
            QuickFolders.Model.selectedFolders.length >= maxTabs &&
            !QuickFolders.Model.getFolderEntry(src)
          ) {
            if (msg) {
              // allow adding folder (to different category if tab already exists)
              // otherwise, restrictions apply
              QuickFolders.Util.popupRestrictedFeature("tabs>" + maxTabs, msg, warnLevel);
              QuickFolders.Interface.viewSplash(msg);
              return false;
            }
          }

          let cat = QuickFolders.Interface.CurrentlySelectedCategories;
          if (QuickFolders.Model.addFolder(src, cat)) {
            let s = "Added shortcut " + src + " to QuickFolders";
            if (cat !== null) {
              s = s + " Category " + cat;
            }
            try {
              QuickFolders.Util.showStatusMessage(s);
            } catch { ; }
          }
        }
        return true;
      }
      const directUri = eventDetail ? eventDetail.folderURI : null;
      if (!dragSession && !directUri) {
        dragSession = Cc["@mozilla.org/widget/dragservice;1"]
          .getService(Ci.nsIDragService)
          .getCurrentSession();
      }

      if (this.prefs.isDebugOption("dnd")) {
        QuickFolders.Util.logToConsole("toolbarDragObserver.drop() - dragSession = ", dragSession);
      }
      // let contentType = dropData.flavour ? dropData.flavour.contentType : dragSession.dataTransfer.items[0].type;
      let types, contentType;

      if (directUri) {
        QuickFolders.Util.logDebugOptional("dnd", `toolbarDragObserver.drop uri - ${directUri}`);
      } else {
        types = Array.from(evt.dataTransfer.mozTypesAt(0));
        contentType = types[0];
        QuickFolders.Util.logDebugOptional("dnd", `toolbarDragObserver.drop - ${contentType}`);
      }

      QuickFolders.Util.logDebugOptional("dnd", "toolbarDragObserver.drop " + contentType);
      let msgFolder, sourceUri;

      switch (contentType) {
        case "text/x-moz-folder":
        case "text/x-moz-newsfolder":
          if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) {
            let count = evt.dataTransfer.mozItemCount ? evt.dataTransfer.mozItemCount : 1;
            for (let i = 0; i < count; i++) {
              // allow multiple folder drops...
              msgFolder = evt.dataTransfer.mozGetDataAt(contentType, i);
              if (msgFolder.QueryInterface) {
                sourceUri = msgFolder.QueryInterface(Components.interfaces.nsIMsgFolder).URI;
              } else {
                sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dragSession); // Postbox
              }
              if (!addFolder(sourceUri)) {
                break;
              }
            }
          } else {
            sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dragSession); // older gecko versions.
            addFolder(sourceUri);
          }

          break;
        case "text/currentfolder":
          // sourceUri = dropData.data;
          sourceUri = evt.dataTransfer.mozGetDataAt(contentType, 0);
          addFolder(sourceUri);
          break;
        case "text/plain": // [Bug 26560]
        case "text/unicode":
          {
            // plain text: button was moved OR: a menuitem was dropped!!
            // sourceUri = dropData.data;
            sourceUri = evt.dataTransfer.mozGetDataAt(contentType, 0);
            const eType = dragSession.dataTransfer.mozSourceNode.tagName;
            let myDragPos;
            if (evt.pageX < 120) {
              // should find this out by checking whether "Quickfolders" label is hit
              myDragPos = "LeftMost";
            } else {
              myDragPos = "RightMost";
            }
            if (eType === "menuitem" || eType === "menu") {
              addFolder(sourceUri);
            } else {
              if (!QuickFolders.Model.insertAtPosition(sourceUri, "", myDragPos)) {
                //a menu item for a tab that does not exist was dropped!
                addFolder(sourceUri);
              }
            }
          }
          break;
        default:
          {
            if (directUri) {
              // context folder add:
              addFolder(directUri);
              return;
            }

            let errText = "";
            if (typeof contentType == "string") {
              errText = `Dropped object has unsupported content type: [${contentType}]\n`;
            } else {
              errText = `Cannot determine what was dropped, contentType is [${typeof contentType}]\n`;
            }
            QuickFolders.Util.logHighlight(
              "toolbarDragObserver.drop FAILED\n",
              { color: "white", background: "rgb(80,0,0)" },
              errText,
              "dataTransfer Object: ",
              evt.dataTransfer,
              "\ncontained items:",
              evt.dataTransfer ? evt.dataTransfer.items : "n/a",
            );
          }
          break;
      }
    },
  },

  // recursive popups have to react to drag mails!
  popupDragObserver: {
    win: QuickFolders_getWindow(),
    doc: QuickFolders_getDocument(),
    newFolderMsgUris: [],
    dragAction: null,

    getSupportedFlavours: function menuObs_getSupportedFlavours() {
      let flavours = new FlavourSet();
      flavours.appendFlavour("text/x-moz-message");
      flavours.appendFlavour("text/unicode"); // test
      flavours.appendFlavour("text/plain"); // [Bug 26560]

      // MOVE FOLDER SUPPORT
      flavours.appendFlavour("text/x-moz-folder"); // folder tree items
      return flavours;
    },

    dragOverTimer: null,

    dragEnter: function (evt, dragSession) {
      const Ci = Components.interfaces,
        Cc = Components.classes,
        util = QuickFolders.Util;

      if (!dragSession) {
        dragSession = Cc["@mozilla.org/widget/dragservice;1"]
          .getService(Ci.nsIDragService)
          .getCurrentSession();
      }

      let popupStart = evt.target;

      util.logDebugOptional(
        "dnd.detail",
        "popupDragObserver.dragEnter " +
          popupStart.nodeName +
          " - " +
          popupStart.getAttribute("label"),
      );
      try {
        evt.preventDefault(); // fix layout issues in TB3 + Postbox!

        let pchild = Array.from(popupStart.children).find(
          (e) => e.tagName.toLowerCase() == "menupopup",
        );
        // popupStart.firstChild; Thunderbird 60
        if (pchild) {
          // hide all sibling popup menus
          let psib = popupStart.nextSibling;
          while (psib) {
            if (psib.label) {
              util.logDebugOptional(
                "dnd",
                `check next sibling + ${psib.nodeName} '${psib.label}' …`,
              );
            }
            if (psib.nodeName === "menu" && popupStart !== psib) {
              if (psib.label) {
                util.logDebugOptional("dnd", "Hiding previous popup menu.");
              }
              // HTMLCollection
              for (let x of psib.children) {
                if (x.tagName == "menupopup") {
                  x.hidePopup();
                }
              }
              // psib.children.forEach(x => { if (x.tagName=='menupopup') x.hidePopup(); });
            }
            psib = psib.nextSibling;
          }
          psib = popupStart.previousSibling;
          while (psib) {
            if (psib.label) {
              util.logDebugOptional(
                "dnd",
                `check previous sibling + ${psib.nodeName} '${psib.label}' …`,
              );
            }
            if (psib.nodeName === "menu" && popupStart !== psib) {
              if (psib.label) {
                util.logDebugOptional("dnd", "Hiding previous popup menu.");
              }
              for (let x of psib.children) {
                if (x.tagName == "menupopup") {
                  x.hidePopup();
                }
              }
              // psib.children.forEach(x => { if (x.tagName=='menupopup') x.hidePopup(); });
            }
            psib = psib.previousSibling;
          }
          // only show popup if they have at least one menu item!
          if (pchild.children && pchild.children.length > 0) {
            pchild.openPopup(popupStart, "end_before", 0, -1, "context", false);
          }
          util.logDebugOptional("dnd", `Displayed popup '${popupStart.getAttribute("label")}'`);
        }
      } catch (e) {
        QuickFolders.Util.logDebug("dragEnter: failure - " + e);
      }
    },

    // deal with old folder popups
    dragLeave: function (evt, dragSession) {
      const util = QuickFolders.Util;
      let popupStart = evt.target;
      if (!dragSession) {
        dragSession = Components.classes["@mozilla.org/widget/dragservice;1"]
          .getService(Components.interfaces.nsIDragService)
          .getCurrentSession();
      }

      // find parent node!
      util.logDebugOptional(
        "dnd.detail",
        `popupDragObserver.dragLeave ${popupStart.nodeName} - ${popupStart.getAttribute("label")}`
      );
      try {
        if (popupStart.nodeName == "menu") {
          QuickFolders_globalLastChildPopup = popupStart; // remember to destroy!
        }
      } catch (e) {
        util.logDebugOptional("dnd", "CATCH popupDragObserver.dragLeave: \n" + e);
      }
    },

    dragOver: function (evt, flavour, dragSession) {
      if (!dragSession) {
        dragSession = Components.classes["@mozilla.org/widget/dragservice;1"]
          .getService(Components.interfaces.nsIDragService)
          .getCurrentSession();
      }

      let types = Array.from(evt.dataTransfer.mozTypesAt(0)),
        contentType = types[0];

      if (dragSession) {
        dragSession.canDrop = contentType === "text/x-moz-message";
        if (null !== QuickFolders_globalLastChildPopup) {
          QuickFolders_globalLastChildPopup = null;
        }
        if (dragSession.canDrop) {
          evt.preventDefault(); // allow dropping
        }
      }
    },

    // drop mails on popup: move mail, like in buttondragobserver
    // NOT USED DURING MESSAGE DROPS! IT IS USING THE buttonDragObserver.drop INSTEAD!
    drop: async function (evt, dropData, dragSession) {
      const Ci = Components.interfaces,
        Cc = Components.classes,
        util = QuickFolders.Util,
        model = QuickFolders.Model,
        QI = QuickFolders.Interface,
        QFFW = QuickFolders.FilterWorker;
      util.logDebugOptional("dnd", "popupDragObserver.drop", evt);
      if (!dragSession) {
        dragSession = Cc["@mozilla.org/widget/dragservice;1"]
          .getService(Ci.nsIDragService)
          .getCurrentSession();
      }

      let isThread = evt.isThread,
        isCopy =
          QuickFolders.popupDragObserver.dragAction === Ci.nsIDragService.DRAGDROP_ACTION_COPY,
        menuItem = evt.target,
        messageUriList = QuickFolders.popupDragObserver.newFolderMsgUris,
        types = Array.from(evt.dataTransfer.mozTypesAt(0)),
        contentType = types[0];

      let moveOrCopy = async function moveOrCopy(newFolder, sourceURI) {
        let sourceFolder,
          step =
            "3. " +
            (isCopy ? "copy" : "move") +
            " messages: " +
            newFolder.URI +
            " thread:" +
            isThread;
        util.logDebugOptional("dragToNew", step);

        if (QFFW.FilterMode) {
          sourceFolder = model.getMsgFolderFromUri(sourceURI, true);
          let virtual = util.isVirtual(sourceFolder);
          if (!sourceFolder || virtual) {
            let msgHdr = messenger.msgHdrFromURI(
              QuickFolders.popupDragObserver.newFolderMsgUris[0].toString(),
            );
            sourceFolder = msgHdr.folder;
          }
        }
        let msgList = await util.moveMessages(newFolder, messageUriList, isCopy);

        // have the filter created with a delay so that filters can adapt to the new folder!!
        if (QFFW.FilterMode && QFFW.FilterModeLegacy) {
          // if user has quickFilters installed, use that instead!!
          await QFFW.createFilterAsync(sourceFolder, newFolder, msgList, isCopy, true);
        }

        util.logDebugOptional("dragToNew", "4. updateFolders…");
        util.touch(newFolder);
        QI.updateFolders(false, false); // update context menus
      };

      // helper function for creating a new subfolder => TODO implement filter learn for this case!
      // FolderParam = parent folder [uri in Postbox] passed back by the create folder dialog
      function newFolderCallback(aName, FolderParam) {
        const model = QuickFolders.Model,
          isEncodeUri = QuickFolders.Preferences.getBoolPref("newFolderCallback.encodeURI");

        let step = "0 - determine folder URI";
        aName = aName.trim();
        if (!aName) {
          return false;
        }
        try {
          let currentURI = QuickFolders.Util.CurrentFolder.URI,
            aFolder = FolderParam.QueryInterface(Ci.nsIMsgFolder),
            uriName = isEncodeUri ? encodeURI(aName) : aName; // encoding leads to problems with spaces!

          // we're dragging, so we are interested in the folder currently displayed in the threads pane
          step = "1. create sub folder: " + aName;
          util.logDebugOptional("dragToNew", step);
          let newFolderUri = aFolder.URI + "/" + uriName;
          util.getOrCreateFolder(newFolderUri, Ci.nsMsgFolderFlags.Mail).then(
            function createFolderCallback(f) {
              let fld = f || model.getMsgFolderFromUri(newFolderUri, true);
              moveOrCopy(fld, currentURI);
            },
            function failedCreateFolder(reason) {
              util.logToConsole("getOrCreateFolder() ", reason);
              util.alert(
                "Something unforeseen happened trying to create the folder, for detailed info please check tools / developer tools / error console!\n" +
                  "To add more detail, enable debug mode in QuickFolders advanced settings.",
              );
            },
          );

          return true;
        } catch (ex) {
          util.alert("Exception in newFolderCallback, step [" + step + "]: " + ex);
        }
        return false;
      }

      try {
        util.logDebugOptional("dnd", "popupDragObserver.drop " + contentType);
        util.logDebugOptional("dnd", `target's parent folder: ${menuItem.folder.URI}`);
        let targetFolder = menuItem.folder.QueryInterface(Ci.nsIMsgFolder);

        if (!targetFolder.canCreateSubfolders) {
          util.alert(
            "You can not create a subfolder in " +
              (targetFolder.prettyName || targetFolder.localizedName),
          );
          return false;
        }

        let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(
          Ci.nsITransferable,
        );
        trans.addDataFlavor("text/x-moz-message");

        // let's store the Msg URIs from drag session before we do anything else!!
        QuickFolders.popupDragObserver.dragAction = dragSession.dragAction; // remember copy or move?
        // reset in case there is already data there; only move mails of the last dnd operation!
        while (QuickFolders.popupDragObserver.newFolderMsgUris.length) {
          QuickFolders.popupDragObserver.newFolderMsgUris.pop();
        }

        let txtUris = "";
        const dt = evt.dataTransfer,
          types = dt.mozTypesAt(0);

        // types is a DOMStringList not an Arry, use contains, not includes
        if (types.contains("text/x-moz-message")) {
          for (let i = 0; i < dt.mozItemCount; i++) {
            let messageUri = dt.mozGetDataAt("text/x-moz-message", i);
            txtUris += "dataTransfer [" + i + "] " + messageUri + "\n";
            QuickFolders.popupDragObserver.newFolderMsgUris.push(messageUri);
          }
          util.logDebugOptional("dnd", txtUris);
        } else {
          // LEGACY CODE!
          util.logDebugOptional("dnd", "LEGACY drag+drop code: using dragSession!");
          for (let i = 0; i < dragSession.numDropItems; i++) {
            dragSession.getData(trans, i);
            let dataObj = new Object(),
              flavour = new Object(),
              len = new Object();
            try {
              trans.getAnyTransferData(flavour, dataObj, len);

              if (flavour.value === "text/x-moz-message" && dataObj) {
                dataObj = dataObj.value.QueryInterface(Ci.nsISupportsString);
                let messageUri = dataObj.data.substring(0, len.value);
                QuickFolders.popupDragObserver.newFolderMsgUris.push(messageUri);
              }
            } catch (e) {
              QuickFolders.LocalErrorLogger(
                `Exception in drop item ${i} of ${dragSession.numDropItems}\nException: ${e}`
              );
            }
          }
        }

        let dualUseFolders = true;
        if (targetFolder.server instanceof Ci.nsIImapIncomingServer) {
          dualUseFolders = targetFolder.server.dualUseFolders;
        }

        util.logDebugOptional(
          "dnd,dragToNew",
          "window.openDialog (newFolderDialog.xhtml)\n" +
            `folder/preselectedURI:${targetFolder} (URI: ${targetFolder.URI})\n` +
            `dualUseFolders: ${dualUseFolders}`,
        );
        window.openDialog(
          "chrome://messenger/content/newFolderDialog.xhtml",
          "",
          "chrome,modal,resizable=no,centerscreen",
          {
            folder: targetFolder,
            dualUseFolders: dualUseFolders,
            okCallback: newFolderCallback,
          },
        );
      } catch (e) {
        QuickFolders.LocalErrorLogger("Exception in OnDrop event: " + e);
        return false;
      }
      return true;
    },
  },

  messageDragObserver: {
    getSupportedFlavours: function () {
      let flavours = new FlavourSet();
      flavours.appendFlavour("text/x-moz-message"); // emails only (find out whether a thread is covered by this)
      return flavours;
    },

    startDrag: function (event, _transferData, _action) {
      // if (!event || !transferData) { debugger; }
      // check event.originalTarget and event.target
      QuickFolders.Util.threadPaneOnDragStart(event);
    },
  },

  buttonPopups: new Set(), // TO do: make a set of popups to remove them on the next dragenter
  buttonDragObserver: {
    win: QuickFolders_getWindow(),
    doc: QuickFolders_getDocument(),
    getSupportedFlavours: function () {
      let flavours = new FlavourSet();
      flavours.appendFlavour("text/x-moz-message"); // emails
      flavours.appendFlavour("text/unicode"); // tabs
      flavours.appendFlavour("text/plain"); // [Bug 26560]
      // MOVE FOLDER SUPPORT
      flavours.appendFlavour("text/x-moz-folder"); // folder tree items
      return flavours;
    },

    dragOverTimer: null,

    dragEnter: function (evt, dragSession) {
      if (!dragSession) {
        dragSession = Components.classes["@mozilla.org/widget/dragservice;1"]
          .getService(Components.interfaces.nsIDragService)
          .getCurrentSession();
      }

      const util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        QI = QuickFolders.Interface,
        removeLastPopup = QI.removeLastPopup.bind(QI);

      let doc = evt.target.ownerDocument || this.doc;

      try {
        if (null == dragSession.sourceNode) {
          util.logDebugOptional(
            "dnd",
            "UNEXPECTED ERROR QuickFolders.OnDragEnter - empty sourceNode!",
          );
          return;
        }
        // removeLastPopup(QuickFolders_globalHidePopupId, doc);
        // add a function to MOVE folders (using the treechildren sourceNode + modifier key SHIFT)
        let isAlt = evt.altKey,
          isCtrl = evt.ctrlKey,
          isShift = evt.shiftKey;
        util.logDebugOptional(
          "dnd",
          `buttonDragObserver.dragEnter - sourceNode = ${dragSession.sourceNode.nodeName}\n` +
            `  ALT = ${isAlt}\n` +
            `  CTRL = ${isCtrl}\n` +
            `  SHIFT = ${isShift}`
        );
        if (dragSession.sourceNode.nodeName === "toolbarpaletteitem") {
          util.logDebug("trying to drag a toolbar palette item - not allowed.");
          dragSession.canDrop = false;
          return;
        }
        let button = evt.target,
          buttonId = button.id || "";

        // [issue 79] dragover colors not working to deprecated -moz-drag-over pseudoclass
        if (button) {
          button.classList.add("dragover");
        }
        const isToolPanel = button?.parentElement?.id == "QuickFolders-oneButtonPanel";

        if (isToolPanel) {
          removeLastPopup(QuickFolders_globalHidePopupId, doc);
        }

        // somehow, this creates a duplication in linux
        // delete previous drag folders popup!
        if (buttonId == "QuickFolders-quickMove" || buttonId == "QuickFolders-readingList") {
          dragSession.canDrop = false;
          if (dragSession.dataTransfer.items.length) {
            let firstItem = dragSession.dataTransfer.items[0];
            if (["text/x-moz-message", "text/plain"].includes(firstItem.type)) {
              // [issue 410]
              dragSession.canDrop = true;
              if (!isToolPanel) {
                removeLastPopup(QuickFolders_globalHidePopupId, doc);
              }
            }
          }
          if (prefs.isShowRecentTab) {
            removeLastPopup("moveTo_QuickFolders-folder-popup-Recent", doc);
          }
          return;
        }

        if (button.tagName === "toolbarbutton") {
          let node = dragSession.sourceNode;
          let isDragButton = node && node.tagName == "toolbarbutton";
          // new quickMove
          // highlight drop target
          if (dragSession.numDropItems == 1) {
            // dragging buttons onlY?
            if (
              isDragButton &&
              (dragSession.isDataFlavorSupported("text/unicode") ||
                dragSession.isDataFlavorSupported("text/plain"))
            ) {
              // show reordering target position!
              // right or left of current button! (try styling button with > OR < to show on which side the drop will happen)

              // find out whether drop target button is right or left from source button:
              if (node && node.hasAttributes()) {
                // check previous siblings to see if target button is found - then it's to the left. otherwise it's to the right
                let sib = node;
                let sDirection = "",
                  sOther = "";
                while ((sib = sib.previousSibling) != null) {
                  if (sib == button) {
                    sDirection = "dragLEFT";
                    sOther = "dragRIGHT";
                    break;
                  }
                }
                if (!sDirection) {
                  sDirection = "dragRIGHT";
                  sOther = "dragLEFT";
                }
                button.classList.add(sDirection); // add style for drop arrow (remove onDragEnd)
                button.classList.remove(sOther);
              }
            }
          }

          //show context menu if dragged over a button which has subfolders
          let targetFolder = button?.folder || null,
            otherPopups = QI.menuPopupsByOffset;
          try {
            for (let i = 0; i < otherPopups.length; i++) {
              if (otherPopups[i].folder) {
                if (otherPopups[i].folder !== targetFolder && otherPopups[i].hidePopup) {
                  otherPopups[i].hidePopup();
                }
                continue;
              }
              if (targetFolder) {
                // there is a targetfolder but the other popup doesn't have one (special tab!).
                if (otherPopups[i].hidePopup) {
                  otherPopups[i].hidePopup();
                } else {
                  util.logDebug(
                    "otherPopups[" +
                      i +
                      "] (" +
                      otherPopups[i].id +
                      ") does not have a hidePopup method!",
                  );
                }
              }
            }
          } catch (ex) {
            util.logDebug("Error during dragOver - hiding popups", ex);
          }
          const dt = evt.dataTransfer,
            types = dt.mozTypesAt(0);
          if (prefs.isDebugOption("dnd")) {
            // http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#677
            let txt = "Drag types from event.dataTransfer:";
            for (let i = 0; i < types.length; i++) {
              txt += "\n" + types[i];
            }
            util.logDebugOptional(
              "dnd",
              `dragSession.isDataFlavorSupported(text/x-moz-message): ${
                dragSession.isDataFlavorSupported("text/x-moz-message")}\n${txt}`
            );
          }

          // avoid dragSession.isDataFlavorSupported
          const isFlavorMail = types.contains("text/x-moz-message"),
            isFlavorFolder = types.contains("text/x-moz-folder"),
            // eslint-disable-next-line no-unused-vars
            _isFlavorUnicode = types.contains("text/unicode") || types.contains("text/plain"); // context menu ??

          // only show popups when dragging messages!
          // removed && targetFolder.hasSubFolders as we especially need the new folder submenu item for folders without subfolders!
          // also add  treechildren when SHIFT is pressed => move a folder! ....  isShift && button.tagName === "treechildren"
          if (!isFlavorMail && !isFlavorFolder) {
            return;
          }
          // MOVE FOLDER support
          try {
            //close any other context menus
            if (isDragButton && node.id != "QuickFolders-CurrentMail") {
              // was isFlavorUnicode
              removeLastPopup(QuickFolders_globalHidePopupId, doc);
              return; // don't show popup when reordering tabs
            }

            if (targetFolder) {
              util.logDebugOptional("recentFolders", `creating popupset for ${targetFolder.name}`);
            }

            // instead of using the full popup menu (containing the 3 top commands)
            // try to create droptarget menu that only contains the target subfolders "on the fly"
            // haven't found a way to tidy these up, yet (should be done in onDragExit?)
            // Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
            // no menus necessary for folders without subfolders!
            let popupset = doc.createXULElement("popupset"),
              menupopup = doc.createXULElement("menupopup"),
              popupId;
            if (evt.target.parentElement.classList.contains("contentTabToolbar")) {
              evt.target.parentElement.appendChild(popupset);
            } else if (evt.target.id && evt.target.id == "QuickFoldersCurrentFolder") {
              // [issue 412] button needs to be parent of popupset
              //             in order to trigger drop even of button dragObserver!
              evt.target.appendChild(popupset);
            } else {
              if (evt.target.ownerDocument.location.toString().endsWith("messenger.xhtml")) {
                QI.FoldersBox.appendChild(popupset);
              }
            }

            let isDisabled =
              button && targetFolder ? button.getAttribute("disabled") || false : false;

            if (targetFolder) {
              popupId = "moveTo_" + targetFolder.URI;
              let oldMenu = doc.getElementById(popupId);
              // excluding TB 2 from "drag to new folder" menu for now
              if (QuickFolders_globalHidePopupId !== popupId || !oldMenu) {
                if (oldMenu) {
                  // remove old menu from DOM
                  oldMenu.parentNode.removeChild(oldMenu);
                }
                menupopup.setAttribute("id", popupId);
                menupopup.className = "QuickFolders-folder-popup";
                menupopup.folder = targetFolder;
                popupset.appendChild(menupopup);
                removeLastPopup(QuickFolders_globalHidePopupId, doc);

                if (!isDisabled) {
                  QI.addSubFoldersPopup(menupopup, targetFolder, true);
                }
              }
            }
            if (!targetFolder) {
              // special folderbutton: recent
              if (
                buttonId == "QuickFolders-Recent-CurrentFolderTool" ||
                buttonId == "QuickFolders-Recent"
              ) {
                popupId = "moveTo_QuickFolders-folder-popup-Recent";
                // [issue 262] avoid "stale" drag-to recent menu
                menupopup.setAttribute("id", popupId);
                popupset.appendChild(menupopup);
                if (QuickFolders_globalHidePopupId && QuickFolders_globalHidePopupId !== popupId) {
                  removeLastPopup(QuickFolders_globalHidePopupId, doc);
                }
                QI.createRecentTab(menupopup, true, button);
              } else {
                if (prefs.isShowRecentTab) {
                  removeLastPopup("moveTo_QuickFolders-folder-popup-Recent", doc);
                }
              }
            }
            if (!popupId) {
              return;
            }

            util.logDebugOptional("dnd", `showPopup with id ${popupId}`);
            let p = doc.getElementById(popupId);
            // [issue 412] popupId not found. should be this instead:
            // QuickFolders-folder-popup-QuickFoldersCurrentFolder
            // [#QuickFoldersCurrentFolder]
            if (!p) {
              util.logDebug("Document did not return the popup: " + popupId);
              return;
            }
            if (!p?.children || !p.children.length) {
              if (QuickFolders.Preferences.isDebugOption("dnd")) {
                console.log("QF(dnd) - no additional popup data", p, popupId);
              }
              return;
            }

            // avoid showing empty popup
            // from a certain size, make sure to shift menu to right to allow clicking the tab
            let minRealign = prefs.getIntPref("folderMenu.realignMinTabs"),
              isShift = false;
            if (minRealign) {
              let c,
                isDebug = prefs.isDebugOption("popupmenus.drag");
              // count top level menu items
              for (c = 0; c < p.children.length; c++) {
                if (isDebug) {
                  util.logDebugOptional(
                    "popupmenus.drag",
                    `${c}: ${p.children[c].tagName} - ${p.children[c].getAttribute("label")}`,
                  );
                }
                if (c > minRealign) {
                  isShift = true;
                  if (!isDebug) {
                    break;
                  }
                }
              }
              if (isDebug) {
                util.logDebugOptional(
                  "popupmenus.drag",
                  `count = ${c}\nminRealign = ${minRealign}\nisShift = ${isShift}`,
                );
              }
            }

            removeLastPopup(QuickFolders_globalHidePopupId, doc);
            // cancel previous pending popup timer.

            if (QuickFolders.dragPopupState.timer) {
              clearTimeout(QuickFolders.dragPopupState.timer);
              QuickFolders.dragPopupState.timer = null;
            }

            doc.popupNode = button;
            let position = isShift ? "end_before" : "after_start";
            p.targetNode = button;
            let delay = QuickFolders.Preferences.getIntPref("drag.popupDelay");
            const state = QuickFolders.dragPopupState;
            Object.assign(state, { button, popup: p, popupId, position, delay });
            state.init(evt);
            state.timer = setTimeout(function () {
              try {
                const isContext = true;
                p.openPopup(button, position, 0, -1, isContext, false);
                util.logDebugOptional("dnd", `Set global popup id = ${popupId}`);
                QuickFolders_globalHidePopupId = popupId;
              } catch (e) {
                util.logException("Exception showing popup: ", e);
              } finally {
                Object.assign(state, { timer:null, popup: null, button: null});
              }
            }, delay);
          } catch (e) {
            util.logException("Exception creating folder popup: ", e);
          }
        }
      } catch (ex) {
        util.logException("EXCEPTION buttonDragObserver.dragEnter: ", ex);
      }
    },

    // deal with old folder popups
    dragLeave: function (event, dragSession) {
      const util = QuickFolders.Util;
      util.logDebug("buttonDragObserver.dragLeave! active element:", document.activeElement);
      if (!dragSession) {
        dragSession = Components.classes["@mozilla.org/widget/dragservice;1"]
          .getService(Components.interfaces.nsIDragService)
          .getCurrentSession();
      }
      util.logDebugOptional(
        "dnd",
        `buttonDragObserver.dragLeave\n` +
          `sourceNode=${dragSession?.sourceNode || "[no dragSession]\n"}` +
          `event.target=${event.target || "[none]"}`,
      );
      let button = event.target;

      let doc = button.ownerDocument || this.doc;

      // [issue 79] dragover colors not working to deprecated -moz-drag-over pseudoclass
      if (button) {
        button.classList.remove("dragover");
      }

      if (!dragSession.sourceNode) {
        util.logDebugOptional(
          "dnd",
          "buttonDragObserver.dragLeave - session without sourceNode! exiting dragLeave handler…",
        );
        if (!dragSession.dataTransfer) {
          event.preventDefault();
        }
        return;
      }
      try {
        let src = dragSession.sourceNode.nodeName || "unnamed node";
        util.logDebugOptional(
          "dnd.detail",
          `buttonDragObserver.dragLeave - sourceNode = ${src}`,
          src,
        );
      } catch (e) {
        util.logDebugOptional("dnd", `buttonDragObserver.dragLeave - ${e}`);
      }

      if (dragSession.sourceNode.nodeName === "toolbarpaletteitem") {
        util.logDebugOptional("dnd", "trying to drag a toolbar palette item - ignored.");
        dragSession.canDrop = false;
        return;
      }
      if (dragSession.sourceNode.nodeName === "toolbarbutton") {
        // drag buttons
        // remove dragdrop marker:
        button.classList.remove("dragLEFT");
        button.classList.remove("dragRIGHT");
        QuickFolders_globalHidePopupId = "";
        return; // don't remove popup when reordering tabs
      }

      //  the target of the complementary event (the mouseleave target in the case of a mouseenter event). null otherwise.
      let rt = event.relatedTarget;
      util.logDebugOptional(
        "dnd",
        `relatedTarget = ${rt ? rt.nodeName + "  " + rt.id : "null"}\n` +
          `QuickFolders_globalHidePopupId = ${QuickFolders_globalHidePopupId}`,
      );
      if (rt && (rt.nodeName == "box" || rt.nodeName == "hbox")) {
        QuickFolders.Interface.removeLastPopup(QuickFolders_globalHidePopupId, doc);
      }

      // problem: event also fires when dragging into the menu, so we can not remove it then!
      let targetFolder = button.folder,
        popupId = "moveTo_" + targetFolder?.URI; // URI = not defined for recent foldes popup

      // this popup needs to be removed if we drag into another button.
      try {
        if (doc.getElementById(popupId)) {
          QuickFolders_globalHidePopupId = popupId; // arm for hiding! GLOBAL VAR!!
        } else {
          QuickFolders_globalHidePopupId = ""; // consume?
        }
      } catch (ex) {
        window.dump("Cannot setup for delete: popup \n" + ex);
      }
    },

    dragOver: function (evt, flavour, dragSession) {
      if (!dragSession) {
        dragSession = Components.classes["@mozilla.org/widget/dragservice;1"]
          .getService(Components.interfaces.nsIDragService)
          .getCurrentSession();
      }
      const types = Array.from(evt.dataTransfer.mozTypesAt(0)); // replace flavour param
      const canDrop =
        types.includes("text/x-moz-message") ||
        types.includes("text/unicode") ||
        types.includes("text/plain") ||
        types.includes("text/x-moz-folder") ||
        types.includes("text/x-moz-newsfolder");      
      dragSession.canDrop = canDrop;
      QuickFolders.Util.logDebugOptional("dnd.detail", "buttonDragObserver.dragOver");
      if (!canDrop) {
        QuickFolders.Util.logDebugOptional(
          "dnd",
          `buttonDragObserver.dragOver - can not drop ${types[0]}`
        );
        return;
      } 
      evt.preventDefault(); // allow dropping
      const state = QuickFolders.dragPopupState;
      if (!state.wasMoved(evt)) {
        return;
      }
      if (evt.target === state.button) {
        // movement resets the existing timer. user needs to stand still to popup the menu.
        if (state.timer) {
          clearTimeout(state.timer);
        }
        state.timer = setTimeout(function () {
          // whatever your existing popup trigger is
          try {
            const isContext = true;
            state.popup.openPopup(state.button, state.position, 0, -1, isContext, false);
            QuickFolders_globalHidePopupId = state.popupId;
          } catch (e) {
            QuickFolders.Util.logException("Exception extending popup: ", e);
          } finally {
            Object.assign(state, { timer: null, popup: null, button: null });
          }
        }, state.delay || 0);
      }
    },

    drop: async function (evt) {
      const util = QuickFolders.Util,
        QI = QuickFolders.Interface,
        prefs = QuickFolders.Preferences,
        Ci = Components.interfaces,
        Cc = Components.classes;
      let dragSession = Cc["@mozilla.org/widget/dragservice;1"]
        .getService(Ci.nsIDragService)
        .getCurrentSession();

      let isShift = evt.shiftKey,
        isCtrl = evt.ctrlKey,
        DropTarget = evt.target,
        targetFolder = DropTarget.folder,
        lastAction = "",
        types = Array.from(evt.dataTransfer.mozTypesAt(0)),
        contentType = types[0];

      const isDropMail = types.includes("text/x-moz-message");
      const isDropFolder = types.includes("text/x-moz-folder");
      const isDropButton = DropTarget && DropTarget.tagName == "toolbarbutton";
      const isDropFile = types.includes("application/x-moz-file");

      // [issue 79] dragover colors not working to deprecated -moz-drag-over pseudoclass
      if (DropTarget) {
        DropTarget.classList.remove("dragover");
      }

      if (prefs.isDebugOption("dnd")) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
      try {
        util.logDebugOptional("dnd", "buttonDragObserver.drop flavour (types[0])=" + contentType);
        util.logToConsole("dragSession = ", dragSession);
      } catch (ex) {
        util.logDebugOptional("dnd", ex);
      }
      QuickFolders_globalHidePopupId = "";

      let isMoveFolderQuickMove = false;

      if (isDropMail || isDropFolder || isDropButton || isDropFile) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      if (isDropMail) {
        // check license restrictions...
        if (DropTarget.getAttribute("disabled")) {
          let msg = "",
            maxTabs;
          if (!util.hasValidLicense()) {
            // max tab
            maxTabs = QuickFolders.Model.MAX_UNPAID_TABS;
            msg = util.getBundleString("license_restriced.unpaid.maxtabs", [maxTabs]);
          } else if (util.hasStandardLicense()) {
            maxTabs = QuickFolders.Model.MAX_STANDARD_TABS;
            msg = util.getBundleString("license_restriced.standard.maxtabs", [maxTabs]);
          }
          if (msg) {
            util.popupRestrictedFeature("tabs>" + maxTabs, msg, 2);
            QuickFolders.Interface.viewSplash(msg);
            return; // early exit
          }
        }
        // =========== mail processing
        let messageUris = [],
          sourceFolder = null,
          txtUris = "";
        if (types.includes("text/x-moz-message")) {
          lastAction = "get data from event.dataTransfer";
          for (let i = 0; i < evt.dataTransfer.mozItemCount; i++) {
            let messageUri = evt.dataTransfer.mozGetDataAt("text/x-moz-message", i);
            txtUris += "dataTransfer [" + i + "] " + messageUri + "\n";
            messageUris.push(messageUri);
          }
          util.logDebugOptional("dnd", txtUris);
        }

        lastAction = "Determine sourceFolder from 1st dropped mail";
        // note: get CurrentFolder fails when we are in a search results window!!
        // [Bug 25204] => fixed in 3.10

        let msgHdr = messenger.msgHdrFromURI(messageUris[0].toString());
        sourceFolder = msgHdr.folder;
        //let virtual = util.isVirtual(sourceFolder);
        if (!sourceFolder) {
          sourceFolder = util.CurrentFolder;
        }

        // handler for dropping messages
        lastAction = "drop action payload";
        // quickMove menu
        if (
          DropTarget?.id == "QuickFolders-quickMove" ||
          DropTarget?.id == "QuickFolders-FindFolder"
        ) {
          util.logDebugOptional(
            "dnd",
            `drop: quickMove button - added ${messageUris.length} message URIs`,
          );
          // copy message list into "holding area"
          while (messageUris.length) {
            let newUri = messageUris.pop();
            QuickFolders.quickMove.add(newUri, sourceFolder, evt.ctrlKey); // CTRL = copy
          }
          QuickFolders.quickMove.update();
          return;
        }

        // reading List menu
        if (DropTarget.id && DropTarget.id == "QuickFolders-readingList") {
          let bm = QuickFolders.bookmarks;
          util.logDebugOptional(
            "dnd",
            `drop: readingList button - added ${messageUris.length} message URIs`,
          );
          // copy message list
          while (messageUris.length) {
            let newUri = messageUris.pop();
            // addMail can cause removal of an invalid item (sets bookmarks.dirty = true)
            // this will cause a reload in order to rebuild the menu
            bm.addMail(newUri, sourceFolder);
          }
          bm.persist(); // only 1 save is more efficient.
          return;
        }

        try {
          util.logDebugOptional(
            "dnd",
            `drop: ${messageUris.length} messageUris to ${targetFolder.URI}`,
          );
          if (messageUris.length > 0) {
            lastAction = "moveMessages";
            let msgList = await util.moveMessages(
              targetFolder,
              messageUris,
              dragSession.dragAction === Ci.nsIDragService.DRAGDROP_ACTION_COPY,
            );
            if (
              QuickFolders.FilterWorker.FilterMode &&
              QuickFolders.FilterWorker.FilterModeLegacy
            ) {
              lastAction =
                `createFilterAsync(${
                (sourceFolder.prettyName || sourceFolder.localizedName) }, ${
                (targetFolder.prettyName || targetFolder.localizedName)}, ${
                (msgList ? msgList[0] : "no Messages returned!")
              })`;
              await QuickFolders.FilterWorker.createFilterAsync(
                sourceFolder,
                targetFolder,
                msgList,
                false,
              );
            }
          }
        } catch (e) {
          QuickFolders.LocalErrorLogger(`Exception in drop -${lastAction}… ${e}`);
        }
        // close any top level menu items after message drop!

        //hide popup's menus!
        util.logDebug(
          "buttonDragObserver.drop DropTarget = " +
            DropTarget.tagName +
            +(DropTarget.id ? "[" + DropTarget.id + "]" : "") +
            "  Target Folder:" +
            targetFolder.name,
        );

        QI.collapseParentMenus(DropTarget);

        if (evt.shiftKey) {
          QuickFolders_MySelectFolder(targetFolder.URI);
        }
      } else if (isDropFolder) {
        // was "text/x-moz-folder"
        // [issue 75] support moving folders through quickMove
        if (
          DropTarget?.id == "QuickFolders-quickMove" ||
          DropTarget?.id == "QuickFolders-FindFolder"
        ) {
          isMoveFolderQuickMove = true;
        }
        if (!isShift && !isMoveFolderQuickMove) {
          let sPrompt = util.getBundleString(
            "qfMoveFolderOrNewTab",
            "Please drag new folders to an empty area of the toolbar! If you want to MOVE the folder, please hold down SHIFT while dragging.",
          );
          util.alert(sPrompt);
        } else {
          // handler for dropping folders
          try {
            if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) {
              let count = evt.dataTransfer.mozItemCount ? evt.dataTransfer.mozItemCount : 1,
                foldersArray = [];
              for (let i = 0; i < count; i++) {
                // allow multiple folder drops...
                let msgFolder = evt.dataTransfer.mozGetDataAt(contentType, i);
                foldersArray.push(msgFolder);
              }
              if (!isMoveFolderQuickMove) {
                let IsCopy = [];
                // eslint-disable-next-line no-unused-vars
                for (let _f of foldersArray) {
                  IsCopy.push(false); // only support move this way at the moment
                }
                QI.moveFolders(foldersArray, IsCopy, targetFolder);
              } else {
                // stash folders away for the next quickMove
                // foldersArray --
                QuickFolders.quickMove.addFolders(foldersArray, evt.ctrlKey);
                QuickFolders.quickMove.update();
              }
            } else {
              let sourceFolder = util.getFolderFromDropData(evt, dragSession);
              QI.moveFolders([sourceFolder], [isCtrl], targetFolder);
            }
          } catch (e) {
            QuickFolders.LocalErrorLogger(`Exception in QuickFolders.drop:${e}`);
          }
        }
      } else if (isDropFile) {
        // eml file?
        util.logToConsole("dropping eml file: currently unsupported.");
      } else if (isDropButton) {
        // reordering button positions
        // was "text/unicode"
        const buttonURI = evt.dataTransfer.mozGetDataAt(contentType, 0);
        const targetURI = DropTarget?.folder.URI || DropTarget.getAttribute("folderURI");
        if (targetURI) {
          QuickFolders.Model.insertAtPosition(buttonURI, targetURI, "");
        } else {
          QuickFolders.Util.logHighlight(
            "invalid drop data - no targetURI:",
            { color: "yellow", background: "rgb(80,0,0)" },
            buttonURI,
            DropTarget,
          );
        }
      }
      util.logDebugOptional(
        "dnd",
        "completed buttonDragObserver.drop() !\n==========================",
      );
    },

    // new handler for starting drag of buttons (re-order)
    startDrag: function (event, _transferData, _action) {
      const util = QuickFolders.Util;
      let button = event.target;
      util.logDebugOptional(
        "dnd",
        `buttonDragObserver.startDrag\n` +
          `button.folder=${button.folder}\n` +
          `button.id=${button.id || "n/a"}`,
      );
      const uri = button?.folder?.URI || button.getAttribute("folderURI");
      if (!uri) {
        return;
      }
      // transferData.data = new TransferData();
      // if current folder button is started to drag, use a different flavour
      if (button.id && button.id === "QuickFoldersCurrentFolder") {
        event.dataTransfer.mozSetDataAt("text/currentfolder", uri, 0);
      } else {
        event.dataTransfer.mozSetDataAt("text/unicode", uri, 0);
      }
    },
  },

  /*
  addFolderPaneListener: function addFolderPaneListener() {
    if (!this.folderPaneListen) {
      let menu = document.getElementById('folderPaneContext');
      if (menu) {
        menu.addEventListener("popupshowing", QuickFolders.Interface.folderPanePopup, false);
      }
    }
    this.folderPaneListen= true;
  },
  
  removeFolderPaneListener: function() {
    let menu = document.getElementById('folderPaneContext');
    if (menu) {
      menu.removeEventListener("popupshowing", QuickFolders.Interface.folderPanePopup);
    }
  },
  */

  TabEventListeners: {},

  addTabEventListener: function () {
    try {
      let tabContainer = QuickFolders.tabContainer;
      this.TabEventListeners["TabSelect"] = function (event) {
        QuickFolders.TabListener.selectTab(event);
      };
      this.TabEventListeners["TabClose"] = function (event) {
        QuickFolders.TabListener.closeTab(event);
      };
      this.TabEventListeners["TabOpen"] = function (event) {
        QuickFolders.TabListener.newTab(event);
      };
      this.TabEventListeners["TabMove"] = function (event) {
        QuickFolders.TabListener.moveTab(event);
      };
      for (let key in this.TabEventListeners) {
        tabContainer.addEventListener(key, this.TabEventListeners[key], false);
      }
    } catch (e) {
      QuickFolders.LocalErrorLogger(`No tabContainer available! ${e}`);
      QuickFolders._tabContainer = null;
    }
  },
  removeTabEventListener: function removeTabEventListener() {
    let tabContainer = QuickFolders.tabContainer;
    for (let key in this.TabEventListeners) {
      tabContainer.removeEventListener(key, this.TabEventListeners[key]);
    }
  },
}; // QuickFolders main object


// the core function for selecting a folder
// adding re-use of mail tabs if the folder is open in another mail tab, switch to that one!
function QuickFolders_MySelectFolder(folderUri, highlightTabFirst = false) {
  const util = QuickFolders.Util,
    prefs = QuickFolders.Preferences,
    model = QuickFolders.Model,
    QI = QuickFolders.Interface;
  function getTabURI(info) {
    if (!info) {return null;}
    // info.mode.name == 'mail3PaneTab'
    if (info.folderPaneVisible || info.folder) {
      return info.folder.URI; //Tb
    }
    return "";
  }
  //during QuickFolders_MySelectFolder, disable the listener for tabmail "select"
  util.logDebugOptional("folders.select", `QuickFolders_MySelectFolder: ${folderUri}`);
  if (!folderUri) {return false;}

  // TEST: for (let i of gTabmail.tabInfo) { console.log(i?.folder?.prettyName , i.mode.name)}
  const currentTabInfo = gTabmail.currentTabInfo;
  if (!["mail3PaneTab", "mailMessageTab"].includes(currentTabInfo.mode.name)) {
    QuickFolders.Util.logDebug(
      `QuickFolders_MySelectFolder exit, because of tabMode: ${currentTabInfo.mode.name}`
    );
    return false;
  }
  let msgFolder,
    isInvalid = false;
  try {
    msgFolder = model.getMsgFolderFromUri(folderUri, true);
    if (msgFolder && prefs.getBoolPref("autoValidateFolders")) {
      isInvalid = !util.doesMailFolderExist(msgFolder);
    }
  } catch (ex) {
    util.logException("Exception validating folder: ", ex);
    isInvalid = true;
  }

  if (isInvalid) {
    // invalid folder; suggest to correct this!
    util.logDebugOptional(
      "folders.select",
      "detected invalid folder, trying to correct entry table."
    );
    let folderEntry = model.getFolderEntry(folderUri);
    if (!folderEntry) {return false;}
    if (folderEntry.disableValidation) {
      // do nothing. a pending rename invalidated this entry
      util.logToConsole(
        "This may be a folder entry pointing to an invalid folder location: \n" + folderUri
      );
    } else {
      switch (QI.deleteFolderPrompt(folderEntry, false)) {
        case 1: // delete
          // save changes right away!
          prefs.storeFolderEntries(model.selectedFolders);
          // update the model
          QI.updateFolders(true, true);
          break;
        case 0: // don't delete
          break;
      }
      return false;
    }
  }
  QuickFolders.currentURI = folderUri;

  let i,
    isExistFolderInTab = false,
    tabmail = document.getElementById("tabmail");

  if (tabmail) {
    util.logDebugOptional("folders.select", "try to find open tab with folder…");
    for (let info of gTabmail.tabInfo) {
      if (info.mode.name != "mail3PaneTab") {
        // [issue 389]
        continue;
      }
      let tabURI = getTabURI(info);
      if (!tabURI) {continue;}
      if (folderUri == tabURI && info != gTabmail.currentTabInfo) {
        util.logDebugOptional(
          "folders.select",
          `matched folder to open tab, switching to tab ${i}`
        );
        // strangely switching to tab 0 causes an unnecessary updateFolders call
        if (tabmail.switchToTab) {
          tabmail.switchToTab(info); // switch to first tab with this URI
        }

        isExistFolderInTab = true;
        break;
      }
    }
    util.logDebugOptional(
      "folders.select",
      isExistFolderInTab
        ? "…found folder in existing mail Tab."
        : "…folder is currently not open in any Tab.",
    );
  }

  if (folderUri && !msgFolder) {
    util.logHighlight(
      "No valid folder found for this Uri\nThis maybe caused by a pending rename on IMAP Server",
      { color: "yellow", background: "rgb(40,0,120)", isDebug: false },
      `Uri= ${folderUri}`,
    );
    return false; // no valid folder (may be from rename)
  }

  const currentTabMode = QI.CurrentTabMode;
  // new behavior: OPEN NEW TAB
  // if single message is shown, open folder in a new Tab...
  if (
    currentTabMode == "mailMessageTab" ||
    currentTabMode == "glodaList" ||
    currentTabInfo?.folder === null
  ) {
    // no URI / folder===null. is this a search result tab? [issue 504]

    if (isExistFolderInTab) {
      return true; // avoid closing the single message
    }

    if (prefs.getBoolPref("behavior.nonFolderView.openNewTab")) {
      util.logDebugOptional("folders.select", "calling openFolderInNewTab()");
      QI.openFolderInNewTab(msgFolder);
    } else {
      // switch to first tab
      util.logDebugOptional(
        "folders.select",
        "tab is not selected, openNewTab disabled, switching to tab 0"
      );
      tabmail.switchToTab(0);
    }
  }

  const Flags = util.FolderFlags,
    isRoot = msgFolder.rootFolder.URI == msgFolder.URI;

  util.logDebugOptional(
    "folders.select",
    `folder [${(msgFolder.prettyName || msgFolder.localizedName)}] flags = ${msgFolder.flags}` +
      (isRoot ? "\nThis is a ROOT folder" : "")
  );

  // TB 115 - this will not select the folder if it is not contained in the current view!
  // John: gTabmail.currentTabInfo.folder is a setter/getter for the current folder
  currentTabInfo.folder = msgFolder;

  // ############################
  // ############################
  // ############### ?????????? TEST IN 115 ==>
  // ############################
  // ############################

  // about3Pane.folderPane
  // let isCompact = gFolderTreeView.toggleCompactMode ? (gFolderTreeView._tree.getAttribute("compact") == "true") : false;

  const folderPane = QuickFolders.Util.folderPane;

  let folderRow;
  try {
    folderRow = folderPane.getRowForFolder(folderUri); // msgFolder
  } catch  {;}

  const about3Pane = tabmail.currentAbout3Pane;
  if (folderPane.activeModes) {
    QuickFolders.activeTreeViewModes = folderPane.activeModes; // backup array of view modes.
  }

  util.logDebugOptional("folders.select", `folderRow = ${folderRow}`);
  if (!folderRow) {
    // null == folderIndex
    util.ensureNormalFolderView(); // make sure "all" is displayed!
    about3Pane.displayFolder(folderUri);
    folderRow = folderPane.getRowForFolder(folderUri);
  }

  // [issue 559] Thunderbird folder tree doesn't scroll to current folder (Tb 115)
  if (
    folderRow &&
    currentTabMode == "mail3PaneTab" &&
    QuickFolders.Preferences.getBoolPref("scrollToCenter")
  ) {
    // tabmail.currentTabInfo.chromeBrowser.contentWindow.displayFolder(msgFolder.URI);
    util.logDebugOptional("folders.select", "new scroll code…");
    const folderTree = QuickFolders.Util.folderTree;
    const row = folderRow;
    if (!msgFolder.hasSubFolders || row.classList.contains("collapsed")) {
      util.logDebugOptional("folders.select", "folder collapsed: standard scrolling!", row);
      row.scrollIntoView({ instant: true, block: "center" }); // this only works if it's not expanded.
    } else {
      // Get the top position of the row relative to folderTree scrolling element
      const rowTop = row.offsetTop;
      // in TB128            ul#folderTree is scrolled
      const scrollingElement = folderTree;

      // Try to get the folder row height
      const itemHeight = row.querySelector(".container")
        ? row.querySelector(".container").getBoundingClientRect().height
        : row.getBoundingClientRect().height; // fallback: full height of folder with kids

      // Get the visible height of scrolling container
      const visibleHeight =
        scrollingElement.clientHeight || scrollingElement.getBoundingClientRect().height;

      const scrollTop = Math.floor(
        Math.min(
          rowTop - (visibleHeight - itemHeight) / 4,
          scrollingElement.scrollHeight - visibleHeight
        )
      );

      util.logDebugOptional(
        "folders.select",
        `itemHeight: ${itemHeight}\n` +
          `visibleHeight: ${visibleHeight}\n` +
          `scrollHeight: ${scrollingElement.scrollHeight}\n` +
          `rowTop: ${rowTop}\n` +
          `scrollTop: ${scrollTop}\n`
      );

      // Scroll to center the folder, accounting for the header height, or fallback to full row height if needed
      scrollingElement.scrollTop = scrollTop;
    }
  }

  if (msgFolder.parent) {
    util.logDebugOptional("folders.select", "ensureFolderViewTab()");

    if (!folderRow) {
      util.logDebugOptional("folders.select", "ensureNormalFolderView()");
      folderRow = folderPane.getRowForFolder(msgFolder, ["all"]);
      util.logDebugOptional("folders.select", "folderRow[all] = ", folderRow);
    }

    let parentRow = folderPane.getRowForFolder(msgFolder.parent);
    util.logDebugOptional("folders.select", "parent row: ", parentRow); // was parentIndex
    // flags from: mozilla 1.8.0 / mailnews/ base/ public/ nsMsgFolderFlags.h
    const specialFlags =
      Flags.MSG_FOLDER_FLAG_INBOX +
      Flags.MSG_FOLDER_FLAG_QUEUE +
      Flags.MSG_FOLDER_FLAG_SENTMAIL +
      Flags.MSG_FOLDER_FLAG_TRASH +
      Flags.MSG_FOLDER_FLAG_DRAFTS +
      Flags.MSG_FOLDER_FLAG_TEMPLATES +
      Flags.MSG_FOLDER_FLAG_JUNK +
      Flags.MSG_FOLDER_FLAG_ARCHIVES;
    if (msgFolder.flags & specialFlags) {
      // is this folder a smartfolder?
      let isSmartView = folderPane.activeModes && folderPane.activeModes.includes("smart");
      if (folderUri.includes("nobody@smart") && !parentRow && !isSmartView) {
        util.logDebugOptional("folders.select", "smart folder detected, switching treeview mode…");
        // toggle to smartfolder view and reinitalize folder variable!
        if (!folderPane.activeModes.includes("smart")) {
          let modes = folderPane.activeModes;
          modes.push("smart");
          folderPane.activeModes = modes; // ? not sur whether this is legal ? TB115
        }
        msgFolder = model.getMsgFolderFromUri(folderUri); // folderResource.QueryInterface(Ci.nsIMsgFolder);
        parentRow = folderPane.getRowForFolder(msgFolder.parent);
      }

      isSmartView = folderPane.activeModes.includes("smart");

      // a special folder, its parent is a smart folder?
      if (msgFolder.parent.flags & Flags.MSG_FOLDER_FLAG_VIRTUAL || isSmartView) {
        QuickFolders.Util.logTb115("QuickFolders_MySelectFolder(): open special folder!");
      } else {
        // all other views:
        if (null !== parentRow) {
          QuickFolders.Util.logTb115(
            `QuickFolders_MySelectFolder(): toggleRow for parent folder: ${parentRow} `
          );
        } else {
          util.logDebugOptional(
            "folders.select",
            `Can not make visible: ${msgFolder.URI} - not in current folder view?`
          );
        }
      }
    }
  }

  // Restore last the view mode (?)
  if (!prefs.isChangeFolderTreeViewEnabled) {
    // this only works in Thunderbird 78 - Tb91 has the activeModes array...
    QuickFolders.Util.logTb115("Restore last view mode.. (folderPane.activeModes?)");
    // do something with folderPane.activeModes
    // folderPane.activeModes = QuickFolders.activeTreeViewModes;
  }

  let isTabSelected = false;
  //folderTree.treeBoxObject.ensureRowIsVisible(gFolderTreeView.selection.currentIndex);
  if (msgFolder.flags & Flags.MSG_FOLDER_FLAG_VIRTUAL) {
    // || folderUri.indexOf("nobody@smart")>0
    isTabSelected = true;
  }

  // could not find folder!
  if (!folderRow) {
    util.logDebugOptional(
      "folders.select",
      `Could not find folder in tree (folderRow = ${folderRow})`
    );
    return false;
  }

  // speed up the highlighting... - is this only necessary on MAC ?
  if (highlightTabFirst) {
    let entry = model.getFolderEntry(folderUri);
    if (entry) {
      util.logDebugOptional("folders.select", "onTabSelected() - highlighting speed hack");
      isTabSelected = true;
    }
  }

  if (isTabSelected) {
    QuickFolders.Interface.onTabSelected();
  }

  if (prefs.isFocusPreview && QuickFolders.Interface.getThreadPane()) {
    util.logDebugOptional("folders.select", "setFocusThreadPane()");
    QuickFolders.Interface.setFocusThreadPane();
  }
  return true;
}; // MySelectFolder


QuickFolders.FolderTreeSelect = (event) => {
  // onSelect in Folder Tree
  let util = QuickFolders.Util,
      logDO = util.logDebugOptional.bind(util),
      logEx = util.logException.bind(util),
      QI = QuickFolders.Interface,
      folders = GetSelectedMsgFolders();
  try {
    logDO("events", "FolderTreeSelect: event target = ", event.target);
    if (folders.length) {
      let selFolder = folders[0];
      logDO("events", "FolderTreeSelect selecting folder  " + (selFolder.prettyName || selFolder.localizedName));
      QI.onTabSelected(null, selFolder);
    }
  }
  catch(ex) {
    logEx('FolderTreeSelect failed', ex);
  }
};

// set up the folder listener to point to the above function
QuickFolders.FolderListener = {
	lastRemoved: null, // MsgFolder was removed
	lastAdded: null,   // MsgFolder was added
  newFolderName: null,
  oldFolderUri: null,
	ELog: function errLogFallback(msg) {
    try {
      try {Components.utils.reportError(msg);}
      catch {
        Services.console.logStringMessage("QuickFolders:" + msg);
      }
    }
    catch {
      // write to TB status bar??
      try{QuickFolders.Util.logToConsole(`Error: ${msg}`);} 
      catch {;}
    };
	},
  
  // Tb102 - new folder listener interface
  onFolderAdded: function(parent, item) {
    try {
      if (!QuickFolders) {return;}
      const util = QuickFolders.Util,
            Ci = Components.interfaces;
      let f = item.QueryInterface(Ci.nsIMsgFolder);
      util.logDebugOptional("listeners.folder", `onFolderAdded\n${(f.prettyName || f.localizedName)}\n${f.URI}`);
      let fld = QuickFolders.Model.getMsgFolderFromUri(f.URI, true);
      if (!parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH) {
        util.touch(fld || f); // set MRUTime, unless folder was deleted.
      }
      QuickFolders.FolderListener.lastAdded = f;
    } catch { ; }     
  },

  // Tb102 - new folder listener interface
  onMessageAdded: function(parent, item) {
    try {
      if (!QuickFolders) {return;}
      const tabEntry = QuickFolders.Model.getFolderEntry(parent.folderURL);          
      if (tabEntry &&  tabEntry.flags & QuickFolders.Util.ADVANCED_FLAGS.SETMAIL_UNREAD) {
        const messageList = [item];
        parent.markMessagesRead(messageList, false);
      }
		}
		catch { ; }
  },
  
  // Tb102 - new folder listener interface
  onFolderRemoved: function(parent, item) {
		try {
			if (!QuickFolders) { return; }
      const util = QuickFolders.Util,
        Model = QuickFolders.Model,
        QI = QuickFolders.Interface;

			let f = item.QueryInterface(Components.interfaces.nsIMsgFolder),
        fromURI = f.URI,
        toURI = QuickFolders.FolderListener.lastAdded ? QuickFolders.FolderListener.lastAdded.URI : "",
        logDebug = util.logDebug.bind(util),
        logDebugOptional = util.logDebugOptional.bind(util),
        logToConsole = util.logToConsole.bind(util);
			logDebugOptional("listeners.folder", `OnItemRemoved\n${(f.prettyName || f.localizedName)}\nFROM ${fromURI}`);
			QuickFolders.FolderListener.lastRemoved = f;
			// check if QuickFolders references this message folder:
			if (fromURI !== toURI && toURI) {
				if (
          QuickFolders.FolderListener.lastAdded &&
          f.name === QuickFolders.FolderListener.lastAdded.name
        ) {
          // the folder was moved, we need to make sure to update any corresponding quickfolder:
          if (toURI) {
            // we should not do this when deleting, we need to delete the Tab!
            let newParent = Model.getMsgFolderFromUri(toURI).parent;
            if (newParent && newParent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH) {
              logDebug(`Folder  ${f.name} moved to Trash. Leaving Tab URI unchanged for deletion.`);
            } else {
              logDebugOptional(
                "folders,listeners.folder",
                `Trying to move Tab ${f.name} from URI \n${fromURI}\n to URI \n${toURI}`
              );
              let ct = Model.moveFolderURI(fromURI, toURI);
              logDebug("Successfully updated " + ct + " URIs for folder " + f.name);
              QuickFolders.Interface.updateFolders(true, true);
            }
          } else {
            let s = `Failed to update URI of folder: ${f.name} please remove it manually and add to QuickFolders bar`;
            logToConsole(s);
            util.alert(s);
          }
        } else {
          let entry = Model.getFolderEntry(fromURI);
          if (entry) {
            QI.deleteFolderPrompt(entry);
          }
        }
			}
			QuickFolders.FolderListener.lastAdded = null;      
		}
		catch {;}
  },

  onFolderIntPropertyChanged: function(item, property, oldValue, newValue) {
		function add1000Separators( aValue ) {
      let sValue = aValue.toString();
			let sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
			while(sRegExp.test(sValue.toString())) { 
        sValue = sValue.replace(sRegExp, '$1,$2'); 
      }
			return sValue;
		}
		try {
			if (typeof QuickFolders === 'undefined') {
				return;
      }
      const util = QuickFolders.Util;
			let prop = property ? property.toString() : '',
          log = util.logDebugOptional.bind(util),
          isTouch = false;
      const isMailTab = ["mail:3pane", "mail3PaneTab", "mailMessageTab"].includes(
        QuickFolders.Interface.CurrentTabMode
      );
			log("listeners.folder", "onFolderIntPropertyChanged - property = " + prop);
			if (prop === "TotalUnreadMessages" ||
				(QuickFolders.Preferences.isShowTotalCount && prop === "TotalMessages")) {
					QuickFolders.Interface.setFolderUpdateTimer(item);
          if (isMailTab) {
            let cF = QuickFolders.Interface.CurrentFolderTab;
            if (cF && cF.folder && cF.folder==item) { // quick update of CurrentFolder tab:
              QuickFolders.Interface.initCurrentFolderTab(cF, item);
            }
          }
          if (newValue > oldValue) { isTouch = true; }
			}
      if (prop === "TotalMessages" && (newValue > oldValue)) {
        isTouch = true;
      }
      
      // [issue 80] add folder to recent list if item was added (via d+d)
      if (isTouch) {
        util.touch(item);
      }

			if (QuickFolders.compactReportFolderCompacted && prop === "FolderSize") {
        try {
          QuickFolders.compactReportFolderCompacted = false;
          if (
            !QuickFolders.Preferences.getBoolPref(
              "extensions.quickfolders.notifications.compactComplete"
            )
          ) {
            QuickFolders.compactReportCommandType = "";
            return; // notifications disabled
          }

          let size1 = QuickFolders.compactLastFolderSize,
            size2 = item.sizeOnDisk,
            message = "";
          if (item.URI && QuickFolders.compactLastFolderUri !== item.URI) {
            // should we reset it, in case the real message got lost ?
            return;
          }

          // describe the action that caused the compacting
          switch (QuickFolders.compactReportCommandType) {
            case "compactFolder":
              message =
                util.getBundleString("qfCompactedFolder") +
                " '" +
                (item.prettyName || item.localizedName) +
                "'";
              break;
            case "emptyJunk":
              message =
                util.getBundleString("qfEmptiedJunk") +
                " '" +
                (item.prettyName || item.localizedName) +
                "'";
              if (!item.URI) {
                size2 = 0;
              }
              break;
            case "emptyTrash":
              message = util.getBundleString("qfEmptiedTrash");
              if (!item.URI) {
                size2 = 0;
              }
              break;
            default:
              message =
                `unknown compactReportCommandType: [${
                  QuickFolders.compactReportCommandType
                }]`;
              break;
          }
          const originalSize = util.getBundleString("qfCompactedOriginalFolderSize"),
            newSize = util.getBundleString("qfCompactedNewFolderSize"),
            expunged = util.getBundleString("qfCompactedBytesFreed"),
            out =
              `${message} :: ` +
              (size1
                ? `${originalSize}: ${add1000Separators(size1)}::  ` +
                  `${expunged}:${add1000Separators((size1 - size2))} :: `
                : " ") +
              `${newSize}: ${add1000Separators(size2)}`;
          // make sure it displays straight away and overwrite the compacting done message as well.

          const isNotification = true; // use this to disable message(s)
          setTimeout(function () {
            if (isNotification) {
              QuickFolders.Util.slideAlert("QuickFolders", out);
            }
            QuickFolders.Util.logDebug(out);
          }, 250); // display "after compacting"

          QuickFolders.compactLastFolderUri = null;
          QuickFolders.compactLastFolderSize = 0;
        } catch {;};
			}
		}
		catch(e) {this.ELog("Exception in Item onFolderIntPropertyChanged - TotalUnreadMessages: " + e);};    
  },
  
  onFolderBoolPropertyChanged: function(_folder, _property, _oldValue, _newValue) {},
  onFolderUnicharPropertyChanged: function(_folder, _property, _oldValue, _newValue) {},
  onFolderPropertyFlagChanged: function(_msg, _property, _oldFlag, _newFlag) {},
  
  onFolderEvent: function(item, event) {
		let eString = event.toString();
		try {
			if (!QuickFolders || !QuickFolders.Util) {
				return;
      }
      const util = QuickFolders.Util,
        QI = QuickFolders.Interface,
        log = util.logDebugOptional.bind(util);
			log("listeners.folder", "onFolderEvent - evt = " + eString);
			switch (eString) {
        // a better option might be to hok into 
        // folderTree.onSelect 
        // which in Tb calls FolderPaneSelectionChange()
        // which uses GetSelectedMsgFolders()
				case "FolderLoaded": 
					try {
            log("events","event: " + eString + " item:" + (item.prettyName || item.localizedName));
						if (!QI) { return; }
            const isDisplayServer = QuickFolders.Preferences.getBoolPref("textQuickfoldersLabel.displayServer");
            if (isDisplayServer) {
              QI.updateQuickFoldersLabel();
            }

            // make sure this event is not a "straggler"
            try {
              let folders = GetSelectedMsgFolders(),
                itemFound = util.iterateFolders(folders, item, QI.onTabSelected);
              if (!itemFound) {
                log(
                  "events",
                  `FolderLoaded - belated on folder ${item.prettyName || item.localizedName} - NOT shown in current folder bar!`,
                );
              }
            } catch {
              // cannot  get selected folders: new windows maybe?
            }
					}
					catch(e) {
            QuickFolders.FolderListener.ELog("Exception in FolderListener.onFolderEvent {" + event + "} during calling onTabSelected:\n" + e)
          };
					break;
				case "RenameCompleted": {
					// item.URI;=> is this the old folder uri ? - what's the new one.
          
          let newFolderName = QuickFolders.FolderListener.newFolderName || '',
              oldUri = QuickFolders.FolderListener.oldFolderUri;
					if (!item || (item.URI == oldUri && newFolderName)) {
						log("events,listeners.folder","event: " + eString + 
								"\nNEW item.URI = " + (item && item.URI ? item.URI : "?") +
								"\nold URI = " + oldUri +
								"\nstored newFolderName = " + newFolderName);
						QuickFolders.Model.moveFolderURI(oldUri, newFolderName);
            QuickFolders.FolderListener.newFolderName = null;
            QuickFolders.FolderListener.oldFolderUri = null;
            break;
					}
					// [Bug 26645]  moving folders in IMAP tree - check referential integrity of model
          let movedFolder = QuickFolders.FolderListener.lastRemoved || item;
          if (movedFolder) {
            // if folder was moved, the prettyName is the same:
            // if ((movedFolder.prettyName || movedFolder.localizedName) == (item.prettyName || item.localizedName) ) { // && item.server.type=='imap'
              QuickFolders.Model.moveFolderURI(movedFolder.URI, item.URI);
            // }
          }
          QuickFolders.FolderListener.lastRemoved = null;
          QuickFolders.FolderListener.oldFolderUri = null;        
				} break;
        default:
          log("events","event: " + eString);
          break;
			}
		}
		catch(e) {
      QuickFolders.FolderListener.ELog(`Exception in FolderListener.onFolderEvent {${eString}}:\n` + e);
    };
  },
  
  /**********************        legacy parts - Thunderbird 91 specific   *****************************************/
	OnItemAdded: function (parent, item, _viewString) {
		try {
			if (!QuickFolders) {return;}

      // eslint-disable-next-line no-prototype-builtins
      if (item.hasOwnProperty('folderURL')) {
        QuickFolders.FolderListener.onFolderAdded(parent, item);
      }
      
      // [Bug 26683] flag to set moved mail to unread.
      // eslint-disable-next-line no-prototype-builtins
      if (item.hasOwnProperty('subject')) {
        QuickFolders.FolderListener.onMessageAdded(parent, item);        
      }
		}
		catch { ; }
	},

	OnItemRemoved: function (parent, item, _viewString) {
		try {
			if (!QuickFolders) {return;}
      QuickFolders.FolderListener.onFolderRemoved(parent, item);
		}
		catch { ; }
	},

	// parent, item, viewString
	OnItemPropertyChanged: function (_item, _property, _oldValue, _newValue) {
		//var x=property.toString();
	},

	OnItemIntPropertyChanged: function (item, property, oldValue, newValue) {
    QuickFolders.FolderListener.onFolderIntPropertyChanged(item, property, oldValue, newValue);
	},
  
	OnItemBoolPropertyChanged: function (_item, _property, _oldValue, _newValue) {},
	OnItemUnicharPropertyChanged: function (_item, _property, _oldValue, _newValue) {},
	OnItemPropertyFlagChanged: function (_item, _property, _oldFlag, _newFlag) {},
	OnItemEvent: function (item, event) {
    QuickFolders.FolderListener.onFolderEvent(item, event);
	}
}

QuickFolders.CopyListener = {
  onStartCopy: function () { },
  onProgress: function (_Progress, _ProgressMax) { },
  setMessageKey: function (_key) { },
  getMessageId: function (_msgId) { // out ACString aMessageId 
    return null;
  },
  onStopCopy: function (status) { // in nsresult aStatus
    if (QuickFolders.bookmarks && Components.isSuccessCode(status)) {
      if (QuickFolders.bookmarks.dirty) {
        let invalidCount = 0;
        for (let i=0; i<QuickFolders.bookmarks.Entries.length; i++) {
          let entry = QuickFolders.bookmarks.Entries[i];
          try {
            if (entry.invalid) {
              var { MailUtils } = ChromeUtils.importESModule("resource:///modules/MailUtils.sys.mjs"); 
              // [issue 265] try to fix the bookmark URI
              if (entry.messageId) {
                let msg = MailUtils.getMsgHdrForMsgId(entry.messageId);
                if (msg) {
                  let newUri = msg.folder.getUriForMsg(msg);
                  if (newUri) {
                    entry.Uri = newUri;
                    entry.invalid = false;
                  }
                }
              }
            }
          }
          catch(ex) {
            QuickFolders.Util.logException("Trying to fix a reading list entry - failed", ex);
          }
        }
        if (invalidCount) {
          QuickFolders.bookmarks.persist();  // save & update menu with new Uris (we flagged them as invalid during Util.moveMessages!)
        }
      }
    }
  },
  // legacy functions < Tb125
  OnStartCopy: function () { },
  OnProgress: function (_Progress, _ProgressMax) { },
  SetMessageKey: function (_key) { },
  GetMessageId: function (_msgId) { // out ACString aMessageId 
    return null;
  },
  OnStopCopy: function(status) {
    this.onStopCopy(status)
  }
}

QuickFolders.LocalErrorLogger = function(msg) {
	Services.console.logStringMessage("QuickFolders: " + msg);
}

