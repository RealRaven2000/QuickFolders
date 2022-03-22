"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


QuickFolders.Interface = {
	PaintModeActive: false,
	buttonsByOffset: [],
	menuPopupsByOffset: [],

	get verticalMenuOffset() { return this._verticalMenuOffset; },
	set verticalMenuOffset(o) { this._verticalMenuOffset = o; QuickFolders.Preferences.setIntPref("debug.popupmenus.verticalOffset", o)},
	get CategoryBox() { return  QuickFolders.Util.$("QuickFolders-Category-Box"); },
	get FilterToggleButton() { return QuickFolders.Util.$("QuickFolders-filterActive"); },
	get CurrentFolderTab() {
    // retrieves the Visible current folder tab - might have to move it in Tb for conversation view
    return QuickFolders.Util.$("QuickFoldersCurrentFolder");
  },
	get CurrentFolderRemoveIconBtn() { return QuickFolders.Util.$("QuickFolders-RemoveIcon");},
  get CurrentFolderSelectIconBtn() { return QuickFolders.Util.$("QuickFolders-SelectIcon");},
	get CurrentFolderBar() { return QuickFolders.Util.$("QuickFolders-CurrentFolderTools");},
	get CurrentFolderFilterToggleButton() { return QuickFolders.Util.$("QuickFolders-currentFolderFilterActive"); },
	get CogWheelPopupButton () { return QuickFolders.Util.$("QuickFolders-mainPopup"); },
	get QuickMoveButton () { return QuickFolders.Util.$("QuickFolders-quickMove"); },
  get ReadingListButton () { return QuickFolders.Util.$("QuickFolders-readingList"); },
	get CategoryMenu() { return QuickFolders.Util.$("QuickFolders-Category-Selection"); },
	get PaintButton() { return QuickFolders.Util.$("QuickFolders-paintBucketActive"); },
	get MailButton() { return QuickFolders.Util.$("QuickFolders-CurrentMail"); },
	get TitleLabel() { return QuickFolders.Util.$("QuickFolders-title-label"); },
	get TitleLabelBox() { return QuickFolders.Util.$("QuickFolders-LabelBox"); },
	get FoldersBox() { return QuickFolders.Util.$("QuickFolders-FoldersBox"); },
	get Toolbar() { return QuickFolders.Util.$("QuickFolders-Toolbar"); },
	get PalettePopup() { return QuickFolders.Util.$("QuickFolders-PalettePopup");},
	get FindFolderBox() { return QuickFolders.Util.$("QuickFolders-FindFolder");},
  get FindFolderHelp() { return QuickFolders.Util.$("QuickFolders-FindFolder-Help");},

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
  
  
  //returns full path of quickfolders-palettes.css
	get PaletteStyleSheet() {
		return "/toolbar/css/quickfolders-palettes.css"; // or possibly "css/quickfolders-palettes.css"
	} ,  


	getUIstring: function getUIstring(id, substitions) {
    return QuickFolders.Util.getBundleString(id, substitions);
	},


////// 225
	createRecentPopup: function createRecentPopup(passedPopup, isDrag, isCreate, popupId) {
    let menupopup = null;
    QuickFolders.Util.logDebug("TO DO (mx): createRecentPopup() ");
		return menupopup;
	} ,

//////278
	createRecentTab: function createRecentTab(passedPopup, isDrag, passedButton) {
		try {
			QuickFolders.Util.logDebugOptional("recentFolders","createRecentTab( "
				+ " passedPopup: " + (passedPopup == null ? "null" : passedPopup.id)
				+ ", isDrag: " + isDrag
				+ ", passedButton: " + (passedButton == null ? "null" : passedButton.id)
				+ ")");
			let isFolderUpdate = false, //	need this to know if we are creating a fresh button (true) or just rebuild the folders menu on click/drag (false)
			    isCurrentFolderButton = (passedButton == null ? false : (passedButton.id=="QuickFolders-Recent-CurrentFolderTool")),
			    button = passedButton || document.createElement("button") ;
			if (!passedButton) {
				isFolderUpdate = true;
				let recentLabel = QuickFolders.Preferences.getBoolPref("recentfolders.showLabel") ? this.getUIstring("qfRecentFolders") : "";
        button.textContent = recentLabel;
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
      
      if (menupopup) {
        // [issue 76] - removing firstChild was incorrect in Tb78.
        let menuchildren = button.querySelectorAll("#" + menupopup.id);
        menuchildren.forEach(el => button.removeChild(el))

        button.appendChild(menupopup);
      }

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


	updateQuickFoldersLabel: function updateQuickFoldersLabel() {
    const prefs = QuickFolders.Preferences,
					util = QuickFolders.Util;
		// force label when there are no folders or license is in expired state!
		try {
      util.logDebug("updateQuickFoldersLabel()");
      debugger;
			let showLabelBox = prefs.isShowQuickFoldersLabel || QuickFolders.Util.licenseInfo.isExpired  || (0==QuickFolders.Model.selectedFolders.length),
					quickFoldersLabel = this.TitleLabel,
					qfLabelBox = this.TitleLabelBox;

			quickFoldersLabel.label = prefs.TextQuickfoldersLabel;
			quickFoldersLabel.collapsed = !showLabelBox; // force Renew QuickFolders to be visible!
      if (prefs.getBoolPref("hasNews")) {
				quickFoldersLabel.classList.add("newsflash");
				quickFoldersLabel.setAttribute("tooltiptext", "Show the Splash screen once!");
      }
			else if (QuickFolders.Util.licenseInfo.isExpired) {
				quickFoldersLabel.classList.add("expired");
				let txtExpired =
				  util.getBundleString("qf.premium.renewLicense.tooltip").replace("{1}", QuickFolders.Util.licenseInfo.expiredDays);
				quickFoldersLabel.setAttribute("tooltiptext", txtExpired);
			}
			else {
				quickFoldersLabel.removeAttribute("tooltiptext");
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

	updateFolders: async function updateFolders(rebuildCategories, minimalUpdate) {
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

		let sDebug = "updateFolders(rebuildCategories: " + rebuildCategories + ", minimal: " + minimalUpdate +")",
		    toolbar = this.Toolbar,
		    theme = prefs.CurrentTheme;
		toolbar.className = theme.cssToolbarClassName; //  + " chromeclass-toolbar" [Bug 26612]
    toolbar.classList.add("contentTabToolbar"); // Linux

		this.FoldersBox.className = "folderBarContainer " + theme.cssToolbarClassName; // [Bug 26575]

		if (QuickFolders.Model.selectedFolders.length)
			sDebug += " - Number of Folders = " + QuickFolders.Model.selectedFolders.length;

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
        debugger; // mx //
				let rtab = QuickFolders.Interface.createRecentTab(null, false, null);
				if (rtab) {
					QuickFolders.Interface.FoldersBox.appendChild(rtab);
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
          
          
      debugger; // mx //
			for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
				let folderEntry = QuickFolders.Model.selectedFolders[i],
				    folder, button;

				if (!this.shouldDisplayFolder(folderEntry))
					continue;

				folder = await QuickFolders.Model.getMsgFolderFromEntry(folderEntry, false);
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
			if (invalidCount)
				util.logDebug("{0} invalid tabs where found!\n Please check with find orphaned tabs tool.".replace("{0}", invalidCount));
		}
    else { // no tabs defined : add instructions label
      let existingLabel = this.FoldersBox.querySelector("#QuickFolders-Instructions-Label");
      if (!existingLabel) {
        let label = document.createElement("label"),
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

		// current message dragging
		let button = this.MailButton;
		if (button)
			this.setEventAttribute(button, "ondragstart","QuickFolders.messageDragObserver.startDrag(event,true)");

		// current thread dragging; let's piggyback "isThread"...
		// use getThreadContainingMsgHdr(in nsIMsgDBHdr msgHdr) ;
		button = util.$("QuickFolders-CurrentThread");
		if (button)
			this.setEventAttribute(button, "ondragstart","event.isThread=true; QuickFolders.messageDragObserver.startDrag(event,true)");
		if (prefs.isShowCategoryNewCount) {

		}
	} ,

  updateAllTabs: function () {
    QuickFolders.initTabsFromEntries(QuickFolders.Preferences.loadFolderEntries());
    //mx// QuickFolders.Interface.updateFolders(true, false);
  },
  
  // more comprehensive function to update both folder look and all styles (will be called from Options dialog via event listener)
  updateFoldersUI: async function () {
    QuickFolders.Util.logDebug("updateFoldersUI()...");
    await QuickFolders.Interface.updateFolders(true, false);
		QuickFolders.Interface.updateUserStyles();
  },
  
	updateNavigationBar: function updateNavigationBar(styleSheet) {
    QuickFolders.Util.logToConsole("// mx // TO DO: implement updateNavigationBar");
	} ,
  
  updateCategoryLayout: function updateCategoryLayout() {
    QuickFolders.Util.logToConsole("// mx // TO DO: implement updateCategoryLayout");
  },
  
  updateCategories: function updateCategories() {
    QuickFolders.Util.logToConsole("// mx // TO DO: implement updateCategories");
  },
  
  updateMainWindow: function updateMainWindow(minimal) {
    QuickFolders.Util.logToConsole("// mx // TO DO: implement updateMainWindow");
  },
  
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
			if (v!=null)
				QuickFolders.Preferences.lastActiveCats = v; // store in pref
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

	// this is used on session restore currently only by Postbox
	restoreCategories: function restoreCategories(tabIndex, categories) {
    const util = QuickFolders.Util;
		let tabmail = document.getElementById("tabmail"),
		    info = util.getTabInfoByIndex(tabmail, tabIndex);
		info.QuickFoldersCategory = categories;
		let tab = tabmail.selectedTab;
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
	selectCategory: async function (categoryName, rebuild, dropdown, event) {
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
		await QI.updateFolders(rebuild, false);
    // ###################################
    QI.lastTabSelected = null;
    await QI.onTabSelected(); // update selected tab?
    // this.styleSelectedTab(selectedButton);

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
			idx = QuickFolders.tabContainer.selectedIndex || 0;
			// let's only store this if this is the first tab...
			let tab = util.getTabInfoByIndex(tabmail, idx), // in Sm, this can return null!
			    tabMode = util.getTabMode(tab);
			if (tab &&
			    (tabMode == "folder" || tabMode == "message")) {
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

///// 1406  

///// 1687
	getButtonByFolder: function getButtonByFolder(folder) {
    try {
      let button = this.buttonsByOffset.find(
        e => e.folder && 
        e.folder.accountId == folder.accountId && 
        e.folder.path == folder.path
      );
        
			if(button) {
        return button;
      }
    }
    catch(e) {
      QuickFolders.Util.logDebug("getButtonByFolder: could not match - error: ", folder, e);
    }

		return null;
	} ,


///// 1897  
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
    return "QuickFolders-folder-popup-" + (buttonId || folder ? folder.URI : this.IdUnique); // + "-" + this.IdUnique;
  },
  
///// 1978  
	addFolderButton: function addFolderButton(folder, entry, offset, theButton, buttonId, fillStyle, isFirst, isMinimal) {
		const QI = QuickFolders.Interface,
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences;
		let tabColor =  (entry && entry.tabColor) ? entry.tabColor : null,
		    tabIcon = (entry && entry.icon) ? entry.icon : "",
        useName = (entry && entry.name) ? entry.name : "",
				stats = { unreadTotal:0, unreadSubfolders:0, totalCount:0 },
		    label = this.getButtonLabel(folder, useName, offset, entry, stats);

    if (!folder && !isMinimal) {
      util.logToConsole("Error in addFolderButton: " + "folder parameter is empty!\n"
                        + "Entry: " + (entry ? (entry.name || label) : (" invalid entry: " + label)));
    }
    try {
			let isMsgFolder = folder && (folder.accountId && folder.path);
			
      // mx // TO DO: icon implementation - can't use folder.getStringProperty("folderIcon")
    }
    catch(ex) {
      util.logToConsole("Error in addFolderButton: " + "folder getStringProperty is missing.\n"
                        + "Entry: " + (entry ? entry.name : " invalid entry") + "\n"
                        + "path: " + (folder.path || "missing"));
      util.logException("Error in addFolderButton", ex);
    }
    if (!theButton) isMinimal=false; // if we create new buttons from scratch, then we need a full creation including menu

		util.logDebugOptional("interface.tabs", "addFolderButton() label=" + label + ", offset=" + offset + ", col=" + tabColor + ", id=" + buttonId + ", fillStyle=" + fillStyle);
		let button = (theButton) ? theButton : document.createElement("button"); // create the button!
    button.textContent = label;
		// button.setAttribute("label", label);

		// find out whether this is a special button and add specialFolderType
		// for (optional) icon display
		let specialFolderType="",
		    sDisplayIcons = (prefs.isShowToolbarIcons) ? " icon": "",
        // if the tab is colored, use the new palette setting "ColoredTab"
        // if it is uncolored use the old "InActiveTab"
		    paletteClass = (tabColor!="0") ? this.getPaletteClass("ColoredTab") : this.getPaletteClass("InactiveTab");
    if (entry && entry.customPalette)
      paletteClass = this.getPaletteClassToken(entry.customPalette);

		// use folder flags instead!
		if (folder) {
      
      switch (folder.type) {
        case "inbox": specialFolderType="inbox" + sDisplayIcons; break;
        case "sent": specialFolderType="sent" + sDisplayIcons; break;
        case "trash": specialFolderType="trash" + sDisplayIcons; break;
        case "junk": specialFolderType="junk" + sDisplayIcons; break;
        case "templates": specialFolderType="template" + sDisplayIcons; break;
        case "outbox": specialFolderType="outbox" + sDisplayIcons; break;
        case "drafts": specialFolderType="draft" + sDisplayIcons; break;
        case "news": case "newsgroups": 
          specialFolderType="news" + sDisplayIcons; 
          break;
        case "archive": specialFolderType="archive" + sDisplayIcons; break;
        case "virtual": specialFolderType="virtual" + sDisplayIcons; break;
        default: 
          specialFolderType="icon";
          break;
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
								QI.showPopup(button,popupId,event);
								event.preventDefault();
								event.stopPropagation();
							}
						}, false);
					button.hasClickEventListener = true;
					this.setEventAttribute(button, "ondragstart","QuickFolders.buttonDragObserver.startDrag(event, true)");
					this.setEventAttribute(button, "ondragleave","QuickFolders.buttonDragObserver.dragExit(event, true)");
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
			  let sep = this.createIconicElement("toolbarseparator","*");
			  this.FoldersBox.appendChild(sep);
			}
			this.FoldersBox.appendChild(button);
			if (folder) {
        // in Tb78, they use gFolderTreeView._onDragDrop, gFolderTreeView._onDragStart, gFolderTreeView._onDragOver
        // these are defined in mail/base/content/folderPane.js
				this.setEventAttribute(button, "ondragenter", "QuickFolders.buttonDragObserver.dragEnter(event);");
				this.setEventAttribute(button, "ondragover", "QuickFolders.buttonDragObserver.dragOver(event);");
				this.setEventAttribute(button, "ondrop", "QuickFolders.buttonDragObserver.drop(event);");
				this.setEventAttribute(button, "ondragleave", "QuickFolders.buttonDragObserver.dragExit(event);");
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
			this.setEventAttribute(button, "ondragleave","QuickFolders.buttonDragObserver.dragExit(event)");
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
  
///// 2193  
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

		QuickFolders.Util.logDebugOptional("buttonStyle","styleFolderButton(" + button.textContent
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

  
///// 2272  
  addCustomStyles: function addCustomStyles(button, entry) {
		const util = QuickFolders.Util;
    function getLabel(button) {
      let anonChildren = util.getAnonymousNodes(document,button); // button  ? button.getElementsByAttribute("class", "toolbarbutton-text") : null;
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

///// 2339
	onButtonClick: function onButtonClick(button, evt, isMouseClick) {
    let util = QuickFolders.Util,
        QI = QuickFolders.Interface;
		util.logDebugOptional("mouseclicks","onButtonClick - isMouseClick = " + isMouseClick);
		// this may happen when we right-click the menu with CTRL
		try {
			let el = button; // .QueryInterface(Components.interfaces.nsIDOMXULControlElement);
			if (el.tagName == "menuitem" && button.parentElement.getAttribute("tag") == "quickFoldersCommands") {
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
			if (button.folder === util.CurrentFolder & QI.CurrentTabMode != "message") {
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
					debugger;
					QuickFolders_MySelectFolder(uri);
				}
			}
		}
	} ,



///// 3729
	addPopupSet: function addPopupSet(popupSetInfo) {
    QuickFolders.Util.logToConsole("// mx // TO DO: implement addPopupSet()");
    // mx //TO DO:
    let folder = popupSetInfo.folder,
        popupId = popupSetInfo.popupId,
        entry = popupSetInfo.entry;  
    // .... ///
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

///// 5308
  getCurrentTabMailFolder: async function() {
    let folder = null,
        util = QuickFolders.Util;
    let currentTab = await browser.tabs.getCurrent(); // not working from HTML content!! we need to ask a background script.
    /*
    let info = util.getTabInfoByIndex(tabmail, QuickFolders.tabContainer.selectedIndex);
    tabMode = util.getTabMode(info);
    // single message mode
    if (tabMode == "message") {
      let msg = info.messageDisplay.displayedMessage;
      if (msg) {
        folder = msg.folder;
      }
      if (folder) {
        QuickFolders.Util.logDebugOptional("mailTabs", "getCurrentTabMailFolder() returns displayed message folder: " + folder.prettyName);
        return folder;
      }
    }   
    let fD = info.folderDisplay;
    if (fD && fD.view && fD.view.displayedFolder)  // Tb
      folder = fD.view.displayedFolder
      */
    folder = await QuickFolders.Util.getCurrentFolder();
    return folder;
  },


///// 5336
	// passing in forceButton is a speed hack for SeaMonkey:
  // return current folder to save processing time
	onTabSelected: async function onTabSelected(forceButton, forceFolder) {
		let folder, selectedButton,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface,
				prefs = QuickFolders.Preferences; // let's not use _this_ in an event function
		try  {

      // used to be: GetFirstSelectedMsgFolder() - but doesn't work in Sm
      if (forceButton)
        folder = forceButton.folder;
      else if (forceFolder)
        folder = forceFolder;
      else
        folder = await QI.getCurrentTabMailFolder();

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
    return folder;
	} ,


  
///// 5608  
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
  
///// 5629  
	setButtonColor: function setButtonColor(button, col, dontStripe) {
		// no more style sheet modification for settings colors.
		if (!button)
			return false;
		let folderLabel = button.textContent, // fixes disappearing colors on startup bug
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

  
////// 5894
  
  // problem - we cannot add a title attribute in HTML
	getStyleSheet: function getStyleSheet(engine, Name, Title) {
		let sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title); // ignore engine
		if (!sheet) {
			QuickFolders.Interface.ensureStyleSheetLoaded(Name, Title);
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
		}

		if (!sheet) {
			sheet = QuickFolders.Styles.getMyStyleSheet(Name, Title);
			QuickFolders.Util.logToConsole("ensureStyleSheetLoaded() - missing style sheet '" +  Name + "' - not found = not attempting any style modifications.");
		}
		return sheet;
	} ,
  
	// HOVER STATE
	initHoverStyle: async function initHoverStyle(ss, ssPalettes, isPaintMode) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		let templateTabClass =  isPaintMode ? "ColoredTab" : "HoveredTab",
		    paletteClass = this.getPaletteClassCss(templateTabClass);
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initHoverStyle()  PaintMode=" + isPaintMode + "   paletteClass=" + paletteClass);
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    hoverBackColor = await prefs.getUserStyle("HoveredTab","background-color","#F90"),
		    tabStyle = prefs.ColoredTabStyle,
		    noColorClass = (tabStyle != prefs.TABS_STRIPED) ? "col0" : "col0striped",
		    hoverColor = await prefs.getUserStyle(templateTabClass, "color", "#000000"),
        avoidCurrentFolder = ":not(#QuickFoldersCurrentFolder)";

		// default hover colors: (not sure if we even need them during paint mode)
		engine.setElementStyle(ss, ".quickfolders-flat button:hover","background-color", hoverBackColor,true);
		engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + ":hover","background-color", hoverBackColor,true);
    engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + ":hover .toolbarbutton-text","color", hoverColor, true); // [issue 81] - add selector for label
    engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + ":hover .toolbarbutton-icon","color", hoverColor, true); // [issue 81] - add selector for icon

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
			engine.setElementStyle(ss, ".quickfolders-flat button"  + ":hover", "background-image", hoverGradient, true); // [class^="col"]
			engine.setElementStyle(ss, ".quickfolders-flat button"  + "." + noColorClass + ":hover", "background-image", hoverGradient, true);

			// picked hover color (from paint mode)
			//let hc = engine.getElementStyle(ssPalettes, ruleName, "color");
			//hoverColor = hc ? hc : hoverColor;
      // tb + avoidCurrentFolder
			engine.setElementStyle(ss, ".quickfolders-flat button:hover","color", hoverColor, true);
			engine.setElementStyle(ss, '.quickfolders-flat button[buttonover="true"]',"color", hoverColor, true);
		}
		else { // two color mode
			QuickFolders.Util.logDebugOptional("interface.buttonStyles", "Configure Plain backgrounds…");
			engine.setElementStyle(ss, ".quickfolders-flat button" + paletteClass + ":hover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat button" + paletteClass + "." + noColorClass + ":hover", "background-image", "none", true);
			if (tabStyle == prefs.TABS_STRIPED) {
				engine.setElementStyle(ss, ".quickfolders-flat button:hover","color", hoverColor ,true);
			}
			engine.setElementStyle(ss, ".quickfolders-flat button:hover","color", hoverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + '[buttonover="true"]',"color", hoverColor ,true);
			// full monochrome background
			engine.setElementStyle(ss, ".quickfolders-flat button:hover","background-color", hoverBackColor,true);
		}
	} ,

	// DRAGOVER STATE
	initDragOverStyle: async function initDragOverStyle(ss, ssPalettes) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initDragOverStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
		    // let dragOverColor = engine.getElementStyle(ssPalettes, ruleName, "color");
		    dragOverColor = await prefs.getUserStyle("DragTab","color","White");
		engine.setElementStyle(ss, ".quickfolders-flat button.dragover","background-color", await prefs.getUserStyle("DragTab","background-color","#E93903"),true);
    let noColorClass = "col0"; // ####
    engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + ".dragover","color", dragOverColor, true); // ####

		if (prefs.getIntPref("style.DragOver.paletteType")) {
			let paletteClass = this.getPaletteClassCss("DragOver"),
			    paletteEntry = prefs.getIntPref("style.DragOver.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    dragOverGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			
			engine.setElementStyle(ss, ".quickfolders-flat button.dragover", "background-image", dragOverGradient, true);
			engine.setElementStyle(ss, ".quickfolders-flat button" + paletteClass + ".dragover","color", dragOverColor, true);
			engine.setElementStyle(ss, ".quickfolders-flat button" + paletteClass + '[buttonover="true"]',"color", dragOverColor, true);
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat button.dragover", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat button.dragover","color", dragOverColor,true);
		}
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
  
	getPaletteClassCss: function getPaletteClassCss(tabStateId) {
		let cl = this.getPaletteClass(tabStateId);
		return cl.replace(" ", ".");
	} ,
  
	getPaletteClass: function(tabStateId) {
	  let paletteType =  QuickFolders.Preferences.getIntPref("style." + tabStateId + ".paletteType");
		switch (paletteType) {
		  case -1:
			  if (tabStateId == "InactiveTab") {
					return "";  // error
				}
				else { // get from global tab style!
					return  this.getPaletteClass("InactiveTab");
				}
				break;
			default:
				return  this.getPaletteClassToken(paletteType);
		}
		return "";
	} ,

	getPaletteClassToken: function(paletteType) {
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
	initSelectedFolderStyle: async function initSelectedFolderStyle(ss, ssPalettes, tabStyle) {
	  if (ssPalettes == null)
		  ssPalettes = ss;
		QuickFolders.Util.logDebugOptional("interface.buttonStyles", "initSelectedFolderStyle()");
		let engine = QuickFolders.Styles,
		    colActiveBG = await QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight"),
		    selectedColor = await QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),
		    globalPaletteClass = this.getPaletteClassCss("InactiveTab"),
        paletteClass = this.getPaletteClassCss("ActiveTab"),
        coloredPaletteClass = this.getPaletteClassCss("ColoredTab");

		if (QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteType")) {
			let paletteEntry = await QuickFolders.Preferences.getIntPref("style.ActiveTab.paletteEntry"),
			    ruleName = ".quickfolders-flat " + paletteClass + ".col" + paletteEntry,
			    selectedGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			// selectedColor = engine.getElementStyle(ssPalettes, ruleName, "color"); // make this overridable!
			// we do not want the rule to containg the paletteClass because it has to always work!
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", selectedGradient, true);
		}
		else { // two colors mode
			engine.setElementStyle(ss, ".quickfolders-flat " + ".selected-folder", "background-image", "none", true);
			engine.setElementStyle(ss, ".quickfolders-flat button.selected-folder","background-color", colActiveBG, true);
		}
    // style label and image (to also overwrite theme color for svg icons)
    engine.removeElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color");  
    engine.setElementStyle(ss, ".quickfolders-flat .selected-folder > *:not(menupopup)", "color", selectedColor,true);
	} ,

	// INACTIVE STATE (DEFAULT)
	initDefaultStyle: async function initDefaultStyle(ss, ssPalettes, tabStyle) {
		const util = QuickFolders.Util;
	  if (ssPalettes == null)
		  ssPalettes = ss;
		util.logDebugOptional("interface.buttonStyles", "initDefaultStyle()");
		let engine = QuickFolders.Styles,
        prefs = QuickFolders.Preferences,
        inactiveGradientColor = null,
		    inactiveBackground = util.getSystemColor(await prefs.getUserStyle("InactiveTab","background-color","ButtonFace")),
		    inactiveColor = util.getSystemColor(await prefs.getUserStyle("InactiveTab","color","black")),
		    paletteClass = this.getPaletteClassCss("InactiveTab"),
    // only plastic & pastel support striped style:
        isTabsStriped = (tabStyle == prefs.TABS_STRIPED) && prefs.getIntPref("style.InactiveTab.paletteType")<3,
		    noColorClass = (isTabsStriped) ? "col0striped" : "col0",
		    avoidCurrentFolder = ""; // = ':not(#QuickFoldersCurrentFolder)'; // we omit paletteClass for uncolored tabs:

		// transparent buttons: means translucent background! :))
		if (prefs.getBoolPref("transparentButtons"))
			inactiveBackground = util.getRGBA(inactiveBackground, 0.25) ;

		engine.setElementStyle(ss, ".quickfolders-flat button","background-color", inactiveBackground, true);
		engine.setElementStyle(ss, ".quickfolders-flat button#QuickFoldersCurrentFolder","background-color", inactiveBackground, true);

		// INACTIVE STATE (PALETTE) FOR UNCOLORED TABS ONLY
		// LETS AVOID !IMPORTANT TO SIMPLIFY STATE STYLING
		if (prefs.getIntPref("style.InactiveTab.paletteType")>0) {
			let paletteEntry = prefs.getIntPref("style.InactiveTab.paletteEntry");
			if (tabStyle === prefs.TABS_STRIPED)
				paletteEntry += "striped";
			let ruleName = (!isTabsStriped ? ".quickfolders-flat " : "") + paletteClass + ".col" + paletteEntry;
			let inactiveGradient = engine.getElementStyle(ssPalettes, ruleName, "background-image");
			engine.removeElementStyle(ss, ".quickfolders-flat button." + noColorClass + ":not(.dragover)", "background-image"); // remove "none"
			// removed "toolbarbutton". qualifier
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)", "background-image", inactiveGradient, false);
			engine.setElementStyle(ss, ".quickfolders-flat ." + noColorClass + ":not(.dragover)#QuickFoldersCurrentFolder", "background-image", inactiveGradient, false);

			inactiveGradientColor = (inactiveColor=="black") ? engine.getElementStyle(ssPalettes, ruleName, "color") : inactiveColor;
		}
		else {
			engine.setElementStyle(ss, ".quickfolders-flat button." + noColorClass + ":not(.dragover)", "background-image", "none", false);
		}

    // tb + avoidCurrentFolder
	  engine.setElementStyle(ss, ".quickfolders-flat button" + "." + noColorClass + " .toolbarbutton-text", "color", inactiveColor, false); // [issue 81] - add selector for label
	  engine.setElementStyle(ss, ".quickfolders-flat button" + "." + noColorClass + " .toolbarbutton-icon", "color", inactiveColor, false); // [issue 81] - add selector for icon
    if (inactiveGradientColor!=null)
      engine.setElementStyle(ss, ".quickfolders-flat button" + paletteClass + "." + noColorClass, "color", inactiveGradientColor, false);

		// Coloring all striped tabbed buttons that have individual colors
    let coloredPaletteClass = this.getPaletteClassCss("ColoredTab");
		if (isTabsStriped) { // paletteClass = plastic, pastel, "", apple
			// fallback for uncolored current folder (striped style)
			engine.setElementStyle(ss, ".quickfolders-flat button#QuickFoldersCurrentFolder.col0" + paletteClass,"color", inactiveColor, false);
      // avoid for current folder button as it always will be completely colored
      // #issue 7 these rules didn't work due to a syntax error
      engine.setElementStyle(ss, ".quickfolders-flat button:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + coloredPaletteClass,"color", inactiveColor, false);
      engine.setElementStyle(ss, ".quickfolders-flat button:not(#QuickFoldersCurrentFolder):not(#QuickFolders-title-label)" + paletteClass,"color", inactiveColor, false);
		}
		else {
			engine.removeElementStyle(ss, ".quickfolders-flat button" + paletteClass,"color");
			engine.removeElementStyle(ss, ".quickfolders-flat button" + coloredPaletteClass,"color");
		}
	} ,
  
	// Get all blingable elements and make them look user defined.
	updateUserStyles: async function updateUserStyles() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences;
		try {
			util.logDebugOptional ("interface","updateUserStyles() " + window.location);
			// get MAIN STYLE SHEET
			let styleEngine = QuickFolders.Styles,
			    ss = this.getStyleSheet(styleEngine, "quickfolders-layout.css", "QuickFolderStyles");

			if (!ss) return false;

			// get PALETTE STYLE SHEET
			let ssPalettes = this.getStyleSheet(styleEngine, QuickFolders.Interface.PaletteStyleSheet, "QuickFolderPalettes");
      ssPalettes = ssPalettes ? ssPalettes : ss; // if this fails, use main style sheet.
			let theme = prefs.CurrentTheme,
			    tabStyle = prefs.ColoredTabStyle;

			if (prefs.isCssTransitions) {
				styleEngine.setElementStyle(ss, ".quickfolders-flat button", "transition-duration", "1s, 1s, 2s, 1s");
				styleEngine.setElementStyle(ss, ".quickfolders-flat button", "transition-property", "color, background-color, border-radius, box-shadow");
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat button", "transition-duration");
				styleEngine.removeElementStyle(ss, ".quickfolders-flat button", "transition-property");
			}

			// =================
			// FONT COLORS
			let theColorString = await prefs.getUserStyle("InactiveTab","color","black"),
			    colActiveBG = await prefs.getUserStyle("ActiveTab","background-color","Highlight"),
					btnSelector = ".quickfolders-flat button";

			if (tabStyle != prefs.TABS_STRIPED)  {
				styleEngine.setElementStyle(ss, btnSelector
				  + "[background-image].selected-folder","border-bottom-color", colActiveBG, true);
			}

			// =================
			// CUSTOM RADIUS
			let topRadius = "4px",
			    bottomRadius = "0px";
			if (prefs.getBoolPref("style.corners.customizedRadius")) {
				topRadius = prefs.getIntPref("style.corners.customizedTopRadiusN") + "px";
				bottomRadius = prefs.getIntPref("style.corners.customizedBottomRadiusN") + "px";
			}

			styleEngine.setElementStyle(ss, btnSelector, "border-top-left-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-top-right-radius", topRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-left-radius", bottomRadius, true);
			styleEngine.setElementStyle(ss, btnSelector, "border-bottom-right-radius", bottomRadius, true);

			// QuickFolders Toolbar only
			let btnInToolbarSelector = ".quickfolders-flat .folderBarContainer button",
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
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer button", SHADOW, "1px -1px 3px -1px rgba(0,0,0,0.3)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer button.selected-folder", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
				styleEngine.setElementStyle(ss, ".quickfolders-flat .folderBarContainer button:hover", SHADOW, "0px 0px 2px -1px rgba(0,0,0,0.9)", true);
			}
			else {
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer button", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer button.selected-folder", SHADOW);
				styleEngine.removeElementStyle(ss, ".quickfolders-flat .folderBarContainer button:hover", SHADOW);
			}

			styleEngine.setElementStyle(ss, ".quickfolders-flat button[background-image].selected-folder","border-bottom-color", colActiveBG, true);
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
			theColorString = await prefs.getUserStyle("Toolbar","background-color","ButtonFace");
			if (prefs.getBoolPref("transparentToolbar"))
				theColorString = "transparent";
			styleEngine.setElementStyle(ss, ".toolbar","background-color", theColorString,true);

      // restrict to toolbar only (so as not to affect the panel in currentFolder bar!)
			styleEngine.setElementStyle(ss, "toolbar." + theme.cssToolbarClassName, "background-color", theColorString,true);
      let tbBottom = await prefs.getUserStyle("Toolbar","bottomLineWidth", 3) + "px";
      styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar.quickfolders-flat #QuickFolders-Folders-Pane", "border-bottom-width", tbBottom, true);

			this.updateNavigationBar(ss);

      // change to numeric
			let minToolbarHeight = prefs.getStringPref("toolbar.minHeight");
      if (minToolbarHeight) {
        let mT = parseInt(minToolbarHeight);
        styleEngine.setElementStyle(ss, "#QuickFolders-Toolbar", "min-height", mT.toString()+"px", false);
      }

      // main toolbar position
      let ordinalGroup = prefs.getIntPref("toolbar.ordinalPosition") || 0;
      styleEngine.setElementStyle(ss,"#QuickFolders-Toolbar", "-moz-box-ordinal-group", ordinalGroup.toString());

			util.logDebugOptional ("css","updateUserStyles(): success");
      
      util.$("QuickFolders-Tools-Pane").setAttribute("iconsize", prefs.getBoolPref("toolbar.largeIcons") ? "large" : "small"); // [issue 191]
			return true;
		}
		catch(e) {
			util.logException("Quickfolders.updateUserStyles failed ", e);
			return false;
		};
		return false;
	} ,  
  
}