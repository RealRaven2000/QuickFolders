"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

if (typeof ChromeUtils.import == "undefined") {
	Components.utils.import("resource://gre/modules/Services.jsm");
}
else
	var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

if (!QuickFolders.StringBundle)
	QuickFolders.StringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties = QuickFolders.StringBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties")
		.QueryInterface(Components.interfaces.nsIStringBundle);

QuickFolders.Interface = {
	PaintModeActive: false,
	TimeoutID: 0,
	LastTimeoutID: 0,
	IdUnique: 0,
	debugPopupItems: 0,
	buttonsByOffset: [],
	menuPopupsByOffset: [],
	//myPopup: null,
	boundKeyListener: false,
	RecentPopupId: 'QuickFolders-folder-popup-Recent',
	_paletteStyleSheet: null,
	_paletteStyleSheetOfOptions: null,
	isCommandListeners: QuickFolders.Preferences.getBoolPref('debug.popupmenus.isCommandListeners'), // [false] remove these later
	isOncommandAttributes: QuickFolders.Preferences.getBoolPref('debug.popupmenus.isOnCommandAttr'), // [false] remove these later
	_verticalMenuOffset: QuickFolders.Preferences.getIntPref('debug.popupmenus.verticalOffset'),
	get verticalMenuOffset() { return this._verticalMenuOffset; },
	set verticalMenuOffset(o) { this._verticalMenuOffset = o; QuickFolders.Preferences.setIntPref('debug.popupmenus.verticalOffset', o)},
	RecentPopupIdCurrentFolderTool: 'QuickFolders-folder-popup-Recent-CurrentFolderTool',
	get CategoryBox() { return  QuickFolders.Util.$('QuickFolders-Category-Box'); },
	get FilterToggleButton() { return QuickFolders.Util.$('QuickFolders-filterActive'); },
	get CurrentFolderTab() {
    // retrieves the Visible current folder tab - might have to move it in Tb for conversation view
    return QuickFolders.Util.$('QuickFoldersCurrentFolder');
  },
	get CurrentFolderRemoveIconBtn() { return QuickFolders.Util.$('QuickFolders-RemoveIcon');},
  get CurrentFolderSelectIconBtn() { return QuickFolders.Util.$('QuickFolders-SelectIcon');},
	get CurrentFolderBar() { return QuickFolders.Util.$('QuickFolders-CurrentFolderTools');},
	get CurrentFolderFilterToggleButton() { return QuickFolders.Util.$('QuickFolders-currentFolderFilterActive'); },
	get CogWheelPopupButton () { return QuickFolders.Util.$('QuickFolders-mainPopup'); },
	get QuickMoveButton () { return QuickFolders.Util.$('QuickFolders-quickMove'); },
  get ReadingListButton () { return QuickFolders.Util.$('QuickFolders-readingList'); },
	get CategoryMenu() { return QuickFolders.Util.$('QuickFolders-Category-Selection'); },
	get PaintButton() { return QuickFolders.Util.$('QuickFolders-paintBucketActive'); },
	get MailButton() { return QuickFolders.Util.$('QuickFolders-CurrentMail'); },
	get TitleLabel() { return QuickFolders.Util.$('QuickFolders-title-label'); },
	get TitleLabelBox() { return QuickFolders.Util.$('QuickFolders-LabelBox'); },
	get FoldersBox() { return QuickFolders.Util.$('QuickFolders-FoldersBox'); },
	get Toolbar() { return QuickFolders.Util.$('QuickFolders-Toolbar'); },
	get PalettePopup() { return QuickFolders.Util.$('QuickFolders-PalettePopup');},
	get FindFolderBox() { return QuickFolders.Util.$('QuickFolders-FindFolder');},

  getPreviewButtonId: function getPreviewButtonId(previewId) {
		switch(previewId) {
			case 'standard':
        return 'inactivetabs-label';
			case 'active':
        return 'activetabs-label';
			case 'hovered':
        return 'hoveredtabs-label';
			case 'dragOver':
        return 'dragovertabs-label';
			default:
				QuickFolders.Util.logDebug('QuickFolders.Interface.getPreviewButtonId - Invalid previewId: ' + previewId);
        return null;
		}
  } ,

	setEventAttribute: function setEventAttribute(element, eventName, eventAction) {
	  // workaround to lower number of warnings in addon validation
		element.setAttribute(eventName, eventAction);
	} ,

	get PaletteStyleSheet() {
		const util = QuickFolders.Util;
	  let isOptionsScreen = (document.location.href.toString() == 'chrome://quickfolders/content/options.xhtml');

		if (isOptionsScreen) {
			if (this._paletteStyleSheetOfOptions)
				return this._paletteStyleSheetOfOptions;
		}
		else {
			if (this._paletteStyleSheet)
				return this._paletteStyleSheet;
		}
		let ss = 'content/skin/quickfolders-palettes.css';

		this._paletteStyleSheet = 'chrome://quickfolders/' + ss;
		if (!this._paletteStyleSheetOfOptions)  {
      this._paletteStyleSheetOfOptions = this._paletteStyleSheet; // 'chrome://quickfolders/content/skin/quickfolders-options.css';  // this._paletteStyleSheet;
    }
		util.logDebugOptional('css,css.Detail',"My Palette Stylesheet = " + ss);

		// now let's return the correct thing.
		if (isOptionsScreen) {
			if (this._paletteStyleSheetOfOptions)
				return this._paletteStyleSheetOfOptions;
		}
		return this._paletteStyleSheet;

	} ,

	get globalTreeController() {
		if (typeof gFolderTreeController !== 'undefined')
			return gFolderTreeController;
		return QuickFolders.Util.getMail3PaneWindow().gFolderTreeController;
	} ,

	getUIstring: function getUIstring(id, defaultString) {
		let s;
		try {
			s = QuickFolders.Properties.GetStringFromName(id);
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception during getUIstring(' + id + ') ', ex);
			s = defaultString;
		}
		return s;
	},

	setBoundKeyListener: function setBoundKeyListener(b) {
		this.boundKeyListener = b;
	},

  // tabSelectUpdate - when a QuickFolders Tab is selected
	// PROBABLY OBSOLETE
	tabSelectUpdate: function tabSelectUpdate() {
    const util = QuickFolders.Util;
		try {
			let folder;
			util.logDebugOptional("mailTabs", "tabSelectUpdate - " + QuickFolders.currentURI +"\n");
      folder = QuickFolders.Interface.onTabSelected();
      // change the category (if selected folder is in list)
      // GetFirstSelectedMsgFolder(); // bad thing!
      if (folder) {
        util.logDebugOptional("mailTabs", "tabSelectUpdate() Folder Selected: "+ folder.name);
        let entry = QuickFolders.Model.getFolderEntry(folder.URI);
        if (entry) {
          util.logDebugOptional ("mailTabs","Current Category = " + this.currentActiveCategories ); // + this.CurrentlySelectedCategories
          if (entry.category)
            util.logDebugOptional ("mailTabs","Categories of selected Tab = " + entry.category.replace('|',', '));
        }
      }
		} catch(e) { util.logToConsole("tabSelectUpdate failed: " + e); }
	} ,

	setTabSelectTimer: function setTabSelectTimer() {
			try {
				let nDelay = 250,
				    tID=setTimeout(function() { QuickFolders.Interface.tabSelectUpdate(); }, nDelay);
				QuickFolders.Util.logDebug("Tab Select Timer prepared - ID: " + tID);
			}
			catch (e) {
				QuickFolders.Util.logDebug("setTabSelectTimer: " + e);
			}
	} ,

	// helper function for SeaMonkey when another (mail) tab is selected
	// as this doesn't trigger FolderListener events!
	setFolderSelectTimer: function setFolderSelectTimer() {
			try {
				let nDelay = 100,
				    tID=setTimeout(function() { QuickFolders.Interface.onTabSelected(); }, nDelay);
				QuickFolders.Util.logDebug("Folder Select Timer prepared - ID: " + tID);
			}
			catch (e) {
				QuickFolders.Util.logDebug("setFolderSelectTimer: " + e);
			}
	} ,

	setFolderUpdateTimer: function setFolderUpdateTimer(item) {
		// avoid the overhead if marking a folder with lots of unread mails as read or getting emails
		// made folder update asynchronous instead.
		// we only set a new timer, if there is not already one active.
    let util = QuickFolders.Util,
        logDO = util.logDebugOptional.bind(util),
        QI = QuickFolders.Interface;
		logDO("listeners.folder", "setFolderUpdateTimer() - Id = " + QI.TimeoutID);
		if (!(QI.TimeoutID)) {
			try {
				let nDelay = QuickFolders.Preferences.getIntPref('queuedFolderUpdateDelay');
        if (item && item.prettyName) {
          let isUpdateVisible = false;
          // if this folder is not displayed, can we bypass the update?
          let folderUri = item.URI;
          while (folderUri ) {
            let entry = QuickFolders.Model.getFolderEntry(folderUri);
            logDO("listeners.folder", "Checking URI " + folderUri
                                  + " returns " + (entry ? entry.name : "no tab entry"));
            if (entry) {
              if (QuickFolders.Interface.shouldDisplayFolder(entry)) {
                logDO("listeners.folder", "should display: " + entry.name);
                isUpdateVisible=true;
                break;
              }
              else
                logDO("listeners.folder", "no need to display: " + entry.name);
            }
            let slash = folderUri.lastIndexOf('/');
					  folderUri = folderUri.substring(0, slash)
          }
          if (!isUpdateVisible) return;

          util.logDebug('setFolderUpdateTimer(item):' + item.prettyName);
        }
				if (!nDelay>0) nDelay = 750;
				//this.TimeoutID = setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
				QI.TimeoutID = setTimeout(function() { QuickFolders.Interface.queuedFolderUpdate(); }, nDelay);
				util.logDebug("Folder Tab Select Timer ID: " + QI.TimeoutID);

				util.logDebug("Setting Update Timer (after timer " + QI.LastTimeoutID + " expired), new Timer: " + QI.TimeoutID);
				QI.LastTimeoutID = QI.TimeoutID;
			}
			catch (e) {
				logDO("listeners.folder", "setFolderUpdateTimer: " + e);
			}
		}
	},

	queuedFolderUpdate: function queuedFolderUpdate() {
		QuickFolders.Util.logDebugOptional("listeners.folder,interface", "Folder Update from Timer " + this.TimeoutID + "…");
		this.updateFolders(false, true);
		//reset all timers
		this.TimeoutID=0;
	},

	// Postbox / SeaMonkey specific code:
	// See also: http://mxr.mozilla.org/mozilla/source/mail/base/content/mail-folder-bindings.xml#369
	generateMRUlist_Postbox_TB2: function generateMRUlist_Postbox_TB2() {
		const Cc = Components.classes,
		      Ci = Components.interfaces;
		// use strict: must declare local functions at the top!

		/**    checkSubFolders(aFolder)
		 * This function will iterate through any existing
		 * sub-folders and
		 *    (1) check if they're recent and
		 *    (2) recursively call this function to iterate through any sub-sub-folders.
		 *
		 * @param aFolder:  the folder to check
		 */
		function checkSubFolders(aFolder) {
			if (!aFolder.hasSubFolders)
				return;
			let myenum; // force instanciation for SM
			if (typeof aFolder.subFolders != 'undefined')
				myenum = aFolder.subFolders;
			else
				myenum = aFolder.GetSubFolders();


			let done=false;
			while (!done) {
				let folder;
				if (typeof myenum.currentItem!='undefined')
					folder = myenum.currentItem().QueryInterface(Ci.nsIMsgFolder); // Postbox
				else // SeaMonkey
				{
					if (myenum.hasMoreElements())
						folder = myenum.getNext().QueryInterface(Ci.nsIMsgFolder);
					else {
						done=true;
						break;
					}
				}
				QuickFolders.Util.logDebugOptional("popupmenus","	   check for recent: " + folder.prettyName);

				addIfRecent(folder);
				checkSubFolders(folder);
				// Postbox
				if (typeof myenum.next != 'undefined') {
					try { myenum.next(); } catch(e) {done=true;}
				}
			}
			done=false;
		}

		/**    addIfRecent(aFolder)
		 * This function will add a folder to the recentFolders array if it
		 * is among the 15 most recent.  If we exceed 15 folders, it will pop
		 * the oldest folder, ensuring that we end up with the right number
		 *
		 * @param aFolder the folder to check
		 */
		function addIfRecent(aFolder) {
			if (!aFolder.canFileMessages || !aFolder.getStringProperty)
				return;

			let time = 0;
			try {
				time = aFolder.getStringProperty("MRUTime");
			} catch(ex) {}
			if (time <= oldestTime) {
				QuickFolders.Util.logDebugOptional('recentFolders.detail','time <= oldest: ' + aFolder.prettyName);
				return;
			}

			if (recentFolders.length >= MAXRECENT) {
				recentFolders.sort(sorter);
				QuickFolders.Util.logDebugOptional('recentFolders','recentFolders.pop(): '
					+ recentFolders[recentFolders.length-1].prettyName
					+ '\n- MRUTime: ' + recentFolders[recentFolders.length-1].getStringProperty("MRUTime")
					+ '\n- for folder: ' + aFolder.prettyName
					+ '\ntime=' + time
					+ '\noldestTime=' + oldestTime);
				recentFolders.pop();
				oldestTime = recentFolders[recentFolders.length-1].getStringProperty("MRUTime");
			}
			recentFolders.push(aFolder);
		}

		function sorter(a, b) {
			if (a.getStringProperty("MRUTime") < b.getStringProperty("MRUTime"))
				return 1;
			return -1;
		}

		QuickFolders.Util.logDebugOptional('recentFolders','generateMRUlist_Postbox_TB2');
		// Iterate through all folders in all accounts, and check MRU_Time,
		// then take the most recent 15.
		let recentFolders = [],
		    oldestTime = 0, // let sometimes creates a problem in TB2!
		    MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount"),
	      menu = this,
        // Start iterating at the top of the hierarchy, that is, with the root
        // folders for every account.
		    acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager);
		// Postbox only:
		if (util.isLegacyIterator) {
			for (let acct in fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
				addIfRecent(acct.incomingServer.rootFolder);
				checkSubFolders(acct.incomingServer.rootFolder);
			}
		}

		recentFolders.sort(sorter);
		return recentFolders;
	} ,

	createRecentPopup: function createRecentPopup(passedPopup, isDrag, isCreate, isCurrentFolderButton) {
		const Cc = Components.classes,
		      Ci = Components.interfaces;
		let menupopup,
		    popupId = isCurrentFolderButton ? this.RecentPopupIdCurrentFolderTool : this.RecentPopupId,
        prefs = QuickFolders.Preferences,
        util = QuickFolders.Util;
		util.logDebugOptional('recentFolders','createRecentPopup(passedPopup:' + passedPopup + ', isDrag:'+ isDrag +', isCreate:' + isCreate + ')');

 		if (passedPopup) {
// 			menupopup = passedPopup;
// 			popupId = passedPopup.getAttribute('id');
 			// clear old folders...
 			while (passedPopup.firstChild) {
 				passedPopup.removeChild(passedPopup.firstChild);
			}
			menupopup = passedPopup;
 		}
 		else {
			menupopup = this.createIconicElement('menupopup','*');
 			menupopup.setAttribute('id',popupId);
 		}

		menupopup.setAttribute('position','after_start'); //
		menupopup.className = 'QuickFolders-folder-popup';
		if (isCreate) {
			// if popup is null, we are creating the button - no need to populate the menu as it is being done again on the click / drag event!
			return menupopup;
		}

		util.logDebugOptional("recentFolders","Creating Popup Set for Recent Folders tab");

		// convert array into nsISimpleEnumerator
		let recentFolders,
		    FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray),
		    isOldFolderList = false;
		if (typeof gFolderTreeView=='undefined')
		{
			recentFolders = this.generateMRUlist_Postbox_TB2();
			isOldFolderList = true;
		}
		else {
      // moved out to shim b/c for..of not liked by Postbox
			recentFolders = util.generateMRUlist(gFolderTreeView);
		}

    let debugText = '';
		for (let i = 0; i < recentFolders.length; i++) {
			let f;
			if (isOldFolderList)
				f = recentFolders[i];
			else
				f = recentFolders[i]._folder;
			FoldersArray.appendElement(f, false);
      if (prefs.isDebugOption('recentFolders.detail')) {
        debugText += '\n' + i + '. appended ' +  f.prettyName.padEnd(25, " ") + ' ' + f.URI;
      }
		}
		util.logDebugOptional('recentFolders.detail','Recent Folders Array appended: ' +  debugText);

		// addSubFoldersPopupFromList expects nsISimpleEnumerator, enumerate() convrts the nsIMutableArray
		let isAlphaSorted =  prefs.getBoolPref("recentfolders.sortAlphabetical");
		this.addSubFoldersPopupFromList(FoldersArray.enumerate(), menupopup, isDrag, isAlphaSorted, true);
		util.logDebugOptional('recentFolders','=============================\n'
			+ 'createRecentPopup Finished!');
		return menupopup;
	} ,

	createRecentTab: function createRecentTab(passedPopup, isDrag, passedButton) {
		try {
			QuickFolders.Util.logDebugOptional('recentFolders','createRecentTab( '
				+ ' passedPopup: ' + (passedPopup == null ? 'null' : passedPopup.id)
				+ ', isDrag: ' + isDrag
				+ ', passedButton: ' + (passedButton == null ? 'null' : passedButton.id)
				+ ')');
			let menupopup,
			    isFolderUpdate = false, //	need this to know if we are creating a fresh button (true) or just rebuild the folders menu on click/drag (false)
			    isCurrentFolderButton = (passedButton == null ? false : (passedButton.id=="QuickFolders-Recent-CurrentFolderTool")),
			    button = passedButton ||
					  (document.createXULElement ? document.createXULElement("toolbarbutton") : document.createElement("toolbarbutton"));
			if (!passedButton) {
				isFolderUpdate = true;
				let recentLabel = QuickFolders.Preferences.getBoolPref("recentfolders.showLabel") ?
					this.getUIstring("qfRecentFolders", "Recent Folders") : '';
				button.setAttribute("label", recentLabel);
				button.setAttribute("tag", "#Recent");
				button.id="QuickFolders-Recent";

				// biffState = nsMsgBiffState_Unknown = 2
				this.styleFolderButton(button, 0, 0, 0
					, 'recent' + ((isCurrentFolderButton || QuickFolders.Preferences.isShowRecentTabIcon) ?  ' icon' : '')
					, 0, false, null, null);
				this.buttonsByOffset[0] = button; // currently, hard code to be the first! ([0] was [offset])
				let tabColor = QuickFolders.Preferences.recentTabColor;
				if (tabColor) {
					this.setButtonColor(button, tabColor);
			  }
			}

			menupopup = this.createRecentPopup(passedPopup, isDrag, isFolderUpdate, isCurrentFolderButton);
			this.initElementPaletteClass(button, passedButton);
			if (!isCurrentFolderButton)
				this.menuPopupsByOffset[0] = menupopup;

			if (button.firstChild && button.firstChild.tagName=="menupopup")
				button.removeChild(button.firstChild);

			button.appendChild(menupopup);

			if (!isDrag) {
				// remove last popup menu (if button is reused and not created from fresh!)
				// this needed in minimal rebuild as we reuse the buttons!
				//if (passedPopup)
				//	button.replaceChild(menupopup, passedPopup);

				if (!isCurrentFolderButton)  // the currentfolder recent button has already the correct attributes set by the overlay
				{
					if (button.getAttribute('context') != this.RecentPopupId) { // prevent event duplication
						button.setAttribute('context', this.RecentPopupId);
						button.setAttribute('position','after_start');
						// button.addEventListener("contextmenu", function(event) { QuickFolders.Interface.onClickRecent(event.target, event, false); }, true);
						button.addEventListener("click", function(event) { QuickFolders.Interface.onClickRecent(event.target, event, true); return false; }, false);
						button.addEventListener("dragenter", function(event) { QuickFolders.buttonDragObserver.dragEnter(event); }, false);
						button.addEventListener("dragover", function(event) { QuickFolders.buttonDragObserver.dragOver(event); return false; }, false);
					}
				}
			}
			return button;
		}
		catch(ex) {
			QuickFolders.Util.logException("Exception during createRecentTab: ", ex);
			return null;
		}

	},

	onClickRecent: function onClickRecent(button, evt, forceDisplay) {
		const QI = QuickFolders.Interface,
		      prefs = QuickFolders.Preferences;
		// refresh the recent menu on right click
		evt.stopPropagation();

		if (this.PaintModeActive) {
			let paintButton = this.PaintButton,
			    color = paintButton.getAttribute("colorIndex");
			if (!color) color = 0;
			this.setButtonColor(button, color);
			this.initElementPaletteClass(button);
			QuickFolders.Preferences.setIntPref( 'recentfolders.color',  color)
			return;
		}
		// Thunderbird 52 fix for [Bug 26592] - recent folder clicks not working
		if (button && (button.tagName == 'menuitem' || button.tagName == 'menupopup')) {
			if (prefs.isDebugOption('popupmenus')) debugger;

			let menuitem = button;
			if (menuitem.folder) {
				evt.preventDefault();
				// addSubFoldersPopupFromList is ultimately responsible for creating this menuitems
        QI.onSelectSubFolder(menuitem.folder.URI, evt);
				return;
			}
		}

		if (forceDisplay) {
			// left click: open context menu through code
			this.createRecentTab(null, false, button);
			QI.showPopup(button, this.menuPopupsByOffset[0].id, null); // this.RecentPopupId
		}
	} ,

	onClickRecentCurrentFolderTools: function onClickRecentCurrentFolderTools(button, evt, forceDisplay) {
		// refresh the recent menu on right click
		this.createRecentTab(null, false, button);

		if (forceDisplay) {
			// left click: open context menu through code
			QuickFolders.Interface.showPopup(button, this.RecentPopupIdCurrentFolderTool, null);
		}
	} ,

  // make sure current folder is shown after hitting next (unread) msg
  // in single folder view!
  ensureCurrentFolder: function ensureCurrentFolder() {
    let util = QuickFolders.Util,
        currentFolderTab = document.getElementById('QuickFoldersCurrentFolder'),
        existsMsgDisplay = (typeof gMessageDisplay != 'undefined') ,
        current = !existsMsgDisplay ? null : gMessageDisplay.displayedMessage.folder;
    if (!existsMsgDisplay) {
      let txt = "No gMessageDisplay in current view";
      if (util.Application=='Postbox')
        txt += "\nSorry, but Postbox doesn't support navigation from single message window!";
      util.logToConsole(txt);
      return;
    }
    if (currentFolderTab.folder != current)
      this.initCurrentFolderTab(currentFolderTab, current);
  },

	onClickThreadTools: function onClickThreadTools(button, evt) {
		goDoCommand('cmd_markThreadAsRead');
		evt.stopPropagation();
		goDoCommand('button_next');
    this.ensureCurrentFolder();
	} ,

	onGoPreviousMsg: function onGoPreviousMsg(button, isSingleMessage) {
		if (button.nextSibling.checked)
			goDoCommand('cmd_previousMsg');
		else
			goDoCommand('button_previous');
		if (isSingleMessage) {
      this.ensureCurrentFolder();
    } else
      if (QuickFolders.Util.Application == 'Postbox'
          &&
          QuickFolders.Interface.CurrentTabMode == 'message')
      {
        // See mailWindow.js messagePaneOnClick(event)
        // msgHdrViewOverlay.js   SelectMessageContainer(aContainer);
      }
	} ,

	onGoNextMsg: function onGoNextMsg(button, isSingleMessage) {
		if (button.previousSibling.checked)
			goDoCommand('cmd_nextMsg');
		else
			goDoCommand('button_next');
    // mailTabs.js =>  DefaultController.doCommand(aCommand, aTab);
    // GoNextMessage(nsMsgNavigationType.nextMessage, false);
    // this will eventually call folderDisplay.navigate()
		if (isSingleMessage) {
      this.ensureCurrentFolder();
    } else
      if (QuickFolders.Util.Application == 'Postbox'
          &&
          QuickFolders.Interface.CurrentTabMode == 'message')
      {
        // See mailWindow.js messagePaneOnClick(event)
        // msgHdrViewOverlay.js   SelectMessageContainer(aContainer);
      }
	} ,

	onToggleNavigation: function onToggleNavigation(button) {
		button.checked = !button.checked;
	} ,

	// exit unread folder skip to next...
	onSkipFolder: function onSkipFolder(button) {
		const util = QuickFolders.Util,
				  prefs = QuickFolders.Preferences,
					Ci = Components.interfaces;
		let currentFolder = QuickFolders.Util.CurrentFolder,
				folder;

		if (!util.hasPremiumLicense(false))
			util.popupProFeature("skipUnreadFolder");

		if (prefs.isDebugOption('navigation')) debugger;
		folder = util.getNextUnreadFolder(currentFolder);

		if (folder) {
			util.logDebug("selecting next unread folder:" + folder.prettyName + '\n' + folder.URI);
			QuickFolders_MySelectFolder(folder.URI);
			// we need to jump to the top (first mail) for the
			if (GoNextMessage)
				GoNextMessage(Ci.nsMsgNavigationType.firstMessage, false);
			else
				ScrollToMessage(Ci.nsMsgNavigationType.firstMessage, true, true); // SeaMonkey

			if (currentFolder == folder) { // wrap around case
			  let txt = util.getBundleString("qfNavigationWrapped", "No other unread folders found, continuing in {1}.")
				util.slideAlert("QuickFolders",  txt.replace('{1}', folder.prettyName));
			}
			// find next sibling, of parent, then trigger onGoNextMsg
			// navigation types of nsMsgNavigationType are defined in nsIMsgDBView.idl
			// GoNextMessage is defined  in msgViewNavigation.js
			// GoNextMessage(1, true); // nsMsgNavigationType.firstMessage
			// GoNextMessage(7, true); // nsMsgNavigationType.nextUnreadMessage
			goDoCommand('button_next');
		}
	} ,

	updateQuickFoldersLabel: function updateQuickFoldersLabel() {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util;
		// force label when there are no folders or license is in expired state!
		try {
			let showLabelBox = prefs.isShowQuickFoldersLabel || util.Licenser.isExpired  || (0==QuickFolders.Model.selectedFolders.length),
					quickFoldersLabel = this.TitleLabel,
					qfLabelBox = this.TitleLabelBox;

			quickFoldersLabel.label = prefs.TextQuickfoldersLabel;
			quickFoldersLabel.collapsed = !showLabelBox; // force Renew QuickFolders to be visible!
			if (util.Licenser.isExpired) {
				quickFoldersLabel.classList.add('expired');
				let txtExpired =
				  util.getBundleString('qf.premium.renewLicense.tooltip',"Your license expired {1} days ago")
					.replace("{1}", util.Licenser.ExpiredDays);
				quickFoldersLabel.setAttribute('tooltiptext', txtExpired);
			}
			else {
				quickFoldersLabel.removeAttribute('tooltiptext');
				quickFoldersLabel.classList.remove('expired');
			}
			qfLabelBox.collapsed = !showLabelBox;
			qfLabelBox.style.width = showLabelBox ? "auto" : "0px";
		}
		catch(ex) {
			util.logException("updateQuickFoldersLabel()", ex);
		}
	} ,

	// added parameter to avoid deleting categories dropdown while selecting from it!
	// new option: minimalUpdate - only checks labels, does not recreate the whole folder tree
	updateFolders: function updateFolders(rebuildCategories, minimalUpdate) {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util;
		util.logDebugOptional("interface", "updateFolders(rebuildCategories=" + rebuildCategories + ", minimalUpdate=" + minimalUpdate + ")");
		this.TimeoutID=0;

		let showToolIcon = prefs.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;

		if (this.CogWheelPopupButton)
			this.CogWheelPopupButton.collapsed = !showToolIcon || this.PaintModeActive;
    if (this.ReadingListButton)
      this.ReadingListButton.collapsed = !prefs.isShowReadingList;

    if (this.QuickMoveButton)
      this.QuickMoveButton.collapsed = !prefs.isShowQuickMove;

		if (minimalUpdate)
			this.updateCategoryLayout();

		if (rebuildCategories || prefs.isMinimalUpdateDisabled)
			minimalUpdate = false;

		let sDebug = 'updateFolders(rebuildCategories: ' + rebuildCategories + ', minimal: ' + minimalUpdate +')',
		    toolbar = this.Toolbar,
		    theme = prefs.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName; //  + " chromeclass-toolbar" [Bug 26612]

		this.FoldersBox.className = "folderBarContainer " + theme.cssToolbarClassName; // [Bug 26575]

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += ' - Number of Folders = ' + QuickFolders.Model.selectedFolders.length;

		util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			util.clearChildren(this.FoldersBox, rebuildCategories);

			this.updateQuickFoldersLabel();

			if (rebuildCategories || null==this.CategoryMenu)
				this.updateCategories();
		}


		let offset = 0;

		// Recent Folders tab
		if (prefs.isShowRecentTab) {
			if (minimalUpdate ) {
				offset++;
			}
			else
			{
				let rtab = this.createRecentTab(null, false, null);
				if (rtab) {
					this.FoldersBox.appendChild(rtab);
					offset++;
				}
			}
		}

		let countFolders = 0;
		// force user colors on first updateFolders (no selected Folder yet!)
		if (QuickFolders.Model.selectedFolders.length) {

			let tabStyle = prefs.ColoredTabStyle,
			    isFirst = true,
					invalidCount=0;
			for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if (!this.shouldDisplayFolder(folderEntry))
					continue;

				folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false)
				countFolders++;
				if (!folder) {
					invalidCount++;
				}
				if (!minimalUpdate) {
					// restore invalid folders, too
					button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle, isFirst);
					if (button) {
						if (!folder || typeof folder.server == "undefined")  {
							button.setAttribute('folderURI', folderEntry.uri);
							folderEntry.invalid = true; // add invalid to entry!
						}
						this.buttonsByOffset[offset] = button;
						isFirst = false;
						offset++;
					}
				}
				else {
					// now just update the folder count on the button label, if it changed.
					// button is not newly created. Also it is not recolored.
					if (folder) {
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry, offset, button, null, tabStyle, isFirst, minimalUpdate);
							isFirst = false;
							offset++;
						}
					}
				}
			}

			let sDoneWhat = minimalUpdate ? "refreshed on toolbar [minimalUpdate]." : "rebuilt [minimalUpdate=false].";
			util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
			if (invalidCount)
				util.logDebug("{0} invalid tabs where found!\n Please check with find orphaned tabs tool.".replace('{0}', invalidCount));
		}

		// [Bug 25598] highlight active tab
    if (!minimalUpdate)
      this.lastTabSelected = null;  // reset to force highlight active tab
		this.onTabSelected();

		// current message dragging
		let button = this.MailButton;
		if (button)
			this.setEventAttribute(button, "ondragstart","QuickFolders.messageDragObserver.startDrag(event,true)");

		// current thread dragging; let's piggyback "isThread"...
		// use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
		button = util.$('QuickFolders-CurrentThread');
		if (button)
			this.setEventAttribute(button, "ondragstart","event.isThread=true; QuickFolders.messageDragObserver.startDrag(event,true)");
		if (prefs.isShowCategoryNewCount) {

		}
	} ,

	updateCurrentFolderBar: function updateCurrentFolderBar(styleSheet) {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		function collapseConfigItem(id, isShownSetting, checkParent) {
			let element = util.$(id);
			// safeguard for copied ids (such as button-previous / button-next)
			if (checkParent && element.parentNode.id.indexOf('QuickFolders') < 0)
				return;
			if (element)
				element.setAttribute('collapsed', !prefs.getBoolPref(isShownSetting));
			return element;
		}

		util.logDebugOptional("interface", "updateCurrentFolderBar()");
		try {
			collapseConfigItem("QuickFolders-Close", "currentFolderBar.showClose");
			collapseConfigItem("QuickFolders-currentFolderFilterActive", "currentFolderBar.showFilterButton");
			collapseConfigItem("QuickFolders-Recent-CurrentFolderTool", "currentFolderBar.showRecentButton");
			collapseConfigItem("QuickFolders-currentFolderMailFolderCommands", "currentFolderBar.showFolderMenuButton");
			collapseConfigItem("QuickFolders-currentFolderIconCommands", "currentFolderBar.showIconButtons");
			let repairBtn = collapseConfigItem("QuickFolders-RepairFolderBtn", "currentFolderBar.showRepairFolderButton");
			if (repairBtn && repairBtn.getAttribute('collapsed')=='false')
			  repairBtn.setAttribute('tooltiptext', this.getUIstring("qfFolderRepair","Repair Folder"));

			let toolbar2 = this.CurrentFolderBar;
			if (toolbar2) {
				let theme = prefs.CurrentTheme,
						styleEngine = QuickFolders.Styles,
						ss = styleSheet || this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles'),
						background = prefs.getStringPref('currentFolderBar.background');
				styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools', 'background-image', background, true);

				let mw = util.$('messengerWindow');
				if (mw) {
					let backImage = window.getComputedStyle(mw).getPropertyValue("background-image");
					if (backImage && prefs.getBoolPref('currentFolderBar.background.lightweight')) {
						styleEngine.setElementStyle(ss,'#QuickFolders-PreviewToolbarPanel', 'background-image', backImage);
						styleEngine.setElementStyle(ss,'#QuickFolders-PreviewToolbarPanel', 'background-position', "right top");
						styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools','opacity', '0.98');
					}
					else {
						styleEngine.setElementStyle(ss,'#QuickFolders-PreviewToolbarPanel', 'background-image', 'none');
						styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools','opacity', '1.0');
					}
				}

				// find (and move) button if necessary
				let cF = this.CurrentFolderTab,
				    leftSpace = document.getElementById('QF-CurrentLeftSpacer'),
				    rightSpace = document.getElementById('QF-CurrentRightSpacer');
				leftSpace.setAttribute('flex',prefs.getIntPref('currentFolderBar.flexLeft'));
				rightSpace.setAttribute('flex',prefs.getIntPref('currentFolderBar.flexRight'));

				// add styling to current folder via a fake container
				if (cF && cF.parentNode)
					cF.parentNode.className = theme.cssToolbarClassName;

				// support larger fonts - should have a knock-on effect for min-height
				let fontSize = prefs.ButtonFontSize;
				fontSize = fontSize ? (fontSize+"px") : "11px"; // default size
				toolbar2.style.fontSize = fontSize;
				cF.style.fontSize = fontSize;

				let hideMsgNavigation = !prefs.getBoolPref("currentFolderBar.navigation.showButtons"),
						hideFolderNavigation = !prefs.getBoolPref("currentFolderBar.folderNavigation.showButtons");
						// retired currentFolderBar.navigation.showToggle
				util.logDebugOptional("interface",
          "Current Folder Bar - Collapsing optional Navigation Elements:\n" +
				  "hideMsgNavigation=" + hideMsgNavigation + "\n" +
				  "hideFolderNavigation=" + hideFolderNavigation + "\n"
				);

				for (let n=0; n< toolbar2.children.length; n++)
				{
					let node = toolbar2.children[n],
							special = node.getAttribute('special');
					if (special && special=="qfMsgFolderNavigation") {
						node.collapsed = hideMsgNavigation;
					}
					else if (node.id && node.id.indexOf('QuickFolders-Navigate')==0) {
						// hide QuickFolders-NavigateUp, QuickFolders-NavigateLeft, QuickFolders-NavigateRight
						node.collapsed = hideFolderNavigation;
					}
				}
			}

		}
    catch (ex) {
      util.logException("updateCurrentFolderBar()", ex);
    }

	} ,

	updateCategoryLayout: function updateCategoryLayout() {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util,
					FCat = QuickFolders.FolderCategory,
					model = QuickFolders.Model;
		let cat = this.CategoryMenu,
		    showToolIcon = prefs.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;
		if (prefs.isDebugOption("categories")) debugger;
		if (cat) {
			// don't show if ALWAYS and NEVER are the only ones that are references by tabs
			let catArray = model.Categories,
			    isCustomCat = false;
			for (let i=0; i<catArray.length; i++) {
				if (FCat.isSelectableUI(catArray[i])) {
					isCustomCat = true;
					break;
				}
			}
			cat.style.display = (showToolIcon || isCustomCat) ? '-moz-inline-box' : 'none';
			cat.collapsed = (!isCustomCat);
			if (this.currentActiveCategories && !catArray.includes(this.currentActiveCategories)) {
				// make sure all tabs are visible in case we delete the last category!
				this.selectCategory(FCat.ALL);
			}


			if (prefs.getBoolPref('collapseCategories'))
				cat.classList.add('autocollapse');
			else
				cat.classList.remove ('autocollapse');

	  }
	} ,

	updateCategories: function updateCategories() {
    const util = QuickFolders.Util,
		      model = QuickFolders.Model,
					prefs = QuickFolders.Preferences,
          FCat = QuickFolders.FolderCategory,
					isPostbox = (util.Application=='Postbox') ? true : false;

		util.logDebugOptional("interface", "updateCategories()");

		model.resetCategories(); // delete the categories array
		let bookmarkCategories = model.Categories, // this getter rebuilds the array from model.entries
		    lCatCount = bookmarkCategories ? bookmarkCategories.length : 0,
		    menuList = this.CategoryMenu,
		    menuPopup = menuList.menupopup;
		util.logDebug("updateCategories() - [" + lCatCount + " Categories]");
		if (prefs.isDebugOption("categories")) debugger;

    try {
      if (lCatCount > 0 && menuList && menuPopup) {
				let activeCatsList = this.currentActiveCategories,
				    cats = activeCatsList ? activeCatsList.split('|') : [];
        util.clearChildren(menuPopup,true);

        menuPopup.appendChild(this.createMenuItem(
          FCat.ALL,
          this.getUIstring("qfAll", "(Display All)"),
          'menuitem-iconic'));
        for (let i = 0; i < lCatCount; i++) {
          let category = bookmarkCategories[i];
          if (category!=FCat.ALWAYS && category!=FCat.NEVER) {
            let menuItem = this.createMenuItem(category, category, 'menuitem-iconic'),
                isMultiCategories = prefs.getBoolPref('premium.categories.multiSelect');
            // add checkbox for multiple category selection
            if (isMultiCategories) {
							// multi selection
							if (cats.includes(category))
								menuItem.setAttribute("checked", true);
							if (isPostbox)
								menuItem.setAttribute("type","checkbox");
            }
            menuPopup.appendChild(menuItem);
          }
        }
				// iterate all entries to see if we have any uncategorized / show never types:
				let isUncat = false,
				    isNever = false;
				for (let i = 0; i < model.selectedFolders.length; i++) {
					// test mail folder for existence
					let folderEntry = model.selectedFolders[i];
					if (folderEntry.category == FCat.NEVER)
						isNever = true; // at least one folder alias exists
					if (!folderEntry.category)
						isUncat = true; // at least one folder without category exists
				}

				/* the following category items are only shown when necessary */
				if (isUncat || isNever) {
					menuPopup.appendChild(this.createIconicElement('menuseparator','*'));
				}
				if (isUncat) {
					let s = this.getUIstring("qfUncategorized","(Uncategorized)");
					menuPopup.appendChild(this.createMenuItem(FCat.UNCATEGORIZED , s, 'menuitem-iconic'));
				}
				if (isNever) {
					let s = this.getUIstring("qfShowNever","Never Show (Folder Alias)");
					menuPopup.appendChild(this.createMenuItem(FCat.NEVER, s, 'menuitem-iconic'));
				}

        menuList.value = activeCatsList || FCat.ALL; // revise this for MULTI SELECTS
      }
      else {
        util.logDebug("No Categories defined, hiding Categories box.");
      }
    }
    catch (ex) {
      util.logException("updateCategories()", ex);
    }
		QuickFolders.Interface.updateCategoryLayout(); // hide or show.
	} ,

	// moved from options.js!
	updateMainWindow: function updateMainWindow(minimal) {
		function logCSS(txt) {
			util.logDebugOptional("css", txt);
		}
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;

		if (prefs.isDebugOption('interface.update')) debugger;
		logCSS("============================\n" + "updateMainWindow…");
		let themeSelector = document.getElementById("QuickFolders-Theme-Selector");

		// update the theme type - based on theme selection in options window, if this is open, else use the id from preferences
		prefs.CurrentThemeId = themeSelector ? themeSelector.value : prefs.CurrentThemeId;
		let style =  prefs.ColoredTabStyle,
		    // refresh main window
		    mail3PaneWindow = util.getMail3PaneWindow();
		// we need to try and get at the main window context of QuickFolders, not the prefwindow instance!
		if (mail3PaneWindow) {
			let QI = mail3PaneWindow.QuickFolders.Interface;
      if (!minimal) {
        logCSS("updateMainWindow: update Folders…");
        QI.updateFolders(true, false);
      }
			logCSS("updateMainWindow: update User Styles…");
			QI.updateUserStyles();
		}
		else {
			logCSS("updateMainWindow: no mail3PaneWindow found!");
		}
    if (QuickFolders.bookmarks) {
      QuickFolders.bookmarks.load();
      util.logDebug ('bookmarks.load complete.');
    }
		return true;
	} ,

	deleteFolderPrompt: function deleteFolderPrompt(folderEntry, withCancel, check, remaining) {
		let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
													.getService(Components.interfaces.nsIPromptService),
		    flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
								prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;
		if (withCancel)
			flags += prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_CANCEL;
		let noCheckbox = {value: false};
		// button = prompts.confirmEx(null, "Title of this Dialog", "What do you want to do?",
													 // flags, "button 0", "Button 1", "button 2", "check message", let check = {value: false});
		let text = folderEntry.name + this.getUIstring('qfThisTabIsInvalid',': This points to an invalid folder:') + '\n'
									+ folderEntry.uri + '\n'
									+ this.getUIstring('qfTabDeletePrompt', "Delete this Tab?"),
				checkText = check ?
				              this.getUIstring('qfTabDeleteOption', "Do this with the remaining {0} folders.").replace("{0}", remaining) :
										  null;

		let answer = prompts.confirmEx( null,
																		"QuickFolders",
																		text,
																		flags,
																		'', '', '',
																		checkText,
																		check || noCheckbox);
		switch (answer) {
			case 0: // Yes
				QuickFolders.Model.removeFolder(folderEntry.uri, false); // do not store this yet!
				return 1;
			case 1: // No - skip this one
				return 0;
			case 2: // Cancel  - undo all changes
				QuickFolders.Preferences.loadFolderEntries();
				this.updateFolders(true, false);
				return -1;
		}

	} ,

	// find orphaned tabs
	tidyDeadFolders: function tidyDeadFolders() {
    const util = QuickFolders.Util,
		      model = QuickFolders.Model;
		util.logDebugOptional("interface", "tidyDeadFolders()");
		let countTabs=0,
		    countDeleted=0,
		    sMsg = this.getUIstring('qfTidyDeadFolders',
			'This will remove the Tabs that have no valid folders assigned.\nThis sometimes happens if a folder is removed without QuickFolders being notified.');
		if (!confirm(sMsg))
			return;
		let isCancel = false,
		    check = {value: false},
				isContinue = false,
				lastAnswer = 0,
				countOrphans = 0,
				countRemaining,
				backupTabs = [],
				isRollback = false;

		// tally up everything
		for (let i = 0; i < model.selectedFolders.length; i++) {
			// test mail folder for existence
			let folderEntry = model.selectedFolders[i],
			    folder = null;
			backupTabs.push (folderEntry);
			try {
				folder = model.getMsgFolderFromUri(folderEntry.uri, false);
			}
			catch(ex) {
				;
			}
			if (!folder || !util.doesMailFolderExist(folder))
				countOrphans++;
		}
		countRemaining = countOrphans;


		for (let i = 0; i < model.selectedFolders.length; i++) {
			// test mail folder for existence
			let folderEntry = model.selectedFolders[i],
			    folder = null;
			try {
				folder = model.getMsgFolderFromUri(folderEntry.uri, false);
			}
			catch(ex) {
				util.logException('GetMsgFolderFromUri failed with uri:' + folderEntry.uri, ex);
			}
			countTabs++;

			if (!folder || !util.doesMailFolderExist(folder)) {
				if (!isContinue)
					lastAnswer = this.deleteFolderPrompt(folderEntry, true, check, countRemaining);
				switch (lastAnswer) {
				  case 1:  // deleted
					  if (isContinue) // delete the remaining ones:
							model.removeFolder(folderEntry.uri, false);
						if (check.value) isContinue = true;
					  countDeleted++;
						// update UI
						this.updateFolders(true, false);
						i--; // array is spliced, so we need to go back one!
					  break;
					case 0:  // not deleted
					  if (check.value) isContinue = true;
					  break;
					case -1: // cancelled
					  return;
				}
				countRemaining--;
			}
		}

		if (countDeleted > 0) {
			if (confirm(this.getUIstring('qfSavePrompt', 'Save these changes?'))) {
				QuickFolders.Preferences.storeFolderEntries(model.selectedFolders);
				this.updateFolders(true, false); // show this on screen
			}
			else {
				// restore model
				util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(backupTabs);
				countDeleted = 0;
				isRollback = true;
			}
		}
		// restore / cancel refreshes the toolbar so no need for displaying a summary.
		if (countDeleted || !isRollback) {
			let sLabelFound = this.getUIstring('qfDeadTabsCount', '# dead tabs found:'),
					sLabelDeleted = this.getUIstring('qfDeadTabsDeleted', '# dead tabs removed:'),
					sResults = sLabelFound + ' ' + countOrphans + '\n';
			if (countDeleted)
				sResults +=  sLabelDeleted + ' ' + countDeleted;
			Services.prompt.alert(null,"QuickFolders", sResults);
		}
	} ,


	testTreeIcons: function testTreeIcons() {
    const util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					Cc = Components.classes,
          Ci = Components.interfaces;
		util.logDebug("testTreeIcons()…");
		try {
			const winType = "global:console";
			prefs.setBoolPref("debug.folderTree.icons",true);
			// Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).clear();
			toOpenWindowByType(winType, "chrome://console2/content/console2.xhtml");  //TODO chrome://console2/content/console2.xhtml does not exist??
			let win = Services.wm.getMostRecentWindow(winType);
			// win.clearConsole();
		}
		catch(e) {util.logException("testTreeIcons - ", e);}

		setTimeout(function() {
			const separator = "==============================\n";
			let f = 0, affected = 0;
			util.logDebug(separator + "loading Dictionary…");
			//let allFolders = util.allFoldersIterator(false);
			util.logDebug(separator + "Iterating all folders…");
			for (let folder of util.allFoldersIterator(false)) {
				//let folder = allFolders[i];
				let folderIcon = folder.getStringProperty("folderIcon"),
						iconURL =folder.getStringProperty("iconURL");
				if (folderIcon || iconURL) {
					affected++;
					util.logDebug(folder.prettyName + "\nfolderIcon: " + folderIcon + "\niconURL: " + iconURL);
				}
				f++;
				// folder.setForcePropertyEmpty("folderIcon", false); // remove property
			}
			util.logDebug(separator + "…testTreeIcons() ENDS\nIterated " + f + " folders with " + affected + " having a folderIcon property.\n" + separator);
		},200);


	},
	// workaround for [Bug 26566]
  repairTreeIcons: function repairTreeIcons(silent) {
    // repair all tree icons based on Tab Icons
    // does not need to be high performance, hence we do file check synchronously
    const util = QuickFolders.Util,
          Cc = Components.classes,
          Cu = Components.utils,
          Ci = Components.interfaces,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile,
          model = QuickFolders.Model,
          ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
					{OS} = (typeof ChromeUtils.import == "undefined") ?
						Cu.import("resource://gre/modules/osfile.jsm", {}) :
						ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

    let missingIcons = [],
        ctRepaired = 0, ctMissing = 0;
		util.logDebugOptional("interface", "repairTreeIcons()");

		for (let i = 0; i < model.selectedFolders.length; i++) {
			// test mail folder for existence
			let folderEntry = model.selectedFolders[i],
			    folder = null,
          earlyExit = false;
      if (!folderEntry.icon)
        continue;
			try {
				folder = model.getMsgFolderFromUri(folderEntry.uri, false);
        let fileSpec = folderEntry.icon,
            path = OS.Path.fromFileURI(fileSpec),
            localFile = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			  localFile.initWithPath(path);
			  if (!localFile.exists())  {
          missingIcons.push({path:path, name:this.folderPathLabel(1, folder, 2)} );
          ctMissing++;
          if (folder) {
            folder.setStringProperty("folderIcon", "noIcon");
            folder.setStringProperty("iconURL", "");
            folder.setForcePropertyEmpty("folderIcon", false); // remove property
          }
          // button update is unnecessary as the icon is not shown anyway
          model.setTabIcon (null, folderEntry, '');
          continue;
        }
        if (fileSpec && folder) {
					localFile = null; // in case this locks the file?
          let uri = ios.newURI(fileSpec, null, null);
          QuickFolders.FolderTree.setFolderTreeIcon(folder, uri);
          ctRepaired++;
        }
        if (earlyExit) return;
			}
      catch(ex) {
        util.logException("repairTreeIcons", ex);
      }
    }
    if (missingIcons.length) {
      let list = '';
      for (let i=0; i<missingIcons.length; i++) {
        list += '\n' + missingIcons[i].name + '  =  ' + missingIcons[i].path;
      }
      let txt = util.getBundleString('qfRepairTreeIconsMissing', 'The following icon files do not exist:');
			if (!silent)
				util.alert(txt + '\n' + list);
			else
				util.logToConsole("QuickFolders\n" + txt + '\n' + list);
    }
    let repairedTxt = util.getBundleString('qfTreeIconsRepairedCount', '{0} tree icons repaired'),
        invalidTxt = util.getBundleString('qfTreeIconsInvalidCount', '{0} icons missing'),
        msg = repairedTxt.replace('{0}', ctRepaired) + '\n'
            + invalidTxt.replace('{0}', ctMissing);
		if (!silent)
			util.slideAlert('repairTreeIcons()', msg);
    // store icons in entry
    if (ctMissing)
      model.store();
  } ,

	createMenuItem: function createMenuItem(value, label, className) {
		let menuItem = this.createIconicElement('menuitem', className || '*');
		menuItem.setAttribute("label", label);
		menuItem.setAttribute("value", value);
    if (typeof className !== 'undefined')
      menuItem.className = className;

		return menuItem;
	} ,

  _selectedCategories: null,
	get currentActiveCategories() {
    return this._selectedCategories;
  } ,
  set currentActiveCategories(v) {
		const util = QuickFolders.Util;
    this._selectedCategories = v; // set menuitem value?
    let menulist = this.CategoryMenu,
        cats = v.split('|'),
				txtDebug = '';
		try {
			if (menulist) {
				menulist.value = v;
				// if multiple select, check all boxes
				for (let i=0; i<menulist.itemCount; i++) {
					let it = menulist.getItemAtIndex(i),
							isSelected = (cats.includes(it.value));
					if (isSelected) {
						txtDebug += 'Check menuitem: ' + it.value + '\n';
						it.setAttribute('checked', isSelected); // check selected value
					}
					else {
						it.removeAttribute('checked');
					}
				}
			}
			util.logDebugOptional('categories','set currentActiveCategories()\n' + txtDebug);
			if (v!=null)
				QuickFolders.Preferences.lastActiveCats = v; // store in pref
		}
		catch (ex) {
			util.logException('Error in setter: currentActiveCategories', ex);
		}
  } ,

	get CurrentlySelectedCategories() {
    const FCat = QuickFolders.FolderCategory;
		if (this.currentActiveCategories == FCat.ALL || this.currentActiveCategories == FCat.UNCATEGORIZED ) {
			return null;
		}
		else {
			return this.currentActiveCategories;
		}
	} ,

	// Postbox specific: build a string script for restoring tab categories
  restoreSessionScript	: function restoreSessionScript() {
    const util = QuickFolders.Util;
		let tabmail = document.getElementById("tabmail"),
		    tabInfoCount = util.getTabInfoLength(tabmail),
				restoreScript = '';
		for (let i = 0; i < tabInfoCount; i++) {
			let info = util.getTabInfoByIndex(tabmail, i);
			if (info && util.getTabMode(info) == util.mailFolderTypeName) {
			  // found a folder tab, with categories
				let cats = info.QuickFoldersCategory;
				if (cats) {
					// escape any single quotes in category string:
					let escaped = cats.replace(/\\([\s\S])|(')/g, "\\$1$2");
					restoreScript += "QuickFolders.Interface.restoreCategories(" + i + ", '" + escaped + "');";
				}
			}
		}
		return restoreScript;
	} ,

	// this is used on session restore currently only by Postbox
	restoreCategories: function restoreCategories(tabIndex, categories) {
    const util = QuickFolders.Util;
		let tabmail = document.getElementById("tabmail"),
		    info = util.getTabInfoByIndex(tabmail, tabIndex);
		info.QuickFoldersCategory = categories;
		let tab = (util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;
		if (tab == info) {
			// current Tab:
			QuickFolders.Interface.selectCategory(categories, false);
		}
	} ,

	// For Category Session persistance,
	// we have to overwrite tab.mode.persistTab || tab.mode.tabType.persistTab
	// persistFunc has 2 parameters:  tabState = persistFunc.call(tab.mode.tabType, tab);
	// see implementation in http://mxr.mozilla.org/comm-central/source/mail/base/content/mailTabs.js#166
	// mailTabType.modes["folder"].persistTab -> needs to point to our own wrapper function.
	// mailTabType.modes["folder"].restoreTab -> needs to point to our own wrapper function.
  // dropdown = if this is passed we can now set the checkbox and select multple categories or just one
  //            depending on the exact click target; also fill event
  // return true if updateFolders was called.
	selectCategory: function selectCategory(categoryName, rebuild, dropdown, event) {
    const util = QuickFolders.Util,
					QI = QuickFolders.Interface,
          FCat = QuickFolders.FolderCategory,
					prefs = QuickFolders.Preferences,
					isShift = (event && event.shiftKey) || false;
    util.logDebugOptional("categories", "selectCategory(" + categoryName + ", " + rebuild + ")");
		// early exit. category is selected already! SPEED!
    if (QI.currentActiveCategories == categoryName)
      return false;
    // QI.currentActiveCategories = categoryName ? categoryName : FCat.UNCATEGORIZED ;
		if (categoryName == FCat.ALWAYS) // invalid
			return false;
		// add support for multiple categories
		let cats = categoryName ? categoryName.split('|') : FCat.UNCATEGORIZED,  // QI.currentActiveCategories
				currentCats = QI.currentActiveCategories ? (QI.currentActiveCategories.split('|')) : [],
		    idx = 0,
				multiEnabled = prefs.getBoolPref('premium.categories.multiSelect');
    if (multiEnabled && isShift) {
			let selectedCat = cats[0];
			if (currentCats.includes(selectedCat)) {
				currentCats.splice(currentCats.indexOf(selectedCat), 1);
				util.logDebugOptional("categories", "Removing Category: " + selectedCat + "…");
				QI.currentActiveCategories = currentCats.join('|');
			}
			else {
				util.logDebugOptional("categories", "Adding Category: " + selectedCat + "…");
				QI.currentActiveCategories =
 				  QI.currentActiveCategories ? (QI.currentActiveCategories + '|' + selectedCat) : selectedCat;
			}
		}
    else {
			let selectedCats = (cats.length>1 && !multiEnabled) ? cats[0] : categoryName;
			util.logDebugOptional("categories","Selecting Categories: " + selectedCats + "…");
			// if multiple categories is not enabled only select first one.
			QI.currentActiveCategories = selectedCats;
		}
		QI.updateFolders(rebuild, false);
    // ###################################
    QI.lastTabSelected = null;
    QI.onTabSelected(); // update selected tab?
    // this.styleSelectedTab(selectedButton);

		try {
			let cs = document.getElementById('QuickFolders-Category-Selection');
			cs.setAttribute('label', QI.currentActiveCategories.split('|').join(' + '));
		}
		catch(ex) {
			util.logException('Setting category label:',ex);
		}

		try {
			// store info in tabInfo, so we can restore it easier later per mail Tab
			let tabmail = document.getElementById("tabmail");
			idx = QuickFolders.tabContainer.selectedIndex || 0;
			// let's only store this if this is the first tab...
			let tab = util.getTabInfoByIndex(tabmail, idx), // in Sm, this can return null!
			    tabMode = util.getTabMode(tab);
			if (tab &&
			    (tabMode == util.mailFolderTypeName || tabMode == "message")) {
				tab.QuickFoldersCategory = QI.currentActiveCategories; // store list!
				// setTabValue does not exist (yet)
				//if (sessionStoreManager.setTabValue)
				//	sessionStoreManager.setTabValue(tab, "QuickFoldersCategory", selectedCat);
				//
			}
		}
		catch(e) {
		  util.logDebugOptional("listeners.tabmail"," selectCategory failed; " + e);
		}
		util.logDebugOptional("categories", "Successfully selected Category: " + QI.currentActiveCategories + " on mail tab [" + idx + "]");
    return true;
	} ,

  // is the Tab currently visible, based on current Category selection?
	shouldDisplayFolder: function shouldDisplayFolder(folderEntry) {
    const FCat = QuickFolders.FolderCategory;
		let currentCat = this.currentActiveCategories,
        folderCat = folderEntry.category;
		try {
      if (folderCat == FCat.NEVER) {
        if (currentCat == FCat.NEVER) return true; // shows all Aliases
        return false; // otherwise hide!
      }
			if (currentCat == FCat.NEVER && folderCat != FCat.NEVER) {
				return false;
			}
			if (currentCat == null || currentCat == FCat.ALL) {
				return true;
			}
			else if (currentCat == FCat.UNCATEGORIZED  && !folderCat) {
				return true;
			}
			else if (folderCat
					&& folderCat == FCat.ALWAYS
					&& currentCat != FCat.UNCATEGORIZED )
				return true;
			else if (!folderCat)
				return false;
			else {
        let cats = currentCat.split("|"); // allow multiple categories
        for (let c=0; c<cats.length; c++) {
          if (folderCat.split('|').indexOf(cats[c]) >= 0)
            return true
        }
				return false;  // check if its in the list
      }
		}
		catch (e) {
			QuickFolders.Util.logDebug("shouldDisplayFolder caught error: " + e);
			return true;
		}
	} ,

	windowKeyPress: function windowKeyPress(e,dir) {
    function logEvent(eventTarget) {
			try {
				util.logDebugOptional("events", "KeyboardEvent on unknown target"
					+ "\n" + "  id: " + (eventTarget.id || '(no id)')
					+ "\n" + "  nodeName: " + (eventTarget.nodeName || 'null')
					+ "\n" + "  tagName: "  + (eventTarget.tagName || 'none'));
			}
			catch (e) {;}
    }
		function logKey(event) {
			if (!prefs.isDebugOption('events.keyboard')) return;
      util.logDebugOptional("events.keyboard",
				(isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') +
			  "charcode = " + e.keyCode + " = "  + (String.fromCharCode(e.keyCode)).toLowerCase() + "\n" +
        "keyCode = " + e.keyCode);
		}
    const QI = QuickFolders.Interface,
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					tabmode = QuickFolders.Interface.CurrentTabMode;
		let isAlt = e.altKey,
		    isCtrl = e.ctrlKey,
		    isShift = e.shiftKey,
        eventTarget = e.target,
        isHandled = false,
				isShortcutMatched = false;

    // Ctrl+Alt+F for refresh, should always work.
		if ((tabmode == 'message' || tabmode == 'folder' || tabmode == '3pane')
        &&
        isCtrl && isAlt && dir!='up' && prefs.isUseRebuildShortcut) {
			if ((String.fromCharCode(e.keyCode)).toLowerCase() == prefs.RebuildShortcutKey.toLowerCase()) {
				this.updateFolders(true, false);
				try {
					util.logDebugOptional("events", "Shortcuts rebuilt, after pressing "
					    + (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '')
					    + prefs.RebuildShortcutKey);
					util.showStatusMessage('QuickFolders tabs were rebuilt', true);
				} catch(e) {;};
			}
		}

    // shortcuts should only work in thread tree, folder tree and email preview (exclude conversations as it might be in edit mode)
    let tag = eventTarget.tagName ? eventTarget.tagName.toLowerCase() : '';
    if (   eventTarget.id != 'threadTree'
        && eventTarget.id != 'folderTree'
        && eventTarget.id != 'accountTree'
        && (
          (tag
            &&
            (tag == 'textarea'  // Postbox quick reply
            ||
            tag == 'textbox'    // any textbox
            ||
            tag == 'input'      // Thunderbird 68 textboxes.
						||
						tag == 'html:input'      // Thunderbird 78 textboxes.
						||
            tag == 'search-textbox' // Thunderbird 78 search boxes 
            ||
						tag == 'findbar')   // [Bug 26654] in-mail search
          )
					||
					(eventTarget.baseURI
					  &&
					 eventTarget.baseURI.toString().lastIndexOf("chrome://conversations",0)===0) // Bug 26202. replaced startswith
				)
       )
    {
      logEvent(eventTarget);
      return;
    }



		// tag = body for CTRL+F (in mail search)

		if (tabmode == 'message' || tabmode == 'folder' || tabmode == '3pane' || tabmode == 'glodaList') {
			logKey(e);
      let QuickMove = QuickFolders.quickMove;
      if (util.hasPremiumLicense(false)) {
				let isShiftOnly = !isAlt && !isCtrl && isShift && dir!='up',
            isNoAccelerator = !isAlt && !isCtrl && !isShift && dir!='up',
				    theKeyPressed = (String.fromCharCode(e.keyCode)).toLowerCase();
				util.logDebugOptional("premium.quickJump", "hasPremiumLicense = true\n" +
				  "quickJump Shortcut = " + prefs.isQuickJumpShortcut + ", " + prefs.QuickJumpShortcutKey + "\n" +
				  "quickMove Shortcut = " + prefs.isQuickMoveShortcut + ", " + prefs.QuickMoveShortcutKey + "\n" +
					"Key Pressed: [" + theKeyPressed + "]");

        /** [SHIFT-]J  Jump to Folder **/
        if ((isShiftOnly || isNoAccelerator) && prefs.isQuickJumpShortcut) {
          let requireShift = prefs.isQuickJumpShift;
          if (theKeyPressed == prefs.QuickJumpShortcutKey.toLowerCase()
              && (isShiftOnly && requireShift || !isShiftOnly && !requireShift)
              ) {
						isShortcutMatched = true;
            logEvent(eventTarget);
            if (QuickMove.isActive && QuickMove.hasMails) {
              if (!QuickMove.suspended)
                QuickMove.toggleSuspendMove(); // suspend move to jump; also reflect in menu.
              QuickMove.suspended = true; // for safety in case previous UI operation goes wrong
            }
            QuickFolders.Interface.findFolder(true, 'quickJump');
            isHandled = true;
          }
        }
				else
					util.logDebugOptional("premium.quickJump","jump conditions not fullfilled");

        /** [SHIFT-]M  Move to Folder **/
        /** [SHIFT-]T  Copy to Folder **/
        /** SHIFT-S  Skip Folder **/
        if ((isShiftOnly || isNoAccelerator) && !isHandled) {
          let ismove = (theKeyPressed == prefs.QuickMoveShortcutKey.toLowerCase()),
              iscopy = (theKeyPressed == prefs.QuickCopyShortcutKey.toLowerCase());
          if (ismove && prefs.isQuickMoveShortcut
              ||
              iscopy && prefs.isQuickCopyShortcut) {
            let requireShift = (ismove && prefs.isQuickMoveShift) || (iscopy && prefs.isQuickCopyShift);
						isShortcutMatched = (isShiftOnly && requireShift || !isShiftOnly && !requireShift);
            if (isShortcutMatched) {
              logEvent(eventTarget);
              QuickMove.suspended = false;
              // QuickFolders.Interface.findFolder(true);
              if (tabmode == 'message') {
                // first let's reset anything in the quickMove if we are in single message mode:
                QuickMove.resetList();
              }
              let messageUris  = util.getSelectedMsgUris();
              if (messageUris) {
                let currentFolder = util.CurrentFolder;
                while (messageUris.length) {
                  QuickMove.add(messageUris.pop(), currentFolder, iscopy);
                }
                QuickMove.update();
              }
              isHandled = true;
            }
          }
					else {
						if (isShiftOnly && prefs.isSkipFolderShortcut && (theKeyPressed == prefs.SkipFolderShortcutKey.toLowerCase())) {
							QuickFolders.Interface.onSkipFolder();
							isHandled = true;
						}
					}
        }

      }
			else {
				util.logDebugOptional("premium.quickJump", "hasPremiumLicense returned false");
			}
    } // quickMove / quickJump

    if (tabmode == 'folder' || tabmode == '3pane') { // only allow these shortcuts on the 3pane window!
      if (!isCtrl && isAlt && (dir != 'up') && prefs.isUseNavigateShortcuts) {
        // Alt + Left
        if (e.keyCode == 38) { // ALT + up
          this.goUpFolder();
          isHandled = true;
        }

        if (e.keyCode == 37) { // ALT + left
          if (!this.goPreviousQuickFolder())
            this.goPreviousSiblingFolder();
          isHandled = true;
        }

        if (e.keyCode == 39)  { // ALT + right
          if (!this.goNextQuickFolder())
            this.goNextSiblingFolder();
          isHandled = true;
        }

        if (e.keyCode == 40)  { // ALT + down
				  let f = util.CurrentFolder;
					if (f) {
						// let folderEntry = QuickFolders.Model.getFolderEntry(f.URI);
						let btn = QI.getButtonByFolder(f);
						if (!btn) {
							// trigger the context menu of current folder button, if it  is on screen
							let toolpanel = document.getElementById("QuickFolders-CurrentFolderTools");
							if (toolpanel && toolpanel.parentNode.style["display"]!="none") {
								btn = document.getElementById('QuickFoldersCurrentFolder');
							}
						}
						if (btn) {
							let popupId = btn.getAttribute('popupId');
							if (popupId) { // linux avoid this getting triggered twice
								let activePopup = document.getElementById(popupId);

								if (document.getElementById(popupId))
								// show only subfolders, without commands!
								QI.showPopup(btn, popupId, null, true); // leave event argument empty
							}
							else {
								if (btn.hasContextListener) {
									let event = document.createEvent('mouseevent');
                  event.QFtype="NavDown"; // use this to signal popup menu to focus on first subfolder
									event.initEvent('contextmenu', true, true);
									btn.dispatchEvent(event);
								}
							}
						}
					}
				  isHandled = true;
				}


      }

      if (prefs.isUseKeyboardShortcuts) {
        let shouldBeHandled =
          (!prefs.isUseKeyboardShortcutsCTRL && isAlt)
          ||
          (prefs.isUseKeyboardShortcutsCTRL && isCtrl);

        if (shouldBeHandled) {
          let sFriendly = (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') + e.keyCode + " : code=" + e.keyCode,
              shortcut = -1;
          util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
          if (dir == 'up')
            shortcut = e.keyCode-48;
          if (dir == 'down')
            shortcut = e.keyCode-48;

          if (shortcut >= 0 && shortcut < 10) {
            isHandled = true;
            if (dir == 'down') return;
            if(shortcut == 0) {
              shortcut = 10;
            }

            //alert(shortcut);
            let offset = prefs.isShowRecentTab ? shortcut+1 : shortcut,
                button = this.buttonsByOffset[offset - 1];
            if(button) {
              if(isShift)
                MsgMoveMessage(button.folder);
              else
                this.onButtonClick(button,e,false);
            }
          }
        }
      }
    }
    if (isHandled) {
      e.preventDefault();
      e.stopPropagation();
    }
		else if (isShortcutMatched) {
			util.logDebugOptional("events.keyboard", "quickJump / quickMove Shortcut was matched but not consumed.\n"
			  + "suspended=" + QuickFolders.quickMove.suspended);
		}
	} ,

	getButtonByFolder: function getButtonByFolder(folder) {
		for (let i = 0; i < this.buttonsByOffset.length; i++) {
			let button = this.buttonsByOffset[i];
			try {
				// doesn't work for search folders?
				if(button.folder && button.folder.URI == folder.URI) {
					return button;
				}

			}
			catch(e) {
				QuickFolders.Util.logDebug("getButtonByFolder: could not match " + button.folder.URI + " error: " + e);
			}
		}

		return null;
	} ,

	toggleToolbar: function toggleToolbar(button) {
		QuickFolders.Util.logDebugOptional("interface", "toggleToolbar(" + button.checked + ")");
		let toolbar = this.Toolbar,
		    // toolbar.style.display = '-moz-inline-box';
		    makeVisible = !(toolbar.collapsed);
		toolbar.setAttribute('collapsed', makeVisible);
		button.checked = !makeVisible;
		return makeVisible;
	} ,

	get SpecialToolbar() {
		return QuickFolders.Util.$('Quickfolders-SpecialTools');
	} ,

	endsWith: function endsWith(sURI, sFolder) {
		if (sFolder.length == sURI.length - sURI.indexOf(sFolder))
			return true;
		return false;
	} ,

	// to fix positioning problems, we replace context with popup
	showPopup: function(button, popupId, evt, noCommands) {
    // If the evt argument is given, we know that a QuickFolder Tab was clicked
    // we can now refresh the popup menu!
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface,
					prefs = QuickFolders.Preferences;
    let folder = button ? (button.folder || null)  : null;
    if (evt) {
      let evtText;
      try {
        let cT = evt.currentTarget, // .QueryInterface(Components.interfaces.nsIDOMElement), // investigate nsIDOMXULElement;
            targetText = '';
        if (cT) {
          targetText = '{tagName=' + cT.tagName + ', id=' + cT.id + ', className=' + cT.className + ', lbl=' + cT.getAttribute('label') +'}';
        }
        else
          targetText = evt.currentTarget;

        evtText = "type = " + evt.type +
				          ", \n  evt = [screenX: " + evt.screenX + "   screenY: " + evt.screenY  + "   clientX: " + evt.clientX +
                  "\n         currentTarget: " + targetText + "]";
      }
      catch(ex) {
        evtText = evt;
        util.logDebugOptional("interface,popupmenus", ex.toString());
      }
      util.logDebugOptional("interface,popupmenus",
        "showPopup(\n  btn =" + (button ? (button.id || "[anon] " + button.label) : "none") +
                ", \n  popupId = " + popupId +
                ", \n  URI = " + (folder ? folder.URI : "?") +
                ", \n  " + evtText +
								", \n  noCommands=" + noCommands + ")" );
      if (folder && !(button && button.id == 'QuickFoldersCurrentFolder')) {
        let entry = QuickFolders.Model.getFolderEntry(folder.URI),
            offset = -1; // ignore this but try to reuse the popup object
        for (let o=0; o<QI.buttonsByOffset.length; o++) {
          if (button == QI.buttonsByOffset[o]) {
            offset = o;
            break;
          }
        }
        if (!popupId || popupId=="undefined")
					popupId = QI.makePopupId(folder, button.id);

        evt.stopPropagation();
        util.logDebugOptional("interface",
          "addPopupSet(" + popupId + ", " + folder.prettyName + ", " + entry + ", o= " + offset + ", " + button.id ? button.id : button +", noCommands=" + noCommands + ")");
        QI.addPopupSet( {popupId:popupId, folder:folder, entry:entry, offset:offset, button:button, noCommands:noCommands, event:evt} );
      }
    }
    else
      util.logDebugOptional("interface,popupmenus", "showPopup(" + button.id + ", " + popupId + ", NO EVENT)");

		let p = button.ownerDocument.getElementById(popupId);
		if(!p) p=button.firstChild;

		if (p) {
			document.popupNode = button;
			// If CTRL key is pressed while clicking the QF tab we hoist up all commands from the #quickFoldersCommands menuPopup
			// by attaching it as button's firstChild
			if (evt && evt.ctrlKey) {
				// only show the QuickFolders Commands menu
				// need to find first child menu
				// see if cloned menu is there already.
				let menupopup = null,
				    nodes  = button.getElementsByTagName('menupopup');

				for (let i=0; i<nodes.length; i++) {
					if (nodes[i].getAttribute('tag')=== 'quickFoldersCommands') {
						menupopup = nodes[i];
						break;
					}
				}

				if (!menupopup) {
					nodes = p.getElementsByTagName('menu');
					// debugger;
					for (let i=0; i<nodes.length; i++) {
						if(nodes[i].id == 'quickFoldersCommands') {
							nodes = nodes[i].getElementsByTagName('menupopup');
							menupopup = nodes[0]; // .cloneNode(true); // Get first menupop = QuickFolders Commands // omit cloning!
							// menupopup.classList.add( 'QuickFolders-folder-popup'); // retain styling
							menupopup.folder = button.folder;
							menupopup.setAttribute('tag', 'quickFoldersCommands');
							button.appendChild(menupopup);
							break;
						}
					}
				}
				if (menupopup) {
					menupopup.id = "QuickFoldersCommandsOnly"; // for debugging purposes
					let mps = menupopup.getElementsByTagName('menupopup');
					if (mps.length) {
						// add event handler for color commands (for some reason color submenu stops working otherwise)
						this.setEventAttribute(mps[0], 'onclick',"QuickFolders.Interface.clickHandler(event,this);");
						this.setEventAttribute(mps[0], 'oncommand',"QuickFolders.Interface.clickHandler(event,this);");
					}
          // [Bug 26703] add folder command popup if it was hidden
          let nodes = p.children;
          for (let i=0; i<nodes.length; i++) {
            if(nodes[i].id == 'quickFoldersMailFolderCommands') {
              menupopup.insertBefore(nodes[i], menupopup.firstChild);
              break;
            }
          }
          p = menupopup;
				}

			} // CTRL KEY HELD

			if (!p) {
				debugger;
				return;
			}

			// debug menu items (only visible if SHIFT held during click.)
			if (popupId=="QuickFolders-ToolbarPopup" && evt) {
				// find all menu items with class "dbgMenu" and uncollapse them
				let nodes = p.children;
				//debugger;
				if (!nodes) {
					debugger;
				//	return;
				}
						for (let i=0; i<nodes.length; i++) {
					if(nodes[i].classList.contains('dbgMenu')) {
						nodes[i].collapsed=!evt.shiftKey;
					}
				}
			}


			util.logDebugOptional("popupmenus", "Open popup menu: " + p.tagName + "\nid: " + p.id);
			// make it easy to find calling button / label / target element
			p.targetNode = button;

			let verticalOffset = QI.verticalMenuOffset; // was -1, Tb60 now -2
			// if (prefs.isDebugOption('popupmenus')) debugger;
			var isContextMenu = true; // was true; test for [Bug 26575]
			if (p.openPopup)
				p.openPopup(button, 'after_start', 0, verticalOffset, isContextMenu, false, evt);
			else
				p.showPopup(button, 0, verticalOffset, "context", "bottomleft", "topleft"); // deprecated method
		}

    // Alt+Down highlight the first folder
    if (evt && evt.hasOwnProperty("QFtype")) {
      // skip focus to first folder!
      if (evt.QFtype == "NavDown" && p.children) {
        for (let m of p.children) {
          if (m.getAttribute("tag") == "sub") {
            /*
            setTimeout( function() {
              // let bo = p.boxObject;
              // how do we set the focus to this menuitem m?
            }, 30);
            */
            break;
          }
        }
      }
    }

		// paint bucket pulls color on right-click
		if (QI.PaintModeActive && button && button.parentNode.id == "QuickFolders-FoldersBox" ) {
			let col = QI.getButtonColor(button);
			if (!isNaN(col))
				QI.setPaintButtonColor();
		}
	} ,

	getButtonLabel: function getButtonLabel(folder, useName, offset, entry, stats) {
		const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util,
					triangleDown = "\u25be".toString();

		try {
			let isFolderInterface = folder && (typeof folder.getNumUnread!='undefined') && (typeof folder.getTotalMessages!='undefined'),
			    nU = isFolderInterface ? folder.getNumUnread(false) : 0,
          numUnread = (nU==-1) ? 0 : nU, // Postbox root folder fix
			    numUnreadInSubFolders = isFolderInterface ? (folder.getNumUnread(true) - numUnread) : 0,
			    numTotal = isFolderInterface ? folder.getTotalMessages(false) : 0,
			    numTotalInSubFolders = isFolderInterface ? (folder.getTotalMessages(true) - numTotal) : 0,
          ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS,
          isShowTotals = prefs.isShowTotalCount,
          isShowUnread = prefs.isShowUnreadCount,
			    displayNumbers = [],
			    label = "",
          s = "";

			stats.unreadTotal = numUnread + numUnreadInSubFolders * (prefs.isShowCountInSubFolders ? 1 : 0);
			stats.unreadSubfolders = numUnreadInSubFolders;
			stats.totalCount = numTotal + numTotalInSubFolders * (prefs.isShowCountInSubFolders ? 1 : 0);

			// offset=-1 for folders tabs that are NOT on the quickFOlder bar (e.g. current Folder Panel)
			if (offset>=0) {
				if(prefs.isShowShortcutNumbers) {
					let shortCutNumber = prefs.isShowRecentTab ? offset-1 : offset;
					if(shortCutNumber < 10) {
						if(shortCutNumber == 9) {
							label += "0. ";
						}
						else {
							label += (shortCutNumber + 1) + ". ";
						}
					}
				}
			}

			label += (useName && useName.length > 0) ? useName : (folder ? folder.name : "?? " + util.getNameFromURI(entry.uri));

      if (isShowTotals && entry && entry.flags)
        isShowTotals = (entry.flags & ADVANCED_FLAGS.SUPPRESS_COUNTS) ? false : true;
      if (isShowUnread && entry && entry.flags)
        isShowUnread = (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD) ? false : true;

			util.logDebugOptional("folders",
				  "unread " + (isShowUnread ? "(displayed)" : "(not displayed)") + ": " + numUnread
				+ " - total:" + (isShowTotals ? "(displayed)" : "(not displayed)") + ": " + numTotal);
			if (isShowUnread) {
				if(numUnread > 0)
					s = s+numUnread;
				if(numUnreadInSubFolders > 0 && prefs.isShowCountInSubFolders)
					s = s + triangleDown + numUnreadInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (isShowTotals) {
				s = "";
				if(numTotal > 0)
					s=s+numTotal;
				if(numTotalInSubFolders > 0 && prefs.isShowCountInSubFolders)
					s=s + triangleDown + numTotalInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (displayNumbers.length) {
				label += " (" + displayNumbers.join(' / ') + ")";
			}
			return label;
		}
		catch(ex) {
			util.logToConsole('getButtonLabel:' + ex);
			return "";
		}
	} ,

  makePopupId: function makePopupId(folder, buttonId) {
		this.IdUnique++;
    return 'QuickFolders-folder-popup-' + (buttonId || folder ? folder.URI : this.IdUnique); // + "-" + this.IdUnique;
  },

	addFolderButton: function addFolderButton(folder, entry, offset, theButton, buttonId, fillStyle, isFirst, isMinimal) {
		const QI = QuickFolders.Interface,
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					FLAGS = util.FolderFlags;
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null,
		    tabIcon = (entry && entry.icon) ? entry.icon : '',
        useName = (entry && entry.name) ? entry.name : '',
				stats = { unreadTotal:0, unreadSubfolders:0, totalCount:0 },
		    label = this.getButtonLabel(folder, useName, offset, entry, stats);

    if (!folder && !isMinimal) {
      util.logToConsole('Error in addFolderButton: ' + 'folder parameter is empty!\n'
                        + 'Entry: ' + (entry ? (entry.name || label) : (' invalid entry: ' + label)));
    }
    try {
			let isMsgFolder = folder && (typeof folder.getStringProperty != 'undefined');
			// SeaMonkey: getStringProperty throws error if folder is in trash. it has no parent in this case.
      if (!tabIcon && isMsgFolder && folder.parent && folder.getStringProperty('folderIcon')) {
        // folder icon, but no quickFolders tab!
        let tI = folder.getStringProperty('iconURL');
        if (tI)
          tabIcon=tI;
      }
    }
    catch(ex) {
      util.logToConsole('Error in addFolderButton: ' + 'folder getStringProperty is missing.\n'
                        + 'Entry: ' + (entry ? entry.name : ' invalid entry') + '\n'
                        + 'URI: ' + (folder.URI || 'missing'));
      util.logException('Error in addFolderButton', ex);
    }
    if (!theButton) isMinimal=false; // if we create new buttons from scratch, then we need a full creation including menu

		util.logDebugOptional("interface.tabs", "addFolderButton() label=" + label + ", offset=" + offset + ", col=" + tabColor + ", id=" + buttonId + ", fillStyle=" + fillStyle);
		let button = (theButton) ? theButton :
		  (document.createXULElement ? document.createXULElement("toolbarbutton") : document.createElement("toolbarbutton")); // create the button!
		button.setAttribute("label", label);
		//button.setAttribute("class",ToolbarStyle); // was toolbar-height!

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="",
		    sDisplayIcons = (prefs.isShowToolbarIcons) ? ' icon': '',
        // if the tab is colored, use the new palette setting "ColoredTab"
        // if it is uncolored use the old "InActiveTab"
		    paletteClass = (tabColor!='0') ? this.getPaletteClass('ColoredTab') : this.getPaletteClass('InactiveTab');
    if (entry && entry.customPalette)
      paletteClass = this.getPaletteClassToken(entry.customPalette);

		// use folder flags instead!
		if (folder) {
			if (folder.flags & FLAGS.MSG_FOLDER_FLAG_INBOX)
				specialFolderType="inbox" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_SENTMAIL)
				specialFolderType="sent" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_TRASH)
				specialFolderType="trash" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_JUNK)
				specialFolderType="junk" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_TEMPLATES)
				specialFolderType="template" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_QUEUE)
				specialFolderType="outbox" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_DRAFTS)
				specialFolderType="draft" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_NEWSGROUP)
				specialFolderType="news" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_ARCHIVES) // Dillinger Bug
				specialFolderType="archive" + sDisplayIcons;
			else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_VIRTUAL)
				specialFolderType="virtual" + sDisplayIcons; // all other virtual folders (except smart which were alreadyhandled above)
			else if (tabIcon)
				specialFolderType='icon'; // independant of option, customized icons are always shown
		}
		else {
			specialFolderType='invalid icon';
			tabIcon='';
		}

		specialFolderType += paletteClass;
    let gotNew = folder ? folder.hasNewMessages : false;
		// this needs to be done also when a minimal Update is done (button passed in)
		this.styleFolderButton(
			button, stats.unreadTotal, stats.unreadSubfolders, stats.totalCount, specialFolderType, tabColor,
			gotNew, tabIcon, entry
		);

		button.folder = folder;

		if (null == theButton) {
			button.setAttribute("tooltiptext", util.getFolderTooltip(folder, label));
			// this.setEventAttribute(button, "oncommand",'QuickFolders.Interface.onButtonClick(event.target, event, true);');
			button.addEventListener("click",
				function(event) {
					QI.onButtonClick(event.target, event, true);
					event.stopPropagation();
				},
				false);
			button.addEventListener("command",
				function(event) {
					QI.onButtonClick(event.target, event, true);
				},
				false);
		}

    /**  Menu Stuff  **/

		let popupId = '';
    if (!isMinimal) {
			popupId = this.makePopupId(folder, buttonId);
			if (buttonId == 'QuickFoldersCurrentFolder') {
				button.setAttribute('popupId', popupId);
			}

      button.setAttribute('context',''); // overwrites the parent context menu
      // this.setEventAttribute(button, "oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
			// [Bug 26575]
			if (!button.hasContextListener) {
				//
				button.addEventListener("contextmenu",
					function(event) {
            // there is a problem with the closure on popupId in current folder button,
            // which could lead to it showing previous folders' menus
            let pId = button.getAttribute('popupId') || popupId;
						QI.showPopup(button, pId, event);
						// only hstop handling event when popup is shown!
						event.preventDefault();
						event.stopPropagation();
					}, false);
				button.hasContextListener = true;
			}
      if (buttonId == 'QuickFoldersCurrentFolder') {
        // this.setEventAttribute(button, "onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
				if (!button.hasClickEventListener) { // additional left-click menu
					button.addEventListener("click",
						function(event) {
						  // right-click is already handled by contextmenu event
						  if (event.button == 0) {
								QI.showPopup(button,popupId,event);
								event.preventDefault();
								event.stopPropagation();
							}
						}, false);
					button.hasClickEventListener = true;
					this.setEventAttribute(button, "ondragstart","QuickFolders.buttonDragObserver.startDrag(event, true)");
					// this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
					this.setEventAttribute(button, "ondragend","QuickFolders.buttonDragObserver.dragExit(event)");
				}
      }
    }

		if (!theButton) {
		  // line break?
			if (entry && entry.breakBefore && !isFirst) { // no line break if this is the first button on a line
			  // without explicitely adding this namespace, the break doesnt show up!
			  let LF = document.createElementNS("http://www.w3.org/1999/xhtml", "br");
			  this.FoldersBox.appendChild(LF);
			}

			if (entry && entry.separatorBefore  && !isFirst) {  // no separator if this is the first button on a line
			  let sep = this.createIconicElement('toolbarseparator','*');
			  this.FoldersBox.appendChild(sep);
			}
			this.FoldersBox.appendChild(button);
			if (folder) {
        // in Tb78, they use gFolderTreeView._onDragDrop, gFolderTreeView._onDragStart, gFolderTreeView._onDragOver
        // these are defined in mail/base/content/folderPane.js
				this.setEventAttribute(button, "ondragenter", "QuickFolders.buttonDragObserver.dragEnter(event);");
				this.setEventAttribute(button, "ondragover", "QuickFolders.buttonDragObserver.dragOver(event);");
				this.setEventAttribute(button, "ondrop", "QuickFolders.buttonDragObserver.drop(event);");
			}
			// button.setAttribute("flex",100);
		}
    // we do this after appendChild, because labelElement needs to be generated in DOM
    this.addCustomStyles(button, entry);

    if (!isMinimal) {
      // popupset is NOT re-done on minimal update - save time!
      this.addPopupSet({popupId:popupId, folder:folder, entry:entry, offset:offset, button:button, noCommands:false, event:null});
    }

		if (!theButton) {
			// AG add dragging of buttons
			this.setEventAttribute(button, "ondragstart","QuickFolders.buttonDragObserver.startDrag(event, true)");
			// this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
			this.setEventAttribute(button, "ondragend","QuickFolders.buttonDragObserver.dragExit(event)");
			util.logDebugOptional("folders","Folder [" + label + "] added.\n===================================");
		}

		return button;
	} ,

 /*********************
 	* applyIcon()
 	* applies icon to a button (menuitem?)
  * @element: QuickFolder Tab, current Folder Tab
  * @filePath: the entry from the model array - use for advanced (tab specific) properties
 	*/
	applyIcon: function applyIcon(element, filePath) {
	  try {
			let cssUri = '';
			if (filePath) {
        if (filePath.indexOf('url')==0)
          cssUri = filePath;
        else
          cssUri = 'url(' + filePath + ')';
			}
			element.style.listStyleImage = cssUri; // direct styling!
		}
		catch(ex) {
		  QuickFolders.Util.logException('Exception in Interface.applyIcon ', ex);
		}
	} ,

 /*********************
 	* styleFolderButton()
 	* styles a folder button (tab)
 	* @button:    the button to be styled
 	* @nUnreadTotal: number of unread emails (including subfolder unread count if show subs option is active)
 	* @nUnreadSubfolders: number of unread emails in subfolders
 	* @numTotal: numTotal of total emails
 	* @specialStyle: if this is a special folder, such as inbox, virtual etc. - appended as css class
 	* @tabColor: palette index; 0=DEFAULT
 	* @gotNew:   new email has arrived (special inset style)
	* @icon: icon or '' or null
  * @entry: the entry from the model array - use for advanced (tab specific) properties
 	*/
	styleFolderButton: function styleFolderButton(button, nUnreadTotal, nUnreadSubfolders, numTotal, specialStyle, tabColor, gotNew, icon, entry) {
		//reset style!
		let cssClass = '',
        ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS;
		//  toolbarbutton-menubutton-button

		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.getAttribute("label")
			+ ", " + nUnreadTotal + ", " + numTotal + ", " + specialStyle + ")");

		if (nUnreadTotal > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold) {
      if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD))
        { ; }
      else {
				if (nUnreadSubfolders == nUnreadTotal)
					cssClass += " has-unreadSubOnly";
				else
					cssClass += " has-unread";
			}
		}

		if (numTotal > 0 && QuickFolders.Preferences.isShowFoldersWithMessagesItalic) {
      if (!(entry && entry.flags && (entry.flags & ADVANCED_FLAGS.SUPPRESS_COUNTS)))
        cssClass += " has-messages";
		}

		if (gotNew && QuickFolders.Preferences.isHighlightNewMail)
			button.setAttribute("biffState-NewMail","true");
		else {
			if (button.getAttribute("biffState-NewMail"))
				button.removeAttribute("biffState-NewMail");
		}

		if (gotNew && QuickFolders.Preferences.isItalicsNewMail)
			button.setAttribute("biffState-NewItalics","true");
		else {
			if (button.getAttribute("biffState-NewItalics"))
				button.removeAttribute("biffState-NewItalics");
		}

		if (specialStyle!="")
			cssClass += " " + specialStyle;

		let buttonFontSize = QuickFolders.Preferences.ButtonFontSize;
		if (buttonFontSize) {
			button.style.fontSize = buttonFontSize + "px";
		}

		// add some color, the easy way
		if (tabColor) {
			cssClass += " " + this.getButtonColorClass(tabColor);
		}
		else {
			cssClass += " col0";
    }
		// cssClass += " toolbarbutton-menubutton-button"; // [Bug 26575] - this alone didn't fix it

		if (cssClass.trim)
			button.className = cssClass.trim();
		else
			button.className = cssClass;

    this.applyIcon(button, icon);
	} ,

  addCustomStyles: function addCustomStyles(button, entry) {
		const util = QuickFolders.Util;
    function getLabel(button) {
        let anonChildren = util.getAnonymousNodes(document,button);
        if (!anonChildren) return null;
        for (let i=0; i<anonChildren.length; i++) {
          if (anonChildren[i].classList.contains('toolbarbutton-text'))
            return anonChildren[i];
        }
        return null;
    }
    let ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS;
    // custom colors
    if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.CUSTOM_CSS)) {
      try {
				if (util.Application != 'Postbox')
					button.style.setProperty('background-image', entry.cssBack, '');
				else
					button.style.setProperty('background', entry.cssBack, 'important');
        let l = getLabel(button);
        if (l)
          l.style.setProperty('color', entry.cssColor, util.Application == 'Postbox' ? 'important' : '');
      }
      catch(ex) {
        QuickFolders.Util.logException('custom CSS failed',ex);
      }
    }
    else {
      if(button.id == 'QuickFoldersCurrentFolder') {
        button.style.removeProperty('background-image');
        let l = getLabel(button);
        if (l)
          l.style.removeProperty('color');
      }
    }
  },

	addSpecialButton: function addSpecialButton(SpecialFunction, SpecialId, Offset, tooltip) {
		let button = document.createXULElement ? document.createXULElement("toolbarbutton") : document.createElement("toolbarbutton"),
		    image = '',
		    lbl = ''; // for testing
		switch (SpecialId) {
			case 'Thread':
				image = "url('chrome://quickfolders/content/thread.png')"; // "thread.png" ; //
				lbl = ''; // Thread
				break;
			case 'Trash':
				image = "url('chrome://quickfolders/content/skin/ico/folder-trash-gnome-qf.png')";
				lbl = 'trash';
				break;
			default:
				break;
		}
		button.setAttribute("label", lbl);
		button.setAttribute("class","specialButton");
		button.setAttribute("list-style-image", image);
		button.setAttribute("dir", "normal");
		button.setAttribute("orient", "horizontal");
		button.setAttribute("validate", "always");
		button.setAttribute("tooltiptext", tooltip);
		button.setAttribute("id", SpecialId);

		this.setEventAttribute(button, "ondragenter","QuickFolders.buttonDragObserver.dragEnter(event);");
		this.setEventAttribute(button, "ondragover","QuickFolders.buttonDragObserver.dragOver(event);");
		this.setEventAttribute(button, "ondrop","QuickFolders.buttonDragObserver.drop(event);");
		this.SpecialToolbar.appendChild(button);
	} ,

	onButtonClick: function onButtonClick(button, evt, isMouseClick) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface;
		util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);
		// this may happen when we right-click the menu with CTRL
		try {
			let el = button.QueryInterface(Components.interfaces.nsIDOMXULControlElement);
			if (el.tagName == 'menuitem' && button.parentElement.getAttribute('tag') == "quickFoldersCommands") {
				QI.clickHandler(evt, el);
				return;
			}
		}
		catch(ex) { debugger; }

		try {
			if (QI.PaintModeActive) {
				util.logDebugOptional("mouseclicks","onButtonClick - Paint Mode!");
				let paintButton = this.PaintButton;
				let color;
				if (paintButton) {
					color = paintButton.getAttribute("colorIndex");
					if (!color)
						color=0;
					QI.setButtonColor(paintButton, color);
				}
				QuickFolders.Model.setFolderColor(button.folder.URI, color, true);
        if (evt.ctrlKey) { // go to next / previous color! (RAINBOW MODE)
          if (evt.shiftKey)
            color = (parseInt(color) - 1);
          else
            color = (parseInt(color) + 1);
          if (color>20) color = 1;
          if (color<1) color = 20;
          QI.setButtonColor(paintButton, color.toString());
        }
				return;
			}

			if (evt) {
				// CTRL forces a new mail tab
				if(evt.ctrlKey && isMouseClick) {
				  if (evt.button==0) { // only main mouse button (right-click) is shortcut for commands menu
						util.logDebugOptional("mouseclicks","onButtonClick - ctrlKey was pressed");
						this.openFolderInNewTab(button.folder);
					}
					else {
					  // this command should have been handled elsewhere!
						let t = evt.type;
						util.logDebug("Click event on button, passed through from : " + evt.targetNode);
					}
				}
			}
		}
		catch (ex) { util.logToConsole(ex); };
		if (button.folder) {
			// [Bug 26190] - already selected = drill down on second click
			// [Bug 26389] - Single Mail Tab should always open the folder!
			if (button.folder === util.CurrentFolder & QI.CurrentTabMode != 'message') {
				if (evt.type=="click" && evt.button==2) { // right click
					let popupId = button.getAttribute('popupId');
					if (popupId) { // linux avoid this getting triggered twice
					  let activePopup = document.getElementById(popupId);

						if (document.getElementById(popupId))
						// show only subfolders, without commands!
						QI.showPopup(button, popupId, evt, true);
					}
				}
			}
			else {
				// rule out right clicks - we do not want to change folder for these
				if (evt.type && evt.type=="click" && evt.button!=0) {
					; // NOP
				}
				else {
					// interface speed hack: mark the button as selected right away!
					this.onTabSelected(button);
					QuickFolders_MySelectFolder(button.folder.URI);
					evt.preventDefault(); // prevent opening the popup
				}
			}
		}
		else {
			if (evt.button==0) { // left-click only
				// force select folder on invalid URI - this will suggest to delete the folder.
				let uri = button.getAttribute('folderURI');
				if (uri) {
					debugger;
					QuickFolders_MySelectFolder(uri);
				}
			}
		}
	} ,

	openFolderInNewTab: function openFolderInNewTab(folder) {
		let util = QuickFolders.Util,
        tabmail = util.$("tabmail");
    util.logDebugOptional("interface", "QuickFolders.Interface.openFolderInNewTab()");
		if (tabmail) {
		  let tabName = folder.name;
			switch (util.Application) {
				case 'Thunderbird':
				  tabmail.openTab(util.mailFolderTypeName, {folder: folder, messagePaneVisible: true, background: false, disregardOpener: true, title: tabName} ) ;
					break;
				case 'SeaMonkey':
					tabmail.openTab(util.mailFolderTypeName, 7, folder.URI); // '3pane'
					QuickFolders.tabContainer.selectedIndex = tabmail.tabContainer.children.length - 1;
					break;
				case 'Postbox':
					let win = util.getMail3PaneWindow();
					win.MsgOpenNewTabForFolder(folder.URI, null /* msgHdr.messageKey key*/, false /*Background*/ )
					break;
			}
		}
	} ,

	// new function to open folder of current email!
	// tooltip = &contextOpenContainingFolder.label;
	openContainingFolder: function openContainingFolder(msg) {
		if (!msg && typeof gFolderDisplay != "undefined")
			msg = gFolderDisplay.selectedMessage;

	  if (!msg)
			return;

		MailUtils.displayMessageInFolderTab(msg);
	} ,


	onRemoveBookmark: function onRemoveBookmark(element) {
		let util = QuickFolders.Util,
		    tab = util.getPopupNode(element),
        folder = tab.folder,
		    msg = tab.label + " tab removed from QuickFolders";
    util.logDebugOptional("interface", "QuickFolders.Interface.onRemoveBookmark()");
		if (folder)
			QuickFolders.Model.removeFolder(folder.URI, true);
		else
			QuickFolders.Model.removeFolder(tab.getAttribute('folderURI'), true); // let's store folder URI for invalid loaded tabs
		// this.updateFolders(true); already done!
		try { util.showStatusMessage(msg, true); } catch(e) {;};
	} ,

	onRemoveIcon: function onRemoveIcon(element) {
    let folderButton, entry,
        util = QuickFolders.Util,
        model = QuickFolders.Model;
    util.logDebugOptional("interface", "QuickFolders.Interface.onRemoveIcon()");
		if (element.id == 'context-quickFoldersRemoveIcon' // folder tree icon
		    ||
				element.id == 'QuickFolders-RemoveIcon') { // current folder bar
			let folders = GetSelectedMsgFolders();
			if (folders) {
				for (let i=0; i<folders.length; i++) {
          let folder = folders[i];
					QuickFolders.FolderTree.setFolderTreeIcon(folder, null);
					entry = model.getFolderEntry(folder.URI);
					if (entry) {
						// if button visible, update it!
					  folderButton = this.shouldDisplayFolder(entry) ? this.getButtonByFolder(folder) : null;
						model.setTabIcon (folderButton, entry, ''); // will only modify stored entry, if tab not visible.
					}
				}
			}
      if (element.id == 'QuickFolders-RemoveIcon') {
        let cFT = QuickFolders.Interface.CurrentFolderTab;
        if (cFT)
          cFT.style.listStyleImage = '';
      }

		}
		else {
			folderButton = util.getPopupNode(element);
			entry = model.getButtonEntry(folderButton);
			element.collapsed = true; // hide the menu item!
	    model.setTabIcon	(folderButton, entry, '');
			let folder = model.getMsgFolderFromUri(entry.uri)
			if (folder && QuickFolders.FolderTree)
				QuickFolders.FolderTree.setFolderTreeIcon(folder, null);
		}
	} ,

	onSelectIcon: function onSelectIcon(element,event) {
		const Ci = Components.interfaces,
          Cc = Components.classes,
          nsIFilePicker = Ci.nsIFilePicker,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile,
          MAX_ICONS = 12;
		let folderButton, entry,
		    folders = null,
        util = QuickFolders.Util,
        model = QuickFolders.Model,
        QI = QuickFolders.Interface;
    util.logDebugOptional("interface", "QuickFolders.Interface.onSelectIcon()");
		if (element.id == 'context-quickFoldersIcon' // style a folder tree icon
		    ||
				element.id == 'QuickFolders-SelectIcon')  // current folder bar
		{
		  // get selected folder (form event?)
			folders = GetSelectedMsgFolders();
		}
		else {
			folderButton = util.getPopupNode(element);
			entry = model.getButtonEntry(folderButton);
		}
    let entries = model.selectedFolders,
        countIcons = 0;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].icon)
        countIcons++;
    }
    if (!util.hasPremiumLicense(false) && countIcons>3){
      let text =util.getBundleString("qf.notification.premium.tabIcons",
        "You have now {1} icon(s) defined. The free version of QuickFolders allows a maximum of {2}.");
      util.popupProFeature("tabIcons", text.replace("{1}", countIcons).replace("{2}", MAX_ICONS));
      // early exit if no license key and maximum icon number is reached
      if (countIcons>=MAX_ICONS)
        return;
    }

    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

		// callback, careful, no "this"
    let fpCallback = function fpCallback_done(aResult) {
      if (aResult == nsIFilePicker.returnOK) {
        try {
          if (fp.file) {
					  let file = fp.file.parent.QueryInterface(NSIFILE);
						//localFile = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
						try {
							//localFile.initWithPath(path); // get the default path
							QuickFolders.Preferences.setStringPref('tabIcons.defaultPath', file.path);
							let iconURL = fp.fileURL;
							if (folders) {
							  for (let i=0; i<folders.length; i++) {
                  let folder = folders[i];
								  if (QuickFolders.FolderTree)
										QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL);
									let entry = model.getFolderEntry(folder.URI);
									if (entry) {
										// if button visible, update it!
										folderButton = QI.shouldDisplayFolder(entry) ? QI.getButtonByFolder(folder) : null;
										model.setTabIcon (folderButton, entry, iconURL); // will only modify stored entry, if tab not visible.
									}
								}
							}
							else {
								model.setTabIcon	(folderButton, entry, iconURL, element);
								let folder = model.getMsgFolderFromUri(entry.uri)
								if (folder && QuickFolders.FolderTree)
									QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL);
							}
              // update current folder icon in currentfolder toolbar
              // do this in addFolderButton!! - this is used for styling everything even the current folder panel
						}
						catch(ex) {
						}
          }
        } catch (ex) {
        }
      }
    };

    fp.init(window, "Select an icon file", nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterImages);
		// needs to be initialized with something that makes sense (UserProfile/QuickFolders)

//Error: NS_ERROR_XPC_BAD_CONVERT_JS: Could not convert JavaScript argument arg 0 [nsIFilePicker.displayDirectory]
		let localFile = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE),
		    lastPath = QuickFolders.Preferences.getStringPref('tabIcons.defaultPath');
		if (lastPath)
			localFile.initWithPath(lastPath);
    fp.displayDirectory = localFile; // gLastOpenDirectory.path
		if (fp.open)
			fp.open(fpCallback);
		else { // Postbox
		  fpCallback(fp.show());
		}
	} ,

	onBreakToggle: function onBreakToggle(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element),
		    entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setFolderLineBreak	(entry, !entry.breakBefore);
	} ,

	onSeparatorToggle: function onSeparatorToggle(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element),
		    entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setTabSeparator (entry, !entry.separatorBefore);
	} ,

	onRenameBookmark: function onRenameBookmark(element) {
		let util = QuickFolders.Util,
        folderButton = util.getPopupNode(element),
		    sOldName = folderButton.label; //	this.getButtonByFolder(popupNode.folder).label;
		// strip shortcut numbers
		if(QuickFolders.Preferences.isShowShortcutNumbers) {
			let i = sOldName.indexOf('. ');
			if (i<3 && i>0)
				sOldName = sOldName.substring(i+2,sOldName.length);
		}
		// find if trhere is a number of total messages / unread message in the label, and strip them from renaming!!
		if (QuickFolders.Preferences.isShowTotalCount || QuickFolders.Preferences.isShowUnreadCount) {
			let i = sOldName.lastIndexOf(' ('),
			    j = sOldName.lastIndexOf(')');
			// TODO: additional check if there are just numbers and commas within the brackets!

			//making sure there is stuff between the () and the last char is a )
			if (i > 1 && sOldName.substr(i, j - i).length > 0 && j == sOldName.length - 1) {
				let bracketedLen = j-i+1;
				util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "	length = " + bracketedLen);
			// lets check if this is numeral, after removing any ','
				sOldName = sOldName.substring(0,sOldName.length - bracketedLen);
			}
		}

		let fUri =  folderButton.folder ? folderButton.folder.URI : folderButton.getAttribute('folderURI');

		let newName = window.prompt(this.getUIstring("qfNewName","Enter a new name for the bookmark")+"\n" + fUri, sOldName); // replace folder.name!
		if(newName) {
			QuickFolders.Model.renameFolder(fUri, newName);
		}
	} ,

  onAdvancedProperties: function onAdvancedProperties(evt, element) {
    let util = QuickFolders.Util,
        button = util.getPopupNode(element),
        folder = button.folder,
        entry = QuickFolders.Model.getFolderEntry(folder.URI),
        x = button.boxObject.screenX,
        y = button.boxObject.screenY + button.boxObject.height;
		if (!folder) {
			util.alertButtonNoFolder(button);
			return;
		}

    // attach to bottom of the Tab (like a popup menu)
    setTimeout(function() {
			util.logDebug('onAdvancedProperties(evt)\n screenX = ' + x +'\n screenY = ' + y);
			util.popupProFeature("advancedTabProperties");}
		);

    // the window may correct its x position if cropped by screen's right edge
    let win = window.openDialog(
      'chrome://quickfolders/content/quickfolders-advanced-tab-props.xhtml',
      'quickfilters-advanced','alwaysRaised, titlebar=no,chrome,close=no,top=' + y +',left=' + x,
      folder, entry); //
    win.focus();
		evt.stopPropagation();
		evt.preventDefault();
  } ,

	compactFolder: function compactFolder(folder, command) {
		let s1 = folder.sizeOnDisk;
		QuickFolders.compactLastFolderSize = s1;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = command;

		if (!folder) {
			util.alertButtonNoFolder(null);
			return;
		}

		// Postbox might get an indexing menu item?
		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
		folder.compact(null, msgWindow);
	} ,

	onCompactFolder: function onCompactFolder(element, command) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.compactFolder()");
		this.compactFolder(folder, command);
	} ,

	onMarkAllRead: function onMarkAllRead(element,evt,recursive) {
    let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    // check whether f has folder as parent
    function hasAsParent(child, p) {
      debugger;
      if (!child.parent || !p) return false;
      if (child.parent == p) return true;
      if (p.isServer || !p.parent) return false;
      return hasAsParent(child, p.parent);
    }

    evt.stopPropagation();
    util.logDebugOptional("interface", "QuickFolders.Interface.onMarkAllRead()");
		try {
			let f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
      if (util.Application == 'Postbox')
        f.markAllMessagesRead();
      else {
        f.markAllMessagesRead(msgWindow);
        if (recursive) {  // [issue 3] Mark messages READ in folder and all its subfolders
          // iterate all folders and mark all children as read:
          for (let folder of util.allFoldersIterator(false)) {
            // check unread
            if (folder.getNumUnread(false) && hasAsParent(folder, f)) {
              setTimeout(
                function() { folder.markAllMessagesRead(msgWindow); }
              )
            }
          }
        }
      }
		}
		catch(e) {
			util.logToConsole("QuickFolders.Interface.onMarkAllRead " + e);
		}
	} ,

	onDeleteFolder: function onDeleteFolder(element) {
		const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
    let folderButton = util.getPopupNode(element),
		    uri = folderButton.folder.URI,
				parent = folderButton.folder.parent,
		    result = null;

    util.logDebugOptional("interface", "QuickFolders.Interface.onDeleteFolder()");

		if (((util.Application == 'Postbox') || (util.Application == 'SeaMonkey'))
			  && typeof MsgDeleteFolder === 'function'
			 ) {
			QuickFolders_MySelectFolder(folderButton.folder.URI);
			MsgDeleteFolder();
		}
		else
			this.globalTreeController.deleteFolder(folderButton.folder);
		if (parent)
			QuickFolders_MySelectFolder(parent.URI)

		// if folder is gone, delete quickFolder [Bug 26514]
		// if (!QuickFolders.Model.getMsgFolderFromUri(uri, false))
		QuickFolders.Interface.onRemoveBookmark(folderButton);
	} ,

	onRenameFolder: function onRenameFolder(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder,
		    theURI = folder.URI;
    util.logDebugOptional("interface", "QuickFolders.Interface.onRenameFolder()");
		if (util.Application == 'Thunderbird') {
			this.globalTreeController.renameFolder(folder);
		}
		else {
			QuickFolders_MySelectFolder(theURI);
			MsgRenameFolder();
			// let folder = QuickFolders.Model.getMsgFolderFromUri(theURI, false);
			// QuickFolders.Model.renameFolder(theURI, folder.prettyName);
		}
	} ,

	onEmptyTrash: function onEmptyTrash(element) {
		let util = QuickFolders.Util,
		    folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEmptyTrash()");
		QuickFolders.compactLastFolderSize = folder.sizeOnDisk;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = 'emptyTrash';

		if ((util.Application == 'Postbox') || (util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgEmptyTrash();
		}
		else {
			this.globalTreeController.emptyTrash(folder);
		}
		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
	} ,

	onEmptyJunk: function onEmptyJunk(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEmptyJunk()");
		if (typeof GetSelectedFolderURI === 'function') {
		  // old Postbox Code
			let getSelFunction;
			try {
			  // functions from folderPaneContext
			  // Postbox hack: we pretend the tree folder was selected by temporarily replacing GetSelectedFolderURI
			  getSelFunction = GetSelectedFolderURI;
				GetSelectedFolderURI = function() { return folder.URI; };
				deleteAllInFolder('emptyJunk');
			}
			catch(ex) { util.logException('Exception in onEmptyJunk ', ex);  };
			if (getSelFunction)
				GetSelectedFolderURI = getSelFunction;
		}
		else {
			this.globalTreeController.emptyJunk(folder);
		  this.compactFolder(folder, 'emptyJunk');
		}
	} ,

	onDeleteJunk: function onDeleteJunk(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onDeleteJunk()");
		if (this.globalTreeController && this.globalTreeController.deleteJunk)
			this.globalTreeController.deleteJunk(folder);
		else
			deleteJunkInFolder();
	} ,

	onEditVirtualFolder: function onEditVirtualFolder(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEditVirtualFolder()");
		if ((util.Application == 'Postbox') || (util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editVirtualFolder(folder);
	} ,

	onFolderProperties: function onFolderProperties(element) {
		let util = QuickFolders.Util,
				btn = util.getPopupNode(element),
        folder = btn.folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onFolderProperties()");

		if (!folder) {
			util.alertButtonNoFolder(btn);
			return;
		}

		if ((util.Application == 'Postbox') || (util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editFolder(null,folder);
	} ,

	openExternal: function openExternal(aFile) {
		let util = QuickFolders.Util;
    util.logDebugOptional("interface", "QuickFolders.Interface.openExternal()");
    try {
      util.logDebug('openExternal()' + aFile);
      let uri = Cc["@mozilla.org/network/io-service;1"].
                getService(Ci.nsIIOService).newFileURI(aFile),
          protocolSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                        getService(Ci.nsIExternalProtocolService);
      protocolSvc.loadUrl(uri);
    }
    catch(ex) {
      util.logDebug('openExternal() failed:\n' + ex);
    }
	},

	getLocalFileFromNativePathOrUrl: function getLocalFileFromNativePathOrUrl(aPathOrUrl) {
	  try {
			const Ci = Components.interfaces,
						Cc = Components.classes,
			      NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
			if (aPathOrUrl.substring(0,7) == "file://") {
				// if this is a URL, get the file from that
				let ioSvc = Cc["@mozilla.org/network/io-service;1"].
										getService(Ci.nsIIOService);

				// XXX it's possible that using a null char-set here is bad
				const fileUrl = ioSvc.newURI(aPathOrUrl, null, null).
												QueryInterface(Ci.nsIFileURL);
				return fileUrl.file.clone().QueryInterface(NSIFILE);
			} else {
				// if it's a pathname, create the nsILocalFile directly
				let f = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
				f.initWithPath(aPathOrUrl);
				return f;
			}
		}
		catch(ex) {
		  QuickFolders.Util.slideAlert("Problems opening URL: " + aPathOrUrl, ex);
		}
		return null;
	}	,

	onFolderOpenLocation: function onFolderOpenLocation(element) {
		const util = QuickFolders.Util,
		      NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
    let folder = util.getPopupNode(element).folder;
		// code from gDownloadViewController.showDownload(folder);
    util.logDebug('onFolderOpenLocation()\nfolder: ' + folder.name +'\nPath: ' + folder.filePath.path);
		let f = this.getLocalFileFromNativePathOrUrl(folder.filePath.path); // aDownload.getAttribute("file")
		try {
			// Show the directory containing the file and select the file
			f.reveal();
		} catch (e) {
      util.logDebug('onFolderOpenLocation() - localfile.reveal failed: ' + e);
			// If reveal fails for some reason (e.g., it's not implemented on unix or
			// the file doesn't exist), try using the parent if we have it.
			let parent = f.parent.QueryInterface(NSIFILE);
			if (!parent) {
        util.logDebug('onFolderOpenLocation() - no folder parent - giving up.');
				return;
      }

			try {
				// "Double click" the parent directory to show where the file should be
        util.logDebug('onFolderOpenLocation() - parent.launch()');
				parent.launch();
			} catch (ex) {
        util.logDebug('onFolderOpenLocation() - parent.launch() failed:' + ex);
				// If launch also fails (probably because it's not implemented), let the
				// OS handler try to open the parent
				this.openExternal(parent);
			}
		}

	} ,

	onGetMessages: function onGetMessages(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onGetMessages()");
		// Get new Messages (Inbox)
		if ((	folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP
				||
				folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_INBOX))
		{
			if (typeof GetNewMsgs != "undefined") { // Tb, Sm
   			if (folder.server.type != 'none')
				  GetNewMsgs(folder.server, folder);
			}
			else if (typeof MsgGetMessage != "undefined") {  // Postbox
			  let getM = GetSelectedMsgFolders;
				try {
				  GetSelectedMsgFolders = function() { let msg=[]; msg.push(folder); return msg; };
					GetFolderMessages();
				}
				catch(ex) {}
				GetSelectedMsgFolders = getM;
			}
		}
	} ,

  onDownloadAll: function onDownloadAll(element) {
    // IMAP / non-nntp folders only - forces a download of all messages (important for non-synced folders)
    // we need to create a progress window and pass that in as the second parameter here.
    let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder,
        // In Thunderbird the default message window is stored in the global variable msgWindow.
        mw = msgWindow; // window.msgWindow ?
    util.logDebugOptional("interface", "QuickFolders.Interface.onDownloadAll()");
    folder.downloadAllForOffline(null, mw); // nsIUrlListener, nsIMsgWindow
  } ,

	rebuildSummary: function rebuildSummary(folder) {
		const Ci = Components.interfaces,
					Cc = Components.classes;
		let isCurrent=false;
		// taken from http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#2087
		if (folder.locked) {
			folder.throwAlertMsg("operationFailedFolderBusy", msgWindow);
			return;
		}
		if (folder.supportsOffline) {
			// Remove the offline store, if any.
			let offlineStore = folder.filePath;
			if (offlineStore.exists())
				offlineStore.remove(false);
		}
		if (typeof gFolderDisplay !='undefined') {
			if (gFolderDisplay.view) { // Tb3
				if (gFolderDisplay.view.displayedFolder == folder) {
					gFolderDisplay.view.close();
					isCurrent = true;
				}
			}
			else if(gFolderDisplay.displayedFolder == folder) {  // SeaMonkey
				// gFolderDisplay.view.close();
				isCurrent = true;
			}

			// Send a notification that we are triggering a database rebuild.
			let notifier =
				Cc["@mozilla.org/messenger/msgnotificationservice;1"]
						.getService(Ci.nsIMsgFolderNotificationService);

			notifier.notifyItemEvent(folder, "FolderReindexTriggered", null, null);
			folder.msgDatabase.summaryValid = false;

			let msgDB = folder.msgDatabase;
			msgDB.summaryValid = false;
			try {
				folder.closeAndBackupFolderDB('');
			}
			catch(e) {
				// In a failure, proceed anyway since we're dealing with problems
				folder.ForceDBClosed();
			}
			folder.updateFolder(msgWindow);
			if (isCurrent) {
				if (typeof(gFolderDisplay.show) != 'undefined')
					gFolderDisplay.show(folder);
			}
		}
		else { // Postbox / SeaMonkey
			let msgDB = folder.getMsgDatabase(msgWindow);
			try {
				if (folder.supportsOffline) {
					// Remove the offline store, if any.
					let offlineStore = folder.filePath;
					if (offlineStore.exists())
						offlineStore.remove(false);
				}
			}
			catch (ex) {
				Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage("failed to remove offline store: " + ex);
			}

			msgDB.summaryValid = false;
			folder.ForceDBClosed();
			// these two lines will cause the thread pane to get reloaded
			// when the download/reparse is finished. Only do this
			// if the selected folder is loaded (i.e., not thru the
			// context menu on a non-loaded folder).
			if (folder == GetLoadedMsgFolder()) {
				gRerootOnFolderLoad = true;
				gCurrentFolderToReroot = folder.URI;
			}
			folder.updateFolder(msgWindow);
		}

		QuickFolders.Util.slideAlert("QuickFolders", this.getUIstring('qfFolderRepairedMsg','Folder repaired:') + ' ' + folder.prettyName);
	} ,

	onRepairFolder: function onRepairFolder(element) {
		let util = QuickFolders.Util,
        folder = element ? util.getPopupNode(element).folder : this.getCurrentTabMailFolder();
    util.logDebugOptional("interface", "QuickFolders.Interface.onRepairFolder()");
		this.rebuildSummary(folder);
	} ,

	onNewFolder: function onNewFolder(element,evt) {
		let util = QuickFolders.Util,
				QI = QuickFolders.Interface,
        folder = util.getPopupNode(element).folder;
    if (evt) evt.stopPropagation();

    util.logDebugOptional("interface", "QuickFolders.Interface.onNewFolder()");
		if (util.getOrCreateFolder) {
			QI.onCreateInstantFolder(folder);  // async function
		}
		else { // legacy code - uses "classic" dialog.
			if ((util.Application == 'SeaMonkey') ||
          (util.Application == 'Postbox' && typeof MsgNewFolder === 'function'))
			{
				QuickFolders_MySelectFolder(folder.URI);
				MsgNewFolder(NewFolder); // NewFolder() = global function - doesn't exist in Postbox!
			}
			else {
				QI.globalTreeController.newFolder(folder);
			}
		}
	},

	// * function for creating a new folder under a given parent
	// see http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#2359
	// currently not used in Postbox build because it requires Tasc.async
	onCreateInstantFolder: function onCreateInstantFolder(parentFolder, folderName) {
		const util = QuickFolders.Util,
					QI = QuickFolders.Interface,
		      Ci = Components.interfaces,
					Cc = Components.classes,
          prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
		let isQuickMove = (QuickFolders.quickMove.isActive),
				isFindFolder = true;  // flag for coming from the quickMove / quickJump popup menu

		// replace onNewCurrentFolder for new folder toolbar button:
		if (!parentFolder) {
			parentFolder = util.CurrentFolder;
			folderName = "";
			isQuickMove = false; // irrelevant in this case
			isFindFolder = false;
		}

    util.logDebugOptional('interface', 'QuickFolders.Interface.onCreateInstantFolder(' + parentFolder.prettyName + ', ' + folderName + ')');
    let title = util.getBundleString('qf.prompt.newFolder.title', "New Folder"),
        text = util.getBundleString('qf.prompt.newFolder.newChildName', "Enter name for new child folder under {0}") + ":",
        checkBoxText = util.getBundleString('qf.prompt.newFolder.createQFtab', "Also create a QuickFolders Tab"),
        input = { value: folderName },
        check = { value: false },
        result = prompts.prompt(window, title, text.replace('{0}', parentFolder.prettyName), input, checkBoxText, check);
    if (!result) return;
    if (!parentFolder.canCreateSubfolders) throw ("cannot create a subfolder for: " + parentFolder.prettyName);
		let newFolderUri = parentFolder.URI + "/" + encodeURI(input.value);

		// this asynchronous function is in quickfolders-shim as Postbox doesn't support the new syntax
		util.getOrCreateFolder(
		  newFolderUri,
		  util.FolderFlags.MSG_FOLDER_FLAG_MAIL).then(  // avoiding nsMsgFolderFlags for postbox...
			  function createFolderCallback() {
					// create QuickFolders Tab?
					if (check.value) {
						let cat = QI.CurrentlySelectedCategories;
						QuickFolders.Model.addFolder(newFolderUri, cat);
					}
					// move emails or jump to folder after creation
					if (isQuickMove) {
						QuickFolders.quickMove.execute(newFolderUri, parentFolder.name);
					}
					else if (isFindFolder) { // quickJump (we do not jump into folder when "New Subfolder" button is clicked)
						QuickFolders_MySelectFolder(newFolderUri, true);
					}
					if (isFindFolder) { // tidy up quickMove menu
						QI.findFolder(false);
						QI.hideFindPopup();
					}
		    },
				function failedCreateFolder(ex) {
					util.logException('getOrCreateFolder() ', ex);
				}
			);
	},

	onSearchMessages: function onSearchMessages(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onSearchMessages() folder = " + folder.prettyName);
		// Tb:  // gFolderTreeController.searchMessages();
		MsgSearchMessages(folder);
	} ,

	// forceOnCommand use the "old" way of oncommand attribute for QF options dialog
	buildPaletteMenu: function buildPaletteMenu(currentColor, existingPopupMenu, ignoreTheme, forceOnCommand) {
		const Themes = QuickFolders.Themes.themes,
		      util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					QI = QuickFolders.Interface;
		let logLevel = (typeof existingPopupMenu === 'undefined') ? "interface.tabs" : "interface",
        popupTitle = existingPopupMenu ? existingPopupMenu.id : 'none';
		util.logDebugOptional(
			logLevel,
			"buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + popupTitle + ")");
		let menuColorPopup = existingPopupMenu ? existingPopupMenu : this.createIconicElement('menupopup','*');
		try {
			const colorText = this.getUIstring("qfMenuColor", "Color");
			// only flat style + apple pills support palette color
			if (ignoreTheme
			    || prefs.CurrentThemeId == Themes.ApplePills.Id
					|| prefs.CurrentThemeId == Themes.Flat.Id) {
				for (let jCol=0; jCol<=20;jCol++) {
					let menuitem = this.createIconicElement('menuitem', 'color menuitem-iconic'),
					    id = "qfColor"+jCol;
					menuitem.setAttribute("tag", id);
					if (jCol) {
						menuitem.setAttribute('label', colorText + " "+ jCol);
						//menuitem.setAttribute("style","background-image:url('cols/tabcol-" + jCol + ".png')!important;");
						if (currentColor == jCol)
							menuitem.checked = true;
					}
					else
						menuitem.setAttribute('label',this.getUIstring("qfMenuTabColorNone", "No Color!"));
/* 					if (QI.isCommandListeners) {
						menuitem.addEventListener("command",
						function(event) {
							if (!QI.checkIsDuplicateEvent({id:id}))
								QI.setTabColorFromMenu(menuitem, jCol);
							}, false);
					}
					if (QI.isOncommandAttributes || forceOnCommand)
						this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')");
 */
          menuColorPopup.appendChild(menuitem);
				}
			}
			else {
				const ELLIPSIS = "\u2026".toString();
				let menuitem = this.createIconicElement('menuitem','*');
				menuitem.setAttribute('label',this.getUIstring("qfMenuTabColorDisabledInTheme", "Select different Theme to support coloring" + ELLIPSIS));
				// open "bling my tabs"
				// this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.viewOptions(2)");
				menuitem.addEventListener("command", function(event) { QI.viewOptions(2); }, false);
				menuColorPopup.appendChild(menuitem);
			}
			// create color pick items
			util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");
		}
		catch(ex) {
			util.logException('Exception in buildPaletteMenu ', ex);
		}

		return menuColorPopup;
	} ,

	// broke out for re-use in a new Mail folder commands button on the current folder toolbar
	//   MailCommands = pass the popup menu in which to create the menu
	//   folder = related folder
	//   button = parent button
	//   menupopup = top level menu, passed in for "direct commands" such as mark folder read
	appendMailFolderCommands: function appendMailFolderCommands(MailCommands, folder, isRootMenu, button, menupopup) {
		const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					QI = QuickFolders.Interface;
		function createMailCmdMenuItem(id, label, tag)  {
			let menuItem = QI.createIconicElement('menuitem');
			menuItem.setAttribute("id",id);
			if (label)
				menuItem.setAttribute('label', label);
			if (tag)
				menuItem.setAttribute('tag', tag);
			return menuItem;
		}
    let topShortCuts = 0,
		    menuitem;
		// Empty Trash
		if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH
			&&
			prefs.getBoolPref("folderMenu.emptyTrash"))
		{
			menuitem = this.createMenuItem_EmptyTrash();
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++;
		}

		// Get Newsgroup Mail
		if ((folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP)
			&&
			prefs.getBoolPref("folderMenu.getMessagesForNews"))
		{
			menuitem = createMailCmdMenuItem("folderPaneContext-getMessages" , this.getUIstring("qfGetMail", "Get Messages…"));

/* 			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({id:"folderPaneContext-getMessages"}))
						QI.onGetMessages(menuitem); },
					false);
			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
 */
      menuitem.setAttribute('accesskey',this.getUIstring("qfGetMailAccess", "G"));
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++ ;
		}

    /*** TOP LEVEL MENU  ***
     * append to main menupopup - special commands for special folders
     */
    if (menupopup && folder) {
      // Get Mail - at top of Inbox menu!
      if ((folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_INBOX)
        &&
        !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)
        &&
        prefs.getBoolPref("folderMenu.getMessagesForInbox"))
      {
        menuitem = this.createMenuItem_GetMail(folder);
        if (menuitem) {
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
      }

      try {
        // download all
        // server.type = protocol type, that is "pop3", "imap", "nntp", "none", and so on
        let srv = folder.server || null;
        if (srv) {
          let type = srv.type;
          if (type !== 'nntp' // newsgroups have their own "Get Messages" Command
              &&
              type !== 'pop3'
              &&
              type !== 'none'  // local folders
              &&
              !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_INBOX)) {
              let downloadLabel = this.getUIstring("qfDownloadAll", "Download Now") + " [" + type + "]";
							menuitem = createMailCmdMenuItem("folderPaneContext-downloadAll", downloadLabel);
/* 							if (QI.isOncommandAttributes)
								this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDownloadAll(this);");
							if (QI.isCommandListeners) menuitem.addEventListener("command",
								function(event) {
									if (!QI.checkIsDuplicateEvent({id:"folderPaneContext-downloadAll"}))
										QI.onDownloadAll(menuitem);
								}, false);
 */              // MailCommands.appendChild(menuitem);
              // if (isRootMenu)
              menupopup.appendChild(menuitem);
              topShortCuts ++ ;
          }
        }
      }
      catch(ex) {
			  util.logException('Exception in appendMailFolderCommands for ' + folder.name + ' this should have a server property!', ex);
      }

      // MarkAllRead (always on top)
      if (!(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
        &&
        !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK))
      {
        let isVirtual = (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)==true;
        if (prefs.getBoolPref("folderMenu.markAllRead")) // && folder.getNumUnread(false)>0
        {
          menuitem = this.createMenuItem_MarkAllRead(isVirtual);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
        // add mark folder + subfolders as read. [issue 3] - need to check for subfolders being unread status!!
        if (prefs.getBoolPref("folderMenu.markAllReadRecursive")) {
          menuitem = this.createMenuItem_MarkAllRead(isVirtual, true);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
      }
    }

		if (util.Application!="Postbox"
		    &&
		    prefs.getBoolPref("folderMenu.emptyJunk"))
		{
			// EmptyJunk
			if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
				menuitem = this.createMenuItem_EmptyJunk();
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu)
						topShortCuts ++ ;
				}
			}
			else if (!(folder.flags & (util.FolderFlags.MSG_FOLDER_FLAG_TRASH | util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP))
				&& button.id == "QuickFoldersCurrentFolder"
				&& prefs.getBoolPref("folderMenu.emptyJunk")
				) {
				// delete Junk
				menuitem = this.createMenuItem_DeleteJunk();
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu)
						topShortCuts ++ ;
					}
			}
		}

		// EditVirtualFolder
		if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) {
			let id = "folderPaneContext-virtual";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfEditVirtual", "Search Properties…"), "searchProperties");
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEditVirtualFolder(this);");
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onEditVirtualFolder(menuitem);
					}, false);
 */
      menuitem.setAttribute('accesskey',this.getUIstring("qfEditVirtualAccess", "S"));
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++ ;
		}

		// CompactFolder
		if (folder.canCompact) {
			let id = "folderPaneContext-compact";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfCompactFolder", "Compact Folder"), "qfCompact");
			menuitem.setAttribute("accesskey",this.getUIstring("qfCompactFolderAccess","C"));

/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onCompactFolder(this,'compactFolder')");
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onCompactFolder(menuitem,'compactFolder');
				}, false);
 */
      MailCommands.appendChild(menuitem);
		}

		// ===================================
		if (topShortCuts>0)
			MailCommands.appendChild(this.createIconicElement('menuseparator','*'));

		// NewFolder
		if (folder.canCreateSubfolders) {
			let id = "folderPaneContext-new";
			menuitem = createMailCmdMenuItem(id,this.getUIstring("qfNewFolder","New Subfolder…"));
			// this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onNewFolder(this,event);");
			// what about the click event bubbling up?
			menuitem.addEventListener("click",
			  function(event) {
					if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onNewFolder(menuitem, event);
				}, false); // menuitem instead of this (represent the calling element)

			menuitem.setAttribute("accesskey",this.getUIstring("qfNewFolderAccess","N"));
			MailCommands.appendChild(menuitem);
		}

		// DeleteFolder
		try {
			if (folder.deletable) {
				let id = "folderPaneContext-remove";
				menuitem = createMailCmdMenuItem(id, this.getUIstring("qfDeleteFolder", "Delete Folder"));
/* 				if (QI.isOncommandAttributes)
				  this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDeleteFolder(this);");
				if (QI.isCommandListeners) menuitem.addEventListener("command",
					function(event) {
						if (!QI.checkIsDuplicateEvent({id:id}))
							QI.onDeleteFolder(menuitem);
					}, false);
 */
				menuitem.setAttribute("accesskey",this.getUIstring("qfDeleteFolderAccess","D"));
				MailCommands.appendChild(menuitem);
			}
		} catch(e) {;}

		// RenameFolder
		if (folder.canRename) {
			let id = "folderPaneContext-rename";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfRenameFolder", "Rename Folder"));
/* 			if (QI.isOncommandAttributes)
			  this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onRenameFolder(this);");
			if (QI.isCommandListeners) menuitem.addEventListener("command",
			  function(event) {
				  if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onRenameFolder(menuitem);
				}, false);
 */
      menuitem.setAttribute("accesskey",this.getUIstring("qfRenameFolderAccess","R"));
			MailCommands.appendChild(menuitem);
			MailCommands.appendChild(this.createIconicElement('menuseparator','*'));
		}

		// Repair Folder
		menuitem = createMailCmdMenuItem("quickFoldersFolderRepair", this.getUIstring("qfFolderRepair","Repair Folder"), "qfFolderRepair");
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderRepairAccess","F"));
/* 		if (QI.isOncommandAttributes)
		  this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onRepairFolder(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:"quickFoldersFolderRepair"}))
					QI.onRepairFolder(menuitem);
			}, false);
 */
    MailCommands.appendChild(menuitem);

		// Search Messages
		let srchMenu = util.getMail3PaneWindow().document.getElementById("folderPaneContext-searchMessages")
		menuitem = createMailCmdMenuItem("quickFolders-folderSearchMessages", srchMenu.getAttribute('label'), "qfFolderSearch");
		let ak = srchMenu.getAttribute('accesskey');
		if (ak) menuitem.setAttribute("accesskey", ak);
/* 		if (QI.isOncommandAttributes)
		  this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onSearchMessages(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:"quickFolders-folderSearchMessages"}))
					QI.onSearchMessages(menuitem);
			}, false); */
		MailCommands.appendChild(menuitem);

		// Folder Properties
		menuitem = createMailCmdMenuItem("folderPaneContext-properties", this.getUIstring("qfFolderProperties","Folder Properties…"));
/* 		if (QI.isOncommandAttributes)
      this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onFolderProperties(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:"folderPaneContext-properties"}))
					QI.onFolderProperties(menuitem);
			}, false); */
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderPropertiesAccess","P"));
		MailCommands.appendChild(menuitem);

		// Open in File System
		MailCommands.appendChild(this.createIconicElement('menuseparator','*'));
		menuitem = createMailCmdMenuItem("quickFolders-openFolderLocation", this.getUIstring("qfFolderOpenLocation","Explore Folder Location…"));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onFolderOpenLocation(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:"quickFolders-openFolderLocation"}))
					QI.onFolderOpenLocation(menuitem);
			}, false); */
		MailCommands.appendChild(menuitem);

	} ,

	buildQuickFoldersCommands: function buildQuickFoldersCommands(vars) {
		const { util, prefs, entry, folder, button } = vars,
		      QI = QuickFolders.Interface;
		/***  QUICKFOLDERS COMMANDS   ***/
			let QFcommandPopup = this.createIconicElement('menupopup','*');
		QFcommandPopup.className = 'QuickFolders-folder-popup';

		// tab colors menu
		// we should clone this!
			let colorMenu = this.createIconicElement('menu','*');
		colorMenu.setAttribute("tag",'qfTabColorMenu');
		colorMenu.setAttribute("label", this.getUIstring("qfMenuTabColorPopup", "Tab Color") );
		colorMenu.className = 'QuickFolders-folder-popup';
		colorMenu.setAttribute("class","menu-iconic");

		util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

		if (entry) {
			// SelectColor
			if (folder)
				util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "…");
			let menuColorPopup = this.buildPaletteMenu(entry.tabColor ? entry.tabColor : 0);
			colorMenu.appendChild(menuColorPopup);
		}
		this.initElementPaletteClass(QFcommandPopup, button);

		if (!entry)
			return null;

		// append color menu to QFcommandPopup
		QFcommandPopup.appendChild(colorMenu);

		// SelectCategory
    let menuitem = this.createIconicElement('menuitem', 'cmd menuitem-iconic');
		menuitem.setAttribute('tag','qfCategory');
		menuitem.setAttribute('label',this.getUIstring('qfSetCategory', 'Set Bookmark Category…'));
		menuitem.setAttribute('accesskey',this.getUIstring('qfSetCategoryA', 'C'));

/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, 'oncommand', 'QuickFolders.Interface.configureCategory_FromMenu(this)');
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({tag:"qfCategory"}))
					QI.configureCategory_FromMenu(menuitem);
				}, false);
        */

		QFcommandPopup.appendChild(menuitem);

		if (entry.category) {
			// RemoveFromCategory
      menuitem = this.createIconicElement('menuitem', 'cmd menuitem-iconic');
			menuitem.setAttribute('tag','qfRemoveCategory');
			menuitem.setAttribute('label',this.getUIstring('qfRemoveCategory', 'Remove from Category'));

/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.removeFromCategory(this)');
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
				  if (!QI.checkIsDuplicateEvent({tag:"qfRemoveCategory"}))
						QI.removeFromCategory(menuitem);
				}, false);
 */
      QFcommandPopup.appendChild(menuitem);
		}

		// DeleteQuickFolder
    menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
		menuitem.setAttribute('tag','qfRemove');

		menuitem.setAttribute('label',this.getUIstring('qfRemoveBookmark', 'Remove bookmark'));
		menuitem.setAttribute('accesskey',this.getUIstring('qfRemoveBookmarkAccess','R'));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRemoveBookmark(this)');
		if (QI.isCommandListeners) menuitem.addEventListener("command",
		  function(event) {
			  if (!QI.checkIsDuplicateEvent({tag:"qfRemove"}))
					QI.onRemoveBookmark(menuitem);
			}, false);
 */		QFcommandPopup.appendChild(menuitem);

		// RenameQuickFolder
    menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
		menuitem.setAttribute('tag','qfRename');
		menuitem.setAttribute('label',this.getUIstring('qfRenameBookmark','Rename Bookmark'));
		menuitem.setAttribute('accesskey',this.getUIstring('qfRenameBookmarkAccess','R'));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRenameBookmark(this)');
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
			  if (!QI.checkIsDuplicateEvent({tag:"qfRename"}))
					QI.onRenameBookmark(menuitem); }, false);
 */
    QFcommandPopup.appendChild(menuitem);

		if (prefs.getBoolPref("commandMenu.lineBreak")) {
			let tag = entry.breakBefore ? 'qfBreakDel' : 'qfBreak';
			menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
			menuitem.setAttribute('tag', tag);
			let brString = entry.breakBefore ? this.getUIstring('qfRemoveLineBreak', 'Remove Line Break!') : this.getUIstring('qfInsertLineBreak', 'Insert Line Break!')
			menuitem.setAttribute('label', brString);
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onBreakToggle(this)');
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({tag:tag}))
						QI.onBreakToggle(menuitem); }, false);
 */
      QFcommandPopup.appendChild(menuitem);
		}

		if (prefs.getBoolPref("commandMenu.separator")) {
			let tag = entry.separatorBefore ? 'qfSeparatorDel' : 'qfSeparator';
			menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
			menuitem.setAttribute('tag', tag);
			let lbString = entry.separatorBefore ? this.getUIstring('qfRemoveSeparator', 'Remove Separator!') : this.getUIstring('qfInsertSeparator', 'Insert Separator!')
			menuitem.setAttribute('label', lbString);
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onSeparatorToggle(this)');
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({tag:tag}))
						QI.onSeparatorToggle(menuitem); }, false);
 */
      QFcommandPopup.appendChild(menuitem);
		}

		let menuItemToClone;

      QFcommandPopup.appendChild(this.createIconicElement('menuseparator','*'));

		// moved icon stuff down to bottom
		if (prefs.getBoolPref("commandMenu.icon")) {
      menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
			menuitem.setAttribute('tag', 'qfIconAdd');
			menuitem.setAttribute('label',this.getUIstring('qfSelectIcon','Customize Icon…'));
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onSelectIcon(this, event)');
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({tag:'qfIconAdd'}))
						QI.onSelectIcon(menuitem); }, false);
 */
      QFcommandPopup.appendChild(menuitem);

      menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
			menuitem.setAttribute('tag', 'qfIconRemove');
			menuitem.setAttribute('label',this.getUIstring('qfRemoveIcon','Remove Customized Icon…'));
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRemoveIcon(this, event)');
			if (QI.isCommandListeners) menuitem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({tag:'qfIconRemove'}))
						QI.onRemoveIcon(menuitem); }, false);
 */ 
      if (!entry.icon)
				menuitem.collapsed = true;
			QFcommandPopup.appendChild(menuitem);

		}

    menuitem = this.createIconicElement('menuitem','cmd menuitem-iconic');
		menuitem.setAttribute('tag', 'qfTabAdvanced');
		menuitem.setAttribute('type', 'checkbox'); // some themes need this to display a checkmark
		menuitem.setAttribute('label',this.getUIstring('qfTabAdvancedOptions', 'Advanced Properties…'));
		menuitem.type = 'checkbox';
		if (entry.flags || entry.toAddress || entry.fromIdentity) {
			menuitem.setAttribute('checked', 'true');
		}
		else
			menuitem.setAttribute('checked', 'false');

		// we want the coordinates, therefore using click event:
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, 'onclick','QuickFolders.Interface.onAdvancedProperties(event, this);');
 */
    QFcommandPopup.appendChild(menuitem);

		// Options, Support and Help
		if (prefs.getBoolPref("commandMenu.options")
			 ||
			 prefs.getBoolPref("commandMenu.support")
			 ||
			 prefs.getBoolPref("commandMenu.help")
			 ) {
			// --------------------
			QFcommandPopup.appendChild(document.createXULElement ? document.createXULElement('menuseparator') : document.createElement('menuseparator'));
		}

		if (prefs.getBoolPref("commandMenu.options")) {
			// Options
			menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-options');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

		// Support
		if (prefs.getBoolPref("commandMenu.support")) {
			menuItemToClone = document.getElementById('QuickFolders-ToolbarPopup-support');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

		// Help
		if (prefs.getBoolPref("commandMenu.help")) {
			menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-help');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

    let QuickFolderCmdMenu = this.createIconicElement('menu', 'cmd menu-iconic');
		QuickFolderCmdMenu.setAttribute('id','quickFoldersCommands');
		QuickFolderCmdMenu.setAttribute('label',this.getUIstring("qfCommandPopup",'QuickFolders Commands'));
		QuickFolderCmdMenu.setAttribute("accesskey",this.getUIstring("qfCommandAccess","Q"));
		QuickFolderCmdMenu.className='cmd menu-iconic'; //  QuickFolders-folder-popup ?
		QuickFolderCmdMenu.appendChild(QFcommandPopup);
		// [Bug 26571] Add Option to hide QF command submenu
		if (prefs.getBoolPref('commandMenu.CTRL')) {
			// hide the popup menu item (we can still use the contained menu items when hitting CTRL)
			QuickFolderCmdMenu.style.display = "none";
		}

    return QuickFolderCmdMenu;
	} ,

	// discard duplicate click / command events
	checkIsDuplicateEvent : function checkIsDuplicateEvent(o) {
		const util = QuickFolders.Util,
					QI = QuickFolders.Interface;
		try {
			if (!QI.LastHandledEvent) return false;
			let timePassed = (new Date()).getTime() - QI.LastHandledEvent.time;
			let compare = (o.id) ? o.id : o.tag,
					isMatch = ((o.id) ? QI.LastHandledEvent.id == o.id : false)
					          ||
										((o.tag) ? QI.LastHandledEvent.tag == o.tag : false);
			if (QI.LastHandledEvent && isMatch) {
				util.logDebug("Repeat event [" + compare + "] within " + timePassed + "ms.");
				if (timePassed<1000) {
					util.logDebug("discarding duplicate event");
					return true;
				}
			}
			return false;
		}
		catch(ex) { util.logException("checkIsDuplicateEvent", ex);}
		finally {
			QI.setLastHandledEvent(o);
		}
	} ,


	clickHandler: function clickHandler(evt, element) {
		const prefs = QuickFolders.Preferences,
          util = QuickFolders.Util,
					QI = QuickFolders.Interface;
		let msg = evt.type + " event from popup - QI.clickHandler()";
		if (prefs.isDebugOption('popupmenus')) debugger;
		if (evt.target) {
			let isHandled = false,
			    isTagHandler = true,
					isIdHandler = true,
			    menuitem = element,
			    cmd = evt.target.getAttribute('oncommand'),
			    lbl = evt.target.getAttribute("label"),
			    tag = evt.target.getAttribute("tag"),
					id = evt.target.id || null;
			if (!tag) isTagHandler = false;
			if (!id) isIdHandler = false;
			if (cmd) msg += "\n oncommand=" + cmd;
			if (lbl) msg += "\n label=" + lbl;
			if (tag) msg += "\n tag=" + tag;
			util.logDebug(msg);
			if (menuitem.tagName=="menupopup" && evt)
				menuitem = evt.originalTarget;
			// emergency code for Tb60
			if (tag) {
				if (QI.checkIsDuplicateEvent({tag:tag}))
					return;
				let par = element.parentNode;
				while(par && par.parentNode && par.tagName != "toolbarbutton") par = par.parentNode;
				let folder = par ? par.folder : null;
				switch (tag) {
					case 'openNewTab': // precedence over id (the menuitem may have no id)
						QI.openFolderInNewTab(folder);
					  break;
					case 'qfCategory':
						QI.configureCategory_FromMenu(menuitem);
					  break;
					case "qfRemoveCategory":
						QI.removeFromCategory(menuitem);
					  break;
					case "qfFolderSearch":
						QI.onSearchMessages(menuitem);
					  break;
					case "qfRemove":
						QI.onRemoveBookmark(menuitem);
					  break;
					case "qfRename":
						QI.onRenameBookmark(menuitem);
					  break;
					case "qfBreakDel": case "qfBreak":
						QI.onBreakToggle(menuitem);
					  break;
					case "qfSeparatorDel": case "qfSeparator":
						QI.onSeparatorToggle(menuitem);
						break;
					case "qfIconAdd":
						QI.onSelectIcon(menuitem,evt);
					  break;
					case "qfIconRemove":
						QI.onRemoveIcon(menuitem,evt);
					  break;
					case "qfTabAdvanced":
					  QI.onAdvancedProperties(evt, menuitem);
					  break;
					default:
					  isTagHandler = false;
				}
				if (tag.indexOf("qfColor")==0) {
					let jCol = parseInt(tag.substr(7));
					QI.setTabColorFromMenu(menuitem, jCol);
					isTagHandler = true;
				}
			}
			if (id && !isTagHandler) { // include case: if both were given but tag handler didn't do it.
				if (QI.checkIsDuplicateEvent({id:id}))
					return;
				switch (id) {
					case "folderPaneContext-openNewTab":
						QI.openFolderInNewTab(folder);
						break;
					case "folderPaneContext-getMessages":
						QI.onGetMessages(menuitem);
						break;
					case "folderPaneContext-emptyTrash":
						QI.onEmptyTrash(menuitem);
					  break;
					case "folderPaneContext-markMailFolderAllRead":
					  QI.onMarkAllRead(menuitem, evt);
					  break;
					case "folderPaneContext-markMailFolderAllReadRecursive":
					  QI.onMarkAllRead(menuitem, evt, true);
					  break;
					case "deleteJunk":
						QI.onDeleteJunk(menuitem);
						break;
			    case "folderPaneContext-emptyJunk": // [Bug 26590]
						QI.onEmptyJunk(menuitem);
					  break;
					case "folderPaneContext-new":
					  QI.onNewFolder(menuitem, evt);
					  break;
					case "folderPaneContext-remove":
					  QI.onDeleteFolder(menuitem);
					  break;
					case "folderPaneContext-rename":
					  QI.onRenameFolder(menuitem);
					  break;
					case "quickFoldersFolderRepair":
						QI.onRepairFolder(menuitem);
						break;
					case "folderPaneContext-properties":
						QI.onFolderProperties(menuitem);
					  break;
					case "folderPaneContext-searchMessages":
						QI.onSearchMessages(menuitem);
					  break;
					case "folderPaneContext-virtual":
						QI.onEditVirtualFolder(menuitem);
					  break;
					case "folderPaneContext-compact":
						QI.onCompactFolder(menuitem,'compactFolder');
						break;
					case "quickFolders-openFolderLocation":
						QI.onFolderOpenLocation(menuitem);
						break;
					case "quickFolders-folderSearchMessages":
						QI.onSearchMessages(menuitem);
					  break;

					default:
					  isIdHandler = false;
				}
			}
			if( isIdHandler || isTagHandler )
				util.logDebug("..handled command from click event.");
			else
				util.logDebug("No emergency handler for this event type.");
		}
		else
			util.logDebug("Click event but missing event target.");

	} ,

	// against duplication of events, log time in ms
	setLastHandledEvent: function setLastHandledEvent(o) {
		QuickFolders.Interface.LastHandledEvent = {
			id: '',
			tag: '',
			time: (new Date()).getTime()
		}
		if (o.id)
			QuickFolders.Interface.LastHandledEvent.id = o.id;
		if (o.tag)
			QuickFolders.Interface.LastHandledEvent.tag = o.tag;
	},

	tearDownMenu: function tearDownMenu(menu) {
		while (menu.hasChildNodes())
			this.tearDownMenu(menu.lastChild);
		menu.parentNode.removeChild(menu);
	},

	// noCommands suppress all command menu items + submenus
	addPopupSet: function addPopupSet(popupSetInfo) {
    let folder = popupSetInfo.folder,
        popupId = popupSetInfo.popupId,
        entry = popupSetInfo.entry,
        offset = popupSetInfo.offset || 0,
        button = popupSetInfo.button,
        noCommands = popupSetInfo.noCommands,
        evt = popupSetInfo.event || null; // new for [Bug 26703]


		const prefs = QuickFolders.Preferences,
		      Ci = Components.interfaces,
          util = QuickFolders.Util,
					showCommandsSubmenus = !(noCommands),
					QI = QuickFolders.Interface;
		let xp = document.getElementById(popupId);
    if (!entry && folder)
      entry = QuickFolders.Model.getFolderEntry(folder.URI);


    if (xp && xp.parentNode)  {
      this.tearDownMenu(xp);
		}

		// else { ...see below...  }
    let menupopup = document.createXULElement ? document.createXULElement('menupopup') : document.createElement('menupopup'),
        menuitem;

    menupopup.setAttribute('id', popupId);
    menupopup.setAttribute('position', 'after_start'); //
    // [Bug 26575] (safety?) - seems to be only triggered on non folder commands
    this.setEventAttribute(menupopup, 'onclick',"QuickFolders.Interface.clickHandler(event,this);");
    this.setEventAttribute(menupopup, 'oncommand',"QuickFolders.Interface.clickHandler(event,this);");
    menupopup.className = 'QuickFolders-folder-popup';
    menupopup.folder = folder;
    let MailCommands,
        isRootMenu=false,
        fi = null,
        isHideMailCommands = evt ? (!evt.ctrlKey && prefs.getBoolPref('folderMenu.CTRL')) : false;

    if (folder) {
      util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name + "\nId: " + popupId);
      fi = folder.QueryInterface(Ci.nsIMsgFolder);

      /* In certain cases, let's append mail folder commands to the root menu */
      if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) {
        // newsgroups have no subfolders anyway
        MailCommands = menupopup;
        isRootMenu = true;
      }
      else {
        MailCommands = this.createIconicElement('menupopup', 'QuickFolders-folder-popup');
        // removed mailCmd menu-iconic from class [Bug 26575]
        isRootMenu = false;
      }
    }


    if (showCommandsSubmenus) {
      // [Bug 26703] Add option to hide mail commands popup menu
      if (folder) {
        /***  MAIL FOLDER COMMANDS	 ***/
        // 0. BUILD MAIL FOLDER COMMANDS
        this.appendMailFolderCommands(MailCommands, fi, isRootMenu, button, menupopup);

        // special folder commands: at top, as these are used most frequently!
        // 1. TOP LEVEL SPECIAL COMMANDS
        let topShortCuts = 0;
        if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH) {
          menuitem = this.createMenuItem_EmptyTrash();
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
          menuitem = this.createMenuItem_EmptyJunk();
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (prefs.getBoolPref("folderMenu.openNewTab")) {
          let newTabMenuItem = document.getElementById('folderPaneContext-openNewTab');
          // folder listener sometimes throws here?
          let label = newTabMenuItem && newTabMenuItem.label ? newTabMenuItem.label.toString() : "Open in New Tab";
          let menuitem = this.createMenuItem('', label);
          // oncommand="gFolderTreeController.newFolder();"
          menuitem.className = 'cmd menuitem-iconic';
          menuitem.setAttribute("tag", "openNewTab");
          menuitem.addEventListener('command',
            function(event) {
              if (!QI.checkIsDuplicateEvent({tag:'openNewTab', id:'folderPaneContext-openNewTab'}))
                QI.openFolderInNewTab(fi);
            } , true);
          // this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.openFolderInNewTab();");

          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (topShortCuts>0 && fi.hasSubFolders) // separator only if necessary
          menupopup.appendChild(this.createIconicElement('menuseparator','*'));
      }

      // 2. QUICKFOLDERS COMMANDS
      if (button.id != "QuickFoldersCurrentFolder" && showCommandsSubmenus) {
        let qfCmdsMenu = this.buildQuickFoldersCommands( {util, prefs, entry, folder, button} );
        if (qfCmdsMenu) menupopup.appendChild(qfCmdsMenu);
      }

      // 3. APPEND MAIL FOLDER COMMANDS
      if (folder && menupopup != MailCommands && !isHideMailCommands) {
        // Append the Mail Folder Context Menu...
        let MailFolderCmdMenu = this.createIconicElement('menu');
        MailFolderCmdMenu.setAttribute('id','quickFoldersMailFolderCommands');
        MailFolderCmdMenu.setAttribute('label', this.getUIstring("qfFolderPopup",'Mail Folder Commands'));
        MailFolderCmdMenu.setAttribute("accesskey", this.getUIstring("qfFolderAccess","F"));

        MailFolderCmdMenu.appendChild(MailCommands);
        menupopup.appendChild(MailFolderCmdMenu);
      }
    }

    // 3. APPEND SUBFOLDERS
    //moved this out of addSubFoldersPopup for recursive menus
    if (fi && fi.hasSubFolders) {
      util.logDebugOptional("popupmenus","Creating SubFolder Menu for " + folder.name + "…");
      if (showCommandsSubmenus)
        menupopup.appendChild(this.createIconicElement('menuseparator','*'));
      this.debugPopupItems=0;
      this.addSubFoldersPopup(menupopup, folder, false);
      util.logDebugOptional("popupmenus","Created Menu " + folder.name + ": " + this.debugPopupItems + " items.\n-------------------------");
    }

    if (offset>=0) {
      // should we discard the old one if it exists?
      this.menuPopupsByOffset[offset] = menupopup;
    }

    // remove last popup menu (if button is reused and not created from fresh!)
    // this needed in minimal rebuild as we reuse the buttons!
    if (button.firstChild && button.firstChild.tagName=="menupopup")
      button.removeChild(button.firstChild);

    // we might have created an empty popup so only append it if it has child Nodes
    if (menupopup.children && menupopup.children.length) {
      button.appendChild(menupopup);
    }


	} ,

	// append a button with mail folder commands (onclick)
	showCurrentFolderMailContextMenu: function showCurrentFolderMailContextMenu(button) {
		let menupopup = this.createIconicElement('menupopup','*'),
        util = QuickFolders.Util,
				QI = QuickFolders.Interface,
		    folder = util.CurrentFolder;
		menupopup.setAttribute('position','after_start'); //
		menupopup.id = 'QuickFolders-CurrentMailFolderCommandsPopup';

		menupopup.className = 'QuickFolders-folder-popup';

		button.folder = folder;

		util.logDebugOptional("popupmenus","Creating Popup Set for Mail Commands - " + folder.name);
		menupopup.folder = folder;

    // remove the old menu:
    for (let i = button.childNodes.length-1; i>0; i--) {
      let el = button.childNodes[i];
      if (el.tagName == "menupopup" && el.id == menupopup.id) {
        button.removeChild(el);
      }
    }
		button.appendChild(menupopup);

    // last parameter: pass in menupopup for "promoting" top level items such as "Mark Folder as Read"
		QI.appendMailFolderCommands(menupopup, folder, true, button, menupopup);
    
    this.setEventAttribute(menupopup, 'onclick',"QuickFolders.Interface.clickHandler(event,this);");
    this.setEventAttribute(menupopup, 'oncommand',"QuickFolders.Interface.clickHandler(event,this);");
    
    
		QI.showPopup(button, menupopup.id, null);
	} ,

	createMenuItem_DeleteJunk: function createMenuItem_DeleteJunk() {
		const QI = QuickFolders.Interface,
		      id = "deleteJunk";
		let menuitem = this.createIconicElement('menuitem');
		menuitem.setAttribute("id", id);
		menuitem.setAttribute('label',this.getUIstring("qfDeleteJunk", "Purge Junk"));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDeleteJunk(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:id}))
					QI.onDeleteJunk(menuitem);
				},
				false); */
		return menuitem;
	} ,

	createMenuItem_EmptyJunk: function createMenuItem_EmptyJunk() {
		const QI = QuickFolders.Interface,
		      id = "folderPaneContext-emptyJunk";
	  let menuitem = this.createIconicElement('menuitem');
		menuitem.setAttribute("id", id);
		menuitem.setAttribute('label', this.getUIstring("qfEmptyJunk", "Empty Junk"));
		menuitem.setAttribute('accesskey', this.getUIstring("qfEmptyJunkAccess", "Empty Junk"));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyJunk(this);");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:id}))
					QI.onEmptyJunk(menuitem);
				},
				false);
 */
    return menuitem;
	} ,

	createMenuItem_GetMail: function createMenuItem_GetMail(folder) {
    let server = '?';
		const QI = QuickFolders.Interface,
		      id = "folderPaneContext-getMessages"; // uses Thunderbird css
		try {
			// find out the server name
			// let's clone it ?
			let getMailMenuItem = this.createIconicElement('menuitem', '*'); // no className
			server = folder.server;
			getMailMenuItem.id = id;
			getMailMenuItem.folder=folder;
			getMailMenuItem.setAttribute('label', this.getUIstring("qfGetMail", "Get Messages…"));
			getMailMenuItem.setAttribute('accesskey', this.getUIstring("qfGetMailAccess", "G"));

			// use parent folder URI as each starting point
/* 			if (QI.isOncommandAttributes)
				this.setEventAttribute(getMailMenuItem, "oncommand","QuickFolders.Interface.onGetMessages(this)");
			if (QI.isCommandListeners) getMailMenuItem.addEventListener("command",
				function(event) {
					if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onGetMessages(getMailMenuItem);
					}, false);
 */
			return getMailMenuItem;
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception in createMenuItem_GetMail (Get Mail Command for Inbox): ' + server, ex);
			return null;
		}
	} ,

	createMenuItem_EmptyTrash: function createMenuItem_EmptyTrash() {
		const QI = QuickFolders.Interface,
		      id = "folderPaneContext-emptyTrash";
		let menuitem = this.createIconicElement('menuitem');
		menuitem.setAttribute("id", id);
		menuitem.setAttribute('label',this.getUIstring("qfEmptyTrash", "Empty Trash"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfEmptyTrashAccess","T"));
/* 		if (QI.isOncommandAttributes)
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyTrash(this);event.stopPropagation();");
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:id}))
					QI.onEmptyTrash(menuitem);
				event.stopPropagation();
				}, false); */
		return menuitem;
	} ,

	createMenuItem_MarkAllRead: function createMenuItem_MarkAllRead(disabled, recursive = false) {
		const QI = QuickFolders.Interface,
				  id = recursive ? "folderPaneContext-markMailFolderAllReadRecursive" : "folderPaneContext-markMailFolderAllRead";
    let menuitem = this.createIconicElement('menuitem');
		menuitem.setAttribute("id", id);
		menuitem.setAttribute('label',
      recursive ?
        this.getUIstring("qfMarkAllReadRecursive","Mark folder + subfolders as Read") :
        this.getUIstring("qfMarkAllRead","Mark Folder Read")
    );
    if (!recursive)
      menuitem.setAttribute('accesskey',this.getUIstring("qfMarkAllReadAccess","M"));
/* 		if (QI.isOncommandAttributes) {
      let t = recursive ? "true" : "false";
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onMarkAllRead(this, event, "+ t +");");
    }
		if (QI.isCommandListeners) menuitem.addEventListener("command",
			function(event) {
				if (!QI.checkIsDuplicateEvent({id:id}))
					QI.onMarkAllRead(menuitem, event, recursive);
				}, false); */
		if (disabled)
			menuitem.setAttribute("disabled", true);
		return menuitem;
	} ,

	// create menu items / elements anbd force inject XUL to deal with menu problems.
	// @cl: [class] use wildcard * for omitting classname (the exception)
	createIconicElement: function createIconicElement(tagName, cl) {
		let el = document.createXULElement ? document.createXULElement(tagName) : document.createElement(tagName);
		el.setAttribute("xmlns", "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
		if (cl != '*') {
			if (!cl)
				cl = 'mailCmd menuitem-iconic'; // default
			el.className = cl;
		}
		return el;
	} ,

	 /**
	* Sorts the passed in array of folder items using the folder sort key
	*
	* @param aFolders - the array of ftvItems to sort.
	*/
	sortFolderItems: function sortFolderItems(aFtvItems) {
		function sorter(a, b) {
			let sortKey;
			sortKey = a._folder.compareSortKeys(b._folder);
			if (sortKey)
				return sortKey;
			return a.text.toLowerCase() > b.text.toLowerCase();
		}
		aFtvItems.sort(sorter);
	} ,

	addSubMenuEventListener: function addSubMenuEventListener(subMenu, url) {
		// url is specific to this function context so it should be snapshotted from here
		// we need this workaround as TB2 does not support the 'let' keyword
		subMenu.addEventListener("click",
			function(evt) {
				QuickFolders.Interface.onSelectParentFolder(url, evt);
			}, false);
	} ,

	addDragToNewFolderItem: function addDragToNewFolderItem(popupMenu, folder) {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					Ci = Components.interfaces;
		try {
      if (typeof folder.server === 'undefined') return;

			util.logDebugOptional("dragToNew","addDragToNewFolderItem	" + folder.prettyName
				+ "\ncanCreateSubfolders = " + folder.canCreateSubfolders
				+ "\nserver.type = " + folder.server.type);
			if (!folder.canCreateSubfolders) return;
			let server=folder.server.QueryInterface(Ci.nsIMsgIncomingServer);// check server.type!!
			switch(server.type) {
				case 'pop3':
					if (!prefs.getBoolPref("dragToCreateFolder.pop3"))
						return;
					break;
				case 'imap':
					if (!prefs.getBoolPref("dragToCreateFolder.imap"))
						return;
					break;
				case 'none': // allow all local folders!
					if (!prefs.getBoolPref("dragToCreateFolder.local"))
						return;
					break;
				default:
					if (!prefs.getBoolPref("dragToCreateFolder." + server.type)) {
						util.logDebugOptional("dragToNew","Not enabled: drag & create new folder for server's of type: " + server.type);
						return;
					}
			}

			// New Folder... submenu items
			let folderPaneContext = document.getElementById('folderPaneContext');
			if (folderPaneContext) {
				let newMenuItem = document.getElementById('folderPaneContext-new');
				if (newMenuItem) {
					let createFolderMenuItem=newMenuItem.cloneNode(true);
					if (folder.hasSubFolders) {
						let sep = this.createIconicElement('menuseparator','*');
						popupMenu.appendChild(sep);
					}
					createFolderMenuItem.id=""; // delete existing menu
					createFolderMenuItem.id="folderPaneContext-new"; // for styling!
					createFolderMenuItem.folder=folder;
					createFolderMenuItem.setAttribute("class","menuitem-iconic");

					// use parent folder URI as each starting point
					this.setEventAttribute(createFolderMenuItem, "ondragenter","QuickFolders.popupDragObserver.dragEnter(event);");
					this.setEventAttribute(createFolderMenuItem, "ondrop","QuickFolders.popupDragObserver.drop(event);");  // only case where we use the dedicated observer of the popup!

					// [Bug 26425] option to put 'create new subfolder' on top
					if (prefs.getBoolPref('dragToCreateFolder.menutop'))
						popupMenu.insertBefore(createFolderMenuItem, popupMenu.firstChild);
					else
						popupMenu.appendChild(createFolderMenuItem);
				}
			}

		}
		catch(ex) {util.logException('Exception in addDragToNewFolderItem (adding drag Menu items): ', ex); }
	} ,

  // show a reusable label representing a folder path (for quickMove, quickJump and recent folders).
  // 0 - just folder.prettyName
  // 1 - folder.prettyName - Account  (default)
  // 2 - account - folder path
  // 3 - folder path
  // 4 - folder.URI  [for debugging]
  folderPathLabel : function folderPathLabel(detailType, folder, maxPathItems) {
    function folderPath(folder, maxAtoms, includeServer) {
      let pathComponents = '',
          chevron = ' ' + "\u00BB".toString() + ' ';
      while (folder && maxAtoms) {
        if (folder.isServer && !includeServer)
          return pathComponents;
        pathComponents = folder.prettyName
                       + (pathComponents ? chevron  : '')
                       + pathComponents;
        if (folder.isServer)
          break;
        maxAtoms--;
        folder = folder.parent;
      }
      return pathComponents;
    }

    let hostString;
    switch (detailType) {
      case 0: // folder name
        return folder.name;
      case 1: // folder name - account name
        hostString = folder.rootFolder.name;
        return folder.name + ' - ' + hostString;
      case 2: // account name - folder path (max[n])
        hostString = folder.rootFolder.name;
        let f = folder.URI.indexOf('://'),
            fullPath = f ? folder.URI.substr(f+3) : folder.URI;
        return hostString + ' - ' + folderPath(folder,  maxPathItems, false);
      case 3:
        return folderPath(folder,  maxPathItems, false);
      case 4: // for debugging
        return folder.URI;
    }
  } ,

	// isDrag: if this is set to true, then the command items are not included
	addSubFoldersPopupFromList: function addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, forceAlphaSort, isRecentFolderList) {
    function splitPath(path, maxAtoms) {
      let parts = path.split('/'),
          firstP = parts.length - maxAtoms,
          pathComponents = '',
          chevron=' ' + "\u00BB".toString() + ' '; // double angle quotation mark
      firstP = firstP>0 ? firstP : 1; // throw away account name
      for (let i=firstP; i<parts.length; i++) {
        pathComponents += ((i>firstP) ? chevron : '') + parts[i];
      }
      return pathComponents;
    }
    const tr = {"\xE0":"a", "\xE1":"a", "\xE2":"a", "\xE3":"a", "\xE4":"ae", "\xE5":"ae", "\xE6":"a",
						  "\xE8":"e", "\xE9":"e", "\xEA":"e", "\xEB":"e",
						  "\xF2":"o", "\xF3":"o", "\xF4":"o", "\xF5":"o", "\xF6":"oe",
						  "\xEC":"i", "\xED":"i", "\xEE":"i", "\xEF":"i",
						  "\xF9":"u", "\xFA":"u", "\xFB":"u", "\xFC":"ue", "\xFF":"y",
						  "\xDF":"ss", "_":"/", ":":"."},
					prefs = QuickFolders.Preferences,
					util = QuickFolders.Util,
					Cc = Components.classes, // [Bug 26593]
					Ci = Components.interfaces,
					QI = QuickFolders.Interface;
    let killDiacritics = function(s) {
			    return s.toLowerCase().replace(/[_\xE0-\xE6\xE8-\xEB\xF2-\xF6\xEC-\xEF\xF9-\xFC\xFF\xDF\x3A]/gi, function($0) { return tr[$0] })
		    },
		    subfolder,
		    done = false,
				// int: folder detail
				// 0 - just folder.prettyName
				// 1 - folder.prettyName - Account
				// 2 - account - folder path
				// 3 - folder path
				// 4 - folder.URI  [for debugging]
		    displayFolderPathDetail =
          isRecentFolderList
          ? prefs.getIntPref("recentfolders.folderPathDetail")
          : 0,
        maxPathItems = prefs.getIntPref("recentfolders.maxPathItems");

		util.logDebugOptional('popupmenus.subfolders', 'addSubFoldersPopupFromList(..)');
		while (!done) {
			// TB2 and Postbox:
			if (typeof subfolders.currentItem!='undefined')
				subfolder = subfolders.currentItem().QueryInterface(Ci.nsIMsgFolder);
			else {
				if (subfolders.hasMoreElements())
					subfolder = subfolders.getNext().QueryInterface(Ci.nsIMsgFolder);
				else {
					done=true;
					break;
				}
			}

			try {
				this.debugPopupItems++;
				let menuitem = this.createIconicElement('menuitem','*'),
				    menuLabel,
				    maxDetail = 4;
				if (displayFolderPathDetail > maxDetail)
					displayFolderPathDetail = maxDetail;
        menuLabel = this.folderPathLabel(displayFolderPathDetail, subfolder, maxPathItems);

				if (isRecentFolderList && prefs.getBoolPref('recentfolders.showTimeStamp'))  {
					menuLabel = util.getMruTime(subfolder) + ' - ' + menuLabel;
				}

				menuitem.setAttribute('label', menuLabel); //+ subfolder.URI
				menuitem.setAttribute("tag","sub");

				try {
					let iconURL = subfolder.parent && (subfolder.parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
						? "url('chrome://quickfolders/content/skin/ico/folder-trash-gnome-qf.png')"
						: ((typeof subfolder.getStringProperty != 'undefined') ? subfolder.getStringProperty("iconURL") : null);
					if (iconURL) {
						menuitem.style.setProperty('list-style-image', iconURL, '');
					}
				}
				catch(ex) {
          if (prefs.isDebug)
            util.logException('Error in addSubFoldersPopupFromList', ex);
        }

				let numUnread = subfolder.getNumUnread(false),
				    numUnreadInSubFolders = subfolder.getNumUnread(true) - numUnread,
				    sCount = ' (' + ((numUnread>0) ? numUnread : '') ;
				if (numUnread + numUnreadInSubFolders == 0)
					sCount = ''

				const triangleDown = "\u25be".toString();

				if (numUnreadInSubFolders+numUnread>0) {
					if(numUnreadInSubFolders > 0 && prefs.isShowCountInSubFolders)
						sCount += triangleDown + numUnreadInSubFolders+'';
					sCount += ")";
					if (!prefs.isShowCountInSubFolders && numUnread == 0)
						sCount="";

					menuitem.setAttribute("class","hasUnread menuitem-iconic");
					if (subfolder.hasNewMessages && prefs.isHighlightNewMail)
						menuitem.setAttribute("biffState-NewMail","true");
					menuitem.setAttribute('label', menuLabel + sCount);
				}
				else
					menuitem.setAttribute("class","menuitem-iconic");
				if (! (subfolder.hasSubFolders && prefs.isShowRecursiveFolders)) {

					// additional click event for safety in Thunderbird 60
					let vc = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator),
					    eventType;
					// for the new Thunderbird (60+)
					if (vc.compare(util.ApplicationVersion, "60.0") >= 0) {
						eventType = prefs.getStringPref('debug.popupmenus.folderEventType'); // "onclick" or "oncommand" - default is onclick
						if (eventType) {
							// [Bug 26575]
							util.logDebugOptional("popupmenus.items","add " + eventType + " event attribute for menuitem " + menuitem.getAttribute("label") + " onSelectSubFolder(" + subfolder.URI+ ")");
							this.setEventAttribute(menuitem, eventType,"QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "',event)");
						}
            // this change selects the wrong folder sometimes?
						/* menuitem.addEventListener("click",
							function(event) {
								QuickFolders.Interface.onSelectSubFolder(subfolder.URI, event);
							}, false);
						*/
					}
					else {
						// [Bug 26592] recent folder menus stopped working in THunderbird 52.9
						eventType = "oncommand";
						this.setEventAttribute(menuitem, eventType,"QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "',event)");
					}
					if (isRecentFolderList)
						util.logDebugOptional("popupmenus", "Added " + eventType + " event to " + menuLabel + " for " + subfolder.URI );
				}

				if (true) {
					// AG added "empty" click event to avoid bubbling to parent menu!
					// menuitem.addEventListener("click", function(evt) { evt.stopPropagation(); }, false);
				}

				menuitem.folder = subfolder;
				this.setEventAttribute(menuitem, "ondragenter","event.preventDefault();"); // fix layout issues...
				this.setEventAttribute(menuitem, "ondragover","QuickFolders.popupDragObserver.dragOver(event)"); // okay
				this.setEventAttribute(menuitem, "ondrop","QuickFolders.buttonDragObserver.drop(event);"); // use same as buttondragobserver for mail drop!
				this.setEventAttribute(menuitem, "ondragend","QuickFolders.popupDragObserver.dragExit(event);");

				if (forceAlphaSort) {
					// alpha sorting by starting from end of menu up to separator!
					let c = popupMenu.children.length-1, //count of last menu item
					    added = false,
					    sNewName = killDiacritics(subfolder.name);
					// >=1 exclude first item (name of container folder) - fixes [Bug 22901] - maybe insert separator as well
					// >=0 undo this change - fixes [Bug 21317]
					for (;c>=0 && popupMenu.children[c].hasAttribute('label');c--) {
						if (sNewName > killDiacritics(popupMenu.children[c].getAttribute('label')))
						{
							if (c+1 == popupMenu.children.length)
								popupMenu.appendChild(menuitem);
							else
								popupMenu.insertBefore(menuitem,popupMenu.children[c+1]);
							added=true;
							break;
						}
					}
					if (!added) { // nothing with a label was found? then this must be the first folder item in the menu
						if (c+1 >= popupMenu.children.length)
							popupMenu.appendChild(menuitem);
						else
							popupMenu.insertBefore(menuitem,popupMenu.children[c+1]);
					}
				} // end alphanumeric sorting
				else
					popupMenu.appendChild(menuitem);


				if (subfolder.hasSubFolders && prefs.isShowRecursiveFolders)
				{
					this.debugPopupItems++;
					let subMenu = this.createIconicElement('menu','*');
					subMenu.setAttribute("label", menuLabel + sCount);
					subMenu.className = 'QuickFolders-folder-popup menu-iconic' + ((numUnreadInSubFolders+numUnread>0) ? ' hasUnread' : '');

					// workaround for Phoenity - add the drop handler for buttons here
					// this.setEventAttribute(subMenu, "ondrop", "nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");

					if (subfolder.hasNewMessages)
						subMenu.setAttribute("biffState-NewMail","true");

					subMenu.folder = subfolder;
					try {
						// [Bug 26157] is folder deleted? use different icon!
						let iconURL = subfolder.parent && (subfolder.parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
						  ? "url('chrome://quickfolders/content/skin/ico/folder-trash-gnome-qf.png')"
						  :  ((typeof subfolder.getStringProperty != 'undefined')? subfolder.getStringProperty("iconURL") : null);
						if (iconURL) {
							subMenu.style.setProperty('list-style-image', iconURL, '');
						}
					}
					catch(ex) {;}

					this.setEventAttribute(subMenu, "ondragenter","QuickFolders.popupDragObserver.dragEnter(event);");
					this.setEventAttribute(subMenu, "ondrop","QuickFolders.buttonDragObserver.drop(event);"); // use same as buttondragobserver for mail drop!
					// this.setEventAttribute(subMenu, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(subMenu, "ondragend","QuickFolders.popupDragObserver.dragExit(event);");

					// 11/08/2010 - had forgotten the possibility of _opening_ the folder popup node's folder!! :)
					//subMenu.allowEvents=true;
					// oncommand did not work
					util.logDebugOptional("popupmenus.items","add click listener for subMenu " + subMenu.getAttribute("label") + " onSelectParentFolder(" + subfolder.URI+ ")");

					//let uriCopy = subfolder.URI; // snapshot! (not working in TB2)
					this.addSubMenuEventListener(subMenu, subfolder.URI); // create a new context for copying URI

					let subPopup = this.createIconicElement('menupopup','*');
					subMenu.appendChild(subPopup);

					popupMenu.insertBefore(subMenu,menuitem)
					subPopup.appendChild(menuitem); // move parent menu entry

					this.addSubFoldersPopup(subPopup, subfolder, isDrag); // populate the sub menu

					subPopup.removeChild(menuitem);
				}

				if (typeof subfolders.next!='undefined') {
					try { subfolders.next(); } catch(e) { done=true; }
				}
			}
			catch(ex) {
        util.logException('Exception in addSubFoldersPopupFromList: ', ex);
        done = true;
      }
		}
	} ,

	// add all subfolders (1st level, non recursive) of folder to popupMenu
	addSubFoldersPopup: function addSubFoldersPopup(popupMenu, folder, isDrag) {
		const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		util.logDebugOptional('popupmenus.subfolders', 'addSubFoldersPopup(' + folder.prettyName + ', drag=' + isDrag + ')' );
		let isDragNew = isDrag && prefs.getBoolPref('folderMenu.dragToNew');

		if (folder.hasSubFolders) {
			util.logDebugOptional('popupmenus.subfolders', 'Adding folders…');
			let subfolders;
			if (typeof folder.subFolders != 'undefined')
				subfolders = folder.subFolders;
			else
				subfolders = folder.GetSubFolders();

			let isAlphaSorted = prefs.isSortSubfolderMenus;
			this.addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, isAlphaSorted, false);
		}

		// append the "Create New Folder" menu item!
		if (isDragNew) {
			QuickFolders.Interface.addDragToNewFolderItem(popupMenu, folder);
		}
	} ,

	// collapse all parent menus from (drop or clicked) target upwards
	collapseParentMenus: function collapseParentMenus(Target) {
		let p = Target,
        util = QuickFolders.Util;
		util.logDebugOptional ("popupmenus.collapse", "Close menus for node=" + p.nodeName
								 + "\nlabel=" + p.getAttribute('label')
								 + "\nparent tag=" + p.parentNode.tagName);
		switch(Target.tagName) {
			case 'menuitem': // dropped mails to a menu item
			case 'menu': // clicked on a parent folder?
				// close all containing menus
				// hidepopup is broken in linux during OnDrag action!!
				// bug only confirmed on TB 2.0!
				while (null!=p.parentNode && p.tagName!='toolbar') {
					p=p.parentNode;
					util.logDebugOptional ("popupmenus.collapse", "parenttag=" + p.tagName);
					util.logDebugOptional ("popupmenus.collapse", "node= " + p.nodeName);
					if (p.tagName == 'menupopup' && p.hidePopup) {
						util.logDebugOptional ("popupmenus.collapse", "Try hide parent Popup " + p.getAttribute('label'));
						p.hidePopup();
						}
					}
				break;

			case 'toolbarbutton':
				QuickFolders_globalHidePopupId = 'moveTo_' + Target.folder.URI;
				util.logDebugOptional ("popupmenus.collapse", "set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				let popup = document.getElementById(QuickFolders_globalHidePopupId);
				if (popup)
					try {
						popup.parentNode.removeChild(popup); //was popup.hidePopup()
						QuickFolders_globalHidePopupId = '';
					}
					catch(e) {
						util.logDebugOptional ("popupmenus.collapse", "Could not remove popup of " + QuickFolders_globalHidePopupId );
					}
				break;
		}
	} ,

	// special function for menu item that is both a popup (has child folders) and represents a clickable folder
	onSelectParentFolder: function onSelectParentFolder(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("interface,popupmenus", "onSelectParentFolder: " + folderUri);
		if (QuickFolders.Preferences.isDebugOption("folders.select")) debugger;
		this.onSelectSubFolder(folderUri, evt);
		evt.stopPropagation(); // avoid oncommand bubbling up!
		QuickFolders.Interface.collapseParentMenus(evt.target);
	} ,

	// select subfolder (on click)
	onSelectSubFolder: function onSelectSubFolder(folderUri, evt) {
    let util = QuickFolders.Util,
		    isCtrlKey = evt ? evt.ctrlKey : false,
				target = evt ? evt.target : null;
		util.logDebugOptional ("interface,popupmenus", "onSelectSubFolder: " + folderUri +  (evt
		     ? "\n type= " + evt.type + " \n target= " + evt.target
				 : "[no event argument]")
				 );
		if (evt) {
			 evt.preventDefault();
			 evt.stopPropagation();
		}
		try {
			if (isCtrlKey) {
				let tabmail = document.getElementById("tabmail");
				if (tabmail) {
					switch (util.Application) {
						case 'Thunderbird':
							tabmail.openTab(util.mailFolderTypeName, {folder: folderUri, messagePaneVisible:true } );
							break;
						case 'SeaMonkey':
							tabmail.openTab(util.mailFolderTypeName, 7, folderUri);
							break;
						case 'Postbox':
							let win = util.getMail3PaneWindow();
							win.MsgOpenNewTabForFolder(folderUri, null /* msgHdr.messageKey key*/, false /*Background*/ )
							break;
					}
				}
			}
		}
		catch (ex) { util.logToConsole(ex); };
		QuickFolders_MySelectFolder (folderUri);
	} ,

	// on down press reopen QuickFolders-FindPopup menu with ignorekeys="false"
	findFolderKeyPress: function findFolderKeyPress(event) {
	  const VK_UP = 0x26;
	  const VK_DOWN = 0x28;
		const VK_ESCAPE = 0x1B;
    const VK_ENTER = 0x0D;
		let isShift = (event && event.shiftKey) || false;

    function makeEvent(evtType, evt) {
      let keypress_event = document.createEvent("KeyboardEvent"); // KeyEvents
      keypress_event.initKeyEvent(evtType, true, true, null,      // typeArg, canBubble, cancelable
               false, false, false, false,                        // ctrl, alt, shift, meta
               evt, 0);                                           // keyCode, charcode
      return keypress_event;
    }
		let menupopup,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface;
	  if (event.keyCode) switch (event.keyCode) {
      case VK_ENTER:
			  util.logDebugOptional("interface.findFolder","VK_ENTER");
        QI.findFolderName(event.target, true);
        event.preventDefault();
        break;
		  case VK_DOWN:
			case VK_UP:
			  util.logDebugOptional("interface.findFolder", (event.keyCode==VK_DOWN) ? "VK_DOWN" : "VK_UP");
				menupopup = document.getElementById('QuickFolders-FindPopup');
				let fC = menupopup.firstChild;
				if (!fC) {
					util.logDebugOptional("interface.findFolder","no popup children, early exit");
				  return; // no children = no results!
		    }
				menupopup.removeAttribute('ignorekeys');
				let palette = document.getElementById('QuickFolders-Palette');
				if (palette) {
					util.logDebugOptional("interface.findFolder","1. show Popup…");
          // remove and add the popup to register ignorekeys removal
          menupopup = palette.appendChild(palette.removeChild(menupopup));
					let searchBox = QI.FindFolderBox;
					if (typeof menupopup.openPopup == 'undefined')
						menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
					else
						menupopup.openPopup(searchBox,'after_start', 0, -1, true, false);

					if (event.preventDefault) event.preventDefault();
					if (event.stopPropagation) event.stopPropagation();

					setTimeout( function() {
						util.logDebugOptional("interface.findFolder","creating Keyboard Events…");
						if (menupopup.dispatchEvent(makeEvent('keydown', event.keyCode))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keydown event was dispatched.");
						}
						if (menupopup.dispatchEvent(makeEvent('keyup', event.keyCode))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keyup event was dispatched.");
            }
					});
				} // palette
				break;
			case VK_ESCAPE:
        event.preventDefault(); // [issue 41] Esc key to cancel quickMove also clears Cmd-Shift-K search box
			  if (isShift) // [Bug 26660] SHIFT + ESC resets move list
					QuickFolders.quickMove.resetList();
			  QI.findFolder(false);
			  QI.hideFindPopup();
        QI.updateFindBoxMenus(false);
        QI.toggleMoveModeSearchBox(false);
			  break;
		}
	} ,

	hideFindPopup: function hideFindPopup() {
	  let menupopup = document.getElementById('QuickFolders-FindPopup'),
		    state = menupopup.getAttribute('state'),
        util = QuickFolders.Util;
    util.logDebugOptional("interface.findFolder","hideFindPopup - menupopup status = " + state);
		//if (state == 'open' || state == 'showing')
    try {
			menupopup.hidePopup();
		} catch(ex) { util.logException('hideFindPopup', ex); }
	} ,

  // forceFind - enter key has been pressed, so we want the first match to force a jump
	findFolderName: function findFolderName(searchBox, forceFind) {
		function buildParentString(folder, parentCount) {
			let pS = "", // build expanded parent string
					par = folder.parent;
			for (let i=parentCount; i>0; i--) {
				if (!par || par.isServer) break; // do not add server here
				if (!pS)  {
					pS = par.prettyName;
				}
				else {
					pS = par.prettyName + '/' + pS;
				}
				par = par.parent;
			}
			return pS;
		}

    // [Bug 26692] omit folders with this tab
    function checkFolderFlag(folder, flag, includeParents) {
			if (!folder) return false;
			let fName = folder.prettyName,
			    tabEntry = model.getFolderEntry(folder.URI);
			if (tabEntry && tabEntry.flags && (tabEntry.flags & flag)) {
				util.logDebugOptional("quickMove", "checkFolderFlag(" + fName + ") will omit - flags = " + tabEntry.flags);
				return true;
			}
			if (!includeParents)
				return false;
			// check whether parent folder entries may have the flag set.
			while (folder.parent)	{
				folder = folder.parent;
				tabEntry = model.getFolderEntry(folder.URI);
				if (tabEntry && tabEntry.flags && (tabEntry.flags & flag)) {
					util.logDebugOptional("quickMove", "checkFolderFlag(" + fName + ") will omit.\n" +
					  "Parent tab: " + tabEntry.name + " - flags = " + tabEntry.flags);
					return true;
				}
			}
			return false;
		}

		function addMatchingFolder(matches, folder) {
			let folderNameSearched = folder.prettyName.toLocaleLowerCase(),
			    matchPos = folderNameSearched.indexOf(searchString);

      // add all child folders if "parentName/" entered
      if (searchString=='' && parentString!='') matchPos = 0;
			if (matchPos >= 0) {
				// only add to matches if not already there
				if (!matches.some( function(a) { return (a.uri == folder.URI); })) {
					let rank = searchString.length - folder.prettyName.length;
					if (rank == 0) rank += 7;  // full match - promote
					if (matchPos == 0) rank += 3; // promote the rank if folder name starts with this string
					if (searchString.length<=2 && matchPos!=0) { // doesn't start with single/two letters?
						// is it the start of a new word? e.g. searching 'F' should match "x-fred" "x fred" "x.fred" "x,fred"
						if (" .-,_".indexOf(folderNameSearched.substr(matchPos-1,1))<0)
							return;  // skip if not starting with single letter
					}

					// [Bug 26692] skip if they are flagged for ignoring
					if (checkFolderFlag(folder, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true))
						return;

					let pS = buildParentString(folder, parentCount),
              maxFindSearch = parentCount || QuickFolders.Preferences.getIntPref("premium.findFolder.maxPathItems"),
              detail = QuickFolders.Preferences.getIntPref("premium.findFolder.folderPathDetail"),
              fName = QuickFolders.Interface.folderPathLabel(detail, folder, maxFindSearch);
					// omit certain folders from quickJump:

					matches.push( { name:fName, lname:folderNameSearched, uri:folder.URI, rank:rank, type:'folder', folder:folder, parentString: pS } );
				}
			}
		}

		// check if any word in foldername string starts with typed characters
    function wordStartMatch(fName, search) {
			// if search string contains a space just match the whole result rather than breaking up the folder into "words"
			if (search.indexOf(' ')>0) {
				if (fName.indexOf(search)==0) return true;
			}
			else {
				let m = fName.split(' ');
				for (let i=0; i<m.length; i++) {
					if (m[i].indexOf(search)==0) return true;
				}
			}
      return false;
    }

    // [Bug 26088] check if folder has a parent (or grand parent) which starts with the passed search string
		// 4.14 - extend parent to allow / within string to specify grandparent / parent
    function isParentMatch(folder, search, maxLevel, parentList) {
      if (!search) return true; // ??? should be false?
      let f = folder,
			    pLevel = 1,
			    ancestors = search.split("/"),
					directParent = null;

			maxLevel = ancestors.length;
      while (f.parent && maxLevel) {
        maxLevel--;
        f = f.parent;

        if (f.prettyName.toLowerCase().indexOf(ancestors[maxLevel])==0) {
					// 1st (top level) match
					if (!directParent) directParent = f;

					if (maxLevel == 0 ) {  // direct parent? Add to collection in case we want to create child (slash) // pLevel==1
						if (parentList.indexOf(directParent)<0)
							parentList.push(directParent);
						return true;
					}
				}
				else return false;
				pLevel++;
      }
      return false;
    }

		function addIfMatch(folder, search, parentList) {
			let ancestors = search.split("/"),
			    maxLevel = ancestors.length,
					f = folder,
					directParent = null;
			while (f && maxLevel) {
				maxLevel--;
				if (f.prettyName.toLowerCase().indexOf(ancestors[maxLevel])==0) {
					if (!directParent) directParent = folder;
					if (maxLevel == 0) {
						if (parentList.indexOf(directParent)<0) {
							if (!checkFolderFlag(directParent, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true)) // [Bug 26692]
								parentList.push(directParent);
						}
						return true;
					}
				}
				else
					return false;
				f=f.parent;
			}
			return false;
		}

    const util = QuickFolders.Util,
          model = QuickFolders.Model,
          prefs = QuickFolders.Preferences,
          Ci = Components.interfaces,
					ELLIPSIS = "\u2026".toString(),
					CHEVRON = "\u00BB".toString();

		let isSelected = false,
				enteredSearch = searchBox.value,
	      searchString = enteredSearch.toLocaleLowerCase(),
        parentString = '',  // effective parent string (using resulting prettyName atoms)
				enteredParent = ''; // what's entered
    util.logDebug("findFolder (" + searchString + ")");
		if (!searchString)
			return;

		let account = null,
		    identity = null,
		    matches = [],
				parents = [];

		// change: if only 1 character is given, then the name must start with that character!
		// first, search QuickFolders
		for (let i=0; i<model.selectedFolders.length; i++) {
			let folderEntry = model.selectedFolders[i],
		      folderNameSearched = folderEntry.name.toLocaleLowerCase(),
			    // folderEntry.uri
			    matchPos = folderNameSearched.indexOf(searchString);
			if (matchPos >= 0) {
				let rank = searchString.length - folderEntry.name.length; // the more characters of the string match, the higher the rank!
				if (rank == 0) rank += 4;  // full match - promote
				if (matchPos == 0)  rank += 2; // promote the rank if folder name starts with this string
				if (searchString.length<=2 && matchPos!=0) { // doesn't start with single/two letters?
				  // is it the start of a new word? e.g. searching 'F' should match "x-fred" "x fred" "x.fred" "x,fred" ":fred" "(fred" "@fred"
				  if (" .-,_:@([".indexOf(folderNameSearched.substr(matchPos-1,1))<0)
					  continue;  // skip if not starting with single letter
				}
				let fld = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri);
				if (checkFolderFlag(fld, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true)) // [Bug 26692]
					continue;
				// avoid duplicates
				if (!matches.some( function(a) { return (a.uri == folderEntry.uri); })) {
					matches.push( { name:folderEntry.name, lname:folderNameSearched, uri:folderEntry.uri, rank: rank, type:'quickFolder' } );
				}
			}
		}
		// SLASH command - list child folders !
    let parentPos = searchString.lastIndexOf('/'),
		    parentCount = 0;  // default
    if (parentPos>0) { // we have a parent folder
      enteredParent = searchString.substr(0, parentPos);
 			parentString = enteredParent;
      searchString = searchString.substr(parentPos+1);
			enteredSearch = enteredSearch.substr(parentPos+1); // original mixed case for subfolder creation; include placeholder for account
			parentCount = parentString.split("/").length + 1; // original entry for parent
    }
		let isFiling = QuickFolders.quickMove.isActive;
    /********* old jump point *********/
		/*
		// [Bug 26565] if 1 unique full match is found - without children!, we can automatically jump there
		if (     (matches.length == 1)
			    && (!isFiling) && (matches[0].folder && !matches[0].folder.hasSubFolders)
          && (matches[0].lname == searchString)      // one exact FULL match
				|| (wordStartMatch(matches[0].lname) && forceFind)) // match starts with search string + [Enter] key was pressed
       ) {
			// go to folder
			isSelected = QuickFolders_MySelectFolder(matches[0].uri);
			if (matches[0].parentString)
				QuickFolders.quickMove.rememberLastFolder(matches[0].uri, matches[0].parentString);
      setTimeout(function() {
        QuickFolders.Interface.tearDownSearchBox();
      }, 400);
      return; // ????
		}
		*/

    // if quickMove is active we need to suppress matches from newsgroups (as we can't move mail to them)
		// "parent/" no name given, only lists the direct children
		// "parent/X" can it list grandchildren? It does, but shouldn't - test with "Addons/Qu"
    let maxParentLevel = searchString.length ? prefs.getIntPref('premium.findFolder.maxParentLevel') : 1;
		if (parentPos>0) maxParentLevel = 1; // no subfolders when SLASH is entered

		// multiple slashes?
		let isLegacyIterator = util.isLegacyIterator;
    if (isLegacyIterator) {
			util.logDebugOptional("interface.findFolder", "Using old folder iterator for Platform=" + util.PlatformVersion);
      let AF = util.allFoldersIterator(isFiling);
			util.logDebugOptional("Assigned AllFolders = " + AF);
      for (let fi=0; fi<AF.length; fi++) {
        let folder = AF.queryElementAt(fi, Ci.nsIMsgFolder);
        if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
				addMatchingFolder(matches, folder);
      }
    }
    else {
			util.logDebugOptional("interface.findFolder", "Calling allFoldersMatch(" + isFiling + ", isParentMatch(), parent='" + parentString + "', " + maxParentLevel + ",...)");
			util.allFoldersMatch(isFiling, isParentMatch, parentString, maxParentLevel, parents, addMatchingFolder, matches);
			util.logDebugOptional("interface.findFolder", "Got " + matches.length + " matches");
		}

		// no parent matches - Add one for a folder without children.
		if (!matches.length && parentPos>0) {
			if (isLegacyIterator) {  // util.Application == 'Postbox'
				let AF = util.allFoldersIterator(isFiling);
				for (let fi=0; fi<AF.length; fi++) {
					let folder = AF.queryElementAt(fi, Ci.nsIMsgFolder);
					addIfMatch(folder, matches.parentString || parentString, parents);
				}
			}
			else
				for (let folder of util.allFoldersIterator(isFiling)) {
					addIfMatch(folder, matches.parentString || parentString, parents);
				}
		}
		util.logDebugOptional("interface.findFolder", "built list: " + matches.length + " matches found. Building menu…");

		// rebuild popup
		let menupopup, txtDebugMenu = '';
		if (true) {
			matches.sort(function (a,b) { if (b.rank - a.rank == 0) return b.lname - a.lname; return b.rank - a.rank; });

			menupopup = util.$("QuickFolders-FindPopup");
      if (QuickFolders.quickMove.isActive) {
        menupopup.setAttribute("tag", "quickMove");
      }
      else {
        menupopup.removeAttribute("tag");
      }

			//rebuild the popup menu
			while (menupopup.firstChild)
				menupopup.removeChild(menupopup.firstChild);
		  if (matches.length) {
				// restrict results to 25
				let count = Math.min(matches.length,25);
				for (let j=0; j<count; j++) {
					let menuitem = this.createIconicElement('menuitem','*');
					// menuitem.className='color menuitem-iconic';
					menuitem.setAttribute('label', matches[j].name);
					menuitem.setAttribute('value', matches[j].uri);
					if (matches[j].type == 'quickFolder')
						menuitem.className = 'quickFolder menuitem-iconic';
          else
            menuitem.className = 'menuitem-iconic';
					if (matches[j].parentString)
						menuitem.setAttribute('parentString', matches[j].parentString);
					menupopup.appendChild(menuitem);
				}
			}
		}
		util.logDebugOptional("interface.findFolder", "built menu.");

		// special commands: if slash was entered, allow creating subfolders. Exclude _old_ Postbox.
		if (parentPos>0 &&
		    (util.Application!='Postbox' ||
				 util.Application=='Postbox' && typeof Task === 'object')
				) {
			util.logDebugOptional("interface.findFolder", "/ entered, build create subfolder entries.");
			// [Bug 26283] add matches from quickfolders (if named differently)
			let isFound = false;
			for (let i=0; i<model.selectedFolders.length; i++) {
				let folderEntry = model.selectedFolders[i],
				    folderNameSearched = folderEntry.name.toLocaleLowerCase(),
						matchPos = folderNameSearched.indexOf(parentString);

				if (folderEntry.flags && folderEntry.flags & util.ADVANCED_FLAGS.IGNORE_QUICKJUMP) {
				  // [Bug 26692]
					util.logDebugOptional("quickMove", "Omitting tab " + folderEntry.name + " - flags = " + folderEntry.flags);
					continue;
				}

				//
				if (matchPos == 0 && prefs.isDebugOption('quickMove')) debugger;
				if (matchPos == 0
				   &&
				   !parents.some(function(p) { return p.URI == folderEntry.uri; } )) {  // function to replace p => p.uri == folderEntry.uri - Postbox can't understand this.
					let nsIfolder = model.getMsgFolderFromUri(folderEntry.uri, false); // determine the real folder name
					// this folder does not exist (under its real name) - add it!
					nsIfolder.setStringProperty("isQuickFolder", true); // add this flag
					parents.push(nsIfolder);
				}
			}

			let isInsertNewFolderTop = prefs.getBoolPref('quickMove.createFolderOnTop');
			if (parents.length)
				util.logDebugOptional("interface.findFolder", "/ create subfolder entries ");

			// create new subfolder case
			while (parents.length) {

				let f = parents.pop();

				if (util.doesMailUriExist(f.URI + "/" + enteredSearch))
					continue; // [Bug 26565] if (1) fully matching name entered do not offer creating a folder. Case Sensitive!
				if (matches.length &&
					  matches[0].uri.toLocaleLowerCase() == (f.URI + "/" + enteredSearch).toLocaleLowerCase())
					continue; // [Bug 26565] if (1) fully matching name entered do not offer creating a folder. Case Sensitive!
				let menuitem = this.createIconicElement('menuitem','*'),
				    label = this.getUIstring('qfNewSubFolder', 'Create subfolder {0} ' + CHEVRON + ' {1}' + ELLIPSIS);

				let pc = parentCount,
				    parFld = "",
						atom = null;
				while (pc>0) { // rewrite parentString, too
					atom = atom ? atom.parent : f;
					if (atom.isServer) break;
					if (!parFld)  {
						parFld = atom.prettyName;
					  parentString = atom.prettyName;
					}
					else {
						parFld = atom.prettyName + ' ' + CHEVRON + ' ' + parFld; // prepend ancestor
					  parentString = atom.prettyName + '/' + parentString;
					}
					pc--;
				}
				let theLabel = label.replace('{0}', f.rootFolder.name + ": " + parFld).replace('{1}', enteredSearch);
				menuitem.setAttribute('label', theLabel);
				if (prefs.isDebugOption('quickMove'))
					txtDebugMenu = txtDebugMenu + "menuItem: " + theLabel.padEnd(20, " ") + " - parentString:" + parentString + "\n";

				menuitem.setAttribute('parentString', parentString); // remember parent string in menu item (easiest)
				menuitem.addEventListener('command', function(event) {
						QuickFolders.Interface.onCreateInstantFolder(f, enteredSearch);
						return false;
					}, false
				);
				menuitem.className = 'menuitem-iconic deferred'; // use 'deferred' to avoid selectFound handler
				if (f.getStringProperty("isQuickFolder")) {
					f.setStringProperty("isQuickFolder", ""); // remove this temporary property
					menuitem.classList.add('quickFolder');
				}

				if (menupopup.firstChild && isInsertNewFolderTop)
					menupopup.insertBefore(menuitem, menupopup.firstChild);
				else
					menupopup.appendChild(menuitem);
			}

			if (!menupopup.childElementCount) {
				let menuitem = this.createIconicElement('menuitem','*');
				menuitem.setAttribute('label', ELLIPSIS); // just one dummy to show we were searching
				menuitem.setAttribute("tag", "dummy");
				menupopup.appendChild(menuitem);
			}
		}

		if (txtDebugMenu) {
			util.logDebugOptional('quickMove', txtDebugMenu);
		}
		if (menupopup.childElementCount>1) {
			// remove dummy!
			for (let i = menupopup.children.length-1; i>0; i--) {
				let item = menupopup.children[i];
				if (item.getAttribute("tag") == "dummy")
				 menupopup.removeChild(item);
			}
		}
		util.logDebugOptional("interface.findFolder", "showPopup:");

		menupopup.setAttribute('ignorekeys', 'true');
		if (typeof menupopup.openPopup == 'undefined')
			menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
		else
			menupopup.openPopup(searchBox,'after_start', 0, -1,true,false);  // ,evt
		                           //                v-- [Bug 26665] support VK_ENTER even with multiple matches
		if (matches.length == 1 || (matches.length>0 && forceFind) ) {
			util.logDebugOptional('quickMove', forceFind ? 'Enter key forces match' : 'single match found…');
      if (wordStartMatch(matches[0].lname, searchString) && forceFind) {
				let finalURI = matches[0].uri;
				if (!isFiling) {
					// go to folder
					isSelected = QuickFolders_MySelectFolder(finalURI);
					let ps = parentCount ? buildParentString(QuickFolders.Model.getMsgFolderFromUri(finalURI), parentCount) : "";
					setTimeout(function() {
						QuickFolders.quickMove.rememberLastFolder(finalURI, ps);
						QuickFolders.Interface.tearDownSearchBox();
					}, 400);
				}
				else { // move mails?
					setTimeout(function() {
						QuickFolders.quickMove.execute(finalURI, parentString);
						QuickFolders.Interface.tearDownSearchBox();
					});
				}
      }
      else {
        // make it easy to hit return to jump into folder instead:
        // isSelected = QuickFolders_MySelectFolder(matches[0].uri);
        setTimeout( function() {
            let fm = Components.classes["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);
            fm.setFocus(menupopup, fm.MOVEFOCUS_FIRST + fm.FLAG_SHOWRING);
            let fC = menupopup.firstChild;
            fm.setFocus(fC, fm.FLAG_BYMOUSE + fm.FLAG_SHOWRING);
          }, 250 );
      }
			return; // avoid searchBox.focus()
		}

		if (isSelected) {
			// success: collapses the search box!
			this.findFolder(false);
			this.hideFindPopup();
		}
		else
			searchBox.focus();

 	} ,

  tearDownSearchBox: function tearDownSearchBox() {
    QuickFolders.Util.logDebugOptional("quickMove,interface.findFolder", "tearDownSearchBox()");
    let QI = QuickFolders.Interface;
    QI.findFolder(false);
    QI.hideFindPopup();
    QI.updateFindBoxMenus(false);
    QI.toggleMoveModeSearchBox(false);
  } ,

  // when typing while search results popup is displayed
	// should be passed on to the (parent) search box
	foundInput: function foundInput(element, event) {
		QuickFolders.Util.logDebug("foundInput - " + event);
		element.setAttribute('ignorekeys', 'true');
	} ,

	findPopupBlur: function findPopupBlur(el, event) {
		QuickFolders.Util.logDebug("findPopupBlur - " + event);
		el.setAttribute('ignorekeys', 'true');
	} ,

	selectFound: function selectFound(element, event) {
		const util = QuickFolders.Util,
		      QI = QuickFolders.Interface;
		util.logDebug("selectFound - " + event);
	  let el = event.target,
		    URI = el.getAttribute('value'),
        isSelected,
        /**************  New quickMove Functionality  **************/
        isQuickMove = (QuickFolders.quickMove.isActive);
		// this was a separate command which is handled elsewhere
		if (el.classList.contains('deferred')) return;
		element.setAttribute('ignorekeys', 'true');
    util.logDebugOptional('quickMove', 'QuickFolders.quickMove.isActive = ' + isQuickMove);
		let searchTerm = QI.FindFolderBox.value,
		    slashPos = searchTerm.indexOf('/'),
		    parentName = "";
		if (slashPos>0) {
			// determine name of parent folder
			let target = QuickFolders.Model.getMsgFolderFromUri(URI),
			    ps = el.getAttribute('parentString') || target.parent.name;
			parentName = ps;
		}
    if (isQuickMove) {
			util.logDebugOptional('quickMove','selectFound: quickMove execute(\n' + URI + '\n[, parent: ' + parentName + '])');
      QuickFolders.quickMove.execute(URI, parentName); // folder.uri
      return;
    } /**************  quickMove End  **************/
    else {
			util.logDebugOptional('quickMove','selectFound: quickMove End…');
      isSelected = QuickFolders_MySelectFolder(URI, true);
			QuickFolders.quickMove.rememberLastFolder(URI, parentName);
		}
		if (isSelected) {
			// success: collapses the search box!
      this.findFolder(false);
		}
		else {
			if (el.classList.contains('quickFolder')) {
				// this.correctFolderEntry(URI);
				// in case we have deleted the QuickFolders (which QuickFolders_MySelectFolder allows now)
				// we refresh the popup:
				//  /////// this.findFolderName(document.getElementById('QuickFolders-FindFolder'));
				this.findFolder(false);
				this.hideFindPopup();
			}
			else { // this should not happen as we have found it from the folder tree!
				//alert('could not find folder!');
				Services.prompt.alert(null,"QuickFolders",'could not find folder!');
				this.findFolder(false);
				this.hideFindPopup();
			}
		}
	} ,

	correctFolderEntry: function correctFolderEntry(URI) {
		let confirmationText = 'could not find this QuickFolder! The URL might be invalid - this can be caused by moving parent folders.\n'
			+ 'Do you want to correct this manually?',
		    inputText = URI,
		    result = window.prompt(confirmationText, inputText);
		switch(result) {
			case null:
				break;
			case "":
				break;
			default:
				let folderEntry,
				    folderEntries = QuickFolders.Model.selectedFolders,
				    found = false;
				for (let i=0; i<folderEntries.length; i++) {
					folderEntry = folderEntries[i];
					if (folderEntry.uri == URI) {
						found = true;
						break;
					}
				}
				if (found) {
					folderEntry.uri = result;
					if (QuickFolders_MySelectFolder(result)) {
						QuickFolders.Preferences.storeFolderEntries(folderEntries);
						this.updateFolders(true, true);
					}
					else {
						//alert('Could not find that path either!');
						Services.prompt.alert(null,"QuickFolders",'Could not find that path either!');
					}
				}
				break;
		}
	} ,

  // actionType - 'quickMove' or 'quickJump'. Empty when used for disabling the find / jump method
	findFolder: function findFolder(show, actionType) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface,
				prefs = QuickFolders.Preferences,
        QuickMove = QuickFolders.quickMove;
    util.logDebugOptional("interface.findFolder,quickMove", "findFolder(" + show + ", " + actionType + ")");
		try {
			let ff = QI.FindFolderBox;
			ff.collapsed = !show;
			if (show) {
				if (actionType) {
					util.popupProFeature(actionType); // Pro Version Notification
          let isMove = (actionType == 'quickMove');
          QI.toggleMoveModeSearchBox(isMove);
          if (isMove && QuickMove.suspended) {
            QuickMove.toggleSuspendMove(); // undo suspend
          }
				}
        QI.updateFindBoxMenus(show);

				let autofill = (ff.value == "") && util.hasPremiumLicense(false) && prefs.getBoolPref('quickMove.autoFill');
				if (autofill) {
					ff.value = prefs.getStringPref('quickMove.lastFolderName'); // should [ESC] delete contents?
					ff.select();
				}
				ff.focus();
			}
			else {
				ff.value = ""; // reset search box
				// move focus away!
				let threadPane = this.getThreadPane();
				if (!threadPane.collapsed) {
					this.setFocusThreadPane();
				}
				else {
					let fTree = GetFolderTree();
					if (!fTree.collapsed) {
						fTree.focus();
					}
					else
						ff.blur();
				}
        QI.updateFindBoxMenus(show);
			}
		}
		catch(ex) {
			util.logException("findFolder (" + show + ", " + actionType + ") failed.", ex);
		}
	}	,

	getThreadPane: function getThreadPane() {
	  return document.getElementById("threadPaneBox");  // need this for Postbox.
	} ,

	setFocusThreadPane: function setFocusThreadPane() {
    let threadTree = this.getThreadTree();
		if (threadTree)
			threadTree.focus();
  } ,

  getThreadTree: function getThreadTree()  {
    return document.getElementById("threadTree")
  } ,

	// selectedTab   - force a certain tab panel to be selected
	// updateMessage - display this message when opening the dialog
	viewOptions: function viewOptions(selectedTab, updateMessage) {
		let params = {inn:{mode:"allOptions",tab:selectedTab, message: updateMessage, instance: QuickFolders}, out:null},
        //  in linux the first alwaysRaised hides the next child (config dialogs)
        features = (QuickFolders.Util.HostSystem == 'linux') ?
          'chrome,titlebar,centerscreen,resizable,dependent,instantApply' :
          'chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',
		    win = window.openDialog('chrome://quickfolders/content/options.xhtml',
          'quickfolders-options',
          features,
          QuickFolders,
          params).focus();
	} ,

	viewHelp: function viewHelp() {
		let params = {inn:{mode:"helpOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xhtml','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,

	viewSupport: function viewSupport() {
		let params = {inn:{mode:"supportOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xhtml','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,

  viewLicense: function viewLicense() {
		let win = QuickFolders.Util.getMail3PaneWindow(),
        params = {inn:{mode:"licenseKey",tab:-1, message: "", instance: win.QuickFolders}, out:null};

    win.openDialog('chrome://quickfolders/content/options.xhtml','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
  } ,

	viewChangeOrder: function viewChangeOrder() {
		window.openDialog('chrome://quickfolders/content/change-order.xhtml','quickfolders-change-order',
						  'chrome,titlebar,toolbar,centerscreen,resizable,dependent', QuickFolders); // dependent = modeless
	} ,

  lastTabSelected: null,
  styleSelectedTab: function styleSelectedTab(selectedButton) {
		if(!(selectedButton))
      return;
    if (selectedButton.classList.contains("selected-folder"))
      return;
    selectedButton.classList.add("selected-folder");
    selectedButton.checked = true;
    selectedButton.setAttribute("selected", true); // real tabs
  } ,

  getCurrentTabMailFolder: function getCurrentTabMailFolder() {
    let folder = null,
        util = QuickFolders.Util,
        idx = QuickFolders.tabContainer.selectedIndex,
        tabmail = document.getElementById("tabmail"),
        tabs = tabmail.tabInfo || tabmail.tabOwners, // Pb: tabOwners
        info = util.getTabInfoByIndex(tabmail, idx),
        tabMode = util.getTabMode(info);  // tabs[idx]
    // single message mode
    if (tabMode == 'message') {
      let msg;
      switch (util.Application) {
        case 'Postbox':
          msg = info._msgHdr;
          break;
        case 'Thunderbird':
          msg = info.messageDisplay.displayedMessage
          break;
        case 'SeaMonkey':
          msg = info.msgSelectedFolder;
          break;
      }
      if (msg) {
        folder = msg.folder;
      }
      if (folder) {
        QuickFolders.Util.logDebugOptional("mailTabs", "getCurrentTabMailFolder() returns displayed message folder: " + folder.prettyName);
        return folder;
      }
    }

    if (info.msgSelectedFolder)  // Sm
      folder = info.msgSelectedFolder;
    else if (  info.folderDisplay
            && info.folderDisplay.view
            && info.folderDisplay.view.displayedFolder)  // Tb
      folder = info.folderDisplay.view.displayedFolder
    else   // Postbox
      folder = GetFirstSelectedMsgFolder();
    QuickFolders.Util.logDebugOptional("mailTabs", "getCurrentTabMailFolder() returns: " + (folder ? folder.prettyName : 'n/a'));
    return folder;
  },

	// passing in forceButton is a speed hack for SeaMonkey:
  // return current folder to save processing time
	onTabSelected: function onTabSelected(forceButton, forceFolder) {
		let folder, selectedButton,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface,
				prefs = QuickFolders.Preferences; // let's not use _this_ in an event function
		try  {
			// avoid TB logging unnecessary errors in Stack Trace
			if ((util.Application == 'Thunderbird') && !gFolderTreeView )
				return;

      // used to be: GetFirstSelectedMsgFolder() - but doesn't work in Sm
      // SM use: info.msgSelectedFolder
      if (forceButton)
        folder = forceButton.folder;
      else if (forceFolder)
        folder = forceFolder;
      else
        folder = QI.getCurrentTabMailFolder();

      util.logDebugOptional("interface", "onTabSelected("
			  + (forceButton || '') + ")\n folder = "
				+ (folder ? folder.prettyName : '<none>'));
		}
		catch (e) {
		  util.logException("onTabSelected", e);
			return null;
		}

		// new window: won't have active categories
		if (QI.currentActiveCategories == null) {
			let lc = prefs.lastActiveCats;
			if (lc)
				QI.currentActiveCategories = lc;
		}
		if (null == folder) return null; // cut out lots of unneccessary processing!
		selectedButton = forceButton || QI.getButtonByFolder(folder);

    if (QI.lastTabSelected == folder) {
      QI.styleSelectedTab(selectedButton);
      return folder; // avoid duplicate selection actions
    }

		// update unread folder flag:
		let showNewMail = prefs.isHighlightNewMail,
		    newItalic = prefs.isItalicsNewMail,
				tabStyle = prefs.ColoredTabStyle; // filled or striped

		for (let i = 0; i < QI.buttonsByOffset.length; i++) {
			let button = QI.buttonsByOffset[i];
			// filled style, remove striped style
			if ((tabStyle != prefs.TABS_STRIPED) && (button.classList.contains("selected-folder")))
				button.className = button.className.replace(/\s*striped/,"");

			// striped style: make sure everyting is striped
			if ((tabStyle == prefs.TABS_STRIPED) && (button.className.indexOf("striped")<0))
				button.className = button.className.replace(/(col[0-9]+)/,"$1striped");

			button.className = button.className.replace(/\s*selected-folder/,"");
			// button.className = button.className.replace(/(cActive[0-9]+)/,''); // remove active coloring
			// remove "selected" attribute of tab look
			if (button.hasAttribute("selected"))
				button.removeAttribute("selected");
			if (button.folder) {
				if (showNewMail) {
					if (button.getAttribute("biffState-NewMail")) {
						if (!button.folder.hasNewMessages)
							button.removeAttribute("biffState-NewMail");
					}
					else  // is https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsMsgFolderFlagType lying? My inbox has 80001004, which is
						if (button.folder.hasNewMessages)
							button.setAttribute("biffState-NewMail", "true");
				}

				if (newItalic) {
					if (button.getAttribute("biffState-NewItalics")) {
						if (!button.folder.hasNewMessages)
							button.removeAttribute("biffState-NewItalics");
					}
					else
						if (button.folder.hasNewMessages)
							button.setAttribute("biffState-NewItalics", "true");
				}
			}

			button.checked = (button == selectedButton);
		}

		/* ACTIVE TAB STYLING */
    QuickFolders.Interface.styleSelectedTab(selectedButton);

		QI.initCurrentFolderTab(QI.CurrentFolderTab, folder, selectedButton);
    if (!prefs.supportsCustomIcon) {
      let ic = util.$("context-quickFoldersIcon");
      if (ic) ic.collapsed = true;
      ic = util.$("context-quickFoldersRemoveIcon")
      if (ic) ic.collapsed = true;
    }

    // avoid re-entry
    QI.lastTabSelected = folder;

		// single message window:
		if (prefs.isShowCurrentFolderToolbar('messageWindow')) {
			let singleMessageWindow = util.getSingleMessageWindow();
			if (singleMessageWindow && singleMessageWindow.gMessageDisplay && singleMessageWindow.gMessageDisplay.displayedMessage) {
				let singleMessageCurrentFolderTab = singleMessageWindow.document.getElementById('QuickFoldersCurrentFolder');
				QI.initCurrentFolderTab(singleMessageCurrentFolderTab, singleMessageWindow.gMessageDisplay.displayedMessage.folder);
			}
		}
    return folder;
	} ,

  hoistCurrentFolderBar: function hoistCurrentFolderBar(currentFolderTab, tabInfo) {
    let util = QuickFolders.Util,
        tabMode = tabInfo ? util.getTabMode(tabInfo) : this.CurrentTabMode,
        rect0 = currentFolderTab.getBoundingClientRect();
    // move current folder BAR up if necessary!
    if (util.Application != 'Thunderbird') return; // only in Tb we have the conversation view addon

    util.logDebugOptional("interface.currentFolderBar", "hoistCurrentFolderBar(tabMode: " + tabMode + ")");

    if (!rect0.width &&
        (tabMode=='message' || tabMode=='folder' || tabMode=='3pane'))
    {
      let panel = currentFolderTab.parentNode,
          found = false;
      while (panel) {
        if (panel.id && panel.id.indexOf('QuickFolders-PreviewToolbarPanel')==0) {
          found=true;
          break;
        }
        panel = panel.parentNode;
      }
      if (found) {
        // now we got the toolbar panel let us move the whole lot
        let rect = panel.getBoundingClientRect();
        if (!rect.width) {
          QuickFolders.Util.logDebug('Parent panel {' + panel.id + '} is not on screen; moving current folder button for tabMode: ' + tabMode);
          if (panel.id) {
/*
            // find multimessage browser element and check if it is visible
            // parent of visible toolbar
            let multimessage = document.getElementById('multimessage'),
                isMulti = false;
            if (multimessage) {
              let rect2 = multimessage.getBoundingClientRect();
              if (rect2.width != 0)
                isMulti = true;
            }
            if (isMulti) {
              // hoist it up before the multimessage element!
              multimessage.parentNode.insertBefore(panel, multimessage);
            }
            else {
              let msgHeaderView = document.getElementById('msgHeaderView');
              if (msgHeaderView) {
                // msgHeaderView.nextSibling would be msgNotificationBar
                msgHeaderView.parentNode.insertBefore(panel, msgHeaderView.nextSibling);
              }
            }
*/
          }
        }
      }
    }

  } ,

	/* MESSAGE PREVIEW TOOLBAR */
	initCurrentFolderTab: function initCurrentFolderTab(currentFolderTab, folder, selectedButton, tabInfo) {
    function disableNavigation(isDisabled) {
      document.getElementById("QuickFolders-NavigateUp").disabled = isDisabled;
      document.getElementById("QuickFolders-NavigateLeft").disabled = isDisabled;
      document.getElementById("QuickFolders-NavigateRight").disabled = isDisabled;
      let ic = document.getElementById("QuickFolders-RemoveIcon");
      if (ic) ic.disabled = isDisabled;
      ic = document.getElementById("QuickFolders-SelectIcon");
      if (ic) ic.disabled = isDisabled;
    }
		if (!currentFolderTab) return;
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
    try {
      let tabMode = tabInfo ? util.getTabMode(tabInfo) : this.CurrentTabMode
      util.logDebugOptional("interface.currentFolderBar", 'initCurrentFolderTab(' + (folder ? folder.prettyName : 'null') + ')\n'
                            + "tabMode: " + tabMode);
      this.hoistCurrentFolderBar(currentFolderTab, tabInfo);

      if (folder) {
        let entry = QuickFolders.Model.getFolderEntry(folder.URI);
        if (selectedButton) {
          currentFolderTab.className = selectedButton.className; // else : "icon";
        }
        QuickFolders.Interface.addFolderButton(folder, entry, -1, currentFolderTab, 'QuickFoldersCurrentFolder', prefs.ColoredTabStyle, true, false);
        if (QuickFolders.FolderTree && this.CurrentFolderRemoveIconBtn) {
          if (!prefs.supportsCustomIcon) {
            this.CurrentFolderSelectIconBtn.collapsed = true;
            this.CurrentFolderRemoveIconBtn.collapsed = true;
          }
          else {
            let hasIcon =
              prefs.getBoolPref('currentFolderBar.folderTreeIcon')
              ? QuickFolders.FolderTree.addFolderIconToElement(currentFolderTab, folder)  // add icon from folder tree
              : QuickFolders.FolderTree.hasTreeItemFolderIcon(folder);
            this.CurrentFolderRemoveIconBtn.collapsed = !hasIcon;
            this.CurrentFolderSelectIconBtn.collapsed = hasIcon; // hide select icon for tidier experience.
          }
        }
        disableNavigation(false);
        currentFolderTab.setAttribute("tooltiptext", util.getFolderTooltip(folder));
      }
      else {
        // search mode: get title of tab after a short delay
        setTimeout(function() {
          let tabmail = document.getElementById("tabmail"),
              idx = QuickFolders.tabContainer.selectedIndex;
          idx = idx ? idx : 0;
          let tabs = tabmail.tabInfo ? tabmail.tabInfo : tabmail.tabOwners,
              tabInfo = util.getTabInfoByIndex(tabmail, idx);
          currentFolderTab.setAttribute("label", tabInfo.title ? tabInfo.title : "?");
        }, 250);

        if (tabMode == "glodaList") {
          // add search icon!
          currentFolderTab.style.listStyleImage = "url('chrome://global/skin/icons/Search-glass.png')";
          currentFolderTab.style.MozImageRegion = "rect(0px, 16px, 16px, 0px)";
        }
        // disable navigation buttons
        disableNavigation(true);
        currentFolderTab.setAttribute("tooltiptext", "");
      }

      let currentFolderId = 'QuickFolders-folder-popup-currentFolder';
      //if (!currentFolderTab.ownerDocument.getElementById(currentFolderId))
      //  QuickFolders.Interface.addPopupSet(currentFolderId, folder, null, -1, currentFolderTab);
      currentFolderTab.className = currentFolderTab.className.replace("striped", "");
      currentFolderTab.classList.remove("selected-folder");
    }
    catch(ex) {
      util.logException("Quickfolders.initCurrentFolderTab()", ex);
    }

	} ,

  configureCategory: function configureCategory(folder, quickfoldersPointer) {
		let retval = {btnClicked:null};
		window.openDialog('chrome://quickfolders/content/set-folder-category.xhtml',
			'quickfolders-set-folder-category','chrome,titlebar,toolbar,centerscreen,modal=no,resizable,alwaysRaised', quickfoldersPointer, folder,retval);
		if (retval.btnClicked!=null)
			QuickFolders.Model.update();
  } ,

	configureCategory_FromMenu: function configureCategory_FromMenu(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
    this.configureCategory(folder, QuickFolders);
	} ,

  removeFromCategory: function removeFromCategory(element) {
    let folderButton = QuickFolders.Util.getPopupNode(element),
        entry = QuickFolders.Model.getButtonEntry(folderButton),
        cats = entry.category.split('|'),
        newC = '',
        removeAlwaysShow = false;
    // see if it is set to "show always" and show a prompt allowing to remove
    if (cats.indexOf(QuickFolders.FolderCategory.ALWAYS) >= 0) {
      let promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),
          text = QuickFolders.Util.getBundleString("qfRemoveCategoryPrompt","The category is '{1}'\n" + "Remove that?");
      text = text.replace("{1}", QuickFolders.Util.getBundleString("qfShowAlways","Show Always!"));
      if (promptService.confirm(window, 'QuickFolders', text))
        removeAlwaysShow = true;
    }

    // buggy if first one is removed.
    for (let i=0; i<cats.length; i++) {
      if (cats[i].trim() == this.currentActiveCategories.trim()) continue;
      if (removeAlwaysShow && cats[i].trim() == QuickFolders.FolderCategory.ALWAYS) continue;
      newC += (newC.length ? '|' : '') + cats[i];
    }
    entry.category = newC;
    QuickFolders.Model.update();
  },

	getButtonColorClass: function getButtonColorClass(col, noStripe) {
		//let sColFolder = (tabStyle == 0) ? "chrome://quickfolders/content/skin/striped" : "chrome://quickfolders/content/skin/cols";
		let tabStyle = QuickFolders.Preferences.ColoredTabStyle;

		return 'col'+col+
				((tabStyle == QuickFolders.Preferences.TABS_STRIPED && !noStripe) ? 'striped' : '');
	} ,

	getButtonColor: function getButtonColor(button) {
		let cssClass = button.className,
		    rClasses=cssClass.split(' ');
		for (let j=0; j<rClasses.length; j++) {
			// determine number from string, e.g. col1striped or col1
			let f = rClasses[j].indexOf('col');
			if (f>=0)
				return parseInt(rClasses[j].substr(f+3), 10);
		}
		return 0; // no color
	} ,

	setButtonColor: function setButtonColor(button, col, dontStripe) {
		// no more style sheet modification for settings colors.
		if (!button)
			return false;
		let folderLabel = button.getAttribute("label"), // fixes disappearing colors on startup bug
		    cssClass = button.className,
		    newclass = '',
	      rClasses=cssClass.split(' ');
		for (let j=0; j<rClasses.length; j++) {
			// strip previous style
			if (rClasses[j].indexOf('col')<0)
				newclass+=rClasses[j] + ' ';
		}

		newclass += this.getButtonColorClass(col, dontStripe);
		button.className = newclass; // .trim()
		button.setAttribute("colorIndex", col);

		return true;
	} ,

	initElementPaletteClass: function initElementPaletteClass(element, targetElement, isUncolored) {
		if (!element)
			return;

		let paletteToken =
      isUncolored ? this.getPaletteClass('InactiveTab') : this.getPaletteClass('ColoredTab'); // QuickFolders.Preferences.isPastelColors;

    /* element needs to get custom Palette attribute from model entry */
    if (element.folder || (targetElement && targetElement.folder)) {
      let btn = element.folder ? element : targetElement, // menu item
          entry = QuickFolders.Model.getButtonEntry(btn);
      if (entry && entry.customPalette) {
        paletteToken = this.getPaletteClassToken(entry.customPalette);
      }
    }

		QuickFolders.Util.logDebugOptional("css.palette",
			"initElementPaletteClass(element: " + (element.id ? element.id : element.tagName) +
			"\ntarget: "
			+ (targetElement ?
			   (targetElement.label ? targetElement.label : targetElement.tagName) : 'none')
			+ ")  paletteClass = {" + paletteToken + "}");

		// remove palette name(s)
		element.className = this.stripPaletteClasses(element.className, paletteToken);
		let hasClass = (paletteToken && element.classList.contains(paletteToken));
		if (!hasClass) {
		  if (paletteToken)
				element.className += paletteToken;
		}
	} ,

	// paint the paint bucket button with a color + currently configured style (filled, striped, pastel)
	// pass in -1 to keep the old color, 0 no color, 1..20
	setPaintButtonColor: function setPaintButtonColor(col) {
		QuickFolders.Util.logDebugOptional("interface", "setPaintButtonColor(" + col + ")");
		let paintButton = this.PaintButton;
		if (!paintButton)
			return;
		if (col === -1)
			col = this.getButtonColor(paintButton);

		this.setButtonColor(paintButton, col, false);    // let's allow striping
		this.initElementPaletteClass(paintButton, '', (col=='0'));       // palette -> Button
		this.initElementPaletteClass(this.PalettePopup); // palette -> popup
		// striped
		if (QuickFolders.Preferences.ColoredTabStyle == QuickFolders.Preferences.TABS_STRIPED && paintButton.className.indexOf('striped')<0)
			paintButton.className = paintButton.className.replace(/(col[0-9]+)/,'$1striped');
		// filled
		if (QuickFolders.Preferences.ColoredTabStyle != QuickFolders.Preferences.TABS_STRIPED && paintButton.className.indexOf('striped')>0)
			paintButton.className = paintButton.className.replace('striped','');

		// initialize hover color
		// ==> must become palette type aware as well!
    if (this.PaintModeActive) {
      this.initHoverStyle(
               this.getStyleSheet(QuickFolders.Styles, 'quickfolders-layout.css', "QuickFolderStyles"),
               this.getStyleSheet(QuickFolders.Styles, QuickFolders.Interface.PaletteStyleSheet, 'QuickFolderPalettes'),
               true);
    }
	} ,

	// set Tab Color of a button via the palette popup menu
	setTabColorFromMenu: function setTabColorFromMenu(menuitem, col) {
		// get parent button of color sub(sub)(sub)menu
		let parent = menuitem,
        prefs = QuickFolders.Preferences,
				QI = QuickFolders.Interface,
				util = QuickFolders.Util,
				options = QuickFolders.Options,
		    ssPalettes;
		while (!parent.folder && parent.parentNode) {
			parent=parent.parentNode;
			switch(parent.id) {
				case 'QuickFolders-Palette': // fall through
				case 'QuickFolders-PalettePopup':
					// paint the paintBucketButton
					this.setPaintButtonColor(col);
					return;
				default:  // 'QuickFolders-Options-PalettePopup' etc.
				  if (parent.id.indexOf('QuickFolders-Options-')<0)
						continue;  //
					// options dialog case: parent is menupopup
					//   showPopup should have set this as 'targetNode'
					let targetNode = parent.targetNode;
					// now paint the button
				  options.preparePreviewTab(null, null, targetNode.id, col); // [Bug 25589]
				  //options.preparePreviewPastel(prefs.getBoolPref('pastelColors'));
					//   retrieve about config key to persist setting;
					let styleKey =  targetNode.getAttribute('stylePrefKey'),
				      stylePref = 'style.' + styleKey + '.',
              userStyleKey = (styleKey == 'DragOver') ? 'DragTab' : styleKey; // fix naming inconsistency
				  if (stylePref)
					  prefs.setIntPref(stylePref + 'paletteEntry', col);

					// special rule: if this is the Active Tab Color, let's also determine the active BG (bottom pixel of gradient!)
					let paletteClass = this.getPaletteClassCss(styleKey),
					    ruleName = '.quickfolders-flat ' + paletteClass + '.col' + col,
					    engine = QuickFolders.Styles,
              disableColorChangeStriped = (styleKey=='InactiveTab' && prefs.ColoredTabStyle==prefs.TABS_STRIPED);
					ssPalettes = ssPalettes ? ssPalettes : this.getStyleSheet(engine, QI.PaletteStyleSheet, 'QuickFolderPalettes');
					let colPickId = '',
					    selectedFontColor = engine.getElementStyle(ssPalettes, ruleName, 'color'),
					    previewTab;
					if (selectedFontColor !== null) {
						switch(styleKey) {
							case 'DragOver':
							  previewTab = 'dragovertabs-label';
								colPickId = 'dragover-fontcolorpicker';
								break;
							case 'InactiveTab':
							  previewTab = 'inactivetabs-label';
								colPickId = 'inactive-fontcolorpicker';
								break;
							case 'ActiveTab':
							  previewTab = 'activetabs-label';
								colPickId = 'activetab-fontcolorpicker';
								break;
							case 'HoveredTab':
							  previewTab = 'hoveredtabs-label';
								colPickId = 'hover-fontcolorpicker';
								break;
						}
						// transfer color to font color picker for non-palette mode.
						let cp = document.getElementById(colPickId);
						if (cp && !disableColorChangeStriped) {
							// cp.color = selectedFontColor;
							cp.value = util.getSystemColor(selectedFontColor); // convert to hex value
							prefs.setUserStyle(userStyleKey, "color", selectedFontColor);
							options.styleUpdate(userStyleKey, 'color', selectedFontColor, previewTab);
						}
					}

					// find out the last (=main) gradient color and set as background color!
					let selectedGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image'),
              resultBackgroundColor = '';
					if (selectedGradient !== null) {
						// get last gradient point (bottom) to determine background color
						// all gradients should be defined top down
						util.logDebugOptional("css.palette", "selectedGradient = " + selectedGradient);
						let f = selectedGradient.lastIndexOf('rgb');
						if (f>=0) {
							let rgb = selectedGradient.substr(f);
							f = rgb.indexOf(')');
							rgb = rgb.substr(0, f + 1); // this is our rule
							if (rgb) {
								switch(styleKey) {
									case 'DragOver':
										colPickId = 'dragover-colorpicker';
										break;
									case 'InactiveTab':
										colPickId = 'inactive-colorpicker';
										break;
									case 'ActiveTab':
										colPickId = 'activetab-colorpicker';
										break;
									case 'HoveredTab':
										colPickId = 'hover-colorpicker';
										break;
								}
								// transfer color to background color picker for non-palette mode.
								let cp = document.getElementById(colPickId);
								if (cp && !disableColorChangeStriped) {
                  // don't do it with inactive tab in striped mode!!
                  // cp.color = rgb;
									cp.value = util.getSystemColor(rgb);
                  prefs.setUserStyle(userStyleKey, "background-color", rgb);
								}
                resultBackgroundColor = rgb;
							}
						}
					}

					// if no color is selected in inactive tab, switch on transparent:
					if (styleKey == 'InactiveTab' && col == 0) {
						let chkTransparent = window.document.getElementById('buttonTransparency');
						if (chkTransparent && !chkTransparent.checked) {
							chkTransparent.checked = true;
							options.toggleColorTranslucent(chkTransparent, 'inactive-colorpicker', 'inactivetabs-label', styleKey);
						}
						let cp = document.getElementById('inactive-colorpicker');
						if (cp) {
						  // cp.color = 'rgb(255,255,255)';
							cp.value = '#FFFFFF';
						}
						prefs.setUserStyle(styleKey, "background-color", 'rgb(255,255,255)');
						QI.updateMainWindow();
					}
          if (styleKey == 'InactiveTab')
            this.applyTabStyle(document.getElementById('inactivetabs-label'), prefs.ColoredTabStyle);
          // immediate update of background color for bottom border
          if (styleKey == 'ActiveTab' && resultBackgroundColor) {
            options.styleUpdate('ActiveTab','background-color', resultBackgroundColor, 'activetabs-label');
          }
          if (disableColorChangeStriped)
            QI.updateMainWindow(true);  // force update as it might have been missed!
					return; // early exit
			} // end switch
		}
		// or... paint a quickFolders tab
		let theFolder = parent.folder,
		    button = this.getButtonByFolder(theFolder);
		util.logToConsole("Interface.setTabColorFromMenu(" + menuitem.toString() + ", " + col + ")" );
		this.setButtonColor(button, col);        // color the  button via palette entry number
    this.initElementPaletteClass(button, '', (col=='0'));    // make sure correct palette is set
		QuickFolders.Model.setFolderColor(theFolder.URI, col, false); // store color in folder string
	} ,

  applyTabStyle: function applyTabStyle(el, styleId) {
		if (!el) return;
    let prefs = QuickFolders.Preferences;
    if ((styleId != prefs.TABS_STRIPED))
      el.className = el.className.replace(/\s*striped/,"");
    if ((styleId == prefs.TABS_STRIPED) && (el.className.indexOf("striped")<0))
      el.className = el.className.replace(/(col[0-9]+)/,"$1striped");
  },

	ensureStyleSheetLoaded: function ensureStyleSheetLoaded(Name, Title)	{
    const Cc = Components.classes,
		      Ci = Components.interfaces,
					util = QuickFolders.Util;
		try {
			util.logDebugOptional("css","ensureStyleSheetLoaded(Name: " + Name + ", Title: " + Title + ")" );

			QuickFolders.Styles.getMyStyleSheet(Name, Title); // just to log something in console window

			let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
			    ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
			    fileUri = (Name.length && Name.indexOf("chrome://")<0) ? "chrome://quickfolders/content/" + Name : Name,
				uri = ios.newURI(fileUri, null, null);
			let sheetRegistered=sss.sheetRegistered(uri, sss.USER_SHEET);
			if(!sheetRegistered) {
				util.logDebugOptional("css", "=============================================================\n"
				                                 + "style sheet not registered - now loading: " + uri);
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
			}
		}
		catch(e) {
			// removed alert - loading the platform specific code seems to be a problem on some systems
			util.logException("QuickFolders.Interface.ensureStyleSheetLoaded failed: ", e);
		}
	} ,

	getStyleSheet: function getStyleSheet(engine, Name, Title) {
		let sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title); // ignore engine
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(Name, Title);
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
		}

		if (!sheet) {
			debugger;
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
			QuickFolders.Util.logToConsole("updateUserStyles() - missing style sheet '" +  Name + "' - not found = not attempting any style modifications.");
		}
		return sheet;
	} ,

	// HOVER STATE
	initHoverStyle: function initHoverStyle(ss, ssPalettes, isPaintMode) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		let templateTabClass =  isPaintMode ? 'ColoredTab' : 'HoveredTab',
		    paletteClass = this.getPaletteClassCss(templateTabClass);
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initHoverStyle()  PaintMode=" + isPaintMode + "   paletteClass=" + paletteClass);
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    hoverBackColor = prefs.getUserStyle("HoveredTab","background-color","#F90"),
		    tabStyle = prefs.ColoredTabStyle,
		    noColorClass = (tabStyle != prefs.TABS_STRIPED) ? 'col0' : 'col0striped',
		    hoverColor = prefs.getUserStyle(templateTabClass, "color", "#000000"),
        avoidCurrentFolder = ':not(#QuickFoldersCurrentFolder)';

		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','background-color', hoverBackColor,true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover','background-color', hoverBackColor,true);
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover','color', hoverColor, true);

		let paintButton = isPaintMode ? this.PaintButton : null;

		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "style." + templateTabClass + ".paletteType = "
		  + prefs.getIntPref('style.' + templateTabClass + '.paletteType'));

		if (prefs.getIntPref('style.HoveredTab.paletteType') || isPaintMode) {
			let paletteEntry =
				isPaintMode
				? paintButton.getAttribute("colorIndex")
				: prefs.getIntPref('style.HoveredTab.paletteEntry');
			if (!paletteEntry)
				paletteEntry = 1;
			// extract current gradient from style sheet rule:
			let ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry,
			    hoverGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "setting hover gradient[" + ruleName + "]: " + hoverGradient + "\nisPaintMode = " + isPaintMode);

			// build some rules..
			// remove +paletteClass from rule as this should always apply!
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton'  + ':hover', 'background-image', hoverGradient, true); // [class^="col"]
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton'  + '.' + noColorClass + ':hover', 'background-image', hoverGradient, true);

			// picked hover color (from paint mode)
			//let hc = engine.getElementStyle(ssPalettes, ruleName, 'color');
			//hoverColor = hc ? hc : hoverColor;
      // tb + avoidCurrentFolder
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[buttonover="true"]','color', hoverColor, true);
		}
		else { // two color mode
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds…");
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':hover', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ':hover', 'background-image', 'none', true);
			if (tabStyle == prefs.TABS_STRIPED) {
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','color', hoverColor ,true);
			}
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + '[buttonover="true"]','color', hoverColor ,true);
			// full monochrome background
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','background-color', hoverBackColor,true);
		}
	} ,

	// DRAGOVER STATE
	initDragOverStyle: function initDragOverStyle(ss, ssPalettes) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDragOverStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    // let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, 'color');
		    dragOverColor = prefs.getUserStyle("DragTab","color","White");
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over','background-color', prefs.getUserStyle("DragTab","background-color","#E93903"),true);
    let noColorClass = 'col0'; // ####
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':-moz-drag-over','color', dragOverColor, true); // ####

		if (prefs.getIntPref('style.DragOver.paletteType')) {
			let paletteClass = this.getPaletteClassCss('DragOver'),
			    paletteEntry = prefs.getIntPref('style.DragOver.paletteEntry'),
			    ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry,
			    dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			// for some reason this one is completely ignored by SeaMonkey and Postbox
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over', 'background-image', dragOverGradient, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':-moz-drag-over','color', dragOverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '[buttonover="true"]','color', dragOverColor, true);
		}
		else {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over','color', dragOverColor,true);
		}
	} ,

	getPaletteClassCss: function getPaletteClassCss(tabStateId) {
		let cl = this.getPaletteClass(tabStateId);
		return cl.replace(' ', '.');
	} ,

	stripPaletteClasses: function stripPaletteClasses(className, exclude) {
		if (exclude !== 'pastel')
		  className = className.replace(/\s*pastel/,'')
		if (exclude !== 'plastic')
		  className = className.replace(/\s*plastic/,'')
		if (exclude !== 'night')
		  className = className.replace(/\s*night/,'')
		return className;

	} ,

	getPaletteClass: function getPaletteClass(tabStateId) {
	  let paletteType = QuickFolders.Preferences.getIntPref('style.' + tabStateId + '.paletteType');
		switch (paletteType) {
		  case -1:
			  if (tabStateId == 'InactiveTab') {
					return '';  // error
				}
				else { // get from global tab style!
					return this.getPaletteClass('InactiveTab');
				}
				break;
			default:
				return this.getPaletteClassToken(paletteType);
		}
		return '';
	} ,

	getPaletteClassToken: function getPaletteClassToken(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return this.getPaletteClassToken(this.getPaletteClass('InactiveTab')); // default
			case 0:
			  return '';  // none
			case 1:
			  return ' plastic';  // default
			case 2:
			  return ' pastel';
      case 3:
        return ' night';
		}
		return '';
	} ,

	// SELECTED FOLDER STATE (.selected-folder)
	initSelectedFolderStyle: function initSelectedFolderStyle(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initSelectedFolderStyle()");
		let engine = QuickFolders.Styles,
		    colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight"),
		    selectedColor = QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),
		    globalPaletteClass = this.getPaletteClassCss('InactiveTab'),
        paletteClass = this.getPaletteClassCss('ActiveTab'),
        coloredPaletteClass = this.getPaletteClassCss('ColoredTab');

		if (QuickFolders.Preferences.getIntPref('style.ActiveTab.paletteType')) {
			let paletteEntry =  QuickFolders.Preferences.getIntPref('style.ActiveTab.paletteEntry'),
			    ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry,
			    selectedGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			// selectedColor = engine.getElementStyle(ssPalettes, ruleName, 'color'); // make this overridable!
			// we do not want the rule to containg the paletteClass because it has to always work!
			engine.setElementStyle(ss, '.quickfolders-flat ' + '.selected-folder', 'background-image', selectedGradient, true);
		}
		else { // two colors mode
			engine.setElementStyle(ss, '.quickfolders-flat ' + '.selected-folder', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.selected-folder','background-color', colActiveBG, true);
		}
    engine.removeElementStyle(ss, '.quickfolders-flat .selected-folder', 'color');
    engine.setElementStyle(ss, '.quickfolders-flat .selected-folder', 'color', selectedColor,true);
	} ,

	// INACTIVE STATE (DEFAULT)
	initDefaultStyle: function initDefaultStyle(ss, ssPalettes, tabStyle) {
		const util = QuickFolders.Util;
	  if (ssPalettes == null)
		  ssPalettes = ss;
		util.logDebugOptional("interface.buttonStyles", "initDefaultStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
        inactiveGradientColor = null,
		    inactiveBackground = util.getSystemColor(prefs.getUserStyle("InactiveTab","background-color","ButtonFace")),
		    inactiveColor = util.getSystemColor(prefs.getUserStyle("InactiveTab","color","black")),
		    paletteClass = this.getPaletteClassCss('InactiveTab'),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == prefs.TABS_STRIPED) && prefs.getIntPref('style.InactiveTab.paletteType')<3,
		    noColorClass = (isTabsStriped) ? 'col0striped' : 'col0',
		    avoidCurrentFolder = ''; // = ':not(#QuickFoldersCurrentFolder)'; // we omit paletteClass for uncolored tabs:

		// transparent buttons: means translucent background! :))
		if (prefs.getBoolPref('transparentButtons'))
			inactiveBackground = util.getRGBA(inactiveBackground, 0.25) ;

		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton','background-color', inactiveBackground, true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder','background-color', inactiveBackground, true);

		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (prefs.getIntPref('style.InactiveTab.paletteType')>0) {
			let paletteEntry = prefs.getIntPref('style.InactiveTab.paletteEntry');
			if (tabStyle === prefs.TABS_STRIPED)
				paletteEntry += 'striped';
			let ruleName = (!isTabsStriped ? '.quickfolders-flat ' : '') + paletteClass + '.col' + paletteEntry;
			let inactiveGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':not(:-moz-drag-over)', 'background-image'); // remove 'none'
			// removed 'toolbarbutton'. qualifier
			engine.setElementStyle(ss, '.quickfolders-flat .' + noColorClass + ':not(:-moz-drag-over)', 'background-image', inactiveGradient, false);
			engine.setElementStyle(ss, '.quickfolders-flat .' + noColorClass + ':not(:-moz-drag-over)#QuickFoldersCurrentFolder', 'background-image', inactiveGradient, false);

			inactiveGradientColor = (inactiveColor=='black') ? engine.getElementStyle(ssPalettes, ruleName, 'color') : inactiveColor;
		}
		else {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':not(:-moz-drag-over)', 'background-image', 'none', false);
		}

    // tb + avoidCurrentFolder
	  engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + '.' + noColorClass,'color', inactiveColor, false);
    if (inactiveGradientColor!=null)
      engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass,'color', inactiveGradientColor, false);

		// Coloring all striped tabbed buttons that have individual colors
    let coloredPaletteClass = this.getPaletteClassCss('ColoredTab');
		if (isTabsStriped) { // paletteClass = plastic, pastel, "", apple
			// fallback for uncolored current folder (striped style)
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder.col0' + paletteClass,'color', inactiveColor, false);
		  // throws 'An invalid or illegal string was specified' in Postbox:
			if (util.Application != 'Postbox' || util.Appversion > 5.4) {
				// avoid for current folder button as it always will be completely colored
        // #issue 7 these rules didn't work due to a syntax error
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder)' + coloredPaletteClass,'color', inactiveColor, false);
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder)' + paletteClass,'color', inactiveColor, false);
			}
		}
		else {
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass,'color');
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton' + coloredPaletteClass,'color');
		}

	} ,

	// Get all blingable elements and make them look user defined.
	updateUserStyles: function updateUserStyles() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		try {
			util.logDebugOptional ("interface","updateUserStyles()");
			// get MAIN STYLE SHEET
			let styleEngine = QuickFolders.Styles,
			    ss = this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles');

			if (!ss) return false;

			// get PALETTE STYLE SHEET
			let ssPalettes = this.getStyleSheet(styleEngine, QuickFolders.Interface.PaletteStyleSheet, 'QuickFolderPalettes');
      ssPalettes = ssPalettes ? ssPalettes : ss; // if this fails, use main style sheet.
			let theme = prefs.CurrentTheme,
			    tabStyle = prefs.ColoredTabStyle;

			if (prefs.isCssTransitions) {
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-duration', '1s, 1s, 2s, 1s');
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-property', 'color, background-color, border-radius, box-shadow');
			}
			else {
				styleEngine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-duration');
				styleEngine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-property');
			}

			// =================
			// FONT COLORS
			let theColorString = prefs.getUserStyle("InactiveTab","color","black"),
			    colActiveBG = prefs.getUserStyle("ActiveTab","background-color","Highlight"),
					btnSelector = '.quickfolders-flat toolbarbutton';

			if (util.Application == 'SeaMonkey') btnSelector = 'toolbox toolbar' + btnSelector;
			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, btnSelector
				  + ((util.Application == 'SeaMonkey') ? '' : '[background-image]')
					+ '.selected-folder','border-bottom-color', colActiveBG, true);
			}

			// =================
			// CUSTOM RADIUS
			let topRadius = "4px",
			    bottomRadius = "0px";
			if (prefs.getBoolPref("style.corners.customizedRadius")) {
				topRadius =  prefs.getIntPref('style.corners.customizedTopRadiusN') + "px";
				bottomRadius = prefs.getIntPref('style.corners.customizedBottomRadiusN') + "px";
			}

			let legacyRadius = !util.isCSSRadius;

			if (util.Application == 'SeaMonkey') btnSelector = btnSelector + ':not(.plain)';
			styleEngine.setElementStyle(ss, btnSelector, legacyRadius ? '-moz-border-radius-topleft'     : 'border-top-left-radius', topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, legacyRadius ? '-moz-border-radius-topright'    : 'border-top-right-radius', topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, legacyRadius ? '-moz-border-radius-bottomleft'  : 'border-bottom-left-radius', bottomRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, legacyRadius ? '-moz-border-radius-bottomright' : 'border-bottom-right-radius', bottomRadius, true);

			// QuickFolders Toolbar only
			let btnInToolbarSelector = '.quickfolders-flat .folderBarContainer toolbarbutton',
			    buttonHeight = prefs.getIntPref('style.button.minHeight') + "px",
			    topPadding =  prefs.getIntPref('style.button.paddingTop') + "px";
			styleEngine.setElementStyle(ss, btnInToolbarSelector, 'min-height', buttonHeight, true);
			styleEngine.setElementStyle(ss, btnInToolbarSelector, 'padding-top', topPadding, true);


			// ==================
			// BORDERS & SHADOWS
			// for full colored tabs color the border as well!
			// but should only apply if background image is set!!
			let SHADOW = util.isCSSShadow ? 'box-shadow' : '-moz-box-shadow';
			if (prefs.getBoolPref("buttonShadows")) {
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton', SHADOW,'1px -1px 3px -1px rgba(0,0,0,0.3)', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton.selected-folder', SHADOW, '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton:hover', SHADOW, '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
			}
			else {
				styleEngine.removeElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton', SHADOW);
				styleEngine.removeElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton.selected-folder', SHADOW);
				styleEngine.removeElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton:hover', SHADOW);
			}

			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[background-image].selected-folder','border-bottom-color', colActiveBG, true);
			styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane','border-bottom-color', colActiveBG, true); // only in main toolbar!

			let theInit = '';
			try {
			  theInit = 'SelectedFolderStyle';
				this.initSelectedFolderStyle(ss, ssPalettes, tabStyle);
			  theInit = 'DefaultStyle';
				this.initDefaultStyle(ss, ssPalettes, tabStyle);
			  theInit = 'HoverStyle';
				this.initHoverStyle(ss, ssPalettes, this.PaintModeActive);
			  theInit = 'DragOverStyle';
				this.initDragOverStyle(ss, ssPalettes);
			}
			catch (ex) {
			  util.logException("Quickfolders.updateUserStyles - init" + theInit + " failed.", ex);
			}

			// TOOLBAR
			theColorString = prefs.getUserStyle("Toolbar","background-color","ButtonFace");
			if (prefs.getBoolPref("transparentToolbar"))
				theColorString = "transparent";
			styleEngine.setElementStyle(ss, '.toolbar','background-color', theColorString,true);

      // restrict to toolbar only (so as not to affect the panel in currentFolder bar!)
			styleEngine.setElementStyle(ss, 'toolbar.' + theme.cssToolbarClassName, 'background-color', theColorString,true);
      let tbBottom = prefs.getUserStyle("Toolbar","bottomLineWidth", 3) + "px";
      styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane', 'border-bottom-width', tbBottom, true);

			this.updateCurrentFolderBar(ss);

      // change to numeric
			let minToolbarHeight = prefs.getStringPref('toolbar.minHeight');
      if (minToolbarHeight) {
        let mT = parseInt(minToolbarHeight);
        styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar', 'min-height', mT.toString()+"px", false);
      }

      // main toolbar position
      let ordinalGroup = prefs.getIntPref('toolbar.ordinalPosition') || 0;
      styleEngine.setElementStyle(ss,'#QuickFolders-Toolbar', '-moz-box-ordinal-group', ordinalGroup.toString());

			util.logDebugOptional ("css","updateUserStyles(): success");
			return true;
		}
		catch(e) {
			util.logException("Quickfolders.updateUserStyles failed ", e);
			return false;
		};
		return false;
	} ,

	goUpFolder: function goUpFolder() {
		let aFolder = QuickFolders.Util.CurrentFolder;
		if (aFolder && aFolder.parent) {
			let parentFolder = aFolder.parent;
			QuickFolders_MySelectFolder(parentFolder.URI);
		}
	} ,

  // return true if the next tab was successfully selected.
	goNextQuickFolder: function goNextQuickFolder() {
		let aFolder = QuickFolders.Util.CurrentFolder,
		    found = false,
		    firstOne = null;
		if (!aFolder) // we are probably in search results
			return;
		for (let i=0; i<QuickFolders.Model.selectedFolders.length; i++) {
			let folderEntry = QuickFolders.Model.selectedFolders[i];
			if (!this.shouldDisplayFolder(folderEntry))
				continue;
			if (!firstOne)
				firstOne = folderEntry;
			if (found) {
				// select the QuickFolder
				QuickFolders_MySelectFolder(folderEntry.uri);
				return true;
			}
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false))
				found=true;
		}
		if (found) {
			QuickFolders_MySelectFolder(firstOne.uri);
      return true;
    }
    return false;
	} ,

  // return true if the previous tab was successfully selected.
	goPreviousQuickFolder: function goPreviousQuickFolder() {
		let aFolder = QuickFolders.Util.CurrentFolder,
		    found = false,
		    lastOne = null;
		if (!aFolder) // we are probably in search results
			return;
		for (let i=QuickFolders.Model.selectedFolders.length-1; i>=0; i--) {
			let folderEntry = QuickFolders.Model.selectedFolders[i];
			if (!this.shouldDisplayFolder(folderEntry))
				continue;
			if (!lastOne)
				lastOne = folderEntry;
			if (found) {
				// select the QuickFolder
				QuickFolders_MySelectFolder(folderEntry.uri);
				return true;
			}
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false))
				found=true;
		}
		if (found) {
			QuickFolders_MySelectFolder(lastOne.uri);
      return true;
    }
    return false;
	} ,

	goPreviousSiblingFolder: function goPreviousSiblingFolder() {
    const Cc = Components.classes,
		      Ci = Components.interfaces;
		let aFolder = QuickFolders.Util.CurrentFolder,
		    parentFolder = aFolder.parent,
		    myenum; // force instanciation for SM
		if (!aFolder || !parentFolder)
			return;

		if (typeof parentFolder.subFolders != 'undefined')
			myenum = parentFolder.subFolders;
		else
			myenum = parentFolder.GetSubFolders();
		let done=false,
		    target=null,
		    folder=null;
		while (!done) {
			target = folder;
			if (typeof myenum.currentItem!='undefined') {
				folder = myenum.currentItem().QueryInterface(Ci.nsIMsgFolder); // Postbox
				if (typeof myenum.next != 'undefined') {
					try { myenum.next(); }
					catch(e) {
						done=true;
					}
				}
			}
			else // SeaMonkey
			{
				if (myenum.hasMoreElements())
					folder = myenum.getNext().QueryInterface(Ci.nsIMsgFolder);
				else {
					done=true;
					break;
				}
			}
			if (folder.URI == aFolder.URI) {
				done=true;
				// if target is null:
				let x = null;
				while (target == null) {  // we are at start, lets go to the end (wrap around)
					if (typeof myenum.currentItem!='undefined') {
						try {
							myenum.next();
							x = myenum.currentItem().QueryInterface(Ci.nsIMsgFolder);
						} // no next: end of list
						catch(e) {
							target = x;
						}
					}
					else {
						if (myenum.hasMoreElements())
							x = myenum.getNext();
						else {
							if (!x) break; // only 1 item present
							target = x.QueryInterface(Ci.nsIMsgFolder);
						}
					}
				}
			}
		}
		if (null!=target)
			QuickFolders_MySelectFolder(target.URI);

	} ,

	goNextSiblingFolder: function goNextSiblingFolder() {
		let aFolder = QuickFolders.Util.CurrentFolder,
		    parentFolder = aFolder.parent,
        myenum; // force instanciation for SM
		if (!aFolder || !parentFolder)
			return;

		if (typeof parentFolder.subFolders != 'undefined')
			myenum = parentFolder.subFolders;
		else
			myenum = parentFolder.GetSubFolders();
		let done=false,
		    found=false,
		    first=null,
	      folder;
		while (!(done)) {
			if (typeof myenum.currentItem!='undefined') {
				folder = myenum.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder); // Postbox
				if (typeof myenum.next != 'undefined') {
					try {
						myenum.next();
					}
					catch(e) {
						done=true;
					}
				}
			}
			else { // SeaMonkey
				if (myenum.hasMoreElements())
					folder = myenum.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
				else {
					done=true;
					break;
				}
			}
			if (!first)
				first = folder;
			if (found)
				done=true;
			if (folder.URI == aFolder.URI)
				found=true;
		}
		if (found) {
			if (folder.URI == aFolder.URI)
				QuickFolders_MySelectFolder(first.URI);
			else
				QuickFolders_MySelectFolder(folder.URI);
		}
	} ,

  /**
   * toggles visibility of current folder toolbar
   * @visible {bool}: visibility tag
   * @messageWindow {string} : '?' - determine which one to close from context
   *                           '' - 3pane window
   *                           'singleMailTab' - a single message (conversation) tab
   *                           'messageWindow' - a single mail window
   **/
	displayNavigationToolbar: function displayNavigationToolbar(visible, selector) {
    if (typeof selector === 'undefined') selector = ''; // Unfortunately Postbox cannot do default parameters

    if (selector=='?') {
      // determine selector from context
      let wt = document.getElementById('messengerWindow').getAttribute('windowtype');
      if (wt === 'mail:messageWindow') {
        selector = 'messageWindow';
      }
      else {
        if (this.CurrentTabMode=='message')
          selector = 'singleMailTab';
        else
          selector = ''; // 3pane mode
      }
    }
    let util = QuickFolders.Util,
        mail3PaneWindow = util.getMail3PaneWindow(),
        mailMessageWindow = util.getSingleMessageWindow(),
        win, doc;
		util.logDebugOptional("interface.currentFolderBar", "displayNavigationToolbar(visible=" + visible + ", selector=" + selector + ")");
    // store change in prefs
    QuickFolders.Preferences.setShowCurrentFolderToolbar(visible, selector);

		if (selector=='messageWindow') {
			if (null == mailMessageWindow) return; // single message window not displayed
			win = mailMessageWindow;
		}
		else {
			if (null == mail3PaneWindow) return; // main window not displayed
			win = mail3PaneWindow;
		}
    doc = win.document;
		if (!doc) return;

		// doc = (mail3PaneWindow ? mail3PaneWindow.document : QuickFolders.doc);

    let tabMode = QuickFolders.Interface.CurrentTabMode,
        currentFolderBar = doc.getElementById(
                             (selector=='messageWindow') ?
                             "QuickFolders-PreviewToolbarPanel-Single" :
                             "QuickFolders-PreviewToolbarPanel"
                           );
		if (currentFolderBar) {
      if (selector == 'singleMailTab' && tabMode =='message'
          ||
          selector == '' && tabMode == util.mailFolderTypeName
          ||
          selector == 'messageWindow'
         ) {
        currentFolderBar.style.display = visible ? '-moz-box' : 'none';
        if (visible && selector != 'messageWindow') {
          let rect = currentFolderBar.getBoundingClientRect();
          if (!rect.width)
            this.hoistCurrentFolderBar(this.CurrentFolderTab);
        }
      }
		}
	} ,

	get CurrentTabMode() {
    const util = QuickFolders.Util;
		let tabMode = null,
		    tabmail = util.$("tabmail");

		if (tabmail) {
			let selectedTab = 0;
			if (tabmail.currentTabOwner) {
				tabMode = tabmail.currentTabOwner.type;
			}
			else if (QuickFolders.tabContainer) {
				selectedTab = QuickFolders.tabContainer.selectedIndex;
        selectedTab = selectedTab ? selectedTab : 0; // Thunderbird bug? selectedIndex sometimes returns void
				if (selectedTab>=0) {
					let tab = util.getTabInfoByIndex(tabmail, selectedTab);
					if (tab) {
						tabMode = util.getTabMode(tab);  // test in Postbox
						if (tabMode == "glodaSearch" && tab.collection) { //distinguish gloda search result
							tabMode = "glodaSearch-result";
						}
					}
					else {
						if (!tabmail.tabInfo.length)
							tabMode =  '3pane';
						else
							tabMode = ""; // Sm -- [Bug 25585] this was in the wrong place!
					}
				}
			}
		}

		return tabMode ? tabMode.toString() : '';
	} ,

	initToolbarHiding: function initToolbarHiding() {
		QuickFolders.Util.logDebugOptional("toolbarHiding", "initToolbarHiding");
		let tabmail = QuickFolders.Util.$("tabmail");
		if (tabmail) {
			let monitor = {
				onTabTitleChanged: function(aTab){},
				onTabSwitched: function(aTab, aOldTab) {
					let tabMode = QuickFolders.Interface.CurrentTabMode;
					QuickFolders.Util.logDebugOptional("toolbarHiding", "tabMode = " + tabMode);
					QuickFolders.Interface.onDeckChange(aTab);
				}
			};
			tabmail.registerTabMonitor(monitor);
			QuickFolders.Util.logDebugOptional("toolbarHiding", "registered Tab Monitor");
		}
	} ,

  // Called when we go to a different mail tab in order to show / hide QuickFolders Toolbar accordingly
	onDeckChange : function onDeckChange(targetTab) {
		let util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        mode = "",
		    isMailPanel = false,
        hideToolbar = prefs.getBoolPref("toolbar.onlyShowInMailWindows");
    if (prefs.isDebug)
      util.logDebugOptional("interface", "onDeckChange("
        + util.enumProperties(targetTab)  + ")"
        + "\n" + targetTab.mode ? util.enumProperties(targetTab.mode) : 'no mode.');
    // used to early exit when !hideToolbar

		let toolbar = this.Toolbar;
    mode = util.getTabMode(targetTab);
    if (['3pane','folder','glodaList','threadPaneBox'].indexOf(mode) >=0) {
      isMailPanel = true;
    }
		if (targetTab && targetTab.selectedPanel) {
			let targetId = targetTab.id;
			// if (targetId != "displayDeck") return;

		 	let panelId = targetTab.selectedPanel.id.toString();
			util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - panel: " + panelId);
      // mode = panelId;
		}
		else { //tab
			util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - mode: " + mode);
      mode = this.CurrentTabMode;
		}
    if (['glodaSearch-result','calendar','tasks','contentTab'].indexOf(mode) >=0)
      isMailPanel = false;
    util.logDebugOptional("interface", "mode = " + mode + "\nisMailPanel = " + isMailPanel);
		let isMailSingleMessageTab = (mode == "message") ? true  : false,
		    action = "";

		if (['threadPaneBox','accountCentralBox','3pane','folder','glodaList'].indexOf(mode) >=0 ||
		    isMailPanel && !prefs.getBoolPref("toolbar.hideInSingleMessage")) {
			action = "Showing";
      if (hideToolbar)
        toolbar.removeAttribute("collapsed");
		}
		else {
			action = "Collapsing";
      if (hideToolbar)
        toolbar.setAttribute("collapsed", true);
		}
		util.logDebugOptional("toolbarHiding", " (mode=" + mode + ")" + action + " QuickFolders Toolbar ");

    // always hide current folder toolbar in single message mode
    // QuickFolders-PreviewToolbarPanel
    // QuickFolders-PreviewToolbarPanel-ConversationView: in Thunderbird this is shown in single message tabs as well
    let singleMessageCurrentFolderPanel = document.getElementById("QuickFolders-PreviewToolbarPanel");
    if (isMailSingleMessageTab) {
      let visible = prefs.isShowCurrentFolderToolbar('singleMailTab');
      util.logDebugOptional("toolbarHiding", " isMailSingleMessageTab - setting display=none for QuickFolders-PreviewToolbarPanel");
      singleMessageCurrentFolderPanel.style.display= visible ? '-moz-box' : 'none';
    }
    else if (mode == "3pane" || mode == "folder") {
      util.logDebugOptional("toolbarHiding", " isMailSingleMessageTab - setting display=-moz-box for QuickFolders-PreviewToolbarPanel");
      let visible = prefs.isShowCurrentFolderToolbar('');
      singleMessageCurrentFolderPanel.style.display= visible ? '-moz-box' : 'none';
    }
	} ,

	toggle_FilterMode: function toggle_FilterMode(active) {
		QuickFolders.Util.logDebugOptional("interface", "toggle_FilterMode(" + active + ")");
		QuickFolders.FilterWorker.toggle_FilterMode(active);
	} ,

	moveFolder: function moveFolder(fromFolder, targetFolder, arrCount) {
		// [Bug 26517] support multiple folder moves - addeed "count" and transmitting URIs
		const Cc = Components.classes,
		      Ci = Components.interfaces,
					util = QuickFolders.Util;

		let lastFolder,
		    sPrompt = util.getBundleString("qfConfirmMoveFolder", "Really move folder {0} to {1}?"),
				whatIsMoved = arrCount ?
				             (arrCount==1 ? fromFolder[0].prettyName : "[" + arrCount + " folders]") : fromFolder.prettyName;

		sPrompt = sPrompt.replace("{0}", whatIsMoved);
		sPrompt = sPrompt.replace("{1}", targetFolder.prettyName);
		let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
		if (!promptService.confirm(window, "QuickFolders", sPrompt)) return;

		let cs = Cc["@mozilla.org/messenger/messagecopyservice;1"].getService(Ci.nsIMsgCopyService);
		try {
			let toCount = arrCount || 1, // for the moment only support dragging one folder.
					ap = util.Application,
					isNewArray = (ap == 'Thunderbird' || ap == 'SeaMonkey');
			for (let i = 0; i < toCount; i++) {
				let folders = new Array,
				    fld = arrCount ? fromFolder[i] : fromFolder,
				    fromURI = fld.URI;
				lastFolder = fld; // keep track of last folder in case of a problem.
				folders.push(fld); // dt.mozGetDataAt("text/x-moz-folder", i).QueryInterface(Ci.nsIMsgFolder)
				let array = isNewArray ?
						toXPCOMArray(folders, Ci.nsIMutableArray)
					: Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);

				if (!isNewArray)
					array.AppendElement(fld);

				// cannot move if the target Folder is in a different account?
				// folders[0]\ == targetFolder.server
				let isMove = (!fld.locked && fld.canRename && fld.deletable
												&&
											 (fld.server.type == 'pop3' || fld.server.type == 'imap' || fld.server.type == 'none')),
						listener = null;
				cs.CopyFolders(array,
											 targetFolder,
											 isMove,
											 listener,
											 msgWindow);
				// in case it has a Tab, fix the uri
				//  see also OnItemRemoved
				// get encoded folder Name:
				let slash = fromURI.lastIndexOf('/'),
						encName = fromURI.substring(slash),
						newURI = targetFolder.URI + encName,
						countChanges = QuickFolders.Model.moveFolderURI(fromURI, newURI);
				if (countChanges)
					this.updateFolders(true, true);

				// Filter Validation!
				setTimeout(function() {  QuickFolders.FilterList.validateFilterTargets(fromURI, newURI); });
			}
		}
		catch(ex) {
			sPrompt = util.getBundleString("qfCantMoveFolder", "Folder {0} cannot be moved.");
			sPrompt = sPrompt.replace("{0}", lastFolder.prettyName);
			Services.prompt.alert(null,"QuickFolders", sPrompt + "\n" + ex);
			util.logException("Exception in movefolder ", ex);
		}
	} ,

	showPalette: function showPalette(button) {
		let context = button.getAttribute('context');
		QuickFolders.Util.logDebugOptional("interface", "Interface.showPalette(" + button.id + "): context = " + context);
		this.showPopup(button, context);
	} ,

	togglePaintMode: function togglePaintMode(mode) {
		const util = QuickFolders.Util;
		let active;
		switch (mode) {
			case 'on':
				active = true;
				break;
			case 'off':
				active = false;
				break;
			case 'toggle': default:
				active = this.PaintModeActive ? false : true;
		}
		util.logDebugOptional("interface", "togglePaintMode(" + mode + ")\n" + " active = " + active);
		// get color of current Tab and style the button accordingly!
		let paintButton = this.PaintButton;
		if (paintButton) {
			let btnCogwheel = this.CogWheelPopupButton;
			if (btnCogwheel)
				btnCogwheel.collapsed = active || !QuickFolders.Preferences.isShowToolIcon;
			paintButton.collapsed = !active;
			if (this.CategoryBox)
				this.CategoryBox.setAttribute('mode', active ? 'paint' : '');

			if (this.CurrentFolderFilterToggleButton)
				this.CurrentFolderFilterToggleButton.setAttribute('mode', '');
			this.PaintModeActive = active;

			toolbar = this.Toolbar;
			if(active) {
				let tabColor = 1;
				let folder = util.CurrentFolder;
				if (folder) {
					let folderEntry = QuickFolders.Model.getFolderEntry(folder.URI);
					tabColor = folderEntry && folderEntry.tabColor ? folderEntry.tabColor : tabColor;
				}

				try {
					this.setButtonColor(paintButton, tabColor);
					// create context menu
					let menupopup = this.PalettePopup;
					if (!menupopup.firstChild) {
						util.logDebugOptional("interface","build palette menu…");
						this.buildPaletteMenu(tabColor, menupopup);
						// a menu item to end this mode
						let mItem = this.createMenuItem("qfPaint", this.getUIstring("qfPaintToggle", "Finish Paint Mode"));
						// this.setEventAttribute(mItem, "oncommand",'QuickFolders.Interface.togglePaintMode("off");');
						mItem.addEventListener("command", function(event) { QuickFolders.Interface.togglePaintMode('off'); }, false);
            mItem.className = 'menuitem-iconic';
						menupopup.insertBefore(this.createIconicElement('menuseparator','*'), menupopup.firstChild);
						menupopup.insertBefore(mItem, menupopup.firstChild);
					}
					else
						util.logDebugOptional("interface","palette already built (firstChild exists)");
					util.logDebugOptional("interface","initElementPaletteClass…");
					this.initElementPaletteClass(menupopup);
				}
				catch(ex) {
					util.logException('Exception during togglePaintMode(on)', ex);
				};
				toolbar.style.setProperty('cursor', "url(chrome://quickfolders/content/skin/ico/fugue-paint-cursor.png) 14 13, auto", 'important'); // supply hotspot coordinates
			}
			else {
				toolbar.style.setProperty('cursor', 'auto', 'important');
			}
		}
		this.initHoverStyle(
		         this.getStyleSheet(QuickFolders.Styles, 'quickfolders-layout.css', "QuickFolderStyles"),
		         this.getStyleSheet(QuickFolders.Styles, QuickFolders.Interface.PaletteStyleSheet, 'QuickFolderPalettes'),
		         this.PaintModeActive);

		// set cursor!
	} ,

  updateFindBoxMenus: function updateFindBoxMenus(toggle) {
		const util = QuickFolders.Util;
    try {
      util.$('QuickFolders-quickMove-showSearch').collapsed = toggle;
      util.$('QuickFolders-quickMove-hideSearch').collapsed = !toggle;
    }
    catch (ex) {
			util.logException('Exception during updateFindBoxMenus(' + toggle + ') ', ex);
    }
  } ,

  // make a special style visible to show that [Enter] will move the mails in the list (and not just jump to the folder)
  toggleMoveModeSearchBox: function toggleMoveModeSearchBox(toggle) {
    QuickFolders.Util.logDebug('toggleMoveModeSearchBox(' + toggle + ')');
    let searchBox = QuickFolders.Interface.FindFolderBox;
		if (toggle)
			searchBox.classList.add("quickMove");
		else
			searchBox.classList.remove("quickMove");

  } ,

  quickMoveButtonClick: function quickMoveButtonClick(evt, el) {
		const QI = QuickFolders.Interface;
	  let searchBox = QI.FindFolderBox;
    if (searchBox && !searchBox.collapsed && evt.button==0)  // hide only on left click
      QuickFolders.quickMove.hideSearch(); // hide search box if shown
    else {
      if (QuickFolders.quickMove.hasMails)
        QI.showPopup(el,'QuickFolders-quickMoveMenu');
      else
        QI.findFolder(true,'quickJump'); // show jump to folder box
    }
  },

  readingListClick: function readingListClick(evt, el) {
    QuickFolders.Interface.showPopup(el,'QuickFolders-readingListMenu');
  },

  // remove animated icons for pro version
  removeAnimations: function removeAnimations(styleSheetName) {
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface,
          styleEngine = QuickFolders.Styles;
    // win = util.getMail3PaneWindow();
    styleSheetName = styleSheetName || 'quickfolders-layout.css';
    let ss = QI.getStyleSheet(styleEngine, styleSheetName),  // rules are imported from *-widgets.css
        iconSelector = 'menuitem.cmd[tagName="qfRegister"] .menu-iconic-icon, #QuickFolders-Pro .tab-icon';
    styleEngine.removeElementStyle(ss,
                                   iconSelector,
                                   ['animation-name', 'height', 'width']);
    styleEngine.setElementStyle(ss,
                                'menuitem.cmd[tagName="qfRegister"], tab#QuickFolders-Pro',
                                'list-style-image',
                                "url('chrome://quickfolders/content/skin/ico/pro-16.png')",
                                true);
  } ,

  folderPanePopup: function folderPanePopup(evt) {
	  const util = QuickFolders.Util;
    // needs to go into popup listener
    try {
      let folders = GetSelectedMsgFolders(),
          folder = folders[0],
          hasIcon = QuickFolders.FolderTree.hasTreeItemFolderIcon(folder);
      util.$("context-quickFoldersRemoveIcon").collapsed = !hasIcon;
      util.$("context-quickFoldersIcon").collapsed = hasIcon; // hide select icon for tidier experience.
    }
    catch (ex) {
      util.logDebug('folderPanePopup() failed:' + ex);
    }

  } ,

  toggleFolderTree: function toggleFolderTree() {
    goDoCommand('cmd_toggleFolderPane');
  } ,

	clickTitleLabel: function clickTitleLabel(btn) {
	  const util = QuickFolders.Util;
		if (util.Licenser.isExpired) {
			QuickFolders.Licenser.showDialog('mainLabelRenewal');
		}
		else { // get context Menu as normal
			QuickFolders.Interface.showPopup(btn, 'QuickFolders-ToolbarPopup');
		}
	} ,

	removeLastPopup: function removeLastPopup(p, theDoc) {
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

	}	,

	storeConfig: function qf_storeConfig(preferences) {
		// see options.copyFolderEntries
    const Cc = Components.classes,
          Ci = Components.interfaces,
		      service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					sFolderString =
					  util.PlatformVersion < 57.0 ?
					  service.getComplexValue("QuickFolders.folders", Ci.nsISupportsString).data :
						service.getStringPref("QuickFolders.folders");
		let obj = JSON.parse(sFolderString),
        storedObj = { folders: obj }; // wrap into "folders" subobject, so we can add more settings

		// add more settings here! (should we include license string?)
		if (preferences) {
			let prefInfos = preferences.getAll();
			storedObj.general = [];
			storedObj.advanced = [];
			storedObj.layout = [];
			storedObj.userStyle = [];
			let isLicense =  (util.Licenser.isExpired || util.Licenser.isValidated);
			if (isLicense)
				storedObj.premium = [];

			for (let info of prefInfos) {
				let node = { key: info.name, val: info.value, id: info.id }
				switch (info.id.substr(0,5)) {
					case 'qfpg-':  // general
						storedObj.general.push(node);
						break;
					case 'qfpa-':  // advanced
						storedObj.advanced.push(node);
						break;
					case 'qfpl-':  // layout
						storedObj.layout.push(node);
						break;
					case 'qfpp-':  // premium - make sure not to import the License without confirmation!
						if (isLicense)
							storedObj.premium.push(node);
						break;
					default:
						util.logDebug("Not storing - unknown preference category: " + node.key);
				}
			}
			// now save all color pickers.
			let elements = document.getElementsByTagName('html:input');
			for (let i=0; i<elements.length; i++) {
				let element = elements[i];
				if (element.getAttribute('type')=='color') {
					let node = { elementInfo: element.getAttribute('elementInfo'), val: element.value };
					storedObj.userStyle.push(node);
				}
			}
		}

		let prettifiedJson = JSON.stringify(storedObj, null, '  ');
		this.fileConfig('save', prettifiedJson, 'QuickFolders-Config');
	} ,

	loadConfig: function qf_loadConfig(preferences) {
		function changePref(pref) {
			let p = preferences.get(pref.id);
			if (p) {
				if (p._value != pref.val) {
					util.logDebug("Changing [" + p._name + "]" + pref.id + " : " + pref.val);
					p._value = pref.val;
				}
			}
		}
		function readData(dataString) {
			const Cc = Components.classes,
						Ci = Components.interfaces,
						service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
						util = QuickFolders.Util,
						prefs = QuickFolders.Preferences,
						options = QuickFolders.Options;
			try {
				// removes prettyfication:
				let config = dataString.replace(/\r?\n|\r/, ''),
						data = JSON.parse(config),
				    entries = data.folders,
						question = util.getBundleString('qf.prompt.restoreFolders',
							"This will delete all QuickFolders tabs and replace with the items from the file." +
							"\n{0} entries were read." +
							"\nReplace tabs?");
				if (prefs.getBoolPref('restoreConfig.tabs')
				   && Services.prompt.confirm(window, "QuickFolders", question.replace("{0}", entries.length))) {
					for (let ent of entries) {
						if (typeof ent.tabColor ==='undefined' || ent.tabColor ==='undefined')
							ent.tabColor = 0;
						// default the name!!
						if (!ent.name) {
							// retrieve the name from the folder uri (prettyName)
							let f = QuickFolders.Model.getMsgFolderFromUri(ent.uri, false);
							if (f)
								ent.name = f.prettyName;
							else
								ent.name = util.getNameFromURI(ent.uri);
						}
					}
					if (!entries.length)
						entries=[];
					// the following function calls this.updateMainWindow() which calls this.updateFolders()
					util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(entries);
					let invalidCount = 0,
					    modelEntries = util.getMail3PaneWindow().QuickFolders.Model.selectedFolders;
					// updateFolders() will append "invalid" property into entry of main model if folder URL cannot be found
					for (let i=0; i<modelEntries.length; i++) {
						if (modelEntries[i].invalid)
							invalidCount++;
					}

					question = util.getBundleString('qf.prompt.loadFolders.confirm', "Accept the loaded Tabs?");
					if (invalidCount) {
						let wrn =
						  util.getBundleString('qfInvalidTabCount', "Found {0} Tabs that have an invalid folder destination. You can remove these using the 'Find orphaned Tabs' command.");
						question = wrn.replace("{0}", invalidCount) + "\n" + question;
					}
					if (Services.prompt.confirm(window, "QuickFolders", question)) {
						// store
						prefs.storeFolderEntries(entries);
					}
					else {
						// roll back
						util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
					}
					delete data.folders; // remove this part to move on to the rest of settings
					// ====================================================================
					if (prefs.getBoolPref('restoreConfig.general') && data.general) {
						for (let i=0; i<data.general.length; i++) {
							changePref(data.general[i]);
						}
					}
					if (prefs.getBoolPref('restoreConfig.layout')) {
						if (data.layout) {
							for (let i=0; i<data.layout.length; i++) {
								changePref(data.layout[i]);
							}
						}
						if (data.advanced) {
							for (let i=0; i<data.advanced.length; i++) {
								changePref(data.advanced[i]);
							}
						}

						if (data.premium) {
							for (let i=0; i<data.premium.length; i++) {
								changePref(data.premium[i]);
							}
						}
						// load custom colors and restore color pickers
						// options.styleUpdate('Toolbar', 'background-color', this.value, 'qf-StandardColors')
						if (data.userStyle) {
							let elements = document.getElementsByTagName('html:input');
							for (let i=0; i<elements.length; i++) {
								let element = elements[i];
								try {
									if (element.getAttribute('type')=='color') {
										let elementInfo = element.getAttribute('elementInfo');
										// find the matching entry from json file
										for(let j=0; j<data.userStyle.length; j++) {
											let jnode = data.userStyle[j];
											if (jnode.elementInfo == elementInfo) {
												// only change value if nevessary
												if (element.value != jnode.val) {
													element.value = jnode.val; // change color picker itself
													util.logDebug("Changing [" + elementInfo + "] : " + jnode.val);
													let info = jnode.elementInfo.split('.');
													if (info.length == 2)
														options.styleUpdate(
															info[0],   // element name e..g. ActiveTab
															info[1],   // element style (color / background-color)
															jnode.val,
															element.getAttribute('previewLabel')); // preview tab / label
												}
												break;
											}
										}
										// QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue)
									}
								}
								catch(ex) {
									util.logException("Loading layout setting[" + i + "] (color picker " + element.id + ") failed:", ex);
								}
							}
						}

					}
				}
			}
			catch (ex) {
				util.logException("Error in QuickFolders.Options.pasteFolderEntries():\n", ex);
				Services.prompt.alert(null,"QuickFolders", util.getBundleString('qf.alert.pasteFolders.formatErr', "Could not create tabs. See error console for more detail."));
			}
		}
		this.fileConfig('load', null, null, readData); // load does the reading itself?
	} ,

	fileConfig: function qf_fileConfig(mode, jsonData, fname, readFunction) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
		util.popupProFeature(mode + "_config"); // save_config, load_config
    let filterText,
		    fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;

		let dPath = prefs.getStringPref('files.path');
		if (dPath) {
			let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			defaultPath.initWithPath(dPath);
			if (defaultPath.exists()) { // avoid crashes if the folder has been deleted
				fp.displayDirectory = defaultPath; // nsILocalFile
				util.logDebug("Setting default path for filepicker: " + dPath);
			}
			else {
				util.logDebug("fileFilters()\nPath does not exist: " + dPath);
			}
		}
		fp.init(window, "", fileOpenMode); // second parameter: prompt
    filterText = util.getBundleString("qf.fpJsonFile","JSON File");
    fp.appendFilter(filterText, "*.json");
    fp.defaultExtension = 'json';
    if (mode == 'save') {
			let fileName = fname;
/*
			if (isDateStamp) {
				let d = new Date(),
				    timeStamp = d.getFullYear() + "-" + twoDigs(d.getMonth()+1) + "-" + twoDigs(d.getDate()) + "_" + twoDigs(d.getHours()) + "-" + twoDigs(d.getMinutes());
				fileName = fname + "_" + timeStamp;
			}
			*/
      fp.defaultString = fileName + '.json';
    }

    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
					// Store last Path
					util.logDebug("File Picker Path: " + path);
					let lastSlash = path.lastIndexOf("/");
					if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
					let lastPath = path.substr(0, lastSlash);
					util.logDebug("Storing Path: " + lastPath);
					prefs.setStringPref('files.path', lastPath);
          if (util.Application=='Postbox' && util.PlatformVersion<50) {
            switch (mode) {
              case 'load':
                let settings = util.Postbox_readFile(path);
                readFunction(settings);
                return;
              case 'save':
                util.Postbox_writeFile(path, jsonData)
                return;
            }
            throw ('invalid mode: ' + mode);
          }

					const {OS} = (typeof ChromeUtils.import == "undefined") ?
						Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
						ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          switch (mode) {
            case 'load':
              let promiseRead = OS.File.read(path, { encoding: "utf-8" }); //  returns Uint8Array
              promiseRead.then(
                function readSuccess(data) {
                  readFunction(data);
                },
                function readFailed(ex) {
                  util.logDebug ('read() - Failure: ' + ex);
                }
              )
              break;
            case 'save':
              // if (aResult == Ci.nsIFilePicker.returnReplace)
              let promiseDelete = OS.File.remove(path);
              // defined 2 functions
              util.logDebug ('Setting up promise Delete');
              promiseDelete.then (
                function saveJSON() {
                  util.logDebug ('saveJSON()…');
                  // force appending correct file extension!
                  if (!path.toLowerCase().endsWith('.json'))
                    path += '.json';
                  let promiseWrite = OS.File.writeAtomic(path, jsonData, { encoding: "utf-8"});
                  promiseWrite.then(
                    function saveSuccess(byteCount) {
                      util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
                    },
                    function saveReject(fileError) {  // OS.File.Error
                      util.logDebug ('bookmarks.save error:' + fileError);
                    }
                  );
                },
                function failDelete(fileError) {
                  util.logDebug ('OS.File.remove failed for reason:' + fileError);
                }
              );
              break;
          }
        }
      }
    }

		if (fp.open)
			fp.open(fpCallback);
  	else { // Postbox
		  fpCallback(fp.show());
  	}

    return true;

	}


}; // Interface


