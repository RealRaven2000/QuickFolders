"use strict";
QuickFolders.Preferences = {
	service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

	get isDebug() {
		return this.getBoolPref("debug");
	},

	isDebugOption: function(option) { // granular debugging
		if(!this.isDebug) return false;
		try {return this.getBoolPref("debug." + option);}
		catch(e) { 
      return true; // more info is probably better in this case - this is an illegal value after all.
    }
	},

	storeFolderEntries: function storeFolderEntries(folderEntries) {
		try {
		let json = JSON.stringify(folderEntries),
		    str = Components.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = json;

		this.service.setComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString, str);
		//this.service.setCharPref("QuickFolders.folders",json)
		}
		catch(e) {
			QuickFolders.Util.logToConsole("storeFolderEntries()" + e);
		}
	} ,

	loadFolderEntries: function loadFolderEntries() {
		if (!this.service.prefHasUserValue("QuickFolders.folders")) {
			return [];
		}

		try {
			let folders = this.service.getComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString).data;
			// fall back for old version
			if (folders.length<3)
				folders = this.service.getCharPref("QuickFolders.folders");

			if(folders) {
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
		return this.getBoolPref("showQuickfoldersLabel");
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

	get isQuickMoveShortcut() {
		return this.getBoolPref("quickMove.useHotkey");
	} ,
	
	get QuickMoveShortcutKey() {
		return this.getStringPref("quickMove.Hotkey");
	} ,
  
	get isQuickCopyShortcut() {
		return this.getBoolPref("quickCopy.useHotkey");
	} ,
  
	get QuickCopyShortcutKey() {
		return this.getStringPref("quickCopy.Hotkey");
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
		try { // to support UNICODE: https://developer.mozilla.org/pl/Fragmenty_kodu/Preferencje
			return this.service.getComplexValue("extensions.quickfolders.textQuickfoldersLabel", Components.interfaces.nsISupportsString).data;
		}
		catch(e) { return 'QuickFolders'; }
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
			if (this.service.getCharPref(pref))
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

	// updates all toxic preferences to skinning engine of v 2.7
	// returns true if upgraded from a previous skinning engine
	tidyUpBadPreferences: function tidyUpBadPreferences() {
		let isUpgradeSkinning = false,
        util = QuickFolders.Util;
		try {
			util.logDebugOptional('firstrun', 'tidyUpBadPreferences() ...');
			// get rid of preferences that do not start with "preferences." and replace with newer versions.
			if (this.existsCharPref('QuickFolders.Toolbar.Style.background-color')) {
				let replacePref = function(id1, id2) {
					let service = QuickFolders.Preferences.service,
					    origPref = 'QuickFolders.' + id1 + '.Style.' + id2,
					    sValue = "";
					// save value set by user (if none, default will create it)
					if (service.prefHasUserValue(origPref)) {
						sValue = service.getCharPref(origPref);
						let newPref = 'extensions.quickfolders.style.' + id1 + '.' + id2;
						service.setCharPref(newPref, sValue);
						util.logDebugOptional('firstrun', 'QuickFolders Update: Replaced bad preference {' + origPref + '} with {' + newPref + '}  value=' + sValue );
					}
					// delete bad preference
					try { service.deleteBranch(origPref) } catch (ex) {;};
				}

				replacePref('ActiveTab','background-color');
				replacePref('ActiveTab','color');
				replacePref('DragOver','background-color');
				replacePref('DragTab','background-color');
				replacePref('DragTab','color');
				replacePref('HoveredTab','background-color');
				replacePref('HoveredTab','color');
				replacePref('InactiveTab','background-color');
				replacePref('InactiveTab','color');
				replacePref('Toolbar','background-color');
				isUpgradeSkinning = true;

			}

			if (this.existsBoolPref("extensions.quickfolders.showFlatStyle")) {
				let theme = QuickFolders.Themes;

				if (this.getBoolPref("showFlatStyle"))
					this.setCurrentThemeId(theme.themes.Flat.Id);
				else {
					if (this.getBoolPref("showNativeTabStyle"))
						this.setCurrentThemeId(theme.themes.NativeTabs.Id);
					else
						this.setCurrentThemeId(theme.themes.ApplePills.Id); // Pills style
				}

				try {
					this.service.deleteBranch("extensions.quickfolders.showFlatStyle");
					this.service.deleteBranch("extensions.quickfolders.showNativeTabStyle");
					isUpgradeSkinning = true;
				}
				catch (ex) { util.alert(ex);};
			}
		}
		catch (ex) {
			util.logException("tidyUpBadPreferences",ex) ;
			return false;
		};
		return isUpgradeSkinning;
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
        this.service.getCharPref(sStyleName) :
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
		this.service.setCharPref(sStyleName, sValue);
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
    let prefString =''
    try {
      prefString = this.service.getCharPref("extensions.quickfolders." + p);
    }
    catch(ex) {
      QuickFolders.Util.logDebug("Could not find string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setCharPrefQF: function setCharPrefQF(p, v) {
		return this.service.setCharPref("extensions.quickfolders." + p, v);
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

	setCurrentThemeId: function setCurrentThemeId(t) {
		return this.setCharPrefQF("style.theme",t);
	},
  
  get supportsCustomIcon() {
    switch(QuickFolders.Util.Application) {
      case "Thunderbird":
        return true;
      default:
        return false; // SeaMonkey and Postbox - custom icons not supported!
    }
  }
  
}