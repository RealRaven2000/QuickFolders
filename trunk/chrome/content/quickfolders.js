/* BEGIN LICENSE BLOCK

for detail, please refer to license.txt in the root folder of this extension

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or (at your option) any later version.

If you use large portions of the code please attribute to the authors
(Axel Grude, Alexander Malfait)

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You can download a copy of the GNU General Public License at
http://www.gnu.org/licenses/gpl-3.0.txt or get a free printed
copy by writing to:
  Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor,
  Boston, MA 02110-1301, USA.
END LICENSE BLOCK */


/*===============
  Project History
  ===============

  Personnel:
  AM - Alexander Malfait (Creator of QuickFolders)
  AG - Lead Developer and owner of the Mozdev project
  CW - Christopher White (Mac User and Theme Engine developer)

  05/09/2008
	AG added Code to remove dynamic "subfolder" popup menus that act as drop targets. this should also deal with resource issues
	   made sorting with mouse more persistant (it sometimes jumped back!)

  07/07/2008
	AG added visual indication for drop position (like FX tabs)

  10/09/2008
	AG added Quick Help tab (options.xul, options.js)
	   removed 'toolbar' style from option window to support tabbed interface

  05/10/2008
	AG loading version number dynamically in options dialog

  19/11/2008 - Release 0.9.3
	AG fixed bug with drifting popup menus
	   fixed same popup not reappearing if first drag not completed

  24/11/2008
	AG rename bug fixed (this used to show original folder name not quickfolder name)

  04/01/2009 - Release 0.9.4
	AM added folder category feature
	   split sources into more manageable portions

  09/01/2009 - Release 0.9.5
	AG added "Always show" category and moved "(All)" to the top
	   set category dialog: added [Add] button and made [Ok] button work differently
	   re-added addon icon to install.rdf

  14/01/2009
	AG Split main options dialog into 3 tabs and added Layout tab
	   Added Color Picker to Layout tab (WIP)
	   Added Color Picker to Categories dialog (WIP)
	   Added accelerator keys to popup menus
	   Layout Improvements in style sheet (saves space)
	   Tidied up Project History

  17/01/2009 0.9.7
	AG added locale support with help of goofy's sent code
	   coloring of active, hovered tab and tabbar background
	   German locale

  19/01/2009 0.9.8
	AG storing of colors
	   rounded tabs (flat style)!
	   updated screenshots on the site and added German translations
	Alex added Dutch locale

  28/01/2009 0.9.9
	AG Improved layout of flat style - tested under Crystal, default and outlook themes.
	   added "show icons" option which displays special icons for Inbox, Sent, Trash and current folder
	   tried "3d" look on flat-style tabs but removed it again
	   fixed an issue with height of category dropdown
	   removed (test) color picker from category dialog
	   added menu highlighting on drag mail to popup

   07/02/2009 0.9.9.1
	 AG force display of OK / Cancel button for applying color options
		improved detection of URIs for special icons

   08/02/2009
	 AG update count if total count is displayed

   12/02/2009 0.9.9.2
	 AG added menu icons
		added gradient display for menu items

   15/02/2009
	 AG+Alex added error handlers for isCorrectWindow and initDelayed functions

   17/02/2009
	 AG added number of unread messages to popup menu (jump to menu, not drag menu)

   18/02/2009
	 AG do not force switching to All Folders view if not necessary
		added debug mode switch to options
		tidied options layout

   26/02/2009
	 AG added configurable init Delay and better error logging

   04/03/2009
	 AG added more focused stylesheet logging
		added an option for changing color of inactive tabs

   05/03/2009
	 AG do not display folders of category "ALWAYS" when "Uncategorized" is selected.
		for consistency, categories drop down now shows the translated string for "uncategorized"

   08/03/2009  0.9.9.7
	 AG  made compatible with TB 3.0 beta 2
   20/03/2009  0.9.10
	 AG renamed global instances of Compontents.classes & interfaces to QF_CC, QF_CI to allow for release from sandbox

   30/03/2009
	 AG added option to use CTRL instead of ALT for keyboard shortcuts
		suppress event bubbling (for better Lightning compatibility)
		added button for copying folder string to clipboard

   17/04/2009  0.9.12
	 AM Fixed some problems with keyboard handler
	 AM added italian locale (provided by Leopoldo Saggin)

   19/04/2008
	 AG removed constant debug output of keyboard handler (now only visible in debug mode and when relevant)
		increased width of options window to avoid truncation of italian quickhelp texts
		added language resources for debug items
		added icon for folder to clipboard

   11/05/2009
	 AG added multiple line support
		added option for focusing message pane after changing category & selecting a tab (to be improved)

   12/05/2009
	 AM added Delete and Rename Category features.

   13/05/2009 Release 1.0.1
	 AG fixed focus problem after changing of categories
		fixed remembered categories not being selected on startup

   15/05/2009  Release 1.0.2 (permanently sandboxed)
	 AG fixed problem on startup when short delay - GetMsgFolderFromUri did not work!!
		Rejected by AMO - not able to add new Category

   26/05/2009 Release 1.0.3
	 AG Fixed previous problem by AMO
		added l10n for copy folders to clipboard message
		added colored panels to category screen

   02/06/2009
	 AG added individual Tab Color feature (experimental, does not save yet!)
		added feedback link (mail to me) to options dialog
		made options dialog resizable

   24/06/2009
	 AG fixed renaming bug for numbered folders
		automatically switch to folder when trying to add it and it already exists.
		Store Tab Colors!

   02/07/2009 Release 1.1
	 AG fixed renaming bug for total/unread folders

   28/07/2009 Release 1.2
	 AG added: Categories are sorted alphabetically
			   Compatibility for Tb3.0b3
		fixed: Quickfolders label floats to right when switched on via options dialog
			   warning "QuickFolders is not defined" in quickfolders.js

   26/08/2009:
	 AG fixed: in Tb3 the folder tree view would not scroll
		added: whole tab coloring

   12/09/2009  Release 1.3 (Test Release)
	 AG added subfolders in popup menus - configurable
			   whole / striped tab option and backgrounds
	 fixed slowdown of operations that change the number of Total / Unread emails because QF was updated every time
			this is now done asynchroneously with a 1000ms timer.

	23/09/2009 Release 1.4
	  AG added scrollbars and animation to "change order of bookmarks" dialog
		 added subfolder expansion
		 added Postbox support
	open items tweaks in whole tab coloring (active, hover consistency)
  known issues	sometimes the colors do not show up on program startup. Any folder modification (e.g. unread/read) or Category selection will make the color appear
				popup menus might close delayed
				change the order of bookmarks has the wrong height (should be 80% of its parent)
				chevrons for moving Tabs don't show up in TB3 (beta bug?)
  --------------1.4  Postbox specific
  known issues color submenu still has no colors
			   some minor CSS errors


	23/09/2009 Release 1.5b
	  AG bumped compatibility to 3.0.4b
		 fixed 2 security issues releated to setTimeout


	21/10/2009 Release 1.6 23/10/2009
	  AG added locales for Japan (Masahiko Imanaka), Portuguese (Marcelo Ghelman), Russian (Anton Pinsky)
		 fixed TB not displaying the colors on start up
		 fixed in Postbox - the color sub menu now displays colors
	  improved error handling in Drag-Drop (WIP for some Linux users)

	09/11/2009 Release 1.6.3
	  AG fixed [Bug 21919] removed popup remove code for linux users as it crashed Thunderbird (not confirmed for TB 3)

	09/11/2009 Release 1.6.4
	  AG fixed [Bug 21960] icon for inbox not visible in postbox
	  AG fixed disabled dropping emails to virtual (search) folders

	15/12/2009 Release 1.7
	  AG fixed drag & drop layout issues for the new versions of TB3, SeaMonkey and Postbox 1.1
	  AG [Bug 22121] fixed?
	  AG fixed bug 22067 (TB3 did not display colors in tab colors submenu)

	31/12/2009 Release 1.7.1
	  AG added mail tab support for TB3, SeaMonkey and Postbox. Changing tabs will also affect current QF selection (and Categories)
	  AG added separate debug options for mailTabs, folders, CSS, Drag and Drop, popup menus and (folder) events

	05/01/2010 Release 1.7.2
	  AG added: right click the debug option to be able to toggle all separate debug options easily

	07/01/2010 Release 1.8 [pre3]
	  AG added Smart Folders Support (TB3 only)
	  AG added Newsgroup Folders Support (TB3, SM, Pb) - not supported in TB2

	13/01/2010 Release 1.8.2
	  AG added toggling Smart Folders / All Folders views where necessary

	18/01/2010 Release 1.8.3
	  AG more selection improvements for virtual folders (such as search / smart folders)
	  AG added special icons for Junk, Drafts, Outbox and Templates
	  AG added code to fix changed Application Name (Mozilla-Thunderbird) which makes branching code fail in Linux.

	30/01/2010 Release 1.8.5
	  AG fixed: [Bug 22295] (selecting a QuickFolder closes single Message Tab) => now opens a folder view tab
	  AG fixed: [Bug 22144] - Highlighting not updated when switching Tabs in TB3 - now also selects Category if necessary!
	  AG fixed: [Bug 22316] - added Transparency options for toolbar (Personas friendly) and tabs (translucently colored, use white for almost complete transparency)
	  AG fixed: Broken Dutch locale leading to crashes for the users of this language
	  AG improved: toggling between flat style and native style tabs
	  AG improved: following external support links in TB3 (done) and SeaMonkey (WIP)
	  AG Added: Help menu item for popup menu
	  AG Improved: tried to resolve as many name space conflicts as possible by using QF_ prefix for global objects
	  AG added: Shadows option
	  AG added: ca-AD locale (Catalan) by Jordi Benaiges; Improvements to Russian, Italian and Dutch locales.
	  AG: bundled all locales into locales.jar

	30/01/2010 Release 1.8.5.1
	  AG: enabled switching to folder view when in Task view

	30/01/2010 Release 1.8.5.2
	  AG: removed unneccessary use of let - fixes crash issues for Thunderbird 2
	  AG: validation - removed 'insecure' usage of SetTimeout
	  AG: new Support option in Menu
	  AG: fixed missing option in french locale which would have caused a crash
	  AG: Removed attempting to apply shadow & alpha blending to TB2 version.

	06/02/2010 Release 1.8.5.3
	  AG: swapped Support / Help Menu as they were the wrong way round
	  AG: added new support menu item to Postbox and SeaMonkey overlay

	22/02/2010 1.8.7
	  AG: added tooltiptext with full folder name + server
	  AG: Fixed some layout issues in Options screen (linux case sensitivity, vertical spacing)
	  AG: added localization for Add-Ons description
	  AG: added hidden option for not changing the folder tree view (extensions.quickfolders.disableFolderSwitching)
	  AG: further reduced namespace pollution
	  AG: moved all picture resources to skin folder and packaged into a jar file to conserve resources (1 file handle instead of 81)

	08/03/2010 1.8.8
	  AG: fixed missing Icons in options and reorder tabs dialogs.
	  AG: Added locale zh-CN by Loviny
	  AG: Added - CTRL+Click tab shortcut opens a new mail tab.


	12/05/2010 - 1.9.1
	  AG: Fixed [Bug 22585] - (1.8.9) Smart Folders view erratically switched to standard folder if clicked folder is in a collapsed tree branch
	  AG: Fixed [Bug 21054] - (1.8.9) Enabled scrolling long menus while dragging by using code from Robert Gibson's "Scroll Menus On Drag" extension https://addons.mozilla.org/en-US/firefox/addon/1411
	  AG: Fixed [Bug 21317] - force alphabetical sorting of subfolder menus. Note: Does only work with some Umlauts / Diacritics.
	  AG: Added code from Pavel for displaying subfolder counts
	  AG: Added code for customizing the "QuickFolders" label (Pavel)
	  AG: Fixed [Bug 22695] - now folders can be moved within the folder tree without QuickFolders losing track of them
	  AG: Added option for alphabetically sorting subfolders in menus
	  AG: Added firstrun functionality
	  AG: Added locale sr by DakSrbija
	  AG: various tooltips in options dialog
	  AG: tightened up namespace pollution issues
	  AG: Added version history jump to options dialog (right-click from version number)

	11/07/2010 - 1.9.3
	  AG: fixed [Bug 22901] - Position of subfolder within submenu should be always on top, even with alphabetical sorting enabled.
	  AG: simplified dragging & selection of parent folder nodes in expanded sub folders.

	06/08/2010 - 1.9.5
	  AG: improved spacing around Category Dropdown
	  AG: Refactored code from main module into Interface.collapseParentMenus
	  AG: [Bug 22902] Added ensureStyleSheetLoaded method for testing
	  AG: Renamed style sheet files and title to avoid referencing clashes
	  AG: Fixed [Bug 23091] this caused parent subfolder to be opened instead of subfolder (if not visible in folder tree)
	  AG: Added deep scanning of folder counts and display for all sub menu items. menus with unread nested subfolders also bold.
	  AG: Fixed missing translation in french options screen
	  AG: Fixed [Bug 23078] the (black) font on the filled style pimped tabs was unreadeable. Font color hardcoded to white for dark backgrounds
	      - this overrides the user set font color, by design.

	14/08/2010 - 1.9.5.3
	  AG: Fixed [Bug 23118] Version 1.9.5 missing Tabs in TB2 (due to using an undefined trim function)

	16/08/2010 - 1.9.7
	  AG: Fixed [Bug 23121] Using Japanese characters in tab, "moji-bake" Problem after restart
	  AG: Fixed [Bug 23129] popup menu points with subfolders ignored click (since 1.9.3)
	  AG: Fixed [Bug 23077] Active/Hovered/Drag colors do not override filled style

	19/08/2010 - 1.9.7.1
	  AG: Fixed [Bug 23147] Dragging emails does not open subfolder popups


	20/08/2010 - 1.9.7.3
	  AG: Fixed [Bug 23091] TB only - caused parent subfolder to be opened instead of subfolder!

==  2.0  ======
	19/09/2010 - 2.0
	  AG: Added drag and drop from folder submenu to add new QF tab
	  AG: New Right-click Tab context menu layout, added folder commands (Mark read, compact, rename, delete, xpunge)
	  AG: Added: Create new folder on drag feature! POP only (as it can crash IMAP accounts), not a feature in TB2.
	  AG: Fixed [Bug 23209] CTRL+Number Shortcut opens new content tabs
	  AG: Fixed [Bug 21317] During drag & drop, the top item in subfolders list is not sorted alphabetically
	  AG: Fixed CTRL+Shift+Number did not move selected messages
	  AG: Compatible with Postbox 2.0.b3
	  AG: Fixed a bug that made reordering quicktabs to the right of their current position fail sometimes
	  AG: TB2 - Fixed - hidden shadows option and made icons option visible again

	12/10/2010 - 2.1
	  AG: Fixed a problem when dragging to New Folder from find result list (error message: no source folder)
	  AG: Added Recent Folders Tab
	  AG: Added locale sv-SE by Mikael Hiort af Ornaes
	  AG: Fixed Positioning of Folder Menus

	10/12/2010 - 2.2
	  AG: Made compatible with Postbox 2.2
	  AG: Fixed [Bug 23500] Tabs begin counting at "2" when using Recent Folders tab

	27/12/2010 - 2.3
	  AG: improvement in handling MRUTime - this will be now also updated if an email is moved that is already read.
	  AG: (Postbox) Fixed [Bug 23542] which caused Move (& Copy) Messages to fail in Postbox version > 2.0
	  AG: (Postbox) Fixed display of Version history after upgrade

	31/01/2010 - 2.4
	  AG: Improved Performance during lengthy mail downloads by not _completely_ rebuilding the visible tabs
		  (now only updating labels and popupmenus of the existing tabs so that counts & "unread style" are up to date
	  AG: added new context menu item for rebuilding the tabs
	  AG: added new context menu item for removing orphaned tabs
	  AG: added "repair folder" command (mail folder menu)

	2.5  24/05/2011
	  AG: Added Hotkey for folders rebuild CTRL+SHIFT+(Configurable)
	  AG: Category Dropdown now saves space by using menulist attribute sizetopopup=none
	  AG: Added settings dropdown button on main toolbar
	  AG: Added Current Folder Toolbar (single message view)
	  AG: Added option for disabling recent folders dropdown
	  AG: Added icons to options tabs
	  AG: Added new folder command: "delete junk in current folder"
	Bugfixes
	  AG: moved getVersion to Utilities
	  AG: Replaced deprecated popupNode with triggerNode and workaround code for modern Gecko Versions
	  AG: Fixed issues with font colors on dark colored Tabs

	2.6 - 06/06/2011
	  AG: Bugfix - hide Current Folder toolbar in message fullscreen mode
	  AG: Bugfix - Category dropdown was invisible in Thunderbird 2.0
	  AG: added option extensions.quickfolders.showToolIcon for hiding tools menu icon
	  AG: Bugfix - on SeaMonkey 2.1 adding folders to the QuickFolders toolbar from the folderpane did not work anymore
	  AG: Coloring improvement for unstyled Tabs
	  AG: Added more options for Recent Folder menu (right-click in Options window)
	  AG: Fixed "Purge Junk" command in Current Folder Toolbar
	  AG: Fixed - SeaMonkey did not open Version History in internal browser.

	2.7 - 18/06/2011
	  AG + CW: Added pastel style
	  AG: Added custom radius
	  AG: First Run tidy ups:replace "QuickFolders.ActiveTab.Style.background-color" with "extensions.quickfolders.style.ActiveTab.background-color" etc.
      CW: Added Mac Style (CWA-Design + Testing, AG QF integration)
	  AG: Added Next / Previous unread Mail buttons
	  AG: Added checkbox for hiding qf toolbar menu icon (cogwheel)
	  AG: Added dropdown for theming and theming dependant customization
	  AG: Split Native Style into Tabs and Buttons, implemented Selected on Tabs look
	  AG: Options dialog now remembers last panel selected
	  AG: Fixed [Bug 23930] Recent Folders Tab Dropdown stops working after a Message Dropped into it
	  AG: Fixed "expunged n bytes" message for Empty Trash, Empty Junk and Compact Folder
	  AG: It is now possible to add the Current Folder button to the QuickFolder tab (like a drag from the folder tree)
	  AG: Improved behavior when adding an existing QuickFolder (selects category correctly, even if not categorized or display always is selected)
	  AG: Renamed toxic preferences
	Known issues
	  - the label for goto next / Previous unread Mail is currently not localized (last minute feature!)
	  - when multiple messages are selected the Current Folder toolbar is not visible (this works in Postbox though, so multiple messages can be dragged)

	2.7.1 - 07/07/2011
	  AG: Fixed [Bug 24143] - (Linux) Folder tabs disappear and ALT+N shortcuts disabled on upgrade to 2.7 - renamed Current Folder XUL files.
	  AG: Added hidden option (about.config) to hide QF toolbar when it is not needed (e.g. Calendar view) extensions.quickfolders.toolbar.onlyShowInMailWindows
	  AG: Fixed Postbox bug - could not drag new folders to toolbar (Error: msgFolder.QueryInterface is not a function)
	  AG: Fixed a bug that caused folders to disappear on TB2 on Mac Systems (related to new Current Folder Bar)
	  AG: Right dropmarker did not display correctly when reordering tabs
	  AG: Fixed Bug [24188] - font color in flat style tabs is ignored (tabs without individual color settings)

	2.7.2 - Bugfixes - 11/08/2011
	  AG: Fixed [Bug 24223] - In Postbox, after displaying the calender. the message pane could not be displayed by clicking on the messages tab
	  AG: Added checkbox for option to hide QF toolbar when not needed
	  AG: avoid TB logging unnecessary errors in Stack Trace during unnecessary FolderLoaded events [Bug 24176]

	2.8 - Bugfixes - 31/08/2011
	  AG: Bumped Compatibility to work with Tb 6.*
	  AG: Moved Current Folder Bar position in Thunderbird for compatibility with Conversation View and to support multiple messages
	  AG: Fixed versioning issues introduced by AddonManager changes in the new Mozilla versions.
	  AG: Fixed [Bug 24361] QuickFolders 2.7.2 incompatible with Thunderbird 6.0.1
	  AG: Fixed [Bug 24365] QF folders disappear after viewing email

	2.9 - 23/09/2011
	  AG: [Bug 24389] Stability fixes on version updates - firstRun check is now only run _after_ extension version number was retrieved from AddonManager
	  AG: Removed popup "successfully upgraded to version..." and replaced with a modeless notification panel
	  AG: added "use strict" for better namespace pollution control
	  AG: added hidden option to suppress version history on update

	2.9.1 - 01/10/2011 Emergency bugfix for older versions of Thunderbird (2.* and 3.*)
	  AG: [Bug 24451] On older versions of Thunderbird (pre 4.2) the Tabs are not displayed as QuickFolders can not be loaded completely.

	2.9.3 - 16/10/2011
	  AG: Fixed - Go to Parent Folder was not working
	  AG: Improved - Tab text color to white / black on applePill layout selected folder
	  AG: Improved Font coloring for native tabs, apple pills and flat style; made background color for apple pills configurable, for use also with dark themes
	  AG: Fixed striped pastel style
	  AG: Improved theme integration of Current Folder Bar by making background transparent
	  AG: Improved collapsing behavior of "Pimp My Tabs" page
	  AG: added some transition effects
	  AG: New Feature - [Bug 24435] On clicking a QF tab, activate corresponding mail Tab (Thunderbird + SeaMonkey only)
	  AG: Fixed bug in SeaMonkey that changed current folder URI when new mail Tab was opened by CTRL+Click on QF Tab

	2.9.4 - 30/11/2011
	  AG: Pushed Postbox Compatibility to 3.0
	  AG: Make is possible to use multiple categories per tab
	  AG: height fixes in Apple Pills style

	2.10 - 03/01/2012
	  AG: Added hidden Option for disabling drag to New folder in local accounts [Bug 24617]
	  AG: Made compatible with Thunderbird 10.0 (new overlay because of structural changes)
	  AG: Replaced Mostly Crystal Icons with the original ones from Everaldo Crystal Project (version from 2003); Crystal Icons are released under GNU General Public License
	  AG: Renamed 'bookmark' to 'tab' to make descriptions easier to understand
	  AG: Tab Categories - Highlight "uncategorized" item if a folder has no category; optimized category retrieval by caching cat array.
	  AG: Tab Categories - added logic to unselect other items if show ALWAYS or UNCATEGORIZED are selected
	  AG: Tab Categories - fixed Category Remove / Rename which was broken due to introduciton of "use strict"

	2.11 - 09/01/2012
	  AG: Tab Categories: added tab title to dialog
	  AG: Some improvements for showing correct folder size results after compact / empty trash etc.
	  AG: Inbox Folders => added "Get Mail" menu item
	  AG: fixed review issues from 2.10 with winstripe / qute theme on windows 7 causing all menu items to be shifted left.

	2.12 - 13/01/2012
	  AG: Fixed a bug that caused the current Folder toolbar to be missing on Thunderbird3 - Thunderbird7 

	2.13 - 17/01/2012
	  AG: Fixed: in some cases, rename categories or delete categories can fail. 

==  3.0  ======
	3.0  - 22/02/2012
	  AG: Thread Tools - added "mark thread as read" command on click
	  AG: New Filter Wizard
	  AG: Reorganization of options window (split first page into General and Advanced)
	  AG: Made some current folder tools and mail context menu items configurable
	  AG: Some (but not all) of the layout changes can be previewed instantly (WIP)

	3.1 - 17/04/2012
	  AG: [Bug 24767] right-click+Control shows QF commands popup only.
	  AG: Folder categories - added ability to copy existing QF tab to a new Category, without the message "Folder already has a tab"
	  AG: [Bug 24766] Support MOVING folders by dragging them from foldertree to a QF location and holding down SHIFT 
	  	(currently this works only on Windows - somehow Tb doesn't detect the SHIFT state in Linux)
	  AG: Fixed - if a Folder is renamed the Tab does not "come with it" leading to invalid / missing tabs
	  AG: Added Filter List enhancements (search filters box, move to top button, move to bottom button) 
	      - localization of this feature will be provided in the next maintenance release.
	  AG: changed overlay using messenger.xul instead of mailWindowOverlay.xul
	  AG: [Bug 24736] fixed & simplified overlay for single Message window; fixed closing current folder bar in single message window
	  AG: added option for disabling current folder bar on single message window
	  AG: about:config (for advanced Debug and other hidden settings) used to be obscured behind the options dialog
	  AG: stylesheet fix in SeaMonkey
	  AG: added border around the close button on the (filter) notification message to make it better visible 
	  AG: increased minimum width of label on Current Folder bar from 12 to 16em to avoid resizing on newsgroups
	  AG: Added about:config shortcut to Recent Folder Icon (max number of entries) on Advanced Options
	  AG: Fixed a button size issue with SeaMonkey Modern Theme which was causing some buttons in current Folder bar to be too big
	  
	3.3 - RELEASED 01/05/2012
	  AG: Added context menu entry to Search Folder
	  AG: [Bug 24715] Added main Toolbar toggle button
	  AG: Fixed [Bug 24864] "updateUserStyles - TypeError: ss.href is null" caused by the Rise of The Tools extension
	  AG: Added folder context menu button to current Folder bar
	  AG: Added option to hide msg navigation buttons from current Folder bar
	  AG: Folder categories - added ability to copy existing QF tab to a Category, without the message "Folder already has a tab", even if it has no category
	  AG: Added Message Filter count & localizations
	  AG: Improved & tightened Filter List layout, pre publishing the changes planned in Thunderbird [Bug 450302] 
	  AG: New Feature in Filter List: added count of displayed filters (Thunderbird only) 
	3.4 - Quick fix for Postbox users
	  AG: Fixed [Bug 24894] - Postbox only - trying to add new folders to the QuickFolders toolbar results in an error or no action at all
	  AG: updated Dutch and Hungarian locales
	  AG: 1st round of tidy up on install.manifest following the drop of support for Tb<3.1
	3.5 - RELEASED 08/05/2012
	  AG: Fixed regression that caused unread count not to be updated anymore
	  AG: Removed unnecessary console outputs
	  AG: removed styling hacks that looked like namespace pollutions
	  AG: replaced is.. functions with get properties
	3.6 - RELEASED 05/06/2012
	  AG: Complete overhaul of the palette - removed images for performance and completely redesigned Pastel style
	  AG: Added paint mode - now also supports recent folders tab
	  AG: added "use Palette" entries for the Bling My Tabs status color choices (default, active, hovered, draggedOver)
	  AG: Fixed synchronizing quickFilters status
	  AG: more refinements for filters from the quickFilters project
	  AG: added "Real Buttons" style
	  AG: fixed some glitches that caused hovered  & active folder to "push down" toolbar border.
	  AG: use new quickFilters settings & behavior for Naming conventions
	  
	  Developer Notes:
	  - Palette was redesigned and the css moved out to the skin folder
	  - quickfolders-options.css and quickfolders-widgets.css also moved to skins folder
	  - Switched over to native JSON
	  
	3.7 - Released 21/08/2012
	  AG: [Bug 24945] Removed Accelerator on quickFolders options button that cause QF options to come up when ALT+O was pressed
	  AG: Fixed insufficient height of filter notification
	  AG: removed legacy deprecated css attributes to its own style sheet
	  AG: [Bug 25061] added checkbox so the "new subfolder" item can be disabled when dragging
	  AG: changed color of bottom color to reflect background of active tab
	  AG: in "bling my tabs" background colors now corresponds to last selected palette item.
	  AG: removed any empty popup menus that may occur during dragging.
	  AG: Completed pt-BR locale (thanks to Marcelo Ghelman) 
	  AG: Fixed zh-CN locale
	  
	3.7.2 - Released 30/08/2012
	  AG: updated CA locale
	  AG: synchronized background color picker and background color of non-palette preview tabs
	  AG: improved faulty font coloring in tab on current folder bar
	  AG: improved padding of (flat-style) toolbarbuttons 
	  AG: improved readability of active colored tabs and pastel support in apple-pills style by choosing appropriate text-shadow
	
	3.7.3 - Released 04/09/2012
	  AG: fixed mail me link on options tab
	  
	3.8.1 - Released 11/11/2012
	  AG: improved per-mailTab category selection.
	  AG: use quickFilters filtering engine instead of the QuickFolders one if qF is installed.
	  AG: added Donation button to bottom of options dialog
	  AG: improved horizontal padding in Noia & other themes
	  AG: Removed obsolete "Recent" placeholder on empty QF toolbar
	  AG: Fixed [Bug 25203] - Error when adding a filter if Message Filters window is already open
	  AG: removed deprecated -moz-linear-gradient into legacy style sheets
	  
	3.8.2 - Released 18/11/2012
	  AG: getFolderTooltip throws an error if no root folder is present leading to missing or incomplete tabs.
	  AG: Fixed [Bug 25220] - No more background gradient colors on tabs with Thunderbird 3.x
	  AG: [CR 24613] - added a hidden option for full path in recent folders
	  AG: Bugfix: A missing rootFolder can create a NS_ERROR_FAILURE leading to no visible tabs.
	  AG: Fixed: logging can lead to errors if there are no categories defined.
	  AG: Bumped up SeaMonkey compatibility to 2.14.*
	  AG: Fixed styling glitches in SeaMonkey and Postbox (invisible Filter buttons)
		AG: Fixed [Bug 25204] - Allow location-aware dragging from within "virtual folder"
	
	3.9 - Release 21/12/2012
	  AG: Fixed a styling problem with checkbox icons in options dialog
		AG: Fixed colorings in legacy Gecko systems (Postbox)
		AG: flat tabs special states - added override for active tab color
		AG: improved preview tabs on "bling my tabs" page
		AG: improved 'use palette' auto-hide
		AG: optimized order of style sheets for better performance
		
	3.10 - Release 09/01/2013
	  AG: [Bug 25277] - Error at startup: "Quickfolders.updateUserStyles - error TypeError: ss is null"
		AG: Made background color of current folder toolbar configurable
		AG: Fixed status bar messages in SeaMonkey
		AG: fixed duplicate donation tabs in SeaMonkey and Postbox
		AG: Added Polish locale (this is still work in progress) - thanks to hipogrys (Babelzilla)
		AG: Various style fixes
		
		
	3.11 - Release 12/02/2013
		AG: Fixed [Bug 25204] - filter mode: dragging from a fresh search, creates error "QuickFolders.Util.moveMessages:TypeError: sourceFolder is null"
		AG: Fixed dropping of current folder tab to QuickFolders bar
		AG: Improved contrast of filter activation icon (small and big sizes)
		AG: Added setting for displaying folders with new mails in italics
		AG: [Bug 25021] - Added setting for Minimum Height for fixing issues for Mac users
		AG: Enhancement: Do not switch to current folder's category, if current tab has an tab from a different Category selected! 
		    This way mail tabs "remembering" their QF Category will work better and faster
		
	3.12 - WIP
	  AG: redesigned tab bar to align tabs to bottom regardless of theme used
		AG: [FR 23039] - Support Linebreaks to force Multiple Rows of Tabs
		AG: [FR 24431] - Optional Separators between tabs
    AG: [FR 25364] - Hide QF toolbar and current folder bar in single message tab (should behave same as single message window) 
		AG: Some interface refactoring
		AG: Option Tab Extended: added checkboxes for QuickFolders commands 
		AG: new top level menu: open new tab
    AG: made compatible with redefinition of Thunderbird's nsIMsgAccount interface 		
		AG: fixed broken paint mode.
		AG: removed call from options load that caused redraw of folders; made remove orphans more resilient against Tb bugs
		AG: [Bug 25533] - SeaMonkey 2.23a1 - throws "ReferenceError: EventListener is not defined"
		AG: Added independent palette type settings for the tab states selected / hover / dragover
		AG: Fixed truncated filter notification in Postbox
		AG: [Bug 25536] Compatibility Fixes for Thunderbird 26 (removed widgetglue.js)
		AG: To DO: restore selected category on startup
	

###VERSION###

  KNOWN ISSUES
  ============
  23/10/2009
	- if folders are added / removed during session this is not refreshed in subfolder list of popup set
	  workaround: select another Category this will rebuild the menus
	  single message window still buggy regarding showing current folder label

  OPEN BUGS
  ============

	A complete list of bugs can be viewed at http://quickfolders.mozdev.org/bugs.html

  PLANNED FEATURES
  ================
	- persist categories in separate JSON list for more flexibility (e.g. rename)
	- size of category dropdown should expand with length of list

  WISHLIST
  ========
	- drag to thread finds quickfolder with correct thread and drops message there
*/
"use strict";

//QuickFolders.gFolderTree = null;

if (!this.QuickFolders_CC)
	this.QuickFolders_CC = Components.classes;
if (!this.QuickFolders_CI)
	this.QuickFolders_CI = Components.interfaces;

var QuickFolders_globalHidePopupId="";
var QuickFolders_globalLastChildPopup=null;
var QuickFolders_globalWin=Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(QuickFolders_CI.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");
var QuickFolders_globalDoc=document;

var QuickFolders_getWindow = function() {
	return QuickFolders_globalWin;
}

var QuickFolders_getDocument= function() {
	return QuickFolders_globalDoc;
}

var QuickFolders = {
	doc: null,
	win: null,
	isQuickFolders: true, // to verify this
	gFolderTree: null,
	// keyListen: EventListener,
	loadListen: false,
	_tabContainer: null,
	get tabContainer() {
		if (!this._tabContainer) {
			if (QuickFolders.Util.Application=='Postbox')
				this._tabContainer = this.doc.getElementById('tabmail').mTabContainer;
			else
				this._tabContainer = this.doc.getElementById('tabmail').tabContainer;
		}
		return this._tabContainer;
	},
	tabSelectEnable: true,
	currentURI: '',
	lastTreeViewMode: null,
	initDone: false,
	compactReportFolderCompacted: false,
	compactReportCommandType: '',
	compactLastFolderSize: 0,
	compactLastFolderUri: null,
	selectedOptionsTab : -1,// preselect a tab -1 = default; remember last viewed tab!

	// helper function to do init from options dialog!
	initDocAndWindow: function() {
		var mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(QuickFolders_CI.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");

		if (mail3PaneWindow) {
			QuickFolders.doc = mail3PaneWindow.document;
			QuickFolders.win = mail3PaneWindow;
		}
		else {
			QuickFolders.doc = document;
			QuickFolders.win = window;
		}
		QuickFolders_globalWin=QuickFolders.win;
		QuickFolders_globalDoc=QuickFolders.doc;

		QuickFolders.Util.logDebug ("initDocAndWindow\nQuickFolders.doc = " + QuickFolders.doc.location + "\nthis.doc = " + this.doc.location);
		
		QuickFolders.Interface.prepareCurrentFolderIcons();
	},

	initDelayed: function() {
	  var sWinLocation;
	  if (this.initDone) return;
	  QuickFolders.initDocAndWindow();
	  QuickFolders.Util.VersionProxy(); // initialize the version number using the AddonManager
	  var nDelay = QuickFolders.Preferences.getIntPref('initDelay');
	  if (!nDelay>0) nDelay = 750;

	  sWinLocation = new String(window.location);

    if (QuickFolders.isCorrectWindow()) {
			QuickFolders.Util.logDebug ("initDelayed ==== correct window: " + sWinLocation + " - " + document.title + "\nwait " + nDelay + " msec until init()...");
			// document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
			//var thefunc='QuickFolders.init()';
			//setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
			setTimeout(function() { QuickFolders.init(); }, nDelay);
			this.initDone=true;
		}
		else {
		  try {
			var doc = document; // in case a stand alone window is opened (e..g double clicking an eml file)
			QuickFolders.Interface.Toolbar.style.display = 'none';
			// doc.getElementById('QuickFolders-Toolbar').style.display = 'none';

			let wt = doc.getElementById('messengerWindow').getAttribute('windowtype');

			QuickFolders.Util.logDebug ("DIFFERENT window type(messengerWindow): "
					+ wt
					+ "\ndocument.title: " + doc.title )
			if (wt === 'mail:messageWindow') {
				QuickFolders.Interface.displayNavigationToolbar(QuickFolders.Preferences.isShowCurrentFolderToolbar(true), true);
			}


		  }
		  catch(e) { ;} // QuickFolders.LocalErrorLogger("Exception in initDelayed: " + e) -- always thrown when options dialog is up!
		}
	} ,

	isCorrectWindow: function() {
		try {
			return document.getElementById('messengerWindow').getAttribute('windowtype') === "mail:3pane";
		}
		catch(e) { return false; }
	} ,

	init: function() {
		var that = this.isQuickFolders ? this : QuickFolders;
		var myver = that.Util.Version; // will start VersionProxy

		var ApVer; try{ ApVer=that.Util.ApplicationVersion} catch(e){ApVer="?"};
		var ApName; try{ ApName=that.Util.Application} catch(e){ApName="?"};

		if (that.Preferences && that.Preferences.isDebug())
			that.LocalErrorLogger("QuickFolders.init() - QuickFolders Version " + myver + "\n" + "Running on " + ApName + " Version " + ApVer);

		// moved into Version Proxy!
		// that.Util.FirstRun.init();

		that.addTabEventListener();
		
		let versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                            .getService(Components.interfaces.nsIVersionComparator)
		
    // load legacy border radius + box-shadow rules
		if (ApName == 'Thunderbird' && versionComparator.compare(ApVer, "4.0") < 0) {
			let sE = QuickFolders.Styles;
			QuickFolders.Util.logDebugOptional("css.styleSheets","Loading legacy style sheet... Ap Version=" + ApVer + "; styleEngine = " + sE);
			let ss = QuickFolders.Interface.getStyleSheet(sE, 'chrome://quickfolders/content/quickfolders-pre4.css', "");
		}
		else
			QuickFolders.Util.logDebugOptional("css.styleSheets","App Version {" + ApVer + "}>=4.0   => no legacy css rules loaded!");
		

		// only add event listener on startup if necessary as we don't
		// want to consume unnecessary performance during keyboard presses!
		if (that.Preferences.isUseKeyboardShortcuts || that.Preferences.isUseRebuildShortcut || that.Preferences.isUseNavigateShortcuts) {
			if(!that.Interface.boundKeyListener) {
				that.win.addEventListener("keypress", this.keyListen = function(e) {
					QuickFolders.Interface.windowKeyPress(e,'down');
				}, true);
				that.win.addEventListener("keyup", function(e) {
					QuickFolders.Interface.windowKeyPress(e,'up');
				}, true);

				that.Interface.boundKeyListener = true;
			}
		}
		var folderEntries = that.Preferences.loadFolderEntries();

		if(folderEntries.length > 0) {
			
			that.Model.selectedFolders = folderEntries;

			that.Interface.updateUserStyles();

			var lastSelectedCategory = that.Preferences.LastSelectedCategory;
			that.Util.logDebug("last selected Category:" + lastSelectedCategory );

			if(that.Model.isValidCategory(lastSelectedCategory))
			  that.Interface.selectCategory(lastSelectedCategory, true);
			  
			QuickFolders.Interface.updateMainWindow();  // selectCategory already called updateFolders!  was that.Interface.updateFolders(true,false)

		}

		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

		observerService.addObserver({
			observe: function() {
				QuickFolders.Interface.updateFolders(true, false);
				QuickFolders.Interface.updateUserStyles();
			}
		},"quickfolders-options-saved", false);
		// QuickFolders.Util.FirstRun.init();

		that.Util.logDebug("call displayNavigationToolbar.");
		// remember whether toolbar was shown, and make invisible or initialize if necessary
		that.Interface.displayNavigationToolbar(that.Preferences.isShowCurrentFolderToolbar(false), false);
		// single Message
		that.Interface.displayNavigationToolbar(that.Preferences.isShowCurrentFolderToolbar(true), true);

		// new function to automatically main toolbar when it is not needed
		that.Util.logDebug("call initToolbarHiding.");
		that.Interface.initToolbarHiding();
		that.Util.logDebug("QF.init() ends.");
		// now make it visible!
		QuickFolders.Interface.Toolbar.style.display = '-moz-inline-box';
		// this.doc.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
		
		if (QuickFolders.Preferences.getBoolPrefQF('contextMenu.hideFilterMode')) {
			if (QuickFolders.Interface.FilterToggleButton)
				QuickFolders.Interface.FilterToggleButton.collapsed=true;
		}
	} ,

	sayHello: function() {
		alert("Hello from QuickFolders");
	} ,

	// handler for dropping folder shortcuts
	toolbarDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),

		getSupportedFlavours : function () {
			var flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			flavours.appendFlavour("text/x-moz-newsfolder");
			flavours.appendFlavour("text/unicode"); // buttons
			flavours.appendFlavour("text/currentfolder"); // custom flavour for dragging current
			return flavours;
		},

		onDragEnter: function (evt,flavour,session){
			evt.preventDefault();
			return false;
		},

		onDragOver: function (evt,flavour,session){
			if (flavour.contentType=="text/x-moz-folder" || flavour.contentType=="text/unicode" || flavour.contentType=="text/x-moz-newsfolder" || flavour.contentType=="text/currentfolder") // only allow folders or  buttons!
				session.canDrop = true;
			else {
				QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDragover - can not drop " + flavour.contentType);
				session.canDrop = false;
			}
		},

		onDrop: function (evt,dropData,dragSession) {
 			function addFolder(src) {
					if(src) {
						var cat=QuickFolders.Interface.CurrentlySelectedCategoryName;
						if (QuickFolders.Model.addFolder(src, cat)) {
							var s = "Added shortcut " + src + " to QuickFolders"
							if (cat !== null) s = s + " Category " + cat;
							try{QuickFolders.Util.showStatusMessage(s);} catch (e) {};
						}
					}
			};

			QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDrop " + dropData.flavour.contentType);
			var msgFolder, sourceUri;

			switch (dropData.flavour.contentType) {
				case "text/x-moz-folder":
				case "text/x-moz-newsfolder":
					if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) { 
						msgFolder = evt.dataTransfer.mozGetDataAt(dropData.flavour.contentType, 0);
						if (msgFolder.QueryInterface)
							sourceUri = msgFolder.QueryInterface(Components.interfaces.nsIMsgFolder).URI;
						else
							sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dropData, dragSession); // Postbox
					}
					else {
						sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dropData, dragSession); // older gecko versions.
					}
					addFolder(sourceUri);

					break;
				case "text/currentfolder":
					var sourceUri = dropData.data;
					addFolder(sourceUri);
					break;
				case "text/unicode":  // plain text: button was moved OR: a menuitem was dropped!!
					var sourceUri = dropData.data;
					var eType = dragSession.dataTransfer.mozSourceNode.tagName;
					var myDragPos;
					var target=evt.currentTarget
					if (evt.pageX<120) // should find this out by checking whether "Quickfolders" label is hit
						myDragPos="LeftMost"
					else
						myDragPos="RightMost"
					if (eType === "menuitem" || eType === "menu") {
						addFolder(sourceUri);
					}
					else {
						if(!QuickFolders.ChangeOrder.insertAtPosition(sourceUri, "", myDragPos)) {
							//a menu item for a tab that does not exist was dropped!
							addFolder(sourceUri);
						}
					}
					break;
			}
		}
	} ,

	// recursive popups have to react to drag mails!
	popupDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),
		newFolderMsgUris: [],
		dragAction: null,

		getSupportedFlavours : function () {
			var flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message");
			flavours.appendFlavour("text/unicode");  // test
			
			// MOVE FOLDER SUPPORT
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			return flavours;
		},
		dragOverTimer: null,
		onDragEnter: function(evt, dragSession) {
			var popupStart = evt.target;
			QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.onDragEnter " + popupStart.nodeName + " - " + popupStart.getAttribute('label'));
			try {
				evt.preventDefault(); // fix layout issues in TB3 + Postbox!

				var pchild = popupStart.firstChild;
				if (pchild) {
					if (pchild.nodeName === 'menupopup') {
						// hide all sibling popup menus
						var psib = popupStart.nextSibling;
						while (psib) {
							if (psib.nodeName === 'menu' && popupStart !== psib && psib.firstChild && psib.firstChild.hidePopup)
								psib.firstChild.hidePopup();
							psib = psib.nextSibling;
						}
						psib = popupStart.previousSibling;
						while (psib) {
							if (psib.nodeName === 'menu' && popupStart !== psib && psib.firstChild && psib.firstChild.hidePopup) 
								psib.firstChild.hidePopup();
							psib = psib.previousSibling;
						}
						// only show popup if they have at least one menu item!
						if (pchild.childNodes && pchild.childNodes.length > 0)
							pchild.showPopup();
						QuickFolders.Util.logDebugOptional("dnd","Displayed popup " + popupStart.getAttribute('label'));
					}
					else
						QuickFolders.Util.logDebugOptional("dnd","Ignoring DragEnter with child node: " + pchild.nodeName);
				}
			}
			catch(e) {
				QuickFolders.Util.logDebug ("onDragEnter: failure - " + e);
			}
		},

		// deal with old folder popups
		onDragExit: function(evt, dragSession) {
			var popupStart = evt.target;
			// find parent node!
			QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.onDragExit " + popupStart.nodeName + " - " + popupStart.getAttribute('label'));
			try {
				if (popupStart.nodeName=='menu') {
					QuickFolders_globalLastChildPopup=popupStart; // remember to destroy!
				}
			}
			catch (e) {
				QuickFolders.Util.logDebugOptional("dnd","CATCH popupDragObserver.onDragExit: \n" + e);
			}
		} ,

		onDragOver: function (evt, flavor, session){
			session.canDrop = (flavor.contentType === "text/x-moz-message");
			if (null !== QuickFolders_globalLastChildPopup) {
				/*QuickFolders_globalLastChildPopup.firstChild.hidePopup();*/
				QuickFolders_globalLastChildPopup=null;
			}
		},

		// drop mails on popup: move mail, like in buttondragobserver
		onDrop: function (evt,dropData,dragSession) {
			let isThread = evt.isThread;
			// helper function for creating a new subfolder => TODO implement filter learn for this case!
			function newFolderCallback(aName, FolderParam) {
				let step='';
				let isManyFolders = false;
				let sourceFolder = null;
				if (aName) try {
					let currentURI;

					// we're dragging, so we are interested in the folder currently displayed in the threads pane
					let aFolder;
					if (QuickFolders.Util.Application=='Postbox') {
						currentURI = GetSelectedFolderURI();
						aFolder = QuickFolders.Model.getMsgFolderFromUri(FolderParam, true).QueryInterface(Components.interfaces.nsIMsgFolder); // inPB case this is just the URI, not the folder itself??
					}
					else {
						if (gFolderDisplay.displayedFolder)
							currentURI = gFolderDisplay.displayedFolder.URI;
						else
							isManyFolders = true;
						aFolder = FolderParam.QueryInterface(Components.interfaces.nsIMsgFolder);
					}

					step='1. create sub folder: ' + aName;
					QuickFolders.Util.logDebugOptional("dragToNew", step);
					aFolder.createSubfolder(aName, msgWindow);

					var newFolder;

					// if folder creation is successful, we can continue with calling the
					// other drop handler that takes care of dropping the messages!
					step='2. find new sub folder';
					QuickFolders.Util.logDebugOptional("dragToNew", step);
					if (QuickFolders.Util.Application=='Postbox') {
						newFolder = QuickFolders.Model.getMsgFolderFromUri(aFolder.URI + "/" + aName, true).QueryInterface(Components.interfaces.nsIMsgFolder);
						
					}
					else {
						var iCount=0;
						QuickFolders.Util.logDebugOptional("dragToNew", step);
						while (! (newFolder = aFolder.findSubFolder(aName)) && iCount++<10000); // let this time out.
						if (iCount>=10000) {
							alert('could not find the new folder ' + aName + ' - on IMAP accounts this function might be too slow!');
							iCount=0;
							while (! (newFolder = aFolder.findSubFolder(aName)) && iCount++<10000); // let this time out.
							if (iCount>=10000)
								return false;
						}
					}
					menuItem.folder = newFolder;

					var isCopy = (QuickFolders.popupDragObserver.dragAction === Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY);
					step='3. ' + (isCopy ? 'copy' : 'move') + ' messages: ' + newFolder.URI + ' thread:' + isThread;
					QuickFolders.Util.logDebugOptional("dragToNew", step);
					
					if (QuickFolders.FilterWorker.FilterMode)
					{
						sourceFolder = QuickFolders.Model.getMsgFolderFromUri(currentURI, true);
						let virtual = QuickFolders.Util.isVirtual(sourceFolder);
						if (!sourceFolder || virtual)
						{
							let msgHdr = messenger.msgHdrFromURI(QuickFolders.popupDragObserver.newFolderMsgUris[0].toString());
							sourceFolder = msgHdr.folder;
						}
					}
					var msgList = QuickFolders.Util.moveMessages(newFolder, QuickFolders.popupDragObserver.newFolderMsgUris, isCopy)

					// have the filter created with a delay so that filters can adapt to the new folder!!
					if (QuickFolders.FilterWorker.FilterMode) {
						// if user has quickFilters installed, use that instead!!
						QuickFolders.FilterWorker.createFilterAsync(sourceFolder, newFolder, msgList, isCopy, true);
					}
					// msgList = null; // free it

					QuickFolders.Util.logDebugOptional("dragToNew", "4. updateFolders...");
					QuickFolders.Interface.updateFolders(false); // update context menus
					return true;

				}
				catch(ex) {
					alert("Exception in newFolderCallback, step [" + step + "]: " + ex);
				}
				return false;
			}

			var menuItem = evt.target;

			try {
				QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.onDrop " + dropData.flavour.contentType);
				QuickFolders.Util.logDebugOptional("dnd","target's parent folder: " + menuItem.folder.URI);
				var targetFolder = menuItem.folder.QueryInterface(Components.interfaces.nsIMsgFolder);

				if (!targetFolder.canCreateSubfolders) {
					alert("You can not create a subfolder in " + targetFolder.prettiestName);
					return false;
				}

				var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
				trans.addDataFlavor("text/x-moz-message");

				// let's store the Msg URIs from drag session before we do anything else!!
				QuickFolders.popupDragObserver.dragAction = dragSession.dragAction; // remember copy or move?
				// reset in case there is already data there; only move mails of the last dnd operation!
				while (QuickFolders.popupDragObserver.newFolderMsgUris.length)
					QuickFolders.popupDragObserver.newFolderMsgUris.pop();
				for (var i = 0; i < dragSession.numDropItems; i++) {
					dragSession.getData (trans, i);
					var dataObj = new Object();
					var flavor = new Object();
					var len = new Object();
					try {
						trans.getAnyTransferData(flavor, dataObj, len);

						if ((flavor.value === "text/x-moz-message") && dataObj) {
							dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
							var messageUri = dataObj.data.substring(0, len.value);
							QuickFolders.popupDragObserver.newFolderMsgUris.push(messageUri);
						}
					}
					catch (e) {
						QuickFolders.LocalErrorLogger("Exception in onDrop item " + i + " of " + dragSession.numDropItems + "\nException: " + e);
					}
				}


/**
 http://mozilla-xp.com/mozilla.dev.apps.thunderbird/How-To-Get-Highlighted-Folder-in-TB3
 As a general rule,
 anything to do with the folder pane is an attribute of gFolderTreeView,
 anything to do with the thread pane is an attribute of gFolderDisplay,
 and anything to do with the message pane is an attribute of gMessageDisplay.
**/

				var dualUseFolders = true;
				if (targetFolder.server instanceof Components.interfaces.nsIImapIncomingServer)
					dualUseFolders = targetFolder.server.dualUseFolders;


				QuickFolders.Util.logDebugOptional("window.openDialog (newFolderDialog.xul)\n"
					+ "folder/preselectedURI:" + targetFolder + " (URI: " + targetFolder.URI + ")\n"
					+ "dualUseFolders:" + dualUseFolders);
				if (QuickFolders.Util.Application=='Postbox') {
					// see newFolderDialog.js for when Callback is called.

					window.openDialog("chrome://messenger/content/newFolderDialog.xul",
                      "",
                      "chrome,titlebar,modal",
                      {preselectedURI:targetFolder.URI, dualUseFolders:dualUseFolders, okCallback:newFolderCallback});
				}
				else {

					window.openDialog("chrome://messenger/content/newFolderDialog.xul",
							"",
							"chrome,modal,resizable=no,centerscreen",
							{folder: targetFolder, dualUseFolders: dualUseFolders, okCallback: newFolderCallback});
				}



			} catch(e) { QuickFolders.LocalErrorLogger("Exception in OnDrop event: " + e); return false}
			return true;
		}

	},

	messageDragObserver: {
		getSupportedFlavours : function () {
			var flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message"); // emails only (find out whether a thread is covered by this)
			return flavours;
		},

		onDragStart: function (event, transferData, action) {
			var button = event.target;

			transferData.data = new TransferData();

			// check event.originalTarget and event.target
			QuickFolders.Util.threadPaneOnDragStart(event);
		}
	},

	buttonDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),
		getSupportedFlavours : function () {
			var flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message"); // emails
			flavours.appendFlavour("text/unicode");  // tabs
			// MOVE FOLDER SUPPORT
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			return flavours;
		},

		dragOverTimer: null,

		onDragEnter: function(evt, dragSession) {
			function removeLastPopup(p, theDoc) {
				if (!p) return;
				var popup = theDoc.getElementById(p);
				if (popup) {
					try {
						if (QuickFolders.Util.Application === 'SeaMonkey')
							popup.parentNode.removeChild(popup);
						else
							popup.hidePopup(); // parentNode.removeChild(popup)
						QuickFolders.Util.logDebugOptional("dnd", "removed popup:" + p );
					}
					catch (e) {
						QuickFolders.Util.logDebugOptional("dnd", "removing popup:  [" + p.toString() + "]  failed!\n" + e + "\n");
					}
				}
				else
					QuickFolders.Util.logDebugOptional("dnd", "removeLastPopup could not find element: " + p);
				if (p === QuickFolders_globalHidePopupId)
					QuickFolders_globalHidePopupId="";
				
			}

			try {
				if (null==dragSession.sourceNode) {
					QuickFolders.Util.logDebugOptional("dnd", "UNEXPECTED ERROR QuickFolders.OnDragEnter - empty sourceNode!");
					return;
				}
				// add a function to MOVE folders (using the treechildren sourceNode + modifier key SHIFT)
				var isAlt = evt.altKey;
				var isCtrl = evt.ctrlKey;
				var isShift = evt.shiftKey;
				QuickFolders.Util.logDebugOptional("dnd","buttonDragObserver.onDragEnter - sourceNode = " + dragSession.sourceNode.nodeName + "\n"
					+ "  ALT = " + isAlt 
					+ "  CTRL = " + isCtrl 
					+ "  SHIFT = " + isShift);
				if (dragSession.sourceNode.nodeName === 'toolbarpaletteitem') {
					QuickFolders.Util.logDebug("trying to drag a toolbar palette item - not allowed.");
					dragSession.canDrop=false;
					return;
				}
				var button = evt.target;
				// somehow, this creates a duplication in linux
				// delete previous drag folders popup!
// 				removeLastPopup(QuickFolders_globalHidePopupId, this.doc);

				if(button.tagName === "toolbarbutton") {
					// highlight drop target
					if (dragSession.numDropItems==1) {
						if (dragSession.isDataFlavorSupported("text/unicode" )) {
						// show reordering target position!
						// right or left of current button! (try styling button with > OR < to show on which side the drop will happen)
						var node = dragSession.sourceNode;

						// find out whether drop target button is right or left from source button:
						if (node.hasAttributes()) {
							var j;
							var sDirection;
								var box = node.boxObject;
								if (box) {
									var dx = (box.x - button.boxObject.x);
									if (dx !== 0) {
										sDirection=(dx>0 ? "dragLEFT" : "dragRIGHT")
										button.className += (" " + sDirection); // add style for drop arrow (remove onDragExit)
									}
								}
							}
						}
					}

					//show context menu if dragged over a button which has subfolders
					var targetFolder = null;
					if(button.folder)
						targetFolder = button.folder;

					var i;
					var otherPopups = QuickFolders.Interface.menuPopupsByOffset;
					for(i = 0; i < otherPopups.length; i++) {
						if (otherPopups[i].folder) {
							if (otherPopups[i].folder !== targetFolder && otherPopups[i].hidePopup)
								otherPopups[i].hidePopup();
						}
						else if (targetFolder) { // there is a targetfolder but the other popup doesn't have one (special tab!).
							if (otherPopups[i].hidePopup)
								otherPopups[i].hidePopup();
							else
								QuickFolders.Util.logDebug("otherPopups[" + i + "] (" + otherPopups[i].id + ") does not have a hidePopup method!");
						}
					}


					// only show popups when dragging messages!
					// removed && targetFolder.hasSubFolders as we especially need the new folder submenu item for folders without subfolders!
					// also add  treechildren when SHIFT is pressed => move a folder! ....  isShift && button.tagName === "treechildren"
					if(dragSession.isDataFlavorSupported("text/x-moz-message") 
					   || 
					   dragSession.isDataFlavorSupported("text/x-moz-folder") )  // MOVE FOLDER support
					try {
						//close any other context menus
						if (dragSession.isDataFlavorSupported("text/unicode" )) {
							removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
							return;  // don't show popup when reordering tabs
						}

						if (targetFolder)
							QuickFolders.Util.logDebugOptional("recentFolders", "creating popupset for " + targetFolder.name );

						// instead of using the full popup menu (containing the 3 top commands)
						// try to create droptarget menu that only contains the target subfolders "on the fly"
						// haven't found a way to tidy these up, yet (should be done in onDragExit?)
						// Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
						// no menus necessary for folders without subfolders!
						var popupset = this.doc.createElement('popupset');
						QuickFolders.Interface.FoldersBox.appendChild(popupset);
						var menupopup = this.doc.createElement('menupopup');

						var popupId;
						if (targetFolder) {
							popupId = 'moveTo_'+targetFolder.URI;
							// excluding TB 2 from "drag to new folder" menu for now
							if(QuickFolders_globalHidePopupId !== popupId) {
								menupopup.setAttribute('id', popupId);
								menupopup.className = 'QuickFolders-folder-popup';
								menupopup.folder = targetFolder;
								popupset.appendChild(menupopup);
								removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
								QuickFolders.Interface.addSubFoldersPopup(menupopup, targetFolder, true);
							}
						}
						else { // special folderbutton: recent
							popupId = 'moveTo_QuickFolders-folder-popup-Recent';
							if(QuickFolders_globalHidePopupId !== popupId) {
								menupopup.setAttribute('id', popupId);
								popupset.appendChild(menupopup);
								removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
								QuickFolders.Interface.createRecentTab(menupopup, true, button);
							}
						}

						// a bug in showPopup when used with coordinates makes it start from the wrong origin
						//document.getElementById(popupId).showPopup(button, button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
						// AG fixed, 19/11/2008 - showPopup is deprecated in FX3!
						QuickFolders.Util.logDebugOptional("dnd", "showPopup with id " + popupId );
						var p =  this.doc.getElementById(popupId);
						// avoid showing empty popup
						if (p.childNodes && p.childNodes.length>0) {
							this.doc.popupNode = button;
							if (p.openPopup)
								p.openPopup(button,'after_start', -1,-1,"context",false);
							else
								p.showPopup(button, -1,-1,"context","bottomleft","topleft");
						}

						if (popupId==QuickFolders_globalHidePopupId) QuickFolders_globalHidePopupId=""; // avoid hiding "itself". QuickFolders_globalHidePopupId is not cleared if previous drag cancelled.

					}
					catch(e) { QuickFolders.Util.logException("Exception creating folder popup: ", e);};
					
				}
				
			}
			catch(ex) {
				QuickFolders.Util.logException ("EXCEPTION buttonDragObserver.onDragEnter: ", ex);
			}
		} ,

		// deal with old folder popups
		onDragExit: function(event, dragSession) {
			if (!dragSession.sourceNode) { 
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - session without sourceNode! exiting dragExit handler...");
				if (!dragSession.dataTransfer)
				event.preventDefault();
				return; 
			}
			try {
				var src = dragSession.sourceNode.nodeName ? dragSession.sourceNode.nodeName : "unnamed node";
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - sourceNode = " + src);
			 } catch(e) { QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - " + e); }
			if (dragSession.sourceNode.nodeName === 'toolbarpaletteitem') {
				QuickFolders.Util.logDebugOptional("dnd", "trying to drag a toolbar palette item - ignored.");
				dragSession.canDrop=false;
				return;
			}
			var button = event.target;
			QuickFolders_globalHidePopupId="";
			if (dragSession.isDataFlavorSupported("text/unicode" )) // drag buttons
			{
				// remove dragdrop marker:
				button.className = button.className.replace(/\s*dragLEFT/,"");
				button.className = button.className.replace(/\s*dragRIGHT/,"");
				return;  // don't remove popup when reordering tabs
			}
			// problem: event also fires when dragging into the menu, so we can not remove it then!
			var targetFolder = button.folder;
			var popupId = 'moveTo_'+targetFolder.URI;

			// this popup needs to be removed if we drag into another button.
			try {
				if (this.doc.getElementById(popupId))
					QuickFolders_globalHidePopupId = popupId; // arm for hiding! GLOBAL VAR!!
			}
			catch(ex) {
				window.dump("Cannot setup for delete: popup \n" + ex);
			}


		} ,


		onDragOver: function (evt,flavor,session){
			//QuickFolders.Util.logDebug("buttonDragObserver.onDragOver flavor=" + flavor.contentType);
			session.canDrop = true;
			if (flavor.contentType === "text/x-moz-message" || flavor.contentType === "text/unicode"
			 || flavor.contentType === "text/x-moz-folder" || flavor.contentType === "text/x-moz-newsfolder")
				session.canDrop = true;
			else {
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragover - can not drop " + flavor.contentType);
				session.canDrop = false;
			}

		},

		onDrop: function (evt,dropData,dragSession) {
			var isShift = evt.shiftKey;
			var debugDragging = false;
			//alert('test: dropped item, flavor=' + dropData.flavour.contentType);
			QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDrop flavor=" + dropData.flavour.contentType);
			var DropTarget = evt.target;
			var targetFolder = DropTarget.folder;
			QuickFolders_globalHidePopupId="";

			switch (dropData.flavour.contentType) {
				case  "text/x-moz-folder": // not supported! You can not drop a folder from foldertree on a tab!
					if (!isShift) {
						var sPrompt = QuickFolders.Util.getBundleString("qfMoveFolderOrNewTab", 
								"Please drag new folders to an empty area of the toolbar! If you want to MOVE the folder, please hold down SHIFT while dragging.");
						alert(sPrompt);
						break;
					}
					// handler for dropping folders
					try {
						var sourceFolder = QuickFolders.Util.getFolderFromDropData(evt, dropData, dragSession);
						QuickFolders.Interface.moveFolder(sourceFolder, targetFolder);
					}
					catch(e) {QuickFolders.LocalErrorLogger("Exception in QuickFolders.onDrop:" + e); };
					break;
				case  "text/x-moz-message":
					var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
					//alert('trans.addDataFlavor: trans=' + trans + '\n numDropItems=' + dragSession.numDropItems);
					trans.addDataFlavor("text/x-moz-message");

					var messageUris = []; var i;
					var sourceFolder = null;

					for (i = 0; i < dragSession.numDropItems; i++) {
						//alert('dragSession.getData ... '+(i+1));
						dragSession.getData (trans, i);
						var dataObj = new Object();
						var flavor = new Object();
						var len = new Object();
						if (debugDragging ) alert('trans.getAnyTransferData ... '+(i+1));
						try {
							trans.getAnyTransferData(flavor, dataObj, len);

							if (flavor.value === "text/x-moz-message" && dataObj) {

								dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
								if (debugDragging ) alert('getting data from dataObj...');
								var messageUri = dataObj.data.substring(0, len.value);

								if (debugDragging ) alert('messageUris.push...');
								if (debugDragging ) alert('messageUri=' + messageUri) ;
								messageUris.push(messageUri);
							}
						}
						catch (e) {
							QuickFolders.LocalErrorLogger("Exception in onDrop item " + i + " of " + dragSession.numDropItems + "\nException: " + e);
						}
					}
					// handler for dropping messages
					try {
						QuickFolders.Util.logDebugOptional("dragToNew", "onDrop: " + messageUris.length + " messageUris to " + targetFolder.URI);
						if(messageUris.length > 0) {
							let sourceFolder;
							if (QuickFolders.FilterWorker.FilterMode)
							{
								// note: get CurrentFolder fails when we are in a search results window!!
								// [Bug 25204] => fixed in 3.10
								sourceFolder = QuickFolders.Util.CurrentFolder;
								let virtual = QuickFolders.Util.isVirtual(sourceFolder);
								if (!sourceFolder || virtual)
								{
									let msgHdr = messenger.msgHdrFromURI(messageUris[0].toString());
									sourceFolder = msgHdr.folder;
								}
							}
							var msgList = QuickFolders.Util.moveMessages(
								targetFolder,
								messageUris,
								dragSession.dragAction === Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY
							);
							if (QuickFolders.FilterWorker.FilterMode)
								QuickFolders.FilterWorker.createFilterAsync(sourceFolder, targetFolder, msgList, false);
						}

					}
					catch(e) {QuickFolders.LocalErrorLogger("Exception in onDrop - QuickFolders.Util.moveMessages:" + e); };
					// close any top level menu items after message drop!

					//hide popup's menus!
					QuickFolders.Util.logDebug ("buttonDragObserver.onDrop " + DropTarget.tagName+ '  Target:' + targetFolder.name );

					QuickFolders.Interface.collapseParentMenus(DropTarget);

					if (evt.shiftKey) {
						QuickFolders_MySelectFolder(targetFolder.URI);
					}

					break;
				case "text/unicode":  // dropping another tab on this tab inserts it before
					QuickFolders.ChangeOrder.insertAtPosition(dropData.data, DropTarget.folder.URI, "");
					break;
			}
		},
		// new handler for starting drag of buttons (re-order)
		onDragStart: function (event, transferData, action) {
			var button = event.target;
			if(!button.folder)
				 return;
			transferData.data = new TransferData();
			// if current folder button is started to drag, use a different flavor
			if (button.id && button.id === "QuickFolders-CurrentFolder")
				transferData.data.addDataForFlavour("text/currentfolder", button.folder.URI);
			else
				transferData.data.addDataForFlavour("text/unicode", button.folder.URI);
			// now let's start supporting dragging to the tab bar.
			// it looks like I need to wrap http://mxr.mozilla.org/comm-central/source/mail/base/content/tabmail.xml
			//  ---  dragstart  ---
			// let dt = event.dataTransfer;
			//  // If we drag within the same window, we use the tab directly
      // dt.mozSetDataAt("application/x-moz-tabmail-tab", draggedTab, 0);
			// // otherwise we use session restore & JSON to migrate the tab.
      // let uri = this.tabmail.persistTab(tab);    // <==== !!!!
			// if (uri)
      //   uri = JSON.stringify(uri);
			// dt.mozSetDataAt("application/x-moz-tabmail-json", uri, 0);
			// dt.mozCursor = "default";
			//  --- dragover ---
			//  // incase the user is dragging something else than a tab, and
      //  // keeps hovering over a tab, we assume he wants to switch to this tab.
      //  if ((dt.mozTypesAt(0)[0] != "application/x-moz-tabmail-tab")
      //         && (dt.mozTypesAt(0)[1] != "application/x-moz-tabmail-json")) {
			//    let tab = this._getDragTargetTab(event);
      // 		if (!tab) return;
			//  --- drop ---
			// 
			
			
			
			
		}

	},

	// for persistent category selection, add a tabmail listener
	addTabMailListener: function() {
		
	},
	
	addLoadEventListener: function() {
		// avoid registering this event listener twice!
		if (!this.loadListen) {
			window.addEventListener("load", function() { QuickFolders.initDelayed(); }, true);
		}
		this.loadListen=true;
	},

	addTabEventListener: function() {
		try {
			QuickFolders.tabContainer.addEventListener("select", function(event) { QuickFolders.TabListener.mailTabSelected(event); }, false);
		}
		catch (e) {
			QuickFolders.LocalErrorLogger("No tabContainer available! " + e);
			QuickFolders._tabContainer = null;
		}
	}
}


function QuickFolders_MyEnsureFolderIndex(tree, msgFolder)
{
	// try to get the index of the folder in the tree
	try {
		var index ;

		if (typeof tree.getIndexOfFolder !== 'undefined')
			index = tree.getIndexOfFolder(msgFolder);
		else
			if (typeof tree.builderView !== 'undefined' && typeof tree.builderView.getIndexOfResource !== 'undefined')
				index = tree.builderView.getIndexOfResource(msgFolder);
			else
				if (typeof EnsureFolderIndex !== 'undefined')
					index = EnsureFolderIndex(msgFolder);
				else
					return -1;

		QuickFolders.Util.logDebugOptional ("folders", "QuickFolders_MyEnsureFolderIndex - index of " + msgFolder.name + ": " + index);

		if (index === -1) {
			if (null==msgFolder.parent)
				return -1;
			var parentIndex = QuickFolders_MyEnsureFolderIndex(tree, msgFolder.parent);

			// if we couldn't find the folder, open the parent
			if(parentIndex !== -1 && !tree.builderView.isContainerOpen(parentIndex)) {
				tree.builderView.toggleOpenState(parentIndex);
			}

			if (typeof tree.getIndexOfFolder !== 'undefined')
				index = tree.getIndexOfFolder(msgFolder);
			else
				if (tree.builderView !== 'undefined')
					index = tree.builderView.getIndexOfResource(msgFolder);
				else
					if (typeof EnsureFolderIndex !== 'undefined')
						index = EnsureFolderIndex(msgFolder);
					else
						return -1;
		}
		return index;
	}
	catch(e) {
		QuickFolders.Util.logException('Exception in QuickFolders_MyEnsureFolderIndex', e);
		return -1;
	}

}

function QuickFolders_myRDF()
{
//  if (QuickFolders.Util.Appver() > 2)
	return Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
//  else
// return RDF;
}

// replaces TB2 only helper method GetFolderTree()
function QuickFolders_MyGetFolderTree() {
  if (!QuickFolders.gFolderTree)
	 QuickFolders.gFolderTree = QuickFolders.Util.$("folderTree");
  return QuickFolders.gFolderTree;
}

function QuickFolders_MyChangeSelection(tree, newIndex)
{
  if(newIndex >= 0)
  {
	QuickFolders.Util.logDebugOptional("folders", "ChangeSelection of folder tree.index " + tree.currentIndex + " to " + newIndex);
	tree.view.selection.select(newIndex);
	tree.treeBoxObject.ensureRowIsVisible(newIndex);
  }
}

// the core function for selecting a folder
// adding re-use of mail tabs if the folder is open in another mail tab, switch to that one!
function QuickFolders_MySelectFolder(folderUri)
{
	function getIndexTabURI(idx) {
		var info = tabmail.tabInfo[idx]; // note: tabmail is declared further down - it is in scope.
		if (info.msgSelectedFolder)
			return info.msgSelectedFolder.URI; // SM
		if (    info.folderDisplay
		     && info.folderDisplay.view
		     && info.folderDisplay.view.displayedFolder
		     && info.folderDisplay.view.displayedFolder.URI
		   )
		   return info.folderDisplay.view.displayedFolder.URI; //Tb
		return '';
	}
	//during QuickFolders_MySelectFolder, disable the listener for tabmail "select"
	QuickFolders.Util.logDebugOptional("folders", "QuickFolders_MySelectFolder: " + folderUri);
	// QuickFolders.tabSelectEnable=false;

	var folderTree = QuickFolders_MyGetFolderTree();
	var folderResource = QuickFolders_myRDF().GetResource(folderUri);
	var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
	let folderIndex, i;

	QuickFolders.currentURI = folderUri;

	let tabmail = document.getElementById("tabmail");
	if (tabmail && tabmail.tabInfo) {
		for (i=0;i<tabmail.tabInfo.length;i++) {
			var tabURI = getIndexTabURI(i);
			if(   tabmail.tabInfo[i].mode
			   && tabmail.tabInfo[i].mode.name==QuickFolders.Util.mailFolderTypeName
			   && folderUri === tabURI
			   && tabmail.tabContainer
			   && i !== tabmail.tabContainer.selectedIndex)
			{
				if (tabmail.switchToTab)
					tabmail.switchToTab(i); // switch to first tab with this URI
				else
					tabmail.tabContainer.selectedIndex = i;
				break;
			}
		}
	}


	var Con = QuickFolders.Util.Constants;

	if (QuickFolders.Util.Application=='Thunderbird')
	{
		// TB 3
		// find out if parent folder is smart and collapsed (bug in TB3!)
		// in this case getIndexOfFolder returns a faulty index (the parent node of the inbox = the mailbox account folder itself)
		// therefore, ensureRowIsVisible does not work!
		var theTreeView = gFolderTreeView;
		QuickFolders.lastTreeViewMode = theTreeView.mode; // backup of view mode. (TB3)

		folderIndex = theTreeView.getIndexOfFolder(msgFolder);
		if (null == folderIndex) {
				theTreeView.selectFolder(msgFolder);
			folderIndex = theTreeView.getIndexOfFolder(msgFolder);
		}
		
		if (msgFolder.parent) {
			QuickFolders.Util.ensureFolderViewTab(); // lets always do this when a folder is clicked!

			if (null==folderIndex) {
				QuickFolders.Util.ensureNormalFolderView();
				folderIndex = theTreeView.getIndexOfFolder(msgFolder);
			}

			var parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
			// flags from: mozilla 1.8.0 / mailnews/ base/ public/ nsMsgFolderFlags.h
			var specialFlags = Con.MSG_FOLDER_FLAG_INBOX + Con.MSG_FOLDER_FLAG_QUEUE + Con.MSG_FOLDER_FLAG_SENTMAIL + Con.MSG_FOLDER_FLAG_TRASH + Con.MSG_FOLDER_FLAG_DRAFTS + Con.MSG_FOLDER_FLAG_TEMPLATES + Con.MSG_FOLDER_FLAG_JUNK ;
			if (msgFolder.flags & specialFlags) {
				// is this folder a smartfolder?
				if (folderUri.indexOf("nobody@smart")>0 && null==parentIndex && theTreeView.mode !== "smart") {
					// toggle to smartfolder view and reinitalize folder variable!
					theTreeView.mode="smart"; // after changing the view, we need to get a new parent!!
					folderResource = QuickFolders_myRDF().GetResource(folderUri);
					msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
					parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
				}

				// a special folder, its parent is a smart folder?
				if (msgFolder.parent.flags & Con.MSG_FOLDER_FLAG_SMART || "smart" === theTreeView.mode) {
					if (null === folderIndex || parentIndex > folderIndex) {
						// if the parent appears AFTER the folder, then the "real" parent is a smart folder.
						var smartIndex=0;
						while (0x0 === (specialFlags & (theTreeView._rowMap[smartIndex]._folder.flags & msgFolder.flags)))
						smartIndex++;
						if (!(theTreeView._rowMap[smartIndex]).open) {
							theTreeView._toggleRow(smartIndex, false);
						}
					}
				}
				else { // all other views:
					if (null !== parentIndex) {
						if (!(theTreeView._rowMap[parentIndex]).open)
							theTreeView._toggleRow(parentIndex, true); // server
					}
					else {
					QuickFolders.Util.logDebugOptional("folders", "Can not make visible: " + msgFolder.URI + " - not in current folder view?");
					}
				}
			}
		}

		if (folderIndex != null) {
			theTreeView.selectFolder (msgFolder);
			theTreeView._treeElement.treeBoxObject.ensureRowIsVisible(folderIndex);
		}

		// reset the view mode.
		if (!QuickFolders.Preferences.isChangeFolderTreeViewEnabled) {
			if (QuickFolders.lastTreeViewMode !== null && theTreeView.mode !== QuickFolders.lastTreeViewMode)
				theTreeView.mode = QuickFolders.lastTreeViewMode;
		}

		//folderTree.treeBoxObject.ensureRowIsVisible(gFolderTreeView.selection.currentIndex); // folderTree.currentIndex
		if ((msgFolder.flags & Con.MSG_FOLDER_FLAG_VIRTUAL)) // || folderUri.indexOf("nobody@smart")>0
			QuickFolders.Interface.onFolderSelected();
	}
	else if (QuickFolders.Util.Application=='SeaMonkey') {
		const TAB_MODBITS_TabShowFolderPane  = 0x0001;
		const TAB_MODBITS_TabShowMessagePane = 0x0002;
		const TAB_MODBITS_TabShowThreadPane  = 0x0004;
		const TAB_MODBITS_TabShowAcctCentral = 0x0008;

		// must have at least have either folder pane or message pane,
		// otherwise find another tab!
		if (!(tabmail.currentTabInfo.modeBits & (TAB_MODBITS_TabShowFolderPane | TAB_MODBITS_TabShowThreadPane)))
			for (i=0;i<tabmail.tabInfo.length;i++) {
				if (tabmail.tabInfo[i].modeBits & TAB_MODBITS_TabShowFolderPane) {
					gMailNewsTabsType.showTab (tabmail.tabInfo[i])
					found=true;
					break;
				}
			}

		folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
		// AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
		if (folderIndex<0) {
			QuickFolders.Util.ensureNormalFolderView();
			folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
			QuickFolders.tabSelectEnable=true;
		}
		QuickFolders_MyChangeSelection(folderTree, folderIndex);
	}
	else { // TB 2, Postbox
	// before we can select a folder, we need to make sure it is "visible"
	// in the tree.	to do that, we need to ensure that all its
	// ancestors are expanded
		if (QuickFolders.Util.Application=='Postbox') {
			folderIndex = EnsureFolderIndex(msgFolder);
			QuickFolders.Util.logDebugOptional("folders", "EnsureFolderIndex: " + msgFolder.URI);
		}
		else {
			 folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
		}
		// AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
		if (folderIndex<0) {
			QuickFolders.Util.ensureNormalFolderView();
			folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
			QuickFolders.tabSelectEnable=true;
		}
	  //else
	  //  QuickFolders.tabSelectEnable=false;
		QuickFolders_MyChangeSelection(folderTree, folderIndex);
	  // select message in top pane for keyboard navigation
	}
	
	// could not find folder!
	if (null == folderIndex) {
		if (!msgFolder || !msgFolder.filePath || !msgFolder.filePath.exists())
			return false;
	}

	if (QuickFolders.Preferences.isFocusPreview && !(GetMessagePane().collapsed)) {
		GetMessagePane().focus();
		QuickFolders.doc.commandDispatcher.advanceFocus();
		QuickFolders.doc.commandDispatcher.rewindFocus();
	}

	/* MESSAGE PREVIEW TOOLBAR - single message window only */
	/*
	if (QuickFolders.Preferences.isShowCurrentFolderToolbar(true)) {
		var winMediator = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"].getService(QuickFolders_CI.nsIWindowMediator);
		var mailMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
		if (mailMessageWindow) {
			let currentFolderTab = mailMessageWindow.document.getElementById('QuickFolders-CurrentFolder');
			if (currentFolderTab) {
				let tabColor = '';
				let entry = QuickFolders.Model.getFolderEntry(msgFolder.URI);
				let theLabel = entry ? entry.name : "";
				
				try { tabColor = entry.tabColor; }
				catch(e) {tabColor = null};
					
				QuickFolders.Interface.addFolderButton(msgFolder, theLabel, -1, tabColor, currentFolderTab, 'QuickFolders-CurrentFolder', QuickFolders.Preferences.ColoredTabStyle);
				// QuickFolders.Interface.addPopupSet('QuickFolders-folder-popup-currentFolder', msgFolder, -1, currentFolderTab);
				currentFolderTab.className = currentFolderTab.className.replace(/\s*striped/,"");
			}
		}
	}
	*/
	return true;
}

// set up the folder listener to point to the above function
QuickFolders.FolderListener = {
	lastRemoved: null, // MsgFolder was removed
	lastAdded: null, // MsgFolder was removed
	ELog: function(msg)
	{
	try {
		try {Components.utils.reportError(msg);}
		catch(e) {
			var Cc = Components.classes;
			var Ci = Components.interfaces;
			var cserv = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
			cserv.logStringMessage("QuickFolders:" + msg);
		}
	}
	catch(e) {
		// write to TB status bar??
		try{QuickFolders.Util.logToConsole("Error: " + msg);} catch(e) {;};
	};
	},

	OnItemAdded: function(parent, item, viewString) {
		try {
			if (!QuickFolders)
				return;
			var f=item.QueryInterface(Components.interfaces.nsIMsgFolder);
			QuickFolders.FolderListener.lastAdded = f;
		}
		catch(e) { };
	},

	OnItemRemoved: function(parent, item, viewString) {
		try {
			if (!QuickFolders)
				return;
			var f = item.QueryInterface(Components.interfaces.nsIMsgFolder);
			var fromURI = f.URI;
			var toURI = QuickFolders.FolderListener.lastAdded ? QuickFolders.FolderListener.lastAdded.URI : "";
			QuickFolders.FolderListener.lastRemoved = f;
			// check if QuickFolders references this message folder:
			if (fromURI !== toURI && QuickFolders.Model.getFolderEntry(fromURI)) {
				if (QuickFolders.FolderListener.lastAdded && (f.name === QuickFolders.FolderListener.lastAdded.name)) {
					// the folder was moved, we need to make sure to update any corresponding quickfolder:
					QuickFolders.Util.logDebugOptional("folders","Trying to move Tab " + f.name + " from URI \n" + fromURI + "\n to URI \n" + toURI);
					if (toURI && QuickFolders.Model.moveFolderURI(fromURI, toURI)) {
						QuickFolders.Util.logDebug ("Successfully updated URI of Tab " + f.name);
						QuickFolders.Interface.updateFolders(true, true);
					}
					else {
						var s = "Failed to update URI of tab: " + f.name + " please remove it manually and add to QuickFolders bar";
						QuickFolders.Util.logToConsole (s);
						alert(s);
					}
				}
			}
			QuickFolders.FolderListener.lastAdded=null;
		}
		catch(e) { };
	},

	// parent, item, viewString
	OnItemPropertyChanged: function(property, oldValue, newValue) {
		//var x=property.toString();
	},

	OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
		function add1000Separators( sValue ) {
			var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
			while(sRegExp.test(sValue.toString())) { sValue = sValue.replace(sRegExp, '$1,$2'); }
			return sValue;
		}
		try {
			if (typeof QuickFolders === 'undefined')
				return;
			let prop = property ? property.toString() : '';
			if (prop === "TotalUnreadMessages" ||
				(QuickFolders.Preferences.isShowTotalCount 
					&& prop === "TotalMessages")) {
					QuickFolders.Interface.setFolderUpdateTimer();
			}
			if (QuickFolders.compactReportFolderCompacted && prop === "FolderSize") {
				try
				{
					QuickFolders.compactReportFolderCompacted = false;
					var size1 = QuickFolders.compactLastFolderSize;
					var size2 = item.sizeOnDisk;
					if (item.URI && QuickFolders.compactLastFolderUri !== item.URI) {
						// should we reset it, in case the real message got lost ?
						return;
					}
					var message = "";

					// describe the action that caused the compacting
					switch (QuickFolders.compactReportCommandType) {
						case 'compactFolder':
							message = QuickFolders.Util.getBundleString("qfCompactedFolder", "Compacted folder") + " '" + item.prettyName + "'";
							break;
						case 'emptyJunk':
							message = QuickFolders.Util.getBundleString("qfEmptiedJunk", "Emptied junk and compacted folder")+ " '" + item.prettyName + "'";
							if (!item.URI)
								size2 = 0;
							break;
						case 'emptyTrash':
							message = QuickFolders.Util.getBundleString("qfEmptiedTrash", "Emptied trash.");
							if (!item.URI)
								size2 = 0;
							break;
						default:
							message = "unknown compactReportCommandType: [" + compactReportCommandType + "]";
							break;
					}
					var originalSize= QuickFolders.Util.getBundleString("qfCompactedOriginalFolderSize","Original size");
					var newSize = QuickFolders.Util.getBundleString("qfCompactedNewFolderSize","New Size");
					var expunged = QuickFolders.Util.getBundleString("qfCompactedBytesFreed","Bytes expunged");

					var out = message + " :: "
						+ (size1 ? (originalSize + ": " + add1000Separators(size1.toString()) + " ::  "
								   + expunged + ":" + add1000Separators((size1-size2).toString()) + " :: ")
								 : " ")
						+ newSize + ": " + add1000Separators(size2.toString()) ;
					//make sure it displays straight away and overwrite the compacting done message as well.

					setTimeout(function() { QuickFolders.Util.popupAlert("QuickFolders",out); QuickFolders.Util.logDebug(out); }, 250); // display "after compacting"

					QuickFolders.compactLastFolderUri = null;
					QuickFolders.compactLastFolderSize = 0;
				} catch(e) {;};
			}
		}
		catch(e) {this.ELog("Exception in Item OnItemIntPropertyChanged - TotalUnreadMessages: " + e);};
	},
	OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
	OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {
		// var x=prop;
	},
	OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
	OnItemEvent: function(item, event) {
		var eString = event.toString();
		try {
			if (!QuickFolders || !QuickFolders.Util)
				return;
			QuickFolders.Util.logDebugOptional("events","event: " + eString);
			switch (eString) {
				case "FolderLoaded": // DeleteOrMoveMsgCompleted
					try {
						if(QuickFolders && QuickFolders.Interface)
							QuickFolders.Interface.onFolderSelected();
					}
					catch(e) {this.ELog("Exception in FolderListener.OnItemEvent {" + event + "} during calling onFolderSelected:\n" + e)};
					break;
				case "RenameCompleted":
					// item.URI;
					if (QuickFolders && QuickFolders.FolderListener.lastRemoved) {
						QuickFolders.Model.moveFolderURI(QuickFolders.FolderListener.lastRemoved.URI, item.URI);
					}
					break;
			}
		}
		catch(e) {this.ELog("Exception in FolderListener.OnItemEvent {" + eString + "}:\n" + e)};
	},
	OnFolderLoaded: function(aFolder) { },
	OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}

QuickFolders.TabListener = {
	mailTabSelected: function(evt){
		try {
			if(QuickFolders) {
				// restore the category
				let tabmail = document.getElementById("tabmail");
				let idx = QuickFolders.tabContainer.selectedIndex;
				QuickFolders.Util.logDebugOptional("listeners.tabmail", "mailTab Selected() - tab index = " + idx);
				let info = tabmail.tabInfo[idx];
				if (info.QuickFoldersCategory) {
					QuickFolders.Util.logDebugOptional("listeners.tabmail", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
					QuickFolders.Interface.selectCategory(info.QuickFoldersCategory, false);
					QuickFolders.Interface.updateCategories();
				}
				// Do not switch to current folder's category, if current tab has another selected!
				else
					QuickFolders.Interface.setTabSelectTimer();
			}
		}
		catch(e) {QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected: " + e)};
	}
}

QuickFolders.LocalErrorLogger = function(msg) {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var cserv = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
	cserv.logStringMessage("QuickFolders:" + msg);
}



