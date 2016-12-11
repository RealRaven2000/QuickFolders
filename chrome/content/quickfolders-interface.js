"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */


Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");
Components.utils.import("resource://gre/modules/PluralForm.jsm");

if (!QuickFolders.StringBundle)
	QuickFolders.StringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties = QuickFolders.StringBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties")
		.QueryInterface(Components.interfaces.nsIStringBundle);

QuickFolders.Interface = {
	PaintModeActive: false,
	TimeoutID: 0,
	LastTimeoutID: 0,
	debugPopupItems: 0,
	buttonsByOffset: [],
	menuPopupsByOffset: [],
	//myPopup: null,
	boundKeyListener: false,
	RecentPopupId: 'QuickFolders-folder-popup-Recent',
	_paletteStyleSheet: null,
	_paletteStyleSheetOfOptions: null,
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
	  let isOptionsScreen = (document.location.href.toString() == 'chrome://quickfolders/content/options.xul');
	
		if (isOptionsScreen) {
			if (this._paletteStyleSheetOfOptions)
				return this._paletteStyleSheetOfOptions;
		}
		else {
			if (this._paletteStyleSheet)
				return this._paletteStyleSheet;
		}
		let ss = 
			QuickFolders.Util.isCSSGradients ?
			'skin/quickfolders-palettes.css' : 
			'skin/quickfolders-palettes-legacy.css';
		this._paletteStyleSheet = 'chrome://quickfolders/' + ss;
		if (!this._paletteStyleSheetOfOptions)  {
      if (QuickFolders.Util.Application != 'Postbox')
        this._paletteStyleSheetOfOptions = 'chrome://quickfolders/skin/quickfolders-options.css';  // this._paletteStyleSheet; 
      else
        this._paletteStyleSheetOfOptions = 'chrome://quickfolders/skin/quickfolders-palettes-legacy.css';
    }  
      
		
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
		QuickFolders.Util.logDebugOptional("listeners.folder,interface", "Folder Update from Timer " + this.TimeoutID + "...");
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
					folder = myenum.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder); // Postbox
				else // SeaMonkey
				{
					if (myenum.hasMoreElements())
						folder = myenum.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
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
		    acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].
					  getService(Components.interfaces.nsIMsgAccountManager);
		for (let acct in fixIterator(acctMgr.accounts, Components.interfaces.nsIMsgAccount)) {
		  addIfRecent(acct.incomingServer.rootFolder);
		  checkSubFolders(acct.incomingServer.rootFolder);
		}

		recentFolders.sort(sorter);
		return recentFolders;
	} ,

	createRecentPopup: function createRecentPopup(passedPopup, isDrag, isCreate, isCurrentFolderButton) {
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
			menupopup = document.createElement('menupopup');
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
		    FoldersArray = Components.classes["@mozilla.org/array;1"]
							.createInstance(Components.interfaces.nsIMutableArray),
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
        debugText += '\n' + i + '. appended ' +  f.prettyName + '   ' + f.URI;
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
			    button = passedButton ? passedButton : document.createElement("toolbarbutton");
			if (!passedButton) {
				isFolderUpdate = true;
				let recentLabel = QuickFolders.Preferences.getBoolPref("recentfolders.showLabel") ?
					this.getUIstring("qfRecentFolders", "Recent Folders") : '';
				button.setAttribute("label", recentLabel);
				button.setAttribute("tag", "#Recent");
				button.id="QuickFolders-Recent";

				// biffState = nsMsgBiffState_Unknown = 2
				this.styleFolderButton(button, 0, 0
					, 'recent' + ((isCurrentFolderButton || QuickFolders.Preferences.isShowRecentTabIcon) ?  ' icon' : '')
					, false, null);
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

			if (button.firstChild && typeof button.firstChild != 'undefined') 
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
						button.addEventListener("dragenter", function(event) { nsDragAndDrop.dragEnter(event, QuickFolders.buttonDragObserver); }, false);
						button.addEventListener("dragover", function(event) { nsDragAndDrop.dragOver(event, QuickFolders.buttonDragObserver); return false; }, false);
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

		if (forceDisplay) {
			// left click: open context menu through code
			this.createRecentTab(null, false, button);
			QuickFolders.Interface.showPopup(button, this.menuPopupsByOffset[0].id, null); // this.RecentPopupId
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

	// added parameter to avoid deleting categories dropdown while selecting from it!
	// new option: minimalUpdate - only checks labels, does not recreate the whole folder tree
	updateFolders: function updateFolders(rebuildCategories, minimalUpdate) {
    let prefs = QuickFolders.Preferences,
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
		
		let cat = this.CategoryMenu;
		if (cat) {
			cat.style.display =
		    (!showToolIcon && QuickFolders.Model.Categories.length == 0)
		    ? 'none' : '-moz-inline-box';
			if (prefs.getBoolPref('collapseCategories')) {
				if (cat.className.indexOf('autocollapse')==-1)
					cat.className += ' autocollapse';
			}
			else {
				if (cat.className.indexOf('autocollapse')>=0)
					cat.className.replace ('autocollapse', '');
			}
				
	  }

		if (rebuildCategories || prefs.isMinimalUpdateDisabled)
			minimalUpdate = false;

		let sDebug = 'updateFolders(rebuildCategories: ' + rebuildCategories + ', minimal: ' + minimalUpdate +')',
		    toolbar = this.Toolbar,
		    theme = prefs.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName + " chromeclass-toolbar";

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += ' - Number of Folders = ' + QuickFolders.Model.selectedFolders.length;

		util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			util.clearChildren(this.FoldersBox, rebuildCategories);

			// force label when there are no folders!
			let showLabelBox = prefs.isShowQuickFoldersLabel || (0==QuickFolders.Model.selectedFolders.length),
			    quickFoldersLabel = this.TitleLabel,
					qfLabelBox = this.TitleLabelBox;

			quickFoldersLabel.label = prefs.TextQuickfoldersLabel;
			quickFoldersLabel.collapsed = !showLabelBox;
			qfLabelBox.collapsed = !showLabelBox;
			qfLabelBox.style.width = showLabelBox ? "auto" : "0px";

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
			    isFirst=true;
			for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if (!this.shouldDisplayFolder(folderEntry))
					continue;

				if((folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false))) {
					countFolders++;
					if (!minimalUpdate) {
						button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle, isFirst);
            if (button) {
              this.buttonsByOffset[offset] = button;
              isFirst = false;
              offset++;
            }
					}
					else {
						// now just update the folder count on the button label, if it changed.
						// button is not newly created. Also it is not recolored.
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry, offset, button, null, tabStyle, isFirst, minimalUpdate);
							isFirst = false;
              offset++;
						}
					}
				}
			}

			let sDoneWhat = minimalUpdate ? "rebuilt." : "rendered on toolbar."
			util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
		}

		// [Bug 25598] highlight active tab
    if (!minimalUpdate)
      this.lastTabSelected = null;  // reset to force highlight active tab
		this.onTabSelected();
		
		// current message dragging
		let button = this.MailButton;
		if (button)
			this.setEventAttribute(button, "ondragstart","nsDragAndDrop.startDrag(event,QuickFolders.messageDragObserver, true)");

		// current thread dragging; let's piggyback "isThread"...
		// use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
		button = util.$('QuickFolders-CurrentThread'); 
		if (button)
			this.setEventAttribute(button, "ondragstart","event.isThread=true; nsDragAndDrop.startDrag(event,QuickFolders.messageDragObserver, true)");
		if (prefs.isShowCategoryNewCount) {
			
		}
	} ,
	
	updateCurrentFolderBar: function updateCurrentFolderBar(styleSheet) {
		function collapseConfigItem(id, isShownSetting, checkParent) {
			let element = QuickFolders.Util.$(id);
			// safeguard for copied ids (such as button-previous / button-next)
			if (checkParent && element.parentNode.id.indexOf('QuickFolders') < 0)
				return;
			if (element)
				element.setAttribute('collapsed', !QuickFolders.Preferences.getBoolPref(isShownSetting));
		}
		
		collapseConfigItem("QuickFolders-Close", "currentFolderBar.showClose");
		collapseConfigItem("QuickFolders-currentFolderFilterActive", "currentFolderBar.showFilterButton");
		collapseConfigItem("QuickFolders-Recent-CurrentFolderTool", "currentFolderBar.showRecentButton");
		collapseConfigItem("QuickFolders-currentFolderMailFolderCommands", "currentFolderBar.showFolderMenuButton");
		collapseConfigItem("QuickFolders-currentFolderIconCommands", "currentFolderBar.showIconButtons");
		
		let toolbar2 = this.CurrentFolderBar;
		if (toolbar2) {
			let prefs = QuickFolders.Preferences,
          theme = prefs.CurrentTheme,
			    styleEngine = QuickFolders.Styles,
			    ss = styleSheet || this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles'),
			    background = prefs.getStringPref('currentFolderBar.background');
			styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools', 'background', background);

			// find (and move) button if necessary
			let cF = this.CurrentFolderTab;
			
			// add styling to current folder via a fake container
			if (cF && cF.parentNode)
				cF.parentNode.className = theme.cssToolbarClassName;
      
      // support larger fonts - should have a knock-on effect for min-height
      let fontSize = prefs.ButtonFontSize;
      fontSize = fontSize ? (fontSize+"px") : "11px"; // default size
      toolbar2.style.fontSize = fontSize;
      cF.style.fontSize = fontSize;

			let hideMsgNavigation = !prefs.getBoolPref("currentFolderBar.navigation.showButtons"),
          hideFolderNavigation = !prefs.getBoolPref("currentFolderBar.folderNavigation.showButtons"),
          hideNavToggle = !prefs.getBoolPref("currentFolderBar.navigation.showToggle");
			for (let n=0; n< toolbar2.childNodes.length; n++)
			{
				let node = toolbar2.childNodes[n],
				    special = node.getAttribute ? node.getAttribute('special') : null;
				if (special && special=="qfMsgFolderNavigation") {
					node.collapsed = (hideMsgNavigation
                           ||
                          (node.id == 'quickFoldersNavToggle') && hideNavToggle);
				}
        else if (node.id && node.id.indexOf('QuickFolders-Navigate')==0) {
          // hide QuickFolders-NavigateUp, QuickFolders-NavigateLeft, QuickFolders-NavigateRight
          node.collapsed = hideFolderNavigation;
        }
			}
		}	
	} ,

	updateCategories: function updateCategories() {
    const util = QuickFolders.Util,
		      model = QuickFolders.Model,
					prefs = QuickFolders.Preferences,
          FCat = QuickFolders.FolderCategory,
					isPostbox = (util.Application=='Postbox') ? true : false;

		util.logDebugOptional("interface", "updateCategories()");
		let bookmarkCategories = model.Categories,
		    lCatCount = bookmarkCategories ? bookmarkCategories.length : 0,
		    menuList = this.CategoryMenu,
		    menuPopup = menuList.menupopup;
		util.logDebug("updateCategories() - [" + lCatCount + " Categories]");

    try { 
      if (lCatCount > 0 && menuList && menuPopup) {
				let activeCatsList = this.currentActiveCategories,
				    cats = activeCatsList ? activeCatsList.split('|') : [];
        util.clearChildren(menuPopup,true);
        menuList.collapsed = false;
        menuList.style.display = '-moz-box';

        menuPopup.appendChild(this.createMenuItem(
          FCat.ALL, 
          this.getUIstring("qfAll", "(Display All)"), 
          'menuitem-iconic'));
        for (let i = 0; i < lCatCount; i++) {
          let category = bookmarkCategories[i];
          if (category!=FCat.ALWAYS && category!=FCat.NEVER) {
            let menuItem = this.createMenuItem(category, category, 'menuitem-iconic');
            // add checkbox for multiple category selection
            if (prefs.getBoolPref('premium.categories.multiSelect')) {
							// multi selection
							if (cats.indexOf(category)>=0)
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
					menuPopup.appendChild(document.createElement('menuseparator'));
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
        menuList.collapsed = true;
        menuList.style.display = 'none';
      }
    }
    catch (ex) {
      util.logException("updateCategories()", ex);
    }
	} ,
	
	// moved from options.js!
	updateMainWindow: function updateMainWindow(minimal) {
		function logCSS(txt) {
			util.logDebugOptional("css", txt);
		}
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;

		logCSS("============================\n" + "updateMainWindow...");
		let themeSelector = document.getElementById("QuickFolders-Theme-Selector");
			
		// update the theme type - based on theme selection in options window, if this is open, else use the id from preferences
		prefs.setCurrentThemeId(themeSelector ? themeSelector.value : prefs.CurrentThemeId);
		let style =  prefs.ColoredTabStyle,
		    // refresh main window
		    mail3PaneWindow = util.getMail3PaneWindow();
		// we need to try and get at the main window context of QuickFolders, not the prefwindow instance!
		if (mail3PaneWindow) { 
			let QI = mail3PaneWindow.QuickFolders.Interface;
      if (!minimal) {
        logCSS("updateMainWindow: update Folders...");
        QI.updateFolders(true, false);
      }
			logCSS("updateMainWindow: update User Styles...");
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

	deleteFolderPrompt: function deleteFolderPrompt(folderEntry, withCancel) {
		let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
													.getService(Components.interfaces.nsIPromptService),		
		    flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
								prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;
		if (withCancel)
			flags += prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_CANCEL;											 
		let noCheckbox = {value: false};
		// button = prompts.confirmEx(null, "Title of this Dialog", "What do you want to do?",
													 // flags, "button 0", "Button 1", "button 2", "check message", let check = {value: false});
		let text = folderEntry.name + this.getUIstring('qfThisTabIsInvalid',': This is a tab that points to an invalid folder:') + '\n'
									+ folderEntry.uri + '\n'
									+ this.getUIstring('qfTabDeletePrompt','Delete this Tab?');
							 
		let answer = prompts.confirmEx( null, 
																		"QuickFolders", 
																		text,
																		flags,
																		'', '', '',
																		null,
																		noCheckbox);  
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
    const util = QuickFolders.Util;
		util.logDebugOptional("interface", "tidyDeadFolders()");
		let countTabs=0,
		    countDeleted=0,
		    sMsg = this.getUIstring('qfTidyDeadFolders',
			'This will remove the Tabs that have no valid folders assigned.\nThis sometimes happens if a folder is removed without QuickFolders being notified.')
		if (!confirm(sMsg))
			return;
		let isCancel = false;
		for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
			// test mail folder for existence
			let folderEntry = QuickFolders.Model.selectedFolders[i],
			    folder = null;
			try { 
				folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);
			}
			catch(ex) {
				util.logException('GetMsgFolderFromUri failed with uri:' + folderEntry.uri, ex); 			
			}
			countTabs++;
			
			if (!folder || !util.doesMailFolderExist(folder)) {
				switch (this.deleteFolderPrompt(folderEntry, true)) {
				  case 1:  // deleted
					  countDeleted++;
						i--; // array is spliced, so we need to go back one!
					  break;
					case 0:  // not deleted
					  break;
					case -1: // cancelled
					  return;
				}
			}
		}

		let countOrphans = countDeleted;
		if (countDeleted > 0) {
			if (confirm(this.getUIstring('qfSavePrompt', 'Save these changes?'))) {
				QuickFolders.Preferences.storeFolderEntries(QuickFolders.Model.selectedFolders);
				this.updateFolders(true, false); // show this on screen
			}
			else {
				// restore model
				QuickFolders.Preferences.loadFolderEntries();
				countDeleted = 0;
				this.updateFolders(true, false);
			}
		}
		let sLabelFound = this.getUIstring('qfDeadTabsCount', '# dead tabs found:'),
		    sLabelDeleted = this.getUIstring('qfDeadTabsDeleted', '# dead tabs removed:');
		//alert(sLabelFound + ' ' + countOrphans + '\n' + sLabelDeleted + ' ' + countDeleted);
		Services.prompt.alert(null,"QuickFolders",sLabelFound + ' ' + countOrphans + '\n' + sLabelDeleted + ' ' + countDeleted);
	} ,

  repairTreeIcons: function repairTreeIcons() {
    // repair all tree icons based on Tab Icons
    // does not need to be high performance, hence we do file check synchronously
    const util = QuickFolders.Util,
          Cc = Components.classes,
          Cu = Components.utils,
          Ci = Components.interfaces,
          model = QuickFolders.Model,
          {OS} = Cu.import("resource://gre/modules/osfile.jsm", {}),
          ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
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
            localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
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
      util.alert(txt + '\n' + list);
    }
    let repairedTxt = util.getBundleString('qfTreeIconsRepairedCount', '{0} tree icons repaired'),
        invalidTxt = util.getBundleString('qfTreeIconsInvalidCount', '{0} icons missing'),
        msg = repairedTxt.replace('{0}', ctRepaired) + '\n' 
            + invalidTxt.replace('{0}', ctMissing);
    util.slideAlert('repairTreeIcons()', msg);
    // store icons in entry
    if (ctMissing)
      model.store();
  } ,
  
	createMenuItem: function createMenuItem(value, label, className) {
		let menuItem = document.createElement("menuitem");
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
			if (util.isDebug) debugger;
			if (menulist) {
				menulist.value = v;
				// if multiple select, check all boxes
				for (let i=0; i<menulist.itemCount; i++) {
					let it = menulist.getItemAtIndex(i),
							isSelected = (cats.indexOf(it.value)>=0);
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
          if (util.isDebug) debugger;
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
					prefs = QuickFolders.Preferences;
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
    if (multiEnabled && event && event.shiftKey) {
			let selectedCat = cats[0];
			if (currentCats.indexOf(selectedCat)>=0) {
				currentCats.splice(currentCats.indexOf(selectedCat), 1);
				util.logDebugOptional("categories", "Removing Category: " + selectedCat + "...");
				QI.currentActiveCategories = currentCats.join('|');
			}
			else {
				util.logDebugOptional("categories", "Adding Category: " + selectedCat + "...");
				QI.currentActiveCategories =
 				  QI.currentActiveCategories ? (QI.currentActiveCategories + '|' + selectedCat) : selectedCat;
			}
		}
    else {
			let selectedCats = (cats.length>1 && !multiEnabled) ? cats[0] : categoryName;
			util.logDebugOptional("categories","Selecting Categories: " + selectedCats + "...");
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
			  "charcode = " + e.charCode + " = "  + (String.fromCharCode(e.charCode)).toLowerCase() + "\n");
		}
		let isAlt = e.altKey,
		    isCtrl = e.ctrlKey,
		    isShift = e.shiftKey,
        util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        tabmode = QuickFolders.Interface.CurrentTabMode,
        eventTarget = e.target,
        isConsumed = false; 

		if ((tabmode == 'message' || tabmode == 'folder' || tabmode == '3pane')
        &&
        isCtrl && isAlt && dir!='up' && prefs.isUseRebuildShortcut) {
			if ((String.fromCharCode(e.charCode)).toLowerCase() == prefs.RebuildShortcutKey.toLowerCase()) {
				this.updateFolders(true, false);
				try {
					util.logDebugOptional("events", "Shortcuts rebuilt, after pressing "
					    + (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '')
					    + prefs.RebuildShortcutKey);
					util.showStatusMessage('QuickFolders tabs were rebuilt');
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
            tag == 'textbox') // any textbox
            &&
            tag != 'body'   // Thunderbird Message
          )
					||
					(eventTarget.baseURI 
					  &&
					 eventTarget.baseURI.toString().startsWith("chrome://conversations")) // Bug 26202
				)
       )            
    {
      logEvent(eventTarget);
      return;
    }
    
		if (tabmode == 'message' || tabmode == 'folder' || tabmode == '3pane' || tabmode == 'glodaList') {
			logKey(e);
      let QuickMove = QuickFolders.quickMove;
      if (util.hasPremiumLicense(false)) {
        /** SHIFT-J  Jump **/
        if (!isAlt && !isCtrl && isShift && dir!='up' && prefs.isQuickJumpShortcut) {
          if ((String.fromCharCode(e.charCode)).toLowerCase() == prefs.QuickJumpShortcutKey.toLowerCase()) {
            logEvent(eventTarget);
            if (QuickMove.isActive && QuickMove.hasMails) {
              if (!QuickMove.suspended)
                QuickMove.toggleSuspendMove(); // suspend move to jump; also reflect in menu.
              QuickMove.suspended = true; // for safety in case previous UI operation goes wrong
            }
            QuickFolders.Interface.findFolder(true, 'quickJump');
            isConsumed = true;
          }
        }
        
        /** SHIFT-M  Move **/
        /** SHIFT-T  Copy **/
        if (!isAlt && !isCtrl && isShift && dir!='up' && 
            (prefs.isQuickMoveShortcut || prefs.isQuickCopyShortcut)) {
          let theKey = String.fromCharCode(e.charCode).toLowerCase(),
              ismove = (theKey == prefs.QuickMoveShortcutKey.toLowerCase()),
              iscopy = (theKey == prefs.QuickCopyShortcutKey.toLowerCase());
          if (ismove && prefs.isQuickMoveShortcut
              ||
              iscopy && prefs.isQuickCopyShortcut) {
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
            isConsumed = true;
          }
        }
      }
    } // quickMove / quickJump
    
    if (tabmode == 'folder' || tabmode == '3pane') { // only allow these shortcuts on the 3pane window!
      if (!isCtrl && isAlt && (dir != 'up') && prefs.isUseNavigateShortcuts) {
        if (e.keyCode == 37) { // ALT + left
          this.goPreviousQuickFolder();
          isConsumed = true;
        }    

        if (e.keyCode == 39)  { // ALT + right
          this.goNextQuickFolder();
          isConsumed = true;
        }
      }

      if (prefs.isUseKeyboardShortcuts) {
        let shouldBeHandled =
          (!prefs.isUseKeyboardShortcutsCTRL && isAlt)
          ||
          (prefs.isUseKeyboardShortcutsCTRL && isCtrl);

        if (shouldBeHandled) {
          let sFriendly = (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') + e.charCode + " : code=" + e.keyCode,
              shortcut = -1;
          util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
          if (dir == 'up')
            shortcut = e.keyCode-48;
          if (dir == 'down')
            shortcut = e.charCode-48;

          if (shortcut >= 0 && shortcut < 10) {
            isConsumed = true;
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
    if (isConsumed) {
      e.preventDefault();
      e.stopPropagation();
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
          QI = QuickFolders.Interface;
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
        evtText = " [screenX: " + evt.screenX + "   screenY: " + evt.screenY  + "   clientX: " + evt.clientX +  
                  "\n         currentTarget: " + targetText + "]"; 
      }
      catch(ex) { 
        evtText = evt; 
        util.logDebugOptional("interface", ex.toString());
      }
      util.logDebugOptional("interface", 
        "showPopup(\n  btn =" + (button ? button.id : "?") + 
                ", \n  popupId = " + popupId + 
                ", \n  URI = " + (folder ? folder.URI : "?") + 
                ", \n  evt =" + evtText +")" );
      if (folder && !(button && button.id == 'QuickFoldersCurrentFolder')) {
        let entry = QuickFolders.Model.getFolderEntry(folder.URI),
            offset = -1; // ignore this but try to reuse the popup object
        for (let o=0; o<QI.buttonsByOffset.length; o++) {
          if (button == QI.buttonsByOffset[o]) {
            offset = o;
            break;
          }
        }
        if (!popupId) popupId = QI.makePopupId(folder, buttonId);
        evt.stopPropagation();
        util.logDebugOptional("interface", 
          "addPopupSet(" + popupId + ", " + folder.prettyName + ", " + entry + ", o= " + offset + ", " + button.id ? button.id : button);
        QI.addPopupSet(popupId, folder, entry, offset, button, noCommands);
      }
    }
    else
      util.logDebugOptional("interface", "showPopup(" + button.id + ", " + popupId + ", NO EVENT)");   

		let p = button.ownerDocument.getElementById(popupId);
		if (p) {
			document.popupNode = button;
			if (evt && evt.ctrlKey) {
				// only show the QuickFolders Commands menu 
				// need to find first child menu
				let i;
				// see if cloned menu is there already.
				let menupopup = null,
				    nodes  = button.getElementsByTagName('menupopup');

				for (i=0; i<nodes.length; i++) {
					if (nodes[i].id && nodes[i].id === 'quickFoldersCommandsCloned') {
						menupopup = nodes[i];
						break;
					}
				}
				
				if (!menupopup) {
					nodes  = p.getElementsByTagName('menu');
					i=0;
					while (nodes[i].id !== 'quickFoldersCommands')
						i++;
					if (nodes[i].id === 'quickFoldersCommands') {
						nodes = nodes[i].getElementsByTagName('menupopup');
						menupopup = nodes[0].cloneNode(true); // Get first menupop = QuickFolders Commands // 
						menupopup.className = 'QuickFolders-folder-popup';
						menupopup.folder = button.folder;
						menupopup.id = 'quickFoldersCommandsCloned';
						button.appendChild(menupopup); 
					}
				}
				p = menupopup;
			}
			
			util.logDebugOptional("popupmenus", "Open popup menu: " + p.tagName + "\nid: " + p.id + "\nlabel: " + p.label);
			// make it easy to find calling button / label / target element
			p.targetNode = button; 
			
			if (p.openPopup)
				p.openPopup(button,'after_start', 0, -1,true,false,evt);
			else
				p.showPopup(button, 0, -1,"context","bottomleft","topleft"); // deprecated method
		}
		
		// paint bucket pulls color on right-click
		if (button && button.parentNode.id == "QuickFolders-FoldersBox" )
			QI.setPaintButtonColor(QI.getButtonColor(button));
	} ,

	unReadCount:0, 
	totalCount:0, // to pass temp information from getButtonLabel to styleFolderButton
	getButtonLabel: function getButtonLabel(folder, useName, offset, entry) {
		try {
			let isFolderInterface = (typeof folder.getNumUnread!='undefined') && (typeof folder.getTotalMessages!='undefined'),
			    nU = isFolderInterface ? folder.getNumUnread(false) : 0,
          numUnread = (nU==-1) ? 0 : nU, // Postbox root folder fix
			    numUnreadInSubFolders = isFolderInterface ? (folder.getNumUnread(true) - numUnread) : 0,
			    numTotal = isFolderInterface ? folder.getTotalMessages(false) : 0,
			    numTotalInSubFolders = isFolderInterface ? (folder.getTotalMessages(true) - numTotal) : 0,
          ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS,
          isShowTotals = QuickFolders.Preferences.isShowTotalCount,
          isShowUnread = QuickFolders.Preferences.isShowUnreadCount,
			    displayNumbers = [], 
			    label = "",
          s = "";

			this.unReadCount = numUnread + numUnreadInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders ? 1 : 0);
			this.totalCount = numTotal + numTotalInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders ? 1 : 0);

			// offset=-1 for folders tabs that are NOT on the quickFOlder bar (e.g. current Folder Panel)
			if (offset>=0) {
				if(QuickFolders.Preferences.isShowShortcutNumbers) {
					let shortCutNumber = QuickFolders.Preferences.isShowRecentTab ? offset-1 : offset;
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

			label += (useName && useName.length > 0) ? useName : folder.name;
      
      if (isShowTotals && entry && entry.flags) 
        isShowTotals = (entry.flags & ADVANCED_FLAGS.SUPPRESS_COUNTS) ? false : true;
      if (isShowUnread && entry && entry.flags) 
        isShowUnread = (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD) ? false : true;     

			QuickFolders.Util.logDebugOptional("folders",
				  "unread " + (isShowUnread ? "(displayed)" : "(not displayed)") + ": " + numUnread
				+ " - total:" + (isShowTotals ? "(displayed)" : "(not displayed)") + ": " + numTotal);
			if (isShowUnread) {
				if(numUnread > 0)
					s = s+numUnread;
				if(numUnreadInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders)
					s = s+'+'+numUnreadInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (isShowTotals) {
				s = "";
				if(numTotal > 0)
					s=s+numTotal;
				if(numTotalInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders)
					s=s+'+'+numTotalInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (displayNumbers.length) {
				label += " (" + displayNumbers.join(' / ') + ")";
			}
			return label;
		}
		catch(ex) {
			QuickFolders.Util.logToConsole('getButtonLabel:' + ex);
			return "";
		}
	} ,

  makePopupId: function makePopupId(folder, buttonId) {
    return 'QuickFolders-folder-popup-' + ((buttonId!=null) ? buttonId : folder.URI);
  },
  
	addFolderButton: function addFolderButton(folder, entry, offset, theButton, buttonId, fillStyle, isFirst, isMinimal) {
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null,		
		    tabIcon = (entry && entry.icon) ? entry.icon : '',
        useName = (entry && entry.name) ? entry.name : '',
		    label = this.getButtonLabel(folder, useName, offset, entry),
        util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        FLAGS = util.FolderFlags;
    
    if (!folder) {
      util.logToConsole('Error in addFolderButton: ' + 'folder parameter is empty!\n'
                        + 'Entry: ' + (entry ? entry.name : ' invalid entry'));
      return null;
    }
    try {
			let isMsgFolder = (typeof folder.getStringProperty != 'undefined');
      if (!tabIcon && isMsgFolder && folder.getStringProperty('folderIcon')) {
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
		let button = (theButton) ? theButton : document.createElement("toolbarbutton"); // create the button!
		button.setAttribute("label", label);
		//button.setAttribute("class",ToolbarStyle); // was toolbar-height!

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="",
		    sDisplayIcons = prefs.isShowToolbarIcons ? ' icon': '',
        // if the tab is colored, use the new palette setting "ColoredTab"
        // if it is uncolored use the old "InActiveTab"
		    paletteClass = (tabColor!='0') ? this.getPaletteClass('ColoredTab') : this.getPaletteClass('InactiveTab'); 
    if (entry && entry.customPalette)
      paletteClass = this.getPaletteClassToken(entry.customPalette);

		// use folder flags instead!
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
		else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_VIRTUAL)
			specialFolderType="virtual" + sDisplayIcons; // all other virtual folders (except smart which were alreadyhandled above)
		else if (folder.flags == FLAGS.MSG_FOLDER_FLAG_ARCHIVE)
			specialFolderType="archives" + sDisplayIcons;
		else {
			if (sDisplayIcons.trim)
				specialFolderType=sDisplayIcons.trim();
			else
				specialFolderType=sDisplayIcons;
		}

		specialFolderType += paletteClass;
    let gotNew = folder.hasNewMessages;
		// this needs to be done also when a minimal Update is done (button passed in)
		this.styleFolderButton(
			button, this.unReadCount, this.totalCount, specialFolderType, tabColor, 
			gotNew, tabIcon, entry
		);

		button.folder = folder;

		if (null == theButton || (null == button.getAttribute("oncommand"))) {
			button.setAttribute("tooltiptext", util.getFolderTooltip(folder));
			this.setEventAttribute(button, "oncommand",'QuickFolders.Interface.onButtonClick(event.target, event, true);');
		}

    /**  Menu Stuff  **/
    
		let popupId;
    if (!isMinimal) {
      popupId = this.makePopupId(folder, buttonId);
      button.setAttribute('popupId', popupId);  // let's store popupId in the button!
      button.setAttribute('context',''); // overwrites the parent context menu
      this.setEventAttribute(button, "oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
      if (buttonId == 'QuickFoldersCurrentFolder') {
        this.setEventAttribute(button, "onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
        this.setEventAttribute(button, "ondragstart","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
        this.setEventAttribute(button, "ondragend","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
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
			  let sep = document.createElement("toolbarseparator");
			  this.FoldersBox.appendChild(sep);
			}
			this.FoldersBox.appendChild(button);
			this.setEventAttribute(button, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
			this.setEventAttribute(button, "ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
			this.setEventAttribute(button, "ondrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("flex",100);
		}
    // we do this after appendChild, because labelElement needs to be generated in DOM
    this.addCustomStyles(button, entry);

    if (!isMinimal) {
      // popupset is NOT re-done on minimal update - save time!
      this.addPopupSet(popupId, folder, entry, offset, button);
    }

		if (!theButton) {
			// AG add dragging of buttons
			this.setEventAttribute(button, "ondragstart","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			this.setEventAttribute(button, "ondragend","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
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
 	* @numUnread: number of unread emails
 	* @numTotal: numTotal of total emails
 	* @specialStyle: if this is a special folder, such as inbox, virtual etc.
 	* @tabColor: palette index; 0=DEFAULT
 	* @gotNew:   new email has arrived (special inset style)
	* @icon: icon or '' or null
  * @entry: the entry from the model array - use for advanced (tab specific) properties
 	*/
	styleFolderButton: function styleFolderButton(button, numUnread, numTotal, specialStyle, tabColor, gotNew, icon, entry) {
		//reset style!
		let cssClass = '',
        ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS;
		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.getAttribute("label")
			+ ", " + numUnread + ", " + numTotal + ", " + specialStyle + ")");

		if (numUnread > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold) {
      if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD)) 
        { ; }
      else
        cssClass += " has-unread";
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
			cssClass += " col0"
    }

		if (cssClass.trim)
			button.className = cssClass.trim();
		else
			button.className = cssClass;
			
    this.applyIcon(button, icon);
	} ,
  
  addCustomStyles: function addCustomStyles(button, entry) {
    function getLabel(button) {
        let anonChildren = document.getAnonymousNodes(button);
        if (!anonChildren) return null;
        for (let i=0; i<anonChildren.length; i++) {
          if (anonChildren[i].className == 'toolbarbutton-text')
            return anonChildren[i];
        }
        return null;
    }
    let ADVANCED_FLAGS = QuickFolders.AdvancedTab.ADVANCED_FLAGS;
    // custom colors
    if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.CUSTOM_CSS)) {
      try {
        button.style.setProperty('background-image', entry.cssBack, ''); 
        let l = getLabel(button);
        if (l) 
          l.style.setProperty('color', entry.cssColor, '');  
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
		let button = document.createElement("toolbarbutton"),
		    image = '',
		    lbl = ''; // for testing
		switch (SpecialId) {
			case 'Thread':
				image = "url('chrome://quickfolders/content/thread.png')"; // "thread.png" ; //
				lbl = ''; // Thread
				break;
			case 'Trash':
				image = "url('chrome://quickfolders/skin/ico/folder-trash-gnome-qf.png')";
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

		this.setEventAttribute(button, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
		this.setEventAttribute(button, "ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
		this.setEventAttribute(button, "ondrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
		this.SpecialToolbar.appendChild(button);
	} ,

	onButtonClick: function onButtonClick(button, evt, isMouseClick) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface;
		util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);
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
					util.logDebugOptional("mouseclicks","onButtonClick - ctrlKey was pressed");
					this.openFolderInNewTab(button.folder);
				}
			}
		}
		catch (ex) { util.logToConsole(ex); };
		if (button.folder) {
			// [Bug 26190] - already selected = drill down on second click
			if (button.folder === util.CurrentFolder) {
				let popupId = button.getAttribute('popupId');
				// show only subfolders, without commands!
				QI.showPopup(button, popupId, evt, true);
			}
			else {
				// interface speed hack: mark the button as selected right away!
				this.onTabSelected(button);
				QuickFolders_MySelectFolder(button.folder.URI);
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
					QuickFolders.tabContainer.selectedIndex = tabmail.tabContainer.childNodes.length - 1;
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
        folder = util.getPopupNode(element).folder,
		    msg = folder.name + " tab removed from QuickFolders";
    util.logDebugOptional("interface", "QuickFolders.Interface.onRemoveBookmark()");
		QuickFolders.Model.removeFolder(folder.URI, true);
		// this.updateFolders(true); already done!
		try { util.showStatusMessage(msg); } catch(e) {;};
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
    
    let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    
		// callback, careful, no "this"
    let fpCallback = function fpCallback_done(aResult) {
      if (aResult == nsIFilePicker.returnOK) {
        try {
          if (fp.file) {
					  let file = fp.file.parent.QueryInterface(Ci.nsILocalFile);
						//localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
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
		let localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
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

		let newName = window.prompt(this.getUIstring("qfNewName","Enter a new name for the bookmark")+"\n"+ folderButton.folder.URI, sOldName); // replace folder.name!
		if(newName) {
			QuickFolders.Model.renameFolder(folderButton.folder.URI, newName);
		}
	} ,

  onAdvancedProperties: function onAdvancedProperties(evt, element) {
    let util = QuickFolders.Util,
        button = util.getPopupNode(element),
        folder = button.folder,
        entry = QuickFolders.Model.getFolderEntry(folder.URI),
        x = button.boxObject.screenX,
        y = button.boxObject.screenY + button.boxObject.height;
    // attach to bottom of the Tab (like a popup menu)
    setTimeout(function() {
			util.logDebug('onAdvancedProperties(evt)\n screenX = ' + x +'\n screenY = ' + y);
			util.popupProFeature("advancedTabProperties");}
		);
		
    // the window may correct its x position if cropped by screen's right edge
    let win = window.openDialog(
      'chrome://quickfolders/content/quickfolders-advanced-tab-props.xul',
      'quickfilters-advanced','alwaysRaised, titlebar=no,chrome,close=no,top=' + y +',left=' + x, 
      folder, entry); // 
    win.focus();
  } ,
  
	compactFolder: function compactFolder(folder, command) {
		let s1 = folder.sizeOnDisk;
		QuickFolders.compactLastFolderSize = s1;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = command;

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

	onMarkAllRead: function onMarkAllRead(element,evt) {
    let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    evt.stopPropagation();
    util.logDebugOptional("interface", "QuickFolders.Interface.onMarkAllRead()");
		try {
			let f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
			if (util.Application == 'Postbox')
				f.markAllMessagesRead();
			else
				f.markAllMessagesRead(msgWindow);
		}
		catch(e) {
			util.logToConsole("QuickFolders.Interface.onMarkAllRead " + e);
		}
	} ,

	onDeleteFolder: function onDeleteFolder(element) {
		let util = QuickFolders.Util,
        folderButton = util.getPopupNode(element),
		    uri = folderButton.folder.URI,
		    result = null;
    util.logDebugOptional("interface", "QuickFolders.Interface.onDeleteFolder()");
    
		if ((util.Application == 'Postbox') || (util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folderButton.folder.URI);
			MsgDeleteFolder();
		}
		else
			this.globalTreeController.deleteFolder(folderButton.folder);

		// if folder is gone, delete quickFolder
		if (!QuickFolders.Model.getMsgFolderFromUri(uri, false))
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
		if (util.Application == 'Postbox') { 
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
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onFolderProperties()");
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
			if (aPathOrUrl.substring(0,7) == "file://") {
				// if this is a URL, get the file from that
				let ioSvc = Cc["@mozilla.org/network/io-service;1"].
										getService(Ci.nsIIOService);

				// XXX it's possible that using a null char-set here is bad
				const fileUrl = ioSvc.newURI(aPathOrUrl, null, null).
												QueryInterface(Ci.nsIFileURL);
				return fileUrl.file.clone().QueryInterface(Ci.nsILocalFile);
			} else {
				// if it's a pathname, create the nsILocalFile directly
				let f = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
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
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
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
			let parent = f.parent.QueryInterface(Ci.nsILocalFile);
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
				Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
						.getService(
							Components.interfaces.nsIMsgFolderNotificationService);

			notifier.notifyItemEvent(folder, "FolderReindexTriggered", null);
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
				Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("failed to remove offline store: " + ex);
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
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onRepairFolder()");
		this.rebuildSummary(folder);
	} ,

	onNewFolder: function onNewFolder(element,evt) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    if (evt) evt.stopPropagation();
    util.logDebugOptional("interface", "QuickFolders.Interface.onNewFolder()");
		if ((util.Application == 'Postbox') || (util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgNewFolder(NewFolder);
		}
		else
			this.globalTreeController.newFolder(folder);
	},
	
	// * function for creating a new folder under a given parent
	// see http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#2359
	// currently not used in Postbox build because it requires Tasc.async
	onCreateInstantFolder: function onCreateInstantFolder(parent, folderName) {
		const util = QuickFolders.Util,
					QI = QuickFolders.Interface,
		      Ci = Components.interfaces,
					Cc = Components.classes,
          prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
					isQuickMove = (QuickFolders.quickMove.isActive);;
    util.logDebugOptional('interface', 'QuickFolders.Interface.onCreateInstantFolder(' + parent.prettyName + ', ' + folderName + ')');
    let title = util.getBundleString('qf.prompt.newFolder.title', "New Folder"),
        text = util.getBundleString('qf.prompt.newFolder.newChildName', "Enter name for new child folder under {0}") + ":",
        input = {value: folderName},
        check = {value: false},
        result = prompts.prompt(window, title, text.replace('{0}', parent.prettyName), input, null, check); 
    if (!result) return;	

    if (!parent.canCreateSubfolders) throw ("cannot create a subfolder for: " + parent.prettyName);
		let newFolderUri = parent.URI + "/" + encodeURI(input.value);
				
		// this asynchronous function is in quickfolders-shim as Postbox doesn't support the new syntax
		util.getOrCreateFolder(
		  newFolderUri, 
		  util.FolderFlags.MSG_FOLDER_FLAG_MAIL).then(  // avoiding nsMsgFolderFlags for postbox...
			  function createFolderCallback() {
					// move emails or jump to folder after creation
					if (isQuickMove) {
						QuickFolders.quickMove.execute(newFolderUri); 
					}
					else {
						QuickFolders_MySelectFolder(newFolderUri, true);
					}
					QI.findFolder(false);
					QI.hideFindPopup();
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
	
	buildPaletteMenu: function buildPaletteMenu(currentColor, existingPopupMenu) {
		let util = QuickFolders.Util,
        logLevel = (typeof existingPopupMenu === 'undefined') ? "interface.tabs" : "interface",
        popupTitle = existingPopupMenu ? existingPopupMenu.id : 'none';
		util.logDebugOptional(
			logLevel, 
			"buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + popupTitle + ")");
		let menuColorPopup = existingPopupMenu ? existingPopupMenu : document.createElement("menupopup");
		try {
			// create color pick items
			for (let jCol=0; jCol<=20;jCol++) {
				let menuitem = document.createElement('menuitem');
				menuitem.className='color menuitem-iconic';
				menuitem.setAttribute("tag","qfColor"+jCol);
				if (jCol) {
					menuitem.setAttribute('label',this.getUIstring("qfMenuColor", "Color") + " "+ jCol);
					//menuitem.setAttribute("style","background-image:url('cols/tabcol-" + jCol + ".png')!important;");
					if (currentColor == jCol)
						menuitem.selected = true;
				}
				else
					menuitem.setAttribute('label',this.getUIstring("qfMenuTabColorNone", "No Color!"));
				this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')");
				menuColorPopup.appendChild(menuitem);
			}
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
	appendMailFolderCommands: function appendMailFolderCommands(MailCommands, folder, isRootMenu, button, menupopup) {
		let topShortCuts = 0,
		    util = QuickFolders.Util,
		    prefs = QuickFolders.Preferences,
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
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-getMessages");
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
			menuitem.setAttribute('label',this.getUIstring("qfGetMail", "Get Messages..."));
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
              menuitem = document.createElement('menuitem');
              menuitem.className='mailCmd menuitem-iconic';
              menuitem.setAttribute("id","folderPaneContext-downloadAll");
              this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDownloadAll(this);");
              let downloadLabel = this.getUIstring("qfDownloadAll", "Download Now") + " [" + type + "]";
              menuitem.setAttribute('label', downloadLabel);
              // MailCommands.appendChild(menuitem);
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
        !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK)
        &&
        prefs.getBoolPref("folderMenu.markAllRead"))
        // && folder.getNumUnread(false)>0
      {
        menuitem = this.createMenuItem_MarkAllRead((folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)==true);
        menupopup.appendChild(menuitem);
        topShortCuts ++ ;
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
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-properties");
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEditVirtualFolder(this);");
			menuitem.setAttribute('label',this.getUIstring("qfEditVirtual", "Search Properties..."));
			menuitem.setAttribute('accesskey',this.getUIstring("qfEditVirtualAccess", "S"));
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++ ;
		}

		// CompactFolder
		if (folder.canCompact) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-compact");
			menuitem.setAttribute("tag","qfCompact");
			menuitem.setAttribute('label',this.getUIstring("qfCompactFolder", "Compact Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfCompactFolderAccess","C"));
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onCompactFolder(this,'compactFolder')");
			MailCommands.appendChild(menuitem);
		}

		// ===================================
		if (topShortCuts>0)
			MailCommands.appendChild(document.createElement('menuseparator'));

		// NewFolder
		if (folder.canCreateSubfolders) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-new");
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onNewFolder(this,event);");
			menuitem.setAttribute('label',this.getUIstring("qfNewFolder","New Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfNewFolderAccess","N"));
			MailCommands.appendChild(menuitem);
		}

		// DeleteFolder
		try {
			if (folder.deletable) {
				menuitem = document.createElement('menuitem');
				menuitem.className='mailCmd menuitem-iconic';
				menuitem.setAttribute("id","folderPaneContext-remove");
				this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDeleteFolder(this);");
				menuitem.setAttribute('label',this.getUIstring("qfDeleteFolder", "Delete Folder"));
				menuitem.setAttribute("accesskey",this.getUIstring("qfDeleteFolderAccess","D"));
				MailCommands.appendChild(menuitem);
			}
		} catch(e) {;}

		// RenameFolder
		if (folder.canRename) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-rename");
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onRenameFolder(this);");
			menuitem.setAttribute('label',this.getUIstring("qfRenameFolder", "Rename Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfRenameFolderAccess","R"));
			MailCommands.appendChild(menuitem);
			MailCommands.appendChild(document.createElement('menuseparator'));
		}

		// Repair Folder
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","quickFoldersFolderRepair");
		menuitem.setAttribute("tag","qfFolderRepair");
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onRepairFolder(this);");
		menuitem.setAttribute('label',this.getUIstring("qfFolderRepair","Repair Folder..."));
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderRepairAccess","F"));
		MailCommands.appendChild(menuitem);

		// Search Messages
		let srchMenu = util.getMail3PaneWindow().document.getElementById("folderPaneContext-searchMessages")
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","quickFolders-folderSearchMessages");
		menuitem.setAttribute("tag","qfFolderSearch");
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onSearchMessages(this);");
		menuitem.setAttribute('label',srchMenu.getAttribute('label'));
		menuitem.setAttribute("accesskey",srchMenu.getAttribute('accesskey'));
		MailCommands.appendChild(menuitem);

		// Folder Properties
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-properties");
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onFolderProperties(this);");
		menuitem.setAttribute('label',this.getUIstring("qfFolderProperties","Folder Properties..."));
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderPropertiesAccess","P"));
		MailCommands.appendChild(menuitem);
		
		// Open in File System
		MailCommands.appendChild(document.createElement('menuseparator'));
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","quickFolders-openFolderLocation");
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onFolderOpenLocation(this);");
		menuitem.setAttribute('label',this.getUIstring("qfFolderOpenLocation","Explore Folder Location..."));
		MailCommands.appendChild(menuitem);
		
	} ,
	
	// noCommands suppress all command menu items + submenus
	addPopupSet: function addPopupSet(popupId, folder, entry, offset, button, noCommands) {
		const prefs = QuickFolders.Preferences,
          util = QuickFolders.Util;
		let menupopup = document.createElement('menupopup'),
		    menuitem,
		    QuickFolderCmdMenu = null,
				xp = document.getElementById(popupId);
    if (!entry)
      entry = QuickFolders.Model.getFolderEntry(folder.URI);
    if (xp && xp.parentNode)    
      xp.parentNode.removeChild(xp);
    
		menupopup.setAttribute('id', popupId);
		menupopup.setAttribute('position', 'after_start'); //
		menupopup.className = 'QuickFolders-folder-popup';
		menupopup.folder = folder;

		util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name);

		if (button.id != "QuickFoldersCurrentFolder" && !noCommands) {

			/***  QUICKFOLDERS COMMANDS   ***/
			let QFcommandPopup = document.createElement('menupopup');
			QFcommandPopup.className = 'QuickFolders-folder-popup';

			// tab colors menu
			// we should clone this!
			let colorMenu = document.createElement('menu');
			colorMenu.setAttribute("tag",'qfTabColorMenu');
			colorMenu.setAttribute("label", this.getUIstring("qfMenuTabColorPopup", "Tab Color") );
			colorMenu.className = 'QuickFolders-folder-popup';
			colorMenu.setAttribute("class","menu-iconic");

			util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

      if (entry) {
        // SelectColor
        util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "...");
        let menuColorPopup = this.buildPaletteMenu(entry.tabColor ? entry.tabColor : 0);
        colorMenu.appendChild(menuColorPopup);
      }
		  this.initElementPaletteClass(QFcommandPopup, button);

      if (entry) {
        // append color menu to QFcommandPopup
        QFcommandPopup.appendChild(colorMenu);

        // SelectCategory
        menuitem = document.createElement('menuitem');
        menuitem.className='cmd menuitem-iconic';
        menuitem.setAttribute('tag','qfCategory');
        menuitem.setAttribute('label',this.getUIstring('qfSetCategory', 'Set Bookmark Category...'));
        menuitem.setAttribute('accesskey',this.getUIstring('qfSetCategoryA', 'C'));

        this.setEventAttribute(menuitem, 
          'oncommand',
          'QuickFolders.Interface.configureCategory_FromMenu(this)');
        QFcommandPopup.appendChild(menuitem);

        if (entry.category) {
          // RemoveFromCategory
          menuitem = document.createElement('menuitem');
          menuitem.className='cmd menuitem-iconic';
          menuitem.setAttribute('tag','qfRemoveCategory');
          menuitem.setAttribute('label',this.getUIstring('qfRemoveCategory', 'Remove from Category'));

          this.setEventAttribute(menuitem, 
            'oncommand',
            'QuickFolders.Interface.removeFromCategory(this)');
          QFcommandPopup.appendChild(menuitem);
        }

        // DeleteQuickFolder
        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('tag','qfRemove');
        menuitem.className='cmd menuitem-iconic';

        menuitem.setAttribute('label',this.getUIstring('qfRemoveBookmark', 'Remove bookmark'));
        menuitem.setAttribute('accesskey',this.getUIstring('qfRemoveBookmarkAccess','R'));
        this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRemoveBookmark(this)');
        QFcommandPopup.appendChild(menuitem);

        // RenameQuickFolder
        menuitem = document.createElement('menuitem');
        menuitem.className='cmd menuitem-iconic';
        menuitem.setAttribute('tag','qfRename');
        menuitem.setAttribute('label',this.getUIstring('qfRenameBookmark','Rename Bookmark'));
        menuitem.setAttribute('accesskey',this.getUIstring('qfRenameBookmarkAccess','R'));
        this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRenameBookmark(this)');
        QFcommandPopup.appendChild(menuitem);
        
        if (prefs.getBoolPref("commandMenu.lineBreak")) {
          menuitem = document.createElement('menuitem');
          menuitem.className='cmd menuitem-iconic';
          menuitem.setAttribute('tag', entry.breakBefore ? 'qfBreakDel' : 'qfBreak');
          let brString = entry.breakBefore ? this.getUIstring('qfRemoveLineBreak', 'Remove Line Break!') : this.getUIstring('qfInsertLineBreak', 'Insert Line Break!')
          menuitem.setAttribute('label', brString);
          this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onBreakToggle(this)');
          QFcommandPopup.appendChild(menuitem);
        }

        if (prefs.getBoolPref("commandMenu.separator")) {
          menuitem = document.createElement('menuitem');
          menuitem.className='cmd menuitem-iconic';
          menuitem.setAttribute('tag', entry.separatorBefore ? 'qfSeparatorDel' : 'qfSeparator');
          let lbString = entry.separatorBefore ? this.getUIstring('qfRemoveSeparator', 'Remove Separator!') : this.getUIstring('qfInsertSeparator', 'Insert Separator!')
          menuitem.setAttribute('label', lbString);
          this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onSeparatorToggle(this)');
          QFcommandPopup.appendChild(menuitem);
        }
        
        let menuItemToClone;

        QFcommandPopup.appendChild(document.createElement('menuseparator'));

        // moved icon stuff down to bottom
        if (prefs.getBoolPref("commandMenu.icon")) {
          menuitem = document.createElement('menuitem');
          menuitem.className='cmd menuitem-iconic';
          menuitem.setAttribute('tag', 'qfIconAdd');
          menuitem.setAttribute('label',this.getUIstring('qfSelectIcon','Customize Icon...'));
          this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onSelectIcon(this)');
          QFcommandPopup.appendChild(menuitem);
          
          menuitem = document.createElement('menuitem');
          menuitem.className='cmd menuitem-iconic';
          menuitem.setAttribute('tag', 'qfIconRemove');
          menuitem.setAttribute('label',this.getUIstring('qfRemoveIcon','Remove Customized Icon...'));
          this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onRemoveIcon(this)');
          if (!entry.icon)
            menuitem.collapsed = true;
          QFcommandPopup.appendChild(menuitem);
          
        }
        
        menuitem = document.createElement('menuitem');
        menuitem.className='cmd menuitem-iconic';
        menuitem.setAttribute('tag', 'qfTabAdvanced');
        menuitem.setAttribute('label',this.getUIstring('qfTabAdvancedOptions', 'Advanced Properties...'));
        menuitem.type = 'checkbox';
        if (entry.flags || entry.toAddress || entry.fromIdentity) {
          menuitem.setAttribute('checked', 'true');
        }
        else
          menuitem.setAttribute('checked', 'false');
        
        // we want the coordinates, therefore using click event:
        this.setEventAttribute(menuitem, 'onclick','QuickFolders.Interface.onAdvancedProperties(event, this)');
        QFcommandPopup.appendChild(menuitem);
        
        
        // Options, Support and Help
        if (prefs.getBoolPref("commandMenu.options")
           ||
           prefs.getBoolPref("commandMenu.support")
           ||
           prefs.getBoolPref("commandMenu.help")
           ) {
          // --------------------
          QFcommandPopup.appendChild(document.createElement('menuseparator'));
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

        QuickFolderCmdMenu = document.createElement('menu');
        QuickFolderCmdMenu.setAttribute('id','quickFoldersCommands');
        QuickFolderCmdMenu.setAttribute('label',this.getUIstring("qfCommandPopup",'QuickFolders Commands'));
        QuickFolderCmdMenu.setAttribute("accesskey",this.getUIstring("qfCommandAccess","Q"));
        QuickFolderCmdMenu.className='cmd menu-iconic';
        QuickFolderCmdMenu.appendChild(QFcommandPopup);

      }
    }

		let fi = folder.QueryInterface(Components.interfaces.nsIMsgFolder),
        MailCommands, isRootMenu;

		/* In certain cases, let's append mail folder commands to the root menu */
		if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) {
			// newsgroups have no subfolders anyway
			MailCommands = menupopup;
			isRootMenu = true;
		}
		else {
			MailCommands = document.createElement('menupopup');
			MailCommands.className = 'QuickFolders-folder-popup mailCmd menu-iconic';
			isRootMenu = false;
		}


		if (!noCommands) {
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
				menuitem.className='cmd menuitem-iconic';
				menuitem.setAttribute("tag", "openNewTab");
				let cmd = function () { QuickFolders.Interface.openFolderInNewTab(fi); };
				menuitem.addEventListener('command', cmd, true);
				
				menupopup.appendChild(menuitem);
				topShortCuts ++ ;
			}

			if (topShortCuts>0 && fi.hasSubFolders) // separator only if necessary
				menupopup.appendChild(document.createElement('menuseparator'));

			// 2. QUICKFOLDER COMMANDS
			if (QuickFolderCmdMenu)
				menupopup.appendChild(QuickFolderCmdMenu);
			
			// 3. APPEND MAIL FOLDER COMMANDS
			if (menupopup != MailCommands) {
				// Append the Mail Folder Context Menu...
				let MailFolderCmdMenu = document.createElement('menu');
				MailFolderCmdMenu.className='mailCmd menu-iconic';
				MailFolderCmdMenu.setAttribute('id','quickFoldersMailFolderCommands');
				MailFolderCmdMenu.setAttribute('label',this.getUIstring("qfFolderPopup",'Mail Folder Commands'));
				MailFolderCmdMenu.setAttribute("accesskey",this.getUIstring("qfFolderAccess","F"));

				MailFolderCmdMenu.appendChild(MailCommands);
				menupopup.appendChild(MailFolderCmdMenu);
			}
		}

		//moved this out of addSubFoldersPopup for recursive menus
		if (fi.hasSubFolders) {
			util.logDebugOptional("popupmenus","Creating SubFolder Menu for " + folder.name + "...");
			if (!noCommands)
				menupopup.appendChild(document.createElement('menuseparator'));
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
		if (button.firstChild)
			button.removeChild(button.firstChild);
		// we might have created an empty popup so only append it if it has child Nodes
		if (menupopup.childNodes && menupopup.childNodes.length) {
			button.appendChild(menupopup); 
		}
	} ,
	
	// append a button with mail folder commands (onclick)
	showCurrentFolderMailContextMenu: function showCurrentFolderMailContextMenu(button) {
		let menupopup = document.createElement('menupopup'),
        util = QuickFolders.Util,
		    folder = util.CurrentFolder;
		menupopup.setAttribute('position','after_start'); //
		menupopup.id = 'QuickFolders-CurrentMailFolderCommandsPopup';
		
		menupopup.className = 'QuickFolders-folder-popup';
		
		button.folder = folder;

		util.logDebugOptional("popupmenus","Creating Popup Set for Mail Commands - " + folder.name);
		menupopup.folder = folder;
		
		if (button.firstChild)
			button.removeChild(button.firstChild);
		button.appendChild(menupopup); 

		QuickFolders.Interface.appendMailFolderCommands(menupopup, folder, true, button, null);

		QuickFolders.Interface.showPopup(button, menupopup.id, null);
	} ,

	createMenuItem_DeleteJunk: function createMenuItem_DeleteJunk() {
		let menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","deleteJunk");
		menuitem.setAttribute('label',this.getUIstring("qfDeleteJunk", "Purge Junk"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDeleteJunk(this);");
		return menuitem;
	} ,

	createMenuItem_EmptyJunk: function createMenuItem_EmptyJunk() {
		let menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyJunk");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyJunk", "Empty Junk"));
		menuitem.setAttribute('accesskey',this.getUIstring("qfEmptyJunkAccess", "Empty Junk"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyJunk(this);");
		return menuitem;
	} ,
	
	createMenuItem_GetMail: function createMenuItem_GetMail(folder) {
    let server = '?';
		try {
			// find out the server name
			// let's clone it ?
			let getMailMenuItem= document.createElement('menuitem');
			server = folder.server;
			getMailMenuItem.id="folderPaneContext-getMessages"; // for native styling
			getMailMenuItem.folder=folder;
			getMailMenuItem.setAttribute('label', this.getUIstring("qfGetMail", "Get Messages..."));
			getMailMenuItem.setAttribute('accesskey', this.getUIstring("qfGetMailAccess", "G"));
			
			// use parent folder URI as each starting point
			this.setEventAttribute(getMailMenuItem, "oncommand","QuickFolders.Interface.onGetMessages(this)"); 

			return getMailMenuItem;
			
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception in createMenuItem_GetMail (Get Mail Command for Inbox): ' + server, ex); 
			return null;
		}		
	} ,

	createMenuItem_EmptyTrash: function createMenuItem_EmptyTrash() {
		let menuitem = document.createElement('menuitem');
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyTrash");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyTrash", "Empty Trash"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfEmptyTrashAccess","T"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyTrash(this);event.stopPropagation();");
		return menuitem;
	} ,

	createMenuItem_MarkAllRead: function createMenuItem_MarkAllRead(disabled) {
		let menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-markMailFolderAllRead");
		menuitem.setAttribute('label',this.getUIstring("qfMarkAllRead","Mark Folder Read"));
		menuitem.setAttribute('accesskey',this.getUIstring("qfMarkAllReadAccess","M"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onMarkAllRead(this, event);");
		if (disabled)
			menuitem.setAttribute("disabled", true);
		return menuitem;
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
			function(evt) { QuickFolders.Interface.onSelectParentFolder(url, evt); }, false);
	} ,
	
	addDragToNewFolderItem: function addDragToNewFolderItem(popupMenu, folder) {
    let util = QuickFolders.Util;
		try {
      if (typeof folder.server === 'undefined') return;
      
			util.logDebugOptional("dragToNew","addDragToNewFolderItem	" + folder.prettiestName
				+ "\ncanCreateSubfolders = " + folder.canCreateSubfolders
				+ "\nserver.type = " + folder.server.type);
			if (!folder.canCreateSubfolders) return;
			let server=folder.server.QueryInterface(Components.interfaces.nsIMsgIncomingServer);// check server.type!!
			switch(server.type) {
				case 'pop3':
					if (!QuickFolders.Preferences.getBoolPref("dragToCreateFolder.pop3"))
						return;
					break;
				case 'imap':
					if (!QuickFolders.Preferences.getBoolPref("dragToCreateFolder.imap"))
						return;
					break;
				case 'none': // allow all local folders!
					if (!QuickFolders.Preferences.getBoolPref("dragToCreateFolder.local"))
						return;
					break;
				default:
					if (!QuickFolders.Preferences.getBoolPref("dragToCreateFolder." + server.type)) {
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
					if (folder.hasSubFolders)
						popupMenu.appendChild(document.createElement('menuseparator'));
					createFolderMenuItem.id=""; // delete existing menu
					createFolderMenuItem.id="folderPaneContext-new"; // for styling!
					createFolderMenuItem.folder=folder;
					createFolderMenuItem.setAttribute("class","menuitem-iconic");
					
					// use parent folder URI as each starting point
					this.setEventAttribute(createFolderMenuItem, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(createFolderMenuItem, "ondrop","nsDragAndDrop.drop(event,QuickFolders.popupDragObserver);");  // only case where we use the dedicated observer of the popup!

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
					util = QuickFolders.Util;
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
				subfolder = subfolders.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder);
			else {
				if (subfolders.hasMoreElements())
					subfolder = subfolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
				else {
					done=true;
					break;
				}
			}

			try {
				this.debugPopupItems++;
				let menuitem = document.createElement('menuitem'),
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
						? "url('chrome://quickfolders/skin/ico/folder-trash-gnome-qf.png')"
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


				if (numUnreadInSubFolders+numUnread>0) {
					if(numUnreadInSubFolders > 0 && prefs.isShowCountInSubFolders)
						sCount += '+'+numUnreadInSubFolders+'';
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
				if (! (subfolder.hasSubFolders && prefs.isShowRecursiveFolders))
					this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "',event)");

				if (true) {
					// AG added "empty" click event to avoid bubbling to parent menu!
					menuitem.addEventListener("click", function(evt) { evt.stopPropagation(); }, false);
				}

				util.logDebugOptional("popupmenus.items","add oncommand event for menuitem " + menuitem.getAttribute("label") + " onSelectSubFolder(" + subfolder.URI+ ")");

				menuitem.folder = subfolder;
				this.setEventAttribute(menuitem, "ondragenter","event.preventDefault();"); // fix layout issues...
				this.setEventAttribute(menuitem, "ondragover","nsDragAndDrop.dragOver(event,QuickFolders.popupDragObserver)"); // okay
				this.setEventAttribute(menuitem, "ondrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
				// this.setEventAttribute(menuitem, "ondragend","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

				if (forceAlphaSort) {
					// alpha sorting by starting from end of menu up to separator!
					let c = popupMenu.childNodes.length-1, //count of last menu item
					    added = false,
					    sNewName = killDiacritics(subfolder.name);
					// >=1 exclude first item (name of container folder) - fixes [Bug 22901] - maybe insert separator as well
					// >=0 undo this change - fixes [Bug 21317]
					for (;c>=0 && popupMenu.childNodes[c].hasAttribute('label');c--) {
						if (sNewName > killDiacritics(popupMenu.childNodes[c].getAttribute('label')))
						{
							if (c+1 == popupMenu.childNodes.length)
								popupMenu.appendChild(menuitem);
							else
								popupMenu.insertBefore(menuitem,popupMenu.childNodes[c+1]);
							added=true;
							break;
						}
					}
					if (!added) { // nothing with a label was found? then this must be the first folder item in the menu
						if (c+1 >= popupMenu.childNodes.length)
							popupMenu.appendChild(menuitem);
						else
							popupMenu.insertBefore(menuitem,popupMenu.childNodes[c+1]);
					}
				} // end alphanumeric sorting
				else
					popupMenu.appendChild(menuitem);


				if (subfolder.hasSubFolders && prefs.isShowRecursiveFolders)
				{
					this.debugPopupItems++;
					let subMenu = document.createElement('menu');
					subMenu.setAttribute("label", menuLabel + sCount);
					subMenu.className = 'QuickFolders-folder-popup menu-iconic' + ((numUnreadInSubFolders+numUnread>0) ? ' hasUnread' : '');
					if (subfolder.hasNewMessages)
						subMenu.setAttribute("biffState-NewMail","true");

					subMenu.folder = subfolder;
					try {
						// [Bug 26157] is folder deleted? use different icon!
						let iconURL = subfolder.parent && (subfolder.parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
						  ? "url('chrome://quickfolders/skin/ico/folder-trash-gnome-qf.png')"
						  :  ((typeof subfolder.getStringProperty != 'undefined')? subfolder.getStringProperty("iconURL") : null);
						if (iconURL) {
							subMenu.style.setProperty('list-style-image', iconURL, '');
						}
					} 
					catch(ex) {;}

					this.setEventAttribute(subMenu, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(subMenu, "ondrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
					this.setEventAttribute(subMenu, "ondragend","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

					// 11/08/2010 - had forgotten the possibility of _opening_ the folder popup node's folder!! :)
					//subMenu.allowEvents=true;
					// oncommand did not work
					util.logDebugOptional("popupmenus.items","add click listener for subMenu " + subMenu.getAttribute("label") + " onSelectParentFolder(" + subfolder.URI+ ")");

					//let uriCopy = subfolder.URI; // snapshot! (not working in TB2)
					this.addSubMenuEventListener(subMenu, subfolder.URI); // create a new context for copying URI

					let subPopup = document.createElement("menupopup");
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
		const util = QuickFolders.Util;
		util.logDebugOptional('popupmenus', 'addSubFoldersPopup(' + folder.prettyName + ', drag=' + isDrag + ')' );
		if (folder.hasSubFolders) {
			util.logDebugOptional('popupmenus.subfolders', 'Adding folders...');
			let subfolders;
			if (typeof folder.subFolders != 'undefined')
				subfolders = folder.subFolders;
			else
				subfolders = folder.GetSubFolders();

			let isAlphaSorted = QuickFolders.Preferences.isSortSubfolderMenus;
			this.addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, isAlphaSorted, false);
		}

		// append the "Create New Folder" menu item!
		if (isDrag && QuickFolders.Preferences.getBoolPref('folderMenu.dragToNew')) {
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
				// hidepopup is broken in linkux during OnDrag action!!
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
				QuickFolders_globalHidePopupId='moveTo_'+Target.folder.URI;
				util.logDebugOptional ("popupmenus.collapse", "set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				let popup = document.getElementById(QuickFolders_globalHidePopupId);
				if (popup)
					try {
						popup.parentNode.removeChild(popup); //was popup.hidePopup()
						QuickFolders_globalHidePopupId='';
					}
					catch(e) {
						util.logDebugOptional ("popupmenus.collapse", "Could not remove popup of " + QuickFolders_globalHidePopupId );
					}
				break;

		}
	} ,

	onSelectParentFolder: function onSelectParentFolder(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("interface", "onSelectParentFolder: " + folderUri);
		this.onSelectSubFolder(folderUri, evt);
		evt.stopPropagation(); // avoid oncommand bubbling up!
		QuickFolders.Interface.collapseParentMenus(evt.target);
	} ,

	// select subfolder (on click)
	onSelectSubFolder: function onSelectSubFolder(folderUri, evt) {
    let util = QuickFolders.Util;
		util.logDebugOptional ("interface", "onSelectSubFolder: " + folderUri);
		try {
			if (evt) {
				if(evt.ctrlKey) {
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
		}
		catch (ex) { util.logToConsole(ex); };
		evt.stopPropagation();
		QuickFolders_MySelectFolder (folderUri);
	} ,
	
	// on down press reopen QuickFolders-FindPopup menu with ignorekeys="false"
	findFolderKeyPress: function findFolderKeyPress(event) {
	  const VK_DOWN = 0x28;
		const VK_ESCAPE = 0x1B;
    const VK_ENTER = 0x0D;
    function makeEvent(evtType, evt) {
      let keypress_event = document.createEvent("KeyboardEvent"); // KeyEvents
      keypress_event.initKeyEvent(evtType, true, true, null,   // typeArg, canBubble, cancelable
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
			  util.logDebugOptional("interface.findFolder","VK_DOWN");
				menupopup = document.getElementById('QuickFolders-FindPopup');
				let fC = menupopup.firstChild;
				if (!fC) {
					util.logDebugOptional("interface.findFolder","no popup children, early exit");
				  return; // no children = no results!
		    }
				menupopup.removeAttribute('ignorekeys');
				let palette = document.getElementById('QuickFolders-Palette');
				if (palette) {
					util.logDebugOptional("interface.findFolder","1. show Popup...");
          // remove and add the popup to register ignorekeys removal
          menupopup = palette.appendChild(palette.removeChild(menupopup));
					let searchBox = document.getElementById('QuickFolders-FindFolder');
					if (typeof menupopup.openPopup == 'undefined')
						menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
					else
						menupopup.openPopup(searchBox,'after_start', 0, -1, true, false); 
            
					if (event.preventDefault) event.preventDefault();
					if (event.stopPropagation) event.stopPropagation();
          
					setTimeout( function() {
						util.logDebugOptional("interface.findFolder","creating Keyboard Events...");
						if (menupopup.dispatchEvent(makeEvent('keydown',VK_DOWN))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keydown event was dispatched.");
						}
						if (menupopup.dispatchEvent(makeEvent('keyup',VK_DOWN))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keyup event was dispatched.");
            }
					});
				} // palette
				break;
			case VK_ESCAPE:
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
          let maxFindSearch = QuickFolders.Preferences.getIntPref("premium.findFolder.maxPathItems"),
              detail = QuickFolders.Preferences.getIntPref("premium.findFolder.folderPathDetail"),
              fName = QuickFolders.Interface.folderPathLabel(detail, folder, maxFindSearch);
					matches.push( { name:fName, lname:folderNameSearched, uri:folder.URI, rank:rank, type:'folder', folder:folder } );
				}
			}
		}
    
		// check if any word in foldername string starts with typed characters
    function wordStartMatch(fName, search) {
      let m = fName.split(' ');
      for (let i=0; i<m.length; i++) {
        if (m[i].indexOf(search)==0) return true;
      }
      return false;
    }
    
    // [Bug 26088] check if folder has a parent (or grand parent) which starts with the passed search string
    function isParentMatch(folder, search, maxLevel, parentList) {
      if (!search) return true;
      let f = folder,
			    pLevel = 1;
      while (f.parent && maxLevel) {
        maxLevel--;
        f = f.parent;
        if (f.prettyName.toLowerCase().indexOf(search)==0) {
					if (pLevel==1) {  // direct parent? Add to collection in case we want to create child (slash)
						if (parentList.indexOf(f)<0)
							parentList.push(f);
					}
          return true;
				}
				pLevel++;
      }
      return false;
    }
    
    let util = QuickFolders.Util,
        model = QuickFolders.Model,
        prefs = QuickFolders.Preferences,
        Ci = Components.interfaces,
		    isSelected = false,
				enteredSearch = searchBox.value,
	      searchString = enteredSearch.toLocaleLowerCase(),
        parentString = '';        
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
				// avoid duplicates
				if (!matches.some( function(a) { return (a.uri == folderEntry.uri); })) {
					matches.push( { name:folderEntry.name, lname:folderNameSearched, uri:folderEntry.uri, rank: rank, type:'quickFolder' } );
				}
			}
		}
		// SLASH command - list child folders !
    let parentPos = searchString.indexOf('/');
    if (parentPos>0) { // we have a parent folder
      parentString = searchString.substr(0, parentPos);
      searchString = searchString.substr(parentPos+1);
			enteredSearch = enteredSearch.substr(parentPos+1); // original mixed case for subfolder creation; include placeholder for account
    }
    let isFiling = QuickFolders.quickMove.isActive;
    /********* old jump point *********/
		// if 1 unique full match is found - without children!, we can automatically jump there
		if ((matches.length == 1)  && (!isFiling) && (matches[0].folder && !matches[0].folder.hasSubFolders)
        && (matches[0].lname == searchString      // one exact match
           || (wordStartMatch(matches[0].lname) && forceFind)) // match starts with search string + [Enter] key was pressed
       ) {
			// go to folder
			isSelected = QuickFolders_MySelectFolder(matches[0].uri);
      setTimeout(function() {
        QuickFolders.Interface.tearDownSearchBox();
      }, 400);
      return; // ????
		}
		
    // if quickMove is active we need to suppress matches from newsgroups (as we can't move mail to them)
		// "parent/" no name given, only lists the direct children
		// "parent/X" can it list grandchildren? It does, but shouldn't - test with "Addons/Qu"
    let maxParentLevel = searchString.length ? prefs.getIntPref('premium.findFolder.maxParentLevel') : 1; 
		if (parentPos>0) maxParentLevel = 1; // no subfolders when SLASH is entered
    if (util.Application == 'Postbox') {
      let AF = util.allFoldersIterator(isFiling);
      for (let fi=0; fi<AF.length; fi++) {
        let folder = AF.queryElementAt(fi,Components.interfaces.nsIMsgFolder);
        if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
        addMatchingFolder(matches, folder);
      }
    }
    else
      for (let folder in util.allFoldersIterator(isFiling)) {
        if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
        addMatchingFolder(matches, folder);
      }
		
		// rebuild popup
		let menupopup;
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
		  if (matches.length == 0) {
			  let menuitem = document.createElement('menuitem');
				menuitem.setAttribute('label', '...'); // just one dummy to show we were searching
				menupopup.appendChild(menuitem);
			}
			else {
				for (let j=0; j<matches.length; j++) {
					let menuitem = document.createElement('menuitem');
					// menuitem.className='color menuitem-iconic';
					menuitem.setAttribute('label', matches[j].name);
					menuitem.setAttribute('value', matches[j].uri);
					if (matches[j].type == 'quickFolder')
						menuitem.className = 'quickFolder menuitem-iconic';
          else
            menuitem.className = 'menuitem-iconic';
					menupopup.appendChild(menuitem);
				}
			}
		}
		// special commands: if slash was entered, allow creating subfolders. Exclude Postbox.
		if (parentPos>0 && util.Application!='Postbox') {
			// [Bug 26283] add matches from quickfolders (if named differently)
			let isFound = false;
			for (let i=0; i<model.selectedFolders.length; i++) {
				let folderEntry = model.selectedFolders[i],
				    folderNameSearched = folderEntry.name.toLocaleLowerCase(),
						matchPos = folderNameSearched.indexOf(parentString);
					 
				// 
				if(matchPos == 0
				   &&
				   !parents.some(function(p) { return p.URI == folderEntry.uri; } )) {  // function to replace p => p.uri == folderEntry.uri - Postbox can't understand this.
					let nsIfolder = model.getMsgFolderFromUri(folderEntry.uri, false); // determine the real folder name
					// this folder does not exist (under its real name) - add it!
					nsIfolder.setStringProperty("isQuickFolder", true); // add this flag
					parents.push(nsIfolder);
				}
			}
			
			if (prefs.isDebugOption('quickMove')) debugger;			
			while (parents.length) {
				let menuitem = document.createElement('menuitem'),
				    f = parents.pop(),
				    label = this.getUIstring('qfNewSubFolder', 'Create subfolder {0} ' + "\u00BB".toString() + ' {1}...');
						
				menuitem.setAttribute('label', label.replace('{0}', f.rootFolder.name + ": " + f.prettyName).replace('{1}', enteredSearch));
				menuitem.addEventListener('command', function(event) { 
						QuickFolders.Interface.onCreateInstantFolder(f, enteredSearch); 
						return false; 
					}, false
				);
				menuitem.className = 'menuitem-iconic deferred'; // use 'deferred' to avoid selectFound handler
				if (f.getStringProperty("isQuickFolder")) {
					f.setStringProperty("isQuickFolder", ""); // remove this temporary property
					menuitem.className += ' quickFolder';
				}
				if (menupopup.firstChild)
					menupopup.insertBefore(menuitem, menupopup.firstChild);
				else
					menupopup.appendChild(menuItem);
			}
		}
		
		menupopup.setAttribute('ignorekeys', 'true');
		if (typeof menupopup.openPopup == 'undefined')
			menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
		else
			menupopup.openPopup(searchBox,'after_start', 0, -1,true,false);  // ,evt
		if (matches.length == 1) { 
      if (!isFiling && wordStartMatch(matches[0].lname, searchString) && forceFind) {
        // go to folder
        isSelected = QuickFolders_MySelectFolder(matches[0].uri);
        setTimeout(function() {
          QuickFolders.Interface.tearDownSearchBox();
        }, 400);
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
    let util = QuickFolders.Util;
		util.logDebug("selectFound - " + event);
	  let el = event.target,
		    URI = el.getAttribute('value'),
        isSelected,
        /**************  New quickMove Functionality  **************/
        isQuickMove = (QuickFolders.quickMove.isActive);
		// this was a separate command which is handled elsewhere
		if (el.className && el.className.indexOf('deferred')>=0) return;
		element.setAttribute('ignorekeys', 'true');
    util.logDebugOptional('quickMove', 'QuickFolders.quickMove.isActive = ' + isQuickMove);
    if (isQuickMove) { 
      QuickFolders.quickMove.execute(URI); // folder.uri
      return;
    } /**************  quickMove End  **************/
    else
      isSelected = QuickFolders_MySelectFolder(URI, true);
		if (isSelected) {
			// success: collapses the search box! 
      this.findFolder(false);
		}
		else {
			if (el.className.indexOf('quickFolder')>=0) {
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
        QuickMove = QuickFolders.quickMove;
    util.logDebugOptional("interface.findFolder,quickMove", "findFolder(" + show + ", " + actionType + ")");
		try {
			let ff = util.$("QuickFolders-FindFolder");
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
		    win = window.openDialog('chrome://quickfolders/content/options.xul',
          'quickfolders-options',
          features,
          QuickFolders,
          params).focus();
	} ,

	viewHelp: function viewHelp() {
		let params = {inn:{mode:"helpOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,

	viewSupport: function viewSupport() {
		let params = {inn:{mode:"supportOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,
  
  viewLicense: function viewLicense() {
		let win = QuickFolders.Util.getMail3PaneWindow(),
        params = {inn:{mode:"licenseKey",tab:-1, message: "", instance: win.QuickFolders}, out:null};
        
    win.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
  } ,

	viewChangeOrder: function viewChangeOrder() {
		window.openDialog('chrome://quickfolders/content/change-order.xul','quickfolders-change-order',
						  'chrome,titlebar,toolbar,centerscreen,resizable,dependent', QuickFolders); // dependent = modeless
	} ,

  lastTabSelected: null,
  styleSelectedTab: function styleSelectedTab(selectedButton) {
		if(!(selectedButton)) 
      return;
    if (selectedButton.className.indexOf("selected-folder") >=0) 
      return;
    selectedButton.className += " selected-folder";
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
			if ((tabStyle != prefs.TABS_STRIPED) && (button.className.indexOf("selected-folder")>=0))
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
    let util = QuickFolders.Util;
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
        QuickFolders.Interface.addFolderButton(folder, entry, -1, currentFolderTab, 'QuickFoldersCurrentFolder', QuickFolders.Preferences.ColoredTabStyle	);
        if (QuickFolders.FolderTree && this.CurrentFolderRemoveIconBtn) {
          if (!QuickFolders.Preferences.supportsCustomIcon) {
            this.CurrentFolderSelectIconBtn.collapsed = true;
            this.CurrentFolderRemoveIconBtn.collapsed = true;
          }
          else {
            let hasIcon = 
              QuickFolders.Preferences.getBoolPref('currentFolderBar.folderTreeIcon')
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
      currentFolderTab.className = currentFolderTab.className.replace("selected-folder", "");
    }
    catch(ex) {
      util.logException("Quickfolders.initCurrentFolderTab()", ex);
    }
    
	} ,

  configureCategory: function configureCategory(folder, quickfoldersPointer) {
		let retval = {btnClicked:null};
		window.openDialog('chrome://quickfolders/content/set-folder-category.xul',
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
		//let sColFolder = (tabStyle == 0) ? "chrome://quickfolders/skin/striped" : "chrome://quickfolders/skin/cols";
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
		let hasClass = (paletteToken && element.className.indexOf(paletteToken) >= 0);
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
		    ssPalettes;
		while (!parent.folder && parent.parentNode) {
			parent=parent.parentNode;
			switch(parent.id) {
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
				  QuickFolders.Options.preparePreviewTab(null, null, targetNode.id, col); // [Bug 25589]
				  //QuickFolders.Options.preparePreviewPastel(prefs.getBoolPref('pastelColors'));
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
					ssPalettes = ssPalettes ? ssPalettes : this.getStyleSheet(engine, QuickFolders.Interface.PaletteStyleSheet, 'QuickFolderPalettes');
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
							cp.color = selectedFontColor;
							prefs.setUserStyle(userStyleKey, "color", selectedFontColor);
							QuickFolders.Options.styleUpdate(userStyleKey, 'color', selectedFontColor, previewTab);
						}
					}
					
					// find out the last (=main) gradient color and set as background color!
					let selectedGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image'),
              resultBackgroundColor = '';
					if (selectedGradient !== null) { 
						// get last gradient point (bottom) to determine background color
						// all gradients should be defined top down
						QuickFolders.Util.logDebugOptional("css.palette", "selectedGradient = " + selectedGradient);
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
                  cp.color = rgb;
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
							QuickFolders.Options.toggleColorTranslucent(chkTransparent, 'inactive-colorpicker', 'inactivetabs-label', styleKey);
						}
						let cp = document.getElementById('inactive-colorpicker');
						if (cp)
						  cp.color = 'rgb(255,255,255)';
						prefs.setUserStyle(styleKey, "background-color", 'rgb(255,255,255)');
						QuickFolders.Interface.updateMainWindow();
					}
          if (styleKey == 'InactiveTab')
            this.applyTabStyle(document.getElementById('inactivetabs-label'), prefs.ColoredTabStyle);
          // immediate update of background color for bottom border
          if (styleKey == 'ActiveTab' && resultBackgroundColor) {
            QuickFolders.Options.styleUpdate('ActiveTab','background-color', resultBackgroundColor, 'activetabs-label');
          }
          if (disableColorChangeStriped)
            QuickFolders.Interface.updateMainWindow(true);  // force update as it might have been missed!
					return; // early exit
			} // end switch
		}
		// or... paint a quickFolders tab
		let theFolder = parent.folder,
		    button = this.getButtonByFolder(theFolder);
		QuickFolders.Util.logToConsole("Interface.setTabColorFromMenu(" + menuitem.toString() + ", " + col + ")" );
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
		try {
			QuickFolders.Util.logDebugOptional("css","ensureStyleSheetLoaded(Name: " + Name + ", Title: " + Title + ")" );

			QuickFolders.Styles.getMyStyleSheet(Name, Title); // just to log something in console window

			let sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
								.getService(Components.interfaces.nsIStyleSheetService),
			    ios = Components.classes["@mozilla.org/network/io-service;1"]
								.getService(Components.interfaces.nsIIOService),
			    fileUri = (Name.length && Name.indexOf("chrome://")<0) ? "chrome://quickfolders/content/" + Name : Name,
			    uri = ios.newURI(fileUri, null, null);
			if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
				QuickFolders.Util.logDebugOptional("css", "=============================================================\n"
				                                 + "style sheet not registered - now loading: " + uri);
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
			}
		}
		catch(e) {
			Services.prompt.alert(null,"QuickFolders",'ensureStyleSheetLoaded failed: ' + e);
		}
	} ,

	getStyleSheet: function getStyleSheet(engine, Name, Title) {
		let sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title); // ignore engine
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(Name, Title);
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
		}

		if (!sheet) {
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
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover > label','color', hoverColor, true);

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
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover > label','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[buttonover="true"] > label','color', hoverColor, true);
		}
		else { // two color mode
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds...");
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':hover', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ':hover', 'background-image', 'none', true);
			if (tabStyle == prefs.TABS_STRIPED) {
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover > label','color', hoverColor ,true);
			}
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover > label','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + '[buttonover="true"] > label','color', hoverColor ,true);
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
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':-moz-drag-over > label','color', dragOverColor, true); // ####
		
		if (prefs.getIntPref('style.DragOver.paletteType')) {
			let paletteClass = this.getPaletteClassCss('DragOver'),
			    paletteEntry = prefs.getIntPref('style.DragOver.paletteEntry'),
			    ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry,
			    dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			// for some reason this one is completely ignored by SeaMonkey and Postbox
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over', 'background-image', dragOverGradient, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':-moz-drag-over > label','color', dragOverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '[buttonover="true"] > label','color', dragOverColor, true);
		}
		else {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over > label','color', dragOverColor,true);
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
    engine.removeElementStyle(ss, '.quickfolders-flat .selected-folder > label', 'color');
    engine.setElementStyle(ss, '.quickfolders-flat .selected-folder > label', 'color', selectedColor,true);
	} ,
	
	// INACTIVE STATE (DEFAULT)
	initDefaultStyle: function initDefaultStyle(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDefaultStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
        inactiveGradientColor = null,
		    inactiveBackground = prefs.getUserStyle("InactiveTab","background-color","ButtonFace"),
		    inactiveColor = prefs.getUserStyle("InactiveTab","color","black"),
		    paletteClass = this.getPaletteClassCss('InactiveTab'),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == prefs.TABS_STRIPED) && prefs.getIntPref('style.InactiveTab.paletteType')<3, 
		    noColorClass = (isTabsStriped) ? 'col0striped' : 'col0',
		    avoidCurrentFolder = ''; // = ':not(#QuickFoldersCurrentFolder)'; // we omit paletteClass for uncolored tabs:

		// transparent buttons: means translucent background! :))
		if (prefs.getBoolPref('transparentButtons')) 
			inactiveBackground = QuickFolders.Util.getRGBA(inactiveBackground, 0.25) ; 

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
	  engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + '.' + noColorClass + ' > label','color', inactiveColor, false); 
    if (inactiveGradientColor!=null)
      engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ' > label','color', inactiveGradientColor, false);

		// Coloring all striped tabbed buttons that have individual colors 
    let coloredPaletteClass = this.getPaletteClassCss('ColoredTab');
		if (isTabsStriped) {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ' > label','color', inactiveColor, false);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + coloredPaletteClass + ' > label','color', inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ' > label','color');
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton' + coloredPaletteClass + ' > label','color');
		}
		
	} ,
	
	// Get all blingable elements and make them look user defined.
	updateUserStyles: function updateUserStyles() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		try {
			util.logDebugOptional ("interface","updateUserStyles()");
			if (prefs.isDebugOption("interface")) debugger; // Postbox
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
					radSelector = '.quickfolders-flat toolbarbutton';
					
			if (util.Application == 'SeaMonkey') radSelector = 'toolbox toolbar' + radSelector;
			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, radSelector 
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
			
			if (util.Application == 'SeaMonkey') radSelector = radSelector + ':not(.plain)';
			styleEngine.setElementStyle(ss, radSelector, legacyRadius ? '-moz-border-radius-topleft'     : 'border-top-left-radius', topRadius, true);
			styleEngine.setElementStyle(ss, radSelector, legacyRadius ? '-moz-border-radius-topright'    : 'border-top-right-radius', topRadius, true);
			styleEngine.setElementStyle(ss, radSelector, legacyRadius ? '-moz-border-radius-bottomleft'  : 'border-bottom-left-radius', bottomRadius, true);
			styleEngine.setElementStyle(ss, radSelector, legacyRadius ? '-moz-border-radius-bottomright' : 'border-bottom-right-radius', bottomRadius, true);

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
			styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar.quickfolders-flat','border-bottom-color', colActiveBG, true); // only in main toolbar!

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
      styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar.quickfolders-flat', 'border-bottom-width', tbBottom, true);
			
			this.updateCurrentFolderBar(ss);
			
      // change to numeric
			let minToolbarHeight = prefs.getStringPref('toolbar.minHeight');
      if (minToolbarHeight) {
        let mT = parseInt(minToolbarHeight);
        styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar', 'min-height', mT.toString()+"px", false);
      }

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
				return;
			}
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(firstOne.uri);
	} ,

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
				return;
			}
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(lastOne.uri);
	} ,

	goPreviousSiblingFolder: function goPreviousSiblingFolder() {
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
				folder = myenum.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder); // Postbox
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
					folder = myenum.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
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
							x = myenum.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder);
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
							target = x.QueryInterface(Components.interfaces.nsIMsgFolder);
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
					else
						tabMode = ""; // Sm -- [Bug 25585] this was in the wrong place!
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
	
	moveFolder: function moveFolder(fromFolder, targetFolder) {
		let sPrompt = QuickFolders.Util.getBundleString("qfConfirmMoveFolder", "Really move folder {0} to {1}?"),
		    fromURI = fromFolder.URI;
		sPrompt = sPrompt.replace("{0}", fromFolder.prettyName);
		sPrompt = sPrompt.replace("{1}", targetFolder.prettyName);
		let promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		if (promptService.confirm(window, "QuickFolders", sPrompt)) {
			let cs = Components.classes["@mozilla.org/messenger/messagecopyservice;1"]
				.getService(Components.interfaces.nsIMsgCopyService);

			try {
				let count = 1, // for the moment only support dragging one folder.
				    ap = QuickFolders.Util.Application,
				    isNewArray = (ap == 'Thunderbird' || ap == 'SeaMonkey');
				for (let i = 0; i < count; i++) {
					let folders = new Array;
					folders.push(fromFolder); // dt.mozGetDataAt("text/x-moz-folder", i).QueryInterface(Ci.nsIMsgFolder)
					let array = isNewArray ?
						  toXPCOMArray(folders, Components.interfaces.nsIMutableArray)
						: Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
					
					if (!isNewArray)
						array.AppendElement(fromFolder);
					
					// cannot move if the target Folder is in a different account?
					// folders[0]\ == targetFolder.server
					let isMove = (!fromFolder.locked && fromFolder.canRename && fromFolder.deletable
					              	&&
					               (fromFolder.server.type == 'pop3' || fromFolder.server.type == 'imap' || fromFolder.server.type == 'none')),
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
				sPrompt = QuickFolders.Util.getBundleString("qfCantMoveFolder", "Folder {0} cannot be moved.");
				sPrompt = sPrompt.replace("{0}", fromFolder.prettyName);
				Services.prompt.alert(null,"QuickFolders", sPrompt + "\n" + ex);
				QuickFolders.Util.logException("Exception in movefolder ", ex);
			}			
		}
	} ,

	showPalette: function showPalette(button) {
		let context = button.getAttribute('context');
		QuickFolders.Util.logDebugOptional("interface", "Interface.showPalette(" + button.id + "): context = " + context);
		this.showPopup(button, context);
	} ,
	
	togglePaintMode: function togglePaintMode(mode) {
		QuickFolders.Util.logDebugOptional("interface", "togglePaintMode(" + mode + ")");
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
				let folder = QuickFolders.Util.CurrentFolder;
				if (folder) {
					let folderEntry = QuickFolders.Model.getFolderEntry(folder.URI);
					tabColor = folderEntry && folderEntry.tabColor ? folderEntry.tabColor : tabColor;
				}

				try {
					this.setButtonColor(paintButton, tabColor);
					// create context menu
					let menupopup = this.PalettePopup;
					if (!menupopup.firstChild) {
						this.buildPaletteMenu(tabColor, menupopup);
						// a menu item to end this mode
						let mItem = this.createMenuItem("qfPaint", this.getUIstring("qfPaintToggle", "Finish Paint Mode"));
						this.setEventAttribute(mItem, "oncommand",'QuickFolders.Interface.togglePaintMode("off");');
            mItem.className = 'menuitem-iconic';
						menupopup.insertBefore(document.createElement('menuseparator'), menupopup.firstChild);
						menupopup.insertBefore(mItem, menupopup.firstChild);
					}
					this.initElementPaletteClass(menupopup);
				}
				catch(ex) {
					QuickFolders.Util.logException('Exception during togglePaintMode(on)', ex);
				};
				toolbar.style.setProperty('cursor', "url(chrome://quickfolders/skin/ico/fugue-paint-cursor.png) 14 13, auto", 'important'); // supply hotspot coordinates
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
    try {
      QuickFolders.Util.$('QuickFolders-quickMove-showSearch').collapsed = toggle;
      QuickFolders.Util.$('QuickFolders-quickMove-hideSearch').collapsed = !toggle;
    }
    catch (ex) {
			QuickFolders.Util.logException('Exception during updateFindBoxMenus(' + toggle + ') ', ex);
    }
  } ,
  
  // make a special style visible to show that [Enter] will move the mails in the list (and not just jump to the folder)
  toggleMoveModeSearchBox: function toggleMoveModeSearchBox(toggle) {
    QuickFolders.Util.logDebug('toggleMoveModeSearchBox(' + toggle + ')');
    let searchBox = QuickFolders.Util.$('QuickFolders-FindFolder');
    searchBox.className = toggle ? "quickMove" : "";
  } ,
  
  quickMoveButtonClick: function quickMoveButtonClick(evt, el) {
	  let searchBox = document.getElementById('QuickFolders-FindFolder');
    if (searchBox && !searchBox.collapsed && evt.button==0)  // hide only on left click
      QuickFolders.quickMove.hideSearch(); // hide search box if shown
    else {
      if (QuickFolders.quickMove.hasMails)
        QuickFolders.Interface.showPopup(el,'QuickFolders-quickMoveMenu');
      else
        QuickFolders.Interface.findFolder(true,'quickJump'); // show jump to folder box
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
    let prefixedAni = ((util.PlatformVersion <16.0) ? '-moz-' : '')  + 'animation-name',
        ss = QI.getStyleSheet(styleEngine, styleSheetName),  // rules are imported from *-widgets.css
        iconSelector = 'menuitem.cmd[tagName="qfRegister"] .menu-iconic-icon, #QuickFolders-Pro .tab-icon';
    styleEngine.removeElementStyle(ss, 
                                   iconSelector, 
                                   [prefixedAni, 'height', 'width']);
    styleEngine.setElementStyle(ss, 
                                'menuitem.cmd[tagName="qfRegister"], tab#QuickFolders-Pro',  
                                'list-style-image', 
                                "url('chrome://quickfolders/skin/ico/pro-16.png')", 
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
		
	}
  
}; // Interface


