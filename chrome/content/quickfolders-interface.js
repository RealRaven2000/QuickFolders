"use strict";
/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

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
	get CurrentFolderTab() { return QuickFolders.Util.$('QuickFolders-CurrentFolder');},
	get CurrentFolderBar() { return QuickFolders.Util.$('QuickFolders-CurrentFolderTools');},
	get CurrentFolderFilterToggleButton() { return QuickFolders.Util.$('QuickFolders-currentFolderFilterActive'); },
	get CogWheelPopupButton () { return QuickFolders.Util.$('QuickFolders-mainPopup'); },
	get CategoryMenu() { return QuickFolders.Util.$('QuickFolders-Category-Selection'); },
	get PaintButton() { return QuickFolders.Util.$('QuickFolders-paintBucketActive'); },
	get MailButton() { return QuickFolders.Util.$('QuickFolders-CurrentMail'); },
	get TitleLabel() { return QuickFolders.Util.$('QuickFolders-title-label'); },
	get TitleLabelBox() { return QuickFolders.Util.$('QuickFolders-LabelBox'); },
	get FoldersBox() { return QuickFolders.Util.$('QuickFolders-FoldersBox'); },
	get Toolbar() { return QuickFolders.Util.$('QuickFolders-Toolbar'); },
	get PalettePopup() { return QuickFolders.Util.$('QuickFolders-PalettePopup');},
	
	setEventAttribute: function(element, eventName, eventAction) {
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
			'content/qf_palette_legacy16.css';
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
		return this.getMail3PaneWindow().gFolderTreeController;
	} ,

	getMail3PaneWindow: function() {
		var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
				.getService(Components.interfaces.nsIWindowMediator);
		var win3pane = windowManager.getMostRecentWindow("mail:3pane");
		return win3pane;
	} ,
	
	getUIstring: function(id, defaultString) {
		var s;
		try { 
			s = QuickFolders.Properties.GetStringFromName(id);
		}
		catch(ex) { 
			QuickFolders.Util.logException('Exception during getUIstring(' + id + ') ', ex);
			s = defaultString; 
		}
		return s;
	},

	setBoundKeyListener: function(b) {
		this.boundKeyListener = b;
	},

	tabSelectUpdate: function() {
		try {
			var folder;
			QuickFolders.Util.logDebugOptional("mailTabs", "tabSelectUpdate - "
				 + QuickFolders.currentURI +"\ntabSelectEnable=" + QuickFolders.tabSelectEnable);
			if (QuickFolders.tabSelectEnable) {
				QuickFolders.Interface.onTabSelected();
				// change the category (if selected folder is in list)
				folder = GetFirstSelectedMsgFolder();
				if (folder) {
					QuickFolders.Util.logDebugOptional("mailTabs", "Tab Selected: "+ folder.name);
					var entry=QuickFolders.Model.getFolderEntry(folder.URI);
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

	setTabSelectTimer: function() {
			try {
				let nDelay = 250;
				let tID=setTimeout(function() { QuickFolders.Interface.tabSelectUpdate(); }, nDelay);
				QuickFolders.Util.logDebug("Tab Select Timer prepared - ID: " + tID);
			}
			catch (e) {
				QuickFolders.Util.logDebug("setTabSelectTimer: " + e);
			}
	} ,
	
	// helper function for SeaMonkey when another (mail) tab is selected
	// as this doesn't trigger FolderListener events!
	setFolderSelectTimer: function() {
			try {
				let nDelay = 100;
				let tID=setTimeout(function() { QuickFolders.Interface.onTabSelected(); }, nDelay);
				QuickFolders.Util.logDebug("Folder Select Timer prepared - ID: " + tID);
			}
			catch (e) {
				QuickFolders.Util.logDebug("setFolderSelectTimer: " + e);
			}
	} ,

	setFolderUpdateTimer: function() {
		// avoid the overhead if marking a folder with lots of unread mails as read or getting emails
		// made folder update asynchronous instead.
		// we only set a new timer, if there is not already one active.
		QuickFolders.Util.logDebugOptional("listeners.folder", "setFolderUpdateTimer() - Id = " + this.TimeoutID);
		if (!(this.TimeoutID)) {
			try {
				var nDelay = QuickFolders.Preferences.getIntPref('queuedFolderUpdateDelay');
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

	queuedFolderUpdate: function() {
		QuickFolders.Util.logDebugOptional("listeners.folder", "Folder Update from Timer " + this.TimeoutID + "...");
		this.updateFolders(false, true);
		//reset all timers
		this.TimeoutID=0;
	},

	generateMRUlist: function (ftv) { // generateMap: function ftv_recent_generateMap(ftv)
		QuickFolders.Util.logDebugOptional("interface", "generateMRUlist()");
		let oldestTime = 0;
		let recent = [];
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

		QuickFolders.Util.logDebugOptional('recentFolders','generateMRUlist');

		var items;
		var MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");

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
	generateMRUlist_Postbox_TB2: function()
	{
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
				var folder;
				if (typeof myenum.currentItem!='undefined')
					folder = myenum.currentItem().QueryInterface(QuickFolders_CI.nsIMsgFolder); // Postbox
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

			var time = 0;
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
		// then take the most current 15.



		var recentFolders = [];
		var oldestTime = 0; // let sometimes creates a problem in TB2!

		var MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");

		var menu = this;

		// Start iterating at the top of the hierarchy, that is, with the root
		// folders for each account.
		var acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].
					  getService(QuickFolders_CI.nsIMsgAccountManager);
		var count = acctMgr.accounts.length ? acctMgr.accounts.length : acctMgr.accounts.Count();
		for (var i = 0; i < count; i++) {
		  let acct = acctMgr.accounts.queryElementAt ?
				acctMgr.accounts.queryElementAt(i, QuickFolders_CI.nsIMsgAccount) :
				acctMgr.accounts.GetElementAt(i).QueryInterface(QuickFolders_CI.nsIMsgAccount);
		  addIfRecent(acct.incomingServer.rootFolder);
		  checkSubFolders(acct.incomingServer.rootFolder);
		}

		recentFolders.sort(sorter);

		return recentFolders;
	} ,

	createRecentPopup: function(passedPopup, isDrag, isCreate, isCurrentFolderButton) {
		var menupopup;

		var popupId = isCurrentFolderButton ? this.RecentPopupIdCurrentFolderTool : this.RecentPopupId ;
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
		var recentFolders;
		var FoldersArray = Components.classes["@mozilla.org/array;1"]
							.createInstance(Components.interfaces.nsIMutableArray);

		var isOldFolderList = false;
		if (typeof gFolderTreeView=='undefined')
		{
			recentFolders = this.generateMRUlist_Postbox_TB2();
			isOldFolderList = true;
		}
		else {
			recentFolders = this.generateMRUlist(gFolderTreeView); // instead of 'let' recentFolders
		}

		for (var i = 0; i < recentFolders.length; i++) {
			var f;
			if (isOldFolderList)
				f = recentFolders[i];
			else
				f = recentFolders[i]._folder;
			FoldersArray.appendElement(f, false);
			QuickFolders.Util.logDebugOptional('recentFolders.detail','Recent Folders Array: ' + i + '. appended ' +  f.prettyName);
		}


		// addSubFoldersPopupFromList expects nsISimpleEnumerator, enumerate() convrts the nsIMutableArray
		let isAlphaSorted =  QuickFolders.Preferences.getBoolPrefQF("recentfolders.sortAlphabetical");
		this.addSubFoldersPopupFromList(FoldersArray.enumerate(), menupopup, isDrag, isAlphaSorted, true);
		QuickFolders.Util.logDebugOptional('recentFolders','=============================\n'
			+ 'createRecentPopup Finished!');
		return menupopup;

	} ,

	createRecentTab: function(passedPopup, isDrag, passedButton) {
		try {
			QuickFolders.Util.logDebugOptional('recentFolders','createRecentTab( '
				+ ' passedPopup: ' + (passedPopup == null ? 'null' : passedPopup.id)
				+ ', isDrag: ' + isDrag
				+ ', passedButton: ' + (passedButton == null ? 'null' : passedButton.id)
				+ ')');
			var menupopup;
			var isFolderUpdate = false; //	need this to know if we are creating a fresh button (true) or just rebuild the folders menu on click/drag (false)
			var isCurrentFolderButton = (passedButton == null ? false : (passedButton.id=="QuickFolders-Recent-CurrentFolderTool"));
			var button = passedButton ? passedButton : document.createElement("toolbarbutton");
			if (!passedButton) {
				isFolderUpdate = true;
				var recentLabel = QuickFolders.Preferences.getBoolPrefQF("recentfolders.showLabel") ?
					this.getUIstring("qfRecentFolders", "Recent Folders") : '';
				button.setAttribute("label", recentLabel);
				button.setAttribute("tag", "#Recent");
				button.id="QuickFolders-Recent";

				// biffState = nsMsgBiffState_Unknown = 2
				this.styleFolderButton(button, 0, 0
					, 'recent' + ((isCurrentFolderButton || QuickFolders.Preferences.isShowRecentTabIcon) ?  ' icon' : '')
					, false);
				this.buttonsByOffset[0] = button; // currently, hard code to be the first! ([0] was [offset])
				var tabColor = QuickFolders.Preferences.recentTabColor;
				if (tabColor) {
					this.setButtonColor(button, tabColor);
			  }
			}

			menupopup = this.createRecentPopup(passedPopup, isDrag, isFolderUpdate, isCurrentFolderButton);
			this.initElementPaletteClass(button, passedButton);

			var menuitem;
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

	onClickRecent: function(button, evt, forceDisplay) {
		// refresh the recent menu on right click
		evt.stopPropagation();

		if (this.PaintModeActive) {
			let paintButton = this.PaintButton;
			let color = paintButton.getAttribute("colorIndex");
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

	onClickRecentCurrentFolderTools: function(button, evt, forceDisplay) {
		// refresh the recent menu on right click
		this.createRecentTab(null, false, button);

		if (forceDisplay) {
			// left click: open context menu through code
			QuickFolders.Interface.showPopup(button, this.RecentPopupIdCurrentFolderTool, null);
		}
	} ,
	
	onClickThreadTools: function(button, evt) {
		goDoCommand('cmd_markThreadAsRead'); 
		evt.stopPropagation();
		goDoCommand('button_next');
	} ,
	
	onGoPreviousMsg: function(button) {
		if (button.nextSibling.checked) 
			goDoCommand('cmd_previousMsg');
		else
			goDoCommand('button_previous');
			
	} ,

	onGoNextMsg: function(button) {
		if (button.previousSibling.checked) 
			goDoCommand('cmd_nextMsg');
		else
			goDoCommand('button_next');
	} ,
	
	onToggleNavigation: function(button) {
		button.checked = !button.checked;
	} ,

	// added parameter to avoid deleting categories dropdown while selecting from it!
	// new option: minimalUpdate - only checks labels, does not recreate the whole folder tree
	updateFolders: function(rebuildCategories, minimalUpdate) {
		QuickFolders.Util.logDebugOptional("interface", "updateFolders(rebuildCategories=" + rebuildCategories + ", minimalUpdate=" + minimalUpdate + ")");
		this.TimeoutID=0;

		let showToolIcon = QuickFolders.Preferences.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;
		
		if (this.CogWheelPopupButton)
			this.CogWheelPopupButton.collapsed = !showToolIcon || this.PaintModeActive;
		
		// was QuickFolders-Category-Box
		if (this.CategoryMenu)
			this.CategoryMenu.style.display =
		    (!showToolIcon && QuickFolders.Model.Categories.length == 0)
		    ? 'none' : '-moz-inline-box';

		if(rebuildCategories || QuickFolders.Preferences.isMinimalUpdateDisabled)
			minimalUpdate = false;

		let sDebug = 'updateFolders(rebuildCategories: ' + rebuildCategories + ', minimal: ' + minimalUpdate +')';
		let toolbar = this.Toolbar;

		let theme = QuickFolders.Preferences.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName;

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += ' - Number of Folders = ' + QuickFolders.Model.selectedFolders.length;

		QuickFolders.Util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			QuickFolders.Util.clearChildren(this.FoldersBox, rebuildCategories);

			// force label when there are no folders!
			var showLabelBox = QuickFolders.Preferences.isShowQuickFoldersLabel || (0==QuickFolders.Model.selectedFolders.length);

			this.TitleLabel.value = QuickFolders.Preferences.TextQuickfoldersLabel;
			this.TitleLabel.value.collapsed = !showLabelBox;
			this.TitleLabelBox.collapsed = !showLabelBox;
			this.TitleLabelBox.style.width = showLabelBox ? "auto" : "0px";

			if (rebuildCategories || null==this.CategoryMenu)
				this.updateCategories();
		}


		var offset = 0;

		// Recent Folders tab
		if (QuickFolders.Preferences.isShowRecentTab) {
			if (minimalUpdate ) {
				offset++;
			}
			else
			{
				var rtab = this.createRecentTab(null, false, null);
				if (rtab) {
					this.FoldersBox.appendChild(rtab);
					offset++;
				}
			}
		}

		var countFolders = 0;
		// force user colors on first updateFolders (no selected Folder yet!)
		if (QuickFolders.Model.selectedFolders.length) {

			let tabStyle = QuickFolders.Preferences.ColoredTabStyle;

			for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				var folderEntry = QuickFolders.Model.selectedFolders[i];
				var folder;
				var tabColor;
				var button;

				if(!this.shouldDisplayFolder(folderEntry))
					continue;

				if((folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))) {
					countFolders++;
					if (!minimalUpdate) {
						button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle);
						this.buttonsByOffset[offset] = button;
					}
					else {
						// now just update the folder count on the button label, if it changed.
						// button is not newly created. Also it is not recolored.
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry, offset, button, null, tabStyle);
						}
					}

					offset++;
				}
			}

			// this.onTabSelected();  // wrong, this is most likely too early!

			var sDoneWhat = minimalUpdate ? "rebuilt." : "rendered on toolbar."
			QuickFolders.Util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
		}

		// [Bug 25598] highlight active tab
		this.onTabSelected();
		
		// current message dragging
		var button = this.MailButton;
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
	
	updateCurrentFolderBar: function(styleSheet) {
		function collapseConfigItem(id, isShownSetting, checkParent) {
			let element = QuickFolders.Util.$(id);
			// safeguard for copied ids (such as button-previous / button-next)
			if (checkParent && element.parentNode.id.indexOf('QuickFolders') < 0)
				return;
			if (element)
				element.setAttribute('collapsed', !QuickFolders.Preferences.getBoolPrefQF(isShownSetting));
		}
		
		collapseConfigItem("QuickFolders-Close", "currentFolderBar.showClose");
		collapseConfigItem("QuickFolders-currentFolderFilterActive", "currentFolderBar.showFilterButton");
		collapseConfigItem("QuickFolders-Recent-CurrentFolderTool", "currentFolderBar.showRecentButton");
		collapseConfigItem("QuickFolders-currentFolderMailFolderCommands", "currentFolderBar.showFolderMenuButton");
		
		let toolbar2 = this.CurrentFolderBar;
		if (toolbar2) {
			let theme = QuickFolders.Preferences.CurrentTheme;
			let styleEngine = QuickFolders.Styles;
			let ss = styleSheet ? styleSheet : this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles');
			let background = QuickFolders.Preferences.getCharPrefQF('currentFolderBar.background');
			styleEngine.setElementStyle(ss, 'toolbar#QuickFolders-CurrentFolderTools', 'background', background);
			
			// add styling to current folder via a fake container
			let cF = this.CurrentFolderTab;
			if (cF && cF.parentNode)
				cF.parentNode.className = theme.cssToolbarClassName;

			let collapsed = !QuickFolders.Preferences.getBoolPrefQF("currentFolderBar.navigation.showButtons");
			for (var n=0; n< toolbar2.childNodes.length; n++)
			{
				let node = toolbar2.childNodes[n];
				let special = node.getAttribute ? node.getAttribute('special') : null;
				if (special && special=="qfMsgFolderNavigation") {
					node.collapsed = (collapsed
					        ||
					          (node.id == 'quickFoldersNavToggle')
					          && 
					          !QuickFolders.Preferences.getBoolPrefQF("currentFolderBar.navigation.showToggle"));
				}
			}
			
			// collapse the separator if msg nav buttons are hidden
			let lastMsgNavButton = QuickFolders.Util.$('QuickFolders-CurrentThread');
			if (lastMsgNavButton.nextSibling && lastMsgNavButton.nextSibling.tagName=='toolbarseparator')
				lastMsgNavButton.nextSibling.collapsed = !QuickFolders.Preferences.getBoolPrefQF("currentFolderBar.navigation.showButtons");
		}	
	} ,

	updateCategories: function() {
		QuickFolders.Util.logDebugOptional("interface", "updateCategories()");
		var bookmarkCategories = QuickFolders.Model.Categories;
		var lCatCount=0;
		if (bookmarkCategories)
			lCatCount=bookmarkCategories.length;
		QuickFolders.Util.logDebug("updateCategories() - [" + lCatCount + " Categories]");
		var menuList = this.CategoryMenu;
		var menuPopup = menuList.menupopup;

		QuickFolders.Util.clearChildren(menuPopup,true);

		if(lCatCount > 0) {
			menuList.collapsed = false;
			menuList.style.display = '-moz-box';

			menuPopup.appendChild(this.createMenuItem(QuickFolders.FolderCategory.ALL, this.getUIstring("qfAll", "(Display All)")))
			for(var i = 0; i < lCatCount; i++) {
				var category = bookmarkCategories[i];

				if (bookmarkCategories[i] != QuickFolders.FolderCategory.ALWAYS) {
					menuPopup.appendChild(this.createMenuItem(category, category))
				}
			}

			menuPopup.appendChild(document.createElement('menuseparator'));
			var s=this.getUIstring("qfUncategorized","(Uncategorized)");

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
	updateMainWindow: function() {
		function logCSS(txt) {
			QuickFolders.Util.logDebugOptional("css", txt);
		}

		logCSS("============================\n" + "updateMainWindow...");
		let themeSelector = document.getElementById("QuickFolders-Theme-Selector");
			
		// update the theme type - based on theme selection in options window, if this is open, else use the id from preferences
		QuickFolders.Preferences.setCurrentThemeId(themeSelector ? themeSelector.value : QuickFolders.Preferences.CurrentThemeId);
		var style =  QuickFolders.Preferences.ColoredTabStyle;
		// refresh main window
		var mail3PaneWindow = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"]
											 .getService(QuickFolders_CI.nsIWindowMediator)
											 .getMostRecentWindow("mail:3pane");
		// we need to try and get at the main window context of QuickFolders, not the prefwindow instance!
		if (mail3PaneWindow && mail3PaneWindow.document) { 
			let _interface = mail3PaneWindow.QuickFolders.Interface;
			logCSS("updateMainWindow: update Folders...");
			_interface.updateFolders(true, false);
			logCSS("updateMainWindow: update User Styles...");
			_interface.updateUserStyles();
		}
		else {
			logCSS("updateMainWindow: no mail3PaneWindow found!");
		}
		return true;
	} ,

	// find orphaned tabs
	tidyDeadFolders: function() {
		QuickFolders.Util.logDebugOptional("interface", "tidyDeadFolders()");
		let countTabs=0;
		let countDeleted=0;
		let sMsg = this.getUIstring('qfTidyDeadFolders',
			'This will remove the Tabs that have no valid folders assigned.\nThis sometimes happens if a folder is removed without QuickFolders being notified.')
		if (!confirm(sMsg))
			return;
		let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
														.getService(Components.interfaces.nsIPromptService);		
		let isCancel = false;
		for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++)
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
			let flags = 
				prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
				prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO  +
				prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_CANCEL;											 
			let noCheckbox = {value: false};
			if (!folder) {
				countTabs++;
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
						i--; // array is spliced, so we need to go back one!
						countDeleted++;
						break;
					case 1: // No - skip this one
						break;
					case 2: // Cancel  - undo all changes
						QuickFolders.Preferences.loadFolderEntries();
						countDeleted = 0;
						this.updateFolders(true, false);
						return;
				}				
			}
		}

		if (countDeleted>0) {
			if (confirm(this.getUIstring('qfSavePrompt','Save these changes?'))) {
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
		var sLabelFound = this.getUIstring('qfDeadTabsCount', '# dead tabs found:');
		var sLabelDeleted = this.getUIstring('qfDeadTabsDeleted', '# dead tabs removed:');
		alert(sLabelFound + ' ' + countTabs + '\n' + sLabelDeleted + ' ' + countDeleted);
	} ,

	createMenuItem: function(value, label) {
		var menuItem = document.createElement("menuitem");
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
	selectCategory: function(categoryName, rebuild) {
		this.currentlySelectedCategory = categoryName ? categoryName : QuickFolders.FolderCategory.UNCATEGORIZED ;
		if (categoryName == QuickFolders.FolderCategory.ALWAYS)
			return;
		// add support for multiple categories (csv)
		var firstCat = this.currentlySelectedCategory.split('|');
		var selectedCat = firstCat[0];
		QuickFolders.Util.logDebugOptional("categories","Selecting 1st of Categories: " + categoryName + ": " + firstCat[0] + "...");
		this.currentlySelectedCategory = selectedCat;
		this.updateFolders(rebuild, false);

		let idx;
		try {
			// store info in tabInfo, so we can restore it easier later per mail Tab
			let tabmail = document.getElementById("tabmail");
			idx = QuickFolders.tabContainer.selectedIndex;
			// let's only store this if this is the first tab...
			if (idx==0)
				QuickFolders.Preferences.setLastSelectedCategory(selectedCat);
			let tab = QuickFolders.Util.getTabInfoByIndex(tabmail, idx); // in Sm, this can return null!
			let tabMode = QuickFolders.Util.getTabModeName(tab);
			if (tab &&
			    (tabMode == QuickFolders.Util.mailFolderTypeName || tabMode == "message")) {
				tab.QuickFoldersCategory = selectedCat; 
				// setTabValue does not exist (yet)
				//if (sessionStoreManager.setTabValue) {
				//	sessionStoreManager.setTabValue(tab, "QuickFoldersCategory", selectedCat);
				//}
			}
		}
		catch(e) {
		  QuickFolders.Util.logDebugOptional("listeners.tabmail"," selectCategory failed; " + e);
		}
		QuickFolders.Util.logDebugOptional("categories", "Successfully selected Category: " + selectedCat + " on mail tab[" + idx + "]");
	} ,



	get CurrentlySelectedCategoryName() {
		if(this.currentlySelectedCategory == QuickFolders.FolderCategory.ALL || this.currentlySelectedCategory == QuickFolders.FolderCategory.UNCATEGORIZED ) {
			return null;
		}
		else {
			return this.currentlySelectedCategory;
		}
	} ,

	shouldDisplayFolder: function(folderEntry) {
		var currentCat = this.currentlySelectedCategory;
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

	windowKeyPress: function(e,dir) {
		var isAlt = e.altKey;
		var isCtrl = e.ctrlKey
		var isShift = e.shiftKey;

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
			var shouldBeHandled =
				(!QuickFolders.Preferences.isUseKeyboardShortcutsCTRL && isAlt)
				||
				(QuickFolders.Preferences.isUseKeyboardShortcutsCTRL && isCtrl);

			if(shouldBeHandled) {
				var sFriendly = (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') + e.charCode + " : code=" + e.keyCode;
				QuickFolders.Util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
				var shortcut = -1;
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
					var offset = QuickFolders.Preferences.isShowRecentTab ? shortcut+1 : shortcut;
					var button = this.buttonsByOffset[offset - 1];
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

	getButtonByFolder: function(folder) {
		for(var i = 0; i < this.buttonsByOffset.length; i++) {
			var button = this.buttonsByOffset[i];
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
		var toolbar = this.Toolbar;
		// toolbar.style.display = '-moz-inline-box';
		var makeVisible = !(toolbar.collapsed);
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
		var p =  button.ownerDocument.getElementById(popupId);
		if (p) {
			document.popupNode = button;
			if (evt && evt.ctrlKey) {
				// only show the QuickFolders Commands menu 
				// need to find first child menu
				var i;
				// see if cloned menu is there already.
				var menupopup = null;
				var nodes  = button.getElementsByTagName('menupopup');

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
			
			if (typeof p.openPopup == 'undefined')
				p.showPopup(button, 0, -1,"context","bottomleft","topleft");
			else
				p.openPopup(button,'after_start', 0, -1,true,false,evt);
			//if (menupopup)
			//	button.removeChild(menupopup);
		}
		// paint bucket pulls color on right-click
		if (button && button.parentNode.id == "QuickFolders-FoldersBox" )
			this.setPaintButtonColor(this.getButtonColor(button));
	} ,

	unReadCount:0, 
	totalCount:0, // to pass temp information from getButtonLabel to styleFolderButton

	getButtonLabel: function(folder, useName, offset) {
		try {
			var numUnread = folder.getNumUnread(false);
			var numUnreadInSubFolders = folder.getNumUnread(true) - numUnread;
			var numTotal = folder.getTotalMessages(false);
			var numTotalInSubFolders = folder.getTotalMessages(true) - numTotal;

			this.unReadCount = numUnread + numUnreadInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders ? 1 : 0);
			this.totalCount = numTotal + numTotalInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders ? 1 : 0);

			var label = "";

			// offset=-1 for folders tabs that are NOT on the quickFOlder bar (e.g. current Folder Panel)
			if (offset>=0) {
				if(QuickFolders.Preferences.isShowShortcutNumbers) {
					var shortCutNumber = QuickFolders.Preferences.isShowRecentTab ? offset-1 : offset;
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

			var displayNumbers = [];
			QuickFolders.Util.logDebugOptional("folders",
				  "unread " + (QuickFolders.Preferences.isShowUnreadCount ? "(displayed)" : "(not displayed)") + ": " + numUnread
				+ " - total:" + (QuickFolders.Preferences.isShowTotalCount ? "(displayed)" : "(not displayed)") + ": " + numTotal);
			var s="";
			if (QuickFolders.Preferences.isShowUnreadCount) {
				if(numUnread > 0)
					s=s+numUnread;
				if(numUnreadInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders)
					s=s+'+'+numUnreadInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (QuickFolders.Preferences.isShowTotalCount) {
				s="";
				if(numTotal > 0)
					s=s+numTotal;
				if(numTotalInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders)
					s=s+'+'+numTotalInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if(displayNumbers.length > 0) {
				label += " (" + displayNumbers.join(' / ') + ")";
			}
			return label;
		}
		catch(ex) {
			QuickFolders.Util.logToConsole('getButtonLabel:' + ex);
			return "";
		}
	} ,

	addFolderButton: function(folder, entry, offset, theButton, buttonId, fillStyle) 
	{
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null;			
    let useName = (entry && entry.name) ? entry.name : '';
		
		let label = this.getButtonLabel(folder, useName, offset);
		QuickFolders.Util.logDebugOptional("interface.tabs", "addFolderButton() label=" + label + ", offset=" + offset + ", col=" + tabColor + ", id=" + buttonId + ", fillStyle=" + fillStyle);

		let button = (theButton) ? theButton : document.createElement("toolbarbutton"); // create the button!

		button.setAttribute("label", label);


		//button.setAttribute("class",ToolbarStyle); // was toolbar-height!

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="";
		let sDisplayIcons = QuickFolders.Preferences.isShowToolbarIcons ? ' icon': '';
		// if the tab is colored, use the new palette setting "ColoredTab"
		// if it is uncolored use the old "InActiveTab"
		let paletteClass = tabColor ? this.getPaletteClass('ColoredTab') : this.getPaletteClass('InactiveTab'); //  QuickFolders.Preferences.isPastelColors ? ' pastel': '';

		// use folder flags instead!
		var Constants = QuickFolders.Util.Constants;

		if (folder.flags & Constants.MSG_FOLDER_FLAG_INBOX)
			specialFolderType="inbox" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_SENTMAIL)
			specialFolderType="sent" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_TRASH)
			specialFolderType="trash" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_JUNK)
			specialFolderType="junk" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_TEMPLATES)
			specialFolderType="template" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_QUEUE)
			specialFolderType="outbox" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_DRAFTS)
			specialFolderType="draft" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_NEWSGROUP)
			specialFolderType="news" + sDisplayIcons;
		else if (folder.flags & Constants.MSG_FOLDER_FLAG_VIRTUAL)
			specialFolderType="virtual" + sDisplayIcons; // all other virtual folders (except smart which were alreadyhandled above)
		else if (folder.flags == Constants.MSG_FOLDER_FLAG_ARCHIVE)
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
			folder.hasNewMessages 
		);

		button.folder = folder;

		if (null == theButton || (null == button.getAttribute("oncommand"))) {
			button.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));
			this.setEventAttribute(button, "oncommand",'QuickFolders.Interface.onButtonClick(event.target, event, true);');
		}



		var popupId = 'QuickFolders-folder-popup-'
		          + ((buttonId!=null) ? buttonId : folder.URI);
		button.setAttribute('context',''); // overwrites the parent context menu
		this.setEventAttribute(button, "oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
		if (buttonId == 'QuickFolders-CurrentFolder') {
			this.setEventAttribute(button, "onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
			this.setEventAttribute(button, "ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
		}


		if (!theButton) {
		  // line break?
			if (entry.breakBefore) {
			  // without explicitely adding this namespace, the break doesnt show up!
			  let LF = document.createElementNS("http://www.w3.org/1999/xhtml", "br");
			  this.FoldersBox.appendChild(LF);
			}
			
			if (entry.separatorBefore) {
			  // without explicitely adding this namespace, the break doesnt show up!
			  let sep = document.createElement("toolbarseparator");
			  this.FoldersBox.appendChild(sep);
			}
			this.FoldersBox.appendChild(button);
			this.setEventAttribute(button, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
			this.setEventAttribute(button, "ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
			this.setEventAttribute(button, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("flex",100);
		}

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

 /*********************
 	* styleFolderButton() 
 	* styles a folder button (tab)
 	* @button:    the button to be styled
 	* @numUnread: number of unread emails
 	* @numTotal: numTotal of total emails
 	* @specialStyle: if this is a special folder, such as inbox, virtual etc.
 	* @tabColor: palette index; 0=DEFAULT
 	* @gotNew:   new email has arrived (special inset style)
 	*/
	styleFolderButton: function(button, numUnread, numTotal, specialStyle, tabColor, gotNew) {

		//reset style!
		var cssClass = '';
		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.getAttribute("label")
			+ ", " + numUnread + ", " + numTotal + ", " + specialStyle + ")");

		if(numUnread > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold) {
			cssClass += " has-unread";
		}

		if(numTotal > 0 && QuickFolders.Preferences.isShowFoldersWithMessagesItalic) {
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

		var buttonFontSize = QuickFolders.Preferences.ButtonFontSize;
		if(buttonFontSize) {
			button.style.fontSize = buttonFontSize + "px";
		}

		// add some color, the easy way
		if (tabColor) {
			cssClass += " " + this.getButtonColorClass(tabColor);
		}
		else
			cssClass += " col0"

		if (cssClass.trim)
			button.className = cssClass.trim();
		else
			button.className = cssClass;

	} ,

	addSpecialButton: function(SpecialFunction, SpecialId, Offset, tooltip) {
		var button = document.createElement("toolbarbutton");
		var image='';
		var lbl=''; // for testing
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

	onButtonClick: function(button, evt, isMouseClick) {
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
				return;
			}

			if (evt) {
				// CTRL forces a new mail tab
				if(evt.ctrlKey && isMouseClick) {
					QuickFolders.Util.logDebugOptional("mouseclicks","onButtonClick - ctrlKey was pressed");
					var tabmail = QuickFolders.Util.$("tabmail");
					if (tabmail) {
						switch (QuickFolders.Util.Application) {
							case 'Thunderbird':
								tabmail.openTab(QuickFolders.Util.mailFolderTypeName, button.folder); 
								break;
							case 'SeaMonkey':
								tabmail.openTab(QuickFolders.Util.mailFolderTypeName, 7, button.folder.URI); // '3pane'
								QuickFolders.tabContainer.selectedIndex = tabmail.tabContainer.childNodes.length - 1;
								break;
							case 'Postbox':
								var win = this.getMail3PaneWindow();
								win.MsgOpenNewTabForFolder(button.folder.URI, null /* msgHdr.messageKey key*/, false /*Background*/ )
								break;
						}
					}
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

	onRemoveBookmark: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		var msg = folder.name + " tab removed from QuickFolders";
		QuickFolders.Model.removeFolder(folder.URI, true);
		// this.updateFolders(true); already done!
		try { QuickFolders.Util.showStatusMessage(msg); } catch(e) {;};
	} ,
	
	onBreakToggle: function (element) {
		let folderButton = QuickFolders.Util.getPopupNode(element);
		let entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setFolderLineBreak	(entry, !entry.breakBefore);
	} ,
	
	onSeparatorToggle: function (element) {
		let folderButton = QuickFolders.Util.getPopupNode(element);
		let entry = QuickFolders.Model.getButtonEntry(folderButton);
    QuickFolders.Model.setTabSeparator (entry, !entry.separatorBefore);
	} ,

	onRenameBookmark: function(element) {
		let folderButton = QuickFolders.Util.getPopupNode(element);
		let sOldName = folderButton.label; //	this.getButtonByFolder(popupNode.folder).label;
		// strip shortcut numbers
		if(QuickFolders.Preferences.isShowShortcutNumbers) {
			var i = sOldName.indexOf('. ');
			if (i<3 && i>0)
				sOldName = sOldName.substring(i+2,sOldName.length);
		}
		// find if trhere is a number of total messages / unread message in the label, and strip them from renaming!!
		if(QuickFolders.Preferences.isShowTotalCount || QuickFolders.Preferences.isShowUnreadCount) {
			var i = sOldName.lastIndexOf(' (');
			var j = sOldName.lastIndexOf(')');
			// TODO: additional check if there are just numbers and commas within the brackets!

			//making sure there is stuff between the () and the last char is a )
			if (i > 1 && sOldName.substr(i, j - i).length > 0 && j == sOldName.length - 1) {
				var bracketedLen = j-i+1;
				QuickFolders.Util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "	length = " + bracketedLen);
			// lets check if this is numeral, after removing any ','
				sOldName = sOldName.substring(0,sOldName.length - bracketedLen);
			}

		}

		var newName = window.prompt(this.getUIstring("qfNewName","Enter a new name for the bookmark")+"\n"+ folderButton.folder.URI, sOldName); // replace folder.name!
		if(newName) {
			QuickFolders.Model.renameFolder(folderButton.folder.URI, newName);
		}
	} ,

	compactFolder: function(folder, command) {
		var s1 = folder.sizeOnDisk;
		QuickFolders.compactLastFolderSize = s1;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = command;

		// Postbox might get an indexing menu item?
		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
		folder.compact(null, msgWindow);
	} ,

	onCompactFolder: function(element, command) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		this.compactFolder(folder, command);
	} ,

	onMarkAllRead: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		try {
			var f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
			f.markAllMessagesRead(msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onMarkAllRead " + e);
		}
	} ,

	onCreateSubFolder: function(folder) {
		try {
			var f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);

			//gFolderTreeController.newFolder( ,msgWindow);
			folder.createSubfolder("test" ,msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onCreateSubFolder " + e);
		}
	} ,

	onDeleteFolder: function(element) {
		var folderButton = QuickFolders.Util.getPopupNode(element);
		var uri = folderButton.folder.URI;

		var result = null;
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

	onRenameFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		var theURI = folder.URI;
		if (this.globalTreeController  && this.globalTreeController.renameFolder) {
			this.globalTreeController.renameFolder(folder);
		}
		else {
			QuickFolders_MySelectFolder(theURI);
			MsgRenameFolder();
			// var folder = QuickFolders.Model.getMsgFolderFromUri(theURI, false);
			// QuickFolders.Model.renameFolder(theURI, folder.prettyName);
		}
	} ,
	
	onEmptyTrash: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
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

	onEmptyJunk: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		this.globalTreeController.emptyJunk(folder);
		this.compactFolder(folder, 'emptyJunk');
	} ,

	onDeleteJunk: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if (this.globalTreeController && this.globalTreeController.deleteJunk)
			this.globalTreeController.deleteJunk(folder);
		else
			deleteJunkInFolder();
	} ,

	onEditVirtualFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editVirtualFolder(folder);
	} ,

	onFolderProperties: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			this.globalTreeController.editFolder(null,folder);
	} ,

	onGetMessages: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		
		// Get new Messages
		if ((	folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP
				||
				folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_INBOX) 
			&& 
			GetNewMsgs) 
		{
			if (folder.server.type != 'none')
				GetNewMsgs(folder.server, folder); 
		}	
	} ,

	rebuildSummary: function (folder) {
		var isCurrent=false;
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

			var msgDB = folder.msgDatabase;
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
			var msgDB = folder.getMsgDatabase(msgWindow);
			try
			{
				if (folder.supportsOffline) {
					// Remove the offline store, if any.
					let offlineStore = folder.filePath;
					if (offlineStore.exists())
						offlineStore.remove(false);
				}
			}
			catch (ex)
			{
				Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("failed to remove offline store: " + ex);
			}

			msgDB.summaryValid = false;
			folder.ForceDBClosed();
			// these two lines will cause the thread pane to get reloaded
			// when the download/reparse is finished. Only do this
			// if the selected folder is loaded (i.e., not thru the
			// context menu on a non-loaded folder).
			if (folder == GetLoadedMsgFolder())
			{
				gRerootOnFolderLoad = true;
				gCurrentFolderToReroot = folder.URI;
			}
			folder.updateFolder(msgWindow);
		}
		
		QuickFolders.Util.popupAlert("QuickFolders", this.getUIstring('qfFolderRepairedMsg','Folder repaired:') + ' ' + folder.prettyName);
	} ,

	onRepairFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		this.rebuildSummary(folder);
	} ,

	onNewFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Application == 'Postbox') || (QuickFolders.Util.Application == 'SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgNewFolder(NewFolder);
		}
		else
			this.globalTreeController.newFolder(folder);
	},

	onSearchMessages: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		// Tb:  // gFolderTreeController.searchMessages();
		MsgSearchMessages(folder);
	} ,
	
	buildPaletteMenu: function(currentColor, existingPopupMenu) {
		let logLevel = (typeof existingPopupMenu === 'undefined') ? "interface.tabs" : "interface";
		QuickFolders.Util.logDebugOptional(
			logLevel, 
			"buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + existingPopupMenu + ")");
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
	appendMailFolderCommands: function(MailCommands, folder, isRootMenu, button, menupopup) {
		var topShortCuts = 0;
		// Empty Trash
		if (folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH
			&&
			QuickFolders.Preferences.getBoolPrefQF("folderMenu.emptyTrash")) 
		{
			var menuitem = this.createMenuItem_EmptyTrash();
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++;
		}

		// Get Newsgroup Mail
		if ((folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP)
			&&
			QuickFolders.Preferences.getBoolPrefQF("folderMenu.getMessagesForNews")) 
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

		// Get Mail - at top of Inbox menu!
		if (menupopup 
			&& 
			(folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_INBOX)
			&&
			!(folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_VIRTUAL)
			&&
			QuickFolders.Preferences.getBoolPrefQF("folderMenu.getMessagesForInbox"))
		{
			menuitem = this.createMenuItem_GetMail(folder);
			if (menuitem) {
				menupopup.appendChild(menuitem);
				topShortCuts ++ ;
			}
		}
		
		// MarkAllRead (always on top)
		if (menupopup 
			&& 
			!(folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH)
			&& 
			!(folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_JUNK)
			&&
			QuickFolders.Preferences.getBoolPrefQF("folderMenu.markAllRead"))
			// && folder.getNumUnread(false)>0
		{
			menuitem = this.createMenuItem_MarkAllRead((folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_VIRTUAL)==true);
			menupopup.appendChild(menuitem);
			topShortCuts ++ ;
		}

		if (QuickFolders.Util.Application!="Postbox"
		    &&
		    QuickFolders.Preferences.getBoolPrefQF("folderMenu.emptyJunk"))
		{
			// EmptyJunk
			if (folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_JUNK) {
				menuitem = this.createMenuItem_EmptyJunk();
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu)
						topShortCuts ++ ;
				}
			}
			else if (!(folder.flags & (QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH | QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP))
				&& button.id == "QuickFolders-CurrentFolder"
				&& QuickFolders.Preferences.getBoolPrefQF("folderMenu.emptyJunk") 
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
		if (folder.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_VIRTUAL) {
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
		var srchMenu = this.getMail3PaneWindow().document.getElementById("folderPaneContext-searchMessages")
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
	} ,
	
	addPopupSet: function(popupId, folder, entry, offset, button) {

		let menupopup = document.createElement('menupopup');
		menupopup.setAttribute('id',popupId);
		menupopup.setAttribute('position','after_start'); //

		menupopup.className = 'QuickFolders-folder-popup';
		menupopup.folder = folder;

		QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name);

		let menuitem;
		let QuickFolderCmdMenu = null;

		if (button.id != "QuickFolders-CurrentFolder") {

			/***  QUICKFOLDERS COMMANDS   ***/

			var QFcommandPopup = document.createElement('menupopup');
			QFcommandPopup.className = 'QuickFolders-folder-popup';

			// tab colors menu
			// we should clone this!
			var colorMenu = document.createElement('menu');
			colorMenu.setAttribute("tag",'qfTabColorMenu');
			colorMenu.setAttribute("label", this.getUIstring("qfMenuTabColorPopup", "Tab Color") );
			colorMenu.className = 'QuickFolders-folder-popup';
			colorMenu.setAttribute("class","menu-iconic");

			QuickFolders.Util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

			// SelectColor
			QuickFolders.Util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "...");
			let entry = QuickFolders.Model.getFolderEntry(folder.URI);
			var menuColorPopup = this.buildPaletteMenu(entry.tabColor ? entry.tabColor : 0);
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
				'QuickFolders.Interface.addFolderToCategory(this)');

			QFcommandPopup.appendChild(menuitem);


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
			
			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.lineBreak")) {
				menuitem = document.createElement('menuitem');
				menuitem.className='cmd menuitem-iconic';
				menuitem.setAttribute('tag', entry.breakBefore ? 'qfBreakDel' : 'qfBreak');
				let brString = entry.breakBefore ? this.getUIstring('qfRemoveLineBreak', 'Remove Line Break!') : this.getUIstring('qfInsertLineBreak', 'Insert Line Break!')
				menuitem.setAttribute('label', brString);
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onBreakToggle(this)');
				QFcommandPopup.appendChild(menuitem);
			}

			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.separator")) {
				menuitem = document.createElement('menuitem');
				menuitem.className='cmd menuitem-iconic';
				menuitem.setAttribute('tag', entry.separatorBefore ? 'qfSeparatorDel' : 'qfSeparator');
				let lbString = entry.separatorBefore ? this.getUIstring('qfRemoveSeparator', 'Remove Separator!') : this.getUIstring('qfInsertSeparator', 'Insert Separator!')
				menuitem.setAttribute('label', lbString);
				this.setEventAttribute(menuitem, 'oncommand','QuickFolders.Interface.onSeparatorToggle(this)');
				QFcommandPopup.appendChild(menuitem);
			}
			
			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.options")
			   ||
				 QuickFolders.Preferences.getBoolPrefQF("commandMenu.support")
				 ||
				 QuickFolders.Preferences.getBoolPrefQF("commandMenu.help")
			   ) {
				// --------------------
				QFcommandPopup.appendChild(document.createElement('menuseparator'));
			}
			let menuItemToClone;

			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.options")) {
				// Options
				menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-options');
				if (menuItemToClone) {
					menuitem = menuItemToClone.cloneNode(true);
					QFcommandPopup.appendChild(menuitem);
				}
			}

			// Support
			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.support")) {
				menuItemToClone = document.getElementById('QuickFolders-ToolbarPopup-support');
				if (menuItemToClone) {
					menuitem = menuItemToClone.cloneNode(true);
					QFcommandPopup.appendChild(menuitem);
				}
			}

			// Help
			if (QuickFolders.Preferences.getBoolPrefQF("commandMenu.help")) {
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


		var fi = folder.QueryInterface(Components.interfaces.nsIMsgFolder);


		/* In certain cases, let's append mail folder commands to the root menu */
		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP) {
			// newsgroups have no subfolders anyway
			var MailCommands = menupopup;
			var isRootMenu = true;
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
		var topShortCuts = 0;
		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH) {
			menuitem = this.createMenuItem_EmptyTrash();
			menupopup.appendChild(menuitem);
			topShortCuts ++ ;
		}

		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_JUNK) {
			menuitem = this.createMenuItem_EmptyJunk();
			menupopup.appendChild(menuitem);
			topShortCuts ++ ;
		}
		
		if (QuickFolders.Preferences.getBoolPrefQF("folderMenu.openNewTab")) {
			let newTabMenuItem = document.getElementById('folderPaneContext-openNewTab');		
			// folder listener sometimes throws here?
			let label = newTabMenuItem && newTabMenuItem.label ? newTabMenuItem.label.toString() : "Open in New Tab";
			let menuitem = this.createMenuItem('', label);
      // oncommand="gFolderTreeController.newFolder();"			
			menuitem.className='cmd menuitem-iconic';
			menuitem.setAttribute("tag", "openNewTab");
			let cmd;
			let folderUri = fi.URI;
			let tabName = fi.name;
			switch (QuickFolders.Util.Application) {
				case 'Thunderbird':
					cmd = function () {
						let tabmail = document.getElementById("tabmail");
						tabmail.openTab(QuickFolders.Util.mailFolderTypeName, {folder: fi, messagePaneVisible: true, background: false, disregardOpener: true, title: tabName} ) ; 
					};
					break;
				case 'SeaMonkey':
					cmd = function () {
						let tabmail = document.getElementById("tabmail");
						tabmail.openTab(QuickFolders.Util.mailFolderTypeName, 7, folderUri); // aTabModeName, aModeBits, aFolderURI, aMsgHdr
					};
					break;
				case 'Postbox':
					cmd = function () {
						let win = QuickFolders.Interface.getMail3PaneWindow();
						win.MsgOpenNewTabForFolder(folderUri, null /* msgHdr.messageKey key*/, false /*Background*/ );
					}
					break;
			}
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
			var MailFolderCmdMenu = document.createElement('menu');
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
	showCurrentFolderMailContextMenu: function(button) {
		var menupopup = document.createElement('menupopup');
		menupopup.setAttribute('position','after_start'); //
		menupopup.id = 'QuickFolders-CurrentMailFolderCommandsPopup';
		
		menupopup.className = 'QuickFolders-folder-popup';
		
		var folder = QuickFolders.Util.CurrentFolder;
		button.folder = folder;

		QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for Mail Commands - " + folder.name);
		menupopup.folder = folder;
		
		if (button.firstChild)
			button.removeChild(button.firstChild);
		button.appendChild(menupopup); 

		QuickFolders.Interface.appendMailFolderCommands(menupopup, folder, true, button, null);

		QuickFolders.Interface.showPopup(button, menupopup.id, null);
	} ,

	createMenuItem_DeleteJunk: function() {
		let menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","deleteJunk");
		menuitem.setAttribute('label',this.getUIstring("qfDeleteJunk", "Purge Junk"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onDeleteJunk(this);");
		return menuitem;
	} ,

	createMenuItem_EmptyJunk: function() {
		let menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyJunk");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyJunk", "Empty Junk"));
		menuitem.setAttribute('accesskey',this.getUIstring("qfEmptyJunkAccess", "Empty Junk"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyJunk(this);");
		return menuitem;
	} ,
	
	createMenuItem_GetMail: function(folder)
	{
		try
		{
			// find out the server name
			var server = folder.server;
			
			//var newMenuItem = document.getElementById('folderPaneContext-getMessages');
			//if (!newMenuItem) 
			//	return null;
			
			// let's clone it ?
			// var getMailMenuItem=newMenuItem.cloneNode(true);
			var getMailMenuItem= document.createElement('menuitem');
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


	createMenuItem_EmptyTrash: function() {
		var menuitem = document.createElement('menuitem');
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyTrash");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyTrash", "Empty Trash"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfEmptyTrashAccess","T"));
		this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onEmptyTrash(this);event.stopPropagation();");
		return menuitem;
	} ,

	createMenuItem_MarkAllRead: function(disabled) {
		var menuitem = document.createElement('menuitem');
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
	sortFolderItems: function (aFtvItems) {
		function sorter(a, b) {
			var sortKey;
			sortKey = a._folder.compareSortKeys(b._folder);
			if (sortKey)
				return sortKey;
			return a.text.toLowerCase() > b.text.toLowerCase();
		}
		aFtvItems.sort(sorter);
	} ,

	addSubMenuEventListener: function (subMenu, url) {
		// url is specific to this function context so it should be snapshotted from here
		// we need this workaround as TB2 does not support the 'let' keyword
		subMenu.addEventListener("click",
			function(evt) { QuickFolders.Interface.onSelectParentFolder(url, evt); }, false);
	} ,
	
	addDragToNewFolderItem: function(popupMenu, folder)
	{
		try
		{
			QuickFolders.Util.logDebugOptional("dragToNew","addDragToNewFolderItem	" + folder.prettiestName
				+ "\ncanCreateSubfolders = " + folder.canCreateSubfolders
				+ "\nserver.type = " + folder.server.type);
			if (!folder.canCreateSubfolders) return;
			var server=folder.server.QueryInterface(Components.interfaces.nsIMsgIncomingServer);// check server.type!!
			switch(server.type) {
				case 'pop3':
					if (!QuickFolders.Preferences.getBoolPrefQF("dragToCreateFolder.pop3"))
						return;
					break;
				case 'imap':
					if (!QuickFolders.Preferences.getBoolPrefQF("dragToCreateFolder.imap"))
						return;
					break;
				case 'none': // allow all local folders!
					if (!QuickFolders.Preferences.getBoolPrefQF("dragToCreateFolder.local"))
						return;
					break;
				default:
					if (!QuickFolders.Preferences.getBoolPrefQF("dragToCreateFolder." + server.type)) {
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
					// this.setEventAttribute(createFolderMenuItem, "oncommand","QuickFolders.Interface.onCreateSubFolder(GetMsgFolderFromURI('" + folder.URI + "'));");
					this.setEventAttribute(createFolderMenuItem, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(createFolderMenuItem, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.popupDragObserver);");  // only case where we use the dedicated observer of the popup!
					//this.setEventAttribute(createFolderMenuItem, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

					popupMenu.appendChild(createFolderMenuItem);
				}
			}
			
		}
		catch(ex) {QuickFolders.Util.logException('Exception in addDragToNewFolderItem (adding drag Menu items): ', ex); }
	} ,

	// isDrag: if this is set to true, then the command items are not included
	addSubFoldersPopupFromList: function(subfolders, popupMenu, isDrag, forceAlphaSort, isRecentFolderList) {
		var killDiacritics = function(s) {
			return s.toLowerCase().replace(/[_\xE0-\xE6\xE8-\xEB\xF2-\xF6\xEC-\xEF\xF9-\xFC\xFF\xDF\x3A]/gi, function($0) { return tr[$0] })
		}
		let subfolder;
		let done = false;
		// folder detail
		// 0 - just prettyName
		// 1 - prettyName - Account
		// 2 - full path
		let displayFolderPathDetail = 
			isRecentFolderList 
			? QuickFolders.Preferences.getIntPref("recentfolders.folderPathDetail") 
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
				var menuitem = document.createElement('menuitem');
				var menuLabel;
				let maxDetail = 3;
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
						menuLabel = hostString + ' - ' + subfolder.URI.substr(f);
						break;
					case 3:
						menuLabel = subfolder.URI;
						break;
				}
				if (isRecentFolderList && QuickFolders.Preferences.isDebugOption('recentFolders.detail'))
					menuLabel = subfolder.getStringProperty("MRUTime") + ' - ' + menuLabel;

				menuitem.setAttribute('label', menuLabel); //+ subfolder.URI
				menuitem.setAttribute("tag","sub");

				var numUnread = subfolder.getNumUnread(false);
				var numUnreadInSubFolders = subfolder.getNumUnread(true) - numUnread;
				var sCount = ' (' + ((numUnread>0) ? numUnread : '') ;
				if (numUnread + numUnreadInSubFolders == 0)
					sCount = ''


				if (numUnreadInSubFolders+numUnread>0) {
					if(numUnreadInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders)
						sCount += '+'+numUnreadInSubFolders+'';
					sCount += ")";
					if (!QuickFolders.Preferences.isShowCountInSubFolders && numUnread == 0)
						sCount="";

					menuitem.setAttribute("class","hasUnread menuitem-iconic");
					if (subfolder.hasNewMessages && QuickFolders.Preferences.isHighlightNewMail) 
						menuitem.setAttribute("biffState-NewMail","true");
					menuitem.setAttribute('label', menuLabel + sCount);
				}
				else
					menuitem.setAttribute("class","menuitem-iconic");
				if (! (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders))
					this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "',event)");

				if (true) {
					// AG added "empty" click event to avoid bubbling to parent menu!
					menuitem.addEventListener("click", function(evt) { evt.stopPropagation(); }, false);
				}

				QuickFolders.Util.logDebugOptional("popupmenus","add oncommand event for menuitem " + menuitem.getAttribute("label") + " onSelectSubFolder(" + subfolder.URI+ ")");

				menuitem.folder = subfolder;
				this.setEventAttribute(menuitem, "ondragenter","event.preventDefault();"); // fix layout issues...
				this.setEventAttribute(menuitem, "ondragover","nsDragAndDrop.dragOver(event,QuickFolders.popupDragObserver)"); // okay
				this.setEventAttribute(menuitem, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
				// this.setEventAttribute(menuitem, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

				if (forceAlphaSort) {
					// alpha sorting by starting from end of menu up to separator!
					var c=popupMenu.childNodes.length-1; //count of last menu item
					var added=false;
					var tr = {"\xE0":"a", "\xE1":"a", "\xE2":"a", "\xE3":"a", "\xE4":"ae", "\xE5":"ae", "\xE6":"a",
						  "\xE8":"e", "\xE9":"e", "\xEA":"e", "\xEB":"e",
						  "\xF2":"o", "\xF3":"o", "\xF4":"o", "\xF5":"o", "\xF6":"oe",
						  "\xEC":"i", "\xED":"i", "\xEE":"i", "\xEF":"i",
						  "\xF9":"u", "\xFA":"u", "\xFB":"u", "\xFC":"ue", "\xFF":"y",
						  "\xDF":"ss", "_":"/", ":":"."};

					var sNewName = killDiacritics(subfolder.name);
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


				if (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders)
				{
					this.debugPopupItems++;
					var subMenu = document.createElement('menu');
					subMenu.setAttribute("label", menuLabel + sCount);
					subMenu.className = 'QuickFolders-folder-popup menu-iconic' + ((numUnreadInSubFolders+numUnread>0) ? ' hasUnread' : '');
					if (subfolder.hasNewMessages)
						subMenu.setAttribute("biffState-NewMail","true");

					subMenu.folder = subfolder;

					this.setEventAttribute(subMenu, "ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					this.setEventAttribute(subMenu, "ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
					this.setEventAttribute(subMenu, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

					// 11/08/2010 - had forgotten the possibility of _opening_ the folder popup node's folder!! :)
					//subMenu.allowEvents=true;
					// oncommand did not work
					QuickFolders.Util.logDebugOptional("popupmenus","add click listener for subMenu " + subMenu.getAttribute("label") + " onSelectParentFolder(" + subfolder.URI+ ")");

					//let uriCopy = subfolder.URI; // snapshot! (not working in TB2)
					this.addSubMenuEventListener(subMenu, subfolder.URI); // create a new context for copying URI

					var subPopup = document.createElement("menupopup");
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
			catch(ex) {QuickFolders.Util.logDebug('Exception in addSubFoldersPopup: ' + ex	+ '\nFile: ' + ex.FileName + '	[' + ex.lineNumber + ']'); done = true;}
		}
	} ,

	// add all subfolders (1st level, non recursive) of folder to popupMenu
	addSubFoldersPopup: function(popupMenu, folder, isDrag) {
		if (folder.hasSubFolders) {
			var subfolders;
			if (typeof folder.subFolders != 'undefined')
				subfolders = folder.subFolders;
			else
				subfolders = folder.GetSubFolders();

			var isAlphaSorted = QuickFolders.Preferences.isSortSubfolderMenus;
			this.addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, isAlphaSorted, false);
		}

		// append the "Create New Folder" menu item!
		if (isDrag && QuickFolders.Preferences.getBoolPrefQF('folderMenu.dragToNew')) {
			QuickFolders.Interface.addDragToNewFolderItem(popupMenu, folder);
		}
	} ,

	// collapse all parent menus from (drop or clicked) target upwards
	collapseParentMenus: function(Target) {
		var p=Target;
		QuickFolders.Util.logDebug ("Close menus for node=" + p.nodeName
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
					QuickFolders.Util.logDebug ("parenttag=" + p.tagName);
					QuickFolders.Util.logDebug ("node= " + p.nodeName);
					if (p.tagName == 'menupopup' && p.hidePopup) {
						QuickFolders.Util.logDebug ("Try hide parent Popup " + p.getAttribute('label'));
						p.hidePopup();
						}
					}
				break;

			case 'toolbarbutton':
				QuickFolders_globalHidePopupId='moveTo_'+Target.folder.URI;
				QuickFolders.Util.logDebug ("set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				var popup = document.getElementById(QuickFolders_globalHidePopupId);
				if (popup)
					try {
						popup.parentNode.removeChild(popup); //was popup.hidePopup()
						QuickFolders_globalHidePopupId="";
					}
					catch(e) {
						QuickFolders.Util.logDebug ("Could not remove popup of " + QuickFolders_globalHidePopupId );
					}
				break;

		}
	} ,

	onSelectParentFolder: function(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("popupmenus", "onSelectParentFolder: " + folderUri);
		this.onSelectSubFolder(folderUri, evt);
		evt.stopPropagation(); // avoid oncommand bubbling up!
		QuickFolders.Interface.collapseParentMenus(evt.target);
	} ,

	// select subfolder (on click)
	onSelectSubFolder: function(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("popupmenus", "onSelectSubFolder: " + folderUri);
		try {
			if (evt) {
				if(evt.ctrlKey) {
					let tabmail = document.getElementById("tabmail");
					if (tabmail) {
						switch (QuickFolders.Util.Application) {
							case 'Thunderbird':
								tabmail.openTab(QuickFolders.Util.mailFolderTypeName, {folder: folderUri, messagePaneVisible:true } );
								break;
							case 'SeaMonkey':
								tabmail.openTab(QuickFolders.Util.mailFolderTypeName, 7, folderUri);
								break;
							case 'Postbox':
								var win = this.getMail3PaneWindow();
								win.MsgOpenNewTabForFolder(folderUri, null /* msgHdr.messageKey key*/, false /*Background*/ )
								break;

						}
					}
				}
			}
		}
		catch (ex) { QuickFolders.Util.logToConsole(ex); };
		evt.stopPropagation();
		QuickFolders_MySelectFolder (folderUri);
	} ,
	
	// on down press reopen QuickFolders-FindPopup menu with ignorekeys="false"
	findFolderKeyPress: function(event) {
	  const VK_DOWN = 0x28;
		const VK_ESCAPE = 0x1B;
		let menupopup;
	  if (event.keyCode) switch (event.keyCode) 
		{
		  case VK_DOWN:
				menupopup = document.getElementById('QuickFolders-FindPopup');
				menupopup.removeAttribute('ignorekeys');
				let palette = document.getElementById('QuickFolders-Palette');
				if (palette) {
					menupopup = palette.appendChild(palette.removeChild(menupopup));
					let textBox = document.getElementById('QuickFolders-FindFolder');
					if (typeof menupopup.openPopup == 'undefined')
						menupopup.showPopup(textBox, 0, -1,"context","bottomleft","topleft");
					else
						menupopup.openPopup(textBox,'after_start', 0, -1,true,false);  // ,evt
					
					setTimeout( function() {
							menupopup.focus();
							if (menupopup.dispatchEvent(event)) { // now pass it on!
								// event was not cancelled with preventDefault()
								;
							}
						});
				} // palette
				break;
			case VK_ESCAPE:
				menupopup = document.getElementById('QuickFolders-FindPopup');
				let state = menupopup.getAttribute('state');
				if (state == 'open' || state == 'showing') {
					menupopup.hidePopup();
				}
			  this.findFolder(false);
			  break;
		}
	} ,

	findFolderName: function(textBox) {
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
	  let searchString = textBox.value.toLocaleLowerCase();
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
				  // is it the start of a new word? e.g. searching 'F' should match "x-fred" "x fred" "x.fred" "x,fred"
				  if (" .-,_".indexOf(folderNameSearched.substr(matchPos-1,1))<0)
					  continue;  // skip if not starting with single letter
				}
				// avoid duplicates
				if (!matches.some( function(a) { return (a.uri == folderEntry.uri); })) {
					matches.push( { name:folderEntry.name, lname:folderNameSearched, uri:folderEntry.uri, rank: rank, type:'quickFolder' } );
				}
			}
		}
		// if 1 unique full match is found, we can jump there
		if ((matches.length == 1) && (matches[0].lname == searchString)) {
			// go to folder
			isSelected = QuickFolders_MySelectFolder(matches[0].uri);
		}
		
    // second, search all folders globally
		let acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]
			.getService(Ci.nsIMsgAccountManager);
		
		if (acctMgr.allFolders) {
			let allFolders = acctMgr.allFolders;
			for (let folder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
				addMatchingFolder(matches, folder);
			}		 
		}
		else { // SeaMonkey
			let accounts = acctMgr.accounts;
			let allFolders = Components.classes["@mozilla.org/array;1"]
								.createInstance(Ci.nsIMutableArray);
			// accounts will be changed from nsIMutableArray to nsIArray Tb24 (Sm2.17)
			let iAccounts = (typeof accounts.Count === 'undefined') ? accounts.length : accounts.Count();
			let i;
			for (i = 0; accounts && (i < iAccounts) ; ++i) {  // && (!account || !identity)
					try {
						let account = accounts.queryElementAt ?
							accounts.queryElementAt(i, Ci.nsIMsgAccount) :
							accounts.GetElementAt(i).QueryInterface(Ci.nsIMsgAccount);
					} catch (exc) {
						account = null;
					}
					
					if (account) {
						account.rootFolder.ListDescendents(allFolders);
						for each (let aFolder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
							addMatchingFolder(matches, aFolder);
						}		 
					}
			}	
		}
		if (matches.length) {
			if (matches.length == 1)  // go to folder
				isSelected = QuickFolders_MySelectFolder(matches[0].uri);
			else {
				matches.sort(function (a,b) { if (b.rank - a.rank == 0) return b.lname - a.lname; return b.rank - a.rank; });
				
				let menupopup = QuickFolders.Util.$("QuickFolders-FindPopup");
				
				//reset the popup menu
				while (menupopup.firstChild)
					menupopup.removeChild(menupopup.firstChild);
				for (let j=0; j<matches.length; j++) {
					let menuitem = document.createElement('menuitem');
					// menuitem.className='color menuitem-iconic';
					menuitem.setAttribute('label', matches[j].name);
					menuitem.setAttribute('value', matches[j].uri);
					if (matches[j].type == 'quickFolder')
						menuitem.className = 'quickFolder menuitem-iconic';
					menupopup.appendChild(menuitem);
				}
				menupopup.setAttribute('ignorekeys', 'true');
				if (typeof menupopup.openPopup == 'undefined')
					menupopup.showPopup(textBox, 0, -1,"context","bottomleft","topleft");
				else
					menupopup.openPopup(textBox,'after_start', 0, -1,true,false);  // ,evt
			}
		}
		
		if (isSelected) {
			// success: collapses the search box! 
			this.findFolder(false);
		}	
		else
			textBox.focus();
		  
 	} ,

  // when typing while search results popup is displayed	
	// should be passed on to the (parent) search box
	foundInput: function(element, event) {
		QuickFolders.Util.logDebug("foundInput - " + event);
		element.setAttribute('ignorekeys', 'true');
	} ,
	
	findPopupBlur: function(el, event) {
		QuickFolders.Util.logDebug("findPopupBlur - " + event);
		el.setAttribute('ignorekeys', 'true');
	} ,
	
	selectFound: function(element, event) {
		QuickFolders.Util.logDebug("selectFound - " + event);
		element.setAttribute('ignorekeys', 'true');
	  let el = event.target;
		let URI = el.getAttribute('value');
		let isSelected = QuickFolders_MySelectFolder(URI, true);
		if (isSelected) {
			// success: collapses the search box! 
			this.findFolder(false);
		}
		else {
			if (el.className.indexOf('quickFolder')>=0) {
				this.correctFolderEntry(URI);
			}
			else
				alert('could not find folder!');
		}
	} ,
	
	correctFolderEntry: function(URI) {
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
						alert('Could not find that path either!');
					}
				}
				break;
		}
	} ,
	// selectedTab   - force a certain tab panel to be selected
	// updateMessage - display this message when opening the dialog
	findFolder: function(notify) {
		try {
			let ff = QuickFolders.Util.$("QuickFolders-FindFolder");
			ff.collapsed = !ff.collapsed;
			if (!ff.collapsed) {
				if (notify) {
					QuickFolders.Util.popupProFeature("findFolder");
				}
				ff.focus();
			}
			else {
				ff.value = ""; // reset search box
				// move focus away!
				let msgPane = GetMessagePane();
				if (!msgPane.collapsed) {
					msgPane.focus();
				}
				else {
					let fPane = GetFolderPane();
					if (!fPane.collapsed) {
						fPane.focus();
					}
				}
			}
		}
		catch(ex) {
			QuickFolders.Util.logException("findFolder (" + notify + ") failed.", ex);
		}
	}	,
	
	viewOptions: function(selectedTab, updateMessage) {
		let params = {inn:{mode:"allOptions",tab:selectedTab, message: updateMessage, instance: QuickFolders}, out:null};
		let win = window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',QuickFolders,params).focus();
	} ,

	viewHelp: function() {
		var params = {inn:{mode:"helpOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,

	viewSupport: function() {
		var params = {inn:{mode:"supportOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,resizable,alwaysRaised ',QuickFolders,params).focus();
	} ,

	viewChangeOrder: function() {
		window.openDialog('chrome://quickfolders/content/change-order.xul','quickfolders-change-order',
						  'chrome,titlebar,toolbar,centerscreen,resizable,dependent',QuickFolders); // dependent = modeless
	} ,

	// passing in forceButton is a speed hack for SeaMonkey:
	onTabSelected: function(forceButton) {
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
		
		// update unread folder flag:
		let showNewMail = QuickFolders.Preferences.isHighlightNewMail;
		let newItalic = QuickFolders.Preferences.isItalicsNewMail;
		

		let  tabStyle = QuickFolders.Preferences.ColoredTabStyle; // filled or striped
		for(var i = 0; i < this.buttonsByOffset.length; i++) {
			var button = this.buttonsByOffset[i];
			// filled style, remove striped style
			if ((tabStyle == QuickFolders.Preferences.TABS_FILLED) && (button.className.indexOf("selected-folder")>=0))
				button.className = button.className.replace(/\s*striped/,"");

			// striped style: make sure everyting is striped
			if ((tabStyle == QuickFolders.Preferences.TABS_STRIPED) && (button.className.indexOf("striped")<0))
				button.className = button.className.replace(/(col[0-9]+)/,"$1striped");

			button.className = button.className.replace(/\s*selected-folder/,"");
			button.className = button.className.replace(/(cActive[0-9]+)/,''); // remove active coloring
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
		if((selectedButton)) {
			selectedButton.className += " selected-folder";
			selectedButton.checked = true;
			selectedButton.setAttribute("selected", true); // real tabs
		}

		this.initCurrentFolderTab(this.CurrentFolderTab, folder, selectedButton);
		// single message window:
		if (QuickFolders.Preferences.isShowCurrentFolderToolbar(true)) {
			let winMediator = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"].getService(QuickFolders_CI.nsIWindowMediator);
			let singleMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
			if (singleMessageWindow && singleMessageWindow.gMessageDisplay && singleMessageWindow.gMessageDisplay.displayedMessage) {
				let singleMessageCurrentFolderTab = singleMessageWindow.document.getElementById('QuickFolders-CurrentFolder');
				this.initCurrentFolderTab(singleMessageCurrentFolderTab, singleMessageWindow.gMessageDisplay.displayedMessage.folder);
			}
		}
	} ,
	
	/* MESSAGE PREVIEW TOOLBAR */
	initCurrentFolderTab: function(currentFolderTab, folder, selectedButton) {
		if (!currentFolderTab) return;
		let entry = QuickFolders.Model.getFolderEntry(folder.URI);
		if (selectedButton) {
			currentFolderTab.className = selectedButton.className; // else : "icon";
		}

		QuickFolders.Interface.addFolderButton(folder, entry, -1, currentFolderTab, 'QuickFolders-CurrentFolder', QuickFolders.Preferences.ColoredTabStyle	);
		// QuickFolders.Interface.addPopupSet('QuickFolders-folder-popup-currentFolder', msgFolder, -1, currentFolderTab);
		currentFolderTab.className = currentFolderTab.className.replace("striped", "");
		currentFolderTab.className = currentFolderTab.className.replace("selected-folder", "");
		currentFolderTab.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));
	} ,

	addFolderToCategory: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		var retval={btnClicked:null};
		window.openDialog('chrome://quickfolders/content/set-folder-category.xul',
			'quickfolders-set-folder-category','chrome,titlebar,toolbar,centerscreen,modal=no,resizable', QuickFolders, folder,retval);
		if (retval.btnClicked!=null)
			QuickFolders.Model.update();
	} ,

	getButtonColorClass: function(col, noStripe) {
		//var sColFolder = (tabStyle == 0) ? "chrome://quickfolders/skin/striped" : "chrome://quickfolders/skin/cols";
		let tabStyle = QuickFolders.Preferences.ColoredTabStyle;
		
		return 'col'+col+ 
				((tabStyle == QuickFolders.Preferences.TABS_STRIPED && !noStripe) ? 'striped' : '');
	} ,
	
	getButtonColor: function(button) {
		var cssClass = button.className;
		var rClasses=cssClass.split(' ');
		for (var j=0; j<rClasses.length; j++) {
			// determine number from string, e.g. col1striped or col1
			let f = rClasses[j].indexOf('col');
			if (f>=0)
				return parseInt(rClasses[j].substr(f+3), 10);
		}
		return 0; // no color
	} ,

	setButtonColor: function(button, col, dontStripe) {
		// no more style sheet modification for settings colors.
		if (!button)
			return false;
		var folderLabel = button.getAttribute("label"); // fixes disappearing colors on startup bug

		var cssClass = button.className;
		var newclass = '';
		var rClasses=cssClass.split(' ');
		for (var j=0; j<rClasses.length; j++) {
			// strip previous style
			if (rClasses[j].indexOf('col')<0)
				newclass+=rClasses[j] + ' ';
		}

		newclass += this.getButtonColorClass(col, dontStripe);

		button.className = newclass; // .trim()
		button.setAttribute("colorIndex", col);
		return true;
	} ,

	initElementPaletteClass: function(element, targetElement) {
		if (!element) 
			return;
		let paletteToken = this.getPaletteClass('ColoredTab'); // QuickFolders.Preferences.isPastelColors;
		
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
	setPaintButtonColor: function(col) {
		QuickFolders.Util.logDebugOptional("interface", "setPaintButtonColor(" + col + ")");
		let paintButton = this.PaintButton;
		if (!paintButton)
			return;
		if (col === -1)
			col = this.getButtonColor(paintButton);

		this.setButtonColor(paintButton, col, false);    // let's allow striping
		this.initElementPaletteClass(paintButton);       // palette -> Button
		this.initElementPaletteClass(this.PalettePopup); // palette -> popup
		// striped
		if (QuickFolders.Preferences.ColoredTabStyle == QuickFolders.Preferences.TABS_STRIPED && paintButton.className.indexOf('striped')<0)
			paintButton.className = paintButton.className.replace(/(col[0-9]+)/,'$1striped');
		// filled
		if (QuickFolders.Preferences.ColoredTabStyle == QuickFolders.Preferences.TABS_FILLED && paintButton.className.indexOf('striped')>0)
			paintButton.className = paintButton.className.replace('striped','');
			
		// initialize hover color
		// ==> must become palette type aware as well!
		this.initHoverStyle(
		         this.getStyleSheet(QuickFolders.Styles, 'quickfolders-layout.css', "QuickFolderStyles"), 
		         this.getStyleSheet(QuickFolders.Styles, QuickFolders.Interface.PaletteStyleSheet, ''),
		         true);
	} ,

	// set Tab Color of a button via the palette popup menu
	setTabColorFromMenu: function(menuitem, col) {
		// get parent button of color sub(sub)(sub)menu
		let parent = menuitem;
		let ssPalettes;
		while (!parent.folder && parent.parentNode) {
			parent=parent.parentNode;
			switch(parent.id) {
				case 'QuickFolders-PalettePopup':
					// paint the paintBucketButton
					this.setPaintButtonColor(col);
					return;
				default:  // 'QuickFolders-Options-PalettePopup' etc.
				  if (parent.id.indexOf('QuickFolders-Options-')!=0) 
						continue;  // 
					// options dialog case: parent it menupopup
					//   showPopup should have set this as 'targetNode'
					let targetNode = parent.targetNode;
					// now paint the button
				  QuickFolders.Options.preparePreviewTab(null, null, targetNode.id, col); // [Bug 25589]
				  //QuickFolders.Options.preparePreviewPastel(QuickFolders.Preferences.getBoolPrefQF('pastelColors'));
					//   retrieve about config key to persist setting;
					let styleKey =  targetNode.getAttribute('stylePrefKey');
				  var stylePref = 'style.' + styleKey + '.';
				  if (stylePref)
					  QuickFolders.Preferences.setIntPref(stylePref + 'paletteEntry', col);
					
					// special rule: if this is the Active Tab Color, let's also determine the active BG (bottom pixel of gradient!)
					let paletteClass = this.getPaletteClassCss(styleKey);
					let ruleName = '.quickfolders-flat ' + paletteClass + '.col' + col;
					let engine = QuickFolders.Styles;
					ssPalettes = ssPalettes ? ssPalettes : this.getStyleSheet(engine, QuickFolders.Interface.PaletteStyleSheet, 'QuickFolderPalettes');
					let colPickId = '';
					
					let selectedFontColor = engine.getElementStyle(ssPalettes, ruleName, 'color');
					let previewTab;
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
							if (styleKey == 'DragOver') 
								styleKey = 'DragTab'; // fix naming inconsistency
							QuickFolders.Preferences.setUserStyle(styleKey, "color", selectedFontColor);
							QuickFolders.Options.styleUpdate(styleKey, 'color', selectedFontColor, previewTab);
						}
					}
					
					// find out the last (=main) gradient color and set as background color!
					let selectedGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
					if (selectedGradient !== null) { 
						// get last gradient point (bottom) 
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
									if (styleKey == 'DragOver') 
										styleKey = 'DragTab'; // fix naming inconsistency
									QuickFolders.Preferences.setUserStyle(styleKey, "background-color", rgb);
								}
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
					return; // early exit
			} // end switch
		}
		// or... paint a quickFolders tab
		var theFolder = parent.folder;
		var button = this.getButtonByFolder(theFolder);
		QuickFolders.Util.logToConsole("Interface.setTabColorFromMenu(" + menuitem.toString() + ", " + col + ")" );
		this.setButtonColor(button, col);        // color the  button via palette entry number
		this.initElementPaletteClass(button);    // make sure correct palette is set
		QuickFolders.Model.setFolderColor(theFolder.URI, col, false); // store color in folder string
	} ,

	ensureStyleSheetLoaded: function(Name, Title)
	{
		try {
			QuickFolders.Util.logDebugOptional("css","ensureStyleSheetLoaded(Name: " + Name + ", Title: " + Title + ")" );

			QuickFolders.Styles.getMyStyleSheet(Name, Title); // just to log something in console window

			let sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
								.getService(Components.interfaces.nsIStyleSheetService);
			let ios = Components.classes["@mozilla.org/network/io-service;1"]
								.getService(Components.interfaces.nsIIOService);
			let fileUri = (Name.length && Name.indexOf("chrome://")<0) ? "chrome://quickfolders/content/" + Name : Name;
			let uri = ios.newURI(fileUri, null, null);
			if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
				QuickFolders.Util.logDebugOptional("css", "=============================================================\n"
				                                 + "style sheet not registered - now loading: " + uri);
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
			}
		}
		catch(e) {
			alert('ensureStyleSheetLoaded failed: ' + e);
		}
	} ,
	
	getStyleSheet: function(engine, Name, Title) {
		var sheet = engine.getMyStyleSheet(Name, Title);
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(Name, Title);
			sheet = engine.getMyStyleSheet(Name, Title);
		}

		if (!sheet) {
			QuickFolders.Util.logToConsole("updateUserStyles() - missing style sheet '" +  Name + "' - not found = not attempting any style modifications.");
		}
		return sheet;
	} ,
	
	// HOVER STATE
	initHoverStyle: function(ss, ssPalettes, isPaintMode) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		let templateTabClass =  isPaintMode ? 'ColoredTab' : 'HoveredTab';
		let paletteClass = this.getPaletteClassCss(templateTabClass);
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initHoverStyle()  PaintMode=" + isPaintMode + "   paletteClass=" + paletteClass);
		let engine = QuickFolders.Styles;
		let hoverBackColor = QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","#F90");
		let tabStyle = QuickFolders.Preferences.ColoredTabStyle;
		let noColorClass = (tabStyle == QuickFolders.Preferences.TABS_FILLED) ? 'col0' : 'col0striped';
		let hoverColor = QuickFolders.Preferences.getUserStyle(templateTabClass, "color", "#000000");
		
		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover','background-color', hoverBackColor,true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':hover','background-color', hoverBackColor,true);

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
			let ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry;
			let hoverGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "setting hover gradient[" + ruleName + "]: " + hoverGradient + "\nisPaintMode = " + isPaintMode);
			
			// build some rules..
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':hover', 'background-image', hoverGradient, true); // [class^="col"]
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ':hover', 'background-image', hoverGradient, true); 

			// picked hover color )from paint mode)
			let hc = engine.getElementStyle(ssPalettes, ruleName, 'color');
			hoverColor = hc ? hc : hoverColor;
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder):hover > label','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[buttonover="true"] > label','color', hoverColor, true);
		}
		else {
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds...");
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + ':hover', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ':hover', 'background-image', 'none', true);
			if (tabStyle == QuickFolders.Preferences.TABS_STRIPED) {
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:hover > label','color', hoverColor ,true);
			}
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder):hover > label','color', hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + '[buttonover="true"] > label','color', hoverColor ,true);
			// full monochrome background
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder):hover','background-color', hoverBackColor,true);
		}
	} ,
	
	// DRAGOVER STATE
	initDragOverStyle: function(ss, ssPalettes) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDragOverStyle()");
		let engine = QuickFolders.Styles;
		// let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, 'color');
		let dragOverColor = QuickFolders.Preferences.getUserStyle("DragTab","color","White")
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:-moz-drag-over','background-color', QuickFolders.Preferences.getUserStyle("DragTab","background-color","#E93903"),true);
		
		if (QuickFolders.Preferences.getIntPref('style.DragOver.paletteType')) {
			let paletteClass = this.getPaletteClassCss('DragOver');
			let paletteEntry = QuickFolders.Preferences.getIntPref('style.DragOver.paletteEntry');
			let ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry;
			let dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
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
	
	getPaletteClassCss: function(tabStateId) {
		let cl = this.getPaletteClass(tabStateId);
		return cl.replace(' ', '.');
	} ,
	
	stripPaletteClasses: function(className, exclude) {
	  let stripped = className;
		if (exclude !== 'pastel')
		  stripped = className.replace(/\s*pastel/,'')
		return stripped;
	  
	} ,
	
	getPaletteClass: function(tabStateId) {
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
	
	getPaletteClassToken: function(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return this.getPaletteClassToken(this.getPaletteClass('InactiveTab')); // default
			case 0:
			  return '';  // none
			case 1:
			  return '';  // default
			case 2:
			  return ' pastel';
		}
		return '';
	} ,
	
	// SELECTED FOLDER STATE (.selected-folder)
	initSelectedFolderStyle: function(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initSelectedFolderStyle()");
		let engine = QuickFolders.Styles;
		let colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight");
		let selectedColor = QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText");
		let globalPaletteClass = this.getPaletteClassCss('InactiveTab');
		
		if (QuickFolders.Preferences.getIntPref('style.ActiveTab.paletteType')) {
			let paletteEntry =  QuickFolders.Preferences.getIntPref('style.ActiveTab.paletteEntry');
			let paletteClass = this.getPaletteClassCss('ActiveTab');
			let ruleName = '.quickfolders-flat ' + paletteClass + '.col' + paletteEntry;
			let selectedGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			// selectedColor = engine.getElementStyle(ssPalettes, ruleName, 'color'); // make this overridable!
			engine.setElementStyle(ss, '.quickfolders-flat ' + paletteClass + '.selected-folder', 'background-image', selectedGradient, true);
		}
		else {
			engine.setElementStyle(ss, '.quickfolders-flat ' + globalPaletteClass + '.selected-folder', 'background-image', 'none', true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.selected-folder','background-color', colActiveBG, true);
		}
		engine.setElementStyle(ss, '.quickfolders-flat ' + globalPaletteClass + '.selected-folder > label', 'color', selectedColor ,true);
	} ,
	
	// INACTIVE STATE (DEFAULT)
	initDefaultStyle: function(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDefaultStyle()");
		let engine = QuickFolders.Styles;
		let inactiveBackground = QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace");
		let inactiveColor = QuickFolders.Preferences.getUserStyle("InactiveTab","color","black");
		let paletteClass = this.getPaletteClassCss('InactiveTab');
		let noColorClass = (tabStyle == QuickFolders.Preferences.TABS_FILLED) ? 'col0' : 'col0striped';

		// transparent buttons: means translucent background! :))
		if (QuickFolders.Preferences.getBoolPrefQF('transparentButtons')) 
			inactiveBackground = QuickFolders.Util.getRGBA(inactiveBackground, 0.25) ; 

		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton','background-color', inactiveBackground, true);
		engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton#QuickFolders-CurrentFolder','background-color', inactiveBackground, true);
		
		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType')>0) {
			
			let paletteEntry = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteEntry');
			if (tabStyle === QuickFolders.Preferences.TABS_STRIPED)
				paletteEntry += 'striped';
			let ruleName = ((tabStyle === QuickFolders.Preferences.TABS_FILLED) ? '.quickfolders-flat ' : '') + paletteClass + '.col' + paletteEntry;
			let inactiveGradient = engine.getElementStyle(ssPalettes, ruleName, 'background-image');
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':not(:-moz-drag-over)', 'background-image'); // remove 'none'
			// removed 'toolbarbutton'. qualifier
			engine.setElementStyle(ss, '.quickfolders-flat .' + noColorClass + ':not(:-moz-drag-over)', 'background-image', inactiveGradient, false);
			engine.setElementStyle(ss, '.quickfolders-flat .' + noColorClass + ':not(:-moz-drag-over)#QuickFolders-CurrentFolder', 'background-image', inactiveGradient, false);
			
			let inactiveGradientColor = engine.getElementStyle(ssPalettes, ruleName, 'color');
			if (inactiveGradientColor!=null)
				engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton' + paletteClass + '.' + noColorClass + ' > label','color', inactiveGradientColor, false);
		}
		else {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton.' + noColorClass + ':not(:-moz-drag-over)', 'background-image', 'none', false);
		}
		
	  engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder)' + paletteClass + '.' + noColorClass + ' > label','color', inactiveColor, false);

		// Coloring all striped tabbed buttons that have individual colors 
		if (tabStyle == QuickFolders.Preferences.TABS_STRIPED) {
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder)' + paletteClass + ' > label','color', inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton:not(#QuickFolders-CurrentFolder)' + paletteClass + ' > label','color');
		}
		
	} ,
	
	updateUserStyles: function() {
		try {
			QuickFolders.Util.logDebugOptional ("interface","updateUserStyles()");
			
			// get MAIN STYLE SHEET
			let styleEngine = QuickFolders.Styles;
			let ss = this.getStyleSheet(styleEngine, 'quickfolders-layout.css', 'QuickFolderStyles');
			if (!ss) return false;
			
			// get PALETTE STYLE SHEET
			let ssPalettes = this.getStyleSheet(styleEngine, QuickFolders.Interface.PaletteStyleSheet, '');
			let theme = QuickFolders.Preferences.CurrentTheme;
			let tabStyle = QuickFolders.Preferences.ColoredTabStyle;
			
			if (QuickFolders.Preferences.isCssTransitions) {
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-duration', '1s, 1s, 2s, 1s');
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-property', 'color, background-color, border-radius, -moz-box-shadow');
			}
			else {
				styleEngine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-duration');
				styleEngine.removeElementStyle(ss, '.quickfolders-flat toolbarbutton', 'transition-property');
			}


			// =================
			// FONT COLORS
			let theColorString = QuickFolders.Preferences.getUserStyle("InactiveTab","color","black");
			let colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight");
			if (tabStyle == QuickFolders.Preferences.TABS_FILLED)  {
				styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[background-image].selected-folder','border-bottom-color', colActiveBG, true);
			}

			// =================
			// CUSTOM RADIUS 
			let topRadius = "4px";
			let bottomRadius = "0px";
			if (QuickFolders.Preferences.getBoolPref("extensions.quickfolders.style.corners.customizedRadius")) {
				topRadius =  QuickFolders.Preferences.getUserStyle("corners","customizedTopRadius");
				bottomRadius = QuickFolders.Preferences.getUserStyle("corners","customizedBottomRadius");
			}
			
			let legacyRadius = !QuickFolders.Util.isCSSRadius;				
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-topleft'     : 'border-top-left-radius', topRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-topright'    : 'border-top-right-radius', topRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-bottomleft'  : 'border-bottom-left-radius', bottomRadius, true);
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton', legacyRadius ? '-moz-border-radius-bottomright' : 'border-bottom-right-radius', bottomRadius, true);


			// ==================
			// BORDERS & SHADOWS
			// for full colored tabs color the border as well!
			// but should only apply if background image is set!!
			styleEngine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[background-image].selected-folder','border-bottom-color', colActiveBG, true);
			let SHADOW = QuickFolders.Util.isCSSShadow ? 'box-shadow' : '-moz-box-shadow';
			if (QuickFolders.Preferences.getBoolPrefQF("buttonShadows")) {
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton', SHADOW,'1px -1px 3px -1px rgba(0,0,0,0.7)', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton.selected-folder', SHADOW, '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton:hover', SHADOW, '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
			}
			else {
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton', SHADOW,'none', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton.selected-folder', SHADOW, 'none', true);
				styleEngine.setElementStyle(ss, '.quickfolders-flat .folderBarContainer toolbarbutton:hover', SHADOW,'none', true);
			}

			styleEngine.setElementStyle(ss, 'toolbar.quickfolders-flat','border-bottom-color', colActiveBG, true); // only in main toolbar!

			let theInit = '';
			try {
			  theInit = 'SelectedFolderStyle';
				this.initSelectedFolderStyle(ss, ssPalettes, tabStyle);			
			  theInit = 'DefaultStyle';
				this.initDefaultStyle(ss, ssPalettes, tabStyle);			
			  theInit = 'HoverStyle';
				this.initHoverStyle(ss, ssPalettes, QuickFolders.Interface.PaintModeActive);
			  theInit = 'DragOverStyle';
				this.initDragOverStyle(ss, ssPalettes);
			}
			catch (ex) {
			  QuickFolders.Util.logException("Quickfolders.updateUserStyles - init" + theInit + " failed.", ex);
			}
			
			// TOOLBAR
			theColorString = QuickFolders.Preferences.getUserStyle("Toolbar","background-color","ButtonFace");
			if (QuickFolders.Preferences.getBoolPrefQF("transparentToolbar"))
				theColorString = "transparent";
			styleEngine.setElementStyle(ss, '.toolbar','background-color', theColorString,true);

      // restrict to toolbar only (so as not to affect the panel in currentFolder bar!)
			styleEngine.setElementStyle(ss, 'toolbar.' + theme.cssToolbarClassName, 'background-color', theColorString,true);
			
			this.updateCurrentFolderBar(ss);
			
			let minToolbarHeight = QuickFolders.Preferences.getCharPrefQF('toolbar.minHeight');
			styleEngine.setElementStyle(ss, '#QuickFolders-Toolbar', 'min-height', minToolbarHeight, false);

			QuickFolders.Util.logDebugOptional ("css","updateUserStyles(): success");
			return true;


		}
		catch(e) {
			QuickFolders.Util.logException("Quickfolders.updateUserStyles failed ", e);
			return false;
		};
		return false;

	} ,

	goUpFolder: function() {
		var aFolder = QuickFolders.Util.CurrentFolder;
		if (aFolder && aFolder.parent) {
			var parentFolder = aFolder.parent;
			QuickFolders_MySelectFolder(parentFolder.URI);
		}
	} ,

	goNextQuickFolder: function() {
		var aFolder = QuickFolders.Util.CurrentFolder;
		if (!aFolder) // we are probably in search results
			return;
		var found=false;
		var firstOne = null;
		for (var i=0; i<QuickFolders.Model.selectedFolders.length; i++) {
			var folderEntry = QuickFolders.Model.selectedFolders[i];
			if (!this.shouldDisplayFolder(folderEntry))
				continue;
			if (!firstOne)
				firstOne = folderEntry;
			if (found) {
				// select the QuickFolder
				QuickFolders_MySelectFolder(folderEntry.uri);
				return;
			}
			var folder;
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(firstOne.uri);
	} ,

	goPreviousQuickFolder: function() {
		var aFolder = QuickFolders.Util.CurrentFolder;
		if (!aFolder) // we are probably in search results
			return;
		var found=false;
		var lastOne = null;
		for (var i=QuickFolders.Model.selectedFolders.length-1; i>0; i--) {
			var folderEntry = QuickFolders.Model.selectedFolders[i];
			if (!this.shouldDisplayFolder(folderEntry))
				continue;
			if (!lastOne)
				lastOne = folderEntry;
			if (found) {
				// select the QuickFolder
				QuickFolders_MySelectFolder(folderEntry.uri);
				return;
			}
			var folder;
			if (aFolder == QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, true))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(lastOne.uri);
	} ,

	goPreviousSiblingFolder: function() {
		var aFolder = QuickFolders.Util.CurrentFolder;
		if (!aFolder) // we are probably in search results
			return;
		// nsMsgDBView::NavigateStatus(nsMsgNavigationTypeValue motion, PRBool *_retval)
		//    motion = {  nsMsgNavigationType::nextFolder , nsMsgNavigationType::nextUnreadMessage, nsMsgNavigationType::previousUnreadMessage,
		// performNavigation(nsMsgNavigationType.back);
		var folderList = QuickFolders_MyGetFolderTree();
		var parentFolder = aFolder.parent;
		if (!parentFolder)
			return;
			
		let myenum; // force instanciation for SM
		if (typeof parentFolder.subFolders != 'undefined')
			myenum = parentFolder.subFolders;
		else
			myenum = parentFolder.GetSubFolders();
		var done=false;
		var target=null;
		var folder=null;
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
				var x = null;
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

	goNextSiblingFolder: function() {
		var aFolder = QuickFolders.Util.CurrentFolder;
		if (!aFolder) // we are probably in search results
			return;
		// performNavigation(nsMsgNavigationType.forward);

		var parentFolder = aFolder.parent;
		if (!parentFolder)
			return;

		let myenum; // force instanciation for SM
		if (typeof parentFolder.subFolders != 'undefined')
			myenum = parentFolder.subFolders;
		else
			myenum = parentFolder.GetSubFolders();
		var done=false;
		var found=false;
		var first=null;
		var folder;
		while (!(done)) {
			if (typeof myenum.currentItem!='undefined') {
				folder = myenum.currentItem().QueryInterface(QuickFolders_CI.nsIMsgFolder); // Postbox
				if (typeof myenum.next != 'undefined') {
					try {
						myenum.next();
					}
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
	
	displayNavigationToolbar: function(visible, singleMessage) {
		QuickFolders.Util.logDebugOptional("interface", "displayNavigationToolbar(" + visible + ", singleMessage=" + singleMessage + ")");
		var winMediator = QuickFolders_CC["@mozilla.org/appshell/window-mediator;1"]
						 .getService(QuickFolders_CI.nsIWindowMediator);
		
		var mail3PaneWindow = winMediator.getMostRecentWindow("mail:3pane");
		var mailMessageWindow = winMediator.getMostRecentWindow("mail:messageWindow");
		if (singleMessage) {
			if (null == mailMessageWindow) return; // single message window not displayed
			var doc = mailMessageWindow.document;
		}
		else {
			if (null == mail3PaneWindow) return; // main window not displayed
			doc = mail3PaneWindow.document;
		}
		
		if (!doc) return;
		
		// doc = (mail3PaneWindow ? mail3PaneWindow.document : QuickFolders.doc);

		if (singleMessage) {
			var currentFolderBar = 
				doc.getElementById( "QuickFolders-PreviewToolbarPanel-Single" );
		}
		else {
			var mm = doc.getElementById("multimessage");
			
			currentFolderBar = 
				(mm) 
				? 
				doc.getElementById("QuickFolders-PreviewToolbarPanel-ConversationView")
				:
				doc.getElementById( "QuickFolders-PreviewToolbarPanel" );
		}

		if (currentFolderBar) {
			currentFolderBar.style.display= visible ? '-moz-box' : 'none';
			QuickFolders.Preferences.setShowCurrentFolderToolbar(visible, singleMessage);
		}
		
		if (mm) {
			// toggle the other one off
			var unusedFolderBar =
				(mm.id == "QuickFolders-PreviewToolbarPanel") 
				?
				doc.getElementById("QuickFolders-PreviewToolbarPanel-ConversationView")
				:
				doc.getElementById( "QuickFolders-PreviewToolbarPanel" );
				
			if (unusedFolderBar) 
				unusedFolderBar.style.display = 'none';
				
		}
	} ,

	get CurrentTabMode() {
		var tabMode = null;
		var tabmail = QuickFolders.Util.$("tabmail");

		if (tabmail) {
			var selectedTab = 0;
			if (tabmail.currentTabOwner) {
				tabMode = tabmail.currentTabOwner.type;
			}
			else if (QuickFolders.tabContainer) {
				selectedTab = QuickFolders.tabContainer.selectedIndex;
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

	initToolbarHiding: function() {
		QuickFolders.Util.logDebugOptional("toolbarHiding", "initToolbarHiding");
		var tabmail = QuickFolders.Util.$("tabmail");
		if (tabmail) {
			var me = this;
			var monitor = {
				onTabTitleChanged: function(aTab){},
				onTabSwitched: function(aTab, aOldTab){
					var tabMode = QuickFolders.Interface.CurrentTabMode;
					QuickFolders.Util.logDebugOptional("toolbarHiding", "tabMode = " + tabMode);
					QuickFolders.Interface.onDeckChange(null);
				}
			};
			tabmail.registerTabMonitor(monitor);
			QuickFolders.Util.logDebugOptional("toolbarHiding", "registered Tab Monitor");
		}
	} ,

	onDeckChange : function(event)
	{
		QuickFolders.Util.logDebugOptional("interface", "onDeckChange(" + event + ")");
		let panel = "";
		let isMailPanel = false;
		
		if (!QuickFolders.Preferences.getBoolPrefQF("toolbar.onlyShowInMailWindows"))
			return;
	
		var toolbar = this.Toolbar;
		if (event) {
			var targetId = event.target.id;
			if (targetId != "displayDeck") return;

		 	panel = event.target.selectedPanel.id.toString();
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar + " - panel: " + panel);
		} 
		else { //tab
			panel = this.CurrentTabMode;
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar + " - panel: " + panel);
			if (panel != "glodaSearch-result" && panel != "calendar" && panel != "tasks" && panel != "contentTab")
				isMailPanel = true;
		}
		let isMailSingleMessageTab = (panel == "message") ? true  : false;

		let action = "";
		
		if (panel == "threadPaneBox" || panel == "accountCentralBox" || panel == "folder" || panel == "glodaList" ||
		    isMailPanel && !QuickFolders.Preferences.getBoolPrefQF("toolbar.hideInSingleMessage")) {
			action = "Showing";
			toolbar.removeAttribute("collapsed");
		} 
		else {
			action = "Collapsing";
			toolbar.setAttribute("collapsed", true);
		}
		QuickFolders.Util.logDebugOptional("toolbarHiding",action + " QuickFolders Toolbar (panel=" + panel + ")");
		
		let singleMessageCurrentFolderTab = this.CurrentFolderBar;
		if (singleMessageCurrentFolderTab && !QuickFolders.Preferences.isShowCurrentFolderToolbar(true)) {
			singleMessageCurrentFolderTab.collapsed = isMailSingleMessageTab;
		}

	} ,
	
	toggle_FilterMode: function(active)
	{
		QuickFolders.Util.logDebugOptional("interface", "toggle_FilterMode(" + active + ")");
		QuickFolders.FilterWorker.toggle_FilterMode(active);
	} ,
	
	moveFolder: function(fromFolder, targetFolder) {
		var sPrompt = QuickFolders.Util.getBundleString("qfConfirmMoveFolder", "Really move folder {0} to {1}?");
		var fromURI = fromFolder.URI;
		sPrompt = sPrompt.replace("{0}", fromFolder.prettyName);
		sPrompt = sPrompt.replace("{1}", targetFolder.prettyName);
		let promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		if (promptService.confirm(window, "QuickFolders", sPrompt)) 
		{
			let cs = Components.classes["@mozilla.org/messenger/messagecopyservice;1"]
				.getService(Components.interfaces.nsIMsgCopyService);

			try {
				let count=1; // for the moment only support dragging one folder.
				var ap = QuickFolders.Util.Application;
				var isNewArray = (ap == 'Thunderbird' || ap == 'SeaMonkey');
				for (let i = 0; i < count; i++) {
					let folders = new Array;
					folders.push(fromFolder); // dt.mozGetDataAt("text/x-moz-folder", i).QueryInterface(Ci.nsIMsgFolder)
					let array = 
						isNewArray 
						?
						toXPCOMArray(folders, Components.interfaces.nsIMutableArray)
						:
						QuickFolders_CC["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
					
					if (!isNewArray)
						array.AppendElement(fromFolder);
					
					// cannot move if the target Folder is in a different account?
					// folders[0].server == targetFolder.server
					var isMove = (!fromFolder.locked && fromFolder.canRename && fromFolder.deletable
					              	&&
					               (fromFolder.server.type == 'pop3' || fromFolder.server.type == 'imap' || fromFolder.server.type == 'none'));
					var listener = null;
					cs.CopyFolders(array, 
					               targetFolder,
					               isMove, 
					               listener,
					               msgWindow);
					// in case it has a Tab, fix the uri
					//  see also OnItemRemoved
					// get encoded folder Name:
					var slash = fromURI.lastIndexOf('/');
					var encName = fromURI.substring(slash);
					var newURI = targetFolder.URI + encName;
					QuickFolders.Model.moveFolderURI(fromURI, newURI);
					this.updateFolders(true, true);
					
					// Filter Validation!
					setTimeout(function() {  QuickFolders.FilterList.validateFilterTargets(fromURI, newURI); });
					
				}
			}
			catch(ex) {
				sPrompt = QuickFolders.Util.getBundleString("qfCantMoveFolder", "Folder {0} cannot be moved.");
				sPrompt = sPrompt.replace("{0}", fromFolder.prettyName);
				alert(sPrompt + "\n" + ex);
				QuickFolders.Util.logException("Exception in movefolder ", ex);
			}			
		}
	} ,
	
	prepareCurrentFolderIcons: function() {
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
		let doc = QuickFolders.Interface.getMail3PaneWindow().document;
		let forward = doc.getElementById('button-next');
		if (!forward) 
			forward = doc.getElementById('button-nextUnread');
		let back = doc.getElementById('button-previous');
		if (!back) 
			back = doc.getElementById('button-previousUnread');
		
		// setIcon('quickFoldersNextUnread', forward);
		// setIcon('quickFoldersPreviousUnread', back);
	} ,

	showPalette: function(button) {
		let context = button.getAttribute('context');
		QuickFolders.Util.logDebugOptional("interface", "Interface.showPalette(" + button.id + "): context = " + context);
		this.showPopup(button, context);
	} ,
	
	togglePaintMode: function(mode) {
		QuickFolders.Util.logDebugOptional("interface", "togglePaintMode(" + mode + ")");
		var active;
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
						var mItem = this.createMenuItem("pfPaint", this.getUIstring("qfPaintToggle", "Finish Paint Mode"));
						this.setEventAttribute(mItem, "oncommand",'QuickFolders.Interface.togglePaintMode("off");');
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
		         this.getStyleSheet(QuickFolders.Styles, QuickFolders.Interface.PaletteStyleSheet, ''),
		         this.PaintModeActive);

		// set cursor!
	}

};