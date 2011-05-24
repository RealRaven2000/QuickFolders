/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

QuickFolders.Model = {
	selectedFolders: [],

	addFolder: function(uri, categoryName) {
		var entry=this.getFolderEntry(uri)
		if(!entry) {

			var folder = this.getMsgFolderFromUri(uri, false);
			var folderName = (folder==null) ? '' : folder.prettyName;

			this.selectedFolders.push({
				uri: uri,
				name: folderName,
				category: categoryName
			});

			this.update();
			QuickFolders.Util.logToConsole ("\nQuickFolders: added Folder URI " + uri + "\nto Category: " + categoryName);
			return true;
		}
		else {
			try {
				alert(QuickFolders.Util.getBundleString("qfFolderAlreadyBookmarked","The folder " + uri  + " is already bookmarked."));
			} catch (e) { var msg="Folder already bookmarked: " + uri + "\nCan not display message - " + e; QuickFolders.Util.logToConsole (msg); alert(msg); }

			// switch to category if it exists
			QuickFolders.Interface.selectCategory(entry.category,true);
		}
		return false;
	} ,

	getFolderEntry: function(uri) {
		for(var i = 0; i < this.selectedFolders.length; i++) {
			if(this.selectedFolders[i].uri == uri) {
				return this.selectedFolders[i];
			}
		}

		return null;
	} ,

	removeFolder: function(uri, updateEntries) {
		for(var i = 0; i < this.selectedFolders.length; i++) {
			if(this.selectedFolders[i].uri == uri) {
				this.selectedFolders.splice(i,1);
			}
		}

		if (updateEntries)
			this.update();
	} ,

	renameFolder: function(uri, name) {
		var entry;

		if((entry = this.getFolderEntry(uri))) {
			entry.name = name;
			this.update();
		}
	} ,

	moveFolderURI: function(fromUri, toUri) {
		var entry;

		if((entry = this.getFolderEntry(fromUri))) {
			entry.uri = toUri;
			this.update();
			return true;
		}
		return false;

	} ,

	update: function() {
		QuickFolders.Preferences.setFolderEntries(this.selectedFolders);
		QuickFolders.Util.logDebug("model.update");
		QuickFolders.Interface.updateFolders(true, false);
	} ,

	setFolderColor: function(uri, tabColor, withUpdate) {
		var entry;
		QuickFolders.Util.logDebug("Model.setFolderColor("+uri+") = " + tabColor);

		if((entry = this.getFolderEntry(uri))) {
			entry.tabColor = tabColor;

			if (withUpdate)
				this.update();
			else  // only store, no visual update.
				QuickFolders.Preferences.setFolderEntries(this.selectedFolders);
		}
	},

	setFolderCategory: function(uri, name) {
		var entry;

		if((entry = this.getFolderEntry(uri))) {
			entry.category = name;
			this.update();
		}
	} ,

	getMsgFolderFromUri:  function(uri, checkFolderAttributes)
	{
		var msgfolder = null;
		if (QuickFolders.Util.Appver()>=3 || QuickFolders.Util.Application()=='SeaMonkey') {
			return (GetMsgFolderFromUri(uri, checkFolderAttributes));
		}
		try {
			var resource = GetResourceFromUri(uri);
			msgfolder = resource.QueryInterface(Components.interfaces.nsIMsgFolder);
			if (checkFolderAttributes) {
				if (!(msgfolder && (msgfolder.parent || msgfolder.isServer))) {
					msgfolder = null;
				}
			}
		}
		catch (ex) {
			 //dump("failed to get the folder resource\n");
		}
	return msgfolder;
	} ,



	getCategories: function() {
		var categories = [];

		// can we add a color per category?
		for(var i = 0; i < this.selectedFolders.length; i++) {
			var entry = this.selectedFolders[i];

			var category = entry.category;

			if(category && category != "") {
				// if the folder doesn't exist anymore, ignore this category
				try {
					if (!this.getMsgFolderFromUri(entry.uri, false)) continue;
				}
				catch(e) {
					QuickFolders.Util.logException("Exception while checking folder existence: ", e)

					continue;
				}

				if(categories.indexOf(category) == -1) {
					categories.push(category);
				}
			}
		}

		categories.sort(); // can we sort this? yes we can.
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