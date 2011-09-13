"use strict";
/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


if (!QuickFolders.StringBundle)
	QuickFolders.StringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
if (!QuickFolders.Properties)
	QuickFolders.Properties = QuickFolders.StringBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");

QuickFolders.Interface = {
	TimeoutID: 0,
	LastTimeoutID: 0,
	debugPopupItems: 0,
	buttonsByOffset: [],
	menuPopupsByOffset: [],
	//myPopup: null,
	boundKeyListener: false,
	RecentPopupId: 'QuickFolders-folder-popup-Recent',
	RecentPopupIdCurrentFolderTool: 'QuickFolders-folder-popup-Recent-CurrentFolderTool',

	getUIstring: function(id, defaultString) {
		var theBundle = QuickFolders.Properties;
		var s;
		try{s=theBundle.GetStringFromName(id);}
		catch(e) { s=defaultString; }
		return s;
	},

	setBoundKeyListener: function(b) {
		this.boundKeyListener=b;
	},

	tabSelectUpdate: function() {
		try {
			var folder;
			QuickFolders.Util.logDebugOptional("mailTabs", "tabSelectUpdate - "
				 + QuickFolders.currentURI +"\ntabSelectEnable=" + QuickFolders.tabSelectEnable);
			if (QuickFolders.tabSelectEnable) {
				QuickFolders.Interface.onFolderSelected();
				// change the category (if selected folder is in list)
				folder = GetFirstSelectedMsgFolder();
				if (folder) {
					QuickFolders.Util.logDebugOptional("mailTabs", "Selected Tab: "+ folder.name);
					var entry=QuickFolders.Model.getFolderEntry(folder.URI);
					if (entry) {
						QuickFolders.Util.logDebugOptional ("mailTabs","Current Category =" + this.currentlySelectedCategory ); // + this.getCurrentlySelectedCategoryName()
						QuickFolders.Util.logDebugOptional ("mailTabs","Category of selected folder=" + entry.category);
						// no need to switch / update categories, if ALL is selected!
						if ("__ALL" == this.currentlySelectedCategory) {
							QuickFolders.tabSelectEnable=true;
							return;
						}
						if (!entry.category)
							QuickFolders.Interface.selectCategory("__UNCATEGORIZED", false);
						if (entry.category && entry.category!=this.getCurrentlySelectedCategoryName() && entry.category!="__ALWAYS")
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
	},

	setTabSelectTimer: function() {
			try {
				var nDelay = 250;
				//var func = "QuickFolders.Interface.tabSelectUpdate()"; // changed to closure, according to Michael Buckley's tip:
				var tID=setTimeout(function() { QuickFolders.Interface.tabSelectUpdate(); }, nDelay);
				QuickFolders.Util.logDebug("Folder Tab Select Timer ID: " + tID);
			}
			catch (e) {
				QuickFolders.Util.logDebug("setTabSelectTimer: " + e);
			}
	},

	setFolderUpdateTimer: function() {

		// avoid the overhead if marking a folder with lots of unread mails as read or getting emails
		// made folder update asynchronous instead.
		// we only set a new timer, if there is not already one active.
		if (!(this.TimeoutID)) {
			try {
				var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.queuedFolderUpdateDelay');
				if (!nDelay>0) nDelay = 750;
				//this.TimeoutID = setTimeout(func, nDelay); // changed to closure, according to Michael Buckley's tip:
				this.TimeoutID=setTimeout(function() { QuickFolders.Interface.queuedFolderUpdate(); }, nDelay);
				QuickFolders.Util.logDebug("Folder Tab Select Timer ID: " + this.TimeoutID);

				QuickFolders.Util.logDebug("Setting Update Timer (after timer " + this.LastTimeoutID + " expired), new Timer: " + this.TimeoutID);
				this.LastTimeoutID=this.TimeoutID;
			}
			catch (e) {
				QuickFolders.Util.logDebug("setFolderUpdateTimer: " + e);
			}

		}

	},

	queuedFolderUpdate: function() {
		QuickFolders.Util.logDebug("Folder Update from Timer " + this.TimeoutID + "...");
		this.updateFolders(false, true);
		//reset all timers
		this.TimeoutID=0;
	},

	generateMRUlist: function (ftv) { // generateMap: function ftv_recent_generateMap(ftv)
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
		var MAXRECENT = QuickFolders.Preferences.getIntPrefQF("recentfolders.itemCount");

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
			let recent = [];
			let oldestTime = 0;

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

		var MAXRECENT = QuickFolders.Preferences.getIntPrefQF("recentfolders.itemCount");

		var menu = this;

		// Start iterating at the top of the hierarchy, that is, with the root
		// folders for each account.
		var acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].
					  getService(QuickFolders_CI.nsIMsgAccountManager);
		var count = acctMgr.accounts.Count();
		for (var i = 0; i < count; i++) {
		  var acct = acctMgr.accounts.GetElementAt(i).QueryInterface(QuickFolders_CI.nsIMsgAccount);
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

		for (var i=0; i<recentFolders.length; i++) {
			var f;
			if (isOldFolderList)
				f = recentFolders[i];
			else
				f = recentFolders[i]._folder;
			FoldersArray.appendElement(f, false);
			QuickFolders.Util.logDebugOptional('recentFolders.detail','Recent Folders Array: ' + i + '. appended ' +  f.prettyName);
		}


		// addSubFoldersPopupFromList expects nsISimpleEnumerator, enumerate() convrts the nsIMutableArray
		var isAlphaSorted =  QuickFolders.Preferences.getBoolPrefQF("recentfolders.sortAlphabetical");
		this.addSubFoldersPopupFromList(FoldersArray.enumerate(), menupopup, isDrag, isAlphaSorted, true);
		QuickFolders.Util.logDebugOptional('recentFolders','=============================\n'
			+ 'createRecentPopup Finished!');
		return menupopup;

	} ,

	createRecentTab: function(passedPopup, isDrag, passedButton) {
		try {
			QuickFolders.Util.logDebugOptional('recentFolders','createRecentTab( '
				+ ' passedPopup: ' + (passedPopup==null ? 'null' : passedPopup.id)
				+ ', isDrag: ' + isDrag
				+ ', passedButton: ' + (passedButton==null ? 'null' : passedButton.id)
				+ ')');
			var menupopup;
			var isFolderUpdate = false; //	need this to know if we are creating a fresh button (true) or just rebuild the folders menu on click/drag (false)
			var isCurrentFolderButton = (passedButton==null ? false : (passedButton.id=="QuickFolders-Recent-CurrentFolderTool"));
			var button = passedButton ? passedButton : document.createElement("toolbarbutton");
			if (!passedButton) {
				isFolderUpdate = true;
				var recentLabel = QuickFolders.Preferences.getBoolPrefQF("recentfolders.showLabel") ?
					this.getUIstring("qfRecentFolders", "Recent Folders") : '';
				button.setAttribute("label", recentLabel);
				button.setAttribute("tag", "#Recent");
				button.id="QuickFolders-Recent";

				this.styleFolderButton(button, 0, 0, 'recent' + ((QuickFolders.Preferences.isShowRecentTabIcon() || isCurrentFolderButton) ?  ' icon' : ''));
				this.buttonsByOffset[0] = button; // currently, hard code to be the first! ([0] was [offset])
				var tabColor = QuickFolders.Preferences.recentTabColor();
				if (tabColor)
					this.setButtonColor(button, tabColor);
			}

			menupopup = this.createRecentPopup(passedPopup, isDrag, isFolderUpdate, isCurrentFolderButton);
			if (QuickFolders.Preferences.isPastelColors() && button.className.indexOf("pastel") < 0)
				button.className += " pastel";

			var menuitem;
			if (!isCurrentFolderButton)
				this.menuPopupsByOffset[0] = menupopup;

			if (button.firstChild && typeof button.firstChild != 'undefined') {
				button.removeChild(button.firstChild);
				button.appendChild(menupopup);
			}
			else
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

		this.createRecentTab(this.menuPopupsByOffset[0], false, button);

		if (forceDisplay) {
			// left click: open context menu through code
			QuickFolders.Interface.showPopup(button, this.menuPopupsByOffset[0].id); // this.RecentPopupId
		}
	} ,

	onClickRecentCurrentFolderTools: function(button, evt, forceDisplay) {
		// refresh the recent menu on right click
		this.createRecentTab(null, false, button);

		if (forceDisplay) {
			// left click: open context menu through code
			QuickFolders.Interface.showPopup(button, this.RecentPopupIdCurrentFolderTool);
		}
	} ,

	// added parameter to avoid deleting categories dropdown while selecting from it!
	// new option: minimalUpdate - only checks labels, does not recreate the whole folder tree
	updateFolders: function(rebuildCategories, minimalUpdate) {
		this.TimeoutID=0;

		var showToolIcon = QuickFolders.Preferences.isShowToolIcon();
		QuickFolders.Util.$('QF-mainPopup').collapsed = !showToolIcon;

		QuickFolders.Util.$('QuickFolders-Category-Box').style.display =
		    (!showToolIcon && QuickFolders.Model.getCategories().length == 0)
		    ? 'none' : '-moz-inline-box';


		if(rebuildCategories || QuickFolders.Preferences.isMinimalUpdateDisabled())
			minimalUpdate=false;

		var sDebug='updateFolders(rebuildCategories: ' + rebuildCategories + ', minimal: ' + minimalUpdate +')';
		var toolbar = QuickFolders.Util.$('QuickFolders-Toolbar');

		var theme = QuickFolders.Preferences.getCurrentTheme();
		toolbar.className = theme.cssToolbarClassName;

		var toolbar2 = QuickFolders.Util.$('QuickFolders-CurrentFolderTools');
		if (toolbar2)
			toolbar2.className = theme.cssToolbarClassName;


		if (QuickFolders.Model.selectedFolders.length)
			sDebug += ' - Number of Folders = ' + QuickFolders.Model.selectedFolders.length;

		QuickFolders.Util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			QuickFolders.Util.clearChildren(this.getToolbar(), rebuildCategories);

			// force label when there are no folders!
			QuickFolders.Util.$('QuickFolders-title-label').value = QuickFolders.Preferences.getTextQuickfoldersLabel();

			var showLabelBox = QuickFolders.Preferences.isShowQuickFoldersLabel()||(0==QuickFolders.Model.selectedFolders.length);

			QuickFolders.Util.$('QuickFolders-title-label').collapsed = !showLabelBox;
			QuickFolders.Util.$('QuickFolders-LabelBox').collapsed = !showLabelBox;
			QuickFolders.Util.$('QuickFolders-LabelBox').style.width = showLabelBox ? "auto" : "0px";


			if (rebuildCategories || null==QuickFolders.Util.$('QuickFolders-Category-Selection'))
				this.updateCategories();
		}


		var offset = 0;

		// Recent Folders tab
		if (QuickFolders.Preferences.isShowRecentTab()) {
			if (minimalUpdate ) {
				offset++;
			}
			else
			{
				var rtab = this.createRecentTab(null, false, null);
				if (rtab) {
					this.getToolbar().appendChild(rtab);
					offset++;
				}
			}
		}

		var countFolders = 0;
		// force user colors on first updateFolders (no selected Folder yet!)
		if (QuickFolders.Model.selectedFolders.length) {

			var nTabStyle = QuickFolders.Preferences.getIntPref('extensions.quickfolders.colorTabStyle');

			for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				var folderEntry = QuickFolders.Model.selectedFolders[i];
				var folder;
				var tabColor;
				var button;

				if(!this.shouldDisplayFolder(folderEntry))
					continue;
				try {tabColor = folderEntry.tabColor;}
				catch(e) {tabColor = null};

				if((folder = GetMsgFolderFromUri(folderEntry.uri, true))) {
					countFolders++;
					if (!minimalUpdate) {
						button = this.addFolderButton(folder, folderEntry.name, offset, tabColor, null, null, nTabStyle);
						this.buttonsByOffset[offset] = button;
					}
					else {
						// now just update the folder count on the button label, if it changed.
						// button is not newly created. Also it is not recolored.
						button = this.getButtonByFolder(folder);
						if (button) {
							this.addFolderButton(folder, folderEntry.name, offset, tabColor, button, null, nTabStyle);
						}
					}

					offset++;
				}
			}

			this.onFolderSelected();

			var sDoneWhat = minimalUpdate ? " rebuilt." : " created on Toolbar."
			QuickFolders.Util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
		}

		var button =  QuickFolders.doc.getElementById('QuickFolders-CurrentMail');
		if (button)
			button.setAttribute("ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.messageDragObserver, true)");

	} ,

	updateCategories: function() {
		var bookmarkCategories = QuickFolders.Model.getCategories();
		var lCatCount=0;
		if (bookmarkCategories)
			lCatCount=bookmarkCategories.length;
		QuickFolders.Util.logDebug("updateCategories() - [" + lCatCount + " Categories]");
		var menuList = QuickFolders.Util.$('QuickFolders-Category-Selection');
		var menuPopup = menuList.menupopup;

		QuickFolders.Util.clearChildren(menuPopup,true);

		if(lCatCount > 0) {
			menuList.collapsed = false;
			menuList.style.display = '-moz-box';

			menuPopup.appendChild(this.createMenuItem("__ALL", this.getUIstring("qfAll", "(Display All)")))
			for(var i = 0; i < lCatCount; i++) {
				var category = bookmarkCategories[i];

				if (bookmarkCategories[i] != "__ALWAYS") {
					menuPopup.appendChild(this.createMenuItem(category, category))
				}
			}

			menuPopup.appendChild(document.createElement('menuseparator'));
			var s=this.getUIstring("qfUncategorized","(Uncategorized)");

			menuPopup.appendChild(this.createMenuItem("__UNCATEGORIZED", s))

			if(QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
				menuList.value = this.currentlySelectedCategory
			}
			else {
				menuList.value = "__ALL"
			}
		}
		else {
			QuickFolders.Util.logDebug("No Categories defined, hiding Categories box.");
			menuList.collapsed = true;
			menuList.style.display = 'none';
		}
	} ,

	tidyDeadFolders: function() {
		var countTabs=0;
		var countDeleted=0;
		var sMsg = this.getUIstring('qfTidyDeadFolders',
			'This will remove the Tabs that have no valid folders assigned.\nThis sometimes happens if a folder is removed without QuickFolders being notified.')
		alert(sMsg);
		for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++)
		{
			var folderEntry = QuickFolders.Model.selectedFolders[i];
			// test mail folder for existence
			var folder = GetMsgFolderFromUri(folderEntry.uri, true);
			if (!folder) {
				countTabs++;
				if (confirm(folderEntry.name + this.getUIstring('qfThisTabIsInvalid',': This is a tab that points to an invalid folder:') + '\n'
					+ folderEntry.uri + '\n'
					+ this.getUIstring('qfTabDeletePrompt','Delete this Tab?')))
				{
					QuickFolders.Model.removeFolder(folderEntry.uri, false); // do not store this yet!
					i--; // array is spliced, so we need to go back one!
					countDeleted++;
				}
			}

		}

		if (countDeleted>0) {
			if (confirm(this.getUIstring('qfSavePrompt','Save these changes?'))) {
				QuickFolders.Preferences.setFolderEntries(QuickFolders.Model.selectedFolders);
				this.updateFolders(true, false); // show this on screen
			}
			else {
				// restore model
				QuickFolders.Preferences.getFolderEntries();
				countDeleted=0;
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

	selectCategory: function(categoryName, rebuild) {
		this.currentlySelectedCategory = categoryName ? categoryName : "__UNCATEGORIZED";
		if (categoryName== "__ALWAYS")
			return;
		QuickFolders.Util.logDebug("Selecting Category: " + categoryName + "...");
		this.updateFolders(rebuild, false);

		QuickFolders.Preferences.setLastSelectedCategory(categoryName);
		QuickFolders.Util.logDebug("Successfully selected Category: " + categoryName);
	} ,



	getCurrentlySelectedCategoryName: function() {
		if(this.currentlySelectedCategory == "__ALL" || this.currentlySelectedCategory == "__UNCATEGORIZED") {
			return null;
		}
		else {
			return this.currentlySelectedCategory;
		}
	} ,

	shouldDisplayFolder: function(folderEntry) {
		try {
			if(this.currentlySelectedCategory==null || this.currentlySelectedCategory == "__ALL" || folderEntry.category=="") {
				return true;
			}
			else if(this.currentlySelectedCategory == "__UNCATEGORIZED" && !folderEntry.category) {
				return true;
			}
			else if(!QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
				return true;
			}
			else if (typeof folderEntry.category != "undefined"
						&& folderEntry.category== "__ALWAYS"
						&& this.currentlySelectedCategory != "__UNCATEGORIZED")
				return true;
			else
				return this.currentlySelectedCategory == folderEntry.category;
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

		if (isCtrl && isAlt && dir!='up' && QuickFolders.Preferences.isUseRebuildShortcut()) {
			if ((String.fromCharCode(e.charCode)).toLowerCase() == QuickFolders.Preferences.RebuildShortcutKey().toLowerCase()) {
				this.updateFolders(true,false);
				try{
					QuickFolders.Util.logDebugOptional("events", "Shortcuts rebuilt, after pressing "
					    + (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '')
					    + QuickFolders.Preferences.RebuildShortcutKey());
					QuickFolders.Util.showStatusMessage('QuickFolders tabs were rebuilt');
				} catch(e) {;};
			}
		}

		if (!isCtrl && isAlt && dir!='up' && QuickFolders.Preferences.isUseNavigateShortcuts()) {
			if (e.keyCode == 37)  // ALT + left
				this.goPreviousQuickFolder();

			if (e.keyCode == 39)  // ALT + right
				this.goNextQuickFolder();
		}


		if(QuickFolders.Preferences.isUseKeyboardShortcuts()) {
			var shouldBeHandled =
				(!QuickFolders.Preferences.isUseKeyboardShortcutsCTRL() && isAlt)
				||
				(QuickFolders.Preferences.isUseKeyboardShortcutsCTRL() && isCtrl);

			if(shouldBeHandled) {
				var sFriendly = (isAlt ? 'ALT + ' : '') + (isCtrl ? 'CTRL + ' : '') + (isShift ? 'SHIFT + ' : '') + e.charCode + " : code=" + e.keyCode;
				QuickFolders.Util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
				var shortcut = -1;
				if (dir=='up')
					shortcut = e.keyCode-48;
				if (dir=='down')
					shortcut = e.charCode-48;

				if (shortcut >= 0 && shortcut < 10) {
					e.preventDefault();
					e.stopPropagation();
					if (dir=='down') return;
					if(shortcut == 0) {
						shortcut = 10;
					}

					//alert(shortcut);
					var offset = QuickFolders.Preferences.isShowRecentTab() ? shortcut+1 : shortcut;
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

	getToolbar: function() {
		return QuickFolders.Util.$('QuickFolders-FoldersBox');
	} ,

	getSpecialToolbar: function() {
		return QuickFolders.Util.$('Quickfolders-SpecialTools');
	} ,

	endsWith: function(sURI, sFolder) {
		if (sFolder.length == sURI.length - sURI.indexOf(sFolder))
			return true;
		return false;
	},

	// to fix positioning problems, we replace context with popup
	showPopup: function(button, popupId) {
		var p =  QuickFolders.doc.getElementById(popupId);
		if (p) {
			document.popupNode = button;
			if (typeof p.openPopup=='undefined')
				p.showPopup(button, -1,-1,"context","bottomleft","topleft");
			else
				p.openPopup(button,'after_start', -1,-1,"context",false);
		}
	},

	unReadCount:0, totalCount:0, // to pass temp information from getButtonLabel to styleFolderButton

	getButtonLabel: function(folder, useName, offset) {
		try {
			var numUnread = folder.getNumUnread(false);
			var numUnreadInSubFolders = folder.getNumUnread(true) - numUnread;
			var numTotal = folder.getTotalMessages(false);
			var numTotalInSubFolders = folder.getTotalMessages(true) - numTotal;

			this.unReadCount = numUnread + numUnreadInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders() ? 1 : 0);
			this.totalCount = numTotal + numTotalInSubFolders * (QuickFolders.Preferences.isShowCountInSubFolders() ? 1 : 0);

			var label = "";

			// offset=-1 for folders tabs that are NOT on the quickFOlder bar (e.g. current Folder Panel)
			if (offset>=0) {
				if(QuickFolders.Preferences.isShowShortcutNumbers()) {
					var shortCutNumber = QuickFolders.Preferences.isShowRecentTab() ? offset-1 : offset;
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
				  "unread " + (QuickFolders.Preferences.isShowUnreadCount() ? "(displayed)" : "(not dispayed)") +	": " + numUnread
				+ " - total:" + (QuickFolders.Preferences.isShowTotalCount() ? "(displayed)" : "(not dispayed)") +	 ": " + numTotal);
			var s="";
			if (QuickFolders.Preferences.isShowUnreadCount()) {
				if(numUnread > 0)
					s=s+numUnread;
				if(numUnreadInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders())
					s=s+'+'+numUnreadInSubFolders+'';
				if(s!="")
					displayNumbers.push(s);
			}

			if (QuickFolders.Preferences.isShowTotalCount()) {
				s="";
				if(numTotal > 0)
					s=s+numTotal;
				if(numTotalInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders())
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
	},

	addFolderButton: function(folder, useName, offset, tabColor, theButton, buttonId, fillStyle) {

		var label = this.getButtonLabel(folder, useName, offset);

		var button = (theButton) ? theButton : document.createElement("toolbarbutton"); // create the button!

		button.setAttribute("label", label);


		//button.setAttribute("class",ToolbarStyle); // was toolbar-height!

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		var specialFolderType="";
		var sDisplayIcons = QuickFolders.Preferences.isShowToolbarIcons() ? ' icon': '';
		var pastel = QuickFolders.Preferences.isPastelColors() ? ' pastel': '';

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


		if (fillStyle==1)
			specialFolderType += pastel;
		// this needs to be done also when a minimal Update is done (button passed in)
		this.styleFolderButton(
			button, this.unReadCount, this.totalCount, specialFolderType, tabColor
		);

		button.folder = folder;

		if (null==theButton || (null==button.getAttribute("oncommand"))) {
			button.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));

			button.setAttribute("oncommand",'QuickFolders.Interface.onButtonClick(event.target, event, true);');
		}



		var popupId = 'QuickFolders-folder-popup-'
		          + ((buttonId!=null) ? buttonId : folder.URI);
		button.setAttribute('context',''); // overwrites the parent context menu
		button.setAttribute("oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '")');
		if (buttonId == 'QuickFolders-CurrentFolder') {
			button.setAttribute("onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '")');
			button.setAttribute("ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			button.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");

		}


		if (!theButton) {
			this.getToolbar().appendChild(button);
			button.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
			button.setAttribute("flex",100);
		}

		// popupset is re-done even on minimal update:
		this.addPopupSet(popupId, folder, offset, button);

		if (!theButton) {
			// AG add dragging of buttons
			button.setAttribute("ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
			button.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");

			QuickFolders.Util.logDebugOptional("folders","Folder [" + label + "] added.\n===================================");
		}

		return button;
	} ,

	styleFolderButton: function(button, numUnread, numTotal, specialStyle, tabColor) {

		//reset style!
		var cssClass = '';
		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.getAttribute("label")
			+ ", " + numUnread + ", " + numTotal + ", " + specialStyle + ")");

		if(numUnread > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold()) {
			cssClass += " has-unread";
		}

		if(numTotal > 0 && QuickFolders.Preferences.isShowFoldersWithMessagesItalic()) {
			cssClass += " has-messages";
		}

		if (specialStyle!="")
			cssClass += " " + specialStyle;

		var buttonFontSize = QuickFolders.Preferences.getButtonFontSize();
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
				image = "url('chrome://quickfolders/skin/ico/folder-trash.png')";
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

		button.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
		button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
		button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
		this.getSpecialToolbar().appendChild(button);

	},


	onButtonClick: function(button, evt, isMouseClick) {

		QuickFolders.Util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);

		try {
			if (evt) {

				if(evt.ctrlKey && isMouseClick) {
					var tabmail = document.getElementById("tabmail");
					if (tabmail) {
						switch (QuickFolders.Util.Application()) {
							case 'Thunderbird':
								if (!(QuickFolders.Util.Appver() < 3))
									tabmail.openTab("folder", button.folder); //msgHdr:msgHdr,
								break;
							case 'SeaMonkey':
								tabmail.openTab("3pane", 7, button.folder.URI); // , aMsgHdr
								break;
							case 'Postbox':
								var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
										.getService(Components.interfaces.nsIWindowMediator);
								var winId = windowManager.getMostRecentWindow("mail:3pane");
								winId.MsgOpenNewTabForFolder(button.folder.URI, null /* msgHdr.messageKey key*/, false /*Background*/ )
								break;
						}
					}
				}
			}
		}
		catch (ex) { QuickFolders.Util.logToConsole(ex); };
		if (button.folder)
			QuickFolders_MySelectFolder(button.folder.URI);
	} ,

	onRemoveBookmark: function(element) {
		var popupNode = QuickFolders.Util.getPopupNode(element);
		var msg = popupNode.folder.name + " tab removed from QuickFolders";
		QuickFolders.Model.removeFolder(popupNode.folder.URI, true);
		// this.updateFolders(true); already done!
		try{ QuickFolders.Util.showStatusMessage(msg); } catch(e) {;};
	} ,

	onRenameBookmark: function(element) {
		var popupNode = QuickFolders.Util.getPopupNode(element);
		var sOldName = popupNode.label; //	this.getButtonByFolder(popupNode.folder).label;
		// strip shortcut numbers
		if(QuickFolders.Preferences.isShowShortcutNumbers()) {
			var i = sOldName.indexOf('. ');
			if (i<3 && i>0)
				sOldName = sOldName.substring(i+2,sOldName.length);
		}
		// find if trhere is a number of total messages / unread message in the label, and strip them from renaming!!
		if(QuickFolders.Preferences.isShowTotalCount() || QuickFolders.Preferences.isShowUnreadCount()) {
			var i = sOldName.lastIndexOf(' (');
			var j = sOldName.lastIndexOf(')');
			// TODO: additional check if there are just numbers and commas within the brackets!

			//making sure there is stuff between the () and the last char is a )
			if (i>1 && sOldName.substr(i, j-i).length>0 && j==sOldName.length-1) {
				var bracketedLen = j-i+1;
				QuickFolders.Util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "	length = " + bracketedLen);
			// lets check if this is numeral, after removing any ','
				sOldName = sOldName.substring(0,sOldName.length - bracketedLen);
			}

		}


		var newName = window.prompt(this.getUIstring("qfNewName","Enter a new name for the bookmark")+"\n"+ popupNode.folder.URI, sOldName); // replace folder.name!
		if(newName) {
			QuickFolders.Model.renameFolder(popupNode.folder.URI, newName);
		}
	} ,

	compactFolder: function(folder, command) {
		var s1 = folder.sizeOnDisk;
		QuickFolders.compactLastFolderSize = s1;
		QuickFolders.compactReportCommandType = command;

		// Postbox might get an indexing menu item?
		if (QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') {
			var targetResource = folder.QueryInterface(Components.interfaces.nsIRDFResource);
			QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
			messenger.CompactFolder(GetFolderDatasource(), targetResource, false);
		}
		else {
			QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
			folder.compact(null, msgWindow);
		}
	},

	onCompactFolder: function(element, command) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		this.compactFolder(folder, command);
	},

	onMarkAllRead: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		try {
			var f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
			f.markAllMessagesRead(msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onMarkAllRead " + e);
		}
	},

	onCreateSubFolder: function(folder) {
		try {
			var f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);

			//gFolderTreeController.newFolder( ,msgWindow);
			folder.createSubfolder("test" ,msgWindow);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("QuickFolders.Interface.onCreateSubFolder " + e);
		}
	},

	onDeleteFolder: function(element) {
		var popupParent = QuickFolders.Util.getPopupNode(element);
		var uri = popupParent.folder.URI;

		var result = null;
		if ((QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')) {
			QuickFolders_MySelectFolder(popupParent.folder.URI);
			MsgDeleteFolder();
		}
		else
			gFolderTreeController.deleteFolder(popupParent.folder);

		// if folder is gone, delete quickFolder
		if (!GetMsgFolderFromUri(uri, true))
			QuickFolders.Interface.onRemoveBookmark(popupParent);

	},

	onRenameFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		var theURI = popupNode.folder.URI;
		if (gFolderTreeController && gFolderTreeController.renameFolder) {
			gFolderTreeController.renameFolder(popupNode.folder);
		}
		else { // (QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')
			QuickFolders_MySelectFolder(theURI);
			MsgRenameFolder();
			// var folder = QuickFolders.Model.getMsgFolderFromUri(theURI, false);
			// QuickFolders.Model.renameFolder(theURI, folder.prettyName);
		}
	},

	onEmptyTrash: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		QuickFolders.compactLastFolderSize = folder.sizeOnDisk;
		QuickFolders.compactReportCommandType = 'emptyTrash';

		if ((QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgEmptyTrash();
		}
		else {
			gFolderTreeController.emptyTrash(folder);
		}

		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener

	},


	onEmptyJunk: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		gFolderTreeController.emptyJunk(folder);
		this.compactFolder(folder, 'emptyJunk');
	},


	onDeleteJunk: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if (gFolderTreeController && gFolderTreeController.deleteJunk)
			gFolderTreeController.deleteJunk(folder);
		else
			deleteJunkInFolder();
	},


	onEditVirtualFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			gFolderTreeController.editVirtualFolder(folder);
	},

	onFolderProperties: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgFolderProperties();
		}
		else
			gFolderTreeController.editFolder(null,folder);
	},


	onGetMessages: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if (GetNewMsgs) {
			if (folder.server.type != 'none')
				GetNewMsgs(folder.server, folder);
		}
	},


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
				gFolderDisplay.view.close();
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
			if (isCurrent)
				gFolderDisplay.show(folder);
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
			if ( !(QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird'))
				folder.updateFolder(msgWindow);
		}


		alert(this.getUIstring('qfFolderRepairedMsg','Folder repaired:') + ' ' + folder.prettyName);

	},



	onRepairFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		this.rebuildSummary(folder);
	},

	onNewFolder: function(element) {
		var folder = QuickFolders.Util.getPopupNode(element).folder;
		if ((QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird') || (QuickFolders.Util.Application()=='Postbox') || (QuickFolders.Util.Application()=='SeaMonkey')) {
			QuickFolders_MySelectFolder(folder.URI);
			MsgNewFolder(NewFolder);
		}
		else
			gFolderTreeController.newFolder(folder);
	},



	addPopupSet: function(popupId, folder, offset, button) {

		var menupopup = document.createElement('menupopup');
		menupopup.setAttribute('id',popupId);
		menupopup.setAttribute('position','after_start'); //

		menupopup.className = 'QuickFolders-folder-popup';
		menupopup.folder = folder;

		QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name);

		var menuitem;
		var QuickFolderCmdMenu = null;

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
			var menuColorPopup = document.createElement("menupopup");
			colorMenu.appendChild(menuColorPopup);

			// create color pick items
			var jCol;
			QuickFolders.Util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "...");
			for (jCol=0; jCol<=20;jCol++) {
				menuitem = document.createElement('menuitem');
				menuitem.className='color menuitem-iconic';
				menuitem.setAttribute("tag","qfColor"+jCol);
				if (jCol) {
					menuitem.setAttribute('label',this.getUIstring("qfMenuColor", "Color") + " "+ jCol);
					//menuitem.setAttribute("style","background-image:url('cols/tabcol-" + jCol + ".png')!important;");
				}
				else
					menuitem.setAttribute('label',this.getUIstring("qfMenuTabColorNone", "No Color!"));
				menuitem.setAttribute("oncommand","QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')");
				menuColorPopup.appendChild(menuitem);
			}
			QuickFolders.Util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");

			// append color menu to QFcommandPopup
			QFcommandPopup.appendChild(colorMenu);

			// SelectCategory
			menuitem = document.createElement('menuitem');
			menuitem.className='cmd menuitem-iconic';
			menuitem.setAttribute('tag','qfCategory');
			menuitem.setAttribute('label',this.getUIstring('qfSetCategory', 'Set Bookmark Category...'));
			menuitem.setAttribute('accesskey',this.getUIstring('qfSetCategoryA', 'C'));

			menuitem.setAttribute('oncommand',
				'QuickFolders.Interface.addFolderToCategory(this)');

			QFcommandPopup.appendChild(menuitem);


			// DeleteQuickFolder
			menuitem = document.createElement('menuitem');
			menuitem.setAttribute('tag','qfRemove');
			menuitem.className='cmd menuitem-iconic';

			menuitem.setAttribute('label',this.getUIstring('qfRemoveBookmark', 'Remove bookmark'));
			menuitem.setAttribute('accesskey',this.getUIstring('qfRemoveBookmarkAccess','R'));
			menuitem.setAttribute('oncommand','QuickFolders.Interface.onRemoveBookmark(this)');
			QFcommandPopup.appendChild(menuitem);

			// RenameQuickFolder
			menuitem = document.createElement('menuitem');
			menuitem.className='cmd menuitem-iconic';
			menuitem.setAttribute('tag','qfRename');
			menuitem.setAttribute('label',this.getUIstring('qfRenameBookmark','Rename Bookmark'));
			menuitem.setAttribute('accesskey',this.getUIstring('qfRenameBookmarkAccess','R'));
			menuitem.setAttribute('oncommand','QuickFolders.Interface.onRenameBookmark(this)');
			QFcommandPopup.appendChild(menuitem);

			// --------------------
			QFcommandPopup.appendChild(document.createElement('menuseparator'));
			var menuItemToClone;

			// Options
			menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-options');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}

			// Support
			menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-support');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
			// menuitem.setAttribute('id','');

			// Help
			menuItemToClone= document.getElementById('QuickFolders-ToolbarPopup-help');
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}


			QuickFolderCmdMenu = document.createElement('menu');
			QuickFolderCmdMenu.setAttribute('id','qfQuickFolderCommands');
			QuickFolderCmdMenu.setAttribute('label',this.getUIstring("qfCommandPopup",'QuickFolders Commands'));
			QuickFolderCmdMenu.setAttribute("accesskey",this.getUIstring("qfCommandAccess","Q"));
			QuickFolderCmdMenu.className='cmd menu-iconic';
			QuickFolderCmdMenu.appendChild(QFcommandPopup);

		}


		var fi = folder.QueryInterface(Components.interfaces.nsIMsgFolder);


		/* In certain cases, let's append mail folder commands to the root menu */
		var MailCommands;
		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP) {
			// newsgroups have no subfolders anyway
			MailCommands = menupopup;
		}
		else {
			var MailcommandPopup = document.createElement('menupopup');
			MailcommandPopup.className = 'QuickFolders-folder-popup mailCmd menu-iconic';
			MailCommands = MailcommandPopup;
		}



		/***  MAIL FOLDER COMMANDS	 ***/

		// special folder commands: at top, as these are used most frequently!
		// EmptyTrash
		var topShortCuts = 0;

		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH) {
			menuitem = this.createMenuItem_EmptyTrash();
			MailCommands.appendChild(menuitem);
			if (MailCommands == menupopup)
				topShortCuts ++;
		}

		// Get Newsgroup Mail
		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-getMessages");
			menuitem.setAttribute("oncommand","QuickFolders.Interface.onGetMessages(this);");
			menuitem.setAttribute('label',this.getUIstring("qfGetMail", "Get Messages..."));
			menuitem.setAttribute('accesskey',this.getUIstring("qfGetMailAccess", "G"));
			MailCommands.appendChild(menuitem);
			if (MailCommands == menupopup)
				topShortCuts ++ ;
		}

		// MarkAllRead (always on top)
		if (!(fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH)
		    && !(fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_JUNK)) { // && folder.getNumUnread(false)>0
			menuitem = this.createMenuItem_MarkAllRead();
			menupopup.appendChild(menuitem);
			topShortCuts ++ ;
		}

		if (!(QuickFolders.Util.Application()=="Thunderbird" && QuickFolders.Util.Appver()<3)  && QuickFolders.Util.Application()!="Postbox") {
			// EmptyJunk
			if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_JUNK) {
				menuitem = this.createMenuItem_EmptyJunk();
				MailCommands.appendChild(menuitem);
				if (MailCommands == menupopup)
					topShortCuts ++ ;
			}
			else  if (!(fi.flags & (QuickFolders.Util.Constants.MSG_FOLDER_FLAG_TRASH | QuickFolders.Util.Constants.MSG_FOLDER_FLAG_NEWSGROUP))
			       && button.id == "QuickFolders-CurrentFolder") {
				// delete Junk
				menuitem = this.createMenuItem_DeleteJunk();
				MailCommands.appendChild(menuitem);
				if (MailCommands == menupopup)
					topShortCuts ++ ;
			}
		}

		// EditVirtualFolder
		if (fi.flags & QuickFolders.Util.Constants.MSG_FOLDER_FLAG_VIRTUAL) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-properties");
			menuitem.setAttribute("oncommand","QuickFolders.Interface.onEditVirtualFolder(this);");
			menuitem.setAttribute('label',this.getUIstring("qfEditVirtual", "Search Properties..."));
			menuitem.setAttribute('accesskey',this.getUIstring("qfEditVirtualAccess", "S"));
			MailCommands.appendChild(menuitem);
			if (MailCommands == menupopup)
				topShortCuts ++ ;
		}

		// CompactFolder
		if (fi.canCompact) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-compact");
			menuitem.setAttribute("tag","qfCompact");
			menuitem.setAttribute('label',this.getUIstring("qfCompactFolder", "Compact Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfCompactFolderAccess","C"));
			menuitem.setAttribute("oncommand","QuickFolders.Interface.onCompactFolder(this,'compactFolder')");
			MailCommands.appendChild(menuitem);
		}

		// ===================================
		if (topShortCuts>0)
			MailCommands.appendChild(document.createElement('menuseparator'));


		// NewFolder
		if (fi.canCreateSubfolders) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-new");
			menuitem.setAttribute("oncommand","QuickFolders.Interface.onNewFolder(this);");
			menuitem.setAttribute('label',this.getUIstring("qfNewFolder","New Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfNewFolderAccess","N"));
			MailCommands.appendChild(menuitem);
		}

		// DeleteFolder
		try {
			if (fi.deletable) {
				menuitem = document.createElement('menuitem');
				menuitem.className='mailCmd menuitem-iconic';
				menuitem.setAttribute("id","folderPaneContext-remove");
				menuitem.setAttribute("oncommand","QuickFolders.Interface.onDeleteFolder(this);");
				menuitem.setAttribute('label',this.getUIstring("qfDeleteFolder", "Delete Folder"));
				menuitem.setAttribute("accesskey",this.getUIstring("qfDeleteFolderAccess","D"));
				MailCommands.appendChild(menuitem);
			}
		} catch(e) {;}

		// RenameFolder
		if (fi.canRename) {
			menuitem = document.createElement('menuitem');
			menuitem.className='mailCmd menuitem-iconic';
			menuitem.setAttribute("id","folderPaneContext-rename");
			menuitem.setAttribute("oncommand","QuickFolders.Interface.onRenameFolder(this);");
			menuitem.setAttribute('label',this.getUIstring("qfRenameFolder", "Rename Folder"));
			menuitem.setAttribute("accesskey",this.getUIstring("qfRenameFolderAccess","R"));
			MailCommands.appendChild(menuitem);
			MailCommands.appendChild(document.createElement('menuseparator'));
		}

		// Repair Folder
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		// Global Namespace Pollution: this use of folderRepair is deliberate - the Thundbird folder context menu uses the same id. 
		// This is necessary for better theme integration (same css rules apply)
		menuitem.setAttribute("id","folderRepair");
		menuitem.setAttribute("tag","qfFolderRepair");
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onRepairFolder(this);");
		menuitem.setAttribute('label',this.getUIstring("qfFolderRepair","Repair Folder..."));
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderRepairAccess","F"));
		MailCommands.appendChild(menuitem);

		// Folder Properties
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-properties");
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onFolderProperties(this);");
		menuitem.setAttribute('label',this.getUIstring("qfFolderProperties","Folder Properties..."));
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderPropertiesAccess","P"));
		MailCommands.appendChild(menuitem);

		// build the popup menu
		// 1. TOP LEVEL SPECIAL COMMANDS
		topShortCuts = 0;
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

		if (topShortCuts>0 && fi.hasSubFolders) // separator only if necessary
			menupopup.appendChild(document.createElement('menuseparator'));


		// 2. QUICKFOLDER COMMANDS
		if (QuickFolderCmdMenu)
			menupopup.appendChild(QuickFolderCmdMenu);

		// 3. MAIL FOLDER COMMANDS
		if (menupopup != MailCommands) {
			// Append the Mail Folder Context Menu...
			var MailFolderCmdMenu = document.createElement('menu');
			MailFolderCmdMenu.className='mailCmd menu-iconic';
			MailFolderCmdMenu.setAttribute('id','qfMailFolderCommands');
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
		button.appendChild(menupopup); // was popupset.appendChild

	} ,

	createMenuItem_DeleteJunk: function() {
		var menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","deleteJunk");
		menuitem.setAttribute('label',this.getUIstring("qfDeleteJunk", "Purge Junk"));
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onDeleteJunk(this);");
		return menuitem;
	} ,

	createMenuItem_EmptyJunk: function() {
		var menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyJunk");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyJunk", "Empty Junk"));
		menuitem.setAttribute('accesskey',this.getUIstring("qfEmptyJunkAccess", "Empty Junk"));
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onEmptyJunk(this);");
		return menuitem;
	} ,

	createMenuItem_EmptyTrash: function() {
		var menuitem = document.createElement('menuitem');
		menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-emptyTrash");
		menuitem.setAttribute('label',this.getUIstring("qfEmptyTrash", "Empty Trash"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfEmptyTrashAccess","T"));
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onEmptyTrash(this);event.stopPropagation();");
		return menuitem;
	} ,

	createMenuItem_MarkAllRead: function() {
		var menuitem = document.createElement('menuitem');
		menuitem.className='mailCmd menuitem-iconic';
		menuitem.setAttribute("id","folderPaneContext-markMailFolderAllRead");
		menuitem.setAttribute('label',this.getUIstring("qfMarkAllRead","Mark Folder Read"));
		menuitem.setAttribute('accesskey',this.getUIstring("qfMarkAllReadAccess","M"));
		menuitem.setAttribute("oncommand","QuickFolders.Interface.onMarkAllRead(this)");
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
	},

	addSubMenuEventListener: function (subMenu, url) {
		// url is specific to this function context so it should be snapshotted from here
		// we need this workaround as TB2 does not support the 'let' keyword
		subMenu.addEventListener("click",
			function(evt) { QuickFolders.Interface.onSelectParentFolder(url, evt); }, false);
	},

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
					break;
				default:
					if (!QuickFolders.Preferences.getBoolPrefQF("dragToCreateFolder." + server.type)) {
						QuickFolders.Util.logDebugOptional("dragToNew","Not enabled: drag & create new folder for server's of type: " + server.type);
						return;
					}
			}

			var folderPaneContext = document.getElementById('folderPaneContext');
			if (folderPaneContext) {
				var newMenuItem = document.getElementById('folderPaneContext-new');
				if (newMenuItem) {
					var createFolderMenuItem=newMenuItem.cloneNode(true);
					if(folder.hasSubFolders)
						popupMenu.appendChild(document.createElement('menuseparator'));
					createFolderMenuItem.id=""; // delete existing menu
					createFolderMenuItem.id="folderPaneContext-new"; // for styling!
					createFolderMenuItem.folder=folder;
					// use parent folder URI as each starting point
					// createFolderMenuItem.setAttribute("oncommand","QuickFolders.Interface.onCreateSubFolder(GetMsgFolderFromURI('" + folder.URI + "'));");

					createFolderMenuItem.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					createFolderMenuItem.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.popupDragObserver);");  // only case where we use the dedicated observer of the popup!
					createFolderMenuItem.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");


					popupMenu.appendChild(createFolderMenuItem);
				}
			}
		}
		catch(ex) {QuickFolders.Util.logException('Exception in addDragToNewFolderItem (adding drag Menu items): ', ex); }
	},

	// isDrag: if this is set to true, then the command items are not included
	addSubFoldersPopupFromList: function(subfolders, popupMenu, isDrag, forceAlphaSort, includeAccountName) {
		var killDiacritics = function(s) {
			return s.toLowerCase().replace(/[_\xE0-\xE6\xE8-\xEB\xF2-\xF6\xEC-\xEF\xF9-\xFC\xFF\xDF\x3A]/gi, function($0) { return tr[$0] })
		}
		var subfolder;
		var appver=QuickFolders.Util.Appver();

		var done = false;

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

				var menuLabel = subfolder.name;

				var hostString = subfolder.rootFolder.name;
				if (includeAccountName) {
					menuLabel = subfolder.name + ' - ' + hostString;
					if (QuickFolders.Preferences.isDebugOption('recentFolders.detail'))
						menuLabel = subfolder.getStringProperty("MRUTime") + ' - ' + menuLabel;
				}

				menuitem.setAttribute('label', menuLabel); //+ subfolder.URI
				menuitem.setAttribute("tag","sub");

				var numUnread = subfolder.getNumUnread(false);
				var numUnreadInSubFolders = subfolder.getNumUnread(true) - numUnread;
				var sCount = ' (' + ((numUnread>0) ? numUnread : '') ;
				if (numUnread + numUnreadInSubFolders == 0)
					sCount = ''


				if (numUnreadInSubFolders+numUnread>0) {
					if(numUnreadInSubFolders > 0 && QuickFolders.Preferences.isShowCountInSubFolders())
						sCount += '+'+numUnreadInSubFolders+'';
					sCount += ")";
					if (!QuickFolders.Preferences.isShowCountInSubFolders() && numUnread==0)
						sCount="";

					menuitem.setAttribute("class","hasUnread menuitem-iconic");
					menuitem.setAttribute('label', menuLabel + sCount);
				}
				else
					menuitem.setAttribute("class","menuitem-iconic");
				if (! (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders()))
					menuitem.setAttribute("oncommand","QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "',event)");

				if (true) {
					// AG added "empty" click event to avoid bubbling to parent menu!
					menuitem.addEventListener("click", function(evt) { evt.stopPropagation(); }, false);
				}

				QuickFolders.Util.logDebugOptional("popupmenus","add oncommand event for menuitem " + menuitem.getAttribute("label") + " onSelectSubFolder(" + subfolder.URI+ ")");

				menuitem.folder = subfolder;
				if (!(QuickFolders.Util.Application()=='Thunderbird' && appver<3))
					menuitem.setAttribute("ondragenter","event.preventDefault()"); // fix layout issues in TB3 + Postbox!
				menuitem.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.popupDragObserver)"); // okay
				menuitem.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
				menuitem.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

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


				if (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders())
				{
					this.debugPopupItems++;
					//QuickFolders.Util.logToConsole("folder " + subfolder.name + " has subfolders");
					var subMenu = document.createElement('menu');
					subMenu.setAttribute("label", menuLabel + sCount);
					subMenu.className = 'QuickFolders-folder-popup' + ((numUnreadInSubFolders+numUnread>0) ? ' hasUnread' : '');

					subMenu.folder = subfolder;

					subMenu.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
					subMenu.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
					subMenu.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

					// 11/08/2010 - had forgotten the possibility of _opening_ the folder popup node's folder!! :)
					//subMenu.allowEvents=true;
					// oncommand did not work
					QuickFolders.Util.logDebugOptional("popupmenus","add click listener for subMenu " + subMenu.getAttribute("label") + " onSelectParentFolder(" + subfolder.URI+ ")");

					//let uriCopy = subfolder.URI; // snapshot! (not working in TB2)
					this.addSubMenuEventListener(subMenu, subfolder.URI); // create a new context for copying URI

					var subPopup = document.createElement("menupopup");


					subMenu.appendChild(subPopup);
					//popupMenu.appendChild(subMenu); // append it to main menu

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
	},


	// add all subfolders (1st level, non recursive) of folder to popupMenu
	addSubFoldersPopup: function(popupMenu, folder, isDrag) {
		if (folder.hasSubFolders) {
			var subfolders;
			var isTB2 = false;
			if (typeof folder.subFolders != 'undefined')
				subfolders = folder.subFolders;
			else
				subfolders = folder.GetSubFolders();

			if (QuickFolders.Util.Application()=='Thunderbird')
				if (QuickFolders.Util.Appver()<3)
					isTB2=true;

			var isAlphaSorted = QuickFolders.Preferences.isSortSubfolderMenus()
			this.addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, isAlphaSorted, false);
		}

		// append the "Create New Folder" menu item!
		if (isDrag && !isTB2) {
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
				if (QuickFolders.Util.HostSystem()=='linux' && QuickFolders.Util.Appver()<3) {
					var lastmenu=p;

					// in linux, toolbarbutton is box - let's navigate up to the toolbar instead
					while (null!=p.parentNode && p.parentNode.tagName!='toolbar') {
						if(p.tagName=='menupopup') lastmenu=p;
						p=p.parentNode;
					}

				  if (lastmenu.tagName=='menupopup') {
					QuickFolders_globalHidePopupId = lastmenu.id;
					var popOne = document.getElementById(QuickFolders_globalHidePopupId);
					try {
						//popOne.parentNode.removeChild(popOne); //was popup.hidePopup()
						//QuickFolders_globalHidePopupId="";
					} catch (e) { alert (e); }
				  }
				}
				else {	// not linux
				   while (null!=p.parentNode && p.tagName!='toolbar') {
					 p=p.parentNode;
					 QuickFolders.Util.logDebug ("parenttag=" + p.tagName);
					 QuickFolders.Util.logDebug ("node= " + p.nodeName);
					 if (p.tagName=='menupopup') {
						QuickFolders.Util.logDebug ("Try hide parent Popup " + p.getAttribute('label'));
						p.hidePopup();
					 }
				   }
				} // else not linux
				break;

			case 'toolbarbutton':
				QuickFolders_globalHidePopupId='moveTo_'+Target.folder.URI;
				QuickFolders.Util.logDebug ("set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				var popup = document.getElementById(QuickFolders_globalHidePopupId);
				try {
					popup.parentNode.removeChild(popup); //was popup.hidePopup()
					QuickFolders_globalHidePopupId="";
				}
				catch(e) {
					QuickFolders.Util.logDebug ("Could not remove popup of " + QuickFolders_globalHidePopupId );
				}
				break;

		}
	},

	onSelectParentFolder: function(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("popupMenus", "onSelectParentFolder: " + folderUri);
		this.onSelectSubFolder(folderUri, evt);
		evt.stopPropagation(); // avoid oncommand bubbling up!
		QuickFolders.Interface.collapseParentMenus(evt.target);
	} ,

	// select subfolder (on click)
	onSelectSubFolder: function(folderUri, evt) {
		QuickFolders.Util.logDebugOptional ("popupMenus", "onSelectSubFolder: " + folderUri);
		try {
			if (evt) {
				if(evt.ctrlKey) {
					var tabmail = document.getElementById("tabmail");
					if (tabmail) {
						switch (QuickFolders.Util.Application()) {
							case 'Thunderbird':
								if (!(QuickFolders.Util.Appver() < 3))
									tabmail.openTab("folder", {folder: folderUri, messagePaneVisible:true } );
								break;
							case 'SeaMonkey':
								tabmail.openTab("3pane", 7, folderUri);
								break;
							case 'Postbox':
								var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
										.getService(Components.interfaces.nsIWindowMediator);
								var winId = windowManager.getMostRecentWindow("mail:3pane");
								winId.MsgOpenNewTabForFolder(folderUri, null /* msgHdr.messageKey key*/, false /*Background*/ )
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


	// selectedTab   - force a certain tab panel to be selected
	// updateMessage - display this message when opening the dialog
	viewOptions: function(selectedTab, updateMessage) {
		// temporarily disable instantApply! Necessary for the time consuming style sheet changes in Layout tab.
		var b=QuickFolders.Preferences.getInstantApplyPref();
		QuickFolders.Preferences.setInstantApplyPref(false);
		var params = {inn:{mode:"allOptions",tab:selectedTab, message: updateMessage, instance: QuickFolders}, out:null};
		var win = window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,modal,resizable',QuickFolders,params).focus();
		QuickFolders.Preferences.setInstantApplyPref(b);
	} ,

	viewHelp: function() {
		var params = {inn:{mode:"helpOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,modal,resizable',QuickFolders,params).focus();
	} ,

	viewSupport: function() {
		var params = {inn:{mode:"supportOnly",tab:-1, message: "", instance: QuickFolders}, out:null};
		window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,modal,resizable',QuickFolders,params).focus();
	} ,

	viewChangeOrder: function() {
		window.openDialog('chrome://quickfolders/content/change-order.xul','quickfolders-change-order',
						  'chrome,titlebar,toolbar,centerscreen,resizable,dependent',QuickFolders); // dependent = modeless
	} ,

	onFolderSelected: function() {
		var folder;
		try  {
			// avoid TB logging unnecessary errors in Stack Trace
			if ((QuickFolders.Util.Appver() >= 3 && QuickFolders.Util.Application()=='Thunderbird') && !gFolderTreeView )
				return;
			folder = GetFirstSelectedMsgFolder();
		}
		catch (e) { return; }
		if (null==folder) return; // cut out lots of unneccessary processing!

		var nTabStyle = QuickFolders.Preferences.getIntPref('extensions.quickfolders.colorTabStyle'); // filled or striped
		for(var i = 0; i < this.buttonsByOffset.length; i++) {
			var button = this.buttonsByOffset[i];
			// filled style, remove striped style
			if ((nTabStyle==1) && (button.className.indexOf("selected-folder")>=0))
				button.className = button.className.replace(/\s*striped/,"");
			// striped style: make sure everyting is striped
			if ((nTabStyle==0) && (button.className.indexOf("striped")<0))
				button.className = button.className.replace(/(col[0-9]+)/,"$1striped");
			button.className = button.className.replace(/\s*selected-folder/,"");
			// remove "selected" attribute of tab look
			if (button.hasAttribute("selected"))
				button.removeAttribute("selected");

		}

		var selectedButton;

		if((selectedButton = this.getButtonByFolder(folder))) {
			selectedButton.className += " selected-folder";
			selectedButton.setAttribute("selected", true); // real tabs
			//  make selected folder striped style so it "sticks out"!
			if (QuickFolders.Preferences.getCurrentThemeId() == QuickFolders.Themes.themes.Flat.Id) {
				// non-pastel mode@ make selected folder striped style so it "sticks out"!
				if (nTabStyle==1) { // full
					if (!QuickFolders.Preferences.isPastelColors())
						selectedButton.className = selectedButton.className.replace(/(col[0-9]+)/,"$1striped");
					else
						selectedButton.className.replace(/\s*pastel/,""); // emphasize through use of non-pastel style
				}
				else { // striped style, active button colored fully!
						selectedButton.className = selectedButton.className.replace("striped","");
						// avoid pastel duplicates
						if (QuickFolders.Preferences.isPastelColors()
						    &&
						    selectedButton.className.indexOf("pastel")<0)
							selectedButton.className += " pastel"
				}

			}
		}

		/* MESSAGE PREVIEW TOOLBAR */
		var currentFolderTab = document.getElementById('QuickFolders-CurrentFolder');
		if (currentFolderTab) {
			var tabColor;
			var folderEntry = QuickFolders.Model.getFolderEntry(folder.URI);
			var theLabel = folderEntry ? folderEntry.name : "";

			currentFolderTab.className =  (null!=selectedButton) ? selectedButton.className : "icon";
			currentFolderTab.className = currentFolderTab.className.replace("striped", "");
			if (null!=folderEntry) {
				try {
					tabColor = folderEntry.tabColor;
				}
				catch(e) {tabColor = null};
			}
			currentFolderTab.className +=  " selected-folder";

			QuickFolders.Interface.addFolderButton(folder, theLabel, -1, tabColor, currentFolderTab, 'QuickFolders-CurrentFolder', nTabStyle);
			currentFolderTab.setAttribute("tooltiptext", QuickFolders.Util.getFolderTooltip(folder));
		}


	},

	addFolderToCategory: function(element) {
		var popupNode = QuickFolders.Util.getPopupNode(element);
		var retval={btnClicked:null};
		window.openDialog('chrome://quickfolders/content/set-folder-category.xul','quickfolders-set-folder-category','chrome,titlebar,toolbar,centerscreen,modal',QuickFolders,popupNode.folder,retval);
		if (retval.btnClicked!=null)
			QuickFolders.Model.update();
	},

	getButtonColorClass: function(col) {
		//var sColFolder = (nTabStyle==0) ? "chrome://quickfolders/skin/striped" : "chrome://quickfolders/skin/cols";
		var nTabStyle = QuickFolders.Preferences.getIntPref('extensions.quickfolders.colorTabStyle');
		return 'col'+col+ ((nTabStyle==0) ? 'striped' : '');
	},

	setButtonColor: function(button, col) {
		// no more style sheet modification for settings colors.
		var folderLabel = button.getAttribute("label"); // fixes disappearing colors on startup bug


		var cssClass = button.getAttribute("class");
		var newclass = '';
		var rClasses=cssClass.split(' ');
		for (var j=0; j<rClasses.length; j++) {
			// strip previous style
			if (rClasses[j].indexOf('col')<0)
				newclass+=rClasses[j] + ' ';
		}

		newclass += this.getButtonColorClass(col);

		button.setAttribute("class", newclass); // .trim()
		return true;

	},

	setTabColorFromMenu: function(menuitem, col) {
		// get parent button of color sub(sub)(sub)menu
		parent=menuitem;
		while (!parent.folder && parent.parentNode)
			parent=parent.parentNode;
		var theFolder = parent.folder;
		var button = this.getButtonByFolder(theFolder);
		QuickFolders.Util.logToConsole("Interface.setTabColorFromMenu(" + menuitem.toString() + ', ' + theFolder.URI + ", " + col + ")" );
		this.setButtonColor(button, col);
		QuickFolders.Model.setFolderColor(theFolder.URI, col, false); // store color in folder string
	},

	ensureStyleSheetLoaded: function()
	{
		try {
			QuickFolders.Util.logDebugOptional("css","ensureStyleSheetLoaded...");

			QuickFolders.Styles.getMyStyleSheet(); // just to log something in console window

			var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
								.getService(Components.interfaces.nsIStyleSheetService);
			var ios = Components.classes["@mozilla.org/network/io-service;1"]
								.getService(Components.interfaces.nsIIOService);
			var uri = ios.newURI("chrome://quickfolders/content/quickfolders-layout.css", null, null);
			if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
				QuickFolders.Util.logDebugOptional("css","sheet not Registered - now loading: " + uri);
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
			}
		}
		catch(e) {
			alert('ensureStyleSheetLoaded failed: ' + e);
		}
	} ,


	updateUserStyles: function() {
		try {
			QuickFolders.Util.logDebugOptional ("css","updateUserStyles()...");
			var ss=QuickFolders.Styles.getMyStyleSheet();
			if (!ss) {
				this.ensureStyleSheetLoaded();
				ss=QuickFolders.Styles.getMyStyleSheet();
			}

			if (!ss) {
				QuickFolders.Util.logToConsole("updateUserStyles() - No style sheet found = not attempting any style modifications.");
				return false;
			}
			var colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight");
			var theColorString = QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace");

			// if(theColorString == "ButtonFace")

			// transparent buttons: means translucent background! :))
			if (QuickFolders.Preferences.getBoolPrefQF("transparentButtons"))
				theColorString = QuickFolders.Util.getRGBA(theColorString, 0.25) ; // better than "transparent";

			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton','background-color', theColorString, true);
			// doesn't work:
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton#QuickFolders-CurrentFolder','background-color', theColorString, true);

			theColorString = QuickFolders.Preferences.getUserStyle("InactiveTab","color","black");
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.col0 > *', 'color', theColorString, false);
			// doesn't work:
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton#QuickFolders-CurrentFolder','color', theColorString, true);

			// Custom Radius setting
			var topRadius = "4px";
			var bottomRadius = "0px";
			if (QuickFolders.Preferences.getBoolPref("extensions.quickfolders.style.corners.customizedRadius")) {
				var topRadius =  QuickFolders.Preferences.getUserStyle("corners","customizedTopRadius");
				var bottomRadius = QuickFolders.Preferences.getUserStyle("corners","customizedBottomRadius");
			}
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-border-radius-topleft', topRadius, true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-border-radius-topright', topRadius, true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-border-radius-bottomleft', bottomRadius, true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-border-radius-bottomright', bottomRadius, true);


			// for full colored tabs color the border as well!
			// but should only apply if background image is set!!
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton[background-image].selected-folder','border-bottom-color', colActiveBG, true);
			if (!(QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird')) {
				if (QuickFolders.Preferences.getBoolPrefQF("buttonShadows")) {
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-box-shadow','1px -1px 3px -1px rgba(0,0,0,0.7)', true);
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.selected-folder','-moz-box-shadow', '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton:hover','-moz-box-shadow', '0px 0px 2px -1px rgba(0,0,0,0.9)', true);
				}
				else {
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton','-moz-box-shadow','none', true);
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.selected-folder','-moz-box-shadow', 'none', true);
					QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton:hover','-moz-box-shadow', 'none', true);
				}
			}

			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.col0.selected-folder > *','color',
				QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),true);

			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat','border-bottom-color', colActiveBG,true);

			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton:hover','background-color',
				QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","#F90"),true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.col0:hover > *','color',
				QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black"),true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.col0[buttonover="true"] > *','color',
				QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black"),true);

			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton:-moz-drag-over','background-color',
				QuickFolders.Preferences.getUserStyle("DragTab","background-color","#E93903"),true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.col0:-moz-drag-over > *','color',
				QuickFolders.Preferences.getUserStyle("DragTab","color","White"),true);

			theColorString = QuickFolders.Preferences.getUserStyle("Toolbar","background-color","ButtonFace");
			if (QuickFolders.Preferences.getBoolPrefQF("transparentToolbar"))
				theColorString = "transparent";
			QuickFolders.Styles.setElementStyle(ss, '.toolbar','background-color', theColorString,true);
			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat','background-color', theColorString,true);


			QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat #QuickFolders-FoldersBox toolbarbutton.selected-folder','background-color', colActiveBG, true);


			QuickFolders.Util.logDebugOptional ("css","updateUserStyles(): success");
			return true;


		}
		catch(e) {
			alert("Quickfolders.updateUserStyles - error " + e);
			return false;
		};
		return false;

	} ,

	goUpFolder: function() {
		var aFolder = QuickFolders.Util.getCurrentFolder();
		parentFolder = aFolder.parent;
		QuickFolders_MySelectFolder(parentFolder.URI);
	} ,

	goNextQuickFolder: function() {
		var aFolder = QuickFolders.Util.getCurrentFolder();
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
			if (aFolder == GetMsgFolderFromUri(folderEntry.uri, true))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(firstOne.uri);
	} ,

	goPreviousQuickFolder: function() {
		var aFolder = QuickFolders.Util.getCurrentFolder();
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
			if (aFolder == GetMsgFolderFromUri(folderEntry.uri, true))
				found=true;
		}
		if (found)
			QuickFolders_MySelectFolder(lastOne.uri);
	} ,

	goPreviousSiblingFolder: function() {
		var aFolder = QuickFolders.Util.getCurrentFolder();
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
				var next=null;
				var x = null;
				while (target==null) {  // we are at start, lets go to the end (wrap around)
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
						else
							target = x.QueryInterface(Components.interfaces.nsIMsgFolder);
					}
				}
			}
		}
		if (null!=target)
			QuickFolders_MySelectFolder(target.URI);

	} ,

	goNextSiblingFolder: function() {
		var aFolder = QuickFolders.Util.getCurrentFolder();
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

	displayNavigationToolbar: function(visible) {
		var mm = document.getElementById("multimessage");
		
		var currentFolderBar = 
			(mm) 
			? 
			document.getElementById("QuickFolders-PreviewToolbarPanel-ConversationView")
			:
			document.getElementById( "QuickFolders-PreviewToolbarPanel" );

		if (currentFolderBar) {
			currentFolderBar.style.display= visible ? '-moz-box' : 'none';
			QuickFolders.Preferences.setShowCurrentFolderToolbar(visible);
		}
		if (mm) {
			var unusedFolderBar =
				(mm.id == "QuickFolders-PreviewToolbarPanel") 
				?
				document.getElementById("QuickFolders-PreviewToolbarPanel-ConversationView")
				:
				document.getElementById( "QuickFolders-PreviewToolbarPanel" );
				
			if (unusedFolderBar) 
				unusedFolderBar.style.display = 'none';
				
		}
	},

	getCurrentTabMode : function() {
		var tabMode = null;
		var tabmail = document.getElementById("tabmail");

		if (tabmail) {

			var selectedTab = 0;
			if (tabmail.currentTabOwner) {
				tabMode = tabmail.currentTabOwner.type;
			}
			else if (tabmail.tabContainer) {
				selectedTab = tabmail.tabContainer.selectedIndex;
				if (selectedTab>=0) {
					var tab = tabmail.tabInfo[tabmail.tabContainer.selectedIndex];
					tabMode = tab.mode.type;
					if (tabMode == "glodaSearch" && tab.collection) { //distinguish gloda search result
						tabMode = "glodaSearch-result";
					}
				}
			}
		}

		return tabMode;
	},


	initToolbarHiding: function() {
		QuickFolders.Util.logDebugOptional("toolbarHiding", "initToolbarHiding");
		var tabmail = document.getElementById("tabmail");
		if (tabmail) {
			var me = this;
			var monitor = {
				onTabTitleChanged: function(aTab){},
				onTabSwitched: function(aTab, aOldTab){
					var tabMode = QuickFolders.Interface.getCurrentTabMode();
					QuickFolders.Util.logDebugOptional("toolbarHiding", "tabMode = " + tabMode);
					QuickFolders.Interface.onDeckChange(null);
				}
			};
		  	tabmail.registerTabMonitor(monitor);
			QuickFolders.Util.logDebugOptional("toolbarHiding", "registered Tab Monitor");
		}
	},

	onDeckChange : function(event)
	{
		var panel = "";

		if (!QuickFolders.Preferences.getBoolPrefQF("toolbar.onlyShowInMailWindows"))
			return;

		var toolbar = document.getElementById("QuickFolders-Toolbar");
		if (event) {
			var targetId = event.target.id;
			if (targetId != "displayDeck") return;

		 	panel = event.target.selectedPanel.id.toString();
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar + " - panel: " + panel);
		} else { //tab
			panel = this.getCurrentTabMode().toString();
			QuickFolders.Util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar + " - panel: " + panel);
			if (panel != "glodaSearch-result" && panel != "calendar" && panel != "tasks" && panel != "contentTab")
				panel = "showQFbar";
		}

		var action = "";
		if (panel == "threadPaneBox" || panel == "accountCentralBox" || panel == "showQFbar") {
			action = "Showing";
			toolbar.removeAttribute("collapsed");
		} else {
			action = "Collapsing";
			toolbar.setAttribute("collapsed", true);
		}
		QuickFolders.Util.logDebugOptional("toolbarHiding",action + " QuickFolders Toolbar (panel=" + panel + ")");

	}



};