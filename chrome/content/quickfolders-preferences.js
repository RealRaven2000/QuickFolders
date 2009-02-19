QuickFolders.Preferences = {
    service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
    
    isDebug: function () {
	    return this.service.getBoolPref("extensions.quickfolders.debug"); 
    }, 
    

    setFolderEntries: function(folderEntries) {
        this.service.setCharPref("QuickFolders.folders",JSON.stringify(folderEntries));
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

    isUseKeyboardShortcuts: function() {
        return this.service.getBoolPref("extensions.quickfolders.useKeyboardShortcuts");
    } ,

    isShowShortcutNumbers: function() {
        return this.service.getBoolPref("extensions.quickfolders.showShortcutNumber");
    } ,

    isShowTotalCount: function() {
        return this.service.getBoolPref("extensions.quickfolders.showTotalNumber");
    } ,

    isShowFoldersWithMessagesItalic: function() {
        return this.service.getBoolPref("extensions.quickfolders.showFoldersWithMessagesItalic");
    } ,

    isShowToolbarFlatstyle: function() {
        return this.service.getBoolPref("extensions.quickfolders.showFlatStyle");
    } ,

    isShowToolbarIcons: function() {
        return this.service.getBoolPref("extensions.quickfolders.showIcons");
    } ,
    
    getButtonFontSize: function() {
        return this.service.getCharPref("extensions.quickfolders.buttonFontSize");
    } ,

    setLastSelectedCategory: function(category) {
        this.service.setCharPref("extensions.quickfolders.lastSelectedCategory", category);
    } ,

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
    }
    
}