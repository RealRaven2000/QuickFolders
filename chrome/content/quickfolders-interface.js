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
  isMoveActive: false,
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
	get CurrentFolderTab() { return QuickFolders.Util.$('QuickFoldersCurrentFolder');},
	get CurrentFolderRemoveIconBtn() { return QuickFolders.Util.$('QuickFolders-RemoveIcon');},
  get CurrentFolderSelectIconBtn() { return QuickFolders.Util.$('QuickFolders-SelectIcon');},
	get CurrentFolderBar() { return QuickFolders.Util.$('QuickFolders-CurrentFolderTools');},
	get CurrentFolderFilterToggleButton() { return QuickFolders.Util.$('QuickFolders-currentFolderFilterActive'); },
	get CogWheelPopupButton () { return QuickFolders.Util.$('QuickFolders-mainPopup'); },
	get QuickMoveButton () { return QuickFolders.Util.$('QuickFolders-quickMove'); },
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
		if (!this._paletteStyleSheetOfOptions) 
			this._paletteStyleSheetOfOptions = 'chrome://quickfolders/skin/quickfolders-options.css';  // this._paletteStyleSheet; // in postbox this is overloaded so it should be in the list (?)
		
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

	tabSelectUpdate: function tabSelectUpdate() {
		try {
			let folder;
			QuickFolders.Util.logDebugOptional("mailTabs", "tabSelectUpdate - "
				 + QuickFolders.currentURI +"\ntabSelectEnable=" + QuickFolders.tabSelectEnable);
			if (QuickFolders.tabSelectEnable) {
				QuickFolders.Interface.onTabSelected();
				// change the category (if selected folder is in list)
				folder = GetFirstSelectedMsgFolder();
				if (folder) {
					QuickFolders.Util.logDebugOptional("mailTabs", "Tab Selected: "+ folder.name);
					let entry = QuickFolders.Model.getFolderEntry(folder.URI);
					if (entry) {
						QuickFolders.Util.logDebugOptional ("mailTabs","Current Category = " + this.currentlySelectedCategory ); // + this.CurrentlySelectedCategoryName
						if (entry.category)
							QuickFolders.Util.logDebugOptional ("mailTabs","Categories of selected Tab = " + entry.category.replace('|',', '));
						// no need to switch / update categories, if ALL is selected!
						if (QuickFolders.FolderCategory.ALL == this.currentlySelectedCategory) {
							QuickFolders.tabSelectEnable=true;
							return;
						}
						if (!entry.category)
							QuickFolders.Interface.selectCategory(QuickFolders.FolderCategory.UNCATEGORIZED , false);
						// switch category - but to which one if the folder is in multiple categories?
						if (entry.category 
							&& 
							entry.category.indexOf(this.CurrentlySelectedCategoryName) < 0
							&& entry.category!=QuickFolders.FolderCategory.ALWAYS)
							QuickFolders.Interface.selectCategory(entry.category, false);
						this.updateCategories();

					}
				}
			}
			else {
				//folder = GetMsgFolderFromUri(QuickFolders.currentURI);
			}
		} catch(e) { QuickFolders.Util.logToConsole("tabSelectUpdate failed: " + e); }
		QuickFolders.tabSelectEnable=true;
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

	setFolderUpdateTimer: function setFolderUpdateTimer() {
		// avoid the overhead if marking a folder with lots of unread mails as read or getting emails
		// made folder update asynchronous instead.
		// we only set a new timer, if there is not already one active.
		QuickFolders.Util.logDebugOptional("listeners.folder", "setFolderUpdateTimer() - Id = " + this.TimeoutID);
		if (!(this.TimeoutID)) {
			try {
				let nDelay = QuickFolders.Preferences.getIntPref('queuedFolderUpdateDelay');
				if (!nDelay>0) nDelay = 750;
				//this.TimeoutID = setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
				this.TimeoutID=setTimeout(function() { QuickFolders.Interface.queuedFolderUpdate(); }, nDelay);
				QuickFolders.Util.logDebug("Folder Tab Select Timer ID: " + this.TimeoutID);

				QuickFolders.Util.logDebug("Setting Update Timer (after timer " + this.LastTimeoutID + " expired), new Timer: " + this.TimeoutID);
				this.LastTimeoutID=this.TimeoutID;
			}
			catch (e) {
				QuickFolders.Util.logDebugOptional("listeners.folder", "setFolderUpdateTimer: " + e);
			}

		}

	},

	queuedFolderUpdate: function queuedFolderUpdate() {
		QuickFolders.Util.logDebugOptional("listeners.folder", "Folder Update from Timer " + this.TimeoutID + "...");
		this.updateFolders(false, true);
		//reset all timers
		this.TimeoutID=0;
	},

	generateMRUlist: function generateMRUlist(ftv) { // generateMap: function ftv_recent_generateMap(ftv)
		let oldestTime = 0,
		    recent = [],
		    items,
		    MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");
		function sorter(a, b) {
			return Number(a.getStringProperty("MRUTime")) < Number(b.getStringProperty("MRUTime"));
		}
		
		function addIfRecent(aFolder) {
			let time;
			try {
				time = Number(aFolder.getStringProperty("MRUTime")) || 0;
			} catch (ex) {return;}
			if (time <= oldestTime)
				return;

			if (recent.length == MAXRECENT) {
				recent.sort(sorter);
				recent.pop();
				let oldestFolder = recent[recent.length - 1];
				oldestTime = Number(oldestFolder.getStringProperty("MRUTime"));
			}
			recent.push(aFolder);
		}

		QuickFolders.Util.logDebugOptional("interface,recentFolders", "generateMRUlist()");
		try {
			/**
			 * Sorts our folders by their recent-times.
			 */

			/**
			 * This function will add a folder to the recentFolders array if it
			 * is among the 15 most recent.  If we exceed 15 folders, it will pop
			 * the oldest folder, ensuring that we end up with the right number
			 *
			 * @param aFolder the folder to check
			 */

			for each (let folder in ftv._enumerateFolders)
				addIfRecent(folder);

			recent.sort(sorter);

			items = [new ftvItem(f) for each (f in recent)];

			// There are no children in this view!
			for each (let folder in items)
				folder.__defineGetter__("children", function() { return [];});

		}
		catch(ex) {
			QuickFolders.Util.logException('Exception during generateMRUlist: ', ex);
			return null;
		}

		return items;
	},

	// Postbox / SeaMonkey specific code:
	// See also: http://mxr.mozilla.org/mozilla/source/mail/base/content/mail-folder-bindings.xml#369
	generateMRUlist_Postbox_TB2: function generateMRUlist_Postbox_TB2() {
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
			if (!aFolder.canFileMessages)
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
		const Cc = Components.classes;
		const Ci = Components.interfaces;
		// Iterate through all folders in all accounts, and check MRU_Time,
		// then take the most recent 15.
		let recentFolders = [],
		    oldestTime = 0, // let sometimes creates a problem in TB2!
		    MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount"),
	      menu = this,
        // Start iterating at the top of the hierarchy, that is, with the root
        // folders for each account.
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
		    popupId = isCurrentFolderButton ? this.RecentPopupIdCurrentFolderTool : this.RecentPopupId ;
		QuickFolders.Util.logDebugOptional('recentFolders','createRecentPopup(passedPopup:' + passedPopup + ', isDrag:'+ isDrag +', isCreate:' + isCreate + ')');

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


		QuickFolders.Util.logDebugOptional("recentFolders","Creating Popup Set for Recent Folders tab");

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
			recentFolders = this.generateMRUlist(gFolderTreeView); // instead of 'let' recentFolders
		}

		for (let i = 0; i < recentFolders.length; i++) {
			let f;
			if (isOldFolderList)
				f = recentFolders[i];
			else
				f = recentFolders[i]._folder;
			FoldersArray.appendElement(f, false);
			QuickFolders.Util.logDebugOptional('recentFolders.detail','Recent Folders Array: ' + i + '. appended ' +  f.prettyName);
		}


		// addSubFoldersPopupFromList expects nsISimpleEnumerator, enumerate() convrts the nsIMutableArray
		let isAlphaSorted =  QuickFolders.Preferences.getBoolPref("recentfolders.sortAlphabetical");
		this.addSubFoldersPopupFromList(FoldersArray.enumerate(), menupopup, isDrag, isAlphaSorted, true);
		QuickFolders.Util.logDebugOptional('recentFolders','=============================\n'
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
  
	onClickThreadTools: function onClickThreadTools(button, evt) {
		goDoCommand('cmd_markThreadAsRead'); 
		evt.stopPropagation();
		goDoCommand('button_next');
	} ,
	
	onGoPreviousMsg: function onGoPreviousMsg(button) {
		if (button.nextSibling.checked) 
			goDoCommand('cmd_previousMsg');
		else
			goDoCommand('button_previous');
			
	} ,

	onGoNextMsg: function onGoNextMsg(button) {
		if (button.previousSibling.checked) 
			goDoCommand('cmd_nextMsg');
		else
			goDoCommand('button_next');
	} ,
	
	onToggleNavigation: function onToggleNavigation(button) {
		button.checked = !button.checked;
	} ,

	// added parameter to avoid deleting categories dropdown while selecting from it!
	// new option: minimalUpdate - only checks labels, does not recreate the whole folder tree
	updateFolders: function updateFolders(rebuildCategories, minimalUpdate) {
		QuickFolders.Util.logDebugOptional("interface", "updateFolders(rebuildCategories=" + rebuildCategories + ", minimalUpdate=" + minimalUpdate + ")");
		this.TimeoutID=0;

		let showToolIcon = QuickFolders.Preferences.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;
		
		if (this.CogWheelPopupButton)
			this.CogWheelPopupButton.collapsed = !showToolIcon || this.PaintModeActive;
      
    if (this.QuickMoveButton) 
      this.QuickMoveButton.collapsed = !QuickFolders.Preferences.isShowQuickMove;
		
		// was QuickFolders-Category-Box
		if (this.CategoryMenu)
			this.CategoryMenu.style.display =
		    (!showToolIcon && QuickFolders.Model.Categories.length == 0)
		    ? 'none' : '-moz-inline-box';

		if(rebuildCategories || QuickFolders.Preferences.isMinimalUpdateDisabled)
			minimalUpdate = false;

		let sDebug = 'updateFolders(rebuildCategories: ' + rebuildCategories + ', minimal: ' + minimalUpdate +')',
		    toolbar = this.Toolbar,
		    theme = QuickFolders.Preferences.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName + " chromeclass-toolbar";

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += ' - Number of Folders = ' + QuickFolders.Model.selectedFolders.length;

		QuickFolders.Util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			QuickFolders.Util.clearChildren(this.FoldersBox, rebuildCategories);

			// force label when there are no folders!
			let showLabelBox = QuickFolders.Preferences.isShowQuickFoldersLabel || (0==QuickFolders.Model.selectedFolders.length);

			this.TitleLabel.value = QuickFolders.Preferences.TextQuickfoldersLabel;
			this.TitleLabel.value.collapsed = !showLabelBox;
			this.TitleLabelBox.collapsed = !showLabelBox;
			this.TitleLabelBox.style.width = showLabelBox ? "auto" : "0px";

			if (rebuildCategories || null==this.CategoryMenu)
				this.updateCategories();
		}


		let offset = 0;

		// Recent Folders tab
		if (QuickFolders.Preferences.isShowRecentTab) {
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

			let tabStyle = QuickFolders.Preferences.ColoredTabStyle,
			    isFirst=true;
			for(let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if(!this.shouldDisplayFolder(folderEntry))
					continue;

				if((folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))) {
					countFolders++;
					if (!minimalUpdate) {
						button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle, isFirst);
						this.buttonsByOffset[offset] = button;
						isFirst = false;
					}
					else {
						// now just update the folder count on the button label, if it changed.
						// button is not newly created. Also it is not recolored.
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry, offset, button, null, tabStyle, isFirst);
							isFirst = false;
						}
					}

					offset++;
				}
			}

			let sDoneWhat = minimalUpdate ? "rebuilt." : "rendered on toolbar."
			QuickFolders.Util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
		}

		// [Bug 25598] highlight active tab
    if (!minimalUpdate)
      this.lastTabSelected = null;  // reset to force highlight active tab
		this.onTabSelected();
		
		// current message dragging
		let button = this.MailButton;
		if (button)
			this.setEventAttribute(button, "ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.messageDragObserver, true)");

		// current thread dragging; let's piggyback "isThread"...
		// use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
		button = QuickFolders.Util.$('QuickFolders-CurrentThread'); 
		if (button)
			this.setEventAttribute(button, "ondraggesture","event.isThread=true; nsDragAndDrop.startDrag(event,QuickFolders.messageDragObserver, true)");
			//button.addEventListener("dragenter", function(event) { event.isThread=true; nsDragAndDrop.dragEnter(event, QuickFolders.messageDragObserver);  }, false);
		if (QuickFolders.Preferences.isShowCategoryNewCount) {
			
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
			    ss = styleSheet ? styleSheet : this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles'),
			    background = prefs.getCharPrefQF('currentFolderBar.background');
			styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools', 'background', background);
			
			// add styling to current folder via a fake container
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
		QuickFolders.Util.logDebugOptional("interface", "updateCategories()");
		let bookmarkCategories = QuickFolders.Model.Categories,
		    lCatCount = bookmarkCategories ? bookmarkCategories.length : 0,
		    menuList = this.CategoryMenu,
		    menuPopup = menuList.menupopup;
		QuickFolders.Util.logDebug("updateCategories() - [" + lCatCount + " Categories]");

		QuickFolders.Util.clearChildren(menuPopup,true);

		if(lCatCount > 0) {
			menuList.collapsed = false;
			menuList.style.display = '-moz-box';

			menuPopup.appendChild(this.createMenuItem(QuickFolders.FolderCategory.ALL, this.getUIstring("qfAll", "(Display All)")))
			for(let i = 0; i < lCatCount; i++) {
				let category = bookmarkCategories[i];

				if (bookmarkCategories[i] != QuickFolders.FolderCategory.ALWAYS) {
					menuPopup.appendChild(this.createMenuItem(category, category))
				}
			}

			menuPopup.appendChild(document.createElement('menuseparator'));
			let s = this.getUIstring("qfUncategorized","(Uncategorized)");

			menuPopup.appendChild(this.createMenuItem(QuickFolders.FolderCategory.UNCATEGORIZED , s))

			if(QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
				menuList.value = this.currentlySelectedCategory;
			}
			else {
				menuList.value = QuickFolders.FolderCategory.ALL;
			}
		}
		else {
			QuickFolders.Util.logDebug("No Categories defined, hiding Categories box.");
			menuList.collapsed = true;
			menuList.style.display = 'none';
		}
	} ,
	
	// moved from options.js!
	updateMainWindow: function updateMainWindow(minimal) {
		function logCSS(txt) {
			QuickFolders.Util.logDebugOptional("css", txt);
		}

		logCSS("============================\n" + "updateMainWindow...");
		let themeSelector = document.getElementById("QuickFolders-Theme-Selector"),
        prefs = QuickFolders.Preferences;
			
		// update the theme type - based on theme selection in options window, if this is open, else use the id from preferences
		prefs.setCurrentThemeId(themeSelector ? themeSelector.value : prefs.CurrentThemeId);
		let style =  prefs.ColoredTabStyle,
		    // refresh main window
		    mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
											 .getService(Components.interfaces.nsIWindowMediator)
											 .getMostRecentWindow("mail:3pane");
		// we need to try and get at the main window context of QuickFolders, not the prefwindow instance!
		if (mail3PaneWindow && mail3PaneWindow.document) { 
			let _interface = mail3PaneWindow.QuickFolders.Interface;
      if (!minimal) {
        logCSS("updateMainWindow: update Folders...");
        _interface.updateFolders(true, false);
      }
			logCSS("updateMainWindow: update User Styles...");
			_interface.updateUserStyles();
		}
		else {
			logCSS("updateMainWindow: no mail3PaneWindow found!");
		}
		return true;
	} ,

	deleteFolderPrompt: function deleteFolderPrompt(folderEntry, withCancel) {
		let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
													.getService(Components.interfaces.nsIPromptService);		
		let flags = 
			prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
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
		QuickFolders.Util.logDebugOptional("interface", "tidyDeadFolders()");
		let countTabs=0;
		let countDeleted=0;
		let sMsg = this.getUIstring('qfTidyDeadFolders',
			'This will remove the Tabs that have no valid folders assigned.\nThis sometimes happens if a folder is removed without QuickFolders being notified.')
		if (!confirm(sMsg))
			return;
		let isCancel = false;
		for(let i = 0; i < QuickFolders.Model.selectedFolders.length; i++)
		{
			let folderEntry = QuickFolders.Model.selectedFolders[i];
			// test mail folder for existence
			let folder = null;
			try { 
				folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true);
			}
			catch(ex) {
				QuickFolders.Util.logException('GetMsgFolderFromUri failed with uri:' + folderEntry.uri, ex); 			
			}
			countTabs++;
			
			if (!folder || !QuickFolders.Util.doesMailFolderExist(folder)) {
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

	createMenuItem: function createMenuItem(value, label) {
		let menuItem = document.createElement("menuitem");
		menuItem.setAttribute("label", label);
		menuItem.setAttribute("value", value);

		return menuItem;
	} ,

	currentlySelectedCategory: null,

	// For Category Session persistance,
	// we have to overwrite tab.mode.persistTab || tab.mode.tabType.persistTab
	// persistFunc has 2 parameters:  tabState = persistFunc.call(tab.mode.tabType, tab);
	// see implementation in http://mxr.mozilla.org/comm-central/source/mail/base/content/mailTabs.js#166
	// mailTabType.modes["folder"].persistTab -> needs to point to our own wrapper function.
	// mailTabType.modes["folder"].restoreTab -> needs to point to our own wrapper function.
  // return true if updateFolders was called.
	selectCategory: function selectCategory(categoryName, rebuild) {
    if (this.currentlySelectedCategory && this.currentlySelectedCategory == categoryName)
      return false; // early exit. category is selected already! SPEED!
		this.currentlySelectedCategory = categoryName ? categoryName : QuickFolders.FolderCategory.UNCATEGORIZED ;
		if (categoryName == QuickFolders.FolderCategory.ALWAYS)
			return false;
		// add support for multiple categories (csv)
		let firstCat = this.currentlySelectedCategory.split('|'), 
		    selectedCat = firstCat[0],
        idx;
		QuickFolders.Util.logDebugOptional("categories","Selecting 1st of Categories: " + categoryName + ": " + firstCat[0] + "...");
		this.currentlySelectedCategory = selectedCat;
		this.updateFolders(rebuild, false);
    // ###################################
    this.lastTabSelected = null;
    this.onTabSelected(); // update selected tab?
    // this.styleSelectedTab(selectedButton);

		try {
			// store info in tabInfo, so we can restore it easier later per mail Tab
			let tabmail = document.getElementById("tabmail");
			idx = QuickFolders.tabContainer.selectedIndex;
      idx = idx ? idx : 0;
			// let's only store this if this is the first tab...
			if (idx==0)
				QuickFolders.Preferences.setLastSelectedCategory(selectedCat);
			let tab = QuickFolders.Util.getTabInfoByIndex(tabmail, idx); // in Sm, this can return null!
			let tabMode = QuickFolders.Util.getTabModeName(tab);
			if (tab &&
			    (tabMode == QuickFolders.Util.mailFolderTypeName || tabMode == "message")) {
				tab.QuickFoldersCategory = selectedCat; 
				// setTabValue does not exist (yet)
				//if (sessionStoreManager.setTabValue) 
				//	sessionStoreManager.setTabValue(tab, "QuickFoldersCategory", selectedCat);
				//
			}
		}
		catch(e) {
		  QuickFolders.Util.logDebugOptional("listeners.tabmail"," selectCategory failed; " + e);
		}
		QuickFolders.Util.logDebugOptional("categories", "Successfully selected Category: " + selectedCat + " on mail tab[" + idx + "]");
    return true;
	} ,

	get CurrentlySelectedCategoryName() {
		if(this.currentlySelectedCategory == QuickFolders.FolderCategory.ALL || this.currentlySelectedCategory == QuickFolders.FolderCategory.UNCATEGORIZED ) {
			return null;
		}
		else {
			return this.currentlySelectedCategory;
		}
	} ,

	shouldDisplayFolder: function shouldDisplayFolder(folderEntry) {
		let currentCat = this.currentlySelectedCategory;
		try {
			if(currentCat == null || currentCat == QuickFolders.FolderCategory.ALL) {
				return true;
			}
			else if(currentCat == QuickFolders.FolderCategory.UNCATEGORIZED  && !folderEntry.category) {
				return true;
			}
			else if(!QuickFolders.Model.isValidCategory(currentCat)) {
				return true;
			}
			else if (folderEntry.category
					&& folderEntry.category == QuickFolders.FolderCategory.ALWAYS
					&& currentCat != QuickFolders.FolderCategory.UNCATEGORIZED )
				return true;
			else if (!folderEntry.category)
				return false;
			else
				return (folderEntry.category.split('|').indexOf(currentCat) >= 0) ;  // check if its in the list
		}
		catch (e) {
			QuickFolders.Util.logDebug("shouldDisplayFolder caught error: " + e);
			return true;
		}
	} ,

	windowKeyPress: function windowKeyPress(e,dir) {
		let isAlt = e.altKey,
		    isCtrl = e.ctrlKey,
		    isShift = e.shiftKey;

		if (isCtrl && isAlt && dir!='up' && QuickFolders.Preferences.isUseRebuildShortcut) {
			if ((String.fromCharCode(e.charCode)).toLowerCase() == QuickFolders.Preferences.RebuildShortcutKey.toLowerCase()) {
				this.updateFolders(true,false);
				try {
					QuickFolders.Util.logDebugOptional("events", "Shortcuts rebuilt, after pressing "
					    + (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '')
					    + QuickFolders.Preferences.RebuildShortcutKey);
					QuickFolders.Util.showStatusMessage('QuickFolders tabs were rebuilt');
				} catch(e) {;};
			}
		}
		
		if (isCtrl && isAlt && dir!='up' && QuickFolders.Preferences.isFindFolderShortcut) {
			if ((String.fromCharCode(e.charCode)).toLowerCase() == QuickFolders.Preferences.FindFolderShortcutKey.toLowerCase()) {
			  QuickFolders.Interface.findFolder(true);
			}
		}
		

		if (!isCtrl && isAlt && (dir != 'up') && QuickFolders.Preferences.isUseNavigateShortcuts) {
			if (e.keyCode == 37)  // ALT + left
				this.goPreviousQuickFolder();

			if (e.keyCode == 39)  // ALT + right
				this.goNextQuickFolder();
		}


		if(QuickFolders.Preferences.isUseKeyboardShortcuts) {
			let shouldBeHandled =
				(!QuickFolders.Preferences.isUseKeyboardShortcutsCTRL && isAlt)
				||
				(QuickFolders.Preferences.isUseKeyboardShortcutsCTRL && isCtrl);

			if(shouldBeHandled) {
				let sFriendly = (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') + e.charCode + " : code=" + e.keyCode,
				    shortcut = -1;
				QuickFolders.Util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
				if (dir == 'up')
					shortcut = e.keyCode-48;
				if (dir == 'down')
					shortcut = e.charCode-48;

				if (shortcut >= 0 && shortcut < 10) {
					e.preventDefault();
					e.stopPropagation();
					if (dir == 'down') return;
					if(shortcut == 0) {
						shortcut = 10;
					}

					//alert(shortcut);
					let offset = QuickFolders.Preferences.isShowRecentTab ? shortcut+1 : shortcut,
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
	} ,

	getButtonByFolder: function getButtonByFolder(folder) {
		for(let i = 0; i < this.buttonsByOffset.length; i++) {
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

	toggleToolbar: function(button) {
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

	endsWith: function(sURI, sFolder) {
		if (sFolder.length == sURI.length - sURI.indexOf(sFolder))
			return true;
		return false;
	} ,

	// to fix positioning problems, we replace context with popup
	showPopup: function(button, popupId, evt) {
		QuickFolders.Util.logDebugOptional("interface", "showPopup(" + button.id + ", " + popupId + ", evt=" + evt +")" );
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

				for(i=0; i<nodes.length; i++) {
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
			
			QuickFolders.Util.logDebugOptional("popupmenus", "Open popup menu: " + p.tagName + "\nid: " + p.id + "\nlabel: " + p.label);
			// make it easy to find calling button / label / target element
			p.targetNode = button; 
			
			if (p.openPopup)
				p.openPopup(button,'after_start', 0, -1,true,false,evt);
			else
				p.showPopup(button, 0, -1,"context","bottomleft","topleft"); // deprecated method
		}
		
		// paint bucket pulls color on right-click
		if (button && button.parentNode.id == "QuickFolders-FoldersBox" )
			this.setPaintButtonColor(this.getButtonColor(button));
	} ,

	unReadCount:0, 
	totalCount:0, // to pass temp information from getButtonLabel to styleFolderButton
	getButtonLabel: function getButtonLabel(folder, useName, offset, entry) {
		try {
			let numUnread = folder.getNumUnread(false),
			    numUnreadInSubFolders = folder.getNumUnread(true) - numUnread,
			    numTotal = folder.getTotalMessages(false),
			    numTotalInSubFolders = folder.getTotalMessages(true) - numTotal,
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
  
	addFolderButton: function addFolderButton(folder, entry, offset, theButton, buttonId, fillStyle, isFirst) {
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null,		
		    tabIcon = (entry && entry.icon) ? entry.icon : '',
        useName = (entry && entry.name) ? entry.name : '',
		    label = this.getButtonLabel(folder, useName, offset, entry),
        FLAGS = QuickFolders.Util.FolderFlags;
		QuickFolders.Util.logDebugOptional("interface.tabs", "addFolderButton() label=" + label + ", offset=" + offset + ", col=" + tabColor + ", id=" + buttonId + ", fillStyle=" + fillStyle);
		let button = (theButton) ? theButton : document.createElement("toolbarbutton"); // create the button!
		button.setAttribute("label", label);
		//button.setAttribute("class",ToolbarStyle); // was toolbar-height!

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="",
		    sDisplayIcons = QuickFolders.Preferences.isShowToolbarIcons ? ' icon': '',
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
		// this needs to be done also when a minimal Update is done (button passed in)
		this.styleFolderButton(
			button, this.unReadCount, this.totalCount, specialFolderType, tabColor, 
			folder.hasNewMessages, tabIcon, entry
		);

		button.folder = folder;

		if (null == theButton || (null == button.getAttribute("oncommand"))) {
			button.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));
			this.setEventAttribute(button, "oncommand",'QuickFolders.Interface.onButtonClick(event.target, event, true);');
		}

		let popupId = this.makePopupId(folder, buttonId);
		button.setAttribute('context',''); // overwrites the parent context menu
		this.setEventAttribute(button, "oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
		if (buttonId == 'QuickFoldersCurrentFolder') {
			this.setEventAttribute(button, "onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
			this.setEventAttribute(button, "ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
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
			this.setEventAttribute(button, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("flex",100);
		}
    // we do this after appendChild, because labelElement needs to be generated in DOM
    this.addCustomStyles(button, entry);

		// popupset is re-done even on minimal update:
		this.addPopupSet(popupId, folder, entry, offset, button);

		if (!theButton) {
			// AG add dragging of buttons
			this.setEventAttribute(button, "ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");

			QuickFolders.Util.logDebugOptional("folders","Folder [" + label + "] added.\n===================================");
		}

		return button;
	} ,
	
	applyIcon: function applyIcon(button, filePath) {
	  try {
			let cssUri = '';
			if (filePath) {
				cssUri = 'url(' + filePath + ')';
			}
			button.style.listStyleImage = cssUri; // direct styling!
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
        button.style.setProperty('background-image', entry.cssBack); // , 'important'??
        let l = getLabel(button);
        if (l) 
          l.style.setProperty('color', entry.cssColor);  // , 'important'
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
		this.setEventAttribute(button, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
		this.SpecialToolbar.appendChild(button);
	} ,

	onButtonClick: function onButtonClick(button, evt, isMouseClick) {
		QuickFolders.Util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);
		try {
			if (QuickFolders.Interface.PaintModeActive) {
				QuickFolders.Util.logDebugOptional("mouseclicks","onButtonClick - Paint Mode!");
				let paintButton = this.PaintButton;
				let color;
				if (paintButton) {
					color = paintButton.getAttribute("colorIndex");
					if (!color) 
						color=0;
					QuickFolders.Interface.setButtonColor(paintButton, color);
				}
				QuickFolders.Model.setFolderColor(button.folder.URI, color, true); 
        if (evt.ctrlKey) { // go to next / previous color! (RAINBOW MODE)
          if (evt.shiftKey)
            color = (parseInt(color) - 1);
          else
            color = (parseInt(color) + 1);
          if (color>20) color = 1;
          if (color<1) color = 20;
          QuickFolders.Interface.setButtonColor(paintButton, color.toString());
        }
				return;
			}

			if (evt) {
				// CTRL forces a new mail tab
				if(evt.ctrlKey && isMouseClick) {
					QuickFolders.Util.logDebugOptional("mouseclicks","onButtonClick - ctrlKey was pressed");
					this.openFolderInNewTab(button.folder);
				}
			}
		}
		catch (ex) { QuickFolders.Util.logToConsole(ex); };
		if (button.folder) {
		  // interface speed hack: mark the button as selected right away!
			this.onTabSelected(button);
			QuickFolders_MySelectFolder(button.folder.URI);
		}
	} ,
	
	openFolderInNewTab: function openFolderInNewTab(folder) {
		let tabmail = QuickFolders.Util.$("tabmail");
		if (tabmail) {
		  let tabName = folder.name;
			switch (QuickFolders.Util.Application) {
				case 'Thunderbird':
				  tabmail.openTab(QuickFolders.Util.mailFolderTypeName, {folder: folder, messagePaneVisible: true, background: false, disregardOpener: true, title: tabName} ) ; 
					break;
				case 'SeaMonkey':
					tabmail.openTab(QuickFolders.Util.mailFolderTypeName, 7, folder.URI); // '3pane'
					QuickFolders.tabContainer.selectedIndex = tabmail.tabContainer.childNodes.length - 1;
					break;
				case 'Postbox':
					let win = QuickFolders.Util.getMail3PaneWindow();
					win.MsgOpenNewTabForFolder(folder.URI, null /* msgHdr.messageKey key*/, false /*Background*/ )
					break;
			}
		}
	} ,

	onRemoveBookmark: function onRemoveBookmark(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder,
		    msg = folder.name + " tab removed from QuickFolders";
		QuickFolders.Model.removeFolder(folder.URI, true);
		// this.updateFolders(true); already done!
		try { QuickFolders.Util.showStatusMessage(msg); } catch(e) {;};
	} ,
	
	onRemoveIcon: function onRemoveIcon(element) {
		if (element.id == 'context-quickFoldersRemoveIcon' // folder tree icon
		    ||
				element.id == 'QuickFolders-RemoveIcon') { // current folder bar
			let folders = GetSelectedMsgFolders(); 
			if (folders) {
				for each (let folder in folders) {
					QuickFolders.FolderTree.setFolderTreeIcon(folder, null);
					let entry = QuickFolders.Model.getFolderEntry(folder.URI);
					if (entry) {
						// if button visible, update it!
					  let folderButton = this.shouldDisplayFolder(entry) ? this.getButtonByFolder(folder) : null;
						QuickFolders.Model.setTabIcon (folderButton, entry, ''); // will only modify stored entry, if tab not visible.
					}
				}			
			}			
		}
		else {
			let folderButton = QuickFolders.Util.getPopupNode(element);
			let entry = QuickFolders.Model.getButtonEntry(folderButton);
			element.collapsed = true; // hide the menu item!
	    QuickFolders.Model.setTabIcon	(folderButton, entry, '');
			let folder = QuickFolders.Model.getMsgFolderFromUri(entry.uri)
			if (folder && QuickFolders.FolderTree)
				QuickFolders.FolderTree.setFolderTreeIcon(folder, null);
		}
	} ,
	
	onSelectIcon: function onSelectIcon(element,event) {
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		let folderButton, entry;
		let folders = null;
		if (element.id == 'context-quickFoldersIcon' // style a folder tree icon
		    ||
				element.id == 'QuickFolders-SelectIcon')  // current folder bar
		{ 
		  // get selected folder (form event?)
			folders = GetSelectedMsgFolders(); 
		}
		else {
			folderButton = QuickFolders.Util.getPopupNode(element);
			entry = QuickFolders.Model.getButtonEntry(folderButton);
		}
    let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		
		// callback, careful, no "this"
    let fpCallback = function fpCallback_done(aResult) {
      if (aResult == nsIFilePicker.returnOK) {
        try {
          if (fp.file) {
					  let file = fp.file.parent.QueryInterface(Components.interfaces.nsILocalFile);
						//localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
						try {
							//localFile.initWithPath(path); // get the default path
							QuickFolders.Preferences.setCharPrefQF('tabIcons.defaultPath', file.path);
							let iconURL = fp.fileURL; 
							if (folders) {
							  for each (let folder in folders) {
								  if (QuickFolders.FolderTree)
										QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL);
									let entry = QuickFolders.Model.getFolderEntry(folder.URI);
									if (entry) {
										// if button visible, update it!
										let folderButton = QuickFolders.Interface.shouldDisplayFolder(entry) ? QuickFolders.Interface.getButtonByFolder(folder) : null;
										QuickFolders.Model.setTabIcon (folderButton, entry, iconURL); // will only modify stored entry, if tab not visible.
									}
								}			
							}
							else {
								QuickFolders.Model.setTabIcon	(folderButton, entry, iconURL, element);
								let folder = QuickFolders.Model.getMsgFolderFromUri(entry.uri)
								if (folder && QuickFolders.FolderTree)
									QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL);
							}
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
		let localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		let lastPath = QuickFolders.Preferences.getCharPrefQF('tabIcons.defaultPath');
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
		let folderButton = QuickFolders.Util.getPopupNode(element);
		let entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setFolderLineBreak	(entry, !entry.breakBefore);
	} ,
	
	onSeparatorToggle: function onSeparatorToggle(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element);
		let entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setTabSeparator (entry, !entry.separatorBefore);
	} ,

	onRenameBookmark: function onRenameBookmark(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element),
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
				QuickFolders.Util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "	length = " + bracketedLen);
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
        folder = util.getPopupNode(element).folder,
        entry = QuickFolders.Model.getFolderEntry(folder.URI),
        button = util.getPopupNode(element),
        x = button.boxObject.screenX,
        y = button.boxObject.screenY + button.boxObject.height;
    // attach to bottom of the Tab (like a popup menu)
    util.popupProFeature("advancedTabProperties");
    let win = window.openDialog(
      'chrome://quickfolders/content/quickfolders-advanced-tab-props.xul',
      'quickfilters-advanced','titlebar=no,close=no,chrome,alwaysRaised,top=' + y +',left=' + x, 
      folder, entry);
    // the window may correct its x position if cropped by screen's right edge
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
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		this.compactFolder(folder, command);
	} ,

	onMarkAllRead: function onMarkAllRead(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		try {
			let f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
			if (QuickFolders.Util.Application == 'Postbox')
				f.markAllMessagesRead();
			else
				f.markAllMessagesRead(msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onMarkAllRead " + e);
		}
	} ,

	onCreateSubFolder: function onCreateSubFolder(folder) {
		try {
			let f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
			folder.createSubfolder("test", msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onCreateSubFolder " + e);
		}
	} ,

	onDeleteFolder: function onDeleteFolder(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element),
		    uri = folderButton.folder.URI,
		    result = null;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folderButton.folder.URI);
			MsgDeleteFolder();
		}
		else
			this.globalTreeController.deleteFolder(folderButton.folder);

		// if folder is gone, delete quickFolder
		if (!QuickFolders.Model.getMsgFolderFromUri(uri, true))
			QuickFolders.Interface.onRemoveBookmark(folderButton);

	} ,

	onRenameFolder: function onRenameFolder(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder,
		    theURI = folder.URI;
		if (this.globalTreeController  && this.globalTreeController.renameFolder) {
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
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		QuickFolders.compactLastFolderSize = folder.sizeOnDisk;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = 'emptyTrash';

		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgEmptyTrash();
		}
		else {
			this.globalTreeController.emptyTrash(folder);
		}

		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener

	} ,

	onEmptyJunk: function onEmptyJunk(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		if (QuickFolders.Util.Application == 'Postbox') { 
			let getSelFunction;
			try {
			  // functions from folderPaneContext
			  // Postbox hack: we pretend the tree folder was selected by temporarily replacing GetSelectedFolderURI
			  getSelFunction = GetSelectedFolderURI;
				GetSelectedFolderURI = function() { return folder.URI; };
				deleteAllInFolder('emptyJunk');
			}
			catch(ex) { QuickFolders.Util.logException('Exception in onEmptyJunk ', ex);  };
			if (getSelFunction)
				GetSelectedFolderURI = getSelFunction;
		}
		else {
			this.globalTreeController.emptyJunk(folder);
		  this.compactFolder(folder, 'emptyJunk');
		}
	} ,

	onDeleteJunk: function onDeleteJunk(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		if (this.globalTreeController && this.globalTreeController.deleteJunk)
			this.globalTreeController.deleteJunk(folder);
		else
			deleteJunkInFolder();
	} ,

	onEditVirtualFolder: function onEditVirtualFolder(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editVirtualFolder(folder);
	} ,
  
	onFolderProperties: function onFolderProperties(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editFolder(null,folder);
	} ,
	
	openExternal: function openExternal(aFile) {
    try {
      QuickFolders.Util.logDebug('openExternal()' + aFile);
      let uri = Cc["@mozilla.org/network/io-service;1"].
                getService(Ci.nsIIOService).newFileURI(aFile),
          protocolSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                        getService(Ci.nsIExternalProtocolService);
      protocolSvc.loadUrl(uri);
    }
    catch(ex) {
      QuickFolders.Util.logDebug('openExternal() failed:\n' + ex);
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
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		// code from gDownloadViewController.showDownload(folder);
    QuickFolders.Util.logDebug('onFolderOpenLocation()\nfolder: ' + folder.name +'\nPath: ' + folder.filePath.path);
		let f = this.getLocalFileFromNativePathOrUrl(folder.filePath.path); // aDownload.getAttribute("file")
		try {
			// Show the directory containing the file and select the file
			f.reveal();
		} catch (e) {
      QuickFolders.Util.logDebug('onFolderOpenLocation() - localfile.reveal failed: ' + e);
			// If reveal fails for some reason (e.g., it's not implemented on unix or
			// the file doesn't exist), try using the parent if we have it.
			let parent = f.parent.QueryInterface(Ci.nsILocalFile);
			if (!parent) {
        QuickFolders.Util.logDebug('onFolderOpenLocation() - no folder parent - giving up.');
				return;
      }

			try {
				// "Double click" the parent directory to show where the file should be
        QuickFolders.Util.logDebug('onFolderOpenLocation() - parent.launch()');
				parent.launch();
			} catch (ex) {
        QuickFolders.Util.logDebug('onFolderOpenLocation() - parent.launch() failed:' + ex);
				// If launch also fails (probably because it's not implemented), let the
				// OS handler try to open the parent
				this.openExternal(parent);
			}
		}		
		
	} ,

	onGetMessages: function onGetMessages(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		// Get new Messages (Inbox)
		if ((	folder.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP
				||
				folder.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_INBOX)) 
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
    let folder = QuickFolders.Util.getPopupNode(element).folder;
    // In Thunderbird the default message window is stored in the global variable msgWindow.
    let mw = msgWindow; // window.msgWindow ?
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
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		this.rebuildSummary(folder);
	} ,

	onNewFolder: function onNewFolder(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgNewFolder(NewFolder);
		}
		else
			this.globalTreeController.newFolder(folder);
	},

	onSearchMessages: function onSearchMessages(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		// Tb:  // gFolderTreeController.searchMessages();
		MsgSearchMessages(folder);
	} ,
	
	buildPaletteMenu: function buildPaletteMenu(currentColor, existingPopupMenu) {
		let logLevel = (typeof existingPopupMenu === 'undefined') ? "interface.tabs" : "interface";
    let popupTitle = existingPopupMenu ? existingPopupMenu.id : 'none';
		QuickFolders.Util.logDebugOptional(
			logLevel, 
			"buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + popupTitle + ")");
		let menuColorPopup = existingPopupMenu ? existingPopupMenu : document.createElement("menupopup");
		try {
			// create color pick items
			let jCol;
			for (jCol=0; jCol<=20;jCol++) {
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
			QuickFolders.Util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception in buildPaletteMenu ', ex); 
		}
		
		return menuColorPopup;
		
	} ,

	// broke out for re-use in a new Mail folder commands button on the current folder toolbar 
	//   MailCommands = pass the popup menu in which to create the menu
	//   folder = related folder
	//   button = parent button
	appendMailFolderCommands: function appendMailFolderCommands(MailCommands, folder, isRootMenu, button, menupopup) {
		let topShortCuts = 0,
		    utils = QuickFolders.Util,
		    prefs = QuickFolders.Preferences,
        menuitem;
		// Empty Trash
		if (folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_TRASH
			&&
			prefs.getBoolPref("folderMenu.emptyTrash")) 
		{
			menuitem = this.createMenuItem_EmptyTrash();
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++;
		}

		// Get Newsgroup Mail
		if ((folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP)
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
      if ((folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_INBOX)
        &&
        !(folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)
        &&
        prefs.getBoolPref("folderMenu.getMessagesForInbox"))
      {
        menuitem = this.createMenuItem_GetMail(folder);
        if (menuitem) {
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
      }
      
      // download all
      // server.type = protocol type, that is "pop3", "imap", "nntp", "none", and so on
      if (folder.server.type !== 'nntp' // newsgroups have their own "Get Messages" Command
        &&
          folder.server.type !== 'pop3' 
        &&
          folder.server.type !== 'none'  // local folders
        &&
          !(folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_INBOX)) { 
        menuitem = document.createElement('menuitem');
        menuitem.className='mailCmd menuitem-iconic';
        menuitem.setAttribute("id","folderPaneContext-downloadAll");
        this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDownloadAll(this);");
        let downloadLabel = this.getUIstring("qfDownloadAll", "Download Now") + " [" + folder.server.type + "]";
        menuitem.setAttribute('label', downloadLabel);
        // MailCommands.appendChild(menuitem);
        // if (isRootMenu)
        menupopup.appendChild(menuitem);
        topShortCuts ++ ;
      }    
      
      // MarkAllRead (always on top)
      if (!(folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_TRASH)
        && 
        !(folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_JUNK)
        &&
        prefs.getBoolPref("folderMenu.markAllRead"))
        // && folder.getNumUnread(false)>0
      {
        menuitem = this.createMenuItem_MarkAllRead((folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)==true);
        menupopup.appendChild(menuitem);
        topShortCuts ++ ;
      }
    }

		if (utils.Application!="Postbox"
		    &&
		    prefs.getBoolPref("folderMenu.emptyJunk"))
		{
			// EmptyJunk
			if (folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
				menuitem = this.createMenuItem_EmptyJunk();
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu)
						topShortCuts ++ ;
				}
			}
			else if (!(folder.flags & (utils.FolderFlags.MSG_FOLDER_FLAG_TRASH | utils.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP))
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
		if (folder.flags & utils.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) {
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
			this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onNewFolder(this);");
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
		let srchMenu = QuickFolders.Util.getMail3PaneWindow().document.getElementById("folderPaneContext-searchMessages")
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
	
	addPopupSet: function addPopupSet(popupId, folder, entry, offset, button) {
		let prefs = QuickFolders.Preferences;
		let menupopup = document.createElement('menupopup');
		menupopup.setAttribute('id',popupId);
		menupopup.setAttribute('position','after_start'); //

		menupopup.className = 'QuickFolders-folder-popup';
		menupopup.folder = folder;

		QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name);

		let menuitem;
		let QuickFolderCmdMenu = null;

		if (button.id != "QuickFoldersCurrentFolder") {

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

			QuickFolders.Util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

			// SelectColor
			QuickFolders.Util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "...");
			let entry = QuickFolders.Model.getFolderEntry(folder.URI),
			    menuColorPopup = this.buildPaletteMenu(entry.tabColor ? entry.tabColor : 0);
			colorMenu.appendChild(menuColorPopup);
		  this.initElementPaletteClass(QFcommandPopup, button);


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
      menuitem.setAttribute('tag', 'qfIconAdvanced');
			menuitem.setAttribute('label',this.getUIstring('qfTabAdvancedOptions', 'Advanced Properties...'));
      menuitem.type = 'checkbox';
      if (entry.flags) {
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


		let fi = folder.QueryInterface(Components.interfaces.nsIMsgFolder),
        MailCommands, isRootMenu;

		/* In certain cases, let's append mail folder commands to the root menu */
		if (fi.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) {
			// newsgroups have no subfolders anyway
			MailCommands = menupopup;
			isRootMenu = true;
		}
		else {
			MailCommands = document.createElement('menupopup');
			MailCommands.className = 'QuickFolders-folder-popup mailCmd menu-iconic';
			isRootMenu = false;
		}



		/***  MAIL FOLDER COMMANDS	 ***/
		// 0. BUILD MAIL FOLDER COMMANDS
		this.appendMailFolderCommands(MailCommands, fi, isRootMenu, button, menupopup);


		// special folder commands: at top, as these are used most frequently!
		// 1. TOP LEVEL SPECIAL COMMANDS
		let topShortCuts = 0;
		if (fi.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_TRASH) {
			menuitem = this.createMenuItem_EmptyTrash();
			menupopup.appendChild(menuitem);
			topShortCuts ++ ;
		}

		if (fi.flags & QuickFolders.Util.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
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

		//moved this out of addSubFoldersPopup for recursive menus
		if (fi.hasSubFolders) {
			QuickFolders.Util.logDebugOptional("popupmenus","Creating SubFolder Menu for " + folder.name + "...");
			menupopup.appendChild(document.createElement('menuseparator'));
			this.debugPopupItems=0;
			this.addSubFoldersPopup(menupopup, folder, false);
			QuickFolders.Util.logDebugOptional("popupmenus","Created Menu " + folder.name + ": " + this.debugPopupItems + " items.\n-------------------------");
		}

		if (offset>=0)
			this.menuPopupsByOffset[offset] = menupopup;

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
		    folder = QuickFolders.Util.CurrentFolder;
		menupopup.setAttribute('position','after_start'); //
		menupopup.id = 'QuickFolders-CurrentMailFolderCommandsPopup';
		
		menupopup.className = 'QuickFolders-folder-popup';
		
		button.folder = folder;

		QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for Mail Commands - " + folder.name);
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
		try {
			// find out the server name
			// let's clone it ?
			// let getMailMenuItem=newMenuItem.cloneNode(true);
			let server = folder.server,
			    getMailMenuItem= document.createElement('menuitem');
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
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onMarkAllRead(this)");
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
		try {
			QuickFolders.Util.logDebugOptional("dragToNew","addDragToNewFolderItem	" + folder.prettiestName
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
						QuickFolders.Util.logDebugOptional("dragToNew","Not enabled: drag & create new folder for server's of type: " + server.type);
						return;
					}
			}

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
					// use parent folder URI as each starting point
					this.setEventAttribute(createFolderMenuItem, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(createFolderMenuItem, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.popupDragObserver);");  // only case where we use the dedicated observer of the popup!

					popupMenu.appendChild(createFolderMenuItem);
				}
			}
			
		}
		catch(ex) {QuickFolders.Util.logException('Exception in addDragToNewFolderItem (adding drag Menu items): ', ex); }
	} ,

	// isDrag: if this is set to true, then the command items are not included
	addSubFoldersPopupFromList: function addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, forceAlphaSort, isRecentFolderList) {
    let tr = {"\xE0":"a", "\xE1":"a", "\xE2":"a", "\xE3":"a", "\xE4":"ae", "\xE5":"ae", "\xE6":"a",
						  "\xE8":"e", "\xE9":"e", "\xEA":"e", "\xEB":"e",
						  "\xF2":"o", "\xF3":"o", "\xF4":"o", "\xF5":"o", "\xF6":"oe",
						  "\xEC":"i", "\xED":"i", "\xEE":"i", "\xEF":"i",
						  "\xF9":"u", "\xFA":"u", "\xFB":"u", "\xFC":"ue", "\xFF":"y",
						  "\xDF":"ss", "_":"/", ":":"."},
        killDiacritics = function(s) {
			    return s.toLowerCase().replace(/[_\xE0-\xE6\xE8-\xEB\xF2-\xF6\xEC-\xEF\xF9-\xFC\xFF\xDF\x3A]/gi, function($0) { return tr[$0] })
		    },
		    subfolder,
		    done = false,
        prefs = QuickFolders.Preferences,
        util = QuickFolders.Util,
		// folder detail
		// 0 - just prettyName
		// 1 - prettyName - Account
		// 2 - full path
		    displayFolderPathDetail = 
          isRecentFolderList 
          ? prefs.getIntPref("recentfolders.folderPathDetail") 
          : 0;

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
				    maxDetail = 3;
				if (displayFolderPathDetail > maxDetail)
					displayFolderPathDetail = maxDetail;
				switch (displayFolderPathDetail) {
					case 0:
						menuLabel = subfolder.name;
						break;
					case 1:
						let hostString = subfolder.rootFolder.name;
						menuLabel = subfolder.name + ' - ' + hostString;
						break;
					case 2:
						hostString = subfolder.rootFolder.name;
						let f = subfolder.URI.indexOf('://');
						if (f) {
							let ff = subfolder.URI.substr(f+3).indexOf('/');
							if (ff) 
								f = f + 3 + ff + 1;
						}
						menuLabel = hostString + ' - ' + decodeURI(subfolder.URI.substr(f));
						break;
					case 3:
						menuLabel = subfolder.URI;
						break;
				}
				if (isRecentFolderList && prefs.isDebugOption('recentFolders.detail'))
					menuLabel = subfolder.getStringProperty("MRUTime") + ' - ' + menuLabel;

				menuitem.setAttribute('label', menuLabel); //+ subfolder.URI
				menuitem.setAttribute("tag","sub");
				
				try {
					let iconURL = subfolder.getStringProperty("iconURL");
					if (iconURL) {
						menuitem.style.setProperty('list-style-image', iconURL);
					}
				} 
				catch(ex) {;}

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
				this.setEventAttribute(menuitem, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
				// this.setEventAttribute(menuitem, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

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
						let iconURL = subfolder.getStringProperty("iconURL");
						if (iconURL) {
							subMenu.style.setProperty('list-style-image', iconURL);
						}
					} 
					catch(ex) {;}

					this.setEventAttribute(subMenu, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(subMenu, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
					this.setEventAttribute(subMenu, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

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
			catch(ex) {util.logDebug('Exception in addSubFoldersPopup: ' + ex	+ '\nFile: ' + ex.FileName + '	[' + ex.lineNumber + ']'); done = true;}
		}
	} ,

	// add all subfolders (1st level, non recursive) of folder to popupMenu
	addSubFoldersPopup: function addSubFoldersPopup(popupMenu, folder, isDrag) {
		if (folder.hasSubFolders) {
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
		let p = Target;
		QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "Close menus for node=" + p.nodeName
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
					QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "parenttag=" + p.tagName);
					QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "node= " + p.nodeName);
					if (p.tagName == 'menupopup' && p.hidePopup) {
						QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "Try hide parent Popup " + p.getAttribute('label'));
						p.hidePopup();
						}
					}
				break;

			case 'toolbarbutton':
				QuickFolders_globalHidePopupId='moveTo_'+Target.folder.URI;
				QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				let popup = document.getElementById(QuickFolders_globalHidePopupId);
				if (popup)
					try {
						popup.parentNode.removeChild(popup); //was popup.hidePopup()
						QuickFolders_globalHidePopupId='';
					}
					catch(e) {
						QuickFolders.Util.logDebugOptional ("popupmenus.collapse", "Could not remove popup of " + QuickFolders_globalHidePopupId );
					}
				break;

		}
	} ,

	onSelectParentFolder: function onSelectParentFolder(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("popupmenus", "onSelectParentFolder: " + folderUri);
		this.onSelectSubFolder(folderUri, evt);
		evt.stopPropagation(); // avoid oncommand bubbling up!
		QuickFolders.Interface.collapseParentMenus(evt.target);
	} ,

	// select subfolder (on click)
	onSelectSubFolder: function onSelectSubFolder(folderUri, evt) {
    let util = QuickFolders.Util;
		util.logDebugOptional ("popupmenus", "onSelectSubFolder: " + folderUri);
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
		let menupopup;
    let util = QuickFolders.Util;
    let interf = QuickFolders.Interface;
	  if (event.keyCode) switch (event.keyCode) {
      case VK_ENTER:
			  util.logDebugOptional("interface.findFolder","VK_ENTER");
        interf.findFolderName(event.target, true);
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
			  interf.findFolder(false);
			  interf.hideFindPopup();
        interf.updateFindBoxMenus(false);
        interf.toggleMoveMode(false);
			  break;
		}
	} ,
	
	hideFindPopup: function hideFindPopup() {
	  let menupopup = document.getElementById('QuickFolders-FindPopup');
		let state = menupopup.getAttribute('state');
    QuickFolders.Util.logDebugOptional("interface.findFolder","hideFindPopup - menupopup status = " + state);
		//if (state == 'open' || state == 'showing') 
    try {
			menupopup.hidePopup();
		} catch(ex) { QuickFolders.Util.logException('hideFindPopup', ex); }
	} ,

  // forceFind - enter key has been pressed, so we want the first match to force a jump
	findFolderName: function findFolderName(searchBox, forceFind) {
		function addMatchingFolder(matches, folder) {
			let folderNameSearched = folder.prettyName.toLocaleLowerCase();
			let matchPos = folderNameSearched.indexOf(searchString);
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
					let parentName = (folder.parent && folder.parent.prettyName) ? folder.parent.prettyName + ' - ' : '';
					matches.push( { name:parentName + folder.prettyName, lname:folderNameSearched, uri:folder.URI, rank:rank, type:'folder' } );
				}
			}
		}
		let Ci = Components.interfaces;
		let isSelected = false;
	  let searchString = searchBox.value.toLocaleLowerCase();
		if (!searchString) 
			return;
		QuickFolders.Util.logDebug("findFolder - " + searchString);
		let account = null;
		let identity = null;
		let matches = [];
 		
		// change: if only 1 character is given, then the name must start with that character!
		// first, search QuickFolders
		let folderNameSearched;
		for (let i=0; i<QuickFolders.Model.selectedFolders.length; i++) {
			let folderEntry = QuickFolders.Model.selectedFolders[i];
		  folderNameSearched = folderEntry.name.toLocaleLowerCase();
			// folderEntry.uri
			let matchPos = folderNameSearched.indexOf(searchString);
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
    let isFiling = QuickFolders.quickMove.isActive;
    /********* old jump point *********/
		// if 1 unique full match is found, we can automatically jump there
		if ((matches.length == 1)  && (!isFiling)
        && (matches[0].lname == searchString      // one exact match
           || (matches[0].lname.indexOf(searchString)==0 && forceFind)) // match starts with search string + [Enter] key was pressed
       ) {
			// go to folder
			isSelected = QuickFolders_MySelectFolder(matches[0].uri);
      setTimeout(function() {
        QuickFolders.Interface.tearDownSearchBox();
      }, 400);
      return; // ????
		}
		
    // if quickMove is active we need to suppress matches from newsgroups (as we can't move mail to them)
    if(QuickFolders.Util.Application == 'Postbox') {
      let AF = QuickFolders.Util.allFoldersIterator(isFiling);
      for (let fi=0; fi<AF.length; fi++) {
        addMatchingFolder(matches, AF.queryElementAt(fi,Components.interfaces.nsIMsgFolder));
      }
    }
    else
      for (let folder in QuickFolders.Util.allFoldersIterator(isFiling)) {
        addMatchingFolder(matches, folder);
      }
		
		// rebuild popup
		let menupopup;
		if (true) {
			matches.sort(function (a,b) { if (b.rank - a.rank == 0) return b.lname - a.lname; return b.rank - a.rank; });
			
			menupopup = QuickFolders.Util.$("QuickFolders-FindPopup");
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
            menuitem.className = 'menuitem-iconic'
					menupopup.appendChild(menuitem);
				}
			}
			menupopup.setAttribute('ignorekeys', 'true');
			if (typeof menupopup.openPopup == 'undefined')
				menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
			else
				menupopup.openPopup(searchBox,'after_start', 0, -1,true,false);  // ,evt
		}
		if (matches.length == 1) { 
      if (!isFiling && matches[0].lname.indexOf(searchString)==0 && forceFind) {
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
    let interf = QuickFolders.Interface;
    interf.findFolder(false);
    interf.hideFindPopup();
    interf.updateFindBoxMenus(false);
    interf.toggleMoveMode(false);
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
		QuickFolders.Util.logDebug("selectFound - " + event);
		element.setAttribute('ignorekeys', 'true');
	  let el = event.target;
		let URI = el.getAttribute('value');
    let isSelected;
    /**************  New quickMove Functionality  **************/
    let isQuickMove = (QuickFolders.quickMove.isActive);
    if (isQuickMove) { 
      QuickFolders.quickMove.execute(URI, false); // folder.uri, isCopy
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
			+ 'Do you want to correct this manually?'
		let inputText = URI;
		
		let result = window.prompt(confirmationText, inputText);
		switch(result) {
			case null:
				break;
			case "":
				break;
			default:
				let folderEntry;
				let folderEntries = QuickFolders.Model.selectedFolders;
				let found = false;
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

  // actionType - 'quickMove' or 'findFolder'. Empty when used for disabling the find / jump method
	findFolder: function findFolder(show, actionType) {
    QuickFolders.Util.logDebugOptional("interface.findFolder", "findFolder(" + show + " , " + actionType + ")");
		try {
			let ff = QuickFolders.Util.$("QuickFolders-FindFolder");
			ff.collapsed = !show;
			if (show) {
				if (actionType) {
					QuickFolders.Util.popupProFeature(actionType); // Pro Version Notification
          let isMove = (actionType == 'quickMove');
          QuickFolders.Interface.toggleMoveMode(isMove);
				}
        QuickFolders.Interface.updateFindBoxMenus(show);
        
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
        QuickFolders.Interface.updateFindBoxMenus(show);
			}
		}
		catch(ex) {
			QuickFolders.Util.logException("findFolder (" + show + ", " + actionType + ") failed.", ex);
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
						  'chrome,titlebar,toolbar,centerscreen,resizable,dependent',QuickFolders); // dependent = modeless
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
	// passing in forceButton is a speed hack for SeaMonkey:
	onTabSelected: function onTabSelected(forceButton) {
		let folder, selectedButton;
		try  {
			// avoid TB logging unnecessary errors in Stack Trace
			if ((QuickFolders.Util.Application == 'Thunderbird') && !gFolderTreeView )
				return;
			folder = forceButton ? forceButton.folder : GetFirstSelectedMsgFolder();
		}
		catch (e) { return; }
		if (null == folder) return; // cut out lots of unneccessary processing!
		selectedButton = forceButton ? forceButton : this.getButtonByFolder(folder);
    
    if (this.lastTabSelected == folder) {
      this.styleSelectedTab(selectedButton);
      return; // avoid duplicate selection actions
    }
		
		// update unread folder flag:
		let showNewMail = QuickFolders.Preferences.isHighlightNewMail;
		let newItalic = QuickFolders.Preferences.isItalicsNewMail;
		
		let  tabStyle = QuickFolders.Preferences.ColoredTabStyle; // filled or striped
		for(let i = 0; i < this.buttonsByOffset.length; i++) {
			let button = this.buttonsByOffset[i];
			// filled style, remove striped style
			if ((tabStyle != QuickFolders.Preferences.TABS_STRIPED) && (button.className.indexOf("selected-folder")>=0))
				button.className = button.className.replace(/\s*striped/,"");

			// striped style: make sure everyting is striped
			if ((tabStyle == QuickFolders.Preferences.TABS_STRIPED) && (button.className.indexOf("striped")<0))
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

		this.initCurrentFolderTab(this.CurrentFolderTab, folder, selectedButton);
    if (!QuickFolders.Preferences.supportsCustomIcon) {
      let ic = QuickFolders.Util.$("context-quickFoldersIcon");
      if (ic) ic.collapsed = true;
      ic = QuickFolders.Util.$("context-quickFoldersRemoveIcon")
      if (ic) ic.collapsed = true;
    }
    
    // avoid re-entry
    this.lastTabSelected = folder;
    
		// single message window:
		if (QuickFolders.Preferences.isShowCurrentFolderToolbar(true)) {
			let winMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			let singleMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
			if (singleMessageWindow && singleMessageWindow.gMessageDisplay && singleMessageWindow.gMessageDisplay.displayedMessage) {
				let singleMessageCurrentFolderTab = singleMessageWindow.document.getElementById('QuickFoldersCurrentFolder');
				this.initCurrentFolderTab(singleMessageCurrentFolderTab, singleMessageWindow.gMessageDisplay.displayedMessage.folder);
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
    try {
      QuickFolders.Util.logDebugOptional("interface", 'initCurrentFolderTab(' + (folder ? folder.prettyName : 'null') + ')');
      
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
        currentFolderTab.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));
      } 
      else {
        // search mode: get title of tab after a short delay
        setTimeout(function() { 
          let tabmail = document.getElementById("tabmail");
          let idx = QuickFolders.tabContainer.selectedIndex;
          idx = idx ? idx : 0;
          let tabs = tabmail.tabInfo ? tabmail.tabInfo : tabmail.tabOwners;
          let info = QuickFolders.Util.getTabInfoByIndex(tabmail, idx);  
          currentFolderTab.setAttribute("label", tabInfo.title ? tabInfo.title : "?"); 
        }, 250);
        
        if (QuickFolders.Util.getTabModeName(tabInfo) == "glodaList") {
          // add search icon!
          currentFolderTab.style.listStyleImage = "url('chrome://global/skin/icons/Search-glass.png')";
          currentFolderTab.style.MozImageRegion = "rect(0px, 16px, 16px, 0px)";
        }
        // disable navigation buttons
        disableNavigation(true);
        currentFolderTab.setAttribute("tooltiptext", "");
      }
      
      // QuickFolders.Interface.addPopupSet('QuickFolders-folder-popup-currentFolder', msgFolder, -1, currentFolderTab);
      currentFolderTab.className = currentFolderTab.className.replace("striped", "");
      currentFolderTab.className = currentFolderTab.className.replace("selected-folder", "");
    }
    catch(ex) {
      QuickFolders.Util.logException("Quickfolders.initCurrentFolderTab()", ex);
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
    
    for (let i=0; i<cats.length; i++) {
      if (i) newC += '|'; // appending next ones delimited with pipe character
      if (cats[i].trim() == this.currentlySelectedCategory.trim()) continue;
      if (removeAlwaysShow && cats[i].trim() == QuickFolders.FolderCategory.ALWAYS) continue;
      newC += cats[i];
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
					// options dialog case: parent it menupopup
					//   showPopup should have set this as 'targetNode'
          if (!parent.targetNode) debugger;
					let targetNode = parent.targetNode;
					// now paint the button
				  QuickFolders.Options.preparePreviewTab(null, null, targetNode.id, col); // [Bug 25589]
				  //QuickFolders.Options.preparePreviewPastel(QuickFolders.Preferences.getBoolPref('pastelColors'));
					//   retrieve about config key to persist setting;
					let styleKey =  targetNode.getAttribute('stylePrefKey'),
				      stylePref = 'style.' + styleKey + '.',
              userStyleKey = (styleKey == 'DragOver') ? 'DragTab' : styleKey; // fix naming inconsistency
				  if (stylePref)
					  QuickFolders.Preferences.setIntPref(stylePref + 'paletteEntry', col);
					
					// special rule: if this is the Active Tab Color, let's also determine the active BG (bottom pixel of gradient!)
					let paletteClass = this.getPaletteClassCss(styleKey),
					    ruleName = '.quickfolders-flat ' + paletteClass + '.col' + col,
					    engine = QuickFolders.Styles;
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
						if (cp) {
							cp.color = selectedFontColor;
							QuickFolders.Preferences.setUserStyle(userStyleKey, "color", selectedFontColor);
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
								if (cp) {
									cp.color = rgb;
									QuickFolders.Preferences.setUserStyle(userStyleKey, "background-color", rgb);
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
						QuickFolders.Preferences.setUserStyle(styleKey, "background-color", 'rgb(255,255,255)');
						QuickFolders.Interface.updateMainWindow();
					}
          // immediate update of background color for bottom border
          if (styleKey == 'ActiveTab' && resultBackgroundColor) {
            QuickFolders.Options.styleUpdate('ActiveTab','background-color', resultBackgroundColor, 'activetabs-label');
          }
          
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
		    hoverBackColor = QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","#F90"),
		    tabStyle = QuickFolders.Preferences.ColoredTabStyle,
		    noColorClass = (tabStyle != QuickFolders.Preferences.TABS_STRIPED) ? 'col0' : 'col0striped',
		    hoverColor = QuickFolders.Preferences.getUserStyle(templateTabClass, "color", "#000000"),
        avoidCurrentFolder = ':not(#QuickFoldersCurrentFolder)';
		
		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','background-color', hoverBackColor,true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover','background-color', hoverBackColor,true);
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover > label','color', hoverColor, true);

		let paintButton = isPaintMode ? this.PaintButton : null;
			
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "style." + templateTabClass + ".paletteType = " 
		  + QuickFolders.Preferences.getIntPref('style.' + templateTabClass + '.paletteType'));

		if (QuickFolders.Preferences.getIntPref('style.HoveredTab.paletteType') || isPaintMode) {
			let paletteEntry = 
				isPaintMode 
				? paintButton.getAttribute("colorIndex")
				: QuickFolders.Preferences.getIntPref('style.HoveredTab.paletteEntry');
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
			if (tabStyle == QuickFolders.Preferences.TABS_STRIPED) {
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
		    // let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, 'color');
		    dragOverColor = QuickFolders.Preferences.getUserStyle("DragTab","color","White");
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over','background-color', QuickFolders.Preferences.getUserStyle("DragTab","background-color","#E93903"),true);
    let noColorClass = 'col0'; // ####
    engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':-moz-drag-over > label','color', dragOverColor, true); // ####
		
		if (QuickFolders.Preferences.getIntPref('style.DragOver.paletteType')) {
			let paletteClass = this.getPaletteClassCss('DragOver'),
			    paletteEntry = QuickFolders.Preferences.getIntPref('style.DragOver.paletteEntry'),
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
        inactiveGradientColor = null,
		    inactiveBackground = QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace"),
		    inactiveColor = QuickFolders.Preferences.getUserStyle("InactiveTab","color","black"),
		    paletteClass = this.getPaletteClassCss('InactiveTab'),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == QuickFolders.Preferences.TABS_STRIPED) && QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType')<3, 
		    noColorClass = (isTabsStriped) ? 'col0striped' : 'col0',
		    avoidCurrentFolder = ''; // = ':not(#QuickFoldersCurrentFolder)'; // we omit paletteClass for uncolored tabs:

		// transparent buttons: means translucent background! :))
		if (QuickFolders.Preferences.getBoolPref('transparentButtons')) 
			inactiveBackground = QuickFolders.Util.getRGBA(inactiveBackground, 0.25) ; 

		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton','background-color', inactiveBackground, true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder','background-color', inactiveBackground, true);
		
		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType')>0) {
			
			let paletteEntry = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteEntry');
			if (tabStyle === QuickFolders.Preferences.TABS_STRIPED)
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
		if (isTabsStriped) {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ' > label','color', inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ' > label','color');
		}
		
	} ,
	
	updateUserStyles: function updateUserStyles() {
    let util = QuickFolders.Util;
		try {
			util.logDebugOptional ("interface","updateUserStyles()");
			// get MAIN STYLE SHEET
			let styleEngine = QuickFolders.Styles,
			    ss = this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles'),
          prefs = QuickFolders.Preferences;
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
			    colActiveBG = prefs.getUserStyle("ActiveTab","background-color","Highlight");
			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[background-image].selected-folder','border-bottom-color', colActiveBG, true);
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
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-topleft'     : 'border-top-left-radius', topRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-topright'    : 'border-top-right-radius', topRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-bottomleft'  : 'border-bottom-left-radius', bottomRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-bottomright' : 'border-bottom-right-radius', bottomRadius, true);

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
			styleEngine.setElementStyle(ss, 'toolbar.quickfolders-flat','border-bottom-color', colActiveBG, true); // only in main toolbar!

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
			
			this.updateCurrentFolderBar(ss);
			
      // change to numeric
			let minToolbarHeight = prefs.getCharPrefQF('toolbar.minHeight');
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
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(firstOne.uri);
	} ,

	goPreviousQuickFolder: function goPreviousQuickFolder() {
		let aFolder = QuickFolders.Util.CurrentFolder,
		    found = false,
		    firstOne = null;
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
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))
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
	
	displayNavigationToolbar: function displayNavigationToolbar(visible, singleMessage) {
    if (typeof singleMessage === 'undefined') singleMessage = false; // Unfortunately Postbox cannot do default parameters
		QuickFolders.Util.logDebugOptional("interface", "displayNavigationToolbar(visible=" + visible + ", singleMessage=" + singleMessage + ")");
		let winMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						 .getService(Components.interfaces.nsIWindowMediator);
		
		let mail3PaneWindow = winMediator.getMostRecentWindow("mail:3pane");
		let mailMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
    let doc;
		if (singleMessage) {
			if (null == mailMessageWindow) return; // single message window not displayed
			doc = mailMessageWindow.document;
		}
		else {
			if (null == mail3PaneWindow) return; // main window not displayed
			doc = mail3PaneWindow.document;
		}
		
		if (!doc) return;
		
		// doc = (mail3PaneWindow ? mail3PaneWindow.document : QuickFolders.doc);

		let mm = doc.getElementById("multimessage");
    let doesMultiExist = (mm != null);
    let currentFolderBar, unusedFolderBar;
		if (singleMessage) {
			currentFolderBar = 
				doc.getElementById( "QuickFolders-PreviewToolbarPanel-Single" );
		}
		else {
      // 3pane window (any view)
			currentFolderBar = (doesMultiExist)
				? doc.getElementById("QuickFolders-PreviewToolbarPanel-ConversationView")
				: doc.getElementById("QuickFolders-PreviewToolbarPanel");
      unusedFolderBar = (doesMultiExist)
        ? doc.getElementById("QuickFolders-PreviewToolbarPanel")
        : doc.getElementById( "QuickFolders-PreviewToolbarPanel-ConversationView" );
      // hide the unused current folder bar
      if (unusedFolderBar) {
        unusedFolderBar.style.display = 'none';
      }
		}

		if (currentFolderBar) {
			currentFolderBar.style.display= visible ? '-moz-box' : 'none';
			QuickFolders.Preferences.setShowCurrentFolderToolbar(visible, singleMessage);
		}
	} ,

	get CurrentTabMode() {
		let tabMode = null,
		    tabmail = QuickFolders.Util.$("tabmail");

		if (tabmail) {
			let selectedTab = 0;
			if (tabmail.currentTabOwner) {
				tabMode = tabmail.currentTabOwner.type;
			}
			else if (QuickFolders.tabContainer) {
				selectedTab = QuickFolders.tabContainer.selectedIndex;
        selectedTab = selectedTab ? selectedTab : 0; // Thunderbird bug? selectedIndex sometimes returns void
				if (selectedTab>=0) {
					let tab = QuickFolders.Util.getTabInfoByIndex(tabmail, selectedTab);
					if (tab) {
						tabMode = QuickFolders.Util.getTabModeName(tab);  // test in Postbox
						if (tabMode == "glodaSearch" && tab.collection) { //distinguish gloda search result
							tabMode = "glodaSearch-result";
						}
					}
					else
						tabMode = ""; // Sm -- [Bug 25585] this was in the wrong place!
				}
			}
		}

		return tabMode.toString();
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
					QuickFolders.Interface.onDeckChange(null);
				}
			};
			tabmail.registerTabMonitor(monitor);
			QuickFolders.Util.logDebugOptional("toolbarHiding", "registered Tab Monitor");
		}
	} ,

	onDeckChange : function onDeckChange(event) {
		QuickFolders.Util.logDebugOptional("interface", "onDeckChange(" + event + ")");
		let panel = "";
		let isMailPanel = false;
    let hideToolbar = QuickFolders.Preferences.getBoolPref("toolbar.onlyShowInMailWindows");
    // used to early exit when !hideToolbar
		
		let toolbar = this.Toolbar;
		if (event) {
			let targetId = event.target.id;
			if (targetId != "displayDeck") return;

		 	panel = event.target.selectedPanel.id.toString();
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - panel: " + panel);
		} 
		else { //tab
			panel = this.CurrentTabMode;
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - panel: " + panel);
			if (panel != "glodaSearch-result" && panel != "calendar" && panel != "tasks" && panel != "contentTab")
				isMailPanel = true;
		}
		let isMailSingleMessageTab = (panel == "message") ? true  : false;
		let action = "";
      
		if (panel == "threadPaneBox" || panel == "accountCentralBox" || panel == "folder" || panel == "glodaList" ||
		    isMailPanel && !QuickFolders.Preferences.getBoolPref("toolbar.hideInSingleMessage")) {
			action = "Showing";
      if (hideToolbar)
        toolbar.removeAttribute("collapsed");
		} 
		else {
			action = "Collapsing";
      if (hideToolbar)
        toolbar.setAttribute("collapsed", true);
		}
		QuickFolders.Util.logDebugOptional("toolbarHiding", " (panel=" + panel + ")" + action + " QuickFolders Toolbar ");
		
    // always hide CF toolbar in single message mode 
    if (isMailSingleMessageTab) {
      let singleMessageCurrentFolderPanel = document.getElementById("QuickFolders-PreviewToolbarPanel");
      singleMessageCurrentFolderPanel.style.display= 'none';
    }
		/*let singleMessageCurrentFolderTab = this.CurrentFolderBar; // bug with empty toolbar (mac?)
		if (singleMessageCurrentFolderTab) { //  && !QuickFolders.Preferences.isShowCurrentFolderToolbar(true)
			singleMessageCurrentFolderTab.collapsed = isMailSingleMessageTab;
		}*/

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
					// folders[0].server == targetFolder.server
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
					    newURI = targetFolder.URI + encName;
					QuickFolders.Model.moveFolderURI(fromURI, newURI);
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
	
	prepareCurrentFolderIcons: function prepareCurrentFolderIcons() {
		function setIcon(targetId, source) {
			if (!source)
				return;
			let element = document.getElementById(targetId);
			if (element) {
				// getComputedStyle doesn't help us as the icons might be large, but need small mode; we can use this as fallback though
				let styles = window.getComputedStyle(source);
				let fallbackImage = styles.getPropertyValue('list-style-image');
				let fallbackRegion = styles.getPropertyValue('-moz-image-region');
				
				element.style.setProperty('list-style-image', fallbackImage, 'important');
				if (fallbackRegion)
					element.style.setProperty('-moz-image-region', fallbackRegion, 'important'); 
			}
		}
		let doc = QuickFolders.Util.getMail3PaneWindow().document;
		let forward = doc.getElementById('button-next');
		if (!forward) 
			forward = doc.getElementById('button-nextUnread');
		let back = doc.getElementById('button-previous');
		if (!back) 
			back = doc.getElementById('button-previousUnread');
		
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
  toggleMoveMode: function toggleMoveMode(toggle) {
    QuickFolders.Util.logDebug('toggleMoveMode(' + toggle + ')');
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
        QuickFolders.Interface.findFolder(true,'findFolder'); // show jump to folder box
    }
  },
  
  folderPanePopup: function folderPanePopup(evt) {  
    // needs to go into popup listener
    try {
      let folders = GetSelectedMsgFolders();
      let folder = folders[0];
      let hasIcon = QuickFolders.FolderTree.hasTreeItemFolderIcon(folder);
      QuickFolders.Util.$("context-quickFoldersRemoveIcon").collapsed = !hasIcon;
      QuickFolders.Util.$("context-quickFoldersIcon").collapsed = hasIcon; // hide select icon for tidier experience.
    }
    catch (ex) {
      QuickFolders.Util.logDebug('folderPanePopup() failed:' + ex);
    }
  }
  
}; // Interface

