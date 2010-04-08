var gQuickFoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var QuickFolders_bundle = gQuickFoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");

QuickFolders.Model = {
	selectedFolders: [],

	addFolder: function(uri, categoryName) {
		var entry=this.getFolderEntry(uri)
		if(!entry) {
			this.selectedFolders.push({
				uri: uri,
				name: '',
				category: categoryName
			});

			this.update();
			QuickFolders.Util.logToConsole ("\nQuickFolders: added Folder URI " + uri + "\nto Category: " + categoryName);
			return true;
		}
		else {
			try {
			alert(QuickFolders_bundle.GetStringFromName("qfFolderAlreadyBookmarked"));
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
		QuickFolders.Interface.updateFolders(true);
	} ,

	setFolderColor: function(uri, tabColor) {
		var entry;
		QuickFolders.Util.logDebug("Model.setFolderColor("+uri+") = " + tabColor);

		if((entry = this.getFolderEntry(uri))) {
			entry.tabColor = tabColor;

			this.update();
		}
	},

	setFolderCategory: function(uri, name) {
		var entry;

		if((entry = this.getFolderEntry(uri))) {
			entry.category = name;
			this.update();
		}
	} ,

   qfGetMsgFolderFromUri:  function(uri, checkFolderAttributes)
   {
	 var msgfolder = null;
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
				  if (QuickFolders.Util.Appver()>=3 || QuickFolders.Util.Application()=='SeaMonkey') {
					if(!GetMsgFolderFromUri(entry.uri, false)) continue;
				  }
				  else {
					if (!this.qfGetMsgFolderFromUri(entry.uri, false)) continue;
				  }
				}
				catch(e) {
					QuickFolders.Util.logDebug("Exception while checking folder existence: " + e)

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