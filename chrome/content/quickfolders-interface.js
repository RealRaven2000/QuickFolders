"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

/* import-globals-from folderDisplay.js */ 
//  we need gFolderDisplay.navigate !!!!

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

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
	RecentPopupId: "QuickFolders-folder-popup-Recent",
	RecentPopupIdCurrentFolderTool: "QuickFolders-folder-popup-Recent-CurrentFolderTool",
	_paletteStyleSheet: null,
	_paletteStyleSheetOfOptions: null,
	isCommandListeners: QuickFolders.Preferences.getBoolPref("debug.popupmenus.isCommandListeners"), // [false] remove these later
	isOncommandAttributes: QuickFolders.Preferences.getBoolPref("debug.popupmenus.isOnCommandAttr"), // [false] remove these later
	_verticalMenuOffset: QuickFolders.Preferences.getIntPref("debug.popupmenus.verticalOffset"),
	get verticalMenuOffset() { return this._verticalMenuOffset; },
	set verticalMenuOffset(o) { this._verticalMenuOffset = o; QuickFolders.Preferences.setIntPref("debug.popupmenus.verticalOffset", o)},
	get CategoryBox() { return  QuickFolders.Util.$("QuickFolders-Category-Box"); },
	get FilterToggleButton() { return QuickFolders.Util.$("QuickFolders-filterActive"); },
	get CogWheelPopupButton () { return QuickFolders.Util.$("QuickFolders-mainPopup"); },
	get QuickMoveButton () { return QuickFolders.Util.$("QuickFolders-quickMove"); },
  get ReadingListButton () { return QuickFolders.Util.$("QuickFolders-readingList"); },
	get CategoryMenu() { return QuickFolders.Util.$("QuickFolders-Category-Selection"); },
	get PaintButton() { return QuickFolders.Util.$("QuickFolders-paintBucketActive"); },
	get TitleLabel() { return QuickFolders.Util.$("QuickFolders-title-label"); },
	get TitleLabelBox() { return QuickFolders.Util.$("QuickFolders-LabelBox"); },
	get FoldersBox() { return QuickFolders.Util.$("QuickFolders-FoldersBox"); },
	get Toolbar() { return QuickFolders.Util.$("QuickFolders-Toolbar"); },
	get PalettePopup() { return QuickFolders.Util.$("QuickFolders-PalettePopup");},
	get FindFolderBox() { return QuickFolders.Util.$("QuickFolders-FindFolder");},
  get FindFolderHelp() { return QuickFolders.Util.$("QuickFolders-FindFolder-Help");},
	
	// CURRENT FOLDER ELEMENTS
	get CurrentFolderTab() { // visible current folder tab - might have to move it in Tb for conversation view
		try {
			if (!QuickFolders.Util?.document3pane) {
				QuickFolders.Util.logHighlight("no CurrentFolderTab in this context.");
				return null;
			}
			return QuickFolders.Util.document3pane.getElementById ("QuickFoldersCurrentFolder");
		}
		catch (ex) {
			return null;
		}
  },
	get CurrentFolderBar() { 
		if (!QuickFolders.Util.document3pane) {
			QuickFolders.Util.logHighlight("no CurrentFolderBar in this context.");
			return null;
		}
		return QuickFolders.Util.document3pane.getElementById ("QuickFolders-CurrentFolderTools");
	},
	get CurrentFolderFilterToggleButton() { 
		if (!QuickFolders.Util.document3pane) {
			QuickFolders.Util.logHighlight("no CurrentFolderFilterToggleButton in this context.");
			return null;
		}
		return QuickFolders.Util.document3pane.getElementById("QuickFolders-currentFolderFilterActive"); 
	},
	get ToggleToolbarButton() {
		return window.document.querySelector("[item-id='ext-quickfolders@curious.be']");
	},

  getPreviewButtonId: function getPreviewButtonId(previewId) {
		switch(previewId) {
			case "standard":
        return "inactivetabs-label";
			case "active":
        return "activetabs-label";
			case "hovered":
        return "hoveredtabs-label";
			case "dragOver":
        return "dragovertabs-label";
			default:
				QuickFolders.Util.logDebug("QuickFolders.Interface.getPreviewButtonId - Invalid previewId: " + previewId);
        return null;
		}
  } ,

	setEventAttribute: function setEventAttribute(element, eventName, eventAction) {
	  // workaround to lower number of warnings in addon validation
		element.setAttribute(eventName, eventAction);
	} ,

	get PaletteStyleSheet() {
		const util = QuickFolders.Util;
	  let isOptionsScreen = (document.location.href.toString() == "chrome://quickfolders/content/options.xhtml");

		if (isOptionsScreen) {
			if (this._paletteStyleSheetOfOptions)
				return this._paletteStyleSheetOfOptions;
		}
		else {
			if (this._paletteStyleSheet)
				return this._paletteStyleSheet;
		}
		let ss = "content/skin/quickfolders-palettes.css";

		this._paletteStyleSheet = "chrome://quickfolders/" + ss;
		if (!this._paletteStyleSheetOfOptions)  {
      this._paletteStyleSheetOfOptions = this._paletteStyleSheet; // "chrome://quickfolders/content/skin/quickfolders-options.css";  // this._paletteStyleSheet;
    }
		util.logDebugOptional("css,css.Detail","My Palette Stylesheet = " + ss);

		// now let's return the correct thing.
		if (isOptionsScreen) {
			if (this._paletteStyleSheetOfOptions)
				return this._paletteStyleSheetOfOptions;
		}
		return this._paletteStyleSheet;

	} ,

	getUIstring: function getUIstring(id, substitions) {
    return QuickFolders.Util.getBundleString(id, substitions);
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
            util.logDebugOptional ("mailTabs","Categories of selected Tab = " + entry.category.replace("|",", "));
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
	setFolderSelectTimer: function () {
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
				let nDelay = QuickFolders.Preferences.getIntPref("queuedFolderUpdateDelay");
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
            let slash = folderUri.lastIndexOf("/");
					  folderUri = folderUri.substring(0, slash)
          }
          if (!isUpdateVisible) return;

          util.logDebug("setFolderUpdateTimer(item):" + item.prettyName);
        }
				if (!nDelay>0) nDelay = 500;
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

	createRecentPopup: function createRecentPopup(passedPopup, isDrag, isCreate, popupId) {
		let menupopup,
		    prefs = QuickFolders.Preferences,
        util = QuickFolders.Util;
    let isProfiling = QuickFolders.Preferences.isDebugOption("performance");
    if (isProfiling ) {
      util.stopWatch("start","createRecentPopup");
    }
        
		util.logDebugOptional("recentFolders","createRecentPopup(passedPopup:" + passedPopup + ", isDrag:"+ isDrag +", isCreate:" + isCreate + ")");

		let doc = (popupId == "QuickFolders-folder-popup-Recent-CurrentFolderTool") ? util.document3pane : document;
    
    // purge old menus
    for (let p of doc.querySelectorAll("#" + popupId)) {
      if (p!=passedPopup)
        p.parentNode.removeChild(p);
    }


 		if (passedPopup) {
 			// clear old folders...
 			while (passedPopup.firstChild) {
 				passedPopup.removeChild(passedPopup.firstChild);
			}
			menupopup = passedPopup;
 		}
 		else {
			menupopup = this.createIconicElement("menupopup","*", doc);
 			menupopup.setAttribute("id",popupId);
 		}

		menupopup.setAttribute("position","after_start"); //
		menupopup.className = "QuickFolders-folder-popup";
		if (isCreate) {
			// if popup is null, we are creating the button - no need to populate the menu as it is being done again on the click / drag event!
			return menupopup;
		}

		util.logDebugOptional("recentFolders","Creating Popup Set for Recent Folders tab");

		let recentFolders,  // an array of foldertreeview items (or dummies with a _folder property)
		    FoldersArray = []; 

    if (popupId == "QuickFolders-FindFolder-popup-Recent") {
      let maxLen = QuickFolders.quickMove.history.length;
      if (!util.hasValidLicense()) {
        if (maxLen>QuickFolders.quickMove.MAX_HISTORY_FREE) {
          maxLen = QuickFolders.quickMove.MAX_HISTORY_FREE;
        }
      } else if (util.hasStandardLicense()) {
        if (maxLen>QuickFolders.quickMove.MAX_HISTORY_STD) {
          maxLen = QuickFolders.quickMove.MAX_HISTORY_STD;
        }
      }
      recentFolders = [];
      for (let i=0; i<QuickFolders.quickMove.history.length; i++) {
        let item = QuickFolders.quickMove.history[i];
        let f = QuickFolders.Model.getMsgFolderFromUri(item);
        if (f) {
          recentFolders.push(f); // [issue 382] - used to wrap items as object._folder
          if (recentFolders.length>=maxLen) break;
        }
      }
    }
    else {
      recentFolders = util.generateMRUlist();
    }

		FoldersArray = recentFolders;

		let isAlphaSorted =  prefs.getBoolPref("recentfolders.sortAlphabetical");
    if (isProfiling) {
      let time = util.stopWatch("stop","createRecentPopup");
      console.log(`createRecentPopup - Before calling %caddSubFoldersPopupFromList() ${time} ms`, "background-color: rgb(0,160,40); color:white;");
    }
		this.addSubFoldersPopupFromList(FoldersArray, menupopup, isDrag, isAlphaSorted, true, doc);
		util.logDebugOptional("recentFolders","=============================\n"
			+ "createRecentPopup Finished!");
      
    if (isProfiling) {
      let time = util.stopWatch("all","createRecentPopup");
      console.log(`%cRunning createRecentPopup(${popupId}) took: ${time}`, "background-color: rgb(0,160,40); color:white;");
    }
      
		return menupopup;
	} ,

	createRecentTab: function createRecentTab(passedPopup, isDrag, passedButton) {
		try {
			QuickFolders.Util.logDebugOptional("recentFolders","createRecentTab( "
				+ " passedPopup: " + (passedPopup == null ? "null" : passedPopup.id)
				+ ", isDrag: " + isDrag
				+ ", passedButton: " + (passedButton == null ? "null" : passedButton.id)
				+ ")");
			let isFolderUpdate = false, //	need this to know if we are creating a fresh button (true) or just rebuild the folders menu on click/drag (false)
			    isCurrentFolderButton = (passedButton == null ? false : (passedButton.id=="QuickFolders-Recent-CurrentFolderTool")),
					doc = isCurrentFolderButton ? QuickFolders.Util.document3pane : document,
			    button = passedButton || doc.createXULElement("toolbarbutton");

			if (!passedButton) {
				isFolderUpdate = true;
				let recentLabel = QuickFolders.Preferences.getBoolPref("recentfolders.showLabel") ? this.getUIstring("qfRecentFolders") : "";
				button.setAttribute("label", recentLabel);
				button.setAttribute("tag", "#Recent");
				button.id="QuickFolders-Recent";

				// biffState = nsMsgBiffState_Unknown = 2
				this.styleFolderButton(button, 0, 0, 0
					, "recent" + ((isCurrentFolderButton || QuickFolders.Preferences.isShowRecentTabIcon) ?  " icon" : "")
					, 0, false, null, null);
				this.buttonsByOffset[0] = button; // currently, hard code to be the first! ([0] was [offset])
				let tabColor = QuickFolders.Preferences.recentTabColor;
				if (tabColor) {
					this.setButtonColor(button, tabColor);
			  }
			}
      
      let popupId = isCurrentFolderButton ? QuickFolders.Interface.RecentPopupIdCurrentFolderTool : QuickFolders.Interface.RecentPopupId,
			    menupopup = this.createRecentPopup(passedPopup, isDrag, isFolderUpdate, popupId);
			this.initElementPaletteClass(button, passedButton);
			if (!isCurrentFolderButton)
				this.menuPopupsByOffset[0] = menupopup;

      // [issue 76] - removing firstChild was incorrect in Tb78.
      let menuchildren = button.querySelectorAll("#" + menupopup.id);
      menuchildren.forEach(el => button.removeChild(el))

			button.appendChild(menupopup);

			if (!isDrag) {
				// remove last popup menu (if button is reused and not created from fresh!)
				// this needed in minimal rebuild as we reuse the buttons!
				//if (passedPopup)
				//	button.replaceChild(menupopup, passedPopup);

				if (!isCurrentFolderButton)  // the currentfolder recent button has already the correct attributes set by the overlay
				{
					if (button.getAttribute("context") != this.RecentPopupId) { // prevent event duplication
						button.setAttribute("context", this.RecentPopupId);
						button.setAttribute("position","after_start");
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
		if (evt) evt.stopPropagation();

		if (this.PaintModeActive) {
			let paintButton = this.PaintButton,
			    color = paintButton.getAttribute("colorIndex");
			if (!color) color = 0;
			this.setButtonColor(button, color);
			this.initElementPaletteClass(button);
			QuickFolders.Preferences.setIntPref( "recentfolders.color",  color)
			return;
		}
		// Thunderbird 52 fix for [Bug 26592] - recent folder clicks not working
		if (button && (button.tagName == "menuitem" || button.tagName == "menupopup")) {
			if (prefs.isDebugOption("popupmenus")) debugger;

			let menuitem = button;
			if (menuitem.folder) {
				if (evt) evt.preventDefault();
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
        currentFolderTab = QuickFolders.Interface.CurrentFolderTab , 
        existsMsgDisplay = (typeof gMessageDisplay != "undefined") ,
				current,
				tabMode = QuickFolders.Interface.CurrentTabMode;
		if (tabMode == "mailMessageTab") {
			current = QuickFolders.Interface.getCurrentTabMailFolder();
		} else {
			current = !existsMsgDisplay ? null : gMessageDisplay.displayedMessage.folder;
		}

		util.logDebugOptional("interface.currentFolderBar", "ensureCurrentFolder()");
    if (!existsMsgDisplay) {
      let txt = "No gMessageDisplay in current view";
      util.logToConsole(txt);
      return;
    }
    if (currentFolderTab.folder != current) {
      this.initCurrentFolderTab(currentFolderTab, current);
		}
  },

	onClickThreadTools: function onClickThreadTools(button, evt) {
    // [issue 320] use CTRL modifier to 
    // mark folder as read and jump to next unread folder
    if (evt.ctrlKey) {
      if (QuickFolders.Util.licenseInfo.status == "Valid" && QuickFolders.Util.licenseInfo.keyType!=2) {
        QuickFolders.Util.CurrentFolder.markAllMessagesRead(msgWindow);
      }
      else {
        let featureText = QuickFolders.Util.getBundleString("qfMarkAllRead.next")
        QuickFolders.Util.popupRestrictedFeature("markFolderReadAndSkip", `(${featureText})`);
      }
    }
    else {
      goDoCommand("cmd_markThreadAsRead");
    }
		evt.stopPropagation();
		goDoCommand("cmd_nextUnreadMsg");
    this.ensureCurrentFolder();
	} ,

	onGoPreviousMsg: function onGoPreviousMsg(button, isSingleMessage) {
		if (button.nextSibling.checked) {
			goDoCommand("cmd_previousMsg");
		} else {
			goDoCommand("cmd_previousUnreadMsg");
		}
		if (isSingleMessage) {
      this.ensureCurrentFolder();
    }
	} ,

	onGoNextMsg: function (button) {
		const tabMode = QuickFolders.Interface.CurrentTabMode;
		const isSingleMessage = 
		  (tabMode == "mailMessageTab");

		if (tabMode=="") {   // single message window
			// [issue 377]  Go to next unread message - should jump to next unread folder if no unread mails are left
			let singleMessageFolder = QuickFolders.Util.CurrentFolder;
			if (singleMessageFolder) {
				let unread = singleMessageFolder.getNumUnread(false); // don't count subfolders
				if (unread == 0) {
					this.onSkipFolder(button, true);
					return;
				}
			}
		}
		if (button.previousSibling.checked) {
			goDoCommand("cmd_nextMsg");
		}	else {
			goDoCommand("cmd_nextUnreadMsg");
		}
    // mailTabs.js =>  DefaultController.doCommand(aCommand, aTab);
    // GoNextMessage(nsMsgNavigationType.nextMessage, false);
    // this will eventually call folderDisplay.navigate()
		if (isSingleMessage) {
      this.ensureCurrentFolder();
    }
	} ,

	onToggleNavigation: function onToggleNavigation(button) {
		button.checked = !button.checked;
	} ,

	// exit unread folder skip to next...
	onSkipFolder: function (button, isSingleMessage = false) {
		const util = QuickFolders.Util,
				  prefs = QuickFolders.Preferences,
					Ci = Components.interfaces;
		let currentFolder = QuickFolders.Util.CurrentFolder,
				folder;

		if (!isSingleMessage && !util.hasValidLicense()) {
      let txt = util.getBundleString("qf.notification.premium.shortcut");
			util.popupRestrictedFeature("skipUnreadFolder", txt, 2);
    }

		if (prefs.isDebugOption("navigation")) debugger;
		folder = util.getNextUnreadFolder(currentFolder);

		if (folder) {
			util.logDebug("selecting next unread folder:" + folder.prettyName + "\n" + folder.URI);
			// 
			if (isSingleMessage) {
				// find first unread message in folder, then intialize the window
				let unreadMsg;
				for (let msg of [...folder.messages ]) { // are these sorted by date?
					if(!msg.isRead) {
						unreadMsg = msg;
						break;
					}
				}
				if (unreadMsg) {
					console.log(`found unread message in next unread folder ${folder}`, msg);
					// GoNextMessage(Ci.nsMsgNavigationType.firstMessage, false);
					if (typeof gFolderDisplay != "undefined") {
          	gFolderDisplay.navigate(Ci.nsMsgNavigationType.firstNew);
					}
				}
			}
			else {
				QuickFolders_MySelectFolder(folder.URI);
			}
			// we need to jump to the top (first mail) for the
			// if (GoNextMessage) { GoNextMessage(Ci.nsMsgNavigationType.firstMessage, false); }
			if (typeof gFolderDisplay != "undefined") {
				gFolderDisplay.navigate(Ci.nsMsgNavigationType.firstNew);
			}

			if (currentFolder == folder) { // wrap around case
			  let txt = util.getBundleString("qfNavigationWrapped")
				util.slideAlert("QuickFolders",  txt.replace("{1}", folder.prettyName));
			}
			// find next sibling, of parent, then trigger onGoNextMsg
			// navigation types of nsMsgNavigationType are defined in nsIMsgDBView.idl
			// GoNextMessage is defined  in msgViewNavigation.js
			// GoNextMessage(1, true); // nsMsgNavigationType.firstMessage
			// GoNextMessage(7, true); // nsMsgNavigationType.nextUnreadMessage
			goDoCommand("cmd_nextUnreadMsg");
		}
	} ,

	updateQuickFoldersLabel: function() {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util;
		function wasLicenseViewedInSession() {
			if (typeof util.licenseInfo.isLicenseViewed == "undefined") {
				return false;
			}
			return util.licenseInfo.isLicenseViewed;
		}					
		// force label when there are no folders or license is in expired state!

		try {
      util.logDebug("updateQuickFoldersLabel()");
			let isRenew = (QuickFolders.Util.licenseInfo.isValid && QuickFolders.Util.licenseInfo.licensedDaysLeft<=10),
			    showLabelBox = isRenew || prefs.isShowQuickFoldersLabel || QuickFolders.Util.licenseInfo.isExpired  || (0==QuickFolders.Model.selectedFolders.length),
					quickFoldersLabel = this.TitleLabel,
					qfLabelBox = this.TitleLabelBox,
					isLicenseNotChecked = !wasLicenseViewedInSession();

			quickFoldersLabel.label = prefs.TextQuickfoldersLabel;
			quickFoldersLabel.collapsed = !showLabelBox; // force Renew QuickFolders to be visible!
      if (QuickFolders.Util.licenseInfo.isExpired) {
				quickFoldersLabel.classList.add("expired");
      } 
      
			let checkMenu = document.getElementById("QuickFolders-ToolbarPopup-checkLicense");
			if (checkMenu) {
				checkMenu.collapsed = !isRenew;
			}
			if (isRenew && isLicenseNotChecked) {
				quickFoldersLabel.classList.remove("expired");
				quickFoldersLabel.classList.add("renew");
				quickFoldersLabel.classList.remove("newsflash");
				let txtRenew = util.getBundleString("qf.premium.renew", QuickFolders.Util.licenseInfo.licensedDaysLeft);
				quickFoldersLabel.label = txtRenew;
			}
      else if (prefs.getBoolPref("hasNews")) {
				quickFoldersLabel.classList.add("newsflash");
				quickFoldersLabel.setAttribute("tooltiptext", util.getBundleString("update.tooltip",["QuickFolders"]));
      }
			else if (QuickFolders.Util.licenseInfo.isExpired && isLicenseNotChecked) {
				quickFoldersLabel.classList.remove("renew");
				quickFoldersLabel.classList.remove("newsflash");
				let txtExpired =
				  util.getBundleString("qf.premium.renewLicense.tooltip").replace("{1}", QuickFolders.Util.licenseInfo.expiredDays);
				quickFoldersLabel.setAttribute("tooltiptext", txtExpired);
			}
			else {
				quickFoldersLabel.removeAttribute("tooltiptext");
				quickFoldersLabel.classList.remove("renew");
				quickFoldersLabel.classList.remove("expired");
				quickFoldersLabel.classList.remove("newsflash");
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
    const profileThis = (prefs.isDebugOption("updateFolders,performance")),
          profileStyle = "background-color: rgb(194, 82, 131); color:white;"; // Bashful pink
    if (profileThis) {
      util.stopWatch("start","updateFolders");
      
      console.log(`%cStarting updateFolders - Active Categories: ${QuickFolders.Interface.currentActiveCategories}`, profileStyle);
    }
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

		let sDebug = "updateFolders(rebuildCategories: " + rebuildCategories + ", minimal: " + minimalUpdate +")",
		    toolbar = this.Toolbar,
		    theme = prefs.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName; //  + " chromeclass-toolbar" [Bug 26612]
    toolbar.classList.add("contentTabToolbar"); // Linux
		toolbar.classList.add("quickFoldersToolbar"); // simplify styling, [issue 394]

		this.FoldersBox.className = "folderBarContainer " + theme.cssToolbarClassName; // [Bug 26575]

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += " - Number of Folders = " + QuickFolders.Model.selectedFolders.length;

		util.logDebug(sDebug);

		if (!minimalUpdate) {
			this.buttonsByOffset = [];
			this.menuPopupsByOffset = [];

			util.clearChildren(this.FoldersBox, rebuildCategories);

			this.updateQuickFoldersLabel();

			if (rebuildCategories || null==this.CategoryMenu) {
				this.updateCategories();
      }
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
					invalidCount=0,
          countValidTabs = 0,
          hasLicense = (util.licenseInfo.status == "Valid");
          
			for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if (!this.shouldDisplayFolder(folderEntry))
					continue;

				folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);
				countFolders++;
				if (!folder) {
					invalidCount++;
				}
				if (!minimalUpdate) {
					// restore invalid folders, too
					button = this.addFolderButton(folder, folderEntry, offset, null, null, tabStyle, isFirst);
					if (button) {
						if (!folder || typeof folder.server == "undefined")  {
							button.setAttribute("folderURI", folderEntry.uri);
							folderEntry.invalid = true; // add invalid to entry!
						}
            else
              countValidTabs++;
              
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
              countValidTabs++;
						}
					}
				}
        
        if (!hasLicense) {
          if (countValidTabs>QuickFolders.Model.MAX_UNPAID_TABS) { // no license restriction
            button.setAttribute("disabled",true);
          }          
        } 
        else if (util.licenseInfo.keyType == 2) { // Standard License restriction
          if (countValidTabs>QuickFolders.Model.MAX_STANDARD_TABS) {
            button.setAttribute("disabled",true);
          }          
        }
			}


			let sDoneWhat = minimalUpdate ? "refreshed on toolbar [minimalUpdate]." : "rebuilt [minimalUpdate=false].";
			util.logDebug(countFolders + " of " + QuickFolders.Model.selectedFolders.length + " tabs " + sDoneWhat);
			if (invalidCount) {
				util.logDebug("{0} invalid tabs where found!\n Please check with 'Remove Invalid tabs' from the QuickFolders tools menu.".replace("{0}", invalidCount));
      }
		}
    else { // no tabs defined : add instructions label
      let existingLabel = this.FoldersBox.querySelector("#QuickFolders-Instructions-Label");
      if (!existingLabel) {
        let label = document.createXULElement('label'),
            txt = util.getBundleString("qf.label.dragFolderLabel");
        label.id = "QuickFolders-Instructions-Label";
        label.classList.add("QuickFolders-Empty-Toolbar-Label");
        label.setAttribute("crop","end");
        label.textContent = txt;
        this.FoldersBox.appendChild(label);
      }
    }

		// [Bug 25598] highlight active tab
    if (!minimalUpdate)
      this.lastTabSelected = null;  // reset to force highlight active tab
		this.onTabSelected();

    if (profileThis) {
      let time = util.stopWatch("all","updateFolders");
      console.log(`%cQuickFolders.Interface.updateFolders(rebuildCat = ${rebuildCategories}, minimal = ${minimalUpdate})\n ${countFolders} folders took: ${time}`, profileStyle);
    }

	} ,

  // update visible tabs after folders were changed / tabs renamed or deleted.
  // we also need to force refreshing / reading the Model from the store first!
  updateAllTabs: function () {
    QuickFolders.initTabsFromEntries(QuickFolders.Preferences.loadFolderEntries());
    QuickFolders.Interface.updateFolders(true, false);
  },
  
  // more comprehensive function to update both folder look and all styles (will be called from Options dialog via event listener)
  updateFoldersUI: function () {
    QuickFolders.Util.logDebug("updateFoldersUI()...");
    QuickFolders.Interface.updateFolders(true, false);
		QuickFolders.Interface.updateUserStyles();
  },

	updateSharedToolbarStyles(ss) {
		const prefs = QuickFolders.Preferences,
					styleEngine = QuickFolders.Styles;
      // =============
      // MENU FONT SIZE 
      // [issue 329] inconsistent menu font size
			// [issue 394] make configurable
			let menuFontSize = prefs.MenuFontSize;
			menuFontSize = menuFontSize ? (menuFontSize+"px") : "12px"; // default size 12px with value 0
      styleEngine.setElementStyle(ss, ".quickFoldersToolbar menuitem label", "font-size", menuFontSize, true);
      styleEngine.setElementStyle(ss, ".quickFoldersToolbar menu label", "font-size", menuFontSize, true);      
	} ,

	// @doc3pane optional 3pane document. if not passed we need to iterate _all_ 3pane documents
	// @tabInfo  optional (current tab, or the new tab if called from selectTab)
	// this function initializes all buttons on the Navigation toolbar (Current folder bar)
	updateNavigationBar: function(doc3pane, tabInfo) {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					styleEngine = QuickFolders.Styles;
		let isSingleMessageWindow = false;
          
		function collapseConfigItem(id, isShownSetting, checkParent) {
			let element = doc3pane.getElementById(id);
			// safeguard for copied ids (such as button-previous / button-next)
			if (checkParent && element.parentNode.id.indexOf("QuickFolders") < 0)
				return;
			if (element)
				element.setAttribute("collapsed", !prefs.getBoolPref(isShownSetting));
			return element;
		}

		util.logDebugOptional("interface.currentFolderBar", "updateNavigationBar() - " + window.location, doc3pane);
		try {
			let tabMode = tabInfo ? QuickFolders.Util.getTabMode(tabInfo) : QuickFolders.Interface.CurrentTabMode;
			if (!doc3pane || doc3pane.target) { // if called from background, this will be an event
				if (!["mail:3pane","mail3PaneTab", "mailMessageTab" ].includes(tabMode)) {
					// no curent folder tab here!
					util.logDebugOptional("interface.currentFolderBar",`Early Exit: no current folder bar in tab mode ${tabMode} !`);
					return false;
				}
				doc3pane = QuickFolders.Util.document3pane;  // wrong, but hack for now to use 1st folder tab
				util.logDebugOptional("interface.currentFolderBar", "Fallback to global document3pane!", doc3pane);
			}
			if (!tabMode) { isSingleMessageWindow = true ;}
			

			collapseConfigItem("QuickFolders-Close", "currentFolderBar.showClose");
			collapseConfigItem("QuickFolders-currentFolderFilterActive", "currentFolderBar.showFilterButton");
			collapseConfigItem("QuickFolders-Recent-CurrentFolderTool", "currentFolderBar.showRecentButton");
			collapseConfigItem("QuickFolders-currentFolderMailFolderCommands", "currentFolderBar.showFolderMenuButton");
			collapseConfigItem("QuickFolders-currentFolderIconCommands", "currentFolderBar.showIconButtons");
			let repairBtn = collapseConfigItem("QuickFolders-RepairFolderBtn", "currentFolderBar.showRepairFolderButton");
			if (repairBtn && repairBtn.getAttribute("collapsed")=="false") {
			  repairBtn.setAttribute("tooltiptext", this.getUIstring("qfFolderRepair"));
			}


			// In Thunderbird 115 the style sheet is in a separate document.
			let toolbar2 = doc3pane.getElementById ("QuickFolders-CurrentFolderTools");
			if (toolbar2) {
				// selected or current message / (FUTURE) thread dragging; let's piggyback "isThread"...
				// FUTURE: use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
				//         this.setEventAttribute(button, "ondragstart","event.isThread=true; QuickFolders.messageDragObserver.startDrag(event,true)");
				let button = toolbar2.querySelector("#QuickFolders-CurrentMail");
				if (button) {
					this.setEventAttribute(button, "ondragstart","QuickFolders.messageDragObserver.startDrag(event,true)");
				}			
				
				let theme = prefs.CurrentTheme,
						ss = this.getStyleSheet(doc3pane, "quickfolders-layout.css", "QuickFolderStyles"),
						background = prefs.getStringPref("currentFolderBar.background"),
            presetChoice = prefs.getStringPref("currentFolderBar.background.selection"); // needed for fill!
        toolbar2.setAttribute("theme",presetChoice);
				if (ss) try {
					styleEngine.setElementStyle(ss, "toolbar#QuickFolders-CurrentFolderTools", "background-image", background, true);

					let mw = util.$("messengerWindow");
					if (mw) {
						let backImage = window.getComputedStyle(mw).getPropertyValue("background-image");
						if (prefs.getBoolPref("currentFolderBar.background.lightweight")) {
							if (backImage && backImage!="none") {
								styleEngine.setElementStyle(ss,".QuickFolders-NavigationPanel", "background-image", backImage);  
							} else {
								styleEngine.setElementStyle(ss,".QuickFolders-NavigationPanel", "background-image", "var(--lwt-header-image)", true);
							}
							styleEngine.setElementStyle(ss,".QuickFolders-NavigationPanel", "background-position", "right 0px top -75%"); 
							styleEngine.setElementStyle(ss, "toolbar#QuickFolders-CurrentFolderTools","opacity", "0.98");
						}
						else {
							styleEngine.setElementStyle(ss,".QuickFolders-NavigationPanel", "background-image", "none"); // was #QuickFolders-PreviewToolbarPanel
							styleEngine.setElementStyle(ss, "toolbar#QuickFolders-CurrentFolderTools","opacity", "1.0");
						}
					}
					let ftCol = 
						prefs.getBoolPref("currentFolderBar.iconcolor.custom") ?
						prefs.getStringPref("currentFolderBar.iconcolor") :
						"currentColor";
					styleEngine.setElementStyle(ss,"#QuickFolders-CurrentFolderTools[theme=custom] > toolbarbutton.icon", "fill", ftCol);
					// don't overwrite the navigation button as it leads to illegible text!
					// styleEngine.setElementStyle(ss, "#QuickFolders-CurrentFolderTools[theme=custom] toolbarbutton.col0 .toolbarbutton-text", "color", ftCol);
				} catch (ex) {
					util.logDebugOptional("interface.currentFolderBar", "no style sheet.");
				}
        
				// find (and move) button if necessary
				let cF = toolbar2.querySelector("[id=QuickFoldersCurrentFolder]"),
				    leftSpace = doc3pane.getElementById("QF-CurrentLeftSpacer"),
				    rightSpace = doc3pane.getElementById("QF-CurrentRightSpacer");
				leftSpace.setAttribute("flex",prefs.getIntPref("currentFolderBar.flexLeft"));
				rightSpace.setAttribute("flex",prefs.getIntPref("currentFolderBar.flexRight"));

				// add styling to current folder via a fake container
				if (cF && cF.parentNode) {
					cF.parentNode.className = theme.cssToolbarClassName;
        }

				// set current Folder 
				// support larger fonts - should have a knock-on effect for min-height
				let fontSize = prefs.ButtonFontSize || 12; // default size
				toolbar2.style.fontSize = `${fontSize}px`;
				cF.style.fontSize = `${fontSize}px`;

				if (ss) {
					QuickFolders.Interface.updateSharedToolbarStyles(ss);
				}
				
				const isNoFolderMode = (tabMode !="mail3PaneTab");

				let hideMsgNavigation = !prefs.getBoolPref("currentFolderBar.navigation.showButtons"),
						hideFolderNavigation = isNoFolderMode ||  !prefs.getBoolPref("currentFolderBar.folderNavigation.showButtons");
						// retired currentFolderBar.navigation.showToggle
				util.logDebugOptional("interface",
          "Current Folder Bar - Collapsing optional Navigation Elements:\n" +
				  "hideMsgNavigation=" + hideMsgNavigation + "\n" +
				  "hideFolderNavigation=" + hideFolderNavigation + "\n"
				);

				for (let n=0; n< toolbar2.children.length; n++)
				{
					let node = toolbar2.children[n],
							special = node.getAttribute("special");
					if (special && special=="qfMsgFolderNavigation") {
						node.collapsed = hideMsgNavigation;
					}
					else if (node.id && node.id.startsWith("QuickFolders-Navigate")) {
						// hide QuickFolders-NavigateUp, QuickFolders-NavigateLeft, QuickFolders-NavigateRight
						node.collapsed = hideFolderNavigation;
					}
				}
        
        toolbar2.setAttribute("iconsize", prefs.getBoolPref("toolbar.largeIcons") ? "large" : "small"); // [issue 191]
			}

		}
    catch (ex) {
      util.logException("updateNavigationBar()", ex);
			return false;
    }
		return true;

	} ,

	liftNavigationbar: function (contentDoc) {
    // access all browsers in 3pane: window.messageBrowser.contentWindow.gMessage
		// contentDocument.defaultView = contentWindow
		// message contentWindow.gMessage
    // this function should also be called when the commands are issued:
		// cmd_viewClassicMailLayout  => sets mail.pane_config.dynamic = 0
		// cmd_viewWideMailLayout     => sets mail.pane_config.dynamic = 1
		// cmd_viewVerticalMailLayout => sets mail.pane_config.dynamic = 2
		// Services.prefs.addObserver("mail.pane_config.dynamic", this);

		const navigationContainer = contentDoc.getElementById("QuickFolders-PreviewToolbarPanel");
		const tabOrWindow = contentDoc.defaultView.tabOrWindow;
		QuickFolders.Util.logDebug("liftNavigationbar()");
		let containerSelector;
		let threadPane;
		let viewMode;


		switch(contentDoc.URL) {
			case "about:3pane":
				containerSelector = "#threadPane";
				threadPane = contentDoc.querySelector(containerSelector);
				viewMode="classic";
				let clist = threadPane.parentElement.classList;
				if (clist.contains("layout-vertical")) {
					viewMode="vertical";
				} else if (clist.contains("layout-wide")) {
					viewMode="wide";
				}
				// interestingly layout is global, and not per tab.
				// we need to create an event when this is switched.
				switch (viewMode) {
					case "classic": // fall-through
					case "wide":
						threadPane.append(navigationContainer);
						break;
					case "vertical":
						// not quite what we want, but prepending into div#messagePane
						// BREAKS its functionality!
						threadPane.prepend(navigationContainer);
						break;
				}
				break;
			case "about:message":
				containerSelector = "#messagepanebox";
				threadPane = contentDoc.querySelector(containerSelector);
				threadPane.prepend(navigationContainer);
				viewMode="message";
				break;
		}

		
		// let messagePane = document3pane.querySelector("#messagePane");
		
		// in "Vertical View" layout, we should inject the toolbar as first element of the threadPane instead:
		this.updateNavigationBar(contentDoc, tabOrWindow ? tabOrWindow.tabNode : null);
		let isSingleMsgWindow = false;
		try {
		  isSingleMsgWindow = (window.location.href.endsWith("messageWindow.xhtml"));
		} catch(ex) {;}
		let currentFolderTab = contentDoc.getElementById ("QuickFoldersCurrentFolder"),
		    folder = contentDoc.defaultView.gFolder,
				tabNode = tabOrWindow.tabNode || null;
		if (currentFolderTab && folder) {
			this.initCurrentFolderTab(currentFolderTab, folder, null, tabNode);
		}
	},

	updateCategoryLayout: function updateCategoryLayout() {
    const prefs = QuickFolders.Preferences,
					FCat = QuickFolders.FolderCategory,
					model = QuickFolders.Model;
		let cat = this.CategoryMenu,
		    showToolIcon = prefs.isShowToolIcon && !QuickFolders.FilterWorker.FilterMode;
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
			cat.style.display = (showToolIcon || isCustomCat) ? "-moz-inline-box" : "none";
			cat.collapsed = (!isCustomCat);
      
      if (this.currentActiveCategories) {
        if (this.currentActiveCategories == FCat.UNCATEGORIZED) { // [issue 72] Category "_Uncategorized" will show all categories after moving a folder to another
          this.selectCategory(FCat.UNCATEGORIZED);
				} else {
          // [issue 101] If multiple categories are selected, closing QuickFolders settings reverts to "Show All"
          let cats = this.currentActiveCategories ? this.currentActiveCategories.split("|") : [],
              newCats = [];
          
          // remove invalid categories
          for (let selCat of cats) {
            if (catArray.includes(selCat)) {
              newCats.push(selCat);
            }
          }
          if (!newCats.length) {
            // make sure all tabs are visible in case we delete the last category!
            this.selectCategory(FCat.ALL,false);
          }
          else if (cats.length > newCats.length) {
            QuickFolders.Interface.selectCategory(newCats.join("|"),false);
          }
        }
      }

			if (prefs.getBoolPref("collapseCategories"))
				cat.classList.add("autocollapse");
			else
				cat.classList.remove ("autocollapse");

	  }
	} ,

	updateCategories: function updateCategories() {
    const util = QuickFolders.Util,
		      model = QuickFolders.Model,
					prefs = QuickFolders.Preferences,
          FCat = QuickFolders.FolderCategory;

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
				const doc = menuList.ownerDocument;
				let activeCatsList = this.currentActiveCategories,
				    cats = activeCatsList ? activeCatsList.split("|") : [],
            isMultiCategories = prefs.getBoolPref("premium.categories.multiSelect")
        util.clearChildren(menuPopup,true);

        menuPopup.appendChild(this.createMenuItem(FCat.ALL, this.getUIstring("qfAll"), doc, "menuitem-iconic"));
        for (let i = 0; i < lCatCount; i++) {
          let category = bookmarkCategories[i];
          if (category!=FCat.ALWAYS && category!=FCat.NEVER) {
            let menuItem = this.createMenuItem(category, category, doc, "menuitem-iconic");
            // add checkbox for multiple category selection
            if (isMultiCategories) {
							// multi selection
							if (cats.includes(category))
								menuItem.setAttribute("checked", true);
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
					menuPopup.appendChild(this.createIconicElement("menuseparator","*"));
				}
				if (isUncat) {
					let s = this.getUIstring("qfUncategorized"),
              itemUncat = this.createMenuItem(FCat.UNCATEGORIZED , s, doc, "menuitem-iconic");
					menuPopup.appendChild(itemUncat);
          if (cats.includes(FCat.UNCATEGORIZED) && isMultiCategories)
            itemUncat.setAttribute("checked", true);
				}
				if (isNever) {
					let s = this.getUIstring("qfShowNever");
					menuPopup.appendChild(this.createMenuItem(FCat.NEVER, s, doc, "menuitem-iconic"));
				}

        menuList.value = activeCatsList || FCat.ALL; // revise this for MULTI SELECTS
      }
      else {
        util.logDebug("No Categories defined, hiding Categories box.");
        this.currentActiveCategories = QuickFolders.FolderCategory.ALL; // remember "all"
        try {
        let tabmail = document.getElementById("tabmail"),
            idx = QuickFolders.tabContainer.tabbox.selectedIndex || 0;
          util.getTabInfoByIndex(tabmail, idx).QuickFoldersCategory = QuickFolders.FolderCategory.ALL;
          util.logDebug(`Set category for tab [${idx}] to ${this.currentActiveCategories}`);
        }
        catch (ex) {
          util.logException("updateCategories() Failed trying to default category to all", ex);
        }
      }
    }
    catch (ex) {
      util.logException("updateCategories()", ex);
    }
		QuickFolders.Interface.updateCategoryLayout(); // hide or show.
	} ,

	updateMainWindow: function(minimal) {
		function logCSS(txt) {
			util.logDebugOptional("css", txt);
		}
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;

    util.logDebug("updateMainWindow()...");
		if (prefs.isDebugOption("interface.update")) debugger;
		logCSS("============================\n" + "updateMainWindow…");
		let themeSelector = document.getElementById("QuickFolders-Theme-Selector");

		// update the theme type - based on theme selection in options window, if this is open, else use the id from preferences
		prefs.CurrentThemeId = themeSelector ? themeSelector.value : prefs.CurrentThemeId;
		let style =  prefs.ColoredTabStyle; // unused?
    
    // refresh main windows
    if (!minimal || "false" == minimal) {
      logCSS("updateMainWindow: update Folders UI…");
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // updates both folders - updateFolders(true, false) - and user styles
    }
    else {
      logCSS("updateMainWindow: update User Styles…");
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateUserStyles" }); // updates only user styles
    }
    
    if (QuickFolders.bookmarks) {
      QuickFolders.bookmarks.load();
      util.logDebug ("bookmarks.load complete.");
    }
		return true;
	} ,

	deleteFolderPrompt: function deleteFolderPrompt(folderEntry, withCancel, check, remaining) {
		let flags = Services.prompt.BUTTON_POS_0 * Services.prompt.BUTTON_TITLE_YES +
								Services.prompt.BUTTON_POS_1 * Services.prompt.BUTTON_TITLE_NO;
		if (withCancel)
			flags += Services.prompt.BUTTON_POS_2 * Services.prompt.BUTTON_TITLE_CANCEL;
		let noCheckbox = {value: false};
		// button = Services.prompt.confirmEx(null, "Title of this Dialog", "What do you want to do?",
													 // flags, "button 0", "Button 1", "button 2", "check message", let check = {value: false});
		let text = this.getUIstring("qfThisTabIsInvalid",[folderEntry.name]) + "\n"
									+ folderEntry.uri + "\n"
									+ this.getUIstring("qfTabDeletePrompt"),
				checkText = check ?
				              this.getUIstring("qfTabDeleteOption").replace("{0}", remaining) :
										  null;

		let answer = Services.prompt.confirmEx( null,
																		"QuickFolders",
																		text,
																		flags,
																		"", "", "",
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
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" }); // this.updateFolders(true, false);
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
		    sMsg = this.getUIstring("qfTidyDeadFolders");
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

		const tabmail = document.getElementById("tabmail"),
					activeModes = tabmail.currentAbout3Pane.folderPane.activeModes;

		// tally up everything
		for (let i = 0; i < model.selectedFolders.length; i++) {
			// test mail folder for existence
			let folderEntry = model.selectedFolders[i],
			    folder = null;
			backupTabs.push (folderEntry);

      if (util.isFolderUnified(folderEntry) && !activeModes.includes("smart")) {
        activeModes = "smart"; // this setter will not set but _add_ the missing mode!
                               // it should also rebuild the treeview accordingly
      }
      
			try {
				folder = model.getMsgFolderFromUri(folderEntry.uri, false);
			}
			catch(ex) {
				;
			}
			if (!folder || !util.doesMailFolderExist(folder)) {
				countOrphans++;
      }
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
				util.logException("GetMsgFolderFromUri failed with uri:" + folderEntry.uri, ex);
			}
			countTabs++;
      

			if (!folder || !util.doesMailFolderExist(folder)) {
				if (!isContinue) {
					lastAnswer = this.deleteFolderPrompt(folderEntry, true, check, countRemaining);
        }
				switch (lastAnswer) {
				  case 1:  // deleted
					  if (isContinue) // delete the remaining ones:
							model.removeFolder(folderEntry.uri, false);
						if (check.value) isContinue = true;
					  countDeleted++;
						// update UI
            // this.updateFolders(true, false);
            QuickFolders.Interface.updateFolders(true, false);
						// QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });  // wrong this loads it from prefs
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
			if (confirm(this.getUIstring("qfSavePrompt"))) {
				QuickFolders.Preferences.storeFolderEntries(model.selectedFolders);
        // show this on screen
				QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" }); // this.updateFolders(true, false);
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
			let sLabelFound = this.getUIstring("qfDeadTabsCount").replace("#", countOrphans),
					sResults = sLabelFound + "\n";
			if (countDeleted) {
        let sLabelDeleted = this.getUIstring("qfDeadTabsDeleted").replace("#", countDeleted);
				sResults += sLabelDeleted;
      }
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
			toOpenWindowByType(winType, "chrome://console2/content/console2.xhtml");  //TODO chrome://console2/content/console2.xhtml does not exist??
			let win = Services.wm.getMostRecentWindow(winType);
			// win.clearConsole();
		}
		catch(e) {util.logException("testTreeIcons - ", e);}

		setTimeout(function() {
			const separator = "==============================\n";
			let f = 0, affected = 0;
			util.logDebug(separator + "loading Dictionary…");
			util.logDebug(separator + "Iterating all folders…");
			for (let folder of util.allFoldersIterator(false)) {
				//let folder = allFolders[i];
        let folderIcon, iconURL;
        try {
				  folderIcon = folder.getStringProperty("folderIcon"),
					iconURL = folder.getStringProperty("iconURL");
          if (folderIcon || iconURL) {
            affected++;
            util.logDebug(folder.prettyName + "\nfolderIcon: " + folderIcon + "\niconURL: " + iconURL);
          }
          f++;
        }
        catch(e) { 
          util.logDebug(folder.prettyName + "\n - getStringProperty() threw error.");
        }
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
          Ci = Components.interfaces,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile,
          model = QuickFolders.Model,
          ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

  	if (QuickFolders.FolderTree) { // can only work in a 3pane window!!
			let doc3pane = QuickFolders.Util.document3pane;
			if (doc3pane) {
				QuickFolders.FolderTree.loadDictionary(doc3pane);
			}
    }

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
						localFile = // Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
						  Services.io.newURI(fileSpec).QueryInterface(Ci.nsIFileURL).file;
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
          model.setTabIcon (null, folderEntry, "");
          continue;
        }
        if (fileSpec && folder) {
					localFile = null; // in case this locks the file?
          let uri = ios.newURI(fileSpec, null, null);
          QuickFolders.FolderTree.setFolderTreeIcon(folder, uri, true); // silent
          ctRepaired++;
        }
        if (earlyExit) return;
			}
      catch(ex) {
        util.logException("repairTreeIcons", ex);
      }
    }
    if (missingIcons.length) {
      let list = "";
      for (let i=0; i<missingIcons.length; i++) {
        list += "\n" + missingIcons[i].name + "  =  " + missingIcons[i].path;
      }
      let txt = util.getBundleString("qfRepairTreeIconsMissing");
			if (!silent)
				util.alert(txt + "\n" + list);
			else
				util.logToConsole("QuickFolders\n" + txt + "\n" + list);
    }
    let repairedTxt = util.getBundleString("qfTreeIconsRepairedCount"),
        invalidTxt = util.getBundleString("qfTreeIconsInvalidCount"),
        msg = repairedTxt.replace("{0}", ctRepaired) + "\n"
            + invalidTxt.replace("{0}", ctMissing);
		if (!silent) {
			util.slideAlert("QuickFolders", msg);
		}
			
    // store icons in entry
    if (ctMissing)
      model.store();
  } ,

	createMenuItem: function(value, label, doc, className) {
		let menuItem = this.createIconicElement("menuitem", className || "*", doc);
		menuItem.setAttribute("label", label);
		menuItem.setAttribute("value", value);
    if (typeof className == "string") {
      menuItem.className = className;
		}

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
        cats = v.split("|"),
				txtDebug = "";
		try {
			if (menulist) {
				menulist.value = v;
				// if multiple select, check all boxes
				for (let i=0; i<menulist.itemCount; i++) {
					let it = menulist.getItemAtIndex(i);
          if (it.tagName!="menuitem") continue;
					let isSelected = (cats.includes(it.value));
					if (isSelected) {
						txtDebug += "Check menuitem: " + it.value + "\n";
						it.setAttribute("checked", isSelected); // check selected value
					}
					else {
						it.removeAttribute("checked");
					}
				}
			}
			util.logDebugOptional("categories","set currentActiveCategories()\n" + txtDebug);
			if (v!=null) {
				QuickFolders.Preferences.lastActiveCats = v; // store in pref
      }
		}
		catch (ex) {
			util.logException("Error in setter: currentActiveCategories", ex);
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

	// @tabInfo - optional parameter for iterating all tabs. use current tab else
	storeTabCategorySession: function(cats, tabInfo) {
	  // bridge to API code!
		if (!tabInfo) {
			let tabmail = document.getElementById("tabmail");
			if (!tabmail) return false;
			tabInfo = tabmail.currentTabInfo;
		}
		let extTabId = QuickFolders.WL.extension.tabManager.getWrapper(tabInfo).id;
		QuickFolders.Util.notifyTools.notifyBackground({ func: "storeCategories", tabId: extTabId, categories: cats});
		return true;
	},

	readTabCategorySession: async function(tabInfo) {
		try {
			QuickFolders.Util.logHighlight("readTabCategorySession()");
			let extTabId = QuickFolders.WL.extension.tabManager.getWrapper(tabInfo).id;
			let rv = await QuickFolders.Util.notifyTools.notifyBackground({ func: "readCategories", tabId: extTabId});
			QuickFolders.Util.logDebug(`readTabCategorySession - for tabId[${extTabId}] returned ${rv}`);
			return rv;
		}
		catch(ex) {
			QuickFolders.Util.logException("readTabCategorySession()", ex);
		}
	},

	storeToolbarSession: function(toolbarStatus, tabInfo) {
		let extTabId = QuickFolders.WL.extension.tabManager.getWrapper(tabInfo).id;		
		QuickFolders.Util.notifyTools.notifyBackground({ func: "storeToolbarStatus", tabId: extTabId, status: JSON.stringify(toolbarStatus)});
		return true;
	},

	readTabToolbarSession: async function(tabInfo) {
		try {
			QuickFolders.Util.logHighlight("readTabToolbarSession()");
			let extTabId = QuickFolders.WL.extension.tabManager.getWrapper(tabInfo).id;
			let rv = await QuickFolders.Util.notifyTools.notifyBackground({ func: "readToolbarStatus", tabId: extTabId});
			QuickFolders.Util.logDebug(`readTabToolbarSession - for tabId[${extTabId}] returned ${rv}`);
			let status = null;
			if (rv) {
				status = JSON.parse(rv);;
			}
			return status;
		}
		catch(ex) {
			QuickFolders.Util.logException("readTabToolbarSession()", ex);
		}	
	},
  
	selectCategory: function selectCategory(categoryName, rebuild, dropdown, event) {
    const util = QuickFolders.Util,
					QI = QuickFolders.Interface,
          FCat = QuickFolders.FolderCategory,
					prefs = QuickFolders.Preferences,
					isShift = (event && event.shiftKey) || false;
    util.logDebugOptional("categories", "selectCategory(" + categoryName + ", " + rebuild + ")");
    
    let catA = categoryName.split("|"),
    // remove invalid categories that may have been deleted in the meantime:
        catR = catA.filter(c => QuickFolders.FolderCategory.isValidCategory(c));
    if (!catR.length) {
      categoryName = QuickFolders.FolderCategory.ALL;
    } else if (catA.length != catR.length) {
      categoryName = catR.join("|");
    }
    
		// early exit. category is selected already! SPEED!
    if (QI.currentActiveCategories == categoryName) {
      return false;
		}

		if (categoryName == FCat.ALWAYS) // invalid
			return false;
		// add support for multiple categories
		let cats = categoryName ? categoryName.split("|") : FCat.UNCATEGORIZED,  // QI.currentActiveCategories
				currentCats = QI.currentActiveCategories ? (QI.currentActiveCategories.split("|")) : [],
		    idx = 0,
				multiEnabled = prefs.getBoolPref("premium.categories.multiSelect");
    if (multiEnabled && isShift) {
			let selectedCat = cats[0];
			if (currentCats.includes(selectedCat)) {
				currentCats.splice(currentCats.indexOf(selectedCat), 1);
				util.logDebugOptional("categories", "Removing Category: " + selectedCat + "…");
				QI.currentActiveCategories = currentCats.join("|");
			}
			else {
				util.logDebugOptional("categories", "Adding Category: " + selectedCat + "…");
				QI.currentActiveCategories =
 				  QI.currentActiveCategories ? (QI.currentActiveCategories + "|" + selectedCat) : selectedCat;
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
		// update selected tab
    // QI.onTabSelected(); // <== is already called during updateFolders!

		try {
			let cs = document.getElementById("QuickFolders-Category-Selection");
			cs.setAttribute("label", QI.currentActiveCategories.split("|").join(" + "));
		}
		catch(ex) {
			util.logException("Setting category label:",ex);
		}

		try {
			// store info in tabInfo, so we can restore it easier later per mail Tab
			let tabmail = document.getElementById("tabmail");
			idx = QuickFolders.tabContainer.tabbox.selectedIndex || 0;
			// let's only store this if this is the first tab...
			let tab = util.getTabInfoByIndex(tabmail, idx),
			    tabMode = util.getTabMode(tab);
			if (tab &&
			    (["mailMessageTab", "folder", "mail3PaneTab"].includes (tabMode) )) {
				tab.QuickFoldersCategory = QI.currentActiveCategories; 
				// use wx session API:
        QI.storeTabCategorySession(QI.currentActiveCategories);
			}
		}
		catch(e) {
		  util.logException(" selectCategory failed; ", e);
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
			if (!currentCat || currentCat == FCat.ALL) {
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
          if (folderCat.split("|").indexOf(cats[c]) >= 0)
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
					+ "\n" + "  id: " + (eventTarget.id || "(no id)")
					+ "\n" + "  nodeName: " + (eventTarget.nodeName || "null")
					+ "\n" + "  tagName: "  + (eventTarget.tagName || "none"));
			}
			catch (e) {;}
    }
		function logKey(event) {
			if (!prefs.isDebugOption("events.keyboard")) return;
      util.logDebugOptional("events.keyboard",
				(isAlt ? "ALT + " : "") + (isCtrl ? "CTRL + " : "") + (isShift ? "SHIFT + " : "") +
			  "key = " + e.key + " = "  + (e.key.toLowerCase() + "\n" +
        "keyCode = " + e.keyCode));
		}
    const QI = QuickFolders.Interface,
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences;
		let isAlt = e.altKey,
		    isCtrl = e.ctrlKey,
		    isShift = e.shiftKey,
        eventTarget = e.target,
        isHandled = false,
				isShortcutMatched = false,
        tabmode = null; // move down to optimize text entries.

    // Ctrl+Alt+F for refresh, should always work.
		if (isCtrl && isAlt && dir!="up" && prefs.isUseRebuildShortcut) {
			if (e.key.toLowerCase() == prefs.RebuildShortcutKey.toLowerCase()) {
        tabmode = QuickFolders.Interface.CurrentTabMode;
        if ((tabmode == "mailMessageTab" || tabmode == "mail3PaneTab" || tabmode == '3pane')) {
          this.updateFolders(true, false);
          try {
            util.logDebugOptional("events", "Shortcuts rebuilt, after pressing "
                + (isAlt ? "ALT + " : "") + (isCtrl ? "CTRL + " : "") + (isShift ? "SHIFT + " : "")
                + prefs.RebuildShortcutKey);
            util.showStatusMessage("QuickFolders tabs were rebuilt", true);
          } catch(e) {;};
        }
			}
		}

    // shortcuts should only work in thread tree, folder tree and email preview (exclude conversations as it might be in edit mode)
    let tag = eventTarget.tagName ? eventTarget.tagName.toLowerCase() : "";
    if (   eventTarget.id != "threadTree"
        && eventTarget.id != "folderTree"
        && eventTarget.id != "accountTree"
        && (
          (tag
            &&
						[
							"textarea",        			// Postbox quick reply
							"textbox",         			// any textbox
							"input",           			// Thunderbird 68 textboxes.
							"html:input",      			// Thunderbird 78 textboxes.
							"search-textbox", 		 	// Thunderbird 78 search boxes 
							"xul:search-textbox",  	// Thunderbird 115 search boxes  [issue ]
							"global-search-bar",     // Thunderbird 115 global search [issue ]
							"findbar"              	// [Bug 26654] in-mail search
						].includes(tag)
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
    if (!tabmode) tabmode = QuickFolders.Interface.CurrentTabMode;
		if (["mailMessageTab", "mail3PaneTab", "folder", "3pane", "glodaList"].includes(tabmode)) {
			logKey(e);
      let QuickMove = QuickFolders.quickMove;
      // only Pro users get the shortcuts!!
      if (util.hasValidLicense() && util.licenseInfo.keyType!=2) {
				let isShiftOnly = !isAlt && !isCtrl && isShift && dir!="up",
            isNoAccelerator = !isAlt && !isCtrl && !isShift && dir!="up",
				    theKeyPressed = e.key.toLowerCase();
				util.logDebugOptional("premium.quickJump", "hasValidLicense = true\n" +
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
            QuickFolders.Interface.findFolder(true, "quickJump");
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
              if (tabmode == "mailMessageTab") {
                // first let's reset anything in the quickMove if we are in single message mode:
                QuickMove.resetList();
              }
              // is the folder tree highlighted?
              // [issue 75] support moving folders through quickMove
              if (eventTarget && eventTarget.getAttribute("id") == "folderTree") {
                let folders = GetSelectedMsgFolders(); // [issue 436]
                if (folders.length) { 
                  QuickMove.addFolders(folders, iscopy);
                  QuickMove.update();
                }
              }
              else {
                let messageUris  = util.getSelectedMsgUris();
                if (messageUris) {
                  let currentFolder = util.CurrentFolder;
                  while (messageUris.length) {
                    QuickMove.add(messageUris.pop(), currentFolder, iscopy);
                  }
                  QuickMove.update();
                }
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
        if (util.licenseInfo.keyType == 2)
          util.logDebugOptional("premium.quickJump", "Standard license: no shortcuts supported");
        else
          util.logDebugOptional("premium.quickJump", "hasValidLicense returned false");
			}
    } // quickMove / quickJump

    if (["mail3PaneTab", "folder", "3pane"].includes(tabmode)) { // only allow these shortcuts on the 3pane window!
      if (!isCtrl && isAlt && (dir != "up") && prefs.isUseNavigateShortcuts) {
        switch (e.code) {
          case "ArrowUp":
            this.goUpFolder();
            isHandled = true;
            break;
          case "ArrowLeft":
            if (!this.goPreviousQuickFolder())
              this.goPreviousSiblingFolder();
            isHandled = true;
            break;
          case "ArrowRight":
            if (!this.goNextQuickFolder())
              this.goNextSiblingFolder();
            isHandled = true;
            break;
          case "ArrowDown":
          { // ALT + down
            let f = util.CurrentFolder;
            if (f) {
              // let folderEntry = QuickFolders.Model.getFolderEntry(f.URI);
              let btn = QI.getButtonByFolder(f);
              if (!btn) {
                // trigger the context menu of current folder button, if it is on screen
                let toolpanel = QI.CurrentFolderBar;
                if (toolpanel && toolpanel.parentNode.style["display"]!="none") {
                  btn = QuickFolders.Interface.CurrentFolderTab;
                }
              }
              if (btn) {
                let popupId = btn.getAttribute("popupId");
                if (popupId) { // linux avoid this getting triggered twice
                  let activePopup = document.getElementById(popupId);

                  if (document.getElementById(popupId))
                  // show only subfolders, without commands!
                  QI.showPopup(btn, popupId, null, true); // leave event argument empty
                }
                else {
                  if (btn.hasContextListener) {
                    let event = document.createEvent("mouseevent");
                    event.QFtype="NavDown"; // use this to signal popup menu to focus on first subfolder
                    event.initEvent("contextmenu", true, true);
                    btn.dispatchEvent(event);
                  }
                }
              }
            }
            isHandled = true;
          }
          
        } // code switch
      }

      if (prefs.isUseKeyboardShortcuts) {
        let shouldBeHandled =
          (!prefs.isUseKeyboardShortcutsCTRL && isAlt)
          ||
          (prefs.isUseKeyboardShortcutsCTRL && isCtrl);

        if (shouldBeHandled) {
          let sFriendly = (isAlt ? "ALT + " : "") + (isCtrl ? "CTRL + " : "") + (isShift ? "SHIFT + " : "") + e.key + " : code=" + e.code,
              shortcut = -1;
          util.logDebugOptional("events", "windowKeyPress[" + dir + "]" + sFriendly);
          // determine the shortcut number
          
          if (dir == "up" || dir == "down") {
            switch (e.code) {
              case "Digit0": shortcut = 0; break;
              case "Digit1": shortcut = 1; break;
              case "Digit2": shortcut = 2; break;
              case "Digit3": shortcut = 3; break;
              case "Digit4": shortcut = 4; break;
              case "Digit5": shortcut = 5; break;
              case "Digit6": shortcut = 6; break;
              case "Digit7": shortcut = 7; break;
              case "Digit8": shortcut = 8; break;
              case "Digit9": shortcut = 9; break;
            }
          }

          if (shortcut >= 0 && shortcut < 10) {
            isHandled = true;
            if (dir == "down") return;
            if(shortcut == 0) {
              shortcut = 10;
            }

            //alert(shortcut);
            let offset = prefs.isShowRecentTab ? shortcut+1 : shortcut,
                button = this.buttonsByOffset[offset - 1];
            if(button) {
              if(isShift) {
								// replacing MsgMoveMessage() function
								const makeCopy = false;
								let uris = QuickFolders.Util.getSelectedMsgUris();
								QuickFolders.Util.moveMessages(button.folder, uris, makeCopy);
							}
              else {
                this.onButtonClick(button,e,false);
							}
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

	getButtonByFolder: function(folder) {
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

	toggleToolbar: async function (button, keepState = false) {
		QuickFolders.Util.logDebugOptional("interface", "toggleToolbar(" + button.checked + ")");
		let toolbar = this.Toolbar,
		    // toolbar.style.display = "flex";  // was:   -moz-inline-box 
		    isVisible = !(toolbar.collapsed),
				makeVisible = keepState ? isVisible : !isVisible;
		toolbar.setAttribute("collapsed", !makeVisible);
		let theButton = button.querySelector("button");
		theButton.classList.add("check-button");
		theButton.classList.add("button");
		let WAIT = 250; // a hack until we get native checkbox support
		setTimeout(
		  () => { theButton.setAttribute("aria-pressed",makeVisible); },
			WAIT
		)
		// remember in current Tabinfo object:
		let tabmail = document.getElementById("tabmail");
		if (tabmail && tabmail.currentTabInfo) {
			let status = {
				mainVisibleState: makeVisible
			};
			tabmail.currentTabInfo.QuickFolders_ToolbarStatus = status;
			QuickFolders.Interface.storeToolbarSession(status, tabmail.currentTabInfo);
		}

		return makeVisible;
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
            targetText = "";
        if (cT) {
          targetText = "{tagName=" + cT.tagName + ", id=" + cT.id + ", className=" + cT.className + ", lbl=" + cT.getAttribute("label") +"}";
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
      if (folder && !(button && button.id == "QuickFoldersCurrentFolder")) {
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
    else {
      util.logDebugOptional("interface,popupmenus", "showPopup(" + button.id + ", " + popupId + ", NO EVENT)");
    }

		let doc = button.ownerDocument;
		let p = doc.getElementById(popupId);
		if (!p) p=button.firstChild;

		if (p) {
			doc.popupNode = button;
			// If CTRL key is pressed while clicking the QF tab we hoist up all commands from the #quickFoldersCommands menuPopup
			// by attaching it as button's firstChild
			if (evt && evt.ctrlKey) {
				// only show the QuickFolders Commands menu
				// need to find first child menu
				// see if cloned menu is there already.
				let menupopup = null,
				    nodes  = button.getElementsByTagName("menupopup");

				for (let i=0; i<nodes.length; i++) {
					if (nodes[i].getAttribute("tag")=== "quickFoldersCommands") {
						menupopup = nodes[i];
						break;
					}
				}

				if (!menupopup) {
					nodes = p.getElementsByTagName("menu");
					for (let i=0; i<nodes.length; i++) {
						if(nodes[i].id == "quickFoldersCommands") {
							nodes = nodes[i].getElementsByTagName("menupopup");
							menupopup = nodes[0]; // .cloneNode(true); // Get first menupop = QuickFolders Commands // omit cloning!
							menupopup.folder = button.folder;
							menupopup.setAttribute("tag", "quickFoldersCommands");
							button.appendChild(menupopup);
							break;
						}
					}
				}
				if (menupopup) {
					menupopup.id = "QuickFoldersCommandsOnly"; // for debugging purposes
					let mps = menupopup.getElementsByTagName("menupopup");
					if (mps.length) {
						// add event handler for color commands (for some reason color submenu stops working otherwise)
						this.setEventAttribute(mps[0], "onclick","QuickFolders.Interface.clickHandler(event,this);");
						this.setEventAttribute(mps[0], "oncommand","QuickFolders.Interface.clickHandler(event,this);");
					}
          // [Bug 26703] add folder command popup if it was hidden
          let nodes = p.children;
          for (let i=0; i<nodes.length; i++) {
            if(nodes[i].id == "quickFoldersMailFolderCommands") {
              if ("quickFoldersMailFolderCommands" != menupopup.firstChild.id) { // [issue 255] avoid duplication
                menupopup.insertBefore(nodes[i], menupopup.firstChild);
              }
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
					if(nodes[i].classList.contains("dbgMenu")) {
						nodes[i].collapsed=!evt.shiftKey;
					}
				}
			}

			util.logDebugOptional("popupmenus", "Open popup menu: " + p.tagName + "\nid: " + p.id);
			// make it easy to find calling button / label / target element
			p.targetNode = button;

			let verticalOffset = QI.verticalMenuOffset; 
			p.openPopup(button, "after_start", 0, verticalOffset, true, false, evt);
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
			let isFolderInterface = folder && (typeof folder.getNumUnread!="undefined") && (typeof folder.getTotalMessages!="undefined"),
			    nU = isFolderInterface ? folder.getNumUnread(false) : 0,
          numUnread = (nU==-1) ? 0 : nU, // Postbox root folder fix
			    numUnreadInSubFolders = isFolderInterface ? (folder.getNumUnread(true) - numUnread) : 0,
			    numTotal = isFolderInterface ? folder.getTotalMessages(false) : 0,
			    numTotalInSubFolders = isFolderInterface ? (folder.getTotalMessages(true) - numTotal) : 0,
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
        isShowTotals = (entry.flags & util.ADVANCED_FLAGS.SUPPRESS_COUNTS) ? false : true;
      if (isShowUnread && entry && entry.flags)
        isShowUnread = (entry.flags & util.ADVANCED_FLAGS.SUPPRESS_UNREAD) ? false : true;

			util.logDebugOptional("folders",
				  "unread " + (isShowUnread ? "(displayed)" : "(not displayed)") + ": " + numUnread
				+ " - total:" + (isShowTotals ? "(displayed)" : "(not displayed)") + ": " + numTotal);
			if (isShowUnread) {
				if(numUnread > 0)
					s = s+numUnread;
				if(numUnreadInSubFolders > 0 && prefs.isShowCountInSubFolders)
					s = s + triangleDown + numUnreadInSubFolders+"";
				if(s!="")
					displayNumbers.push(s);
			}

			if (isShowTotals) {
				s = "";
				if(numTotal > 0)
					s=s+numTotal;
				if(numTotalInSubFolders > 0 && prefs.isShowCountInSubFolders)
					s=s + triangleDown + numTotalInSubFolders+"";
				if(s!="")
					displayNumbers.push(s);
			}

			if (displayNumbers.length) {
				label += " (" + displayNumbers.join(" / ") + ")";
			}
			return label;
		}
		catch(ex) {
			util.logToConsole("getButtonLabel:" + ex);
			return "";
		}
	} ,

  makePopupId: function makePopupId(folder, buttonId) {
		this.IdUnique++;
    return "QuickFolders-folder-popup-" + (buttonId || (folder ? folder.URI : this.IdUnique)); // + "-" + this.IdUnique;
  },

	addFolderButton: function(folder, entry, offset, theButton, buttonId, fillStyle, isFirst, isMinimal) {
		const QI = QuickFolders.Interface,
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					FLAGS = util.FolderFlags;
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null,
		    tabIcon = (entry && entry.icon) ? entry.icon : "",
        useName = (entry && entry.name) ? entry.name : "",
				stats = { unreadTotal:0, unreadSubfolders:0, totalCount:0 },
		    label = this.getButtonLabel(folder, useName, offset, entry, stats);
		const doc = theButton ? theButton.ownerDocument : 
		            (buttonId == "QuickFoldersCurrentFolder" ? util.document3pane :  document);

    if (!folder && !isMinimal) {
      util.logToConsole("Error in addFolderButton: " + "folder parameter is empty!\n"
                        + "Entry: " + (entry ? (entry.name || label) : (" invalid entry: " + label)));
    }
    try {
			let isMsgFolder = folder && (typeof folder.getStringProperty != "undefined");
			// SeaMonkey: getStringProperty throws error if folder is in trash. it has no parent in this case.
      if (!tabIcon && isMsgFolder && folder.parent && folder.getStringProperty("folderIcon")) {
        // folder icon, but no quickFolders tab!
        let tI = folder.getStringProperty("iconURL");
        if (tI)
          tabIcon=tI;
      }
    }
    catch(ex) {
      /*
      util.logToConsole("Error in addFolderButton: " + "folder getStringProperty is missing.\n"
                        + "Entry: " + (entry ? entry.name : " invalid entry") + "\n"
                        + "URI: " + (folder.URI || "missing"));
      util.logException("Error in addFolderButton", ex);
      */
    }
    if (!theButton) isMinimal=false; // if we create new buttons from scratch, then we need a full creation including menu

		util.logDebugOptional("interface.tabs", "addFolderButton() label=" + label + ", offset=" + offset + ", col=" + tabColor + ", id=" + buttonId + ", fillStyle=" + fillStyle);
		let button = theButton || doc.createXULElement("toolbarbutton");
		button.setAttribute("label", label);

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="",
		    sDisplayIcons = (prefs.isShowToolbarIcons) ? " icon": "",
        // if the tab is colored, use the new palette setting "ColoredTab"
        // if it is uncolored use the old "InActiveTab"
		    paletteClass = (tabColor!="0") ? this.getPaletteClass("ColoredTab") : this.getPaletteClass("InactiveTab");
    if (entry && entry.customPalette) {
      paletteClass = this.getPaletteClassToken(entry.customPalette);
    }

		// use folder flags instead!
		if (folder) {
			if (folder.flags & FLAGS.MSG_FOLDER_FLAG_INBOX) {
				specialFolderType="inbox" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_SENTMAIL) {
				specialFolderType="sent" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_TRASH) {
				specialFolderType="trash" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_JUNK) {
				specialFolderType="junk" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_TEMPLATES) {
				specialFolderType="template" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_QUEUE) {
				specialFolderType="outbox" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_DRAFTS) {
				specialFolderType="draft" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_NEWSGROUP) {
				specialFolderType="news" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_ARCHIVES) {// Dillinger Bug
				specialFolderType="archive" + sDisplayIcons;
			} else if (folder.flags & FLAGS.MSG_FOLDER_FLAG_VIRTUAL) {
				specialFolderType="virtual" + sDisplayIcons; // all other virtual folders (except smart which were alreadyhandled above)
			} else if (tabIcon) {
				specialFolderType="icon"; // independant of option, customized icons are always shown
      } 
		}
		else {
			specialFolderType="invalid icon";
			tabIcon="";
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
			// this.setEventAttribute(button, "oncommand","QuickFolders.Interface.onButtonClick(event.target, event, true);");
			button.addEventListener("click",
				function(event) {
					event.stopPropagation();
					QI.onButtonClick(event.target, event, true);
				},
				false);
			button.addEventListener("command",
				function(event) {
          // avoid duplication when clicking buttons themselves:
          if (event.target.tagName == "toolbarbutton") return;
					QI.onButtonClick(event.target, event, true);
				},
				false);
		}

    /**  Menu Stuff  **/

		let popupId = "";
    if (!isMinimal) {
			popupId = this.makePopupId(folder, buttonId);
			if (buttonId == "QuickFoldersCurrentFolder") {
				button.setAttribute("popupId", popupId);
			}

      button.setAttribute("context",""); // overwrites the parent context menu
      // this.setEventAttribute(button, "oncontextmenu",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
			// [Bug 26575]
			if (!button.hasContextListener) {
				//
				button.addEventListener("contextmenu",
					function(event) {
            // there is a problem with the closure on popupId in current folder button,
            // which could lead to it showing previous folders' menus
            let pId = button.getAttribute("popupId") || popupId;
						QI.showPopup(button, pId, event);
						// only hstop handling event when popup is shown!
						event.preventDefault();
						event.stopPropagation();
					}, false);
				button.hasContextListener = true;
			}
      if (buttonId == "QuickFoldersCurrentFolder") {
        // this.setEventAttribute(button, "onclick",'QuickFolders.Interface.showPopup(this,"' + popupId + '",event)');
				if (!button.hasClickEventListener) { // additional left-click menu
					button.addEventListener("click",
						function(event) {
						  // right-click is already handled by contextmenu event
						  if (event.button == 0) {
                // [issue 268] make a fresh popupId!
                let popupId = QI.makePopupId(event.target.folder, buttonId)
								QI.showPopup(button,popupId,event);
								event.preventDefault();
								event.stopPropagation();
							}
						}, false);
					button.hasClickEventListener = true;
					this.setEventAttribute(button, "ondragstart","QuickFolders.buttonDragObserver.startDrag(event, true)");
					this.setEventAttribute(button, "ondragleave","QuickFolders.buttonDragObserver.dragLeave(event, true)"); // can be swallowed when moving fast
					this.setEventAttribute(button, "ondragexit","QuickFolders.buttonDragObserver.dragLeave(event, true)");
				}
      }
    }

		if (!theButton) {
		  // line break?
			if (entry && entry.breakBefore && !isFirst) { // no line break if this is the first button on a line
			  // without explicitely adding this namespace, the break doesnt show up!
			  let LF = doc.createElement("div");
				LF.classList.add("break");
			  this.FoldersBox.appendChild(LF);
			}

			if (entry && entry.separatorBefore  && !isFirst) {  // no separator if this is the first button on a line
			  let sep = this.createIconicElement("toolbarseparator","*");
			  this.FoldersBox.appendChild(sep);
			}
			this.FoldersBox.appendChild(button);
			if (folder) {
        // these are defined in mail/base/content/folderPane.js
				this.setEventAttribute(button, "ondragenter", "QuickFolders.buttonDragObserver.dragEnter(event);");
				this.setEventAttribute(button, "ondragover", "QuickFolders.buttonDragObserver.dragOver(event);");
				this.setEventAttribute(button, "ondrop", "QuickFolders.buttonDragObserver.drop(event);");
				this.setEventAttribute(button, "ondragleave", "QuickFolders.buttonDragObserver.dragLeave(event);"); // can be omitted when moving fast
				this.setEventAttribute(button, "ondragexit","QuickFolders.buttonDragObserver.dragLeave(event)");

			}
			// button.setAttribute("flex",100);
		}
    // we do this after appendChild, because labelElement needs to be generated in DOM
    this.addCustomStyles(button, entry);

    if (!isMinimal) {
      // popupset is NOT re-done on minimal update - save time!
      setTimeout (
        // make this async
        function () {
          QuickFolders.Interface.addPopupSet({popupId:popupId, folder:folder, entry:entry, offset:offset, button:button, noCommands:false, event:null});
        } ,
        20
      );
    }

		if (!theButton) {
			// AG add dragging of buttons
			this.setEventAttribute(button, "ondragstart","QuickFolders.buttonDragObserver.startDrag(event, true)");
			// this.setEventAttribute(button, "ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
			this.setEventAttribute(button, "ondragleave","QuickFolders.buttonDragObserver.dragLeave(event)");
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
			let cssUri = "";
			if (filePath) {
        if (filePath.indexOf("url")==0)
          cssUri = filePath;
        else
          cssUri = "url(" + filePath + ")";
			}
			element.style.listStyleImage = cssUri; // direct styling!
		}
		catch(ex) {
		  QuickFolders.Util.logException("Exception in Interface.applyIcon ", ex);
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
	* @icon: icon or "" or null
  * @entry: the entry from the model array - use for advanced (tab specific) properties
 	*/
	styleFolderButton: function styleFolderButton(button, nUnreadTotal, nUnreadSubfolders, numTotal, specialStyle, tabColor, gotNew, icon, entry) {
		//reset style!
		let cssClass = "",
        ADVANCED_FLAGS = QuickFolders.Util.ADVANCED_FLAGS;
		//  toolbarbutton-menubutton-button

		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.getAttribute("label")
			+ ", " + nUnreadTotal + ", " + numTotal + ", " + specialStyle + ")");

		if (nUnreadTotal > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold) {
      if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD))
        { ; }
      else {
				if (nUnreadSubfolders == nUnreadTotal)
					cssClass += " has-unreadSubOnly";
				else {
          if (nUnreadSubfolders)
            cssClass += " has-unreadSub"; // [issue 109]
					cssClass += " has-unread";
        }
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
			let doc = button.ownerDocument || document;
      let anonChildren = util.getAnonymousNodes(doc,button); // button  ? button.getElementsByAttribute("class", "toolbarbutton-text") : null;
      if (!anonChildren) return null;
      for (let i=0; i<anonChildren.length; i++) {
        if (anonChildren[i].classList.contains("toolbarbutton-text"))
          return anonChildren[i];
      }
      return null;
    }
    let ADVANCED_FLAGS = util.ADVANCED_FLAGS;
    // custom colors
    if (entry && entry.flags && (entry.flags & ADVANCED_FLAGS.CUSTOM_CSS)) {
      try {
        button.style.setProperty("background-image", entry.cssBack, "");
        let l = getLabel(button);
        if (l)
          l.style.setProperty("color", entry.cssColor, "");
      }
      catch(ex) {
        QuickFolders.Util.logException("custom CSS failed",ex);
      }
    }
    else {
      if(button.id == "QuickFoldersCurrentFolder") {
        button.style.removeProperty("background-image");
        let l = getLabel(button);
        if (l)
          l.style.removeProperty("color");
      }
    }
  },

	onButtonClick: function (button, evt, isMouseClick) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface;
		util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);
		// this may happen when we right-click the menu with CTRL
		try {
			let tag = button.tagName || null;
			if (tag == "menuitem" && button.parentElement.getAttribute("tag") == "quickFoldersCommands") {
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
			if (button.folder === util.CurrentFolder & QI.CurrentTabMode != "mailMessageTab") {
				if (evt.type=="click" && evt.button==2) { // right click
					let popupId = button.getAttribute("popupId");
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
          if (evt.originalTarget && evt.originalTarget.tagName == "menuitem") {
            ; // [issue 205] if the tag is a menuitem we do not call this code.
          }
          else {
            this.onTabSelected(button);
            QuickFolders_MySelectFolder(button.folder.URI);
            evt.preventDefault(); // prevent opening the popup
          }
				}
			}
		}
		else {
			if (evt.button==0) { // left-click only
				// force select folder on invalid URI - this will suggest to delete the folder.
				let uri = button.getAttribute("folderURI");
				if (uri) {
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
			// was: tabmail.openTab("folder", {folder: folder, messagePaneVisible: true, background: false, disregardOpener: true, title: tabName} );
      tabmail.openTab("mail3PaneTab", {folderURI:folder.URI, messagePaneVisible: true, background: false, disregardOpener: true, title: tabName} );
		}
	} ,

	// new function to open folder of current email!
	// tooltip = &contextOpenContainingFolder.label;
	openContainingFolder: function openContainingFolder(msg) {
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
			QuickFolders.Model.removeFolder(tab.getAttribute("folderURI"), true); // let's store folder URI for invalid loaded tabs
		// this.updateFolders(true); already done!
		try { util.showStatusMessage(msg, true); } catch(e) {;};
	} ,

	onRemoveIcon: function(element, event) {
    let folderButton, entry,
        util = QuickFolders.Util,
        model = QuickFolders.Model;
    util.logDebugOptional("interface", "QuickFolders.Interface.onRemoveIcon()");
		if (element.id == "context-quickFoldersRemoveIcon" // folder tree icon
		    ||
				element.id == "QuickFolders-RemoveIcon") { // current folder bar

			let folders;
			switch(element.id) {
				case "QuickFolders-RemoveIcon": // current folder bar
				folders = GetSelectedMsgFolders();
				break;
			case "context-quickFoldersRemoveIcon": // style a folder tree icon - retrieve folder from event.detail
				util.logDebugOptional("folderTree.icons", event.detail);
				let fld = QuickFolders.Model.getMsgFolderFromUri(event.detail?.folderURI);
				folders = fld ? [fld] : [];
				break;				
			}
			let isChanged = false;
			if (folders) {
				for (let i=0; i<folders.length; i++) {
          let folder = folders[i];
					if (QuickFolders.FolderTree.setFolderTreeIcon(folder, null)) {
						isChanged = true;
					}

					entry = model.getFolderEntry(folder.URI);
					if (entry) {
						// if button visible, update it!
					  folderButton = this.shouldDisplayFolder(entry) ? this.getButtonByFolder(folder) : null;
						model.setTabIcon (folderButton, entry, ""); // will only modify stored entry, if tab not visible.
					}
				}
				if (isChanged) {
					QuickFolders.FolderTree.storeTreeIcons();
				}
			}
      if (element.id == "QuickFolders-RemoveIcon") {
        let cFT = QuickFolders.Interface.CurrentFolderTab;
        if (cFT)
          cFT.style.listStyleImage = "";
      }

		}
		else {
			folderButton = util.getPopupNode(element);
			entry = model.getButtonEntry(folderButton);
			element.collapsed = true; // hide the menu item!
	    model.setTabIcon	(folderButton, entry, "");
			let folder = model.getMsgFolderFromUri(entry.uri)
			if (folder && QuickFolders.FolderTree) {
				if (QuickFolders.FolderTree.setFolderTreeIcon(folder, null)) {
					QuickFolders.FolderTree.storeTreeIcons();
				}
				
			}
		}
	} ,

	onSelectIcon: function (element, event) {
		const Ci = Components.interfaces,
          Cc = Components.classes,
          nsIFilePicker = Ci.nsIFilePicker,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile,
          util = QuickFolders.Util,
          model = QuickFolders.Model,
          hasLicense = util.hasValidLicense();
    
    let maximumIcons = model.MAX_UNPAID_ICONS,
        isRestricted = !hasLicense;
        
    if (hasLicense) {
      if (util.hasStandardLicense()) {
        maximumIcons = model.MAX_STANDARD_ICONS;
        isRestricted = true;
      }
      else {
        maximumIcons = 10000;
			}
    }
      
          
		let folderButton, entry,
		    folders = null,
        QI = QuickFolders.Interface;
    util.logDebugOptional("interface", "QuickFolders.Interface.onSelectIcon()");
		switch(element.id) {
			case "QuickFolders-SelectIcon": // current folder bar
				folders = GetSelectedMsgFolders();
				break;
			case "context-quickFoldersIcon": // style a folder tree icon - retrieve folder from event.detail
			  util.logDebugOptional("folderTree.icons", event.detail);
				let fld = QuickFolders.Model.getMsgFolderFromUri(event.detail?.folderURI);
				folders = fld ? [fld] : [];
				break;
			default:
				folderButton = util.getPopupNode(element);
				entry = model.getButtonEntry(folderButton);
		}
    let entries = model.selectedFolders,
        countIcons = 0;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].icon)
        countIcons++;
    }
    if (isRestricted && countIcons >= maximumIcons){
      let text = util.getBundleString("qf.notification.premium.tabIcons",[countIcons, model.MAX_UNPAID_ICONS, model.MAX_STANDARD_ICONS]);
      util.popupRestrictedFeature("tabIcons", text);
      // early exit if no license key and maximum icon number is reached
      if (countIcons>=maximumIcons)
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
							QuickFolders.Preferences.setStringPref("tabIcons.defaultPath", file.path);
							let iconURL = fp.fileURL;
							if (folders) {
							  for (let i=0; i<folders.length; i++) {
                  let folder = folders[i];
								  if (QuickFolders.FolderTree) {
										if (QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL)) {
											QuickFolders.FolderTree.storeTreeIcons();
										}
									}
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
								if (folder && QuickFolders.FolderTree) {
									QuickFolders.FolderTree.document = QuickFolders.Util.document3pane; // immediate effect on current 3pane tab.
									if (QuickFolders.FolderTree.setFolderTreeIcon(folder, iconURL)) {
										QuickFolders.FolderTree.storeTreeIcons();
									}
								}
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
		    lastPath = QuickFolders.Preferences.getStringPref("tabIcons.defaultPath");
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

	onRenameBookmark: function(element) {
		let util = QuickFolders.Util,
        folderButton = util.getPopupNode(element),
		    sOldName = folderButton.label; //	this.getButtonByFolder(popupNode.folder).label;
		// strip shortcut numbers
		if(QuickFolders.Preferences.isShowShortcutNumbers) {
			let i = sOldName.indexOf(". ");
			if (i<3 && i>0) {
				sOldName = sOldName.substring(i+2,sOldName.length);
			}
		}
		// find if trhere is a number of total messages / unread message in the label, and strip them from renaming!!
		if (QuickFolders.Preferences.isShowTotalCount || QuickFolders.Preferences.isShowUnreadCount) {
			let i = sOldName.lastIndexOf(" ("),
			    j = sOldName.lastIndexOf(")");
			// TODO: additional check if there are just numbers and commas within the brackets!

			//making sure there is stuff between the () and the last char is a )
			if (i > 1 && sOldName.substr(i, j - i).length > 0 && j == sOldName.length - 1) {
				let bracketedLen = j-i+1;
				util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "	length = " + bracketedLen);
			// lets check if this is numeral, after removing any ","
				sOldName = sOldName.substring(0,sOldName.length - bracketedLen);
			}
		}

		let fUri =  folderButton.folder ? folderButton.folder.URI : folderButton.getAttribute("folderURI");

		let newName = window.prompt(this.getUIstring("qfNewName")+"\n" + fUri, sOldName); // replace folder.name!
		if(newName) {
			QuickFolders.Model.renameFolder(fUri, newName);
		}
	} ,

  onAdvancedProperties: function(evt, element) {
    let util = QuickFolders.Util,
        button = util.getPopupNode(element),
        folder = button.folder,
        folderURI = folder ? folder.URI : button.getAttribute("folderURI"),
        entry = QuickFolders.Model.getFolderEntry(folderURI),
        rect = button.getBoundingClientRect(),     // was boxObject
        x = button.screenX,                            
        y = button.screenY + rect.height;          // boxObject.screenY + boxObject.height 
		if (!folder) {
			util.alertButtonNoFolder(button);
			return;
		}

    // attach to bottom of the Tab (like a popup menu)
    setTimeout(function() {
			util.logDebug("onAdvancedProperties(evt)\n screenX = " + x +"\n screenY = " + y);
			util.popupRestrictedFeature("advancedTabProperties");}
		);

		const isMacPlatform = QuickFolders.Util.platformInfo.os == "mac",
		      isLinuxPlatform = QuickFolders.Util.platformInfo.os == "linux",
		      isHTMLprops = evt.shiftKey; // || isMacPlatform default for the next version!

		let forcePopup = QuickFolders.Preferences.isDebugOption("advancedTabProperties.forcePopup"); // for debugging on Mac
		let forceRaised = false; // for testing alwaysRaised
		debugger;

		QuickFolders.Util.logDebug(rect);
		if (isHTMLprops) {
			QuickFolders.Util.notifyTools.notifyBackground({ func: "openAdvancedProps", folderURI, x, y }); // rect.left, rect.top
		} else {
			let winProps = `chrome,left=${x},top=${y},width=490`;
			if ((!isLinuxPlatform && !isMacPlatform) || forcePopup) { // avoid color popups being hidden on Mac
			  winProps +=",popup=yes";
			}
			if (forceRaised) {
				winProps +=",alwaysRaised"; // only for testing. we don't use it anymore.
			}
			// the window may correct its x position if cropped by screen's right edge
			let win = window.openDialog(
				"chrome://quickfolders/content/quickfolders-advanced-tab-props.xhtml",
				"quickfolders-advanced",
				winProps, 
				folder, entry); //
			win.focus();
			win.addEventListener("blur", (event) => {
				console.log("advanced tab lost focus:", event);
			});
		}

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
		if (folder.server.type != "imap" && !folder.expungedBytes) {
			return;
		} 
		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
		folder.compact(null, top.msgWindow); 
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
      if (!child.parent || !p) return false;
      if (child.parent == p) {
        return true;
      }
      if (p.isServer || !p.parent) return false;
      // [issue 144] Mark folders + subfolders read stops at first generation (direct child folder) mails.
      // original version used the parent of 2nd argument!
      return hasAsParent(child.parent, p); 
    }

    evt.stopPropagation();
    util.logDebugOptional("interface", "QuickFolders.Interface.onMarkAllRead()");
		try {
			let f = folder.QueryInterface(Components.interfaces.nsIMsgFolder);
      f.markAllMessagesRead(msgWindow); // msgWindow  - global
      if (recursive) {  // [issue 3] Mark messages READ in folder and all its subfolders
        // iterate all folders and mark all children as read:
        for (let folder of util.allFoldersIterator(false)) {
          // check unread
          if (folder.getNumUnread(false) && hasAsParent(folder, f)) {
            setTimeout(
              function() { 
                folder.markAllMessagesRead(msgWindow);  // msgWindow  - global
              }
            )
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
				parent = folderButton.folder.parent;

    util.logDebugOptional("interface", "QuickFolders.Interface.onDeleteFolder()");
		const folderPane = util.folderPane;
		folderPane.deleteFolder(folderButton.folder);
		if (parent) {
			QuickFolders_MySelectFolder(parent.URI);
		}

		// if folder is gone, delete quickFolder [Bug 26514]
		// if (!QuickFolders.Model.getMsgFolderFromUri(uri, false))
		QuickFolders.Interface.onRemoveBookmark(folderButton);
	} ,

	onRenameFolder: function onRenameFolder(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder,
		    theURI = folder.URI;
    util.logDebugOptional("interface", "QuickFolders.Interface.onRenameFolder()");
    const folderPane = util.folderPane;
		folderPane.renameFolder(folder);
	} ,

	onEmptyTrash: function onEmptyTrash(element) {
		let util = QuickFolders.Util,
		    folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEmptyTrash()");
		QuickFolders.compactLastFolderSize = folder.sizeOnDisk;
		QuickFolders.compactLastFolderUri = folder.URI;
		QuickFolders.compactReportCommandType = "emptyTrash";
    const folderPane = util.folderPane;
		folderPane.emptyTrash(folder);
    
		QuickFolders.compactReportFolderCompacted = true; // activates up onIntPropertyChanged event listener
	} ,

	onEmptyJunk: function onEmptyJunk(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEmptyJunk()");
		const folderPane = util.folderPane;
		folderPane.emptyJunk(folder);
    this.compactFolder(folder, "emptyJunk");
	} ,

	onDeleteJunk: function onDeleteJunk(element) {
		const Ci = Components.interfaces
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onDeleteJunk()");
		const gDBView = tabmail.currentTabInfo.chromeBrowser.contentWindow.threadTree.view;

		if (gDBView.msgFolder != folder) {
			console.warn("Purge Junk is currently only available for current folder!");
			return;
		}
		
		if (!folder.getFlag(Ci.nsMsgFolderFlags.Virtual)) {
			let junkMsgHdrs = [];
			for (let msgHdr of folder.messages) {   // gDBView.msgFolder.messages
				let junkScore = msgHdr.getStringProperty("junkscore");
				if (junkScore == Ci.nsIJunkMailPlugin.IS_SPAM_SCORE) {
					junkMsgHdrs.push(msgHdr);
				}
			}
	
			if (junkMsgHdrs.length) {
				gDBView.msgFolder.deleteMessages(
					junkMsgHdrs,
					msgWindow,
					false,
					false,
					null,
					true
				);
			}
			return junkMsgHdrs.length;
		}		
	} ,

	onEditVirtualFolder: function onEditVirtualFolder(element) {
		let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder;
    util.logDebugOptional("interface", "QuickFolders.Interface.onEditVirtualFolder()");
		util.folderPane.editVirtualFolder(folder);
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
		util.folderPane.editFolder(folder);
	} ,

	openExternal: function openExternal(aFile) {
		let util = QuickFolders.Util;
    util.logDebugOptional("interface", "QuickFolders.Interface.openExternal()");
    try {
      util.logDebug("openExternal()" + aFile);
      let uri = Cc["@mozilla.org/network/io-service;1"].
                getService(Ci.nsIIOService).newFileURI(aFile),
          protocolSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                        getService(Ci.nsIExternalProtocolService);
      protocolSvc.loadUrl(uri);
    }
    catch(ex) {
      util.logDebug("openExternal() failed:\n" + ex);
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
    util.logDebug("onFolderOpenLocation()\nfolder: " + folder.name +"\nPath: " + folder.filePath.path);
		let f = this.getLocalFileFromNativePathOrUrl(folder.filePath.path); // aDownload.getAttribute("file")
		try {
			// Show the directory containing the file and select the file
			f.reveal();
		} catch (e) {
      util.logDebug("onFolderOpenLocation() - localfile.reveal failed: " + e);
			// If reveal fails for some reason (e.g., it's not implemented on unix or
			// the file doesn't exist), try using the parent if we have it.
			let parent = f.parent.QueryInterface(NSIFILE);
			if (!parent) {
        util.logDebug("onFolderOpenLocation() - no folder parent - giving up.");
				return;
      }

			try {
				// "Double click" the parent directory to show where the file should be
        util.logDebug("onFolderOpenLocation() - parent.launch()");
				parent.launch();
			} catch (ex) {
        util.logDebug("onFolderOpenLocation() - parent.launch() failed:" + ex);
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
      if (folder.server.type != "none")
        GetNewMsgs(folder.server, folder);
		}
	} ,

  onDownloadAll: function onDownloadAll(element) {
    // IMAP / non-nntp folders only - forces a download of all messages (important for non-synced folders)
    // we need to create a progress window and pass that in as the second parameter here.
    let util = QuickFolders.Util,
        folder = util.getPopupNode(element).folder,
        // In Thunderbird the default message window is stored in the global variable msgWindow.
        mw = msgWindow; // global
    util.logDebugOptional("interface", "QuickFolders.Interface.onDownloadAll()");
    folder.downloadAllForOffline(null, mw); // nsIUrlListener, nsIMsgWindow
  } ,

	rebuildSummary: async function rebuildSummary(folder) {
    // global objects: msgWindow
    QuickFolders.Util.logDebug(`rebuildSummary(${folder.prettyName}) started... `);
    
		let isCurrent=false;
		// taken from http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#2087
		if (folder.locked) {
			folder.throwAlertMsg("operationFailedFolderBusy", msgWindow);
			return;
		}
		if (folder.supportsOffline) {
			// Remove the offline store, if any.
			await IOUtils.remove(folder.filePath.path, { recursive: true }).catch(
				console.error
			);
		}

		// We may be rebuilding a folder that is not the displayed one.
		// TODO: Close any open views of this folder.

		// Send a notification that we are triggering a database rebuild.
		MailServices.mfn.notifyFolderReindexTriggered(folder);

		folder.msgDatabase.summaryValid = false;

		const msgDB = folder.msgDatabase;
		msgDB.summaryValid = false;
		try {
			folder.closeAndBackupFolderDB("");
		} catch (e) {
			// In a failure, proceed anyway since we're dealing with problems
			folder.ForceDBClosed();
		}
		folder.updateFolder(top.msgWindow);
		// TODO: Reopen closed views.
		QuickFolders.Util.slideAlert("QuickFolders", this.getUIstring("qfFolderRepairedMsg") + " " + folder.prettyName);
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
    
    QI.onCreateInstantFolder(folder);  // async function
	},
   
	// * function for creating a new folder under a given parent
	// see http://mxr.mozilla.org/comm-central/source/mail/base/content/folderPane.js#2359
	onCreateInstantFolder: function onCreateInstantFolder(parentFolder, folderName) {
		const util = QuickFolders.Util,
					QI = QuickFolders.Interface;

		let isQuickMove = (QuickFolders.quickMove.isActive),
				isFindFolder = true;  // flag for coming from the quickMove / quickJump popup menu

		// replace onNewCurrentFolder for new folder toolbar button:
		if (!parentFolder) {
			parentFolder = util.CurrentFolder;
			folderName = "";
			isQuickMove = false; // irrelevant in this case
			isFindFolder = false;
		}

    util.logDebugOptional("interface", "QuickFolders.Interface.onCreateInstantFolder(" + parentFolder.prettyName + ", " + folderName + ")");
    let title = util.getBundleString("qf.prompt.newFolder.title"),
        text = util.getBundleString("qf.prompt.newFolder.newChildName") + ":",
        checkBoxText = util.getBundleString("qf.prompt.newFolder.createQFtab"),
        input = { value: folderName },
        check = { value: false },
        result = Services.prompt.prompt(window, title, text.replace("{0}", parentFolder.prettyName), input, checkBoxText, check);
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
				function failedCreateFolder(reason) {
					util.logToConsole(`Exception in getOrCreateFolder(${newFolderUri}, ${util.FolderFlags.MSG_FOLDER_FLAG_MAIL}) `, reason);
				}
			);
	},

	onSearchMessages: async function onSearchMessages(element) {
		let folder = QuickFolders.Util.getPopupNode(element).folder;
		QuickFolders.Util.logDebugOptional("interface", "QuickFolders.Interface.onSearchMessages() folder = " + folder.prettyName);
		// Tb:  // gFolderTreeController.searchMessages();
		// MsgSearchMessages(folder);
		let cmdController = top.controllers.getControllerForCommand("cmd_searchMessages");
		// cmdController?.doCommand("cmd_searchMessages", folder); // why is folder parameter not transmitted??
		// QuickFolders.Util.logTb115("onSearchMessages()");
		
		top.openDialog(
			"chrome://messenger/content/SearchDialog.xhtml",
			"_blank",
			"chrome,resizable,status,centerscreen,dialog=no",
			{ folder }
		);

		// TEST: Get a MailFolder from an nsIMsgFolder:
		// we cannot pass this object directly. Can we convert it?
		// let mf = await messenger.Utilities.getMailFolder(folder);
		// QuickFolders.Util.notifyTools.notifyBackground({ func: "searchMessages", folder: mf });
	} ,

	// forceOnCommand use the "old" way of oncommand attribute for QF options dialog
	buildPaletteMenu: function buildPaletteMenu(currentColor, existingPopupMenu, ignoreTheme, forceOnCommand) {
		const Themes = QuickFolders.Themes.themes,
		      util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					QI = QuickFolders.Interface;
		let logLevel = (typeof existingPopupMenu === "undefined") ? "interface.tabs" : "interface",
        popupTitle = existingPopupMenu ? existingPopupMenu.id : "none";
		util.logDebugOptional(
			logLevel,
			"buildPaletteMenu(" + currentColor + ", existingPopupMenu=" + popupTitle + ")");
		let menuColorPopup = existingPopupMenu ? existingPopupMenu : this.createIconicElement("menupopup","*");
		try {
			const colorText = this.getUIstring("qfMenuColor");
			// only flat style + apple pills support palette color
			if (ignoreTheme
			    || prefs.CurrentThemeId == Themes.ApplePills.Id
					|| prefs.CurrentThemeId == Themes.Flat.Id) {
				for (let jCol=0; jCol<=20;jCol++) {
					let menuitem = this.createIconicElement("menuitem", "color menuitem-iconic"),
					    id = "qfColor"+jCol;
					menuitem.setAttribute("tag", id);
					if (jCol) {
						menuitem.setAttribute("label", colorText + " "+ jCol);
						//menuitem.setAttribute("style","background-image:url('cols/tabcol-" + jCol + ".png')!important;");
						if (currentColor == jCol)
							menuitem.checked = true;
					}
					else
						menuitem.setAttribute("label",this.getUIstring("qfMenuTabColorNone"));
          if(forceOnCommand)
            this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.setTabColorFromMenu(this, '" + jCol + "')");
          menuColorPopup.appendChild(menuitem);
				}
			}
			else {
				let menuitem = this.createIconicElement("menuitem","*");
				menuitem.setAttribute("label",this.getUIstring("qfMenuTabColorDisabledInTheme"));
				// open "bling my tabs"
				menuitem.addEventListener("command", function(event) { QI.viewOptions(2); }, false);
				menuColorPopup.appendChild(menuitem);
			}
			// create color pick items
			util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");
		}
		catch(ex) {
			util.logException("Exception in buildPaletteMenu ", ex);
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
					QI = QuickFolders.Interface,
					doc = button.ownerDocument;
		function createMailCmdMenuItem(id, label, tag)  {
			let menuItem = QI.createIconicElement("menuitem", null, doc);
			menuItem.setAttribute("id",id);
			if (label) { menuItem.setAttribute("label", label); }
			if (tag) { menuItem.setAttribute("tag", tag); }
			return menuItem;
		}
    let topShortCuts = 0,
		    menuitem;
		// Empty Trash
		if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH
			&&
			prefs.getBoolPref("folderMenu.emptyTrash"))
		{
			menuitem = this.createMenuItem_EmptyTrash(doc);
			MailCommands.appendChild(menuitem);
			if (isRootMenu)
				topShortCuts ++;
		}

		// Get Newsgroup Mail
		if ((folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP)
			&&
			prefs.getBoolPref("folderMenu.getMessagesForNews"))
		{
			menuitem = createMailCmdMenuItem("QF_folderPaneContext-getMessages" , this.getUIstring("qfGetMail"));
      menuitem.setAttribute("accesskey",this.getUIstring("qfGetMailAccess"));
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
        menuitem = this.createMenuItem_GetMail(folder, doc);
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
          if (type !== "nntp" // newsgroups have their own "Get Messages" Command
              &&
              type !== "pop3"
              &&
              type !== "none"  // local folders
              &&
              !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_INBOX)) {
              let downloadLabel = this.getUIstring("qfDownloadAll") + " [" + type + "]";
              // call nsIMsgFolder.downloadAllForOffline ?
							menuitem = createMailCmdMenuItem("QF_folderPaneContext-downloadAll", downloadLabel);
              menupopup.appendChild(menuitem);
              topShortCuts ++ ;
          }
        }
      }
      catch(ex) {
			  util.logException("Exception in appendMailFolderCommands for " + folder.name + " this should have a server property!", ex);
      }

      // MarkAllRead (always on top)
      if (!(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
        &&
        !(folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK))
      {
        let isVirtual = (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)==true;
        if (prefs.getBoolPref("folderMenu.markAllRead")) // && folder.getNumUnread(false)>0
        {
          menuitem = this.createMenuItem_MarkAllRead(isVirtual, doc);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
        // add mark folder + subfolders as read. [issue 3] - need to check for subfolders being unread status!!
        if (prefs.getBoolPref("folderMenu.markAllReadRecursive")) {
          menuitem = this.createMenuItem_MarkAllRead(isVirtual, doc, true);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }
      }
    }

		if (prefs.getBoolPref("folderMenu.emptyJunk"))
		{
			// EmptyJunk
			if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
				menuitem = this.createMenuItem_EmptyJunk(doc);
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu) {
						topShortCuts++ ;
					}
				}
			}
			else if (!(folder.flags & (util.FolderFlags.MSG_FOLDER_FLAG_TRASH | util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP))
				&& button.id == "QuickFoldersCurrentFolder"
				&& prefs.getBoolPref("folderMenu.emptyJunk")
				) {
				// delete Junk
				menuitem = this.createMenuItem_DeleteJunk(doc);
				if (menuitem) {
					MailCommands.appendChild(menuitem);
					if (isRootMenu) {
						topShortCuts++ ;
					}
				}
			}
		}

		// EditVirtualFolder
		if (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL) {
			let id = "QF_folderPaneContext-virtual";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfEditVirtual"), "searchProperties");
      menuitem.setAttribute("accesskey",this.getUIstring("qfEditVirtualAccess"));
			MailCommands.appendChild(menuitem);
			if (isRootMenu) {
				topShortCuts++;
			}
		}

		// CompactFolder
		if (folder.canCompact) {
			let id = "QF_folderPaneContext-compact";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfCompactFolder"), "qfCompact");
			menuitem.setAttribute("accesskey", this.getUIstring("qfCompactFolderAccess"));

      MailCommands.appendChild(menuitem);
		}

		// ===================================
		if (topShortCuts>0) {
			MailCommands.appendChild(this.createIconicElement("menuseparator","*", doc));
		}

		// NewFolder
		if (folder.canCreateSubfolders) {
			let id = "QF_folderPaneContext-new";
			menuitem = createMailCmdMenuItem(id,this.getUIstring("qfNewFolder"));
			// this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onNewFolder(this,event);");
			// what about the click event bubbling up?
			menuitem.addEventListener("click",
			  function(event) {
					if (!QI.checkIsDuplicateEvent({id:id}))
						QI.onNewFolder(menuitem, event);
				}, false); // menuitem instead of this (represent the calling element)

			menuitem.setAttribute("accesskey",this.getUIstring("qfNewFolderAccess"));
			MailCommands.appendChild(menuitem);
		}

		// DeleteFolder
		try {
			if (folder.deletable) {
				let id = "QF_folderPaneContext-remove";
				menuitem = createMailCmdMenuItem(id, this.getUIstring("qfDeleteFolder"));
				menuitem.setAttribute("accesskey",this.getUIstring("qfDeleteFolderAccess"));
				MailCommands.appendChild(menuitem);
			}
		} catch(e) {;}

		// RenameFolder
		if (folder.canRename) {
			let id = "QF_folderPaneContext-rename";
			menuitem = createMailCmdMenuItem(id, this.getUIstring("qfRenameFolder"));
      menuitem.setAttribute("accesskey",this.getUIstring("qfRenameFolderAccess"));
			MailCommands.appendChild(menuitem);
			MailCommands.appendChild(this.createIconicElement("menuseparator", "*", doc));
		}

		// Repair Folder
		menuitem = createMailCmdMenuItem("quickFoldersFolderRepair", this.getUIstring("qfFolderRepair"), "qfFolderRepair");
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderRepairAccess"));
    MailCommands.appendChild(menuitem);

		// Search Messages
		let srchMenu = util.getMail3PaneWindow().document.getElementById("QF_folderPaneContext-searchMessages");
		let searchLabel = srchMenu ? srchMenu.getAttribute("label") : (this.getUIstring("qfFolderSearchMessages") + "…");
		menuitem = createMailCmdMenuItem("quickFolders-folderSearchMessages", searchLabel, "qfFolderSearch");
		if (srchMenu) {
			let ak = srchMenu.getAttribute("accesskey");
			if (ak) menuitem.setAttribute("accesskey", ak);
		}
		MailCommands.appendChild(menuitem);

		// Folder Properties
		menuitem = createMailCmdMenuItem("QF_folderPaneContext-properties", this.getUIstring("qfFolderProperties"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfFolderPropertiesAccess"));
		MailCommands.appendChild(menuitem);

		// Open in File System
		MailCommands.appendChild(this.createIconicElement("menuseparator", "*", doc));
		menuitem = createMailCmdMenuItem("quickFolders-openFolderLocation", this.getUIstring("qfFolderOpenLocation"));
		MailCommands.appendChild(menuitem);

	} ,

	buildQuickFoldersCommands: function(vars) {
		const { util, prefs, entry, folder, button } = vars,
		      doc = button.ownerDocument;
		/***  QUICKFOLDERS COMMANDS   ***/
			let QFcommandPopup = this.createIconicElement("menupopup", "*", doc);
		QFcommandPopup.className = "QuickFolders-folder-popup";

		// tab colors menu
		// we should clone this!
			let colorMenu = this.createIconicElement("menu", "*", doc);
		colorMenu.setAttribute("tag","qfTabColorMenu");
		colorMenu.setAttribute("label", this.getUIstring("qfMenuTabColorPopup"));
		colorMenu.className = 'QuickFolders-folder-popup';
		colorMenu.setAttribute("class","menu-iconic");

		util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

		if (entry) {
			// SelectColor
			if (folder) {
				util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "…");
			}
			let menuColorPopup = this.buildPaletteMenu(entry.tabColor ? entry.tabColor : 0);
			colorMenu.appendChild(menuColorPopup);
		}
		this.initElementPaletteClass(QFcommandPopup, button);

		if (!entry)
			return null;

		// append color menu to QFcommandPopup
		QFcommandPopup.appendChild(colorMenu);

		// SelectCategory
    let menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
		menuitem.setAttribute("tag","qfCategory");
		menuitem.setAttribute("label",this.getUIstring("qfSetCategory"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfSetCategoryA"));

		QFcommandPopup.appendChild(menuitem);

		if (entry.category) {
			// RemoveFromCategory
      menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
			menuitem.setAttribute("tag","qfRemoveCategory");
			menuitem.setAttribute("label",this.getUIstring("qfRemoveCategory"));

      QFcommandPopup.appendChild(menuitem);
		}

		// DeleteQuickFolder
    menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
		menuitem.setAttribute("tag","qfRemove");

		menuitem.setAttribute("label",this.getUIstring("qfRemoveBookmark"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfRemoveBookmarkAccess"));
		QFcommandPopup.appendChild(menuitem);

		// RenameQuickFolder
    menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
		menuitem.setAttribute("tag","qfRename");
		menuitem.setAttribute("label",this.getUIstring("qfRenameBookmark"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfRenameBookmarkAccess"));
    QFcommandPopup.appendChild(menuitem);

		if (prefs.getBoolPref("commandMenu.lineBreak")) {
			let tag = entry.breakBefore ? "qfBreakDel" : "qfBreak";
			menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
			menuitem.setAttribute("tag", tag);
			let brString = entry.breakBefore ? this.getUIstring("qfRemoveLineBreak") : this.getUIstring("qfInsertLineBreak");
			menuitem.setAttribute("label", brString);
      QFcommandPopup.appendChild(menuitem);
		}

		if (prefs.getBoolPref("commandMenu.separator")) {
			let tag = entry.separatorBefore ? "qfSeparatorDel" : "qfSeparator";
			menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
			menuitem.setAttribute("tag", tag);
			let lbString = entry.separatorBefore ? this.getUIstring("qfRemoveSeparator") : this.getUIstring("qfInsertSeparator");
			menuitem.setAttribute("label", lbString);
      QFcommandPopup.appendChild(menuitem);
		}

		let menuItemToClone;

      QFcommandPopup.appendChild(this.createIconicElement("menuseparator", "*", doc));

		// moved icon stuff down to bottom
		if (prefs.getBoolPref("commandMenu.icon")) {
      menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
			menuitem.setAttribute("tag", "qfIconAdd");
			menuitem.setAttribute("label",this.getUIstring("qfSelectIcon"));
      QFcommandPopup.appendChild(menuitem);

			if (entry.icon || QuickFolders.FolderTree.hasFolderCustomIcon(folder)) {
				menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
				menuitem.setAttribute("tag", "qfIconRemove");
				menuitem.setAttribute("label",this.getUIstring("qfRemoveIcon"));
	
				QFcommandPopup.appendChild(menuitem);
			}
		}

    menuitem = this.createIconicElement("menuitem", "cmd menuitem-iconic", doc);
		menuitem.setAttribute("tag", "qfTabAdvanced");
		menuitem.setAttribute("type", "checkbox"); // some themes need this to display a checkmark
		menuitem.setAttribute("label",this.getUIstring("qfTabAdvancedOptions"));
		menuitem.type = "checkbox";
		if (entry.flags || entry.toAddress || entry.fromIdentity) {
			menuitem.setAttribute("checked", "true");
		}
		else {
			menuitem.setAttribute("checked", "false");
		}

		// we want the coordinates, therefore using click event:
    QFcommandPopup.appendChild(menuitem);

		// Options, Support and Help
		if (prefs.getBoolPref("commandMenu.options")
			 ||
			 prefs.getBoolPref("commandMenu.support")
			 ||
			 prefs.getBoolPref("commandMenu.help")
			 ) {
			// --------------------
			QFcommandPopup.appendChild(document.createXULElement ? document.createXULElement("menuseparator") : document.createElement("menuseparator"));
		}

		if (prefs.getBoolPref("commandMenu.options")) {
			// Options
			menuItemToClone= document.getElementById("QuickFolders-ToolbarPopup-options");
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

		// Support
		if (prefs.getBoolPref("commandMenu.support")) {
			menuItemToClone = document.getElementById("QuickFolders-ToolbarPopup-support");
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

		// Help
		if (prefs.getBoolPref("commandMenu.help")) {
			menuItemToClone= document.getElementById("QuickFolders-ToolbarPopup-help");
			if (menuItemToClone) {
				menuitem = menuItemToClone.cloneNode(true);
				QFcommandPopup.appendChild(menuitem);
			}
		}

    let QuickFolderCmdMenu = this.createIconicElement("menu", "cmd menu-iconic", doc);
		QuickFolderCmdMenu.setAttribute("id","quickFoldersCommands");
		QuickFolderCmdMenu.setAttribute("label",this.getUIstring("qfCommandPopup"));
		QuickFolderCmdMenu.setAttribute("accesskey",this.getUIstring("qfCommandAccess"));
		QuickFolderCmdMenu.className="cmd menu-iconic";
		QuickFolderCmdMenu.appendChild(QFcommandPopup);
		// [Bug 26571] Add Option to hide QF command submenu
		if (prefs.getBoolPref("commandMenu.CTRL")) {
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
		if (prefs.isDebugOption("popupmenus")) debugger;
		if (evt.target) {
			let isHandled = false,
			    isTagHandler = true,
					isIdHandler = true,
			    menuitem = element,
			    cmd = evt.target.getAttribute("oncommand"),
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
					case "openNewTab": // precedence over id (the menuitem may have no id)
						QI.openFolderInNewTab(folder);
					  break;
					case "qfCategory":
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
						QI.onSelectIcon(menuitem, evt);
					  break;
					case "qfIconRemove":
						QI.onRemoveIcon(menuitem, evt);
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
					case "QF_folderPaneContext-openNewTab":
						QI.openFolderInNewTab(folder);
						break;
					case "QF_folderPaneContext-getMessages":
						QI.onGetMessages(menuitem);
						break;
					case "QF_folderPaneContext-emptyTrash":
						QI.onEmptyTrash(menuitem);
					  break;
					case "QF_folderPaneContext-markMailFolderAllRead":
					  QI.onMarkAllRead(menuitem, evt);
					  break;
					case "QF_folderPaneContext-markMailFolderAllReadRecursive":
					  QI.onMarkAllRead(menuitem, evt, true);
					  break;
					case "deleteJunk":
						QI.onDeleteJunk(menuitem);
						break;
			    case "QF_folderPaneContext-emptyJunk": // [Bug 26590]
						QI.onEmptyJunk(menuitem);
					  break;
					case "QF_folderPaneContext-new":
					  QI.onNewFolder(menuitem, evt);
					  break;
					case "QF_folderPaneContext-remove":
					  QI.onDeleteFolder(menuitem);
					  break;
					case "QF_folderPaneContext-rename":
					  QI.onRenameFolder(menuitem);
					  break;
					case "quickFoldersFolderRepair":
						QI.onRepairFolder(menuitem);
						break;
					case "QF_folderPaneContext-properties":
						QI.onFolderProperties(menuitem);
					  break;
					case "QF_folderPaneContext-searchMessages":
						QI.onSearchMessages(menuitem);
					  break;
					case "QF_folderPaneContext-virtual":
						QI.onEditVirtualFolder(menuitem);
					  break;
					case "QF_folderPaneContext-compact":
						QI.onCompactFolder(menuitem,"compactFolder");
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
			id: "",
			tag: "",
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
  
  // Implementation of standard License
  createMenuItem_disabled: function() {
    const util = QuickFolders.Util,
          menuitem = QuickFolders.Interface.createMenuItem("", util.getBundleString("license_restriced.unpaid"));
    let txt =
      util.hasValidLicense() ?
        util.getBundleString("license_restriced.standard.maxtabs",[QuickFolders.Model.MAX_STANDARD_TABS]) :
        util.getBundleString("license_restriced.unpaid.maxtabs",[QuickFolders.Model.MAX_UNPAID_TABS])
    
    menuitem.addEventListener("command",
      function(event) {
        QuickFolders.Interface.viewSplash(txt);
        // Services.prompt.alert(null, "QuickFolders", txt);
      } , true);    
    return menuitem;
  } ,

	// noCommands suppress all command menu items + submenus
	addPopupSet: function (popupSetInfo) {
    let folder = popupSetInfo.folder,
        popupId = popupSetInfo.popupId,
        entry = popupSetInfo.entry,
        offset = popupSetInfo.offset || 0,
        button = popupSetInfo.button,
        noCommands = popupSetInfo.noCommands,
        evt = popupSetInfo.event || null; // new for [Bug 26703]
    let isDisabled = button ? (button.getAttribute("disabled") || false) : false;
		let isUnifiedFolder = false;

		const prefs = QuickFolders.Preferences,
		      Ci = Components.interfaces,
          util = QuickFolders.Util,
					showCommandsSubmenus = !(noCommands),
					QI = QuickFolders.Interface,
					doc = button.ownerDocument || document;
          
    const isProfiling = prefs.isDebugOption("popupmenus");
    if (isProfiling) { QuickFolders.Util.stopWatch("reset","addPopupSet"); } 
          
		let xp = doc.getElementById(popupId);
    if (!entry && folder)
      entry = QuickFolders.Model.getFolderEntry(folder.URI);


    if (xp && xp.parentNode)  {
      this.tearDownMenu(xp);
		}

		// else { ...see below...  }
    let menupopup = doc.createXULElement("menupopup"),
        menuitem;

    menupopup.setAttribute("id", popupId);
    menupopup.setAttribute("position", "after_start"); //
    // [Bug 26575] (safety?) - seems to be only triggered on non folder commands
    // this.setEventAttribute(menupopup, "onclick","QuickFolders.Interface.clickHandler(event,this);");
    this.setEventAttribute(menupopup, "oncommand","QuickFolders.Interface.clickHandler(event,this);");
    menupopup.className = "QuickFolders-folder-popup";
    menupopup.folder = folder;
    let MailCommands,
        isRootMenu=false,
        fi = null,
        isHideMailCommands = evt ? (!evt.ctrlKey && prefs.getBoolPref("folderMenu.CTRL")) : false;
    

    if (folder) {
      fi = folder.QueryInterface(Ci.nsIMsgFolder);
      util.logDebugOptional("popupmenus",`Creating Popup Set for ${fi.prettyName}\nId: ${popupId}\nuri: ${fi.URI}\nflags: ${fi.flags}`);

      /* In certain cases, let's append mail folder commands to the root menu */
      if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) {
        // newsgroups have no subfolders anyway
        MailCommands = menupopup;
        isRootMenu = true;
      }
      else {
        MailCommands = this.createIconicElement("menupopup", "QuickFolders-folder-popup", doc);
        // removed mailCmd menu-iconic from class [Bug 26575]
        isRootMenu = false;
      }
      
      if (isDisabled) {
        menupopup.appendChild(this.createMenuItem_disabled());
      }

			if (!fi.hasSubFolders
				  &&
					(fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_VIRTUAL)
					&&
					util.isFolderUnified(fi)) {
				let specialName = fi.URI.substr(fi.URI.lastIndexOf("/")+1); // Inbox, Draft etc.
				if (util.folderFlagFromName(specialName)) {
					isUnifiedFolder = true;
				}
			}
      
    }

    if (isProfiling) { console.log(`Creating child folders submenu for ${popupId} took:\n` + QuickFolders.Util.stopWatch("stop","addPopupSet")); } 
    
    // between 1-5ms
    if (showCommandsSubmenus) {
      // [Bug 26703] Add option to hide mail commands popup menu
      if (folder && !isUnifiedFolder) {
        /***  MAIL FOLDER COMMANDS	 ***/
        // 0. BUILD MAIL FOLDER COMMANDS
        this.appendMailFolderCommands(MailCommands, fi, isRootMenu, button, menupopup);

        // special folder commands: at top, as these are used most frequently!
        // 1. TOP LEVEL SPECIAL COMMANDS
        let topShortCuts = 0;
        if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH) {
          menuitem = this.createMenuItem_EmptyTrash(doc);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (fi.flags & util.FolderFlags.MSG_FOLDER_FLAG_JUNK) {
          menuitem = this.createMenuItem_EmptyJunk(doc);
          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (prefs.getBoolPref("folderMenu.openNewTab")) {
          let newTabMenuItem = doc.getElementById("QF_folderPaneContext-openNewTab");
          // folder listener sometimes throws here?
          let label = newTabMenuItem && newTabMenuItem.label ? newTabMenuItem.label.toString() : "Open in New Tab";
          let menuitem = this.createMenuItem("", label, doc);
          // oncommand="gFolderTreeController.newFolder();"
          menuitem.className = "cmd menuitem-iconic";
          menuitem.setAttribute("tag", "openNewTab");
          menuitem.addEventListener("command",
            function(event) {
              if (!QI.checkIsDuplicateEvent({tag:"openNewTab", id:"QF_folderPaneContext-openNewTab"}))
                QI.openFolderInNewTab(fi);
            } , true);
          // this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.openFolderInNewTab();");

          menupopup.appendChild(menuitem);
          topShortCuts ++ ;
        }

        if (topShortCuts>0 && fi.hasSubFolders) // separator only if necessary
          menupopup.appendChild(this.createIconicElement("menuseparator", "*", doc));
      }

      // 2. QUICKFOLDERS COMMANDS
      if (button.id != "QuickFoldersCurrentFolder" && showCommandsSubmenus) {
        let qfCmdsMenu = this.buildQuickFoldersCommands( {util, prefs, entry, folder, button} );
        if (qfCmdsMenu) menupopup.appendChild(qfCmdsMenu);
      }

      // 3. APPEND MAIL FOLDER COMMANDS
      if (folder && menupopup != MailCommands && !isHideMailCommands && !isUnifiedFolder) {
        // Append the Mail Folder Context Menu...
        let MailFolderCmdMenu = this.createIconicElement("menu", null, doc);
        MailFolderCmdMenu.setAttribute("id","quickFoldersMailFolderCommands");
        MailFolderCmdMenu.setAttribute("label", this.getUIstring("qfFolderPopup"));
        MailFolderCmdMenu.setAttribute("accesskey", this.getUIstring("qfFolderAccess"));

        MailFolderCmdMenu.appendChild(MailCommands);
        menupopup.appendChild(MailFolderCmdMenu);
      }
    }


    // 3. APPEND SUBFOLDERS
    //moved this out of addSubFoldersPopup for recursive menus
    if (fi && fi.hasSubFolders) {
      util.logDebugOptional("popupmenus","Creating SubFolder Menu for " + folder.name + "…");
      if (showCommandsSubmenus)
        menupopup.appendChild(this.createIconicElement("menuseparator", "*", doc));
      this.debugPopupItems=0;
      if (!isDisabled) {
        this.addSubFoldersPopup(menupopup, folder, false);
			}
      util.logDebugOptional("popupmenus","Created Menu " + folder.name + ": " + this.debugPopupItems + " items.\n-------------------------");
    } else if (isUnifiedFolder) {
			// [issue 370] allow access to all special folders of this type.
			// unified folder?
			let specialName = fi.URI.substr(fi.URI.lastIndexOf("/")+1);
			let smartRoot = fi.parent.rootFolder.QueryInterface(Ci.nsIMsgLocalMailFolder);

			util.logDebugOptional("popupmenus",`Parent could be a Unified folder: ${specialName}`);
			let folderFlag = util.folderFlagFromName(specialName);
			isUnifiedFolder = !(!(folderFlag));
			if (isUnifiedFolder) {
				let folder = smartRoot.getChildWithURI(
					`${smartRoot.URI}/${specialName}`,
					false,
					true
				);
				if (folder) {
					let FoldersArray=[];
					for (let server of MailServices.accounts.allServers) {
						for (let f of server.rootFolder.getFoldersWithFlags(
							folderFlag
						)) {
							FoldersArray.push(f);
						}
					}
					this.addSubFoldersPopupFromList(FoldersArray, menupopup, false, false, false, doc, isUnifiedFolder);
				}
			}
		}

    if (isProfiling) { console.log(`Appending subfolders took:\n` + QuickFolders.Util.stopWatch("stop","addPopupSet")); } 

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
    if (isProfiling) { 
      let time= QuickFolders.Util.stopWatch("all","addPopupSet");
      let pId = popupId.replace("%20", " ");
      console.log(`%cComplete FUNCTION addPopupSet(${pId}) took: %c${time}%c\n===============`, popupSetInfo,
                  "background: blue; color:yellow;", ""); 
    } 
	} ,

	// append a button with mail folder commands (onclick)
	showCurrentFolderMailContextMenu: function showCurrentFolderMailContextMenu(button) {
		let menupopup = this.createIconicElement("menupopup", "*", button.ownerDocument),
        util = QuickFolders.Util,
				QI = QuickFolders.Interface,
		    folder = util.CurrentFolder;
		menupopup.setAttribute("position","after_start"); //
		menupopup.id = "QuickFolders-CurrentMailFolderCommandsPopup";

		menupopup.className = "QuickFolders-folder-popup";

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
    
    this.setEventAttribute(menupopup, "onclick","QuickFolders.Interface.clickHandler(event,this);");
    this.setEventAttribute(menupopup, "oncommand","QuickFolders.Interface.clickHandler(event,this);");
    
    
		QI.showPopup(button, menupopup.id, null);
	} ,

	createMenuItem_DeleteJunk: function(doc) {
		const QI = QuickFolders.Interface,
		      id = "deleteJunk";
		let menuitem = this.createIconicElement("menuitem", null, doc);
		menuitem.setAttribute("id", id);
		menuitem.setAttribute("label",this.getUIstring("qfDeleteJunk"));
		return menuitem;
	} ,

	createMenuItem_EmptyJunk: function(doc) {
		const QI = QuickFolders.Interface,
		      id = "QF_folderPaneContext-emptyJunk";
	  let menuitem = this.createIconicElement("menuitem", null, doc);
		menuitem.setAttribute("id", id);
		menuitem.setAttribute("label", this.getUIstring("qfEmptyJunk"));
		menuitem.setAttribute("accesskey", this.getUIstring("qfEmptyJunkAccess"));
    return menuitem;
	} ,

	createMenuItem_GetMail: function(folder, doc) {
    let server = "?";
		const id = "QF_folderPaneContext-getMessages"; // uses Thunderbird css
		try {
			// find out the server name
			// let's clone it ?
			let getMailMenuItem = this.createIconicElement("menuitem", "*", doc); // no className
			server = folder.server;
			getMailMenuItem.id = id;
			getMailMenuItem.folder=folder;
			getMailMenuItem.setAttribute("label", this.getUIstring("qfGetMail"));
			getMailMenuItem.setAttribute("accesskey", this.getUIstring("qfGetMailAccess"));

			// use parent folder URI as each starting point
			return getMailMenuItem;
		}
		catch(ex) {
			QuickFolders.Util.logException("Exception in createMenuItem_GetMail (Get Mail Command for Inbox): " + server, ex);
			return null;
		}
	} ,

	createMenuItem_EmptyTrash: function(doc) {
		const QI = QuickFolders.Interface,
		      id = "QF_folderPaneContext-emptyTrash";
		let menuitem = this.createIconicElement("menuitem", null, doc);
		menuitem.setAttribute("id", id);
		menuitem.setAttribute("label",this.getUIstring("qfEmptyTrash"));
		menuitem.setAttribute("accesskey",this.getUIstring("qfEmptyTrashAccess"));
		return menuitem;
	} ,

	createMenuItem_MarkAllRead: function(disabled, doc, recursive = false) {
		const id = recursive ? "QF_folderPaneContext-markMailFolderAllReadRecursive" : "QF_folderPaneContext-markMailFolderAllRead";
    let menuitem = this.createIconicElement("menuitem", null, doc);
		menuitem.setAttribute("id", id);
		menuitem.setAttribute("label",
      recursive ?
        this.getUIstring("qfMarkAllReadRecursive") :
        this.getUIstring("qfMarkAllRead")
    );
    if (!recursive)
      menuitem.setAttribute("accesskey",this.getUIstring("qfMarkAllReadAccess"));
		if (disabled)
			menuitem.setAttribute("disabled", true);
		return menuitem;
	} ,

	// create menu items / elements and force inject XUL to deal with menu problems.
	// @cl: [class] use wildcard * for omitting classname (the exception)
	createIconicElement: function(tagName, cl, doc) {
		if (!doc) {
			doc = document; // allow overwriting for 3pane!
		}
		let el = doc.createXULElement(tagName);
		el.setAttribute("xmlns", "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
		if (cl != "*") {
			if (!cl)
				cl = "mailCmd menuitem-iconic"; // default
			el.className = cl;
		}
		return el;
	} ,

	addSubMenuEventListener: function addSubMenuEventListener(subMenu, url) {
		// url is specific to this function context so it should be snapshotted from here
		subMenu.addEventListener("click",
			function(evt) {
				QuickFolders.Interface.onSelectParentFolder(url, evt);
			}, false);
	} ,

	addDragToNewFolderItem: function(popupMenu, folder) {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					Ci = Components.interfaces;
		try {
      if (typeof folder.server === "undefined") return;

			util.logDebugOptional("dragToNew","addDragToNewFolderItem	" + folder.prettyName
				+ "\ncanCreateSubfolders = " + folder.canCreateSubfolders
				+ "\nserver.type = " + folder.server.type);
			if (!folder.canCreateSubfolders) return;
			let server=folder.server.QueryInterface(Ci.nsIMsgIncomingServer);// check server.type!!
			switch(server.type) {
				case "pop3":
					if (!prefs.getBoolPref("dragToCreateFolder.pop3"))
						return;
					break;
				case "imap":
					if (!prefs.getBoolPref("dragToCreateFolder.imap"))
						return;
					break;
				case "none": // allow all local folders!
					if (!prefs.getBoolPref("dragToCreateFolder.local"))
						return;
					break;
				default:
					if (!prefs.getBoolPref("dragToCreateFolder." + server.type)) {
						util.logDebugOptional("dragToNew","Not enabled: drag & create new folder for server's of type: " + server.type);
						return;
					}
			}

			// [issue 420] create "new subfolder" item from scratch...
			// New Folder... submenu items
			let doc = QuickFolders.Util.document3pane; 
			let folderPaneContext = doc.getElementById("folderPaneContext");
			if (folderPaneContext) {
				let targetDocument = popupMenu.ownerDocument;
				let newMenuItem = folderPaneContext.querySelector("#folderPaneContext-new");
				if (newMenuItem) {
					let createFolderMenuItem =  this.createIconicElement("menuitem","*", targetDocument); // newMenuItem.cloneNode(true);
					createFolderMenuItem.setAttribute("label", newMenuItem.getAttribute("label"));
					createFolderMenuItem.setAttribute("accesskey", newMenuItem.getAttribute("accesskey"));
					if (folder.hasSubFolders) {
						let sep = this.createIconicElement("menuseparator","*", targetDocument);
						popupMenu.appendChild(sep);
					}
					createFolderMenuItem.id=""; // delete existing menu
					createFolderMenuItem.id="QF_folderPaneContext-new"; // for styling!
					createFolderMenuItem.folder=folder;
          
					createFolderMenuItem.setAttribute("class","menuitem-iconic");

					// use parent folder URI as each starting point
					this.setEventAttribute(createFolderMenuItem, "ondragenter","QuickFolders.popupDragObserver.dragEnter(event);");
					this.setEventAttribute(createFolderMenuItem, "ondrop","QuickFolders.popupDragObserver.drop(event);");  // only case where we use the dedicated observer of the popup!

					// [Bug 26425] option to put 'create new subfolder' on top
					if (prefs.getBoolPref("dragToCreateFolder.menutop")) {
						popupMenu.insertBefore(createFolderMenuItem, popupMenu.firstChild);
					} else {
						popupMenu.appendChild(createFolderMenuItem);
					}
				}
			}

		}
		catch(ex) {util.logException("Exception in addDragToNewFolderItem (adding drag Menu items): ", ex); }
	} ,

  // show a reusable label representing a folder path (for quickMove, quickJump and recent folders).
  // 0 - just folder.prettyName
  // 1 - folder.prettyName - Account  (default)
  // 2 - account - folder path
  // 3 - folder path
  // 4 - folder.URI  [for debugging]
  folderPathLabel : function folderPathLabel(detailType, folder, maxPathItems, isUnified = false) {
    function folderPath(folder, maxAtoms, includeServer) {
      let pathComponents = "",
          chevron = " " + "\u00BB".toString() + " ";
      while (folder && maxAtoms) {
        if (folder.isServer && !includeServer)
          return pathComponents;
        pathComponents = folder.prettyName
                       + (pathComponents ? chevron  : "")
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
        return isUnified ? folder.server.prettyName : folder.name;
      case 1: // folder name - account name
        hostString = folder.rootFolder.name;
        return folder.name + " - " + hostString;
      case 2: // account name - folder path (max[n])
        hostString = folder.rootFolder.name;
        let f = folder.URI.indexOf("://"),
            fullPath = f ? folder.URI.substr(f+3) : folder.URI;
        return hostString + " - " + folderPath(folder,  maxPathItems, false);
      case 3:
        return folderPath(folder, maxPathItems, false);
      case 4: // for debugging
        return folder.URI;
    }
  } ,

	// isDrag: if this is set to true, then the command items are not included
	addSubFoldersPopupFromList: function (subfolders, popupMenu, isDrag, forceAlphaSort, isRecentFolderList, doc, isUnifiedFolder=false) {
		if (!doc) { 
			doc = popupMenu ? (popupMenu.ownerDocument || document ) : document;
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
		    };
		let subfolder,
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
    const isTreeIcons = prefs.getBoolPref('folderTree.icons');
    let isDisableSubfolders = (isRecentFolderList && !prefs.getBoolPref("recentfolders.subfolders"));

		util.logDebugOptional("popupmenus.subfolders", "addSubFoldersPopupFromList(..)");
    const isProfiling = false; //  prefs.isDebugOption("folderTree.icons");
    if (isProfiling) { QuickFolders.Util.stopWatch("reset","addSubFoldersPopupFromList"); } 
    for (subfolder of subfolders) {
			try {
				this.debugPopupItems++;
				let menuitem = this.createIconicElement("menuitem", "*", doc),
				    menuLabel,
				    maxDetail = 4;
				if (displayFolderPathDetail > maxDetail)
					displayFolderPathDetail = maxDetail;
        
        if (isProfiling) { QuickFolders.Util.stopWatch("start","addSubFoldersPopupFromList"); }

				menuLabel = this.folderPathLabel(displayFolderPathDetail, subfolder, maxPathItems, isUnifiedFolder);

				if (isRecentFolderList && prefs.getBoolPref("recentfolders.showTimeStamp"))  {
					menuLabel = util.getMruTime(subfolder) + " - " + menuLabel;
				}

				menuitem.setAttribute("label", menuLabel); //+ subfolder.URI
				menuitem.setAttribute("tag","sub");
        
        if (isTreeIcons) {
          try {
            let iconURL = subfolder.parent && (subfolder.parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
              ? "url('chrome://quickfolders/content/skin/ico/folder-trash-gnome-qf.png')"
              : ((typeof subfolder.getStringProperty != "undefined") ? subfolder.getStringProperty("iconURL") : null);
            if (iconURL) {
              menuitem.style.setProperty("list-style-image", iconURL, "");
            }
          }
          catch(ex) {
            if ((ex.result!=0x80550007) &&  prefs.isDebug) { // nsIMsgFolder.getStringProperty
              util.logException("Error in addSubFoldersPopupFromList", ex);
            }
          }
          if (isProfiling) {  
            let time = QuickFolders.Util.stopWatch("stop","addSubFoldersPopupFromList");
            console.log(`Setting icon took: ${time} ms`);
          }
        }
        
				let numUnread = subfolder.getNumUnread(false),
				    numUnreadInSubFolders = subfolder.getNumUnread(true) - numUnread,
				    sCount = " (" + ((numUnread>0) ? numUnread : "") ;
				if (numUnread + numUnreadInSubFolders == 0) {
					sCount = "";
        }

				const triangleDown = "\u25be".toString();

				if (numUnreadInSubFolders+numUnread>0) {
					if(numUnreadInSubFolders > 0 && prefs.isShowCountInSubFolders)
						sCount += triangleDown + numUnreadInSubFolders+"";
					sCount += ")";
					if (!prefs.isShowCountInSubFolders && numUnread == 0)
						sCount="";

					menuitem.setAttribute("class","hasUnread menuitem-iconic");
					if (subfolder.hasNewMessages && prefs.isHighlightNewMail)
						menuitem.setAttribute("biffState-NewMail","true");
					menuitem.setAttribute("label", menuLabel + sCount);
				}
				else {
					menuitem.setAttribute("class","menuitem-iconic");
        }
				if (isRecentFolderList || !(subfolder.hasSubFolders && prefs.isShowRecursiveFolders)) { //  [issue 254] allow enter on parent folder nodes.
					let eventType = prefs.getStringPref("debug.popupmenus.folderEventType"); // "onclick" or "oncommand" - default is onclick
          if (eventType) {
            // [Bug 26575]
            util.logDebugOptional("popupmenus.items","add " + eventType + " event attribute for menuitem " + menuitem.getAttribute("label") + " onSelectSubFolder(" + subfolder.URI+ ")");
            if (isDrag && isRecentFolderList) {
              let parentString = "";
              this.setEventAttribute(menuitem, eventType,`QuickFolders.quickMove.execute("${subfolder.URI}","${parentString}");event.preventDefault();`); // [issue 242] allow moving with recent folder [=] shorcut
            }
            else {
              this.setEventAttribute(menuitem, eventType,`QuickFolders.Interface.onSelectSubFolder('${subfolder.URI}',event)`);
            }
          }
					if (isRecentFolderList) {
						util.logDebugOptional("popupmenus", "Added " + eventType + " event to " + menuLabel + " for " + subfolder.URI );
          }
				}

				menuitem.folder = subfolder;
				// this.setEventAttribute(menuitem, "dragenter","event.preventDefault();"); 
        // fix layout issues... [issue 88]
        menuitem.addEventListener("dragenter", function(e) { 
          e.preventDefault(); 
        })
				this.setEventAttribute(menuitem, "ondragover","QuickFolders.popupDragObserver.dragOver(event)"); // okay
				this.setEventAttribute(menuitem, "ondrop","QuickFolders.buttonDragObserver.drop(event);"); // use same as buttondragobserver for mail drop!
				this.setEventAttribute(menuitem, "ondragleave","QuickFolders.popupDragObserver.dragLeave(event);");

				if (forceAlphaSort) {
					// alpha sorting by starting from end of menu up to separator!
					let c = popupMenu.children.length-1, //count of last menu item
					    added = false,
					    sNewName = killDiacritics(subfolder.name);
					// >=1 exclude first item (name of container folder) - fixes [Bug 22901] - maybe insert separator as well
					// >=0 undo this change - fixes [Bug 21317]
					for (;c>=0 && popupMenu.children[c].hasAttribute("label");c--) {
						if (sNewName > killDiacritics(popupMenu.children[c].getAttribute("label")))
						{
							if (c+1 == popupMenu.children.length) {
								popupMenu.appendChild(menuitem);
							} else {
								popupMenu.insertBefore(menuitem,popupMenu.children[c+1]);
							}
							added=true;
							break;
						}
					}
					if (!added) { // nothing with a label was found? then this must be the first folder item in the menu
						if (c+1 >= popupMenu.children.length) {
							popupMenu.appendChild(menuitem);
						} else {
							popupMenu.insertBefore(menuitem,popupMenu.children[c+1]);
						}
					}
				} // end alphanumeric sorting
				else {
					popupMenu.appendChild(menuitem);
				}

				if (!isDisableSubfolders && subfolder.hasSubFolders && prefs.isShowRecursiveFolders) {
					this.debugPopupItems++;
					let subMenu = this.createIconicElement("menu", "*", doc);
					subMenu.setAttribute("label", menuLabel + sCount);
					subMenu.className = "QuickFolders-folder-popup menu-iconic" + ((numUnreadInSubFolders+numUnread>0) ? " hasUnread" : "");

					// workaround for Phoenity - add the drop handler for buttons here
					// this.setEventAttribute(subMenu, "ondrop", "nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");

					if (subfolder.hasNewMessages)
						subMenu.setAttribute("biffState-NewMail","true");

					subMenu.folder = subfolder;
					try {
						// [Bug 26157] is folder deleted? use different icon!
						let iconURL = subfolder.parent && (subfolder.parent.flags & util.FolderFlags.MSG_FOLDER_FLAG_TRASH)
						  ? "url('chrome://quickfolders/content/skin/ico/folder-trash-gnome-qf.png')"
						  :  ((typeof subfolder.getStringProperty != "undefined")? subfolder.getStringProperty("iconURL") : null);
						if (iconURL) {
							subMenu.style.setProperty("list-style-image", iconURL, "");
						}
					}
					catch(ex) {;}

					this.setEventAttribute(subMenu, "ondragenter","QuickFolders.popupDragObserver.dragEnter(event);");
					this.setEventAttribute(subMenu, "ondrop","QuickFolders.buttonDragObserver.drop(event);"); // use same as buttondragobserver for mail drop!
					this.setEventAttribute(subMenu, "ondragleave","QuickFolders.popupDragObserver.dragLeave(event);");

					// 11/08/2010 - had forgotten the possibility of _opening_ the folder popup node's folder!! :)
					//subMenu.allowEvents=true;
					// oncommand did not work
					util.logDebugOptional("popupmenus.items","add click listener for subMenu " + subMenu.getAttribute("label") + " onSelectParentFolder(" + subfolder.URI+ ")");
					this.addSubMenuEventListener(subMenu, subfolder.URI); // create a new context for copying URI

					let subPopup = this.createIconicElement("menupopup", "*", doc);
					subMenu.appendChild(subPopup);

					popupMenu.insertBefore(subMenu,menuitem)
					subPopup.appendChild(menuitem); // move parent menu entry

					this.addSubFoldersPopup(subPopup, subfolder, isDrag, isRecentFolderList); // populate the sub menu

					subPopup.removeChild(menuitem);
				}
			}
			catch(ex) {
        util.logException("Exception in addSubFoldersPopupFromList: ", ex);
        done = true;
      }
		}
    if (isProfiling) {  
      let time = QuickFolders.Util.stopWatch("all","addSubFoldersPopupFromList");
      console.log(`Setting icons in addSubFoldersPopupFromList altogether took: ${time}`);
    }
	} ,

	// add all subfolders (1st level, non recursive) of folder to popupMenu
	addSubFoldersPopup: function addSubFoldersPopup(popupMenu, folder, isDrag, isRecentFolderList = false) {
		const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		util.logDebugOptional("popupmenus.subfolders", "addSubFoldersPopup(" + folder.prettyName + ", drag=" + isDrag + ")" );
		let isDragNew = isDrag && prefs.getBoolPref("folderMenu.dragToNew");

		if (folder.hasSubFolders) {
      let isProfiling = QuickFolders.Preferences.isDebugOption("performance");
      if (isProfiling ) {
        util.stopWatch("start","addSubFoldersPopup");
      }
      
      
			util.logDebugOptional("popupmenus.subfolders", "Adding folders…");
			let subfolders = folder.subFolders;
			let isAlphaSorted = prefs.isSortSubfolderMenus;
			this.addSubFoldersPopupFromList(subfolders, popupMenu, isDrag, isAlphaSorted, isRecentFolderList);
      if (isProfiling) {
        let time = util.stopWatch("all","addSubFoldersPopup");
        let fName = folder ? (folder.prettyName || "[missing folder name]") : "[missing folder]";
        console.log(`%caddSubFoldersPopup(${fName}) - Creating addSubFoldersPopupFromList() took: ${time}`, "background-color: rgb(0,160,40); color:white;");
      }
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
								 + "\nlabel=" + p.getAttribute("label")
								 + "\nparent tag=" + p.parentNode.tagName);
		switch(Target.tagName) {
			case "menuitem": // dropped mails to a menu item
			case "menu": // clicked on a parent folder?
				// close all containing menus
				// hidepopup is broken in linux during OnDrag action!!
				// bug only confirmed on TB 2.0!
				while (null!=p.parentNode && p.tagName!="toolbar") {
					p=p.parentNode;
					util.logDebugOptional ("popupmenus.collapse", "parenttag=" + p.tagName);
					util.logDebugOptional ("popupmenus.collapse", "node= " + p.nodeName);
					if (p.tagName == "menupopup" && p.hidePopup) {
						util.logDebugOptional ("popupmenus.collapse", "Try hide parent Popup " + p.getAttribute("label"));
						p.hidePopup();
					}
				}
				break;

			case "toolbarbutton":
				QuickFolders_globalHidePopupId = "moveTo_" + Target.folder.URI;
				util.logDebugOptional ("popupmenus.collapse", "set QuickFolders_globalHidePopupId to " + QuickFolders_globalHidePopupId);

				let popup = document.getElementById(QuickFolders_globalHidePopupId);
				if (popup) {
					try {
						popup.parentNode.removeChild(popup); //was popup.hidePopup()
						QuickFolders_globalHidePopupId = "";
					}
					catch(e) {
						util.logDebugOptional ("popupmenus.collapse", "Could not remove popup of " + QuickFolders_globalHidePopupId );
					}
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
          tabmail.openTab("mail3PaneTab", {folder: folderUri, messagePaneVisible:true } );
					setTimeout(
						() => {
							QuickFolders_MySelectFolder(folderUri);
						},
						200
					); 
					return;
				}
			}
		}
		catch (ex) { util.logToConsole(ex); };
		let res = QuickFolders_MySelectFolder(folderUri);
    // remember the folder if event comes from QuickFolders-FindFolder-popup-Recent
    if (res && evt) {
      let t = evt.target;
      while (t && t.parentNode && !t.parentNode.tagName.includes("button")) {
        t = t.parentNode;
				if (!t || t.tagName=="toolbar") break;
        if (t.id && t.id=="QuickFolders-FindFolder-popup-Recent") {
          QuickFolders.quickMove.addToHistory( QuickFolders.Model.getMsgFolderFromUri(folderUri));
          t = null;
        }
      }
    }
	} ,

	// on down press reopen QuickFolders-FindPopup menu with ignorekeys="false"
	findFolderKeyPress: function findFolderKeyPress(event) {
    const prefs = QuickFolders.Preferences,
          util = QuickFolders.Util,
          QI = QuickFolders.Interface;

    let menupopup, 
        isShift = (event && event.shiftKey) || false;

    function makeEvent(evtType, evt) {
      let clonedEvent = new KeyboardEvent(evtType, evt); // keydown or keyup (was keypress)
      return clonedEvent;
    }

	  if (event.key) switch (event.key) {
      case "Enter":
			  util.logDebugOptional("interface.findFolder","Enter");
        QI.findFolderName(event.target, true);
        event.preventDefault();
        break;
		  case "ArrowDown":
			case "ArrowUp":
			  util.logDebugOptional("interface.findFolder", (event.key=="ArrowDown") ? "ArrowDown" : "ArrowUp");
				menupopup = document.getElementById("QuickFolders-FindPopup");
				let fC = menupopup.firstChild;
				if (!fC) {
					util.logDebugOptional("interface.findFolder","no popup children, early exit");
				  return; // no children = no results!
		    }
				menupopup.removeAttribute("ignorekeys");
				let palette = document.getElementById("QuickFolders-Palette");
				if (palette) {
					util.logDebugOptional("interface.findFolder","1. show Popup…");
          // remove and add the popup to register ignorekeys removal
          menupopup = palette.appendChild(palette.removeChild(menupopup));
					let searchBox = QI.FindFolderBox;
          menupopup.openPopup(searchBox,"after_start", 0, -1, true, false);
					// menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");

					if (event.preventDefault) event.preventDefault();
					if (event.stopPropagation) event.stopPropagation();

					setTimeout( function() {
						util.logDebugOptional("interface.findFolder","creating Keyboard Events…");
						if (menupopup.dispatchEvent(makeEvent("keydown", event))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keydown event was dispatched.");
						}
						if (menupopup.dispatchEvent(makeEvent("keyup", event))) { // event was not cancelled with preventDefault()
							util.logDebugOptional("interface.findFolder","keyup event was dispatched.");
            }
					});
				} // palette
				break;
			case "Escape":
        event.preventDefault(); // [issue 41] Esc key to cancel quickMove also clears Cmd-Shift-K search box
			  if (isShift || prefs.getBoolPref("quickMove.premium.escapeClearsList") ) // [Bug 26660] SHIFT + ESC resets move list
					QuickFolders.quickMove.resetList();
			  QI.findFolder(false);
			  QI.hideFindPopup();
        QI.updateFindBoxMenus(false);
        QI.toggleMoveModeSearchBox(false);
        // if help is shown, remove it
        QI.quickMoveHelpRemove();
			  break;
		}
	} ,

	hideFindPopup: function hideFindPopup() {
	  let menupopup = document.getElementById("QuickFolders-FindPopup"),
		    state = menupopup.getAttribute("state"),
        util = QuickFolders.Util;
    util.logDebugOptional("interface.findFolder","hideFindPopup - menupopup status = " + state);
		//if (state == "open" || state == "showing")
    try {
			menupopup.hidePopup();
		} catch(ex) { util.logException("hideFindPopup", ex); }
	} ,

  // forceFind - enter key has been pressed, so we want the first match to force a jump
	findFolderName: async function findFolderName(searchBox, forceFind) {
    // make the abbreviated string for the menu item
		function buildParentString(folder, parentCount) {
			let pS = "", // build expanded parent string
					par = folder.parent,
          countParents = parentCount;
      if (parentString) { // build a longer string if we needed to skip parent parts.
        // recalculate the count of parents:
        let parts = parentString.split(/[\/>]/),
            p=parts[parts.length]; // get right-most part
        while (parts.length && par.parent) {
          if (!pS)  {
            pS = par.prettyName;
          }
          else {
            pS = par.prettyName + "/" + pS;
          }  
          if (par.prettyName.toLocaleLowerCase().startsWith(p))
            p=parts.pop();
          par = par.parent;
        }
      }
      else {
        for (let i=countParents; i>0; i--) {
          if (!par || par.isServer) break; // do not add server here
          if (!pS)  {
            pS = par.prettyName;
          }
          else {
            pS = par.prettyName + "/" + pS;
          }
          par = par.parent;
        }
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

    // folder name match algorithm -at the heart of quickMove / quickJump. searchString should be trimmed
		function addMatchingFolder(matches, folder) {
			let folderNameSearched = folder.prettyName.toLocaleLowerCase(),
			    matchPos = folderNameSearched.indexOf(searchFolderName),
          isMatch = false,
          rank = 0,
          enableMultiWordMatch = !QuickFolders.Preferences.getBoolPref("premium.findFolder.disableSpace");  // [issue 179] option to disable multi word matching
          
      // [issue 177] matchPos=0 means partial or full match, no need to split!
      if (enableMultiWordMatch && matchPos < 0 && searchFolderName.includes(" ")) { // multi word matching [issue 155]
        if (checkFolderFlag(folder, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true))
          return;          // add unless already matched:
        let sArray = searchFolderName.split(" "),
            fArray = folderNameSearched.split(/[\-_@+&. ]+/); // use these as possible word boundaries
        while (sArray.length) {
          let search = sArray.shift(),
              foundEl = false;
          if (matches.some( a => (a.uri == folder.URI) )) {
            return;
          }
          for (let i=0; i<fArray.length; i++) {
            if (fArray[i].startsWith(search)) {
              if (search == fArray[i])  // full match
                rank+=7;
              else
                rank+=3; // we could also use the length of the string for ranking? or search.length / fArray[i].length  as a percentage
              fArray[i] = "####"; // blank out matched element
              foundEl = true;
              break;
            }
          }
          if (!foundEl) return;
        }
        
        isMatch = true;
      }
      else {
        // add all child folders if "parentName/" entered
        if (searchFolderName=="" && parentString!="") matchPos = 0;
        if (matchPos >= 0) {
          // only add to matches if not already there
          if (!matches.some( function(a) { return (a.uri == folder.URI); })) {
            rank = 1; // searchString.length - folder.prettyName.length;
            if (searchFolderName.length == folder.prettyName.length) rank += 7;  // full match - promote
            if (matchPos == 0) rank += 3; // promote the rank if folder name starts with this string
            if (searchFolderName.length<=2 && matchPos!=0) { // doesn't start with single/two letters?
              // is it the start of a new word? e.g. searching 'F' should match "x-fred" "x fred" "x.fred" "x,fred"
              if (" .-,_+&@".indexOf(folderNameSearched.substr(matchPos-1,1))<0)
                return;  // skip if not starting with single letter
            }

            // [Bug 26692] skip if they are flagged for ignoring
            if (checkFolderFlag(folder, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true))
              return;
            
            isMatch = true;

          }
        }        
      }
      if (isMatch) {
        let pS = buildParentString(folder, parentCount),
            ct = pS.split("/").length + 1, // count parent folders parts including final name
            maxFindSearch = QuickFolders.Preferences.getIntPref("premium.findFolder.maxPathItems"),
            detail = QuickFolders.Preferences.getIntPref("premium.findFolder.folderPathDetail");
        
        // ct should be max(pLevel) from isParentMatch, and not length of the _complete_ path
        // if (parentCount) maxFindSearch = Math.max(ct, maxFindSearch); 
        
        let fName = QuickFolders.Interface.folderPathLabel(detail, folder, maxFindSearch);

        matches.push( { name:fName, lname:folderNameSearched, uri:folder.URI, rank:rank, type:"folder", folder:folder, parentString: pS } );
      }

		}

		// check if any word in foldername string starts with typed characters
    function wordStartMatch(fName, search) {
      if (QuickFolders.Preferences.getBoolPref("premium.findFolder.disableSpace"))
        return fName.startsWith(search);
      
			// if search string contains a space just match the whole result rather than breaking up the folder into "words"
			if (search.indexOf(" ")>0) {
				// if (fName.indexOf(search)==0) 
        // [issue 135] as this is an in string search, always accept the first result
        return true;
			}
			else {
				let m = fName.split(" ");
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
			    ancestors = search.split(/[\/>]/), // use / for direct children and allow > for skipping folders (test)
					firstParent = null,
          skipParents = searchString.includes(">"); // new syntax for skipping some parents
					
			maxLevel = ancestors.length;
      while (f.parent && maxLevel) {
        maxLevel--;
        f = f.parent;

        // 1st (top level) match
        if (!firstParent) firstParent = f;

        // [issue 135] allow in-string search for parents using delimiters: _ . and space!
        let folderNameMatches = f.prettyName.toLowerCase().split(/[\-_@+&. ]/);
        // [issue 148] splitting prevents full name to be matched!
        if (folderNameMatches.length>1) {
          folderNameMatches.push(f.prettyName.toLowerCase()); // add the full string
        }
        // [issue 199] include folders that are 1 character long!
        let parentHasSpace = ancestors[maxLevel].includes (" ");
        if (folderNameMatches.some(a => 
           { 
            if (a.startsWith(ancestors[maxLevel])) return true;
            if (parentHasSpace) { // [issue 297] Parent folder with space in name not shown
              let m = (ancestors[maxLevel].split(" "));
              if (m.length>folderNameMatches.length) return false;
              for (let mm=0; mm<m.length && mm<folderNameMatches.length; mm++) {
                if (!folderNameMatches[mm].startsWith(m[mm]))
                  return false;
              }
              return true;
            }
            return false;
           }
          )) { 
					if (maxLevel == 0 ) {  // direct parent? Add to collection in case we want to create child (slash) // pLevel==1
						if (!parentList.includes(firstParent))
							parentList.push(firstParent);
						return pLevel;
					}
				}
				else if (skipParents) {
          maxLevel++; // no match, stay on this level (this skips the current folder and goes on at the next parent)
        }
        else return 0; // direct parents only.
				pLevel++;
      }
      return 0;
    }

		function addIfMatch(folder, search, parentList) {
			let ancestors = search.split(/[\/>]/),
			    maxLevel = ancestors.length,
					f = folder,
					directParent = null;
			while (f && maxLevel) {
				maxLevel--;
        // [issue 135] allow in-string search for children using delimiters: - _ . and space!
        let folderNameMatches = f.prettyName.toLowerCase().split(/[\-_@+&. ]/);
        // [issue 148] splitting prevents full name to be matched!
        if (folderNameMatches.length>1) {
          folderNameMatches.push(f.prettyName.toLowerCase()); // add the full string
        }
				if (folderNameMatches.some(a => a.startsWith(search))) {   
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
					CHEVRON = "\u00BB".toString(),
          maxResults = prefs.getIntPref("quickMove.maxResults"),
		      isFiling = QuickFolders.quickMove.isActive;

		let isSelected = false,
				enteredSearch = searchBox.value,
	      searchString = enteredSearch.toLocaleLowerCase().trim(),
        searchFolderName = "",
        parentString = "",  // effective parent string (using resulting prettyName atoms)
				enteredParent = ""; // what's entered
    util.logDebug("findFolder (" + searchString + ")");
		if (!searchString)
			return;
    if (searchString=== "=") { // recent folder token
      // QuickFolders.Interface.onClickRecent(searchBox, null, true); PROTOTYPE
      // we need to focus on the popup menu as well, also hide the search box.
      let isDrag = isFiling; // see isFiling below
      //                                                      (popup, drag, isCreate, isCurrentFolderButton)
      let menupopup = QuickFolders.Interface.createRecentPopup(null, isDrag, false, "QuickFolders-FindFolder-popup-Recent");
      let searchbutton = document.getElementById("QuickFolders-quickMove");
      if (menupopup.childElementCount > 0) {
        searchbutton.appendChild(menupopup);
        QuickFolders.Interface.findFolder(false); // collapse search box
        QuickFolders.Interface.showPopup(searchbutton, menupopup.id, null);  
        searchbutton.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown"}));
        searchbutton.dispatchEvent(new KeyboardEvent("keyup", {key: "ArrowDown"}));
        menupopup.childNodes[0].focus();
      }
      return;
    }

		let account = null,
		    identity = null,
		    matches = [],
				parents = [],
        excludedServers = QuickFolders.quickMove.Settings.excludedIds,
        isLockAccount = QuickFolders.quickMove.Settings.isLockInAccount,
        currentFolder = util.CurrentFolder;

		// change: if only 1 character is given, then the name must start with that character!
		// first, search QuickFolders
		for (let i=0; i<model.selectedFolders.length; i++) {
			let folderEntry = model.selectedFolders[i],
		      folderNameSearched = folderEntry.name.toLocaleLowerCase(),
			    // folderEntry.uri
			    matchPos = folderNameSearched.indexOf(searchString);
			if (matchPos >= 0) {
				let rank = 0; // searchString.length - folderEntry.name.length; // the more characters of the string match, the higher the rank!
				if (searchString.length == folderEntry.name.length) rank += 4;  // full match - promote
				if (matchPos == 0)  rank += 2; // promote the rank if folder name starts with this string
				if (searchString.length<=2 && matchPos!=0) { // doesn't start with single/two letters?
				  // is it the start of a new word? e.g. searching 'F' should match "x-fred" "x fred" "x.fred" "x,fred" ":fred" "(fred" "@fred"
				  if (" .-,_:@([".indexOf(folderNameSearched.substr(matchPos-1,1))<0)
					  continue;  // skip if not starting with single letter
				}
				let fld = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri);
        if (!fld) continue; // invalid tabs lead to search failing
        if (excludedServers.includes(fld.server.key))
          continue;
        if (isLockAccount &&  fld.server && currentFolder.server && fld.server.key!=currentFolder.server.key)
          continue;
				if (checkFolderFlag(fld, util.ADVANCED_FLAGS.IGNORE_QUICKJUMP, true)) // [Bug 26692]
					continue;
				// avoid duplicates
				if (!matches.some( function(a) { return (a.uri == folderEntry.uri); })) {
					matches.push( { name:folderEntry.name, lname:folderNameSearched, uri:folderEntry.uri, rank: rank, type:"quickFolder" } );
				}
			}
		}
		// SLASH command - list child folders !
    let parentPos = Math.max(searchString.lastIndexOf("/"), searchString.lastIndexOf(">")),
		    parentCount = 0;  // number of parent folders in search string
    if (parentPos>0) { // we have a parent folder
      enteredParent = searchString.substr(0, parentPos);
 			parentString = enteredParent;
      searchFolderName = searchString.substr(parentPos+1);
			enteredSearch = enteredSearch.substr(parentPos+1); // original mixed case for subfolder creation; include placeholder for account
			parentCount = parentString.split(/[\/>]/).length + 1; // original entry for parent
    } else {
      searchFolderName = searchString;
    }

    // if quickMove is active we need to suppress matches from newsgroups (as we can't move mail to them)
		// "parent/" no name given, only lists the direct children
		// "parent/X" can it list grandchildren? It does, but shouldn't - test with "Addons/Qu"
    let maxParentLevel = searchFolderName.length ? prefs.getIntPref("premium.findFolder.maxParentLevel") : 1;
		if (parentPos>0) maxParentLevel = 1; // no subfolders when SLASH is entered

		// multiple slashes?
    util.logDebugOptional("interface.findFolder", "Calling allFoldersMatch(" + isFiling + ", isParentMatch(), parent='" + parentString + "', " + maxParentLevel + ",...)");
    util.allFoldersMatch(isFiling, isParentMatch, parentString, maxParentLevel, parents, addMatchingFolder, matches);
    util.logDebugOptional("interface.findFolder", "Got " + matches.length + " matches");

		// no parent matches - Add one for a folder without children.
		if (!matches.length && parentPos>0) {
      for (let folder of util.allFoldersIterator(isFiling, true)) {
        addIfMatch(folder, matches.parentString || parentString, parents);
      }
		}
		util.logDebugOptional("interface.findFolder", "built list: " + matches.length + " matches found. Building menu…");

		// rebuild popup
		let menupopup, txtDebugMenu = "";
		if (true) {
			matches.sort(function (a,b) { 
        if (b.rank - a.rank == 0) 
          return b.lname - a.lname; // Alphabetic
        return b.rank - a.rank; 
      });

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
				let count = Math.min(matches.length, maxResults);
				for (let j=0; j<count; j++) {
					let menuitem = this.createIconicElement("menuitem", "*", searchBox.ownerDocument);
					// menuitem.className="color menuitem-iconic";
					menuitem.setAttribute("label", matches[j].name);
					menuitem.setAttribute("value", matches[j].uri);
					if (matches[j].type == "quickFolder")
						menuitem.className = "quickFolder menuitem-iconic";
          else
            menuitem.className = "menuitem-iconic";
					if (matches[j].parentString)
						menuitem.setAttribute("parentString", matches[j].parentString);
					menupopup.appendChild(menuitem);
				}
			}
		}
		util.logDebugOptional("interface.findFolder", "built menu.");

		// special commands: if slash was entered, allow creating subfolders.
		if (parentPos>0) {
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
				// if (matchPos == 0 && prefs.isDebugOption("quickMove")) debugger;
				if (matchPos == 0
				   &&
				   !parents.some(p => (p.uri == folderEntry.uri))) {  
					let nsIfolder = model.getMsgFolderFromUri(folderEntry.uri, false); // determine the real folder name
					// this folder does not exist (under its real name) - add it!
					nsIfolder.setStringProperty("isQuickFolder", true); // add this flag
					parents.push(nsIfolder);
				}
			}

			let isInsertNewFolderTop = prefs.getBoolPref("quickMove.createFolderOnTop");
			if (parents.length) {
				util.logDebugOptional("interface.findFolder", "/ create subfolder entries ");
      }

			// create new subfolder case - let's omit for ">" case for now
      if (!searchString.includes(">")) while (parents.length) {
				let f = parents.pop();

        // [Bug 26565] if (1) fully matching name entered do not offer creating a folder. Case Sensitive!
				if (util.doesMailUriExist(f.URI + "/" + enteredSearch.replace(">","/"))) continue; 
        // [Bug 26565] if (1) fully matching name entered do not offer creating a folder. Case Sensitive!
				if (matches.length &&
					  matches[0].uri.toLocaleLowerCase() == (f.URI + "/" + enteredSearch.replace(">","/")).toLocaleLowerCase()) {
          continue; 
        }
            
				let menuitem = this.createIconicElement("menuitem", "*", searchBox.ownerDocument),
				    label = this.getUIstring("qfNewSubFolder");

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
						parFld = atom.prettyName + " " + CHEVRON + " " + parFld; // prepend ancestor
					  parentString = atom.prettyName + "/" + parentString;
					}
					pc--;
				}
				let theLabel = label.replace("{0}", f.rootFolder.name + ": " + parFld).replace("{1}", enteredSearch);
				menuitem.setAttribute("label", theLabel);
				if (prefs.isDebugOption("quickMove"))
					txtDebugMenu = txtDebugMenu + "menuItem: " + theLabel.padEnd(20, " ") + " - parentString:" + parentString + "\n";

				menuitem.setAttribute("parentString", parentString); // remember parent string in menu item (easiest)
				menuitem.addEventListener("command", function(event) {
						QuickFolders.Interface.onCreateInstantFolder(f, enteredSearch);
						return false;
					}, false
				);
				menuitem.className = "menuitem-iconic deferred"; // use "deferred" to avoid selectFound handler
        try {
          if (f.getStringProperty("isQuickFolder")) {
            f.setStringProperty("isQuickFolder", ""); // remove this temporary property
            menuitem.classList.add("quickFolder");
          }
        }
        catch(ex) {;}

				if (menupopup.firstChild && isInsertNewFolderTop)
					menupopup.insertBefore(menuitem, menupopup.firstChild);
				else
					menupopup.appendChild(menuitem);
			}

			if (!menupopup.childElementCount) {
				let menuitem = this.createIconicElement("menuitem", "*", searchBox.ownerDocument),
            noMatchWrn = util.getBundleString("qfNoFolderMatch");
				menuitem.setAttribute("label", noMatchWrn); // just one dummy to show we were searching
				menuitem.setAttribute("tag", "dummy");
				menupopup.appendChild(menuitem);
			}
		}

		if (txtDebugMenu) {
			util.logDebugOptional("quickMove", txtDebugMenu);
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

		menupopup.setAttribute("ignorekeys", "true");
    
    // [issue 241] force the last URI if popup not shown
    let forceSingleURI;
    if(menupopup.state=="closed" && forceFind && matches.length) {
      forceSingleURI = prefs.getStringPref("quickMove.lastFolderURI");
      if (!matches.find(e => e.uri == forceSingleURI))
        forceSingleURI = "";
    } 
    
    if (!forceSingleURI) {
      //  menupopup.showPopup(searchBox, 0, -1,"context","bottomleft","topleft");
      menupopup.openPopup(searchBox,"after_start", 0, -1,true,false);  // ,evt
    }
		                           //                v-- [Bug 26665] support VK_ENTER even with multiple matches
		if (matches.length == 1 || (matches.length>0 && forceFind) ) {
			util.logDebugOptional("quickMove", forceFind ? "Enter key forces match" : "single match found…");
      if (wordStartMatch(matches[0].lname, searchFolderName) && forceFind) {
				let finalURI = forceSingleURI || matches[0].uri;
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
            let fm = Services.focus;
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
		else {
			searchBox.focus();
    }

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
		element.setAttribute("ignorekeys", "true");
	} ,

	findPopupBlur: function findPopupBlur(el, event) {
		QuickFolders.Util.logDebug("findPopupBlur - " + event);
		el.setAttribute("ignorekeys", "true");
	} ,

	selectFound: function selectFound(element, event) {
		const util = QuickFolders.Util,
		      QI = QuickFolders.Interface;
		util.logDebug("selectFound - " + event);
	  let el = event.target,
		    URI = el.getAttribute("value"),
        isSelected,
        /**************  New quickMove Functionality  **************/
        isQuickMove = (QuickFolders.quickMove.isActive);
		// this was a separate command which is handled elsewhere
		if (el.classList.contains("deferred")) return;
		element.setAttribute("ignorekeys", "true");
    util.logDebugOptional("quickMove", "QuickFolders.quickMove.isActive = " + isQuickMove);
		let searchTerm = QI.FindFolderBox.value,
		    slashPos = searchTerm.indexOf("/"),
		    parentName = "";
		if (slashPos>0) {
			// determine name of parent folder
			let target = QuickFolders.Model.getMsgFolderFromUri(URI),
			    ps = el.getAttribute("parentString") || target.parent.name;
			parentName = ps;
		}
    if (isQuickMove) {
			util.logDebugOptional("quickMove","selectFound: quickMove execute(\n" + URI + "\n[, parent: " + parentName + "])");
      QuickFolders.quickMove.execute(URI, parentName); // folder.uri
      return;
    } /**************  quickMove End  **************/
    else {
			util.logDebugOptional("quickMove","selectFound: quickMove End…");
      isSelected = QuickFolders_MySelectFolder(URI, true);
      if (isSelected) {
        QuickFolders.quickMove.rememberLastFolder(URI, parentName);
      }
		}
		if (isSelected) {
			// success: collapses the search box!
      this.findFolder(false);
		}
		else {
			if (el.classList.contains("quickFolder")) {
				// this.correctFolderEntry(URI);
				// in case we have deleted the QuickFolders (which QuickFolders_MySelectFolder allows now)
				// we refresh the popup:
				//  /////// this.findFolderName(document.getElementById("QuickFolders-FindFolder"));
				this.findFolder(false);
				this.hideFindPopup();
			}
			else { // this should not happen as we have found it from the folder tree!
				Services.prompt.alert(null,"QuickFolders","could not find folder!");
				this.findFolder(false);
				this.hideFindPopup();
			}
		}
	} ,

	correctFolderEntry: function correctFolderEntry(URI) {
		let confirmationText = "could not find this QuickFolder! The URL might be invalid - this can be caused by moving parent folders.\n"
			+ "Do you want to correct this manually?",
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
            QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" }); // this.updateFolders(true, true);
					}
					else {
						Services.prompt.alert(null,"QuickFolders","Could not find that path either!");
					}
				}
				break;
		}
	} ,

  // actionType - "quickMove" or "quickJump". Empty when used for disabling the find / jump method
	findFolder: function (show, actionType) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface,
				prefs = QuickFolders.Preferences,
        QuickMove = QuickFolders.quickMove;
    util.logDebugOptional("interface.findFolder,quickMove", "findFolder(" + show + ", " + actionType + ")");
		try {
			let ff = QI.FindFolderBox;
			ff.collapsed = !show;
      QI.FindFolderHelp.collapsed = !show;
			if (show) {
				if (actionType) {
					util.popupRestrictedFeature(actionType,util.getBundleString("qf.notification.premium.shortcut"),2); // Licensed Version Notification
          let isMove = (actionType == "quickMove");
          QI.toggleMoveModeSearchBox(isMove);
          if (isMove && QuickMove.suspended) {
            QuickMove.toggleSuspendMove(); // undo suspend
          }
				}
        QI.updateFindBoxMenus(show);

				let autofill = (ff.value == "") && util.hasValidLicense() && prefs.getBoolPref("quickMove.autoFill");
				if (autofill) {
					ff.value = prefs.getStringPref("quickMove.lastFolderName"); // should [ESC] delete contents?
					ff.select();
				}
				ff.focus();
			}
			else {
				ff.value = ""; // reset search box
				if (QI.CurrentTabMode!="mailMessageTab") {
					// move focus away!
					let threadPane = this.getThreadPane();
					if (!threadPane.collapsed) {
						this.setFocusThreadPane(true);
					}
					else {
						let fTree = GetFolderTree();
						if (!fTree.collapsed) {
							fTree.focus();
						}
						else
							ff.blur();
					}
				}
        QI.updateFindBoxMenus(show);
			}
		}
		catch(ex) {
			util.logException("findFolder (" + show + ", " + actionType + ") failed.", ex);
		}
	}	,

	getThreadPane: function() {
		if (!QuickFolders.Util.document3pane) return null;
	  return QuickFolders.Util.threadPane;
	} ,

	setFocusThreadPane: function(isDelay=false) {
		window.gTabmail?.currentAboutMessage?.document.getElementById("messagepane").focus();
    let threadTree = this.getThreadTree();
		if (threadTree) {
			// find the selected row, focus that.
			setTimeout(
				() => {
					let firstSelectedMailRow = threadTree.table.body.querySelector("[aria-selected=true]");
					if (firstSelectedMailRow) {
						QuickFolders.Util.logDebugOptional("folders.select", "focusing first Selected Mail Row.");
						firstSelectedMailRow.focus();
					} else {
						QuickFolders.Util.logDebugOptional("folders.select", "focusing threadTree.");
						threadTree.table.body.focus();
					}
				},
				isDelay ? 1000 : 0
			);
			
		}
  } ,

  getThreadTree: function()  {
    let doc = QuickFolders.Util.document3pane;
		if (!doc) return null;
    return doc.getElementById("threadTree");
  } ,
  
	// selectedTab   - force a certain tab panel to be selected
	// updateMessage - display this message when opening the dialog
	viewOptions: function viewOptions(selectedTab, mode="") {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "openPrefs", selectedTab, mode });  
	} ,

	viewHelp: function viewHelp() {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "openPrefs", selectedTab:-1, mode:"helpOnly" }); 
	} ,

	viewSupport: function viewSupport() {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "openPrefs", selectedTab:-1, mode:"supportOnly" }); 
	} ,

  viewLicense: function () {
    if (!QuickFolders.Util.licenseInfo.isLicenseViewed) {
      QuickFolders.Util.licenseInfo.isLicenseViewed = true; // session variable to mark license stuff as "seen".
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFoldersLabel"}); 
    }		
    QuickFolders.Util.notifyTools.notifyBackground({ func: "openPrefs", selectedTab:-1, mode:"licenseKey" }); 
  } ,

	viewChangeOrder: function viewChangeOrder() {
		window.openDialog("chrome://quickfolders/content/change-order.xhtml","quickfolders-change-order",
						  "chrome,titlebar,centerscreen,resizable,dependent", QuickFolders); // dependent = modeless
	} ,
  
  // use msg for displaying license restrictions 
  viewSplash: function(msg="") {
    QuickFolders.Util.notifyTools.notifyBackground({ func: "splashScreen", msg });
  } ,

	viewInstalled: function() {
		QuickFolders.Util.notifyTools.notifyBackground({ func: "splashInstalled" });
	} ,

  lastTabSelected: null,
  styleSelectedTab: function styleSelectedTab(selectedButton) {
		if(!(selectedButton))  return;
    if (selectedButton.classList.contains("selected-folder")) return;
    selectedButton.classList.add("selected-folder");
    selectedButton.checked = true;
    selectedButton.setAttribute("selected", true); // real tabs
  } ,

  getCurrentTabMailFolder: function() {
    let folder = null,
        util = QuickFolders.Util,
        idx = QuickFolders.tabContainer.tabbox.selectedIndex,
        tabmail = document.getElementById("tabmail"),
        tabs = tabmail.tabInfo, 
        info = util.getTabInfoByIndex(tabmail, idx),
        tabMode = util.getTabMode(info);  // tabs[idx]
    // single message mode
    if (tabMode == "mailMessageTab") {
      let msg = info.message;
      if (msg) {
        folder = msg.folder;
      }
      if (folder) {
        QuickFolders.Util.logDebugOptional("mailTabs", "getCurrentTabMailFolder() returns displayed message folder: " + folder.prettyName);
        return folder;
      }
    }
    let fD = info.folderDisplay;
    if (fD && fD.view && fD.view.displayedFolder) { // Tb
      folder = fD.view.displayedFolder
		} else {  // Postbox
      folder = GetFirstSelectedMsgFolder();
		}
    QuickFolders.Util.logDebugOptional("mailTabs", "getCurrentTabMailFolder() returns: " + (folder ? folder.prettyName : "n/a"));
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

      // used to be: GetFirstSelectedMsgFolder() - but doesn't work in Sm
      if (forceButton) {
        folder = forceButton.folder;
      } else if (forceFolder) {
        folder = forceFolder;
      } else {
        folder = QI.getCurrentTabMailFolder();
      }

      util.logDebugOptional("interface", "onTabSelected("
			  + (forceButton || "") + ")\n folder = "
				+ (folder ? folder.prettyName : "<none>"));
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
			// button.className = button.className.replace(/(cActive[0-9]+)/,""); // remove active coloring
			// remove "selected" attribute of tab look
			if (button.hasAttribute("selected")) { button.removeAttribute("selected"); }
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
    return folder;
	} ,

	// LIKELY OBSOLETE
  hoistCurrentFolderBar: function(currentFolderTab, tabInfo) {
    let util = QuickFolders.Util,
        tabMode = tabInfo ? util.getTabMode(tabInfo) : this.CurrentTabMode,
        rect0 = currentFolderTab.getBoundingClientRect();
    // move current folder BAR up if necessary!
    util.logDebugOptional("interface.currentFolderBar", "hoistCurrentFolderBar(tabMode: " + tabMode + ")");

    if (!rect0.width && ["message", "folder", "3pane", "mail3PaneTab"].includes(tabMode))
    {
      let panel = currentFolderTab.parentNode,
          found = false;
      while (panel) {
        if (panel.id && panel.id.indexOf("QuickFolders-PreviewToolbarPanel")==0) {
          found=true;
          break;
        }
        panel = panel.parentNode;
      }
      if (found) {
        // now we got the toolbar panel let us move the whole lot
        let rect = panel.getBoundingClientRect();
        if (!rect.width) {
          // QuickFolders.Util.logDebug("Parent panel {" + panel.id + "} is not on screen; moving current folder button for tabMode: " + tabMode);
          if (panel.id) {
/*
            // find multimessage browser element and check if it is visible
            // parent of visible toolbar
            let multimessage = document.getElementById("multimessage"),
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
              let msgHeaderView = document.getElementById("msgHeaderView");
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

	/* INITIALIZES CURRENT FOLDER TAB AND ELEMENTS OF NAVIGATION TOOLBAR, BASED ON SELECTED FOLDER */
	initCurrentFolderTab: function (currentFolderTab, folder, selectedButton, tabInfo) {
    function disableNavigation(isDisabled) {
      doc.getElementById("QuickFolders-NavigateUp").disabled = isDisabled;
      doc.getElementById("QuickFolders-NavigateLeft").disabled = isDisabled;
      doc.getElementById("QuickFolders-NavigateRight").disabled = isDisabled;
      let ic = doc.getElementById("QuickFolders-RemoveIcon");
      if (ic) ic.disabled = isDisabled;
      ic = doc.getElementById("QuickFolders-SelectIcon");
      if (ic) ic.disabled = isDisabled;
    }
		if (!currentFolderTab) return;
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					doc = currentFolderTab.ownerDocument;
    try {
      // there is no tabContainer in a single message window.
			let tabIdx = "n/a";
      let tabMode = tabInfo ? util.getTabMode(tabInfo) : this.CurrentTabMode;
			try {
				if (tabMode) {
					tabIdx = tabInfo.parentElement.parentElement.selectedIndex;
				}
			} catch (ex) {}

      util.logDebugOptional("interface.currentFolderBar", 
			                      "initCurrentFolderTab(" + (folder ? folder.prettyName : "null") + ")\n"
                            + "tabMode: " + tabMode + " -  tabIndex: " + tabIdx, tabInfo
														);
      this.hoistCurrentFolderBar(currentFolderTab, tabInfo);

      if (folder) {
        let entry = QuickFolders.Model.getFolderEntry(folder.URI);
        if (selectedButton) {
          currentFolderTab.className = selectedButton.className; // else : "icon";
        }
        QuickFolders.Interface.addFolderButton(folder, entry, -1, currentFolderTab, "QuickFoldersCurrentFolder", prefs.ColoredTabStyle, true, false);
				const CurrentFolderRemoveIconBtn = doc.getElementById("QuickFolders-RemoveIcon");
				const CurrentFolderSelectIconBtn = doc.getElementById("QuickFolders-SelectIcon");
        if (QuickFolders.FolderTree && CurrentFolderRemoveIconBtn) {
          if (!prefs.supportsCustomIcon) {
            CurrentFolderSelectIconBtn.collapsed = true;
            CurrentFolderRemoveIconBtn.collapsed = true;
          }
          else {
            let hasIcon =
              prefs.getBoolPref("currentFolderBar.folderTreeIcon")
              ? QuickFolders.FolderTree.addFolderIconToElement(currentFolderTab, folder)  // add icon from folder tree
              : QuickFolders.FolderTree.hasTreeItemFolderIcon(folder);
            CurrentFolderRemoveIconBtn.collapsed = !hasIcon;
            CurrentFolderSelectIconBtn.collapsed = hasIcon; // hide select icon for tidier experience.
          }
        }
        disableNavigation(false);
        currentFolderTab.setAttribute("tooltiptext", util.getFolderTooltip(folder));
      }
      else {
        // search mode: get title of tab after a short delay
        setTimeout(function() {
          let tabmail = document.getElementById("tabmail"),
              idx = QuickFolders.tabContainer.tabbox.selectedIndex || 0;
          let tabInfo = util.getTabInfoByIndex(tabmail, idx);
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

      currentFolderTab.className = currentFolderTab.className.replace("striped", "");
      currentFolderTab.classList.remove("selected-folder");
    }
    catch(ex) {
      util.logException("Quickfolders.Interface.initCurrentFolderTab()", ex);
    }

	} ,

  configureCategory: function configureCategory(folder, quickfoldersPointer) {
		let retval = {btnClicked:null};
		window.openDialog("chrome://quickfolders/content/set-folder-category.xhtml",
			"quickfolders-set-folder-category","chrome,titlebar,toolbar,centerscreen,modal=no,resizable,alwaysRaised", quickfoldersPointer, folder,retval);
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
        cats = entry.category.split("|"),
        newC = "",
        removeAlwaysShow = false;
    // see if it is set to "show always" and show a prompt allowing to remove
    if (cats.indexOf(QuickFolders.FolderCategory.ALWAYS) >= 0) {
      let text = QuickFolders.Util.getBundleString("qfRemoveCategoryPrompt");
      text = text.replace("{1}", QuickFolders.Util.getBundleString("qfShowAlways"));
      if (Services.prompt.confirm(window, "QuickFolders", text))
        removeAlwaysShow = true;
    }

    // buggy if first one is removed.
    for (let i=0; i<cats.length; i++) {
      if (cats[i].trim() == this.currentActiveCategories.trim()) continue;
      if (removeAlwaysShow && cats[i].trim() == QuickFolders.FolderCategory.ALWAYS) continue;
      newC += (newC.length ? "|" : "") + cats[i];
    }
    entry.category = newC;
    QuickFolders.Model.update();
  },

	getButtonColorClass: function getButtonColorClass(col, noStripe) {
		//let sColFolder = (tabStyle == 0) ? "chrome://quickfolders/content/skin/striped" : "chrome://quickfolders/content/skin/cols";
		let tabStyle = QuickFolders.Preferences.ColoredTabStyle;

		return "col"+col+
				((tabStyle == QuickFolders.Preferences.TABS_STRIPED && !noStripe) ? "striped" : "");
	} ,

	getButtonColor: function getButtonColor(button) {
		let cssClass = button.className,
		    rClasses=cssClass.split(" ");
		for (let j=0; j<rClasses.length; j++) {
			// determine number from string, e.g. col1striped or col1
			let f = rClasses[j].indexOf("col");
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
		    newclass = "",
	      rClasses=cssClass.split(" ");
		for (let j=0; j<rClasses.length; j++) {
			// strip previous style
			if (rClasses[j].indexOf("col")<0)
				newclass+=rClasses[j] + " ";
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
      isUncolored ? this.getPaletteClass("InactiveTab") : this.getPaletteClass("ColoredTab"); // QuickFolders.Preferences.isPastelColors;

    /* element needs to get custom Palette attribute from model entry */
    if (element.folder || (targetElement && targetElement.folder)) {
      let btn = element.folder ? element : targetElement, // menu item
          entry = QuickFolders.Model.getButtonEntry(btn);
      if (entry && entry.customPalette) {
        paletteToken = this.getPaletteClassToken(entry.customPalette).trim();
      }
    }

		QuickFolders.Util.logDebugOptional("css.palette",
			"initElementPaletteClass(element: " + (element.id ? element.id : element.tagName) +
			"\ntarget: "
			+ (targetElement ?
			   (targetElement.label ? targetElement.label : targetElement.tagName) : "none")
			+ ")  paletteClass = {" + paletteToken + "}");

		// remove palette name(s)
		element.className = this.stripPaletteClasses(element.className, paletteToken);
		let hasClass = (paletteToken && element.classList.contains(paletteToken.trim()));
		if (!hasClass) {
		  if (paletteToken)
        element.classList.add(paletteToken.trim());
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
		this.initElementPaletteClass(paintButton, "", (col=="0"));       // palette -> Button
		this.initElementPaletteClass(this.PalettePopup); // palette -> popup
		// striped
		if (QuickFolders.Preferences.ColoredTabStyle == QuickFolders.Preferences.TABS_STRIPED && paintButton.className.indexOf("striped")<0)
			paintButton.className = paintButton.className.replace(/(col[0-9]+)/,"$1striped");
		// filled
		if (QuickFolders.Preferences.ColoredTabStyle != QuickFolders.Preferences.TABS_STRIPED && paintButton.className.indexOf("striped")>0)
			paintButton.className = paintButton.className.replace("striped","");

		// initialize hover color
		// ==> must become palette type aware as well!
    if (this.PaintModeActive) {
      this.initHoverStyle(
               this.getStyleSheet(document, QuickFolders.Styles, "quickfolders-layout.css", "QuickFolderStyles"),
               this.getStyleSheet(document, QuickFolders.Styles, QuickFolders.Interface.PaletteStyleSheet, "QuickFolderPalettes"),
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
		    ssPalettes;
		while (!parent.folder && parent.parentNode) {
			parent=parent.parentNode;
			switch(parent.id) {
				case "QuickFolders-Palette": // fall through
				case "QuickFolders-PalettePopup":
					// paint the paintBucketButton
					this.setPaintButtonColor(col);
					return;
				default:  // "QuickFolders-Options-PalettePopup" etc.
				  if (!parent.id.includes("QuickFolders-Options-"))
						continue;  //
          throw("invalid legacy code: setTabColorFromMenu from " + parent.id);
			} // end switch
		}
		// or... paint a quickFolders tab
		let theFolder = parent.folder,
		    button = this.getButtonByFolder(theFolder);
		util.logToConsole("Interface.setTabColorFromMenu(" + menuitem.toString() + ", " + col + ")" );
		this.setButtonColor(button, col);        // color the  button via palette entry number
    this.initElementPaletteClass(button, "", (col=="0"));    // make sure correct palette is set
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

	ensureStyleSheetLoaded: function(doc, Name, Title)	{
    const Cc = Components.classes,
		      Ci = Components.interfaces,
					util = QuickFolders.Util;
		try {
			util.logDebugOptional("css","ensureStyleSheetLoaded(Name: " + Name + ", Title: " + Title + ")" );

			QuickFolders.Styles.getMyStyleSheet(doc, Name, Title); // just to log something in console window

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

	getStyleSheet: function (doc, Name, Title) {
		let sheet = QuickFolders.Styles.getMyStyleSheet(doc, Name, Title); 
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(doc, Name, Title);
			sheet = QuickFolders.Styles.getMyStyleSheet(doc, Name, Title);
		}
		if (!sheet) {
			QuickFolders.Util.logToConsole(`ensureStyleSheetLoaded() - missing style sheet '${Name}' - not found\n not attempting any style modifications.`, doc);
		}
		return sheet;
	} ,

	// HOVER STATE
	initHoverStyle: function initHoverStyle(ss, ssPalettes, isPaintMode) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		let templateTabClass =  isPaintMode ? "ColoredTab" : "HoveredTab",
		    paletteClass = this.getPaletteClassCss(templateTabClass);
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initHoverStyle()  PaintMode=" + isPaintMode + "   paletteClass=" + paletteClass);
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    hoverBackColor = prefs.getUserStyle("HoveredTab","background-color","#F90"),
		    tabStyle = prefs.ColoredTabStyle,
		    noColorClass = (tabStyle != prefs.TABS_STRIPED) ? "col0" : "col0striped",
		    hoverColor = prefs.getUserStyle(templateTabClass, "color", "#000000");

		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","background-color", hoverBackColor,true);
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover","background-color", hoverBackColor, true);
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover .toolbarbutton-text","color", hoverColor, true); // [issue 81] - add selector for label
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":hover .toolbarbutton-icon","color", hoverColor, true); // [issue 81] - add selector for icon

		let paintButton = isPaintMode ? this.PaintButton : null;

		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "style." + templateTabClass + ".paletteType = "
		  + prefs.getIntPref("style." + templateTabClass + ".paletteType"));

		if (prefs.getIntPref("style.HoveredTab.paletteType") || isPaintMode) {
			let paletteEntry =
				isPaintMode
				? paintButton.getAttribute("colorIndex")
				: prefs.getIntPref("style.HoveredTab.paletteEntry");
			if (!paletteEntry)
				paletteEntry = 1;
			// extract current gradient from style sheet rule:
			let ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    hoverGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "setting hover gradient[" + ruleName + "]: " + hoverGradient + "\nisPaintMode = " + isPaintMode);

			// build some rules..
			// remove +paletteClass from rule as this should always apply!
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton"  + ":hover", "background-image", hoverGradient, true); // [class^="col"]
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton"  + "." + noColorClass + ":hover", "background-image", hoverGradient, true);

			// picked hover color (from paint mode)
			//let hc = engine.getElementStyle(ssPalettes, ruleName, "color");
			//hoverColor = hc ? hc : hoverColor;
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat toolbarbutton[buttonover="true"]',"color", hoverColor, true);
		}
		else { // two color mode
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds…");
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + ":hover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + "." + noColorClass + ":hover", "background-image", "none", true);
			if (tabStyle == prefs.TABS_STRIPED) {
				engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor ,true);
			}
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","color", hoverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + '[buttonover="true"]',"color", hoverColor ,true);
			// full monochrome background
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:hover","background-color", hoverBackColor,true);
		}
	} ,

	// DRAGOVER STATE
	initDragOverStyle: function initDragOverStyle(ss, ssPalettes) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDragOverStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    // let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, "color");
		    dragOverColor = prefs.getUserStyle("DragTab","color","White");
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover","background-color", prefs.getUserStyle("DragTab","background-color","#E93903"),true);
    let noColorClass = "col0"; // ####
    engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ".dragover","color", dragOverColor, true); // ####

		if (prefs.getIntPref("style.DragOver.paletteType")) {
			let paletteClass = this.getPaletteClassCss("DragOver"),
			    paletteEntry = prefs.getIntPref("style.DragOver.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover", "background-image", dragOverGradient, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + ".dragover","color", dragOverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + '[buttonover="true"]',"color", dragOverColor, true);
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.dragover","color", dragOverColor,true);
		}
	} ,

	getPaletteClassCss: function getPaletteClassCss(tabStateId) {
		let cl = this.getPaletteClass(tabStateId);
		return cl.replace(" ", ".");
	} ,

	stripPaletteClasses: function stripPaletteClasses(className, exclude) {
		if (exclude !== "pastel")
		  className = className.replace(/\s*pastel/,"")
		if (exclude !== "plastic")
		  className = className.replace(/\s*plastic/,"")
		if (exclude !== "night")
		  className = className.replace(/\s*night/,"")
		return className;
	} ,

	getPaletteClass: function getPaletteClass(tabStateId) {
	  let paletteType = QuickFolders.Preferences.getIntPref("style." + tabStateId + ".paletteType");
		switch (paletteType) {
		  case -1:
			  if (tabStateId == "InactiveTab") {
					return "";  // error
				}
				else { // get from global tab style!
					return this.getPaletteClass("InactiveTab");
				}
				break;
			default:
				return this.getPaletteClassToken(paletteType);
		}
		return "";
	} ,

	getPaletteClassToken: function getPaletteClassToken(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return this.getPaletteClassToken(this.getPaletteClass("InactiveTab")); // default
			case 0:
			  return "";  // none
			case 1:
			  return " plastic";  // default
			case 2:
			  return " pastel";
      case 3:
        return " night";
		}
		return "";
	} ,

	// SELECTED FOLDER STATE (.selected-folder)
	initSelectedFolderStyle: function initSelectedFolderStyle(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initSelectedFolderStyle()");
		let engine = QuickFolders.Styles,
		    colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight"),
		    selectedColor = QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),
		    globalPaletteClass = this.getPaletteClassCss("InactiveTab"),
        paletteClass = this.getPaletteClassCss("ActiveTab"),
        coloredPaletteClass = this.getPaletteClassCss("ColoredTab");

		if (QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteType")) {
			let paletteEntry =  QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    selectedGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			// selectedColor = engine.getElementStyle(ssPalettes, ruleName, "color"); // make this overridable!
			// we do not want the rule to containg the paletteClass because it has to always work!
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", selectedGradient, true);
		}
		else { // two colors mode
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton.selected-folder","background-color", colActiveBG, true);
		}
    // style label and image (to also overwrite theme color for svg icons)
    engine.removeElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color");  
    engine.setElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color", selectedColor,true);
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
		    paletteClass = this.getPaletteClassCss("InactiveTab"),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == prefs.TABS_STRIPED) && prefs.getIntPref("style.InactiveTab.paletteType")<3,
		    noColorClass = (isTabsStriped) ? "col0striped" : "col0";

		// transparent buttons: means translucent background! :))
		if (prefs.getBoolPref("transparentButtons")) {
			inactiveBackground = util.getRGBA(inactiveBackground, 0.25);
		}

		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton","background-color", inactiveBackground, false);
		engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder","background-color", inactiveBackground, true);

		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (prefs.getIntPref("style.InactiveTab.paletteType")>0) {
			let paletteEntry = prefs.getIntPref("style.InactiveTab.paletteEntry");
			if (tabStyle === prefs.TABS_STRIPED)
				paletteEntry += "striped";
			let ruleName = (!isTabsStriped ? ".quickfolders-flat " : "") + paletteClass + ".col" + paletteEntry;
			let inactiveGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":not(.dragover)", "background-image"); // remove "none"
			// removed "toolbarbutton". qualifier
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)", "background-image", inactiveGradient, false);
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)#QuickFoldersCurrentFolder", "background-image", inactiveGradient, false);

			inactiveGradientColor = (inactiveColor=="black") ? engine.getElementStyle(ssPalettes, ruleName, "color") : inactiveColor;
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton." + noColorClass + ":not(.dragover)", "background-image", "none", false);
		}

    // tb + avoidCurrentFolder
	  engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + "." + noColorClass + " .toolbarbutton-text", "color", inactiveColor, false); // [issue 81] - add selector for label
	  engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + "." + noColorClass + " .toolbarbutton-icon", "color", inactiveColor, false); // [issue 81] - add selector for icon
    if (inactiveGradientColor!=null)
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass + "." + noColorClass, "color", inactiveGradientColor, false);

		// Coloring all striped tabbed buttons that have individual colors
    let coloredPaletteClass = this.getPaletteClassCss("ColoredTab");
		if (isTabsStriped) { // paletteClass = plastic, pastel, "", apple
			// fallback for uncolored current folder (striped style)
			engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton#QuickFoldersCurrentFolder.col0" + paletteClass,"color", inactiveColor, false);
      // avoid for current folder button as it always will be completely colored
      // #issue 7 these rules didn't work due to a syntax error
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + coloredPaletteClass,"color", inactiveColor, false);
      engine.setElementStyle(ss, ".quickfolders-flat toolbarbutton:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + paletteClass,"color", inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton" + paletteClass,"color");
			engine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton" + coloredPaletteClass,"color");
		}
	} ,

	// Get all blingable elements and make them look user defined.
	updateUserStyles: function updateUserStyles() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
					styleEngine = QuickFolders.Styles;
		try {
			util.logDebugOptional ("interface","updateUserStyles() " + window.location);
			// get MAIN STYLE SHEET
			let ss = this.getStyleSheet(document, "quickfolders-layout.css", "QuickFolderStyles");

			if (!ss) return false;

			// get PALETTE STYLE SHEET
			let ssPalettes = this.getStyleSheet(document, QuickFolders.Interface.PaletteStyleSheet, "QuickFolderPalettes");
      ssPalettes = ssPalettes ? ssPalettes : ss; // if this fails, use main style sheet.
			let theme = prefs.CurrentTheme,
			    tabStyle = prefs.ColoredTabStyle;

			if (prefs.isCssTransitions) {
				styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-duration", "1s, 1s, 2s, 1s");
				styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-property", "color, background-color, border-radius, box-shadow");
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-duration");
				styleEngine.removeElementStyle(ss, ".quickfolders-flat toolbarbutton", "transition-property");
			}

			// =================
			// FONT COLORS
			let theColorString = prefs.getUserStyle("InactiveTab","color","black"),
			    colActiveBG = prefs.getUserStyle("ActiveTab","background-color","Highlight"),
					btnSelector = ".quickfolders-flat toolbarbutton";

			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, btnSelector
				  + "[background-image].selected-folder","border-bottom-color", colActiveBG, true);
			}
			QuickFolders.Interface.updateSharedToolbarStyles(ss);

			// =================
			// CUSTOM RADIUS
			let topRadius = "4px",
			    bottomRadius = "0px";
			if (prefs.getBoolPref("style.corners.customizedRadius")) {
				topRadius =  prefs.getIntPref("style.corners.customizedTopRadiusN") + "px";
				bottomRadius = prefs.getIntPref("style.corners.customizedBottomRadiusN") + "px";
			}

			styleEngine.setElementStyle(ss, btnSelector, "border-top-left-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-top-right-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-left-radius", bottomRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-right-radius", bottomRadius, true);

			// QuickFolders Toolbar only
			let btnInToolbarSelector = ".quickfolders-flat .folderBarContainer toolbarbutton",
			    buttonHeight = prefs.getIntPref("style.button.minHeight") + "px",
			    topPadding =  prefs.getIntPref("style.button.paddingTop") + "px";
			styleEngine.setElementStyle(ss, btnInToolbarSelector, "min-height", buttonHeight, true);
			styleEngine.setElementStyle(ss, btnInToolbarSelector, "padding-top", topPadding, true);


			// ==================
			// BORDERS & SHADOWS
			// for full colored tabs color the border as well!
			// but should only apply if background image is set!!
			let SHADOW = "box-shadow";
			if (prefs.getBoolPref("buttonShadows")) {
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton", SHADOW, "1px -1px 3px -1px rgba(0,0,0,0.3)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton.selected-folder", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton:hover", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton.selected-folder", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer toolbarbutton:hover", SHADOW);
			}

			styleEngine.setElementStyle(ss, ".quickfolders-flat toolbarbutton[background-image].selected-folder","border-bottom-color", colActiveBG, true);
			styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane","border-bottom-color", colActiveBG, true); // only in main toolbar!

			let theInit = "";
			try {
			  theInit = "SelectedFolderStyle";
				this.initSelectedFolderStyle(ss, ssPalettes, tabStyle);
			  theInit = "DefaultStyle";
				this.initDefaultStyle(ss, ssPalettes, tabStyle);
			  theInit = "HoverStyle";
				this.initHoverStyle(ss, ssPalettes, this.PaintModeActive);
			  theInit = "DragOverStyle";
				this.initDragOverStyle(ss, ssPalettes);
			}
			catch (ex) {
			  util.logException("Quickfolders.updateUserStyles - init" + theInit + " failed.", ex);
			}

			// TOOLBAR
			theColorString = prefs.getUserStyle("Toolbar","background-color","ButtonFace");
			if (prefs.getBoolPref("transparentToolbar"))
				theColorString = "transparent";
			styleEngine.setElementStyle(ss, ".toolbar","background-color", theColorString,true);

      // restrict to toolbar only (so as not to affect the panel in currentFolder bar!)
			styleEngine.setElementStyle(ss, "toolbar." + theme.cssToolbarClassName, "background-color", theColorString,true);
      let tbBottom = prefs.getUserStyle("Toolbar","bottomLineWidth", 3) + "px";
      styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane", "border-bottom-width", tbBottom, true);

			// this.updateNavigationBar(); // not working here in Tb 115!

      // change to numeric
			let minToolbarHeight = prefs.getStringPref("toolbar.minHeight");
      if (minToolbarHeight) {
        let mT = parseInt(minToolbarHeight);
        styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar", "min-height", mT.toString()+"px", false);
      }

      // main toolbar position
      // let ordinalGroup = prefs.getIntPref("toolbar.ordinalPosition") || 0;
      // styleEngine.setElementStyle(ss,"#QuickFolders-Toolbar", "-moz-box-ordinal-group", ordinalGroup.toString());

			util.logDebugOptional ("css","updateUserStyles(): success");
      
      util.$("QuickFolders-Tools-Pane").setAttribute("iconsize", prefs.getBoolPref("toolbar.largeIcons") ? "large" : "small"); // [issue 191]
			util.$("QuickFolders-Toolbar").setAttribute("iconsize", prefs.getBoolPref("toolbar.largeIcons") ? "large" : "small"); // [issue 407]

			let customIconSize = QuickFolders.Preferences.getIntPref("toolbar.customIconSize");
			styleEngine.setElementStyle(ss,":root", "--qf-tabiconsize", `${customIconSize}px`);
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
		let current = QuickFolders.Util.CurrentFolder,
		    parentFolder = current.parent,
		    myenum; // force instanciation for SM
		if (!current || !parentFolder)
			return;
    
    let childFolders;
    
    if (parentFolder.subFolders.hasMoreElements) {
      let myenum = parentFolder.subFolders;
      childFolders = [];
      while (myenum.hasMoreElements()) {
        childFolders.push(myenum.getNext().QueryInterface(Ci.nsIMsgFolder));
      }
    }
    else { // Tb 88
      childFolders = parentFolder.subFolders;
    }
    
    // do nothing if this is the only folder:
    if (childFolders.length == 1) return;
    
		let target = null,
        iCurrent;
        
    for (let i=0; i<childFolders.length; i++) {
      if (current == childFolders[i]) {
        iCurrent = i;
      }
    }
    if (iCurrent==0) { // go to last element
      target = childFolders[childFolders.length-1];
    }
    else
      target = childFolders[iCurrent-1];
    
		if (null!=target)
			QuickFolders_MySelectFolder(target.URI);

	} ,

	goNextSiblingFolder: function goNextSiblingFolder() {
		let current = QuickFolders.Util.CurrentFolder,
		    parentFolder = current.parent,
        myenum; // force instanciation for SM
		if (!current || !parentFolder)
			return;
      
    let childFolders;
      
    if (parentFolder.subFolders.hasMoreElements) {
      let myenum = parentFolder.subFolders;
      childFolders = [];
      while (myenum.hasMoreElements()) {
        childFolders.push(myenum.getNext().QueryInterface(Ci.nsIMsgFolder));
      }
    }
    else { // Tb 88
      childFolders = parentFolder.subFolders;
    }
    
    // do nothing if this is the only folder:
    if (childFolders.length == 1) return;
    
		let target = null,
        iCurrent;
        
    for (let i=0; i<childFolders.length; i++) {
      if (current == childFolders[i]) {
        iCurrent = i;
      }
    }
    
    if (iCurrent==childFolders.length-1) { // go to first element
      target = childFolders[0];
    }
    else
      target = childFolders[iCurrent+1];
    
		if (null!=target)
			QuickFolders_MySelectFolder(target.URI);
	} ,

  /**
   * toggles visibility of current folder toolbar
	 * @param optionsOrEvent { [isFromWindow], [display], [doc], selector }
   *        display {bool}: visibility tag - or an event if called from notification tools
	 *        doc: document containing toolbar
   *        selector {string} : "" - determine which one to close from current window / tab context
   *                           "singleMailTab" - a single message (conversation) tab
   *                           "messageWindow" - a single mail window
   **/
	displayNavigationToolbar: function(optionsOrEvent) {
    const util = QuickFolders.Util;
    try {
      let win, 
          doc,
          isVisible;

      // first parameter may be an event - coming from notification!
      const isEvent = optionsOrEvent && (typeof optionsOrEvent["target"] !== "undefined");
			const isFromWindow = optionsOrEvent["isFromWindow"] || false;
			const isCurrent = !isEvent && !isFromWindow && (typeof optionsOrEvent.display == "boolean")  && !(optionsOrEvent.doc); // toggle, from a dropdown menu

			let selector = typeof (optionsOrEvent.selector == "string") ? optionsOrEvent.selector : "";

      // determine selector from context
      const windowType = document.getElementById("messengerWindow").getAttribute("windowtype");
      if (!selector) {
				switch(windowType) {
					case "mail:messageWindow":
						selector = "messageWindow";
						break;
					case "mail:3pane":
						if (this.CurrentTabMode=="mailMessageTab")
							selector = "singleMailTab";
						else
							selector = ""; // 3pane mode
						break;
				}
      } 			

      if (!isEvent) {
        isVisible = optionsOrEvent.display; // visibility status passed as param
      } else {
        isVisible = QuickFolders.Preferences.isShowCurrentFolderToolbar(selector);
      }

      util.logDebugOptional("interface.currentFolderBar", "displayNavigationToolbar(visible=" + isVisible + ", selector=" + selector + ")");

      /*
			  QuickFolders.Interface.CurrentTabMode  can be:
				"mail:3pane" - folders
				"contentTab" - Addons Manager
				"calendar"
				"mailMessageTab" - single message tabs
				"mail3PaneTab" - single message window
			*/

      win = window;

			if (isCurrent) {
				let currentTabMode = QuickFolders.Interface.CurrentTabMode;
				switch (currentTabMode) {
					case "mailMessageTab":
						doc = QuickFolders.Util.document3pane;
						break;
					case "mail3PaneTab": // only works if window is 
						doc = QuickFolders.Util.document3pane;
						break;
					default:
						util.logDebug("Invalid tab mode:" + currentTabMode);
						doc = win.document;
						break;
				}
			}
			else {
				doc = optionsOrEvent.doc;
			}
      
      util.logDebugOptional("interface.currentFolderBar", "win=" + win.document.URL + "\ndocument=" + doc ? doc.URL : "n/a");
      if (!doc) {
        util.logDebugOptional("interface.currentFolderBar", 
            "|================================================|" + "\n" 
          + "|  not changing UI, early exit: doc is empty!"      + "\n"
          + "|================================================|"  );
        return;
      }

			let toolbarId = "QuickFolders-PreviewToolbarPanel"; // (selector=="messageWindow") ? "QuickFolders-PreviewToolbarPanel-Single" : 
      let currentFolderBar = doc.getElementById(toolbarId);
      if (currentFolderBar) {
        util.logDebugOptional("interface.currentFolderBar", 
            "|===========================================================|" + "\n" 
          + "| currentFolderBar.style.display = " + currentFolderBar.style.display  + "\n" 
          + "|===========================================================|" + "\n" 
          + "visible = " + isVisible);
        if (["","singleMailTab","messageWindow"].includes(selector)) {          
          currentFolderBar.collapsed = !isVisible;
          currentFolderBar.style.display = isVisible ? "flex" : "none";
          util.logDebugOptional("interface.currentFolderBar", "Effected display of current folder bar =" + currentFolderBar.style.display);
        }
      }
      else {
        util.logDebugOptional("interface.currentFolderBar", 
            "|====================================================|" + "\n" 
          + "|  currentFolderBar element could not be retrieved"     + "\n" 
          + "|====================================================|" + "\n");
      }
    }
    catch(ex) {
      util.logException("displayNavigationToolbar(" + optionsOrEvent + ")", ex);
    }
	} ,

	get CurrentTabMode() {
		/*
			QuickFolders.Interface.CurrentTabMode  can be:
			"mail:3pane" - folders, search as list
			"contentTab" - Addons Manager
			"calendar"
			"mailMessageTab" - single message tabs
			"mail3PaneTab" - single message window
			"glodaFacet" - search results
		*/		
		let tabMode = null,
		    tabmail = QuickFolders.Util.$("tabmail");

		if (!tabmail) {
			// doc.ownerGlobal.parent.location.toString().endsWith("messageWindow.xhtml")  -- no tabmail!
			if (typeof gTabMail == "undefined") return "";
			tabmail = gTabMail;
		}

		if (tabmail) {
			tabMode = QuickFolders.Util.getTabMode(tabmail.currentTabInfo);
		}

		return tabMode ? tabMode.toString() : "";
	} ,

	initToolbarTabListener: function() {
		QuickFolders.Util.logDebugOptional("toolbarHiding", "initToolbarTabListener");
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
      this.TabMonitor = monitor;
			tabmail.registerTabMonitor(monitor);
			QuickFolders.Util.logDebugOptional("toolbarHiding", "registered Tab Monitor");
		}
	} ,
  
  removeToolbarHiding: function removeToolbarHiding() {
    let tabmail = QuickFolders.Util.$("tabmail");
    // we need to undo: 
    if (this.TabMonitor)
      tabmail.unregisterTabMonitor(this.TabMonitor);
  },
  
  /* triggers onDeckChange function for changing visibility of toolbar from options window */
  currentDeckUpdate: function() {
    let tabmail = QuickFolders.Util.$("tabmail");
		if (tabmail) {
      QuickFolders.Interface.onDeckChange(tabmail.selectedTab);
		}    
  } ,

  // Called when we go to a different mail tab in order to show / hide QuickFolders Toolbar accordingly
	onDeckChange: async function (targetTab) {
		let util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        mode = "",
		    isMailPanel = false; // prefs.getBoolPref("toolbar.onlyShowInMailWindows"); makes no sense as it doesn't work anyway
    if (prefs.isDebug) {
      util.logDebugOptional("interface", "onDeckChange("
        + util.enumProperties(targetTab)  + ")"
        + "\n" + targetTab.mode ? util.enumProperties(targetTab.mode) : "no mode.");
		}

		let toolbar = this.Toolbar;
    mode = util.getTabMode(targetTab);
    if (["mail3PaneTab","3pane","folder","glodaList","threadPaneBox"].includes(mode)) {
      isMailPanel = true;
    }
		if (targetTab && targetTab.selectedPanel) {
		 	let panelId = targetTab.selectedPanel.id.toString();
			util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - panel: " + panelId);
      // mode = panelId;
		}
		else { //tab
			util.logDebugOptional("toolbarHiding", "onDeckChange - toolbar: " + toolbar.id + " - mode: " + mode);
      mode = this.CurrentTabMode;
		}
    if (["glodaSearch-result","calendar","tasks","contentTab"].includes(mode)) {
      isMailPanel = false;
		}
    util.logDebugOptional("interface", "mode = " + mode + "\nisMailPanel = " + isMailPanel);
		let isMailSingleMessageTab = (mode == "mailMessageTab") ? true  : false,
		    action = "",
				isButtonPressed = null;

		if (isMailPanel || isMailSingleMessageTab) {
			// session value (caused by user pushing the button previously)
			let tabmail = document.getElementById("tabmail");
			if (tabmail && tabmail.currentTabInfo) {
				let info = tabmail.currentTabInfo;
				if (info.QuickFolders_ToolbarStatus) { // only if it is stored for this tab, we set a value
					isButtonPressed = info.QuickFolders_ToolbarStatus.mainVisibleState;
				}
			}
		}
		else {
			isButtonPressed = false;
		}
		// default value according to settings
		if (isButtonPressed == null) {
			if (isMailPanel ||
		    isMailSingleMessageTab && !prefs.getBoolPref("toolbar.hideInSingleMessage")) {
				isButtonPressed = true;
			}
			else {
				isButtonPressed = false;
			}
		}
		action = isButtonPressed ? "Showing" : "Collapsing";
		if (isButtonPressed) {
			toolbar.removeAttribute("collapsed");
		} else {
			toolbar.setAttribute("collapsed", true);
		}

		let toggleButtonElement = QuickFolders.Interface.ToggleToolbarButton;
		if (toggleButtonElement) { // manage checked status manually
			let checkButton = toggleButtonElement.querySelector(".check-button");
			if (!checkButton) { 
				// button has to be patched first!
				await QuickFolders.Interface.toggleToolbar(toggleButtonElement, true);
				checkButton = toggleButtonElement.querySelector(".check-button");
			}
			if (checkButton) {
				checkButton.setAttribute("aria-pressed", isButtonPressed);
				toggleButtonElement.setAttribute("aria-pressed", isButtonPressed);
				if (isButtonPressed) { // Tb resets the checked status afterwards ?
					setTimeout(()=>{
						checkButton.setAttribute("aria-pressed", true);
						toggleButtonElement.setAttribute("aria-pressed", true),
						250;
					})
				}
			}
		}

		util.logDebugOptional("toolbarHiding", " (mode=" + mode + ")" + action + " QuickFolders Toolbar ");

    // always hide current folder toolbar in single message mode
    // QuickFolders-PreviewToolbarPanel
    // QuickFolders-PreviewToolbarPanel-ConversationView: in Thunderbird this is shown in single message tabs as well
		/*
    let singleMessageCurrentFolderPanel = document.getElementById("QuickFolders-PreviewToolbarPanel");
		if (singleMessageCurrentFolderPanel) {
			if (isMailSingleMessageTab) {
				let visible = prefs.isShowCurrentFolderToolbar("singleMailTab");
				util.logDebugOptional("toolbarHiding", " isMailSingleMessageTab - setting display=none for QuickFolders-PreviewToolbarPanel");
				singleMessageCurrentFolderPanel.style.display= visible ? "-moz-box" : "none";
			}
			else if (["mail3PaneTab", "3pane", "folder"].includes(mode)) {
				util.logDebugOptional("toolbarHiding", " isMailSingleMessageTab - setting display=-moz-box for QuickFolders-PreviewToolbarPanel");
				let visible = prefs.isShowCurrentFolderToolbar("");
				singleMessageCurrentFolderPanel.style.display= visible ? "-moz-box" : "none";
			}
		}
		*/
	} ,

	toggle_FilterMode: function (active) {
		QuickFolders.Util.logDebugOptional("interface", "toggle_FilterMode(" + active + ")");
		QuickFolders.FilterWorker.toggle_FilterMode(active);
	} ,

	moveFolders: function moveFolders(fromFolders, isCopy, targetFolder) {
		// [Bug 26517] support multiple folder moves - added "count" and transmitting URIs
		const Cc = Components.classes,
		      Ci = Components.interfaces,
					util = QuickFolders.Util;
    let arrCount = fromFolders.length;

		function isChildFolder(f)	 {
      for (let i=0; i<fromFolders.length; i++) {
        if (f == fromFolders[i]) continue;
        let p = f;
        while (p = p.parent) {
          if (p == fromFolders[i]) return true;
        }
      }
      return false;
    }
    // make  sure this is not a child of previous folders! 
    // in this case, it will be moved anyway through its parent
    // and may lead to a problem (remaining folders are not moved)
    let newFolders = [], newIsCopy = [];
    for (let j=0; j<arrCount; j++) {
      let fld = fromFolders[j];
      if (isChildFolder(fld)) continue; // skip
      newFolders.push(fld);
      newIsCopy.push(isCopy[j]);
    }
    arrCount = newFolders.length;
    
    
		let lastFolder,
		    sPrompt = isCopy[0] ?
          util.getBundleString("qfConfirmCopyFolder") :
          util.getBundleString("qfConfirmMoveFolder"),
				whatIsMoved = arrCount==1 ? newFolders[0].prettyName : "[" + arrCount + " folders]";

		sPrompt = sPrompt.replace("{0}", whatIsMoved);
		sPrompt = sPrompt.replace("{1}", targetFolder.prettyName);
		if (!Services.prompt.confirm(window, "QuickFolders", sPrompt)) return;

		try {
			let toCount = arrCount || 1,
          countChanges = 0; 
			for (let i = 0; i < toCount; i++) {
        // break up into single actions!
				let folders = new Array,
				    fld = newFolders[i],
            isCopy = newIsCopy[i],
				    fromURI = fld.URI;
            
				lastFolder = fld; // keep track of last folder in case of a problem.
				folders.push(fld); // dt.mozGetDataAt("text/x-moz-folder", i).QueryInterface(Ci.nsIMsgFolder)
        if (util.CurrentFolder == fld) {
          this.goUpFolder();
        }
        
				// cannot move if the target Folder is in a different account?
				// folders[0]\ == targetFolder.server
				let isMove = (!fld.locked && fld.canRename && fld.deletable
												&&
											 (fld.server.type == "pop3" || fld.server.type == "imap" || fld.server.type == "none")),
						listener = null;
        if (isCopy) isMove=false; // force copy
        
        /** **/
        QuickFolders.Util.logDebug("Calling copyFolder() on ", targetFolder);
        for (let f=0; f<folders.length; f++) {
          MailServices.copy.copyFolder(folders[f], targetFolder, isMove, listener, null);
        }
				// in case it has a Tab, fix the uri
				//  see also OnItemRemoved
				// get encoded folder Name:
        if (isMove) {
          let slash = fromURI.lastIndexOf("/"),
              encName = fromURI.substring(slash),
              newURI = targetFolder.URI + encName;
          countChanges += QuickFolders.Model.moveFolderURI(fromURI, newURI);
          // Filter Validation!
          setTimeout(function() {  
            QuickFolders.Util.validateFilterTargets(fromURI, newURI); }, 1000
          );
        }
			}
      if (countChanges) {
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });// this.updateFolders(true, true);
      }
		}
		catch(ex) {
			sPrompt = util.getBundleString("qfCantMoveFolder");
			sPrompt = sPrompt.replace("{0}", lastFolder.prettyName);
			Services.prompt.alert(null,"QuickFolders", sPrompt + "\n" + ex);
			util.logException("Exception in movefolder ", ex);
		}
	} ,

	showPalette: function showPalette(button) {
		let context = button.getAttribute("context");
		QuickFolders.Util.logDebugOptional("interface", "Interface.showPalette(" + button.id + "): context = " + context);
		this.showPopup(button, context);
	} ,

	togglePaintMode: function togglePaintMode(mode) {
		const util = QuickFolders.Util;
		let active;
		switch (mode) {
			case "on":
				active = true;
				break;
			case "off":
				active = false;
				break;
			case "toggle": default:
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
				this.CategoryBox.setAttribute("mode", active ? "paint" : "");

			if (this.CurrentFolderFilterToggleButton) {
				this.CurrentFolderFilterToggleButton.setAttribute("mode", "");
			}
			this.PaintModeActive = active;

			toolbar = this.Toolbar;
			if(active) {
				let tabColor = 1,
				    folder = util.CurrentFolder;
				if (folder) {
					let folderEntry = QuickFolders.Model.getFolderEntry(folder.URI);
					tabColor = folderEntry && folderEntry.tabColor ? folderEntry.tabColor : tabColor;
				}

				try {
					this.setButtonColor(paintButton, tabColor);
					// create context menu
					let menupopup = this.PalettePopup,
              hasPopup = false;
          // [issue 111] - Paint mode not working
          menupopup.childNodes.forEach(e => {if (e.tagName=="menuitem") hasPopup=true;} );
					if (!hasPopup) {
						util.logDebugOptional("interface","build palette menu…");
						this.buildPaletteMenu(tabColor, menupopup);
						// a menu item to end this mode
						let mItem = this.createMenuItem("qfPaint", this.getUIstring("qfPaintToggle"));
						// this.setEventAttribute(mItem, "oncommand","QuickFolders.Interface.togglePaintMode("off");");
						mItem.addEventListener("command", function(event) { QuickFolders.Interface.togglePaintMode("off"); }, false);
            mItem.className = "menuitem-iconic";
						menupopup.insertBefore(this.createIconicElement("menuseparator", "*"), menupopup.firstChild);
						menupopup.insertBefore(mItem, menupopup.firstChild);
					}
					else {
						util.logDebugOptional("interface","palette already built (firstChild exists)");
          }
          
					util.logDebugOptional("interface","initElementPaletteClass…");
					this.initElementPaletteClass(menupopup);
				}
				catch(ex) {
					util.logException("Exception during togglePaintMode(on)", ex);
				};
				toolbar.style.setProperty("cursor", "url(chrome://quickfolders/content/skin/ico/fugue-paint-cursor.png) 14 13, auto", "important"); // supply hotspot coordinates
			}
			else {
				toolbar.style.setProperty("cursor", "auto", "important");
			}
		}
		this.initHoverStyle(
		         this.getStyleSheet(document, "quickfolders-layout.css", "QuickFolderStyles"),
		         this.getStyleSheet(document, QuickFolders.Interface.PaletteStyleSheet, "QuickFolderPalettes"),
		         this.PaintModeActive);

		// set cursor!
	} ,

  updateFindBoxMenus: function updateFindBoxMenus(toggle) {
		const util = QuickFolders.Util;
    try {
      util.$("QuickFolders-quickMove-showSearch").collapsed = toggle;
      util.$("QuickFolders-quickMove-hideSearch").collapsed = !toggle;
    }
    catch (ex) {
			util.logException("Exception during updateFindBoxMenus(" + toggle + ") ", ex);
    }
  } ,

  // make a special style visible to show that [Enter] will move the mails in the list (and not just jump to the folder)
  toggleMoveModeSearchBox: function toggleMoveModeSearchBox(toggle) {
    QuickFolders.Util.logDebug("toggleMoveModeSearchBox(" + toggle + ")");
    let searchBox = QuickFolders.Interface.FindFolderBox;
		if (toggle)
			searchBox.classList.add("quickMove");
		else
			searchBox.classList.remove("quickMove");

  } ,

  quickMoveButtonClick: function quickMoveButtonClick(evt, el) {
		const QI = QuickFolders.Interface;
	  let searchBox = QI.FindFolderBox;
    if (evt.target.tagName == "menuitem") { // [issue 292] Close quickJump box after using the "="
      return;
    }
    if (searchBox && !searchBox.collapsed && evt.button==0)  { // hide only on left click
      QuickFolders.quickMove.hideSearch(); // hide search box if shown
    } else {
      if (QuickFolders.quickMove.hasMails) {
        QI.showPopup(el,"QuickFolders-quickMoveMenu");
      } else {
        QI.findFolder(true,"quickJump"); // show jump to folder box
      }
    }
  },

  readingListClick: function readingListClick(evt, el) {
    QuickFolders.Interface.showPopup(el,"QuickFolders-readingListMenu");
  },

  // remove animated icons for pro version
  removeAnimations: function removeAnimations(styleSheetName) {
    const QI = QuickFolders.Interface,
          styleEngine = QuickFolders.Styles;
    
    styleSheetName = styleSheetName || "quickfolders-layout.css";
    let ss = QI.getStyleSheet(document, styleSheetName),  // rules are imported from *-widgets.css
        iconSelector = 'menuitem.cmd[tagName="qfRegister"] .menu-iconic-icon, #QuickFolders-Pro .tab-icon';
    styleEngine.removeElementStyle(ss,
                                   iconSelector,
                                   ["animation-name", "height", "width"]);
    styleEngine.setElementStyle(ss,
                                'menuitem.cmd[tagName="qfRegister"], tab#QuickFolders-Pro',
                                "list-style-image",
                                "url('chrome://quickfolders/content/skin/ico/pro-paid.svg')",
                                true);
  } ,

	// Reimplement using messenger.menus API:
	/*
  folderPanePopup: function(evt) {
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
      util.logDebug("folderPanePopup() failed:" + ex);
    }
  } ,
	*/

  toggleFolderTree: function toggleFolderTree() {
    goDoCommand("cmd_toggleFolderPane");
  } ,

	clickTitleLabel: function(btn) {
    if (QuickFolders.Preferences.getBoolPref("hasNews")) {
      QuickFolders.Interface.viewSplash();
      QuickFolders.Preferences.setBoolPref("hasNews", false); // reset
      // send a notification to update all windows!
      QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFoldersLabel" }); 
    }
		else if (QuickFolders.Util.licenseInfo.isExpired) {
			if (!QuickFolders.Util.licenseInfo.isLicenseViewed) {
				QuickFolders.Util.licenseInfo.isLicenseViewed = true; // session variable to mark license stuff as "seen".
				QuickFolders.Util.notifyTools.notifyBackground({ func: "updateQuickFoldersLabel"}); 
			}		
			QuickFolders.Interface.showLicenseDialog("mainLabelRenewal");
		}
		else { // get context Menu as normal
			QuickFolders.Interface.showPopup(btn, "QuickFolders-ToolbarPopup");
		}
	} ,

	removeLastPopup: function(p, theDoc) {
		if (!p) return;
		QuickFolders.Util.logDebugOptional("dnd",`removeLastPopup(${p})`);
		let popup = theDoc.getElementById(p);
		if (popup) {
			try {
        popup.hidePopup(); // parentNode.removeChild(popup)
				QuickFolders.Util.logDebugOptional("dnd", "removed popup:" + p );
			}
			catch (e) {
				QuickFolders.Util.logDebugOptional("dnd", "removing popup:  [" + p.toString() + "]  failed!\n" + e + "\n");
			}
		}
		else {
			QuickFolders.Util.logDebugOptional("dnd", "removeLastPopup could not find element: " + p);
		}
		if (p === QuickFolders_globalHidePopupId) {
			QuickFolders_globalHidePopupId = "";
		}
	}	,
  
  showLicenseDialog: function showLicenseDialog(featureName) {
		let params = {
      inn:{
        referrer: featureName, 
        instance: QuickFolders   // Why? should this be the main interface? make obsolete!
      }, 
      out:null
    };
    let win = window;
    if (win.closed) { // notifications caused by a close parent window will fail!
      win = quickFilters.Util.getMail3PaneWindow();
    }    
    win.openDialog("chrome://quickfolders/content/register.xhtml",
      "quickfolders-register","chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply",
      QuickFolders,
      params).focus();
  } , 
  
  // build a help panel for the quickMove panel
  quickMoveHelp: function (el) {
    function createSyntaxNode(txt) {
      let c = document.createElement("code");
      c.textContent = txt;
      return c;
    }
    let found = document.getElementById("quickMoveHelp");
    if (found) QuickFolders.Interface.quickMoveHelpRemove(); // remove last help panel!
    
    const util = QuickFolders.Util;
    
    // consider using document.createFragment
    let container = document.createElement("div");
    container.id = "quickMoveHelpOverlay";
    container.classList.add("overlay");
    
    let box = document.createElement("div");
    box.id = "quickMoveHelp";
    box.classList.add("popup");
    
    let searchBox = document.getElementById("QuickFolders-FindFolder"),
        rect = searchBox.getBoundingClientRect(); // was el.
    box.style.marginLeft = rect.left.toString() + "px";
    box.style.marginTop = rect.bottom.toString() + "px";
    
    // heading
    let h = document.createElement("h3");
    h.textContent = util.getBundleString("quickMove.help.head").replace("{1}", "quickMove / quickJump");
    box.appendChild(h);
    
    // close button
    let a = document.createElement("a");
    a.classList.add("close");
    a.textContent = "x"; // &times;
    box.appendChild(a);
    a.addEventListener("click", async (event) => {
      QuickFolders.Interface.quickMoveHelpRemove();
    });
    
    // list of syntactical characters
    let ul = document.createElement("ul");
    let l1 = document.createElement("li");
    l1.appendChild(document.createTextNode(util.getBundleString("quickMove.help.l1a")));
    l1.appendChild(document.createElement("br"));
    l1.appendChild(document.createTextNode(" " + util.getBundleString("quickMove.help.l1b") + " "));
    l1.appendChild(createSyntaxNode("_"));
    l1.appendChild(createSyntaxNode("."));
    l1.appendChild(createSyntaxNode("-"));
    l1.appendChild(createSyntaxNode("+"));
    l1.appendChild(createSyntaxNode("&"));
    l1.appendChild(createSyntaxNode("@"));
    ul.appendChild(l1);
    
    let l2 = document.createElement("li");
    let txt = util.getBundleString("quickMove.help.l2a");
    l2.insertAdjacentHTML("beforeend", txt.replace("{1}","<code>/</code>")); 
    
    l2.appendChild(document.createElement("br"));
    l2.appendChild(document.createTextNode(util.getBundleString("quickMove.help.l2b")));
    ul.appendChild(l2);
    
    let l3 = document.createElement("li");
    txt = util.getBundleString("quickMove.help.l3a");
    l3.insertAdjacentHTML("beforeend", txt.replace("{1}","<code>&gt;</code>"));
    l3.appendChild(document.createElement("br"));
    l3.appendChild(document.createTextNode(util.getBundleString("quickMove.help.l3b")));
    ul.appendChild(l3);
    
    let l4 = document.createElement("li");
    txt = util.getBundleString("quickMove.help.l4a");
    l4.insertAdjacentHTML("beforeend", txt.replace("{1}","<code>=</code>"));
    ul.appendChild(l4);

    box.appendChild(ul);
    
    // 
    let h2 = document.createElement("h3");
    h2.textContent = util.getBundleString("quickMove.help.head.advanced");
    box.appendChild(h2);
    
    let p =  document.createElement("p");
    p.textContent = util.getBundleString("quickMove.help.advanced");
    box.appendChild(p);
    
    
    container.appendChild(box);
    let mBox = document.getElementById("tabmail-container");
    mBox.appendChild(container);
    container.style.setProperty("visibility","visible");
    
  } ,

  quickMoveHelpRemove: function() {
    let overlay = document.getElementById("quickMoveHelpOverlay");
    if (overlay) overlay.parentNode.removeChild(overlay);
  } ,
  
  // moved from QuickFolders.Options!
  showAboutConfig: function(clickedElement, filter, readOnly, updateUI = false) {
    const name = "Preferences:ConfigManager",
          Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util;
    let mediator = Services.wm,
        isTbModern = util.versionGreaterOrEqual(util.Appversion, "85"),
        uri = (isTbModern) ? "about:config": "chrome://global/content/config.xhtml?debug";
    
    let w = mediator.getMostRecentWindow(name), win;
    if (clickedElement) {
      win = (clickedElement && clickedElement.ownerDocument && clickedElement.ownerDocument.defaultView)
          ? clickedElement.ownerDocument.defaultView 
          : window; // parent window
    }
    else {
      // how to get last options.html window?
      // win = mediator.getMostRecentWindow(name); 
      win = null;
    }

    if (!w) {
      let watcher = Services.ww,
          width = "750px",
          height = "350px",
          features = `alwaysRaised,dependent,centerscreen,chrome,resizable,width=${width},height=${height}`;
      if (util.HostSystem == 'winnt') {
        w = watcher.openWindow(win, uri, name, features, null);
			} else {
        w = (win || window).openDialog(uri, name, features);
			}
    }
    if (updateUI) {
      // make sure QuickFolders UI is updated when about:config is closed.
      w.addEventListener('unload', function(event) { 
        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: false }); 
      });
    }
    w.focus();
    w.addEventListener('load', 
      function () {
        let id = (isTbModern) ? "about-config-search" : "textbox";
        let flt = w.document.getElementById(id);
        if (flt) {
           flt.value=filter;
          // make filter box readonly to prevent damage!
           if (!readOnly)
            flt.focus();
           else
            flt.setAttribute('readonly',true);
           if (w.self.FilterPrefs) {
            w.self.FilterPrefs();
          }
        }
      });
  },
  
  pasteFolderEntriesFromClipboard: function () {
    // originally this was located in QF.options.pasteFolderEntries
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
        str       = {},
        strLength = {},
        strFoldersPretty = '';

    util.popupRestrictedFeature("pasteFolderEntries", "", 2); // standard feature
    if (!util.hasValidLicense()) return;
        
    trans.init(null);
    trans.addDataFlavor("text/unicode");
    trans.addDataFlavor("text/plain");
    
    if (Services.clipboard) {
      Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
			trans.getTransferData("text/plain", str, strLength);
		}
    
    
    if (str && str.value) { // make sure object is not empty
      let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data;
      strFoldersPretty = pastetext.toString();
    }
    try {
      let folders = strFoldersPretty.replace(/\r?\n|\r/, ''),
          entries = JSON.parse(folders),
          question = util.getBundleString("qf.prompt.pasteFolders");
      if (Services.prompt.confirm(window, "QuickFolders", question.replace("{0}", entries.length))) {
        QuickFolders.Model.correctFolderEntries(entries, false);
        for (let i = 0; i < entries.length; i++) {
          if (typeof entries[i].tabColor ==='undefined' || entries[i].tabColor ==='undefined')
            entries[i].tabColor = 0;
          // default the name!!
          if (!entries[i].name) {
            // retrieve the name from the folder uri (prettyName)
            let f = QuickFolders.Model.getMsgFolderFromUri(entries[i].uri, false);
            if (f) {
              entries[i].name = f.prettyName;
            }
          }
        }
        if (!entries.length)
          entries=[];
        util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(entries);
        question = util.getBundleString("qf.prompt.pasteFolders.confirm");
        if (Services.prompt.confirm(window, "QuickFolders", question)) {
          // store
          prefs.storeFolderEntries(entries);
          // tell all windows!
          QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });
        }
        else {
          // roll back
          util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
        }
        
      }
    }
    catch (ex) {
      util.logException("Error in QuickFolders.Util.pasteFolderEntries():\n", ex);
      Services.prompt.alert(null, "QuickFolders", QuickFolders.Util.getBundleString("qf.alert.pasteFolders.formatErr"));
    }
  },
  
  copyFolderEntriesToClipboard: function() {
    // originally this was located in QF.options.copyFolderEntries
    // debug function for checking users folder string (about:config has trouble with editing JSON strings)
    const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util;

    try {
      let clipboardhelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper),
          sFolderString = Services.prefs.getStringPref("QuickFolders.folders");

      util.logToConsole("Folder String: " & sFolderString);
      try {
        // format the json
        let prettyFolders = JSON.stringify(JSON.parse(sFolderString), null, '  '); 
        clipboardhelper.copyString(prettyFolders);
      }
      catch (e) {
        util.logException("Error prettifying folder string:\n", e);
        clipboardhelper.copyString(sFolderString);
      }
      let out = util.getBundleString("qfAlertCopyString"),
          mail3PaneWindow = util.getMail3PaneWindow();
      
      if (mail3PaneWindow && mail3PaneWindow.QuickFolders) {
        out += " [" + mail3PaneWindow.QuickFolders.Model.selectedFolders.length + " tabs]";
      }
      //alert(out);
      Services.prompt.alert(null,"QuickFolders",out);
    }
    catch(e) {
      //alert(e);
      Services.prompt.alert(null,"QuickFolders",e);
    }
  },
 
  copyCurrentFolderInfo: function() {
    try {
      let folder = QuickFolders.Util.CurrentFolder;
      let clipboardhelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
      let account = (MailServices.accounts.FindAccountForServer || MailServices.accounts.findAccountForServer)(folder.server).key;
      let txt = `Folder ${folder.prettyName}\n`
        + `On ${account}\n`
        + `URI: ${folder.URI}`;
      clipboardhelper.copyString(txt);
      let msg = `Folder information for ${folder.prettyName} was copied to clipboard!`;
      console.log(msg + "\n" + txt);
      Services.prompt.alert(null,"QuickFolders",msg);
    }
    catch(ex) {
      QuickFolders.Util.logException("QuickFolders.Interface.copyCurrentFolderInfo failed", ex);
    }
  }
  

}; // Interface


