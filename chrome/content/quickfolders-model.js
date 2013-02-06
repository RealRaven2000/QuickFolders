"use strict";
/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

QuickFolders.Model = {
	selectedFolders: [],
	categoriesList: [],
	paletteUpdated: false,

	addFolder: function(uri, categoryName) {
		QuickFolders.Util.logDebug("model.addFolder");
		var entry=this.getFolderEntry(uri);
		if (entry) {
			// adding existing folder ...
			var category = entry.category;
			if(!category) category = "";
			var currentCategory = QuickFolders.Interface.CurrentlySelectedCategoryName;
			// adding folder to a different category
			if (currentCategory && currentCategory!= category) {
					category = category
					+ ((category.length) ? '|' : '')
					+ currentCategory;
				entry.category = category;
				this.update();
				return true;
			}

		}
		if(!entry) {

			var folder = this.getMsgFolderFromUri(uri, false);
			var folderName = (folder==null) ? '' : folder.prettyName;

			this.selectedFolders.push({
				uri: uri,
				name: folderName,
				category: categoryName,
				tabColor: 0
			});

			this.update();
			QuickFolders.Util.logDebug ("\nQuickFolders: added Folder URI " + uri + "\nto Category: " + categoryName);
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
		QuickFolders.Util.logDebug("model.removeFolder");
		for(var i = 0; i < this.selectedFolders.length; i++) {
			if(this.selectedFolders[i].uri == uri) {
				this.selectedFolders.splice(i,1);
			}
		}

		if (updateEntries)
			this.update();
	} ,

	renameFolder: function(uri, name) {
		QuickFolders.Util.logDebug("model.renameFolder");
		var entry;

		if((entry = this.getFolderEntry(uri))) {
			entry.name = name;
			this.update();
		}
	} ,

	moveFolderURI: function(fromUri, toUri) {
		QuickFolders.Util.logDebug("model.moveFolderURI");
		var entry;

		if((entry = this.getFolderEntry(fromUri))) {
			entry.uri = toUri;
			this.update();
			return true;
		}
		return false;

	} ,

	update: function() {
		QuickFolders.Util.logDebug("model.update");
		QuickFolders.Preferences.setFolderEntries(this.selectedFolders);
		QuickFolders.Interface.updateFolders(true, false);
	} ,

	setFolderColor: function(uri, tabColor, withUpdate) {
		var entry;
		if (tabColor == 'undefined') 
			tabColor=0;
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
		if (QuickFolders.Util.Application=='Thunderbird' || QuickFolders.Util.Application=='SeaMonkey') {
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


	// for optimization, let's cache the categories array in a model attribute.
	// this means we need to reset categories whenever a folder changing operation is carried out
	// (if a folder is deleted, this might render a category as obsoletel;
	//  also whenever categories are added or removed.)
	resetCategories: function() {
		this.categoriesList=[];
	} ,
	 

	// get the list of Categories from the current Folder Array
	get Categories() {
		var categories = [];
		if (this.categoriesList.length>0)
			return this.categoriesList;

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

				// allow multiple categories - comma separated list
				if (category) {
					var cats = category.split('|');
					for (var j=0; j<cats.length; j++) { // add it to list if it doesn't exist already.
						if(    cats[j].length 
							&& cats[j] != '|' 
							&& categories.indexOf(cats[j]) == -1) 
						{
							categories.push(cats[j]);
						}
					}
				}
				
				
			}
		}

		categories.sort(); // can we sort this? yes we can.
		this.categoriesList = categories;
		return this.categoriesList;
	} ,

	isValidCategory: function(category) {
		return (
			   category == QuickFolders.FolderCategory.ALL
			|| category == QuickFolders.FolderCategory.UNCATEGORIZED 
			|| category == QuickFolders.FolderCategory.ALWAYS
			|| this.Categories.indexOf(category) != -1
		);
	} ,

	renameFolderCategory: function(oldName, newName) {
		QuickFolders.Util.logDebugOptional("categories","Model.renameFolderCategory()\n"
			+ "from: " + oldName 
			+ "to: "   + newName);
		var matches = 0;

		for(var i = 0; i < this.selectedFolders.length; i++) {
			var folder = this.selectedFolders[i];
			
			if (folder.category) {
				// multiple cats
				var cats = folder.category.split('|');
	
				for(var j=0; j<cats.length; j++)
					if(cats[j] == oldName) {
						cats[j] = newName;
					    matches ++;
					}
				
				folder.category = cats.join('|');
			}
			
		}
		QuickFolders.Util.logDebugOptional("categories","Model.renameFolderCategory()\n"
				+ "found and renamed " + matches + " matches.");

		this.update()
	} ,

	deleteFolderCategory: function(category) {
		QuickFolders.Util.logDebugOptional("categories","Model.deleteFolderCategory(" + category + ")");
		var folderList = '';
		for(var i = 0; i < this.selectedFolders.length; i++) {
			var folder = this.selectedFolders[i]

			if (folder.category) {
				// multiple cats
				var cats = folder.category.split('|');
	
				for(var j=0; j<cats.length; j++)
					if(cats[j] == category) {
						cats[j] = '';
						folderList = folderList + ',' + folder.name;
					}
					
				var str = cats.join('|');
					
				if(!str) {
					folder.category = null;
				}
				else {
					folder.category = str.replace('||','|'); // remove empty strings.
				}
			}
		}
		QuickFolders.Util.logDebugOptional("categories","removed folders from category " + category + ":\n"
			+ folderList);

		this.update()
	} ,
	
	colorName: function(paletteVersion, id) {
		if (paletteVersion==1) {
			switch(id) {
				case 0: return 'none';
				case 1: return 'light blue';
				case 2: return 'sky blue';
				case 3: return 'ultramarine';
				case 4: return 'navy';
				case 5: return 'jade';
				case 6: return 'light green';
				case 7: return 'neon lime';
				case 8: return 'green-yellow';
				case 9: return 'lemon custard';
				case 10: return 'yolk yellow';
				case 11: return 'orange';
				case 12: return 'mars red';
				case 13: return 'rust red';
				case 14: return 'deep purple';
				case 15: return 'pink';
				case 16: return 'white';
				case 17: return 'light gray';
				case 18: return 'medium gray';
				case 19: return 'dark gray';
				case 20: return 'black';
			}
		}
		return 'unknown color: ' + id;
	} ,
	
	updatePalette: function() {
		// we only do this ONCE
		if (this.paletteUpdated) 
			return;

		let currentPalette = QuickFolders.Preferences.getIntPref("style.palette.version");
		QuickFolders.Util.logDebug('QuickFolders.Model.updatePalette()\nCurrent Palette Version=' + currentPalette);
		if (currentPalette < 1) {
			let folderEntries = QuickFolders.Preferences.getFolderEntries();
	
			if(folderEntries.length > 0) {
				QuickFolders.Util.logDebug("Updating Palettes from version:" + currentPalette);
				let updateString='';
				for(var i = 0; i < folderEntries.length; i++) {
				
					let folderEntry = folderEntries[i];
					let tabColor = 0;
					try {tabColor = parseInt(folderEntry.tabColor, 10);}
					catch(ex) { tabcolor=-1; }
					let old=tabColor;
					if (tabColor>=0) {
						switch(tabColor) {
							case  1: tabColor = 10; break;
							case  2: tabColor =  7; break;
							case  3: tabColor = 11; break;
							case  4: tabColor =  6; break;
							case  5: tabColor =  2; break;
							case  6: tabColor = 14; break;
							case  7: tabColor =  5; break;
							case  8: tabColor = 15; break;
							case  9: tabColor = 13; break;
							case 10: tabColor = 12; break;
							case 11: tabColor =  1; break;
							case 12: tabColor =  9; break;
							case 13: tabColor =  4; break;
							case 14: tabColor = 17; break;
							case 15: tabColor = 18; break;
							case 16: tabColor = 19; break;
							case 17: tabColor =  8; break;
							case 18: tabColor =  3; break;
							case 19: tabColor = 20; break;
							case 20: tabColor = 16; break;
						}
						updateString += i.toString() + '. changing palette entry for ' + folderEntry.name 
						                + ' from ' + old 
						                + ' to ' + tabColor 
						                + ' = ' + this.colorName(1, tabColor) + '\n';
						folderEntries[i].tabColor = tabColor;
						
					}
				}
				QuickFolders.Util.logDebug(updateString);
				QuickFolders.Model.selectedFolders = folderEntries;

				QuickFolders.Util.logDebug('Palette updated!');
				this.paletteUpdated = true;

				QuickFolders.Interface.updateFolders(true, false);
				QuickFolders.Preferences.setFolderEntries(folderEntries);
	
			}
			QuickFolders.Preferences.setIntPref("style.palette.version", 1);
	
		}
		
		
	}
}