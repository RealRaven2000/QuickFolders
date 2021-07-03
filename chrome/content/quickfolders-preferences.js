"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

//export  {QuickFolders.Preferences};
QuickFolders.Preferences = {
	service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

	get isDebug() {
		return this.getBoolPref("debug");
	},
	
	set lastActiveCats(c) {
		this.setStringPref('lastActiveCategories', c);
	},
	get lastActiveCats() {
		return this.getStringPref('lastActiveCategories');
	},

	isDebugOption: function(option) { // granular debugging
		if(!this.isDebug) return false;
		try {return this.getBoolPref("debug." + option);}
		catch(e) { 
      return true; // more info is probably better in this case - this is an illegal value after all.
    }
	},
	
	setDebugOption: function setDebugOption(option, val) {
		this.setBoolPref("debug." + option, val);
	},

	storeFolderEntries: function storeFolderEntries(folderEntries) {
		try {
			const util = QuickFolders.Util,
			      PS = this.service;
			let json = JSON.stringify(folderEntries),
					str = Components.classes["@mozilla.org/supports-string;1"]
				.createInstance(Components.interfaces.nsISupportsString);
			str.data = json;

			if (PS.setStringPref)
				PS.setStringPref("QuickFolders.folders", json);
			else
				PS.setComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			QuickFolders.Util.logToConsole("storeFolderEntries()" + e);
		}
	} ,

	loadFolderEntries: function loadFolderEntries() {
		const setting = "QuickFolders.folders",
		      util = QuickFolders.Util;
		if (!this.service.prefHasUserValue(setting)) {
			return [];
		}

		try {
			const PS = this.service;
			let folders = PS.getStringPref(setting);
			if(folders) {
				folders = folders.replace(/\r?\n|\r/, ''); // remove all line breaks
				let entries = JSON.parse(folders);
				for (let i = 0; i < entries.length; i++) {
					if (typeof entries[i].tabColor ==='undefined' || entries[i].tabColor ==='undefined')
						entries[i].tabColor = 0;
					// default the name!!
					if (!entries[i].name) {
						// retrieve the name from the folder uri (prettyName)
						let f = QuickFolders.Model.getMsgFolderFromUri(entries[i].uri, false);
						if (f)
							entries[i].name = f.prettyName;
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

	get isShowUnreadCount() {
		return this.getBoolPref("showUnreadOnButtons");
	} ,

	get isShowQuickFoldersLabel() {
		return this.getBoolPref("showQuickfoldersLabel") || this.getBoolPref("hasNews");
	} ,
  
	get isShowUnreadFoldersBold() {
		return this.getBoolPref("showUnreadFoldersBold");
	} ,

	get isHighlightNewMail() {
		return this.getBoolPref("showNewMailHighlight");
	} ,
	
	get isItalicsNewMail() { // xxx experimental
		return this.getBoolPref("showFoldersWithNewMailItalic");
	} ,

	get isShowRecursiveFolders() {
		return this.getBoolPref("showSubfolders");
	} ,

	get isShowCategoryNewCount() {
		return this.getBoolPref("showCategoryCounts");
	} ,
	
	get isKeyboardListeners() {
		return this.isUseNavigateShortcuts 
		    || this.isUseKeyboardShortcuts 
				|| this.isUseRebuildShortcut 
		    || this.isQuickJumpShortcut 
				|| this.isQuickMoveShortcut 
				|| this.isQuickCopyShortcut
				|| this.isSkipFolderShortcut;
	} ,

	get isUseNavigateShortcuts() {
		return this.getBoolPref("useNavigateShortcuts");
	} ,

	get isUseKeyboardShortcuts() {
		return this.getBoolPref("useKeyboardShortcuts");
	} ,

	get isUseRebuildShortcut() {
		return this.getBoolPref("useRebuildShortcut");
	} ,

	get RebuildShortcutKey() {
		return this.getStringPref("rebuildShortcutKey");
	} ,
	
	get isQuickJumpShortcut() {
		return this.getBoolPref("quickJump.useHotkey");
	} ,
  
	get QuickJumpShortcutKey() {
		return this.getStringPref("quickJump.Hotkey");
	} ,
  
  get isQuickJumpShift() {
		return this.getBoolPref("quickJump.Hotkey.Shift");
	} ,

	get isQuickMoveShortcut() {
		return this.getBoolPref("quickMove.useHotkey");
	} ,
	
	get QuickMoveShortcutKey() {
		return this.getStringPref("quickMove.Hotkey");
	} ,
  
  get isQuickMoveShift() {
		return this.getBoolPref("quickMove.Hotkey.Shift");
	} ,
  
  
	get isQuickCopyShortcut() {
		return this.getBoolPref("quickCopy.useHotkey");
	} ,
  
	get QuickCopyShortcutKey() {
		return this.getStringPref("quickCopy.Hotkey");
	} ,
  
  get isQuickCopyShift() {
		return this.getBoolPref("quickCopy.Hotkey.Shift");
	} ,
  
  
	
	get isSkipFolderShortcut() {
		return this.getBoolPref("skipFolder.useHotkey");
	} ,
  
	get SkipFolderShortcutKey() {
		return this.getStringPref("skipFolder.Hotkey");
	} ,
	
	get isUseKeyboardShortcutsCTRL() {
		return this.getBoolPref("useKeyboardShortcutCTRL");
	} ,

	get isShowShortcutNumbers() {
		return this.getBoolPref("showShortcutNumber");
	} ,

	get isShowTotalCount() {
		return this.getBoolPref("showTotalNumber");
	} ,

	get isShowCountInSubFolders() {
		return this.getBoolPref("showCountInSubFolders");
	} ,

	get isShowFoldersWithMessagesItalic() {
		return this.getBoolPref("showFoldersWithMessagesItalic");
	} ,

	get isFocusPreview() {
		return this.getBoolPref("autoFocusPreview");
	} ,

	get isShowToolbarIcons() {
		return this.getBoolPref("showIcons");
	} ,

	get isChangeFolderTreeViewEnabled() {
		return !this.getBoolPref('disableFolderSwitching');
	} ,

	get isSortSubfolderMenus() {
		return this.getBoolPref('enableMenuAlphaSorting');
	} ,

	get isShowRecentTab() {
		return this.getBoolPref('showRecentTab');
	} ,

	get isShowRecentTabIcon() {
		return this.getBoolPref('recentfolders.showIcon');
	} ,

	get isPastelColors() { // OBSOLETE!
		return this.getBoolPref('pastelColors');
	} ,

	get recentTabColor() {
		return this.getIntPref( 'recentfolders.color');
	} ,


	get isMinimalUpdateDisabled() {
		return this.getBoolPref('update.disableMinimal');
	} ,

	get isShowToolIcon() {
		return this.getBoolPref('showToolIcon');
	} ,
  
  get isShowReadingList() {
		return this.getBoolPref('bookmarks.showButton');
  } ,
  
  get isShowQuickMove() {
    return this.getBoolPref('showQuickMove');
  } ,
	get isCssTransitions() {
		return this.getBoolPref('style.transitions');
	} ,

	get ButtonFontSize() {
		return this.getIntPref("buttonFontSizeN");
	} ,

	get TextQuickfoldersLabel() {
		const util = QuickFolders.Util;
    let overrideLabel = "";
    // extend this for delivering the news splash when updated!
    if (QuickFolders.Preferences.getBoolPref("hasNews"))
      overrideLabel = util.getBundleString("qf.notification.newsFlash", "$addonName$ was updated! See what's new…", "QuickFolders");
    else if (QuickFolders.Util.licenseInfo.isExpired)
      overrideLabel = util.getBundleString("qf.notification.premium.btn.renewLicense", "Renew License!");
    
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

  get maxSubjectLength() {
    return this.getIntPref('menuMessageList.maxSubjectLength');
  } ,
  
	get ColoredTabStyle() {
		// 0 - filled
		// 1 - striped
		return this.getIntPref('colorTabStyle');
	} ,

	TABS_STRIPED: 0,
	TABS_FILLED: 1,

	existsCharPref: function existsCharPref(pref) {
		try {
			if(this.service.prefHasUserValue(pref))
				return true;
			if (this.service.getStringPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	existsBoolPref: function existsBoolPref(pref) {
		try {
			if(this.service.prefHasUserValue(pref))
				return true;
			if (this.service.getBoolPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	getUserStyle: function getUserStyle(sId, sType, sDefault) {
		// note: storing color as string in order to store OS specific colors like Menu, Highlight
		// usage: getUserStyle("ActiveTab","background-color","HighLight")
		// usage: getUserStyle("ActiveTab","color", "HighlightText")
		let sStyleName = 'extensions.quickfolders.style.' + sId + '.' + sType,
		    sReturnValue="";

    try {
			let localPref = 
        (typeof sDefault == "string") ?
        this.service.getStringPref(sStyleName) :
        this.service.getIntPref(sStyleName);
			if (localPref || (localPref===0))
				sReturnValue = localPref;
			else
				sReturnValue = sDefault;
		}
    catch(ex) {
      sReturnValue = sDefault;
    }
		/* QuickFolders.Util.logToConsole("getUserStyle("+ sId+ ", " + sType + ", " + sDefault +")\n" +
				"Style Name: " + sStyleName + "\n" +
				"Value: " + sReturnValue) */
		return sReturnValue;
	},

	setUserStyle: function setUserStyle(sId, sType, sValue) {
		let sStyleName = 'extensions.quickfolders.style.' + sId + '.' + sType;
		this.service.setStringPref(sStyleName, sValue);
	},

	getIntPreference: function getIntPreference(p) {
		try {
			return this.service.getIntPref(p);
		}
		catch (ex) {
			QuickFolders.Util.logException("getIntPref(" + p + ") failed\n", ex);
			return 0;
		}
	},

	setIntPreference: function setIntPreference(p, v) {
		return this.service.setIntPref(p, v);
	},

	getBoolPrefSilent: function getBoolPrefSilent(p) {
		try {
			return this.service.getBoolPref(p);
		}
		catch(e) {
			return false;
		}
	},

	getBoolPrefVerbose: function getBoolPrefVerbose(p) {
		try {
			return this.service.getBoolPref(p);
		}
		catch(e) {
			QuickFolders.Util.logException("getBoolPrefVerbose(" + p + ") failed\n", e);
			return false;
		}
	},
	
	getBoolPref: function getBoolPref(p) {
	  let ans;
	  try {
	    ans = this.service.getBoolPref("extensions.quickfolders." + p);
		}
		catch(ex) {
		  QuickFolders.Util.logException("getBoolPref("  + p +") failed\n", ex);
		  throw(ex);
		}
		return ans;
	},

	setBoolPref: function setBoolPref(p, v) {
		return this.service.setBoolPref("extensions.quickfolders." + p, v);
	},
	
  // reading prefs across extensions will be forbidden, check:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessageExternal
	getFiltersBoolPref: function getFiltersBoolPref(p, defaultV) {
	  let ans;
	  try {
	    ans = this.service.getBoolPref("extensions.quickfilters." + p);
		}
		catch(ex) {
		  QuickFolders.Util.logException("getFiltersBoolPref("  + p +") failed\ndefaulting to " + defaultV, ex);
			ans = defaultV;
		}
		return ans;
	},
	
	getStringPref: function getStringPref(p) {
    let prefString ='',
		    key = "extensions.quickfolders." + p;        
		  
    try {
		  const Ci = Components.interfaces, Cc = Components.classes;
			prefString = this.service.getStringPref(key);
    }
    catch(ex) {
      QuickFolders.Util.logDebug("Could not retrieve string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setStringPref: function setStringPref(p, v) {
		if (this.service.setStringPref)
			return this.service.setStringPref("extensions.quickfolders." + p, v);
		else {
		  const Ci = Components.interfaces, 
			      Cc = Components.classes;
			if (this.isDebug) debugger;
			var str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
			str.data = v;
			Services.prefs.setComplexValue("extensions.quickfolders." + p, Ci.nsISupportsString, str);
		}
	},

	getIntPref: function getIntPref(p) {
		return QuickFolders.Preferences.getIntPreference("extensions.quickfolders." + p);
	},

	setIntPref: function setIntPref(p, v) {
		return this.setIntPreference("extensions.quickfolders." + p, v);
	},

	setShowCurrentFolderToolbar: function setShowCurrentFolderToolbar(b, selector) {
		let tag = "showCurrentFolderToolbar";
		if (selector)
			tag = tag + "." + selector;
		return this.service.setBoolPref("extensions.quickfolders." + tag, b);
	},

	isShowCurrentFolderToolbar: function isShowCurrentFolderToolbar(selector) {
		let tag = "showCurrentFolderToolbar";
		if (selector)
			tag = tag + "." + selector;
		return QuickFolders.Preferences.getBoolPref(tag, false);
	},

	setBoolPrefVerbose: function setBoolPrefVerbose(p, v) {
		try {
			return this.service.setBoolPref(p, v);
		} 
    catch(e) {
			let s="Err:" +e;
			QuickFolders.Util.logException("setBoolPrefVerbose(" + p + ") failed\n", e);
			return false;
		}
	} ,

	get CurrentTheme() {
		let id = this.CurrentThemeId;
		return QuickFolders.Themes.Theme(id);
	},

	get CurrentThemeId() {
		return this.getStringPref("style.theme");
	},

	set CurrentThemeId(t) {
		return this.setStringPref("style.theme",t);
	},
  
  get supportsCustomIcon() {
    return true; // may be forbidden in future Thunderbird versions? 91+
  },
	
	unhideSmallIcons() {
		// option: make "small icons" option visible again in customize toolbar palette
		if (this.getBoolPref("toolbarpalette.showSmallIcons")) {
			let option = document.getElementById('smallicons');
			if (option)
				option.style.setProperty('display','block'); // by default this has been set to 'none' for ages
		}
	}
  
}
