"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */



QuickFolders.Preferences = {
	TABS_STRIPED: 0,
	TABS_FILLED: 1,
  root: "extensions.quickfolders.",
  cachedPrefs: [],
  
  initPrefsCache: async function() {
    async function addPref(shortkey) {
      let key = QuickFolders.Preferences.root + shortkey,
          item = QuickFolders.Preferences.cachedPrefs.find(e => e.key==shortkey);
      let p = await browser.LegacyPrefs.getPref(key);
      if (!item) {
        item = { key:shortkey };
        switch (typeof p) {
          case "string":
            item.type="string";
            break;
          case "int":
            item.type="int";
            break;
          case "bool":
            item.type="bool";
            break;
          default:
            item.type="unknown";
            break;
        }
        item.value = p;
        QuickFolders.Preferences.cachedPrefs.push(item);
      }
      else { // update
        item.value = p;
      }
      
    }
    const myPrefs = [
      "autoFocusPreview", 
      "autoValidateFolders",
      "behavior.nonFolderView.openNewTab",
      "bookmarks.folderLabel",
      "bookmarks.showButton", 
      "bookmarks.maxEntries", 
      "bookmarks.searchUri",
      "bookmarks.openMethod",
      "buttonFontSizeN",
      "buttonShadows",
      
      "collapseCategories",
      "colorTabStyle",
      "currentFolderBar.background.custom",
      "currentFolderBar.showClose", 
      "currentFolderBar.showRecentButton", 
      "currentFolderBar.showFilterButton",
      "currentFolderBar.showFolderMenuButton",
      "currentFolderBar.showIconButtons",
      "currentFolderBar.showRepairFolderButton",
      "currentFolderBar.navigation.showButtons",
      "currentFolderBar.folderNavigation.showButtons",
      "currentFolderBar.background",
      "currentFolderBar.background.selection",
      "currentFolderBar.background.lightweight",
      "currentFolderBar.folderTreeIcon",
      "currentFolderBar.flexLeft",
      "currentFolderBar.flexRight",
      
      "disableFolderSwitching", 
      "debug",
      "debug.bookmarks",
      "debug.buttonStyle",
      "debug.categories",
      "debug.composer",
      "debug.css",
      "debug.css.AddRule",
      "debug.css.Detail",
      "debug.css.palette",
      "debug.css.palette.styleSheets",
      "debug.css.styleSheets",
      "debug.dnd",
      "debug.dragToNew",
      "debug.events",
      "debug.events.keyboard",
      "debug.filters",
      "debug.firstrun",
      "debug.folderTree",
      "debug.folderTree.icons",
      "debug.folders",
      "debug.folders.select",
      "debug.getOrCreateFolder",
      "debug.identities",
      "debug.interface",
      "debug.interface.buttonStyles",
      "debug.interface.currentFolderBar",
      "debug.interface.findFolder",
      "debug.interface.tabs",
      "debug.interface.update",
      "debug.listeners.folder",
      "debug.listeners.tabmail",
      "debug.mailTabs",
      "debug.mouseclicks",
      "debug.navigation",
      "debug.notifications",
      "debug.options",
      "debug.popupmenus",
      "debug.popupmenus.collapse",
      "debug.popupmenus.drag",
      "debug.popupmenus.folderEventType",
      "debug.popupmenus.isCommandListeners",
      "debug.popupmenus.isOnCommandAttr",
      "debug.popupmenus.items",
      "debug.popupmenus.subfolders",
      "debug.popupmenus.verticalOffset",
      "debug.premium",
      "debug.premium.forceShowExtend",
      "debug.premium.licenser",
      "debug.premium.quickJump",
      "debug.premium.rsa",
      "debug.quickMove",
      "debug.recentFolders",
      "debug.recentFolders.detail",
      "debug.saleDate",
      "debug.toolbarHiding",
      "enableMenuAlphaSorting", 
      "files.path",
      "hasNews",
      "lastActiveCategories",
      "lastSelectedOptionsTab",
      "markAsReadOnMove",
      "pastelColors", 
      "queuedFolderUpdateDelay",
      "quickCopy.Hotkey", 
      "quickCopy.Hotkey.Shift", 
      "quickCopy.useHotkey", 
      "quickJump.Hotkey", 
      "quickJump.Hotkey.Shift", 
      "quickJump.useHotkey", 
      "quickMove.autoFill",
      "quickMove.createFolderOnTop",
      "quickMove.gotoNextMsgAfterMove",
      "quickMove.folderLabel",
      "quickMove.Hotkey", 
      "quickMove.Hotkey.Shift", 
      "quickMove.lastFolderName",
      "quickMove.lastFolderURI",
      "quickMove.reopenMsgTabAfterMove",
      "quickMove.useHotkey", 
      "rebuildShortcutKey", 
      "recentfolders.color", 
      "showCategoryCounts",
      "showCountInSubFolders", 
      "showCurrentFolderToolbar",
      "showCurrentFolderToolbar.messageWindow",
      "showCurrentFolderToolbar.singleMailTab",
      
      "showFoldersWithMessagesItalic", 
      "showFoldersWithNewMailItalic",
      "showIcons", 
      "showNewMailHighlight",
      "showQuickMove", 
      "showQuickfoldersLabel",
      "showRecentTab", , 
      "showShortcutNumber", 
      "showSubfolders",
      "showToolIcon", 
      "showTotalNumber", 
      "showUnreadFoldersBold",
      "showUnreadOnButtons",
      "skipFolder.Hotkey", 
      "skipFolder.Hotkey.Shift",
      "skipFolder.useHotkey", 
      
      "style.ActiveTab.background-color", 
      "style.ActiveTab.color",
      "style.ActiveTab.paletteEntry",
      "style.ActiveTab.paletteType",
      "style.ColoredTab.paletteType", 
      "style.DragOver.background-color",
      "style.DragOver.color",
      "style.DragOver.paletteEntry",
      "style.DragOver.paletteType", 
      "style.DragTab.background-color", 
      "style.DragTab.color", 
      "style.HoveredTab.background-color", 
      "style.HoveredTab.color", 
      "style.HoveredTab.paletteEntry", 
      "style.HoveredTab.paletteType",
      "style.InactiveTab.background-color", 
      "style.InactiveTab.color", 
      "style.InactiveTab.paletteEntry", 
      "style.InactiveTab.paletteType", 
      "style.Toolbar.background-color",
      "style.Toolbar.bottomLineWidth",
      "style.button.minHeight",
      "style.button.paddingTop",
      "style.corners.customizedBottomRadiusN",
      "style.corners.customizedRadius",
      "style.corners.customizedTopRadiusN",
      "style.palette.version",
      "style.transitions", 
      "style.theme",
      
      "textQuickfoldersLabel",
      "toolbar.minHeight",
      "toolbar.hideInSingleMessage",
      "toolbar.ordinalPosition", 
      "toolbar.largeIcons",
      "tooltips.parentFolder",
      "tooltips.baseFolder", 
      "tooltips.serverName", 
      "tooltips.virtualFlag", 
      "tooltips.msgFolderFlags", 
      "transparentToolbar",
      "transparentButtons",
      "treeIconsDelay",
      
      "update.disableMinimal", 
      "useKeyboardShortcutCTRL", 
      "useKeyboardShortcuts", 
      "useNavigateShortcuts", 
      "useRebuildShortcut", 
    ]
    for (let i of myPrefs) {
      addPref(i);
    }
  },
  
	set lastActiveCats(c) {
		this.setStringPref('lastActiveCategories', c);
	},
	get lastActiveCats() {
		return this.getStringPref('lastActiveCategories');
	},
  
	isDebug: async function() {
		return await this.getBoolPref("debug");
	},
  
	isDebugOption: async function(option) { // granular debugging
		if(!await this.isDebug()) return false;
		try {return this.getBoolPref("debug." + option);}
		catch(e) { 
      return true; // more info is probably better in this case - this is an illegal value after all.
    }
	},
  
	getUserStyle: async function getUserStyle(sId, sType, sDefault) {
		// note: storing color as string in order to store OS specific colors like Menu, Highlight
		// usage: getUserStyle("ActiveTab","background-color","HighLight")
		// usage: getUserStyle("ActiveTab","color", "HighlightText")
		let sStyleName = 'style.' + sId + '.' + sType,
		    sReturnValue="";

    try {
			let localPref = await this.getStringPref(sStyleName);
			if (localPref || (localPref===0))
				sReturnValue = localPref;
			else
				sReturnValue = sDefault;
		}
    catch(ex) {
      sReturnValue = sDefault;
    }
		return sReturnValue;
	},

	setUserStyle: async function setUserStyle(sId, sType, sValue) {
		let sStyleName = 'style.' + sId + '.' + sType;
		await this.setStringPref(sStyleName, sValue);
	},  
  
  
  /* universal storage */
	getIntPreference: async function getIntPreference(key) {
		try {
      let i = await browser.LegacyPrefs.getPref(key);
      return parseInt(i,10);
		}
		catch (ex) {
			QuickFolders.Util.logException("getIntPref(" + key + ") failed\n", ex);
			return 0;
		}
	},

	setIntPreference: async function setIntPreference(p, v) {
    return await browser.LegacyPrefs.setPref(p, v);
	},  
  
	setBoolPrefVerbose: async function setBoolPrefVerbose(p, v) {
		try {
			return await browser.LegacyPrefs.setPref(p, v);
		} 
    catch(e) {
			QuickFolders.Util.logException("setBoolPrefVerbose(" + p + ") failed\n", e);
			return false;
		}
	},
  
  /* preference setters / getters that are always prefixed with quickfolders extension namespace */
	getIntPref: function getIntPref(p) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p.replace(QuickFolders.Preferences.root,"") : p;
    let item = QuickFolders.Preferences.cachedPrefs.find(e => e.key == key);
    try {
      let prefVal = item.value;
      return parseInt(prefVal,10);
    }
    catch(ex) {
      QuickFolders.Util.logDebug("Could not retrieve int pref: " + p + "\n" + ex.message);
      return null;
    }
	},

	setIntPref: async function setIntPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    return await browser.LegacyPrefs.setPref(key, v);
	},  
  
	getStringPref: async function getStringPref(p) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p.replace(QuickFolders.Preferences.root,"") : p;
    let item = QuickFolders.Preferences.cachedPrefs.find(e => e.key == key);
    let prefString = "";
    try {
      prefString = item.value;
    }
    catch(ex) {
      QuickFolders.Util.logDebug("Could not retrieve string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setStringPref: async function setStringPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    return await browser.LegacyPrefs.setPref(key, v);
	},

	getBoolPref: async function getBoolPref(p) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p.replace(QuickFolders.Preferences.root,"") : p;
    let item = QuickFolders.Preferences.cachedPrefs.find(e => e.key == key);
    let ans = false;
	  try {
	    ans = item.value;
		}
		catch(ex) {
		  QuickFolders.Util.logException("getBoolPref("  + p +") failed\n", ex);
		  throw(ex);
		}
		return ans;
	},
  
	setBoolPref: async function setBoolPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
		return await browser.LegacyPrefs.setPref(key, v);
	},  

	get CurrentTheme() {
		let id = this.CurrentThemeId;
		return QuickFolders.Themes.Theme(id);
	},

	get CurrentThemeId() {
		return this.getStringPref("style.theme");
	},
  
  get supportsCustomIcon() {
    return true; // may be forbidden in future Thunderbird versions? 91+
  },
  
  getMsgFolderFromUri:  function getMsgFolderFromUri(uri, checkFolderAttributes) {
    console.error("MX CODE - DON'T USE getMsgFolderFromUri - USE getMsgFolderFromEntry INSTEAD!");
    return  null;
  } ,

  // MX compatible version  
  getMsgFolderFromEntry: async function(entry, checkFolderAttributes) {
    let apiPath = entry.apiPath;
    let realFolder;
    if (!apiPath) return null;
    let parents = await messenger.folder.getParentFolders(entry.apiPath, false);
    if (parents) {
      let kids = await messenger.folder.getSubFolders(parents[0], false);
      realFolder = kids.find(x => x.path == apiPath.path);
    }
    else {
      let ac = await messenger.accounts.get(apiPath.accountId, true);
      realFolder = // context.extension.folderManager.get(apiPath.accountId, apiPath.path);
        ac.folders.find(x => x.path == apiPath.path);
    }
    return realFolder;
  } ,
  
  loadFolderEntries: async function loadFolderEntries() {
		const setting = "QuickFolders.folders",
		      util = QuickFolders.Util;
		try {
			let folders = await browser.LegacyPrefs.getPref(setting);
			if (folders) {
				folders = folders.replace(/\r?\n|\r/, ''); // remove all line breaks
				let entries = JSON.parse(folders);
				for (let i = 0; i < entries.length; i++) {
					if (typeof entries[i].tabColor ==='undefined' || entries[i].tabColor ==='undefined')
						entries[i].tabColor = 0;
					// default the name!!
					if (!entries[i].name) {
						// retrieve the name from the folder uri (prettyName)
						let f = await QuickFolders.Model.getMsgFolderFromEntry(entries[i], false);
						if (f)
							entries[i].name = f.prettyName;
					}
          // when loading, reset the disabled Validation!
          if (entries[i].disableValidation) {
            let swap = entries[i];
            delete swap.disableValidation;
            entries[i] = swap;
            // entries[i].disableValidation = false;
          }
				}
				return entries;
			}
			else
				return [];
		}
		catch(e) {
			QuickFolders.Util.logToConsole("loadFolderEntries()" + e);
			return [];
		}
	} ,
  
	get isShowUnreadCount() { return this.getBoolPref("showUnreadOnButtons");	} ,
	get isShowQuickFoldersLabel() { return this.getBoolPref("showQuickfoldersLabel") || this.getBoolPref("hasNews");	} ,  
	get isShowUnreadFoldersBold() { return this.getBoolPref("showUnreadFoldersBold");	} ,
	get isHighlightNewMail() { return this.getBoolPref("showNewMailHighlight");	} ,	
	get isItalicsNewMail() { return this.getBoolPref("showFoldersWithNewMailItalic");	} ,
	get isShowRecursiveFolders() { return this.getBoolPref("showSubfolders");	} ,
	get isShowCategoryNewCount() { return this.getBoolPref("showCategoryCounts");	} ,	
	get isKeyboardListeners() {
		return this.isUseNavigateShortcuts 
		    || this.isUseKeyboardShortcuts 
				|| this.isUseRebuildShortcut 
		    || this.isQuickJumpShortcut 
				|| this.isQuickMoveShortcut 
				|| this.isQuickCopyShortcut
				|| this.isSkipFolderShortcut;
	} ,
	get isUseNavigateShortcuts() { return this.getBoolPref("useNavigateShortcuts");	} ,
	get isUseKeyboardShortcuts() { return this.getBoolPref("useKeyboardShortcuts");	} ,
	get isUseRebuildShortcut() { return this.getBoolPref("useRebuildShortcut");	} ,
	get RebuildShortcutKey() { return this.getStringPref("rebuildShortcutKey");	} ,
	get isQuickJumpShortcut() { return this.getBoolPref("quickJump.useHotkey");	} ,
	get QuickJumpShortcutKey() { return this.getStringPref("quickJump.Hotkey");	} ,  
  get isQuickJumpShift() { return this.getBoolPref("quickJump.Hotkey.Shift");	} ,
	get isQuickMoveShortcut() { return this.getBoolPref("quickMove.useHotkey");	} ,
	get QuickMoveShortcutKey() { return this.getStringPref("quickMove.Hotkey");	} ,  
  get isQuickMoveShift() { return this.getBoolPref("quickMove.Hotkey.Shift");	} ,
	get isQuickCopyShortcut() {	return this.getBoolPref("quickCopy.useHotkey");	} ,
  get QuickCopyShortcutKey() { return this.getStringPref("quickCopy.Hotkey");	} ,
  get isQuickCopyShift() { return this.getBoolPref("quickCopy.Hotkey.Shift");	} ,
  get isSkipFolderShortcut() { return this.getBoolPref("skipFolder.useHotkey");	} ,
  get SkipFolderShortcutKey() { return this.getStringPref("skipFolder.Hotkey");	} ,
  get isUseKeyboardShortcutsCTRL() { return this.getBoolPref("useKeyboardShortcutCTRL");	} ,
	get isShowShortcutNumbers() { return this.getBoolPref("showShortcutNumber");	} ,
	get isShowTotalCount() { return this.getBoolPref("showTotalNumber");	} ,
	get isShowCountInSubFolders() { return this.getBoolPref("showCountInSubFolders");	} ,
	get isShowFoldersWithMessagesItalic() { return this.getBoolPref("showFoldersWithMessagesItalic");	} ,
	get isFocusPreview() { return this.getBoolPref("autoFocusPreview"); } ,
	get isShowToolbarIcons() { return this.getBoolPref("showIcons");	} ,
	get isChangeFolderTreeViewEnabled() { return !this.getBoolPref('disableFolderSwitching');	} ,
	get isSortSubfolderMenus() { return this.getBoolPref('enableMenuAlphaSorting');	} ,
	get isShowRecentTab() { return this.getBoolPref('showRecentTab'); } ,
	get isShowRecentTabIcon() { return this.getBoolPref('recentfolders.showIcon');	} ,
	get recentTabColor() { return this.getIntPref( 'recentfolders.color');	} ,
	get isMinimalUpdateDisabled() { return this.getBoolPref('update.disableMinimal');	} ,
	get isShowToolIcon() { return this.getBoolPref('showToolIcon');	} ,
  get isShowReadingList() { return this.getBoolPref('bookmarks.showButton');  } ,
  get isShowQuickMove() { return this.getBoolPref('showQuickMove');  } ,
	get isCssTransitions() { return this.getBoolPref('style.transitions');	} ,
	get ButtonFontSize() { return this.getIntPref("buttonFontSizeN");	} ,
	get isPastelColors() { // OBSOLETE!
		return this.getBoolPref('pastelColors');
	} ,
  get maxSubjectLength() { return this.getIntPref('menuMessageList.maxSubjectLength'); } ,
	get ColoredTabStyle() { return this.getIntPref('colorTabStyle'); } ,  
	get TextQuickfoldersLabel() {
		const util = QuickFolders.Util;
    let overrideLabel = "";
    // extend this for delivering the news splash when updated!
    if (QuickFolders.Preferences.getBoolPref("hasNews"))
      overrideLabel = util.getBundleString("qf.notification.newsFlash", "QuickFolders");
    else if (QuickFolders.Util.licenseInfo.isExpired)
      overrideLabel = util.getBundleString("qf.notification.premium.btn.renewLicense");
    
		try { // to support UNICODE: https://developer.mozilla.org/pl/Fragmenty_kodu/Preferencje
		  const url = "extensions.quickfolders.textQuickfoldersLabel",
					  PS = this.service;
			let customTitle = PS.getStringPref(url);
			return overrideLabel || customTitle;
		}
		catch(e) { 
      return overrideLabel || 'QuickFolders'; 
    }
	},  
}


