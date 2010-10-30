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

	12/10/2010 - 2.1 WIP
	  AG: Fixed a problem when dragging to New Folder from find result list (error message: no source folder)
	  AG: Added Recent Folders Tab
	  AG: Added locale sv-SE by Mikael Hiort af Ornaes
	  AG: Fixed Positioning of Folder Menus

  KNOWN ISSUES
  ============
  23/10/2009
	- if folders are added / removed during session this is not refreshed in subfolder list of popup set
	  workaround: select another Category this will rebuild the menus
	- folders can be orphaned in config settings and are not removable via interface

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
	- instantApply support (difficult, as there is no onclose event)
	- multiple categories per folder (like tags)
*/


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
	gFolderTree: null,
	keyListen: EventListener,
	loadListen: false,
	tabContainer: null,
	tabSelectEnable: true,
	currentURI: '',
	lastTreeViewMode: null,
	initDone: false,

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

		QuickFolders.Util.logDebug ("initDocAndWindow - QuickFolders.doc = " + QuickFolders.doc + "  this.doc = " + this.doc);


	},

	initDelayed: function() {
	   var sWinLocation;
	   if (this.initDone) return;
	   QuickFolders.initDocAndWindow();
	   var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.initDelay');
	   if (!nDelay>0) nDelay = 750;

	   sWinLocation = new String(window.location);

	   if(QuickFolders.isCorrectWindow()) {
			QuickFolders.Util.logDebug ("initDelayed ==== correct window: " + sWinLocation + " - " + document.title + "\nwait " + nDelay + " msec until init()...");
			// document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
			//var thefunc='QuickFolders.init()';
			//setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
			setTimeout(function() { QuickFolders.init(); }, nDelay);
			this.initDone=true;
		}
		else {
		  try {
			this.doc.getElementById('QuickFolders-Toolbar').style.display = 'none';

			QuickFolders.Util.logDebug ("DIFFERENT window type(messengerWindow): "
					+ this.doc.getElementById('messengerWindow').getAttribute('windowtype')
					+ "\ndocument.title: " + document.title )
		  }
		  catch(e) { ;} // QuickFolders.LocalErrorLogger("Exception in initDelayed: " + e) -- always thrown when options dialog is up!
		}
	} ,

	isCorrectWindow: function() {
		try {
			return document.getElementById('messengerWindow').getAttribute('windowtype') == "mail:3pane";
		}
		catch(e) { return false; }
	} ,


	init: function() {

		var em = Components.classes["@mozilla.org/extensions/manager;1"]
		   .getService(Components.interfaces.nsIExtensionManager);
		var myver=em.getItemForID("quickfolders@curious.be").version;



		var ApVer; try{ ApVer=QuickFolders.Util.AppverFull()} catch(e){ApVer="?"};
		var ApName; try{ ApName= QuickFolders.Util.Application()} catch(e){ApName="?"};

		QuickFolders.LocalErrorLogger("QF.init() - QuickFolders Version " + myver + "\n" + "Running on " + ApName + " Version " + ApVer);
		QuickFolders.addTabEventListener();

		this.doc.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';

		// only add event listener on startup if necessary as we don't
		// want to consume unnecessary performance during keyboard presses!
		if (QuickFolders.Preferences.isUseKeyboardShortcuts()) {
			if(!QuickFolders.Interface.boundKeyListener) {
				this.win.addEventListener("keypress", this.keyListen = function(e) {
					QuickFolders.Interface.windowKeyPress(e,'down');
				}, true);
				this.win.addEventListener("keyup", function(e) {
					QuickFolders.Interface.windowKeyPress(e,'up');
				}, true);

				QuickFolders.Interface.boundKeyListener = true;
			}
		}
		var folderEntries = QuickFolders.Preferences.getFolderEntries();

		if(folderEntries.length > 0) {
			QuickFolders.Model.selectedFolders = folderEntries;

			QuickFolders.Interface.updateUserStyles();

			var lastSelectedCategory = QuickFolders.Preferences.getLastSelectedCategory()
			QuickFolders.Util.logDebug("last selected Category:" + lastSelectedCategory );

			if(QuickFolders.Model.isValidCategory(lastSelectedCategory))
			  QuickFolders.Interface.selectCategory(lastSelectedCategory, true)
			else
			  QuickFolders.Interface.updateFolders(true);  // selectCategory already called updateFolders!

		}

		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

		observerService.addObserver({
			observe: function() {
				QuickFolders.Interface.updateFolders(true);
				QuickFolders.Interface.updateUserStyles();
			}
		},"quickfolders-options-saved", false);
		QuickFolders.Util.logDebug("QF.init() ends.");
		QuickFolders.Util.FirstRun.init();
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
			return flavours;
		},

		onDragEnter: function (evt,flavour,session){
			if (!((QuickFolders.Util.Appver() < 3) && (QuickFolders.Util.Application()=='Thunderbird'))) {
				evt.preventDefault();
				return false;
			}
			return true;
		},

		onDragOver: function (evt,flavour,session){
			if (flavour.contentType=="text/x-moz-folder" || flavour.contentType=="text/unicode" || flavour.contentType=="text/x-moz-newsfolder") // only allow folders or  buttons!
				session.canDrop = true;
			else {
				QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDragover - can not drop " + flavour.contentType);
				session.canDrop = false;
			}
		},

		onDrop: function (evt,dropData,dragSession) {
			QuickFolders.Util.logDebugOptional("dnd","toolbarDragObserver.onDrop " + dropData.flavour.contentType);
			var msgFolder, sourceUri;

			addFolder = function (src) {
					if(src) {
						var cat=QuickFolders.Interface.getCurrentlySelectedCategoryName();
						if (QuickFolders.Model.addFolder(src, cat)) {
							var s = "Added shortcut " + src + " to QuickFolders"
							if (cat!=null) s = s + " Category " + cat;
							try{QuickFolders_getWindow().MsgStatusFeedback.showStatusString(s);} catch (e) {};
						}
					}
			};

			switch (dropData.flavour.contentType) {
				case "text/x-moz-folder":
				case "text/x-moz-newsfolder":
					switch(QuickFolders.Util.Application()) {
						case 'Thunderbird':
							if (QuickFolders.Util.Appver()<3)
								sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession);
							else {
								msgFolder = evt.dataTransfer.mozGetDataAt(dropData.flavour.contentType, 0);
								sourceUri = msgFolder.QueryInterface(Components.interfaces.nsIMsgFolder).URI;
							}
							break;
						case 'SeaMonkey':
							sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession)
							break;
						case 'Postbox':
							sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession)
							break;
					}
					addFolder(sourceUri);

					break;
				case "text/unicode":  // plain text: button was moved OR: a menuitem was dropped!!
					var sourceUri = dropData.data;
					var myDragPos;
					var target=evt.currentTarget
					if (evt.pageX<120) // should find this out by checking whether "Quickfolders" label is hit
						myDragPos="LeftMost"
					else
						myDragPos="RightMost"
					if(!QuickFolders.ChangeOrder.insertAtPosition(sourceUri, "", myDragPos)) {
						//a menu item for a tab that does not exist was dropped!
						addFolder(sourceUri);
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
			return flavours;
		},
		dragOverTimer: null,
		onDragEnter: function(evt, dragSession) {
			try {
				if (!(QuickFolders.Util.Application()=='Thunderbird' && QuickFolders.Util.Appver()<3))
					evt.preventDefault(); // fix layout issues in TB3 + Postbox!

				var popupStart = evt.target;
				var pchild = popupStart.firstChild;
				if (pchild) {
					if (pchild.nodeName == 'menupopup') {
						// hide all sibling popup menus
						var psib = popupStart.nextSibling;
						while (psib) {
							if (psib.nodeName == 'menu' && popupStart!=psib)
								psib.firstChild.hidePopup();
							psib = psib.nextSibling;
						}
						psib = popupStart.previousSibling;
						while (psib) {
							if (psib.nodeName == 'menu' && popupStart!=psib)
								psib.firstChild.hidePopup();
							psib = psib.previousSibling;
						}
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
			QuickFolders.Util.logDebugOptional("dnd","popupDragObserver.DrageExit " + popupStart.nodeName + " - " + popupStart.getAttribute('label'));
			try {
				if (popupStart.nodeName=='menu') {
					QuickFolders_globalLastChildPopup=popupStart; // remember to destroy!
				}
			}
			catch (e) {
				QuickFolders.Util.logDebugOptional("dnd","CATCH popupDragObserver DragExit: \n" + e);
			}
		} ,

		onDragOver: function (evt, flavor, session){
			session.canDrop = (flavor.contentType == "text/x-moz-message");
			if (null!=QuickFolders_globalLastChildPopup) {
				/*QuickFolders_globalLastChildPopup.firstChild.hidePopup();*/
				QuickFolders_globalLastChildPopup=null;
			}
		},

		// drop mails on popup: move mail, like in buttondragobserver
		onDrop: function (evt,dropData,dragSession) {
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
				while (QuickFolders.popupDragObserver.newFolderMsgUris.length) QuickFolders.popupDragObserver.newFolderMsgUris.pop(); // reset!
				for (var i = 0; i < dragSession.numDropItems; i++) {
					dragSession.getData (trans, i);
					var dataObj = new Object();
					var flavor = new Object();
					var len = new Object();
					try {
						trans.getAnyTransferData(flavor, dataObj, len);

						if (flavor.value == "text/x-moz-message" && dataObj) {
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

				function newFolderCallback(aName, FolderParam) {
					var step='';
					var isManyFolders = false;
					if (aName) try {
						var currentURI;

						// we're dragging, so we are interested in the folder currently displayed in the threads pane
						var aFolder;
						if (QuickFolders.Util.Application()=='Postbox') {
							currentURI = GetSelectedFolderURI();
							aFolder = GetMsgFolderFromUri(FolderParam, true).QueryInterface(Components.interfaces.nsIMsgFolder); // inPB case this is just the URI, not the folder itself??
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
						if (QuickFolders.Util.Application()=='Postbox') {
							newFolder = GetMsgFolderFromUri(aFolder.URI + "/" + aName, true).QueryInterface(Components.interfaces.nsIMsgFolder);
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

						var isCopy = (QuickFolders.popupDragObserver.dragAction == Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY);
						step='3. ' + (isCopy ? 'copy' : 'move') + ' messages: ' + newFolder.URI;
						QuickFolders.Util.logDebugOptional("dragToNew", step);
						QuickFolders.Util.moveMessages(newFolder, QuickFolders.popupDragObserver.newFolderMsgUris, isCopy)

						QuickFolders.Util.logDebugOptional("dragToNew", "4. updateFolders...");
						QuickFolders.Interface.updateFolders(false); // update context menus
						return true;

					}
					catch(ex) {
						alert("Exception in newFolderCallback, step [" + step + "]: " + ex);
					}
					return false;
				}

				QuickFolders.Util.logDebugOptional("window.openDialog (newFolderDialog.xul)\n"
					+ "folder/preselectedURI:" + targetFolder + " (URI: " + targetFolder.URI + ")\n"
					+ "dualUseFolders:" + dualUseFolders);
				if (QuickFolders.Util.Application()=='Postbox') {
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

	buttonDragObserver: {
		win: QuickFolders_getWindow(),
		doc: QuickFolders_getDocument(),
		getSupportedFlavours : function () {
			var flavours = new FlavourSet();
			flavours.appendFlavour("text/x-moz-message"); // emails
			flavours.appendFlavour("text/unicode");  // tabs
			return flavours;
		},

		dragOverTimer: null,

		onDragEnter: function(evt, dragSession) {

			try {
				if (null==dragSession.sourceNode) {
					QuickFolders.Util.logDebugOptional("dnd", "UNEXPECTED ERROR QuickFolders.OnDragEnter - empty sourceNode!");
					return;
				}
				QuickFolders.Util.logDebugOptional("dnd","buttonDragObserver.onDragEnter - sourceNode = " + dragSession.sourceNode.nodeName);
				if (dragSession.sourceNode.nodeName == 'toolbarpaletteitem') {
					QuickFolders.Util.logDebug("trying to drag a toolbar palette item - not allowed.");
					dragSession.canDrop=false;
					return;
				}
				var button = evt.target;
				// delete previous drag folders popup!
				if (QuickFolders_globalHidePopupId && QuickFolders_globalHidePopupId!="") {
					var popup = this.doc.getElementById(QuickFolders_globalHidePopupId);
					try {
						if (QuickFolders.Util.Application() == 'SeaMonkey')
							popup.parentNode.removeChild(popup);
						else
							popup.hidePopup(); // parentNode.removeChild(popup)
						QuickFolders.Util.logDebugOptional("dnd", "removed popup QuickFolders_globalHidePopupId: " + QuickFolders_globalHidePopupId );
					}
					catch (e) {
						QuickFolders.Util.logDebugOptional("dnd", "removing popup:  QuickFolders_globalHidePopupId  failed!\n" + e + "\n");
					}
					QuickFolders_globalHidePopupId="";
				}

				if(button.tagName == "toolbarbutton") {
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
									if (dx != 0) {
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
							if (otherPopups[i].folder!=targetFolder)
								otherPopups[i].hidePopup();
						}
						else if (targetFolder) { // there is a targetfolder but the other popup doesn't have one (special tab!).
							otherPopups[i].hidePopup();
						}
/*						// use the "tag" attribute to close popup on special buttons (e.g. Recent Folders tab)
 *						if (otherPopups[i].getAttribute('tag')) {
 *							if (!button.getAttribute('tag'))
 *								otherPopups[i].hidePopup();
 *							else
 *								if (otherPopups[i].getAttribute('tag')!=button.getAttribute('tag'))
 *									otherPopups[i].hidePopup();
 *						}
 */

					}


					// only show popups when dragging messages!
					// removed && targetFolder.hasSubFolders as we especially need the new folder submenu item for folders without subfolders!
					if(dragSession.isDataFlavorSupported("text/x-moz-message") )
					try {
						//close any other context menus
						if (dragSession.isDataFlavorSupported("text/unicode" ))
							return;  // don't show popup when reordering tabs

						var isTB2 = ((QuickFolders.Util.Application()=='Thunderbird') && (QuickFolders.Util.Appver() < 3));
						if (isTB2 && targetFolder!=null)
							if (isTB2 && !targetFolder.hasSubFolders)
								return; // no popup menu at all!

						if (targetFolder)
							QuickFolders.Util.logDebugOptional("dnd", "creating popupset for " + targetFolder.name );

						// instead of using the full popup menu (containing the 3 top commands)
						// try to create droptarget menu that only contains the target subfolders "on the fly"
						// haven't found a way to tidy these up, yet (should be done in onDragExit?)
						// Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
						// no menus necessary for folders without subfolders!
						var popupset = this.doc.createElement('popupset');
						QuickFolders.Interface.getToolbar().appendChild(popupset);
						var menupopup = this.doc.createElement('menupopup');

						var popupId;
						if (targetFolder) {
							popupId = 'moveTo_'+targetFolder.URI;
							menupopup.setAttribute('id', popupId);
							menupopup.className = 'QuickFolders-folder-popup';
							menupopup.folder = targetFolder;
							popupset.appendChild(menupopup);
							// excluding TB 2 from "drag to new folder" menu for now
							QuickFolders.Interface.addSubFoldersPopup(menupopup, targetFolder, true);
						}
						else { // special folderbutton: recent
							popupId = 'moveTo_QuickFolders-folder-popup-Recent';
							menupopup.setAttribute('id', popupId);
							popupset.appendChild(menupopup);
							QuickFolders.Interface.createRecentTab(menupopup, true, button);
						}

						// a bug in showPopup when used with coordinates makes it start from the wrong origin
						//document.getElementById(popupId).showPopup(button, button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
						// AG fixed, 19/11/2008 - showPopup is deprecated in FX3!
						QuickFolders.Util.logDebugOptional("dnd", "showPopup with id " + popupId );
						var p =  this.doc.getElementById(popupId);
						if (p.openPopup)
							p.openPopup(button,'after_start', -1,-1,"context",false);
						else
							p.showPopup(button, -1,-1,"context","bottomleft","topleft");

						if (popupId==QuickFolders_globalHidePopupId) QuickFolders_globalHidePopupId=""; // avoid hiding "itself". QuickFolders_globalHidePopupId is not cleared if previous drag cancelled.

					}


					catch(e) { QuickFolders.Util.logDebugOptional("dnd", "Exception creating folder popup: " + e);};
					}
			}
			catch(ex) {
				QuickFolders.Util.logException ("EXCEPTION buttonDragObserver.onDragEnter: ", ex);
			}
		} ,

		// deal with old folder popups
		onDragExit: function(event, dragSession) {
			 if (null==dragSession.sourceNode) { return; }
			 try {
			//QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - sourceNode = " + dragSession.sourceNode.nodeName);
			 } catch(e) { QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragExit - " + e); }
			if (dragSession.sourceNode.nodeName == 'toolbarpaletteitem') {
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
			if (flavor.contentType == "text/x-moz-message" || flavor.contentType == "text/unicode"
			 || flavor.contentType == "text/x-moz-folder" || flavor.contentType == "text/x-moz-newsfolder")
				session.canDrop = true;
			else {
				QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDragover - can not drop " + flavor.contentType);
				session.canDrop = false;
			}

		},

		onDrop: function (evt,dropData,dragSession) {
			var debugDragging = false;
			//alert('test: dropped item, flavor=' + dropData.flavour.contentType);
			QuickFolders.Util.logDebugOptional("dnd", "buttonDragObserver.onDrop flavor=" + dropData.flavour.contentType);
			var DropTarget = evt.target;
			var targetFolder = DropTarget.folder;
			QuickFolders_globalHidePopupId="";

			switch (dropData.flavour.contentType) {
				case  "text/x-moz-folder": // not supported! You can not drop a folder from foldertree on a tab!
					alert("Please drag new folders to an empty area of the toolbar!");
					break;
				case  "text/x-moz-message":
					var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
					//alert('trans.addDataFlavor: trans=' + trans + '\n numDropItems=' + dragSession.numDropItems);
					trans.addDataFlavor("text/x-moz-message");

					var messageUris = []; var i;

					for (i = 0; i < dragSession.numDropItems; i++) {
						//alert('dragSession.getData ... '+(i+1));
						dragSession.getData (trans, i);
						var dataObj = new Object();
						var flavor = new Object();
						var len = new Object();
						if (debugDragging ) alert('trans.getAnyTransferData ... '+(i+1));
						try {
							trans.getAnyTransferData(flavor, dataObj, len);

							if (flavor.value == "text/x-moz-message" && dataObj) {
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
							QuickFolders.Util.moveMessages(
							  targetFolder,
							  messageUris,
							  dragSession.dragAction == Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY
							)
						}
					}
					catch(e) {QuickFolders.LocalErrorLogger("Exception in onDrop - QuickFolders.Util.moveMessages:" + e); };
					// close any top level menu items after message drop!

					//hide popup's menus!
					QuickFolders.Util.logDebug ("buttonDragObserver.onDrop " + DropTarget.tagName+ '  Target:' + targetFolder.name );

					QuickFolders.Interface.collapseParentMenus(DropTarget);

					break;
				case "text/unicode":  // dropping another tab on this tab inserts it before
					QuickFolders.ChangeOrder.insertAtPosition(dropData.data, DropTarget.folder.URI, "");
					break;
			}
		},
		// new handler for starting drag of buttons (re-order)
		onDragStart: function (event, transferData, action) {
			var button = event.target;
			transferData.data = new TransferData();
			transferData.data.addDataForFlavour("text/unicode", button.folder.URI); // test
		}

	},

	addLoadEventListener: function() {
		// avoid registering this event listener twice!
		if (!this.loadListen) {
			window.addEventListener("load", QuickFolders.initDelayed, true);
		}
		this.loadListen=true;
	},

	addTabEventListener: function() {
		if (((QuickFolders.Util.Appver() < 3) && (QuickFolders.Util.Application()=='Thunderbird')))
		  return; // no tabs in TB2!
		try{
			if (QuickFolders.Util.Application()=='Postbox')
				QuickFolders.tabContainer = this.doc.getElementById('tabmail').mTabContainer;
			else
				QuickFolders.tabContainer = this.doc.getElementById('tabmail').tabContainer;
			QuickFolders.tabContainer.addEventListener("select", QuickFolders.TabListener.mailTabSelected, false);
			//this.tabContainer.addEventListener("tabselected", QuickFolders.TabListener.mailTabSelected, false);
		}
		catch (e) {
			QuickFolders.LocalErrorLogger("No tabContainer available! " + e);
			QuickFolders.tabContainer = null;
		}
	}
}


function QuickFolders_MyEnsureFolderIndex(tree, msgFolder)
{
	// try to get the index of the folder in the tree
	try {
		var index ;

		if (typeof tree.getIndexOfFolder != 'undefined')
			index = tree.getIndexOfFolder(msgFolder);
		else
			if (tree.builderView != 'undefined')
				index = tree.builderView.getIndexOfResource(msgFolder);
			else
				if (typeof EnsureFolderIndex != 'undefined')
					index = EnsureFolderIndex(msgFolder);
				else
					return -1;

		QuickFolders.Util.logDebugOptional ("folders", "QuickFolders_MyEnsureFolderIndex - index of " + msgFolder.name + ": " + index);

		if (index == -1) {
			var parentIndex = QuickFolders_MyEnsureFolderIndex(tree, msgFolder.parent);

			// if we couldn't find the folder, open the parent
			if(!tree.builderView.isContainerOpen(parentIndex)) {
				tree.builderView.toggleOpenState(parentIndex);
			}

			if (typeof tree.getIndexOfFolder != 'undefined')
				index = tree.getIndexOfFolder(msgFolder);
			else
				if (tree.builderView != 'undefined')
					index = tree.builderView.getIndexOfResource(msgFolder);
				else
					if (typeof EnsureFolderIndex != 'undefined')
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
  if (QuickFolders.Util.Appver() > 2)
	return Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
  else
	return RDF;
}

// replaces TB2 only helper method GetFolderTree()
function QuickFolders_MyGetFolderTree() {
  if (!QuickFolders.gFolderTree)
	 QuickFolders.gFolderTree = QuickFolders.doc.getElementById("folderTree");
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

function QuickFolders_MySelectFolder(folderUri)
{
	//during QuickFolders_MySelectFolder, disable the listener for tabmail "select"
	QuickFolders.Util.logDebugOptional("folders", "QuickFolders_MySelectFolder: " + folderUri);
	// QuickFolders.tabSelectEnable=false;

	var folderTree = QuickFolders_MyGetFolderTree();
	var folderResource = QuickFolders_myRDF().GetResource(folderUri);
	var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
	var folderIndex;

	QuickFolders.currentURI = folderUri;

	if (QuickFolders.Util.Application()=='Thunderbird' && QuickFolders.Util.Appver()>=3)
	{
		// TB 3
		const MSG_FOLDER_FLAG_NEWSGROUP = 0x0001
		const MSG_FOLDER_FLAG_TRASH 	= 0x0100
		const MSG_FOLDER_FLAG_SENTMAIL	= 0x0200
		const MSG_FOLDER_FLAG_DRAFTS	= 0x0400
		const MSG_FOLDER_FLAG_QUEUE 	= 0x0800
		const MSG_FOLDER_FLAG_INBOX 	= 0x1000
		const MSG_FOLDER_FLAG_TEMPLATES = 0x400000
		const MSG_FOLDER_FLAG_JUNK		= 0x40000000
		//
		const MSG_FOLDER_FLAG_SMART 	= 0x4000  // just a guess, as this was MSG_FOLDER_FLAG_UNUSED3
		const MSG_FOLDER_FLAG_ELIDED	= 0x0010  // currenty hidden
		const MSG_FOLDER_FLAG_VIRTUAL	= 0x0020

		// find out if parent folder is smart and collapsed (bug in TB3!)
		// in this case getIndexOfFolder returns a faulty index (the parent node of the inbox = the mailbox account folder itself)
		// therefore, ensureRowIsVisible does not work!
		var theTreeView = gFolderTreeView;

		QuickFolders.lastTreeViewMode = theTreeView.mode; // backup of view mode. (TB3)

		if (msgFolder.parent) {
			QuickFolders.Util.ensureFolderViewTab(); // lets always do this when a folder is clicked!

			folderIndex = theTreeView.getIndexOfFolder(msgFolder);
			if (null==folderIndex) {
			    theTreeView.selectFolder(msgFolder);
				folderIndex = theTreeView.getIndexOfFolder(msgFolder);
		    }

			if (null==folderIndex) {
				QuickFolders.Util.ensureNormalFolderView();
				folderIndex = theTreeView.getIndexOfFolder(msgFolder);
			}

			var parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
			// flags from: mozilla 1.8.0 / mailnews/ base/ public/ nsMsgFolderFlags.h
			var specialFlags = MSG_FOLDER_FLAG_INBOX + MSG_FOLDER_FLAG_QUEUE + MSG_FOLDER_FLAG_SENTMAIL + MSG_FOLDER_FLAG_TRASH + MSG_FOLDER_FLAG_DRAFTS + MSG_FOLDER_FLAG_TEMPLATES	+ MSG_FOLDER_FLAG_JUNK ;
			if (msgFolder.flags & specialFlags) {
				// is this folder a smartfolder?
				if (folderUri.indexOf("nobody@smart")>0 && null==parentIndex && theTreeView.mode!="smart") {
					// toggle to smartfolder view and reinitalize folder variable!
					theTreeView.mode="smart"; // after changing the view, we need to get a new parent!!
					folderResource = QuickFolders_myRDF().GetResource(folderUri);
					msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
					parentIndex = theTreeView.getIndexOfFolder(msgFolder.parent);
				}

				// a special folder, its parent is a smart folder?
				if (msgFolder.parent.flags & MSG_FOLDER_FLAG_SMART || "smart" == theTreeView.mode) {
					if (null==folderIndex || parentIndex > folderIndex) {
						// if the parent appears AFTER the folder, then the "real" parent is a smart folder.
						var smartIndex=0;
						while (0x0==(specialFlags & (theTreeView._rowMap[smartIndex]._folder.flags & msgFolder.flags)))
						smartIndex++;
						if (!(theTreeView._rowMap[smartIndex]).open) {
							theTreeView._toggleRow(smartIndex, false);
						}
					}
				}
				else { // all other views:
					if (null != parentIndex) {
						if (!(theTreeView._rowMap[parentIndex]).open)
							theTreeView._toggleRow(parentIndex, true); // server
					}
					else {
					QuickFolders.Util.logDebugOptional("folders", "Can not make visible: " + msgFolder.URI + " - not in current folder view?");
					}
				}
			}
		}

		theTreeView.selectFolder (msgFolder);
		theTreeView._treeElement.treeBoxObject.ensureRowIsVisible(folderIndex);

		// reset the view mode.
		if (!QuickFolders.Preferences.isChangeFolderTreeViewEnabled()) {
			if (QuickFolders.lastTreeViewMode != null && theTreeView.mode != QuickFolders.lastTreeViewMode)
				theTreeView.mode = QuickFolders.lastTreeViewMode;
		}

		//folderTree.treeBoxObject.ensureRowIsVisible(gFolderTreeView.selection.currentIndex); // folderTree.currentIndex
		if ((msgFolder.flags & MSG_FOLDER_FLAG_VIRTUAL)) // || folderUri.indexOf("nobody@smart")>0
			QuickFolders.Interface.onFolderSelected();
	}
	else if (QuickFolders.Util.Application()=='SeaMonkey') {
		const TAB_MODBITS_TabShowFolderPane  = 0x0001;
		const TAB_MODBITS_TabShowMessagePane = 0x0002;
		const TAB_MODBITS_TabShowThreadPane  = 0x0004;
		const TAB_MODBITS_TabShowAcctCentral = 0x0008;

		var tabmail = GetTabMail();
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
	else { // TB 2, Postbox, SeaMonkey
	// before we can select a folder, we need to make sure it is "visible"
	// in the tree.	to do that, we need to ensure that all its
	// ancestors are expanded
		if (QuickFolders.Util.Application()=='Postbox') {
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
	if (QuickFolders.Preferences.isFocusPreview() && !(GetMessagePane().collapsed)) {
		GetMessagePane().focus();
		QuickFolders.doc.commandDispatcher.advanceFocus();
		QuickFolders.doc.commandDispatcher.rewindFocus();
	}

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
			var cserv = this.Cc["@mozilla.org/consoleservice;1"].getService(this.Ci.nsIConsoleService);
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
			var f=item.QueryInterface(Components.interfaces.nsIMsgFolder);
			QuickFolders.FolderListener.lastAdded = f;
		}
		catch(e) { };
	},

	OnItemRemoved: function(parent, item, viewString) {
		try {
			var f = item.QueryInterface(Components.interfaces.nsIMsgFolder);
			QuickFolders.FolderListener.lastRemoved = f;
			// check if QuickFolders references this message folder:
			if (QuickFolders.Model.getFolderEntry(f.URI)) {
				if (f.name == QuickFolders.FolderListener.lastAdded.name) {
					// the folder was moved, we need to make sure to update any corresponding quickfolder:
					QuickFolders.Util.logDebugOptional("folders","Trying to move Tab " + f.name + " from URI \n" + f.URI + "\n to URI \n" + QuickFolders.FolderListener.lastAdded.URI);
					if (QuickFolders.Model.moveFolderURI(f.URI, QuickFolders.FolderListener.lastAdded.URI))
						QuickFolders.Util.logToConsole ("Successfully updated URI of Tab " + f.name);
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

	OnItemPropertyChanged: function(parent, item, viewString) {},
	OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
		try {
			if (property == "TotalUnreadMessages" ||
				(QuickFolders.Preferences.isShowTotalCount() && property == "TotalMessages")) {	// FolderSize
				if(QuickFolders)
					QuickFolders.Interface.setFolderUpdateTimer();
			}
		}
		catch(e) {this.ELog("Exception in Item OnItemIntPropertyChanged - TotalUnreadMessages: " + e);};
	},
	OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
	OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
	OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
	OnItemEvent: function(item, event) {
		try {
			QuickFolders.Util.logDebugOptional("events","event: " + event);
			if(event == "FolderLoaded") {	// DeleteOrMoveMsgCompleted
				try {
					if(QuickFolders.Interface)
						QuickFolders.Interface.onFolderSelected();
				}
				catch(e) {this.ELog("Exception in Item event - calling onFolderSelected: " + e)};
			}
		}
		catch(e) {this.ELog("Exception in Item event: " + e)};
	},
	OnFolderLoaded: function(aFolder) { },
	OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}

QuickFolders.TabListener = {
	mailTabSelected: function(evt){
		try {
			if(QuickFolders)
				QuickFolders.Interface.setTabSelectTimer();
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



