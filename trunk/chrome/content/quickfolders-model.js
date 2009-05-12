var gquickfoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var _bundle = gquickfoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");
QuickFolders.Model = {
    selectedFolders: [],

    addFolder: function(uri, categoryName) {
        if(!this.getFolderEntry(uri)) {
            this.selectedFolders.push({
                uri: uri,
                name: '',
                category: categoryName
            });

            this.update();
            QuickFolders.Util.logToConsole ("\nQuickFolders: added Folder URI " + uri + "\nto Category: " + categoryName);

        }
        else {
            alert(_bundle.GetStringFromName("qfFolderAlreadyBookmarked"));
        }
    } ,

    getFolderEntry: function(uri) {
        for(var i = 0; i < this.selectedFolders.length; i++) {
            if(this.selectedFolders[i].uri == uri) {
                return this.selectedFolders[i];
            }
        }

        return false;
    } ,

    removeFolder: function(uri) {
        for(var i = 0; i < this.selectedFolders.length; i++) {
            if(this.selectedFolders[i].uri == uri) {
                this.selectedFolders.splice(i,1);
            }
        }

        this.update();
    } ,

    renameFolder: function(uri, name) {
        var entry;

        if((entry = this.getFolderEntry(uri))) {
            entry.name = name;
            this.update();
        }
    } ,

    update: function() {
        QuickFolders.Preferences.setFolderEntries(this.selectedFolders);
        QuickFolders.Interface.updateFolders();
    } ,

    setFolderCategory: function(uri, name) {
        var entry;

        if((entry = this.getFolderEntry(uri))) {
            entry.category = name;
            this.update();
        }
    } ,

    getCategories: function() {
        var categories = []
        // can we sort this?
        // can we add a color per category?
        for(var i = 0; i < this.selectedFolders.length; i++) {
            var entry = this.selectedFolders[i]

            // if the folder doesn't exist anymore, ignore this category
            if(!GetMsgFolderFromUri(entry.uri, true)) {
                continue;
            }

            var category = entry.category;

            if(category && category != "") {
                if(categories.indexOf(category) == -1) {
                    categories.push(category);
                }
            }
        }

        return categories;
    } ,

    isValidCategory: function(category) {
        return (
            category == "__ALL"
            || category == "__UNCATEGORIZED"
            || category == "__ALWAYS"
            || this.getCategories().indexOf(category) != -1
        );
    } ,

    renameFolderCategory: function(oldName, newName) {
        for(var i = 0; i < this.selectedFolders.length; i++) {
            var folder = this.selectedFolders[i]

            if(folder.category == oldName) {
                folder.category = newName
            }
        }

        this.update()
    } ,

    deleteFolderCategory: function(category) {
        for(var i = 0; i < this.selectedFolders.length; i++) {
            var folder = this.selectedFolders[i]

            if(folder.category == category) {
                folder.category = null
            }
        }

        this.update()
    }
}