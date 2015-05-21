"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/*===============
  Project History
  ===============
	
	legacy history moved to file: history_legacy.txt

==  3.0  ======
	3.0  - 22/02/2012
	  ## Thread Tools - added "mark thread as read" command on click
	  ## New Filter Wizard
	  ## Reorganization of options window (split first page into General and Advanced)
	  ## Made some current folder tools and mail context menu items configurable
	  ## Some (but not all) of the layout changes can be previewed instantly (WIP)

	3.1 - 17/04/2012
	  ## [Bug 24767] right-click+Control shows QF commands popup only.
	  ## Folder categories - added ability to copy existing QF tab to a new Category, without the message "Folder already has a tab"
	  ## [Bug 24766] Support MOVING folders by dragging them from foldertree to a QF location and holding down SHIFT 
	  	(currently this works only on Windows - somehow Tb doesn't detect the SHIFT state in Linux)
	  ## Fixed - if a Folder is renamed the Tab does not "come with it" leading to invalid / missing tabs
	  ## Added Filter List enhancements (search filters box, move to top button, move to bottom button) 
	      - localization of this feature will be provided in the next maintenance release.
	  ## changed overlay using messenger.xul instead of mailWindowOverlay.xul
	  ## [Bug 24736] fixed & simplified overlay for single Message window; fixed closing current folder bar in single message window
	  ## added option for disabling current folder bar on single message window
	  ## about:config (for advanced Debug and other hidden settings) used to be obscured behind the options dialog
	  ## stylesheet fix in SeaMonkey
	  ## added border around the close button on the (filter) notification message to make it better visible 
	  ## increased minimum width of label on Current Folder bar from 12 to 16em to avoid resizing on newsgroups
	  ## Added about:config shortcut to Recent Folder Icon (max number of entries) on Advanced Options
	  ## Fixed a button size issue with SeaMonkey Modern Theme which was causing some buttons in current Folder bar to be too big
	  
	3.3 - RELEASED 01/05/2012
	  ## Added context menu entry to Search Folder
	  ## [Bug 24715] Added main Toolbar toggle button
	  ## Fixed [Bug 24864] "updateUserStyles - TypeError: ss.href is null" caused by the Rise of The Tools extension
	  ## Added folder context menu button to current Folder bar
	  ## Added option to hide msg navigation buttons from current Folder bar
	  ## Folder categories - added ability to copy existing QF tab to a Category, without the message "Folder already has a tab", even if it has no category
	  ## Added Message Filter count & localizations
	  ## Improved & tightened Filter List layout, pre publishing the changes planned in Thunderbird [Bug 450302] 
	  ## New Feature in Filter List: added count of displayed filters (Thunderbird only) 
	3.4 - Quick fix for Postbox users
	  ## Fixed [Bug 24894] - Postbox only - trying to add new folders to the QuickFolders toolbar results in an error or no action at all
	  ## updated Dutch and Hungarian locales
	  ## 1st round of tidy up on install.manifest following the drop of support for Tb<3.1
	3.5 - RELEASED 08/05/2012
	  ## Fixed regression that caused unread count not to be updated anymore
	  ## Removed unnecessary console outputs
	  ## removed styling hacks that looked like namespace pollutions
	  ## replaced is.. functions with get properties
	3.6 - RELEASED 05/06/2012
	  ## Complete overhaul of the palette - removed images for performance and completely redesigned Pastel style
	  ## Added paint mode - now also supports recent folders tab
	  ## added "use Palette" entries for the Bling My Tabs status color choices (default, active, hovered, draggedOver)
	  ## Fixed synchronizing quickFilters status
	  ## more refinements for filters from the quickFilters project
	  ## added "Real Buttons" style
	  ## fixed some glitches that caused hovered  & active folder to "push down" toolbar border.
	  ## use new quickFilters settings & behavior for Naming conventions
	  
	  Developer Notes:
	  - Palette was redesigned and the css moved out to the skin folder
	  - quickfolders-options.css and quickfolders-widgets.css also moved to skins folder
	  - Switched over to native JSON
	  
	3.7 - Released 21/08/2012
	  ## [Bug 24945] Removed Accelerator on quickFolders options button that cause QF options to come up when ALT+O was pressed
	  ## Fixed insufficient height of filter notification
	  ## removed legacy deprecated css attributes to its own style sheet
	  ## [Bug 25061] added checkbox so the "new subfolder" item can be disabled when dragging
	  ## changed color of bottom color to reflect background of active tab
	  ## in "bling my tabs" background colors now corresponds to last selected palette item.
	  ## removed any empty popup menus that may occur during dragging.
	  ## Completed pt-BR locale (thanks to Marcelo Ghelman) 
	  ## Fixed zh-CN locale
	  
	3.7.2 - Released 30/08/2012
	  ## updated CA locale
	  ## synchronized background color picker and background color of non-palette preview tabs
	  ## improved faulty font coloring in tab on current folder bar
	  ## improved padding of (flat-style) toolbarbuttons 
	  ## improved readability of active colored tabs and pastel support in apple-pills style by choosing appropriate text-shadow
	
	3.7.3 - Released 04/09/2012
	  ## fixed mail me link on options tab
	  
	3.8.1 - Released 11/11/2012
	  ## improved per-mailTab category selection.
	  ## use quickFilters filtering engine instead of the QuickFolders one if qF is installed.
	  ## added Donation button to bottom of options dialog
	  ## improved horizontal padding in Noia & other themes
	  ## Removed obsolete "Recent" placeholder on empty QF toolbar
	  ## Fixed [Bug 25203] - Error when adding a filter if Message Filters window is already open
	  ## removed deprecated -moz-linear-gradient into legacy style sheets
	  
	3.8.2 - Released 18/11/2012
	  ## getFolderTooltip throws an error if no root folder is present leading to missing or incomplete tabs.
	  ## Fixed [Bug 25220] - No more background gradient colors on tabs with Thunderbird 3.x
	  ## [CR 24613] - added a hidden option for full path in recent folders
	  ## Bugfix: A missing rootFolder can create a NS_ERROR_FAILURE leading to no visible tabs.
	  ## Fixed: logging can lead to errors if there are no categories defined.
	  ## Bumped up SeaMonkey compatibility to 2.14.*
	  ## Fixed styling glitches in SeaMonkey and Postbox (invisible Filter buttons)
		## Fixed [Bug 25204] - Allow location-aware dragging from within "virtual folder"
	
	3.9 - Release 21/12/2012
	  ## Fixed a styling problem with checkbox icons in options dialog
		## Fixed colorings in legacy Gecko systems (Postbox)
		## flat tabs special states - added override for active tab color
		## improved preview tabs on "bling my tabs" page
		## improved 'use palette' auto-hide
		## optimized order of style sheets for better performance
		
	3.10 - Release 09/01/2013
	  ## [Bug 25277] - Error at startup: "Quickfolders.updateUserStyles - error TypeError: ss is null"
		## Made background color of current folder toolbar configurable
		## Fixed status bar messages in SeaMonkey
		## fixed duplicate donation tabs in SeaMonkey and Postbox
		## Added Polish locale (this is still work in progress) - thanks to hipogrys (Babelzilla)
		## Various style fixes
		
		
	3.11 - Release 12/02/2013
		## Fixed [Bug 25204] - filter mode: dragging from a fresh search, creates error "QuickFolders.Util.moveMessages:TypeError: sourceFolder is null"
		## Fixed dropping of current folder tab to QuickFolders bar
		## Improved contrast of filter activation icon (small and big sizes)
		## Added setting for displaying folders with new mails in italics
		## [Bug 25021] - Added setting for Minimum Height for fixing issues for Mac users
		## Enhancement: Do not switch to current folder's category, if current tab has an tab from a different Category selected! 
		    This way mail tabs "remembering" their QF Category will work better and faster
		
	3.12 - 22/09/2013
		PRO FEATURES
		## [FR 23039] - Support Linebreaks to force Multiple Rows of Tabs
		## [FR 24431] - Optional Separators between tabs
    ## [FR 25364] - Hide QF toolbar and current folder bar in single message tab (should behave same as single message window) 
		FEATURES
	  ## Redesigned tab bar to align tabs to bottom regardless of theme used
		## Option Tab Extended: added checkboxes for QuickFolders commands 
		## New top level menu: open new tab
    ## Made compatible with redefinition of Thunderbird's nsIMsgAccount interface 		
		## removed call from options load that caused redraw of folders; made remove orphans more resilient against Tb bugs
		## Added independent palette type settings for the tab states selected / hover / dragover
		## Improved "dark" style of current folder toolbar to harmonize better with TT deepdark
		## Accelerated visual response when selecting a QuickFolder
		BUG FIXES
		## Fixed broken paint mode.
		## Fixed truncated filter notification in Postbox
		## [Bug 25536] Compatibility Fixes for Thunderbird 26 (removed widgetglue.js)
		## [Bug 25533] - SeaMonkey 2.23a1 - throws "ReferenceError: EventListener is not defined"
		## Some interface refactoring
		## Thunderbird only: Now persists selected categories of multiple tabs.
		## Numerous SeaMonkey bugfixes especially around mail tabs 
		## Fixed a problem with (jade) green palette style and removed !important from font colors.
		
	3.12.1 Maintenance Release - 25/09/2013
	  ## Fixed [Bug 25585] -	"Hide when not needed option" ALWAYS hides toolbar 
		## Fixed [Bug 25589] When Pastel was selected the preview tabs (on layout "bling" screen) where painted with standard palette when a new color was chosen

	3.12.2 Maintenance Release - WIP
	  ## Fixed [Bug 25598] - Active folder not marked at startup / category selection
		## [Bug 25610] - Clicking on tab does not switch to that tab most of the time
		## Fixed [Bug 25606] - QuickFolders doesn't always highlight active folder
		## Fixed [Bug 25608] - Unexpected behavior when changing folders while reading a message
		## Improved Search Folder algorithm and UI
		## Configurable Shortcut for Find folder
		## SeaMonkey - Improved height of current folder tab
		## When in paint mode instant coloring showed wrong color while pastel palette was selected
		## Fixed storing color for recent folder tab
		## Raised minimum Version for Thunderbird to 17.0

  3.12.4 - 02/11/2013
	
	
	3.14 - 12/02/2014
	  ## Fixed [Bug 25610] + [Bug 25608] - In single message view, QF tabs will now open a new folder tab 
		   (unless existing tab with that folder can be found). This should now also work in a search results / conversation view.
		## Improved tab handling code in Postbox (reuse existing tabs) / SeaMonkey (new virtual tab mode for single messages view)
		## Fixed [Bug 25634] - Long menus obscure tabs - tab popup menu is shifted to the right if it exceeds a configurable number of items
		   in about:config, edit extensions.quickfolders.folderMenu.realignMinTabs
		## Added [CR 25636] - make tab tooltips configurable
		## Fixed [Bug 25672] - Pastel and "Inactive Tab" colors don't work for Active, Hover, or DragOver colors
		## Fixed - when searching for folders (CTRL+ALT+J) the list is not reset when no matches are found.
		## when jumping to an invalid QuickFolder (the folder that it points to doesn't exist) give the option of deleting it immediately
		## QuickFolders now detects (and offers to delete) tabs for non-existant folders when you open 
		   them using the Find Folder feature or clicking their tab
		## Experimental: [Bug 25645] Adding Icons via context menu - to display the new menu, set Configuration setting
		   extensions.quickfolders.commandMenu.icon = true
		## Fix [Bug 25683] - Supress Line Break if Tab is first in Line
		## Fixed: changeTextPreference on options so that tab font size works
		## Postbox: Fixed get new messages, Delete Junk and Compact Folder commands
		## Reset Option "Display Shortcut Number" to false as default to remove clutter when installing QuickFolders. 
		   Note that some of the numbered shortcuts do not work out of the box anyway as they are used by Lightning
		## Used fixIterator for cross-application compatible accounts code
		## Refactored code around bool preferences
	
  4.0 - 15/02/2015
    ### PREMIUM FEATURES
    ## [FR 25708] Allow customizing icons in Folder tree (Thunderbird only)
    ## [Bug 25645] Interface for adding custom Icons (16px*16px) to Tabs
    ## [FR 25825] quickMove feature - move mails to any folder by drag + entering name
		## [FR 23039] Support Line breaks to force Multiple Rows of Tabs 
		## [FR 24431] Optional Separators between tabs 
    ### FREE IMPROVEMENTS
    ## Allow dragging multiple folders to QuickFolders tab (Tb / SeaMonkey)
    ## Added "Download Now" Command for unsynchronized IMAP / Exchange folders.
		## Fixed [Bug 25697] - When clicked, tab is incorrectly flagged for invalid folder: this seemed to mainly affect Linux users on IMAP
		## Added new mail folder command: "Explore Folder Location..."
    ## Added prompt for subject line when sending support email
    ## Improved large font support and spacing, especially on current folder bar.
    ## Paint mode: holding CTRL while painting will advance to the next color, CTRL+SHIFT goes back to previous color
    ## Fixed: Active Tab font color wasn't set reliably if active tab palette differs from uncolored / standard tabs.
    ## Fixed [Bug 25722] Hover Tab color is overwritten when right-clicking a Tab
    ## Fixed [Bug 25721] Drag Over Color not working in 2 Color mode
    ## Fixed: In some cases QuickFolders loaded the default font color if the user has stored 
              certain color value (due to wrong use of prefHasUserValue)
	  ## Fixed: QuickFolders.Worker is undefined (quickfolders-filterWorker.js Line: 157)
    ## Fixed: Recent folder menu shows encoded path decreasing readability
    ## Fixed: Sometimes tabContainer.selectedIndex can be uninitialized leading to the set current folder failing (when clicking a QF tab)
    ## Fixed [Bug 25824] In Ubuntu, QuickFolders Toolbar color cannot be set
    ## Improved Current Folder bar in Single Message window. (Styling + moving through messages)
    ## Feature Request [Bug 25513] Mark message as read when moving: toggle extensions.quickfolders.markAsReadOnMove to true for this behavior
    ## Feature Request [Bug 25856] 'Display total number of messages' on a per button basis
    ## [Bug 25941] : drag to new folder on IMAP fails
    ## Added configuration setting for folder navigation buttons and hide by default to simplify
    ## Show subfolders in popup menus is now activated by default (extensions.quickfolders.showSubfolders)
    ## removed retired Thunderbird overlays (appversion<12)
    ### VISUAL IMPROVEMENTS
    ## Night Vision Palette for dark themes
    ## Revised Standard and Pastel Colors
    
	4.0.3 QuickFolders Pro final release - 07/03/2015
    ## [Bug 25939] Hide current folder tab in single message tab
    ## modify "Find Folder" Icon to tie in with quickJump feature
    ## simplify Options Icon
    ## add option to hide prev/next/parent buttons in current Folder bar
    ## add tooltips to current folder previous and next sibling
    ## QuickFolders label autohide?
    ## Add a (?) Icon and link beside the Filter button in Options to link to quickFilters!
    ## Use UITourHighlight (http://mxr.mozilla.org/mozilla-central/source/browser/base/content/browser.xul#241)
    ## or something similar to highlight new UI features
    ## Investigate how Preferences.loadFolderEntries() works when the results are not assigned to Model.selectedFolders
		
  4.1  WIP planned release date: 24/05/2015
    ## [Bug 26021] Postbox 4.0 Compatibility
    ## [Bug 26019] Premium feature - Added "Reading List" for storing bookmarks for important mails
    ## quickMove / quickJump - made shortcut less "greedy" so that CTRL+SHIFT or ALT+SHIFT do not trigger it. 
       But also allow more areas to use the shortcut from (folder tree, accounts tree [Postbox], conversation view)
    ## Postbox / SeaMonkey - support the Icons menuitem on the QuickFolders Commands interface 
       (this doesn't support icons in the folder tree, but the tabs themselves)
    ## changed default of recentfolders.folderPathDetail to 2 
    ## Removed from current category had a bug that showed all categories if the FIRST category was removed from a Tab
    ## [Bug 25991] Disambiguate folders shown in quickMove Name Box 
        - added configuration options for the quickJump / quickMove results
        - increased default depth to 3 and include Account by default 
    ## [Bug 25864] but default unread subfolders aren't highlighted. changing the defaults to make this simpler:
               [x] Also display totals of subfolders - true
               [x] Highlight Folders with new mail - true
               [x] Display Tabs with newly arrived mail italic
    ## improved readability for highlighted new mail
    ## if mails are "queued" for a quickMove operation, using the keyboard shortcut "quickJump" temporarily 
       should not move the mails but navigate to the folder instead
    ## fixed background color selection in Postbox when palette menu is used in options screen
    ## Added colored bottom line in Postbox in flat theme and interface to change its height.
    
               
	Known Issues
	============
		## currently you can only drag single emails to a file using the envelope icon in Current Folder Toolbar.
		## when using the DOWN key to go to the search results of find folder, DOWN has to be pressed twice. (Tb+Pb only)
		## search in SeaMonkey delays highlighting the current tab when switching to the folder.
	
	
	
###VERSION###

  KNOWN ISSUES
  ============


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


// Components.utils.import("resource://quickfolders/quickfolders-tablistener.jsm");

//QuickFolders.gFolderTree = null;

if (!this.QuickFolders_CC)
	this.QuickFolders_CC = Components.classes;
if (!this.QuickFolders_CI)
	this.QuickFolders_CI = Components.interfaces;
	
// THUNDERBIRD SPECIFIC CODE!!	
// wrap function for session store: persist / restore categories	
let QuickFolders_PrepareSessionStore = function () {
	if (typeof mailTabType != "undefined") {
		if (mailTabType.QuickFolders_SessionStore) return; // avoid multiple modifications.
		mailTabType.QuickFolders_SessionStore = true;
		// overwrite persist 
		let orgPersist = mailTabType.modes["folder"].persistTab; // we might have to use QuickFolders.Util.mailFolderTypeName instead "folder" for SeaMonkey
		mailTabType.modes["folder"].persistTab = function(aTab) {
			let retval = orgPersist(aTab);
			if (retval) {
				retval.QuickFoldersCategory = aTab.QuickFoldersCategory; // add category from the tab to persisted info object
			}
			return retval; 
		}
		// overwrite restoreTab
		let orgRestore = mailTabType.modes["folder"].restoreTab; // we might have to use QuickFolders.Util.mailFolderTypeName instead "folder" for SeaMonkey
		mailTabType.modes["folder"].restoreTab = function(aTabmail, aPersistedState) {
			orgRestore(aTabmail, aPersistedState);
			let rdf = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService),
			    folder = rdf.GetResource(aPersistedState.folderURI).QueryInterface(Components.interfaces.nsIMsgFolder);
			if (folder && aPersistedState.QuickFoldersCategory) {
        let tabInfo, theUri;
			  // Thunderbird only code, so it is fine to use tabInfo here:
				for (let i = 0; i < aTabmail.tabInfo.length; i++)
				{
					tabInfo = aTabmail.tabInfo[i];
					if (tabInfo && tabInfo.folderDisplay) {
						theUri = tabInfo.folderDisplay.view.displayedFolder.URI;
						if (theUri == aPersistedState.folderURI) {
							tabInfo.QuickFoldersCategory = aPersistedState.QuickFoldersCategory;
							return;
						}
					}
				}
			}
		}
	}
};
QuickFolders_PrepareSessionStore(); // Tb only!

var QuickFolders_globalHidePopupId="";
var QuickFolders_globalLastChildPopup=null;
var QuickFolders_globalWin=Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator)
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
	_folderTree: null,
	get mailFolderTree() {
	  // replaces TB2 only helper method GetFolderTree()
		if (!this._folderTree)
		  this._folderTree = QuickFolders.Util.$("folderTree");
		return this._folderTree;
	},
	// keyListen: EventListener,
	loadListen: false,
  folderPaneListen: false,
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
  quickMoveUris: [],      // message Uris of mails lined up for move (quickMove)
  quickMoveOrigins: [],   // source folder array

	// helper function to do init from options dialog!
	initDocAndWindow: function initDocAndWindow(win) {
    let util = QuickFolders.Util,
		    mainWindow;
    if (win && win.document && win.document.documentURI.indexOf('/messenger.xul')>0)
      mainWindow = win;
    else if (win && win.document.documentURI.indexOf('/messageWindow.xul')>0)
      mainWindow = win; // allow passing in single message window also
    else {
      if (win || (!win && window.documentURI.indexOf('/messageWindow.xul')==-1))
        mainWindow = util.getMail3PaneWindow();
    }

		if (mainWindow) {
			QuickFolders.doc = mainWindow.document;
			QuickFolders.win = mainWindow;
		}
		else {
			QuickFolders.doc = document;
			QuickFolders.win = window;
		}
		QuickFolders_globalWin=QuickFolders.win;
		QuickFolders_globalDoc=QuickFolders.doc;

		util.logDebug ("initDocAndWindow\nQuickFolders.doc = " + QuickFolders.doc.location + "\nthis.doc = " + this.doc.location);
	},

	initDelayed: function initDelayed(win) {
	  if (this.initDone) return;
	  let sWinLocation,
        prefs = QuickFolders.Preferences,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface,
	      nDelay = prefs.getIntPref('initDelay');
	  QuickFolders.initDocAndWindow(win);
	  util.VersionProxy(); // initialize the version number using the AddonManager
	  nDelay = nDelay? nDelay: 750;
	  sWinLocation = new String(window.location);

    if (QuickFolders.isCorrectWindow()) {
			util.logDebug ("initDelayed ==== correct window: " + sWinLocation + " - " + document.title + "\nwait " + nDelay + " msec until init()...");
			// document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
			// var thefunc='QuickFolders.init()';
			// setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
			setTimeout(function() { QuickFolders.init(); }, nDelay);
      let folderTree = QuickFolders.mailFolderTree;
      // add an onSelect event!
      folderTree.addEventListener("select", QuickFolders.FolderTreeSelect, false);
			this.initDone=true;
		}
		else {
		  try {
        let doc = document; // in case a stand alone window is opened (e..g double clicking an eml file)
        QI.Toolbar.style.display = 'none';
        // doc.getElementById('QuickFolders-Toolbar').style.display = 'none';

        let wt = doc.getElementById('messengerWindow').getAttribute('windowtype');

        util.logDebug ("DIFFERENT window type(messengerWindow): "
            + wt
            + "\ndocument.title: " + doc.title )
        /**** SINGLE MESSAGE WINDOWS ****/
        if (wt === 'mail:messageWindow') {
          util.logDebug('Calling displayNavigationToolbar()');
          QuickFolders.Interface.displayNavigationToolbar(prefs.isShowCurrentFolderToolbar('messageWindow'), 'messageWindow');
          // set current folder tab label
          if (window.arguments) {
            let fld;
            if (util.Application=='Thunderbird') {
              // from messageWindow.js actuallyLoadMessage()
              if (window.arguments[0] instanceof Components.interfaces.nsIMsgDBHdr) {
                let msgHdr= window.arguments[0];
                fld = msgHdr.folder;
              }
            }
            else {
              // This appears to work for Sm + Postbox alike
              if (window.arguments.length>=3)
                fld = window.arguments[2].viewFolder;
            }
            let cF = QuickFolders.Interface.CurrentFolderTab;
            // force loading main stylesheet (for single message window)
            QI.ensureStyleSheetLoaded('quickfolders-layout.css', 'QuickFolderStyles');
            if (fld)
              QI.initCurrentFolderTab(cF, fld);
            QI.updateUserStyles();
          }


        }
        else {
          util.logDebug('window type : ' + wt);
        }
		  }
		  catch(e) { 
        if (prefs.isDebug)
          util.logException('QuickFolders.initDelayed()', e) ;
      }  //-- always thrown when options dialog is up!
		}
	} ,

	isCorrectWindow: function isCorrectWindow() {
		try {
			return document.getElementById('messengerWindow').getAttribute('windowtype') === "mail:3pane";
		}
		catch(e) { return false; }
	} ,

	init: function init() {
		// document.addEventListener("SSTabRestored", QuickFolders.TabListener.restore, false); // use Session store to restore categories!
		let that = this.isQuickFolders ? this : QuickFolders,
		    myver = that.Util.Version, // will start VersionProxy
		    ApVer, ApName,
        prefs = that.Preferences; 
    try{ ApVer=that.Util.ApplicationVersion} catch(e){ApVer="?"};
    try{ ApName=that.Util.Application} catch(e){ApName="?"};

		if (prefs && prefs.isDebug)
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
		if (prefs.isUseKeyboardShortcuts || prefs.isUseRebuildShortcut || prefs.isUseNavigateShortcuts) {
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
		let folderEntries = prefs.loadFolderEntries();

		if (folderEntries.length) {
			that.Model.selectedFolders = folderEntries;
			that.Interface.updateUserStyles();

			let lastSelectedCategory = prefs.LastSelectedCategory;
			that.Util.logDebug("last selected Category:" + lastSelectedCategory );

			if(that.Model.isValidCategory(lastSelectedCategory))
			  that.Interface.selectCategory(lastSelectedCategory, true);
			  
			QuickFolders.Interface.updateMainWindow();  // selectCategory already called updateFolders!  was that.Interface.updateFolders(true,false)
		}
		// only load in main window(?)
		if (QuickFolders.FolderTree)
			QuickFolders.FolderTree.init();

		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

		observerService.addObserver({
			observe: function() {
				QuickFolders.Interface.updateFolders(true, false);
				QuickFolders.Interface.updateUserStyles();
			}
		},"quickfolders-options-saved", false);
		// QuickFolders.Util.FirstRun.init();

		that.Util.logDebug("call displayNavigationToolbar.");
		// remember whether toolbar was shown, and make invisible or initialize if necessary
    // default to folder view
		that.Interface.displayNavigationToolbar(prefs.isShowCurrentFolderToolbar(), ''); 
		// single Message
		that.Interface.displayNavigationToolbar(prefs.isShowCurrentFolderToolbar('messageWindow'), 'messageWindow');

		// new function to automatically main toolbar when it is not needed
		that.Util.logDebug("call initToolbarHiding.");
		that.Interface.initToolbarHiding();
		that.Util.logDebug("QF.init() ends.");
		// now make it visible!
		QuickFolders.Interface.Toolbar.style.display = '-moz-inline-box';
		// this.doc.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
		
		if (QuickFolders.Preferences.getBoolPref('contextMenu.hideFilterMode')) {
			if (QuickFolders.Interface.FilterToggleButton)
				QuickFolders.Interface.FilterToggleButton.collapsed=true;
		}
    QuickFolders.addFolderPaneListener();
    
    // Reading list
    if (QuickFolders.bookmarks) {
      QuickFolders.bookmarks.load();
    }
	} ,

	sayHello: function sayHello() {
		QuickFolders.Util.alert("Hello from QuickFolders");
	} ,

	// handler for dropping folder shortcuts
	toolbarDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),

		getSupportedFlavours : function () {
			let flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			flavours.appendFlavour("text/x-moz-newsfolder");
			flavours.appendFlavour("text/unicode"); // buttons
			flavours.appendFlavour("text/currentfolder"); // custom flavour for dragging current
			return flavours;
		},

		onDragEnter: function onDragEnter(evt,flavour,session){
			evt.preventDefault();
			return false;
		},

		onDragOver: function onDragOver(evt,flavour,session){
			if (flavour.contentType=="text/x-moz-folder" || flavour.contentType=="text/unicode" || flavour.contentType=="text/x-moz-newsfolder" || flavour.contentType=="text/currentfolder") // only allow folders or  buttons!
				session.canDrop = true;
			else {
				QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDragover - can not drop " + flavour.contentType);
				session.canDrop = false;
			}
		},

		onDrop: function onDrop(evt,dropData,dragSession) {
 			function addFolder(src) {
					if(src) {
						let cat = QuickFolders.Interface.CurrentlySelectedCategoryName;
						if (QuickFolders.Model.addFolder(src, cat)) {
							let s = "Added shortcut " + src + " to QuickFolders"
							if (cat !== null) s = s + " Category " + cat;
							try{ QuickFolders.Util.showStatusMessage(s); } catch (e) {};
						}
					}
			};

			QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDrop " + dropData.flavour.contentType);
			let msgFolder, sourceUri;

			switch (dropData.flavour.contentType) {
				case "text/x-moz-folder":
				case "text/x-moz-newsfolder":
					if (evt.dataTransfer && evt.dataTransfer.mozGetDataAt) { 
            let count = evt.dataTransfer.mozItemCount ? evt.dataTransfer.mozItemCount : 1;
            for (let i=0; i<count; i++) { // allow multiple folder drops...
              msgFolder = evt.dataTransfer.mozGetDataAt(dropData.flavour.contentType, i);
              if (msgFolder.QueryInterface)
                sourceUri = msgFolder.QueryInterface(Components.interfaces.nsIMsgFolder).URI;
              else
                sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dropData, dragSession); // Postbox
              addFolder(sourceUri);
            }
					}
					else {
						sourceUri = QuickFolders.Util.getFolderUriFromDropData(evt, dropData, dragSession); // older gecko versions.
            addFolder(sourceUri);
					}

					break;
				case "text/currentfolder":
					sourceUri = dropData.data;
					addFolder(sourceUri);
					break;
				case "text/unicode":  // plain text: button was moved OR: a menuitem was dropped!!
					sourceUri = dropData.data;
					let eType = dragSession.dataTransfer.mozSourceNode.tagName,
					    myDragPos,
					    target = evt.currentTarget;
					if (evt.pageX<120) // should find this out by checking whether "Quickfolders" label is hit
						myDragPos="LeftMost"
					else
						myDragPos="RightMost"
					if (eType === "menuitem" || eType === "menu") {
						addFolder(sourceUri);
					}
					else {
						if (!QuickFolders.ChangeOrder.insertAtPosition(sourceUri, "", myDragPos)) {
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

		getSupportedFlavours : function menuObs_getSupportedFlavours() {
			let flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message");
			flavours.appendFlavour("text/unicode");  // test
			
			// MOVE FOLDER SUPPORT
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			return flavours;
		},
		dragOverTimer: null,
		onDragEnter: function menuObs_onDragEnter(evt, dragSession) {
			let popupStart = evt.target;
			QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.onDragEnter " + popupStart.nodeName + " - " + popupStart.getAttribute('label'));
			try {
				evt.preventDefault(); // fix layout issues in TB3 + Postbox!

				let pchild = popupStart.firstChild;
				if (pchild) {
					if (pchild.nodeName === 'menupopup') {
						// hide all sibling popup menus
						let psib = popupStart.nextSibling;
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
		onDragExit: function menuObs_onDragExit(evt, dragSession) {
			let popupStart = evt.target;
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

		onDragOver: function menuObs_onDragOver(evt, flavor, session){
			session.canDrop = (flavor.contentType === "text/x-moz-message");
			if (null !== QuickFolders_globalLastChildPopup) {
				/*QuickFolders_globalLastChildPopup.firstChild.hidePopup();*/
				QuickFolders_globalLastChildPopup=null;
			}
		},

		// drop mails on popup: move mail, like in buttondragobserver
		onDrop: function menuObs_onDrop(evt, dropData, dragSession) {
			let isThread = evt.isThread,
			    isCopy = (QuickFolders.popupDragObserver.dragAction === Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY),
			    menuItem = evt.target,
          messageUriList = QuickFolders.popupDragObserver.newFolderMsgUris,
          util = QuickFolders.Util;
			// helper function for creating a new subfolder => TODO implement filter learn for this case!
			function newFolderCallback(aName, FolderParam) {
				let step = '',
				    isManyFolders = false,
				    sourceFolder = null;
				if (aName) try {
					let currentURI, aFolder;
					// we're dragging, so we are interested in the folder currently displayed in the threads pane
					if (util.Application=='Postbox') {
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

          let deferredMove = function deferredMove(parentFolder) {
            let newFolder;

            // if folder creation is successful, we can continue with calling the
            // other drop handler that takes care of dropping the messages!
            step='2. find new sub folder';
            util.logDebugOptional("dragToNew", step);
            if (util.Application=='Postbox') {
              newFolder = QuickFolders.Model.getMsgFolderFromUri(parentFolder.URI + "/" + aName, true).QueryInterface(Components.interfaces.nsIMsgFolder);
            }
            else {
              newFolder = parentFolder.findSubFolder(aName); 
            }
            if (!newFolder) {
              QuickFolders.DeferredMoveCount = QuickFolders.DeferredMoveCount ? (QuickFolders.DeferredMoveCount+1) : 1;
              if (QuickFolders.DeferredMoveCount<10) {  // async retry
                setTimeout( deferredMove(parentFolder), 200);
              }
              else { // we give up
                QuickFolders.DeferredMoveCount = 0;
              }
              return;
            }
            menuItem.folder = newFolder;

            step='3. ' + (isCopy ? 'copy' : 'move') + ' messages: ' + newFolder.URI + ' thread:' + isThread;
            util.logDebugOptional("dragToNew", step);
            
            if (QuickFolders.FilterWorker.FilterMode) {
              sourceFolder = QuickFolders.Model.getMsgFolderFromUri(currentURI, true);
              let virtual = util.isVirtual(sourceFolder);
              if (!sourceFolder || virtual)
              {
                let msgHdr = messenger.msgHdrFromURI(QuickFolders.popupDragObserver.newFolderMsgUris[0].toString());
                sourceFolder = msgHdr.folder;
              }
            }
            let msgList = util.moveMessages(newFolder, messageUriList, isCopy)

            // have the filter created with a delay so that filters can adapt to the new folder!!
            if (QuickFolders.FilterWorker.FilterMode) {
              // if user has quickFilters installed, use that instead!!
              QuickFolders.FilterWorker.createFilterAsync(sourceFolder, newFolder, msgList, isCopy, true);
            }

            util.logDebugOptional("dragToNew", "4. updateFolders...");
            QuickFolders.Interface.updateFolders(false, false); // update context menus            
          }
          
					step='1. create sub folder: ' + aName;
					util.logDebugOptional("dragToNew", step);
					aFolder.createSubfolder(aName, msgWindow);
          
          /* a workaround against the 'jumping back to source folder' of messages on synchronized servers */
          let server = aFolder.server.QueryInterface(Components.interfaces.nsIMsgIncomingServer),
              timeOut = (server.type == 'imap') ? 
                        QuickFolders.Preferences.getIntPref('dragToCreateFolder.imap.delay') : 0;
          
          setTimeout( function() {
            deferredMove(aFolder);
          }, timeOut);
					return true;

				}
				catch(ex) {
					util.alert("Exception in newFolderCallback, step [" + step + "]: " + ex);
				}
				return false;
			}

			try {
				util.logDebugOptional("dnd","popupDragObserver.onDrop " + dropData.flavour.contentType);
				util.logDebugOptional("dnd","target's parent folder: " + menuItem.folder.URI);
				let targetFolder = menuItem.folder.QueryInterface(Components.interfaces.nsIMsgFolder);

				if (!targetFolder.canCreateSubfolders) {
					util.alert("You can not create a subfolder in " + targetFolder.prettiestName);
					return false;
				}

				let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
				trans.addDataFlavor("text/x-moz-message");

				// let's store the Msg URIs from drag session before we do anything else!!
				QuickFolders.popupDragObserver.dragAction = dragSession.dragAction; // remember copy or move?
				// reset in case there is already data there; only move mails of the last dnd operation!
				while (QuickFolders.popupDragObserver.newFolderMsgUris.length)
					QuickFolders.popupDragObserver.newFolderMsgUris.pop();
				for (let i = 0; i < dragSession.numDropItems; i++) {
					dragSession.getData (trans, i);
					let dataObj = new Object(),
					    flavor = new Object(),
					    len = new Object();
					try {
						trans.getAnyTransferData(flavor, dataObj, len);

						if ((flavor.value === "text/x-moz-message") && dataObj) {
							dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
							let messageUri = dataObj.data.substring(0, len.value);
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

				let dualUseFolders = true;
				if (targetFolder.server instanceof Components.interfaces.nsIImapIncomingServer)
					dualUseFolders = targetFolder.server.dualUseFolders;

				util.logDebugOptional("window.openDialog (newFolderDialog.xul)\n"
					+ "folder/preselectedURI:" + targetFolder + " (URI: " + targetFolder.URI + ")\n"
					+ "dualUseFolders:" + dualUseFolders);
				if (util.Application=='Postbox') {
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
		getSupportedFlavours : function msgObs_getSupportedFlavours() {
			let flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message"); // emails only (find out whether a thread is covered by this)
			return flavours;
		},

		onDragStart: function msgObs_onDragStart(event, transferData, action) {
			let button = event.target;
			transferData.data = new TransferData();

			// check event.originalTarget and event.target
			QuickFolders.Util.threadPaneOnDragStart(event);
		}
	},

	buttonDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),
		getSupportedFlavours : function btnObs_onDragStart() {
			let flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message"); // emails
			flavours.appendFlavour("text/unicode");  // tabs
			// MOVE FOLDER SUPPORT
			flavours.appendFlavour("text/x-moz-folder"); // folder tree items
			return flavours;
		},

		dragOverTimer: null,

		onDragEnter: function btnObs_onDragEnter(evt, dragSession) {
			function removeLastPopup(p, theDoc) {
				if (!p) return;
				let popup = theDoc.getElementById(p),
            util = QuickFolders.Util;
				if (popup) {
					try {
						if (util.Application === 'SeaMonkey')
							popup.parentNode.removeChild(popup);
						else
							popup.hidePopup(); // parentNode.removeChild(popup)
						util.logDebugOptional("dnd", "removed popup:" + p );
					}
					catch (e) {
						util.logDebugOptional("dnd", "removing popup:  [" + p.toString() + "]  failed!\n" + e + "\n");
					}
				}
				else
					util.logDebugOptional("dnd", "removeLastPopup could not find element: " + p);
				if (p === QuickFolders_globalHidePopupId)
					QuickFolders_globalHidePopupId = '';
				
			}

      let util = QuickFolders.Util;
			try {
				if (null==dragSession.sourceNode) {
					util.logDebugOptional("dnd", "UNEXPECTED ERROR QuickFolders.OnDragEnter - empty sourceNode!");
					return;
				}
				// add a function to MOVE folders (using the treechildren sourceNode + modifier key SHIFT)
				let isAlt = evt.altKey,
				    isCtrl = evt.ctrlKey,
				    isShift = evt.shiftKey;
				util.logDebugOptional("dnd","buttonDragObserver.onDragEnter - sourceNode = " + dragSession.sourceNode.nodeName + "\n"
					+ "  ALT = " + isAlt 
					+ "  CTRL = " + isCtrl 
					+ "  SHIFT = " + isShift);
				if (dragSession.sourceNode.nodeName === 'toolbarpaletteitem') {
					util.logDebug("trying to drag a toolbar palette item - not allowed.");
					dragSession.canDrop=false;
					return;
				}
				let button = evt.target;
				// somehow, this creates a duplication in linux
				// delete previous drag folders popup!
        if (button.id && button.id =="QuickFolders-quickMove") {
          util.logDebug("DragEnter - quickMove button");
          if (dragSession.isDataFlavorSupported("text/x-moz-message")) {
            dragSession.canDrop=true;
            removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
          }
          else {
            dragSession.canDrop=false;
          }
          if (QuickFolders.Preferences.isShowRecentTab)
            removeLastPopup('moveTo_QuickFolders-folder-popup-Recent', this.doc);
          return;
        }
        // Reading List
        if (button.id && button.id =="QuickFolders-readingList") {
          util.logDebug("DragEnter - reading list button");
          if (dragSession.isDataFlavorSupported("text/x-moz-message")) {
            dragSession.canDrop=true;
            removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
          }
          else {
            dragSession.canDrop=false;
          }
          return;
        }

				if(button.tagName === "toolbarbutton") {
          // new quickMove
					// highlight drop target
					if (dragSession.numDropItems==1) {
						if (dragSession.isDataFlavorSupported("text/unicode" )) {
              // show reordering target position!
              // right or left of current button! (try styling button with > OR < to show on which side the drop will happen)
              let node = dragSession.sourceNode;

              // find out whether drop target button is right or left from source button:
              if (node.hasAttributes()) {
                let sDirection,
                    box = node.boxObject;
                if (box) {
                  let dx = (box.x - button.boxObject.x);
                  if (dx !== 0) {
                    sDirection=(dx>0 ? "dragLEFT" : "dragRIGHT")
                    button.className += (" " + sDirection); // add style for drop arrow (remove onDragExit)
                  }
                }
							}
						}
					}

					//show context menu if dragged over a button which has subfolders
					let targetFolder = button.folder || null,
					    otherPopups = QuickFolders.Interface.menuPopupsByOffset;
					for (let i = 0; i < otherPopups.length; i++) {
						if (otherPopups[i].folder) {
							if (otherPopups[i].folder !== targetFolder && otherPopups[i].hidePopup)
								otherPopups[i].hidePopup();
						}
						else if (targetFolder) { // there is a targetfolder but the other popup doesn't have one (special tab!).
							if (otherPopups[i].hidePopup)
								otherPopups[i].hidePopup();
							else
								util.logDebug("otherPopups[" + i + "] (" + otherPopups[i].id + ") does not have a hidePopup method!");
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
							util.logDebugOptional("recentFolders", "creating popupset for " + targetFolder.name );

						// instead of using the full popup menu (containing the 3 top commands)
						// try to create droptarget menu that only contains the target subfolders "on the fly"
						// haven't found a way to tidy these up, yet (should be done in onDragExit?)
						// Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
						// no menus necessary for folders without subfolders!
						let popupset = this.doc.createElement('popupset'),
						    menupopup = this.doc.createElement('menupopup'),
						    popupId;
						QuickFolders.Interface.FoldersBox.appendChild(popupset);

						if (targetFolder) {
							popupId = 'moveTo_'+targetFolder.URI;
              let oldMenu = this.doc.getElementById(popupId);
							// excluding TB 2 from "drag to new folder" menu for now
							if (QuickFolders_globalHidePopupId !== popupId || !oldMenu) {
                if (oldMenu) {
                  // remove old menu from DOM
                  oldMenu.parentNode.removeChild(oldMenu);
                }
								menupopup.setAttribute('id', popupId);
								menupopup.className = 'QuickFolders-folder-popup';
								menupopup.folder = targetFolder;
								popupset.appendChild(menupopup);
								removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
								QuickFolders.Interface.addSubFoldersPopup(menupopup, targetFolder, true);
							}
						}
						else { // special folderbutton: recent
              if (button.id == 'QuickFolders-Recent-CurrentFolderTool' || button.id == 'QuickFolders-Recent') {
                popupId = 'moveTo_QuickFolders-folder-popup-Recent';
                if(QuickFolders_globalHidePopupId !== popupId) {
                  menupopup.setAttribute('id', popupId);
                  popupset.appendChild(menupopup);
                  removeLastPopup(QuickFolders_globalHidePopupId, this.doc);
                  QuickFolders.Interface.createRecentTab(menupopup, true, button);
                }
              }
              else {
                if (QuickFolders.Preferences.isShowRecentTab)
                  removeLastPopup('moveTo_QuickFolders-folder-popup-Recent', this.doc);
              }
						}
            if (!popupId)
              return;

						// a bug in showPopup when used with coordinates makes it start from the wrong origin
						//document.getElementById(popupId).showPopup(button, button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
						// AG fixed, 19/11/2008 - showPopup is deprecated in FX3!
						util.logDebugOptional("dnd", "showPopup with id " + popupId );
						let p =  this.doc.getElementById(popupId);
						if (!p) {
              util.logDebug('Document did not return the popup: ' + popupId);
            }
						// avoid showing empty popup
						if (p && p.childNodes && p.childNodes.length) {
						
							// from a certain size, make sure to shift menu to right to allow clicking the tab
							let minRealign = QuickFolders.Preferences.getIntPref("folderMenu.realignMinTabs");
              let isShift = false;
							if (minRealign) {
							  let isDebug = QuickFolders.Preferences.isDebugOption('popupmenus.drag');
								// count top level menu items
								for (let c = 0; c < p.childNodes.length; c++) {
									if (isDebug) {
										util.logDebugOptional("popupmenus.drag", 
											c + ': ' + p.childNodes[c].tagName + ' - ' +  p.childNodes[c].getAttribute('label'));
									}
									if (c > minRealign) {
										isShift = true;
										if (!isDebug) break;
									}
								}
								if (isDebug) {
									util.logDebugOptional("popupmenus.drag", "x align offset = " + xAlign);
								}
							}
						
							this.doc.popupNode = button;
							if (p.openPopup) {
                if (isShift) {
                  p.openPopup(button,'end_before', 0,-1,"context",false);
                }
                else {
                  p.openPopup(button,'after_start', 0,-1,"context",false);
                }
              }
							else
								p.showPopup(button, -1,-1,"context","bottomleft","topleft"); // deprecated
						}

						if (popupId==QuickFolders_globalHidePopupId) QuickFolders_globalHidePopupId=""; // avoid hiding "itself". QuickFolders_globalHidePopupId is not cleared if previous drag cancelled.

					}
					catch(e) { util.logException("Exception creating folder popup: ", e);};
					
				}
				
			}
			catch(ex) {
				util.logException ("EXCEPTION buttonDragObserver.onDragEnter: ", ex);
			}
		} ,

		// deal with old folder popups
		onDragExit: function btnObs_onDragExit(event, dragSession) {
			if (!dragSession.sourceNode) { 
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - session without sourceNode! exiting dragExit handler...");
				if (!dragSession.dataTransfer)
				  event.preventDefault();
				return; 
			}
			try {
				let src = dragSession.sourceNode.nodeName || "unnamed node";
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - sourceNode = " + src);
			} catch(e) { QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - " + e); }
			if (dragSession.sourceNode.nodeName === 'toolbarpaletteitem') {
				QuickFolders.Util.logDebugOptional("dnd", "trying to drag a toolbar palette item - ignored.");
				dragSession.canDrop=false;
				return;
			}
			let button = event.target;
			QuickFolders_globalHidePopupId="";
			if (dragSession.isDataFlavorSupported("text/unicode" )) // drag buttons
			{
				// remove dragdrop marker:
				button.className = button.className.replace(/\s*dragLEFT/,"");
				button.className = button.className.replace(/\s*dragRIGHT/,"");
				return;  // don't remove popup when reordering tabs
			}
			// problem: event also fires when dragging into the menu, so we can not remove it then!
			let targetFolder = button.folder,
			    popupId = 'moveTo_'+targetFolder.URI;

			// this popup needs to be removed if we drag into another button.
			try {
				if (this.doc.getElementById(popupId))
					QuickFolders_globalHidePopupId = popupId; // arm for hiding! GLOBAL VAR!!
			}
			catch(ex) {
				window.dump("Cannot setup for delete: popup \n" + ex);
			}
		} ,

		onDragOver: function btnObs_onDragOver(evt, flavor, session){
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

		onDrop: function btnObs_onDrop(evt,dropData,dragSession) {
			let isShift = evt.shiftKey,
			    debugDragging = false,
			    DropTarget = evt.target,
			    targetFolder = DropTarget.folder,
          util = QuickFolders.Util,
          QI = QuickFolders.Interface;
      try {
        util.logDebugOptional("dnd", "buttonDragObserver.onDrop flavor=" + dropData.flavour.contentType);
      } catch(ex) { util.logDebugOptional("dnd", ex); }
			QuickFolders_globalHidePopupId="";

			switch (dropData.flavour.contentType) {
				case  "text/x-moz-folder": // not supported! You can not drop a folder from foldertree on a tab!
					if (!isShift) {
						let sPrompt = util.getBundleString("qfMoveFolderOrNewTab", 
								"Please drag new folders to an empty area of the toolbar! If you want to MOVE the folder, please hold down SHIFT while dragging.");
						util.alert(sPrompt);
						break;
					}
					// handler for dropping folders
					try {
						let sourceFolder = util.getFolderFromDropData(evt, dropData, dragSession);
						QI.moveFolder(sourceFolder, targetFolder);
					}
					catch(e) {QuickFolders.LocalErrorLogger("Exception in QuickFolders.onDrop:" + e); };
					break;
				case  "text/x-moz-message":
					let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable),
					    messageUris = [],
					    sourceFolder = null,
					    lastAction = "iterate dragSession";
          //alert('trans.addDataFlavor: trans=' + trans + '\n numDropItems=' + dragSession.numDropItems);
					trans.addDataFlavor("text/x-moz-message");

					for (let i = 0; i < dragSession.numDropItems; i++) {
						//alert('dragSession.getData ... '+(i+1));
						dragSession.getData (trans, i);
						let dataObj = new Object(),
						    flavor = new Object(),
						    len = new Object();
						if (debugDragging ) util.alert('trans.getAnyTransferData ... '+(i+1));
						try {
							trans.getAnyTransferData(flavor, dataObj, len);

							if (flavor.value === "text/x-moz-message" && dataObj) {

								dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
								if (debugDragging ) util.alert('getting data from dataObj...');
								let messageUri = dataObj.data.substring(0, len.value);

								if (debugDragging ) util.alert('messageUris.push: messageUri=' + messageUri) ;
								messageUris.push(messageUri);
							}
						}
						catch (e) {
							QuickFolders.LocalErrorLogger("Exception in onDrop item " + i + " of " + dragSession.numDropItems + "\nException: " + e);
						}
					}
          
          lastAction = "Try to get sourceFolder";
          // note: get CurrentFolder fails when we are in a search results window!!
          // [Bug 25204] => fixed in 3.10
          sourceFolder = util.CurrentFolder;
          let virtual = util.isVirtual(sourceFolder);
          if (!sourceFolder || virtual)
          {
            let msgHdr = messenger.msgHdrFromURI(messageUris[0].toString());
            sourceFolder = msgHdr.folder;
          }
          
					// handler for dropping messages
					lastAction = "drop handler";
          
          // quickMove menu
          if (DropTarget.id && DropTarget.id =="QuickFolders-quickMove") {
            util.logDebugOptional("dnd", "onDrop: quickMove button - added " + messageUris.length + " message URIs");
            // copy message list into "holding area"
            while (messageUris.length) {
              let newUri = messageUris.pop();
              QuickFolders.quickMove.add(newUri, sourceFolder);
            }
            QuickFolders.quickMove.update();
            return;
          }
          
          // reading List menu
          if (DropTarget.id && DropTarget.id =="QuickFolders-readingList") {
            util.logDebugOptional("dnd", "onDrop: readingList button - added " + messageUris.length + " message URIs");
            // copy message list 
            while (messageUris.length) {
              let newUri = messageUris.pop();
              QuickFolders.bookmarks.addMail(newUri, sourceFolder);
            }
            QuickFolders.bookmarks.update();
            QuickFolders.bookmarks.save(); // only 1 save is more efficient.
            
            return;
          }
          
					try {
						util.logDebugOptional("dnd", "onDrop: " + messageUris.length + " messageUris to " + targetFolder.URI);
						if(messageUris.length > 0) {
							
							lastAction = "moveMessages";
							let msgList = util.moveMessages(
								targetFolder,
								messageUris,
								dragSession.dragAction === Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY
							);
							if (QuickFolders.FilterWorker.FilterMode) {
                lastAction = "createFilterAsync(" + sourceFolder.prettyName + ", " + targetFolder.prettyName + ", " + (msgList ? msgList[0] : "no Messages returned!") + ")";
                QuickFolders.FilterWorker.createFilterAsync(sourceFolder, targetFolder, msgList, false);
							}
						}

					}
					catch(e) {QuickFolders.LocalErrorLogger("Exception in onDrop -" + lastAction + "... " + e); };
					// close any top level menu items after message drop!

					//hide popup's menus!
					util.logDebug ("buttonDragObserver.onDrop DropTarget = " + DropTarget.tagName + 
            + (DropTarget.id ? '[' + DropTarget.id + ']' : '')
            + '  Target Folder:' + targetFolder.name );

					QI.collapseParentMenus(DropTarget);

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
		onDragStart: function btnObs_onDragStart(event, transferData, action) {
			let button = event.target;
			if(!button.folder)
				 return;
			transferData.data = new TransferData();
			// if current folder button is started to drag, use a different flavor
			if (button.id && button.id === "QuickFoldersCurrentFolder")
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
	addTabMailListener: function addTabMailListener() {
		
	},
	
	addLoadEventListener: function addLoadEventListener() {
		// avoid registering this event listener twice!
		if (!this.loadListen) {
			window.addEventListener("load", function() { QuickFolders.initDelayed(window); }, true);
		}
		this.loadListen=true;
	},
  
  addFolderPaneListener: function addFolderPaneListener() {
    if (!this.folderPaneListen) {
      let menu = document.getElementById('folderPaneContext');
      if (menu) {
        menu.addEventListener("popupshowing", QuickFolders.Interface.folderPanePopup, false);
      }
    }
    this.folderPaneListen= true;
  },

	addTabEventListener: function addTabEventListener() {
		try {
		  let tabContainer = QuickFolders.tabContainer;
			tabContainer.addEventListener("select", function(event) { QuickFolders.TabListener.select(event); }, false);
			let tabmail = document.getElementById("tabmail");
			tabmail.addEventListener("TabClose", function(event) { QuickFolders.TabListener.closeTab(event); }, false);
			tabmail.addEventListener("TabOpen", function(event) { QuickFolders.TabListener.newTab(event); }, false);
			tabmail.addEventListener("TabMove", function(event) { QuickFolders.TabListener.moveTab(event); }, false);
		}
		catch (e) {
			QuickFolders.LocalErrorLogger("No tabContainer available! " + e);
			QuickFolders._tabContainer = null;
		}
	}
};

function QuickFolders_MyEnsureFolderIndex(tree, msgFolder) {
	// try to get the index of the folder in the tree
	try {
		let index ;

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

		QuickFolders.Util.logDebugOptional ("folders.select", "QuickFolders_MyEnsureFolderIndex - index of " + msgFolder.name + ": " + index);

		if (index === -1) {
			if (null==msgFolder.parent)
				return -1;
			let parentIndex = QuickFolders_MyEnsureFolderIndex(tree, msgFolder.parent);

			// if we couldn't find the folder, open the parent
			if (parentIndex !== -1 && !tree.builderView.isContainerOpen(parentIndex)) {
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

function QuickFolders_MyChangeSelection(tree, newIndex) {
  if(newIndex >= 0)
  {
		QuickFolders.Util.logDebugOptional("folders.select", "ChangeSelection of folder tree.index " + tree.currentIndex + " to " + newIndex);
		tree.view.selection.select(newIndex);
		tree.treeBoxObject.ensureRowIsVisible(newIndex);
  }
}

// the core function for selecting a folder
// adding re-use of mail tabs if the folder is open in another mail tab, switch to that one!
function QuickFolders_MySelectFolder(folderUri, highlightTabFirst) {
	function getTabURI(info) {
	  // note: tabmail is declared further down - it is in scope.
		if (!info)
			return null;
		if (info.msgSelectedFolder)
			return info.msgSelectedFolder.URI; // SM
		if (    info.folderDisplay
		     && info.folderDisplay.view
		     && info.folderDisplay.view.displayedFolder
		     && info.folderDisplay.view.displayedFolder.URI
		   )
		   return info.folderDisplay.view.displayedFolder.URI; //Tb
		if (info.type 
		    && info.type == 'folder' 
		    && info._folderURI)
				return info._folderURI;  // Postbox
		return '';
	}
	let util = QuickFolders.Util;
  //during QuickFolders_MySelectFolder, disable the listener for tabmail "select"
	util.logDebugOptional("folders.select", "QuickFolders_MySelectFolder: " + folderUri);
	// QuickFolders.tabSelectEnable=false;

	let folderTree = QuickFolders.mailFolderTree;
	let rdf = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
	let folderResource = rdf.GetResource(folderUri);
	let msgFolder;
	let isInvalid = false;
	try {
	  // msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
	  msgFolder = QuickFolders.Model.getMsgFolderFromUri(folderUri, true);  
		if (QuickFolders.Preferences.getBoolPref("autoValidateFolders")) {
		  isInvalid = (!util.doesMailFolderExist(msgFolder));
		}
	}
	catch (ex) {
	  util.logException("Exception validating folder: ", ex);
	  isInvalid = true;
	}
	
	if (isInvalid) {
	  // invalid folder; suggest to correct this!
    util.logDebugOptional("folders.select","detected invalid folder, trying to correct entry table.");
		let folderEntry = QuickFolders.Model.getFolderEntry(folderUri);
		if (folderEntry) {
			switch(QuickFolders.Interface.deleteFolderPrompt(folderEntry, false)) {
			  case 1: // delete 
				  // save changes right away!
					QuickFolders.Preferences.storeFolderEntries(QuickFolders.Model.selectedFolders);
				  break;
				case 0: // don't delete
				  break;
			};
		}
	  return false;
	}
	let folderIndex, i;

	QuickFolders.currentURI = folderUri;
	
	let isExistFolderInTab = false;
	let tabmail = document.getElementById("tabmail");
	if (tabmail) {
    util.logDebugOptional("folders.select","try to find open tab with folder...");
	  let len = util.getTabInfoLength(tabmail);
		for (i = 0; i < len; i++) {
		  let info = util.getTabInfoByIndex(tabmail, i);
			let tabURI = getTabURI(info);
			if (!tabURI)
				continue; 
			// SM seems to have "false" tabs (without any info in them) we are not interested in them
			if (  folderUri === tabURI
			   && util.getTabMode(info) == util.mailFolderTypeName // SM folders only, no single msg.
			   && i !== QuickFolders.tabContainer.selectedIndex)
			{
        util.logDebugOptional("folders.select","matched folder to open tab, switching to tab " + i);
        // strangely switching to tab 0 causes an unnecessary updateFolders call
				if (tabmail.switchToTab)
					tabmail.switchToTab(i); // switch to first tab with this URI
				else {
					QuickFolders.tabContainer.selectedIndex = i;
				}
				isExistFolderInTab = true;
				break;
			}
		}
    util.logDebugOptional("folders.select", isExistFolderInTab ? "...found folder in existing mail Tab." : "...folder is currently not open in any Tab.");
	}

	// new behavior: OPEN NEW TAB
	// if single message is shown, open folder in a new Tab...
	if (QuickFolders.Interface.CurrentTabMode == 'message' || QuickFolders.Interface.CurrentTabMode =='glodaList') {
	  if (!isExistFolderInTab) {
		  if (QuickFolders.Preferences.getBoolPref('behavior.nonFolderView.openNewTab')) {
        util.logDebugOptional("folders.select", "calling openFolderInNewTab()");
				QuickFolders.Interface.openFolderInNewTab(msgFolder);
			}
			else {  // switch to first tab
        util.logDebugOptional("folders.select", "tab is not selected, openNewTab disabled, switching to tab 0");
			  tabmail.switchToTab(0);
			}
		}
		else
	    return true; // avoid closing the single message
	}

	let Flags = util.FolderFlags,
      theTreeView;

	if (util.Application=='Thunderbird') {
		// TB 3
		// find out if parent folder is smart and collapsed (bug in TB3!)
		// in this case getIndexOfFolder returns a faulty index (the parent node of the inbox = the mailbox account folder itself)
		// therefore, ensureRowIsVisible does not work!
    let isSelected = false,
        forceSelect = QuickFolders.Preferences.isChangeFolderTreeViewEnabled;
		theTreeView = gFolderTreeView;
		QuickFolders.lastTreeViewMode = theTreeView.mode; // backup of view mode. (TB3)

		folderIndex = theTreeView.getIndexOfFolder(msgFolder);
		if (null == folderIndex) {
      util.logDebugOptional("folders.select","theTreeView.selectFolder(" + msgFolder.prettyName + ", " + forceSelect + ")");
			isSelected = theTreeView.selectFolder(msgFolder, forceSelect); // forceSelect
			folderIndex = theTreeView.getIndexOfFolder(msgFolder);
		}
    util.logDebugOptional("folders.select","folderIndex = " + folderIndex);
		
		if (msgFolder.parent) {
      util.logDebugOptional("folders.select","ensureFolderViewTab()");
			util.ensureFolderViewTab(); // let's always do this when a folder is clicked!

			if (null==folderIndex) {
        util.logDebugOptional("folders.select","ensureNormalFolderView()");
				util.ensureNormalFolderView();
				folderIndex = theTreeView.getIndexOfFolder(msgFolder);
        util.logDebugOptional("folders.select","folderIndex = " + folderIndex);
			}

			let parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
      util.logDebugOptional("folders.select","parent index: " + parentIndex);
			// flags from: mozilla 1.8.0 / mailnews/ base/ public/ nsMsgFolderFlags.h
			let specialFlags = Flags.MSG_FOLDER_FLAG_INBOX + Flags.MSG_FOLDER_FLAG_QUEUE + Flags.MSG_FOLDER_FLAG_SENTMAIL 
                       + Flags.MSG_FOLDER_FLAG_TRASH + Flags.MSG_FOLDER_FLAG_DRAFTS + Flags.MSG_FOLDER_FLAG_TEMPLATES 
                       + Flags.MSG_FOLDER_FLAG_JUNK ;
			if (msgFolder.flags & specialFlags) {
				// is this folder a smartfolder?
				if (folderUri.indexOf("nobody@smart")>0 && null==parentIndex && theTreeView.mode !== "smart") {
          util.logDebugOptional("folders.select","smart folder detected, switching treeview mode...");
					// toggle to smartfolder view and reinitalize folder variable!
					theTreeView.mode="smart"; // after changing the view, we need to get a new parent!!
					let rdf = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
					folderResource = rdf.GetResource(folderUri);
					msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
					parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
				}

				// a special folder, its parent is a smart folder?
				if (msgFolder.parent.flags & Flags.MSG_FOLDER_FLAG_SMART || "smart" === theTreeView.mode) {
					if (null === folderIndex || parentIndex > folderIndex) {
						// if the parent appears AFTER the folder, then the "real" parent is a smart folder.
						let smartIndex=0;
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
					  util.logDebugOptional("folders.select", "Can not make visible: " + msgFolder.URI + " - not in current folder view?");
					}
				}
			}
		}

		if (folderIndex != null) {
      try {
        util.logDebugOptional("folders.select","Selecting folder via treeview.select(" + msgFolder.prettyName + ")..");
        theTreeView.selectFolder (msgFolder);
        util.logDebugOptional("folders.select","ensureRowIsVisible()..");
        theTreeView._treeElement.treeBoxObject.ensureRowIsVisible(folderIndex);
      }
      catch(e) { util.logException("Exception selecting via treeview: ", e);};
		}

		// reset the view mode.
		if (!QuickFolders.Preferences.isChangeFolderTreeViewEnabled) {
      
			if (QuickFolders.lastTreeViewMode !== null && theTreeView.mode !== QuickFolders.lastTreeViewMode) {
        util.logDebugOptional("folders.select","Restoring view mode to " + QuickFolders.lastTreeViewMode + "...");
				theTreeView.mode = QuickFolders.lastTreeViewMode;
      }
		}

		//folderTree.treeBoxObject.ensureRowIsVisible(gFolderTreeView.selection.currentIndex); // folderTree.currentIndex
		if ((msgFolder.flags & Flags.MSG_FOLDER_FLAG_VIRTUAL)) // || folderUri.indexOf("nobody@smart")>0
			QuickFolders.Interface.onTabSelected();
	}
	else if (util.Application=='SeaMonkey') {
		const TAB_MODBITS_TabShowFolderPane  = 0x0001;
		const TAB_MODBITS_TabShowMessagePane = 0x0002;
		const TAB_MODBITS_TabShowThreadPane  = 0x0004;
		const TAB_MODBITS_TabShowAcctCentral = 0x0008;

		// must have at least have either folder pane or message pane,
		// otherwise find another tab!
		if (!(tabmail.currentTabInfo.modeBits & (TAB_MODBITS_TabShowFolderPane | TAB_MODBITS_TabShowThreadPane)))
			for (i = 0; i < tabmail.tabInfo.length; i++) {
			  let info = tabmail.tabInfo[i];
				if (info && (info.modeBits & TAB_MODBITS_TabShowFolderPane)) {
					gMailNewsTabsType.showTab (info);
					break;
				}
			}

    util.logDebugOptional("folders.select", 'QuickFolders_MyEnsureFolderIndex()');
		folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
		// AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
		if (folderIndex<0) {
			util.ensureNormalFolderView();
			folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
			QuickFolders.tabSelectEnable=true;
		}
    util.logDebugOptional("folders.select", 'QuickFolders_MyChangeSelection(folderTree,' + folderIndex + ')');
		QuickFolders_MyChangeSelection(folderTree, folderIndex);
	}
	else { // TB 2, Postbox
	// before we can select a folder, we need to make sure it is "visible"
	// in the tree.	to do that, we need to ensure that all its
	// ancestors are expanded
		if (util.Application=='Postbox') {
			folderIndex = EnsureFolderIndex(msgFolder);
			util.logDebugOptional("folders.select", "EnsureFolderIndex: " + msgFolder.URI);
		}
		else {
			 folderIndex = QuickFolders_MyEnsureFolderIndex(folderTree, msgFolder);
		}
		// AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
		if (folderIndex<0) {
			util.ensureNormalFolderView();
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
    util.logDebugOptional("folders.select", 'Could not find folder in tree (folderIndex = null)');
		if (!msgFolder || !msgFolder.filePath || !msgFolder.filePath.exists())
			return false;
	}

	if (QuickFolders.Preferences.isFocusPreview && !(QuickFolders.Interface.getThreadPane().collapsed)) {
    util.logDebugOptional("folders.select", 'setFocusThreadPane()');
		QuickFolders.Interface.setFocusThreadPane();
		QuickFolders.doc.commandDispatcher.advanceFocus();
		QuickFolders.doc.commandDispatcher.rewindFocus();
	}
	
	// speed up the highlighting... - is this only necessary on MAC ?
	if (highlightTabFirst) {
	  let entry = QuickFolders.Model.getFolderEntry(folderUri);
		if (entry) {
      util.logDebugOptional("folders.select", 'onTabSelected() - highlighting speed hack');
		  QuickFolders.Interface.onTabSelected();  
		}
	}	
	
	return true;
}; // MySelectFolder


QuickFolders.FolderTreeSelect = function FolderTreeSelect(event) {
  // onSelect in Folder Tree
  let util = QuickFolders.Util,
      logDO = util.logDebugOptional.bind(util),
      logEx = util.logException.bind(util),
      QI = QuickFolders.Interface,
      folders = GetSelectedMsgFolders();
  try {
    logDO("events", "FolderTreeSelect: event target = " + event.target);
    if (folders.length) {
      let selFolder = folders[0];
      logDO("events", "FolderTreeSelect selecting folder  " + selFolder.prettyName);
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
	lastAdded: null,   // MsgFolder was removed
	ELog: function errLogFallback(msg) {
    try {
      try {Components.utils.reportError(msg);}
      catch(e) {
        let Cc = Components.classes,
            Ci = Components.interfaces,
            cserv = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
        cserv.logStringMessage("QuickFolders:" + msg);
      }
    }
    catch(e) {
      // write to TB status bar??
      try{QuickFolders.Util.logToConsole("Error: " + msg);} catch(e) {;};
    };
	},

	OnItemAdded: function fldListen_OnItemAdded(parent, item, viewString) {
		try {
			if (!QuickFolders)
				return;
			let f = item.QueryInterface(Components.interfaces.nsIMsgFolder);
			QuickFolders.FolderListener.lastAdded = f;
		}
		catch(e) { };
	},

	OnItemRemoved: function fldListen_OnItemRemoved(parent, item, viewString) {
		try {
			if (!QuickFolders)
				return;
			let f = item.QueryInterface(Components.interfaces.nsIMsgFolder),
			    fromURI = f.URI,
			    toURI = QuickFolders.FolderListener.lastAdded ? QuickFolders.FolderListener.lastAdded.URI : "",
          util = QuickFolders.Util,
          logDebug = util.logDebug.bind(util),
          logDebugOptional = util.logDebugOptional.bind(util),
          logToConsole = util.logToConsole.bind(util);
			logDebugOptional("listeners.folder", "onItemRemoved");
          
			QuickFolders.FolderListener.lastRemoved = f;
			// check if QuickFolders references this message folder:
			if (fromURI !== toURI && QuickFolders.Model.getFolderEntry(fromURI)) {
				if (QuickFolders.FolderListener.lastAdded && (f.name === QuickFolders.FolderListener.lastAdded.name)) {
					// the folder was moved, we need to make sure to update any corresponding quickfolder:
					logDebugOptional("folders","Trying to move Tab " + f.name + " from URI \n" + fromURI + "\n to URI \n" + toURI);
					if (toURI && QuickFolders.Model.moveFolderURI(fromURI, toURI)) {
						logDebug ("Successfully updated URI of Tab " + f.name);
						QuickFolders.Interface.updateFolders(true, true);
					}
					else {
						let s = "Failed to update URI of tab: " + f.name + " please remove it manually and add to QuickFolders bar";
						logToConsole (s);
						util.alert(s);
					}
				}
			}
			QuickFolders.FolderListener.lastAdded = null;
		}
		catch(e) { };
	},

	// parent, item, viewString
	OnItemPropertyChanged: function fldListen_OnItemPropertyChanged(property, oldValue, newValue) {
		//var x=property.toString();
	},

	OnItemIntPropertyChanged: function fldListen_OnItemIntPropertyChanged(item, property, oldValue, newValue) {
		function add1000Separators( sValue ) {
			let sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
			while(sRegExp.test(sValue.toString())) { sValue = sValue.replace(sRegExp, '$1,$2'); }
			return sValue;
		}
		try {
			if (typeof QuickFolders === 'undefined')
				return;
			let prop = property ? property.toString() : '',
          log = QuickFolders.Util.logDebugOptional.bind(QuickFolders.Util);
			log("listeners.folder", "OnItemIntPropertyChanged - property = " + prop);
			if (prop === "TotalUnreadMessages" ||
				(QuickFolders.Preferences.isShowTotalCount 
					&& prop === "TotalMessages")) {
					QuickFolders.Interface.setFolderUpdateTimer(item);
					let cF = QuickFolders.Interface.CurrentFolderTab;
					if (cF && cF.folder && cF.folder==item) { // quick update of CurrentFolder tab:
					  QuickFolders.Interface.initCurrentFolderTab(cF, item);
					}
			}
			if (QuickFolders.compactReportFolderCompacted && prop === "FolderSize") {
				try
				{
					QuickFolders.compactReportFolderCompacted = false;
					let size1 = QuickFolders.compactLastFolderSize,
					    size2 = item.sizeOnDisk,
					    message = "";
					if (item.URI && QuickFolders.compactLastFolderUri !== item.URI) {
						// should we reset it, in case the real message got lost ?
						return;
					}

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
					let originalSize= QuickFolders.Util.getBundleString("qfCompactedOriginalFolderSize","Original size"),
					    newSize = QuickFolders.Util.getBundleString("qfCompactedNewFolderSize","New Size"),
					    expunged = QuickFolders.Util.getBundleString("qfCompactedBytesFreed","Bytes expunged"),
					    out = message + " :: "
						+ (size1 ? (originalSize + ": " + add1000Separators(size1.toString()) + " ::  "
								   + expunged + ":" + add1000Separators((size1-size2).toString()) + " :: ")
								 : " ")
						+ newSize + ": " + add1000Separators(size2.toString()) ;
					//make sure it displays straight away and overwrite the compacting done message as well.

					setTimeout(function() { QuickFolders.Util.slideAlert("QuickFolders",out); QuickFolders.Util.logDebug(out); }, 250); // display "after compacting"

					QuickFolders.compactLastFolderUri = null;
					QuickFolders.compactLastFolderSize = 0;
				} catch(e) {;};
			}
		}
		catch(e) {this.ELog("Exception in Item OnItemIntPropertyChanged - TotalUnreadMessages: " + e);};
	},
	OnItemBoolPropertyChanged: function fldListen_OnItemBoolPropertyChanged(item, property, oldValue, newValue) {},
	OnItemUnicharPropertyChanged: function fldListen_OnItemUnicharPropertyChanged(item, property, oldValue, newValue) {
		// var x=prop;
	},
	OnItemPropertyFlagChanged: function fldListen_OnItemPropertyFlagChanged(item, property, oldFlag, newFlag) {
    // NOP
  },
	OnItemEvent: function fldListen_OnItemEvent(item, event) {
		let eString = event.toString();
		try {
			if (!QuickFolders || !QuickFolders.Util)
				return;
      let util = QuickFolders.Util,
          QI = QuickFolders.Interface,
          log = util.logDebugOptional.bind(util);
			log("listeners.folder", "OnItemEvent - evt = " + eString);
			switch (eString) {
        // a better option might be to hok into 
        // folderTree.onSelect 
        // which in Tb calls FolderPaneSelectionChange()
        // which uses GetSelectedMsgFolders()
				case "FolderLoaded": // DeleteOrMoveMsgCompleted
					try {
            log("events","event: " + eString + " item:" + item.prettyName);
						if (QI) {
              // make sure this event is not a "straggler"
              let folders = GetSelectedMsgFolders(),
                  itemFound = false;
              for each (let folder in folders) {
                if (item == folder) {
                  itemFound = true;
                  log("events", "FolderLoaded - calling onTabSelected for  " + item.prettyName);
                  QI.onTabSelected(null, item);
                  break;
                }
              }
              if (!itemFound) {
                log("events", "FolderLoaded - belated on folder " + item.prettyName + " - NOT shown in current folder bar!");
              }
            }
					}
					catch(e) {this.ELog("Exception in FolderListener.OnItemEvent {" + event + "} during calling onTabSelected:\n" + e)};
					break;
				case "RenameCompleted":
					// item.URI;
          log("events","event: " + eString);
					if (QuickFolders && QuickFolders.FolderListener.lastRemoved) {
						QuickFolders.Model.moveFolderURI(QuickFolders.FolderListener.lastRemoved.URI, item.URI);
					}
					break;
        default:
          log("events","event: " + eString);
          break;
			}
		}
		catch(e) {this.ELog("Exception in FolderListener.OnItemEvent {" + eString + "}:\n" + e)};
	},
	OnFolderLoaded: function fldListen_OnFolderLoaded(aFolder) { 
    let log = QuickFolders.Util.logDebugOptional.bind(QuickFolders.Util);
		log("listeners.folder", "OnFolderLoaded - folder = " + aFolder.prettyName);
	},
	OnDeleteOrMoveMessagesCompleted: function fldListen_OnDeleteOrMoveMessagesCompleted(aFolder) {
    let log = QuickFolders.Util.logDebugOptional.bind(QuickFolders.Util);
		log("listeners.folder", "OnDeleteOrMoveMessagesCompleted - folder = " + aFolder.prettyName);
	}
}

QuickFolders.LocalErrorLogger = function(msg) {
	let Cc = Components.classes,
	    Ci = Components.interfaces,
	    cserv = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
	cserv.logStringMessage("QuickFolders:" + msg);
}

