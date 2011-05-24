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

	isShowToolbarFlatstyle: function() {
		return this.service.getBoolPref("extensions.quickfolders.showFlatStyle");
	} ,

	isShowToolbarNativeTabstyle: function() {
		return this.service.getBoolPref("extensions.quickfolders.showNativeTabStyle");
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

	isMinimalUpdateDisabled: function() {
		return this.service.getBoolPref( 'extensions.quickfolders.update.disableMinimal');
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

	getUserStyle: function(sId, sType, sDefault) {
		// note: storing color as string in order to store OS specific colors like Menu, Highlight
		// usage: getUserStyle("ActiveTab","background-color","HighLight")
		// usage: getUserStyle("ActiveTab","color", "HighlightText")
		var sStyleName = "QuickFolders." + sId + ".Style." + sType;
		var sReturnValue="";

		if(!this.service.prefHasUserValue(sStyleName)) {
			sReturnValue=sDefault
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
		var sStyleName = "QuickFolders." + sId + ".Style." + sType;
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
	}

}