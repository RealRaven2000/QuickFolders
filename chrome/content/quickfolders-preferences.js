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
		var json = JSON.stringify(folderEntries)

		QuickFolders.Util.logDebug(json)

		this.service.setCharPref("QuickFolders.folders",json)
	} ,

	getFolderEntries: function() {
		if(!this.service.prefHasUserValue("QuickFolders.folders")) {
			return [];
		}

		var folders;

		if((folders = this.service.getCharPref("QuickFolders.folders"))) {
			return JSON.parse(folders);
		}
		else {
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

	setBoolPref: function(p, v) {
		try {
			return this.service.setBoolPref(p, v);
		} catch(e) {
			var s="Err:" +e;
			return false;
		}
	}

}