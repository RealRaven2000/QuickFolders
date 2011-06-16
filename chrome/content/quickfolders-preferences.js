QuickFolders.Preferences = {
	service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

	isDebug: function () {
		return this.service.getBoolPref("extensions.quickfolders.debug");
	},

	isDebugOption: function(option) { // granular debugging
		if(!this.isDebug()) return false;
		try {return this.service.getBoolPref("extensions.quickfolders.debug." + option);}
		catch(e) {return false;}
	},

	setFolderEntries: function(folderEntries) {
		try {
		var json = JSON.stringify(folderEntries)

		var str = Components.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = json;

		this.service.setComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString, str);
		//this.service.setCharPref("QuickFolders.folders",json)
		}
		catch(e) {
			QuickFolders.Util.logToConsole("setFolderEntries()" + e);
		}
	} ,

	getFolderEntries: function() {
		if(!this.service.prefHasUserValue("QuickFolders.folders")) {
			return [];
		}

		try {
			var folders = this.service.getComplexValue("QuickFolders.folders", Components.interfaces.nsISupportsString).data;
			// fall back for old version
			if (folders.length<3)
				folders = this.service.getCharPref("QuickFolders.folders");

			if(folders)
				return JSON.parse(folders);
			else
				return [];
		}
		catch(e) {
			QuickFolders.Util.logToConsole("getFolderEntries()" + e);
			return [];
		}
	} ,

	isShowUnreadCount: function() {
		return this.service.getBoolPref("extensions.quickfolders.showUnreadOnButtons");
	} ,

	isShowQuickFoldersLabel: function() {
		return this.service.getBoolPref("extensions.quickfolders.showQuickfoldersLabel");
	} ,

	isShowUnreadFoldersBold: function() {
		return this.service.getBoolPref("extensions.quickfolders.showUnreadFoldersBold");
	} ,

	isShowRecursiveFolders: function() {
		return this.service.getBoolPref("extensions.quickfolders.showSubfolders");
	} ,

	isUseNavigateShortcuts: function() {
		return this.service.getBoolPref("extensions.quickfolders.useNavigateShortcuts");
	} ,

	isUseKeyboardShortcuts: function() {
		return this.service.getBoolPref("extensions.quickfolders.useKeyboardShortcuts");
	} ,

	isUseRebuildShortcut: function() {
		return this.service.getBoolPref("extensions.quickfolders.useRebuildShortcut");
	} ,

	RebuildShortcutKey: function() {
		return this.service.getCharPref("extensions.quickfolders.rebuildShortcutKey");
	} ,

	isUseKeyboardShortcutsCTRL: function() {
		return this.service.getBoolPref("extensions.quickfolders.useKeyboardShortcutCTRL");
	} ,

	isShowShortcutNumbers: function() {
		return this.service.getBoolPref("extensions.quickfolders.showShortcutNumber");
	} ,

	isShowTotalCount: function() {
		return this.service.getBoolPref("extensions.quickfolders.showTotalNumber");
	} ,

	isShowCountInSubFolders: function() {
		return this.service.getBoolPref("extensions.quickfolders.showCountInSubFolders");
	} ,

	isShowFoldersWithMessagesItalic: function() {
		return this.service.getBoolPref("extensions.quickfolders.showFoldersWithMessagesItalic");
	} ,

	isFocusPreview: function() {
		return this.service.getBoolPref("extensions.quickfolders.autoFocusPreview");
	} ,

	isShowToolbarIcons: function() {
		return this.service.getBoolPref("extensions.quickfolders.showIcons");
	} ,

	isChangeFolderTreeViewEnabled: function() {
		return !this.service.getBoolPref('extensions.quickfolders.disableFolderSwitching');
	} ,

	isSortSubfolderMenus: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.enableMenuAlphaSorting');
	} ,

	isShowRecentTab: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.showRecentTab');
	} ,

	isShowRecentTabIcon: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.recentfolders.showIcon');
	} ,

	isPastelColors: function () {
		return this.service.getBoolPref( 'extensions.quickfolders.pastelColors');
	} ,

	recentTabColor: function() {
		return this.service.getIntPref( 'extensions.quickfolders.recentfolders.color');
	} ,


	isMinimalUpdateDisabled: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.update.disableMinimal');
	} ,

	isShowToolIcon: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.showToolIcon');
	} ,


	getButtonFontSize: function() {
		return this.service.getCharPref("extensions.quickfolders.buttonFontSize");
	} ,

	setLastSelectedCategory: function(category) {
		// avoid error when no categories exist
		if (category)
			this.service.setCharPref("extensions.quickfolders.lastSelectedCategory", category);
	} ,

	getTextQuickfoldersLabel: function() {
		try { // to support UNICODE: https://developer.mozilla.org/pl/Fragmenty_kodu/Preferencje
			return this.service.getComplexValue("extensions.quickfolders.textQuickfoldersLabel", Components.interfaces.nsISupportsString).data;
		}
		catch(e) { return 'QuickFolders'; }
	},

	getLastSelectedCategory: function() {
		return this.service.getCharPref("extensions.quickfolders.lastSelectedCategory")
	},

	existsCharPref: function(pref) {
		try {
			if(this.service.prefHasUserValue(pref))
				return true;
			if (this.service.getCharPref(pref))
				return true;
		}
		catch (e) {return false; }
		return false;
	},

	existsBoolPref: function(pref) {
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
	tidyUpBadPreferences: function () {
		var isUpgradeSkinning = false;
		try {
			QuickFolders.Util.logDebugOptional('firstrun', 'tidyUpBadPreferences() ...');
			// get rid of preferences that do not start with "preferences." and replace with newer versions.
			if (this.existsCharPref('QuickFolders.Toolbar.Style.background-color')) {
				var replacePref = function(id1, id2) {
					var service = QuickFolders.Preferences.service;
					var origPref = 'QuickFolders.' + id1 + '.Style.' + id2;
					var sValue = "";
					// save value set by user (if none, default will create it)
					if (service.prefHasUserValue(origPref)) {
						sValue = service.getCharPref(origPref);
						var newPref = 'extensions.quickfolders.style.' + id1 + '.' + id2;
						service.setCharPref(newPref, sValue);
						QuickFolders.Util.logDebugOptional('firstrun', 'QuickFolders Update: Replaced bad preference {' + origPref + '} with {' + newPref + '}  value=' + sValue );
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
				var theme = QuickFolders.Themes;

				if (this.service.getBoolPref("extensions.quickfolders.showFlatStyle"))
					this.setCurrentThemeId(theme.themes.Flat.Id);
				else {
					if (this.service.getBoolPref("extensions.quickfolders.showNativeTabStyle"))
						this.setCurrentThemeId(theme.themes.NativeTabs.Id);
					else
						this.setCurrentThemeId(theme.themes.ApplePills.Id); // Pills style
				}

				try {
					this.service.deleteBranch("extensions.quickfolders.showFlatStyle");
					this.service.deleteBranch("extensions.quickfolders.showNativeTabStyle");
					isUpgradeSkinning = true;
				}
				catch (ex) { alert(ex);};
			}
		}
		catch (ex) {
			QuickFolders.Util.logException("tidyUpBadPreferences",ex) ;
			return false;
		};
		return isUpgradeSkinning;
	},

	getUserStyle: function(sId, sType, sDefault) {
		// note: storing color as string in order to store OS specific colors like Menu, Highlight
		// usage: getUserStyle("ActiveTab","background-color","HighLight")
		// usage: getUserStyle("ActiveTab","color", "HighlightText")
		var sStyleName = 'extensions.quickfolders.style.' + sId + '.' + sType;
		var sReturnValue="";

		if(!this.service.prefHasUserValue(sStyleName)) {
			sReturnValue=sDefault;
		}
		else {
			var localPref= this.service.getCharPref(sStyleName);
			if(localPref)
				sReturnValue=localPref;
			else
				sReturnValue=sDefault
		}
		/* QuickFolders.Util.logToConsole("getUserStyle("+ sId+ ", " + sType + ", " + sDefault +")\n" +
				"Style Name: " + sStyleName + "\n" +
				"Value: " + sReturnValue) */
		return sReturnValue;
	},

	setUserStyle: function(sId, sType, sValue) {
		var sStyleName = 'extensions.quickfolders.style.' + sId + '.' + sType;
		this.service.setCharPref(sStyleName, sValue);

	},

	getInstantApplyPref: function() {
		return this.service.getBoolPref("browser.preferences.instantApply");
	},

	setInstantApplyPref: function(b) {
		return this.service.setBoolPref("browser.preferences.instantApply",b);
	},

	getIntPref: function(p) {
		return this.service.getIntPref(p);
	},

	setIntPref: function(p, v) {
		return this.service.setIntPref(p, v);
	},

	getBoolPref: function(p) {
		try {
			return this.service.getBoolPref(p);
		} catch(e) {
			var s="Err:" +e;
			return false;
		}
	},

	getBoolPrefQF: function(p) {
		return QuickFolders.Preferences.getBoolPref("extensions.quickfolders." + p);
	},

	getIntPrefQF: function(p) {
		return QuickFolders.Preferences.getIntPref("extensions.quickfolders." + p);
	},

	setIntPrefQF: function(p, v) {
		return this.setIntPref("extensions.quickfolders." + p, v);
	},

	setShowCurrentFolderToolbar: function(b) {
		return this.service.setBoolPref("extensions.quickfolders.showCurrentFolderToolbar",b);
	},

	isShowCurrentFolderToolbar: function() {
		return QuickFolders.Preferences.getBoolPrefQF("showCurrentFolderToolbar");
	},

	setBoolPref: function(p, v) {
		try {
			return this.service.setBoolPref(p, v);
		} catch(e) {
			var s="Err:" +e;
			return false;
		}
	} ,

	getCurrentTheme: function() {
		var id = this.getCurrentThemeId();
		return QuickFolders.Themes.Theme(id);
	},

	getCurrentThemeId: function() {
		return this.service.getCharPref("extensions.quickfolders.style.theme");
	},

	setCurrentThemeId: function(t) {
		return this.service.setCharPref("extensions.quickfolders.style.theme",t);
	}
}