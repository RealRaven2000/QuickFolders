QuickFolders.Preferences = {
    service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

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

    getButtonFontSize: function() {
        return this.service.getCharPref("extensions.quickfolders.buttonFontSize");
    } ,

    setLastSelectedCategory: function(category) {
        this.service.setCharPref("extensions.quickfolders.lastSelectedCategory", category);
    } ,

    getLastSelectedCategory: function() {
        return this.service.getCharPref("extensions.quickfolders.lastSelectedCategory")
    }
}