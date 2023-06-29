"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");

QuickFolders.Model = {
  MAX_UNPAID_TABS: 10,
  MAX_STANDARD_TABS: 25,
  MAX_UNPAID_ICONS: 5,
  MAX_STANDARD_ICONS: 12,
  selectedFolders: [],
  categoriesList: [],
  paletteUpdated: false,
  paletteUpgraded: false,

  addFolder: function addFolder(uri, categories) {
    function unpackURI(URL) {
      if (!URL) return URL;
      // remove url(...) from Icon file name for storing in model.entry.icon
      return URL.substr(4, URL.length-5);
    }
    const util = QuickFolders.Util,
		      QI = QuickFolders.Interface;
    util.logDebug("model.addFolder");
    let entry = this.getFolderEntry(uri);
    if (entry) {
      // adding existing folder ...
			// avoid current currentCategoryList is null
      let category = entry.category || '',
          currentCategoryList = QI.CurrentlySelectedCategories || '',
					newCats = currentCategoryList.split('|'),
					oldCats = category.split('|'),
					addCats = [],
					isVisible = false;
			for (let i=0; i<newCats.length; i++) {
				if (oldCats.indexOf(newCats[i]) == -1) {
					// list of currently selected categories this entry is not currently part of
					addCats.push(newCats[i]); 
				}
				else
					isVisible = true; // we already see the tab
			}
      // adding folder to more categories
      if (addCats.length) {
        category = (oldCats.concat(addCats)).join('|');
        entry.category = category;
        this.update();
				QuickFolders_MySelectFolder(entry.uri); // select folder to make more obvious
        return true;
      }
			// the entry exists in all categories
			try {
				util.alert(util.getBundleString("qfFolderAlreadyBookmarked"));
				// select folder to make more obvious
				QuickFolders_MySelectFolder(entry.uri);
			} catch (e) { 
				let msg = "Folder already bookmarked: " + uri + "\nCan not display message - " + e; 
				util.logToConsole (msg); 
				util.alert(msg); 
			}
		
    }
    // Create entirely new QF Tab
    else {
      let folder = this.getMsgFolderFromUri(uri, false),
          iconURI = null;
      if (typeof gFilterTreeView !== "undefined" 
          && gFolderTreeView.supportsIcons
          && folder
					&& folder.getStringProperty) {
        try {
          iconURI =  unpackURI(folder.getStringProperty("iconURL"));
        }
        catch(ex) {;}
      }
      // [issue 281]
      let ac = MailServices.accounts.FindAccountForServer(folder.server);
      let account = "";
      if (ac) {
        account = ac.key;
      }
      else {
        account = "?account";
      }

      this.selectedFolders.push({
        account: account,
        uri: uri,
        name: (folder==null) ? '' : folder.prettyName,
        category: categories,
        tabColor: 0,
        icon: iconURI
      });

      this.update();
      util.logDebug ("\nQuickFolders: added Folder URI " + uri + "\nto Categories: " + categories);
      return true;
    }

    return false;
  } ,

  getFolderEntry: function getFolderEntry(uri) {
    if (!uri) return null;
    for (let i = 0; i < this.selectedFolders.length; i++) {
      if(this.selectedFolders[i].uri == uri) {
        return this.selectedFolders[i];
      }
    }
    return null;
  } ,
  
  getButtonEntry: function getButtonEntry(button) {
    if (!button.folder) return null;
    return this.getFolderEntry(button.folder.URI);
  } ,

  removeFolder: function removeFolder(uri, updateEntries) {
    QuickFolders.Util.logDebug("model.removeFolder");
    for (let i = 0; i < this.selectedFolders.length; i++) {
      if(this.selectedFolders[i].uri == uri) {
        this.selectedFolders.splice(i,1);
      }
    }

    if (updateEntries)
      this.update();
  } ,

  renameFolder: function renameFolder(uri, name) {
    QuickFolders.Util.logDebug("model.renameFolder");
    let entry;

    if((entry = this.getFolderEntry(uri))) {
      entry.name = name;
      this.update();
    }
  } ,

  // second argument can be a folder name or Uri
  // we test if it contains "://" for URI
  moveFolderURI: function moveFolderURI(fromUri, newName) {
    let changeLog = "",
        countUris = 0,
        toUri = newName.indexOf('://')>0
                ? newName
                : fromUri.substr(0, fromUri.lastIndexOf('/')+1) + encodeURIComponent(newName); // include the /
        
    QuickFolders.Util.logDebug("model.moveFolderURI:" + 
                               "\nOLD: " + fromUri + 
                               "\nNEW: " + toUri);
      
    if(!newName || (toUri == fromUri))  
      return 0;    
    // [Bug 260965]
    // we must iterate all entries to check for any tabs that 
    // point to subfolders that might be affected!
		let decodedUri = decodeURI(fromUri);
    for (let i = 0; i < this.selectedFolders.length; i++) {
      let entry = this.selectedFolders[i];
      if(decodeURI(entry.uri).indexOf(decodedUri)==0) {
				entry.uri = entry.uri.replace(fromUri, toUri);			
        entry.disableValidation = true; // disable validation (IMAP only?)
        changeLog += "\n  " + entry.name + ": "+ entry.uri;
        countUris++;
      }
    }
    
    if(countUris) {
      QuickFolders.Util.logDebug("Changed URI for " + countUris + " Tabs:" + changeLog);
      this.update();
    }
    return countUris;
  } ,

  store: function store() {
    QuickFolders.Preferences.storeFolderEntries(QuickFolders.Model.selectedFolders);
  } ,
  
  update: function update() {
    QuickFolders.Util.logDebug("model.update");
    this.store();
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" }); // QuickFolders.Interface.updateFolders(true, false);
  } ,

  setTabIcon: function setTabIcon(button, entry, iconURI, menuItem) {
		const QI = QuickFolders.Interface;
    let fileSpec = '';
    if (iconURI) {
      let fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
			try {
				QuickFolders.Util.logDebug("Model.setTabIcon(" + entry.name + "," + fileURL.asciiSpec + ")");
			} catch(ex) {;}
      fileSpec = fileURL.asciiSpec;
    }
    
		try { // [Bug 26616] - didn't store icons because menuItem.nextSibling was not set
			if (fileSpec)  {
				entry.icon = fileSpec; 
				if (button) 
					QI.applyIcon(button, entry.icon);
				if (menuItem && menuItem.nextSibling)
					menuItem.nextSibling.collapsed = false; // uncollapse the menu item for removing icon
			}
			else {
				if (entry.icon) delete entry.icon;
				if (button)
					QI.applyIcon(button, '');
			}
		}
		catch (ex) {;}
      
    // store the icon path
    QuickFolders.Preferences.storeFolderEntries(this.selectedFolders);
  } ,

  setFolderColor: function setFolderColor(uri, tabColor, withUpdate) {
    let entry;
    if (tabColor == 'undefined') 
      tabColor=0;
    QuickFolders.Util.logDebug("Model.setFolderColor("+uri+") = " + tabColor);

    if((entry = this.getFolderEntry(uri))) {
      entry.tabColor = tabColor;

      if (withUpdate)
        this.update();
      else  // only store, no visual update.
        QuickFolders.Preferences.storeFolderEntries(this.selectedFolders);
    }
  },

  setFolderCategory: function setFolderCategory(uri, name) {
    let entry;

    if((entry = this.getFolderEntry(uri))) {
			if (name == QuickFolders.FolderCategory.UNCATEGORIZED)
				name=null;
      entry.category = name;
      this.update();
    }
  } ,

  setTabSeparator: function setTabSeparator(entry, isSpace) {
    if(entry) {
      // add class "spaced" with .spaced { margin-left: 2em;}
      if (isSpace) {
        if (!QuickFolders.Util.hasValidLicense() || QuickFolders.Util.hasStandardLicense()) {
          QuickFolders.Util.popupRestrictedFeature("tabSeparator");
          return;
        }
        entry.separatorBefore = true;
      }
      else
        delete entry.separatorBefore;
      this.update();
    }
  } ,
  
  setFolderLineBreak: function setFolderLineBreak(entry, isBreak) {
    // insert before: <br xmlns="http://www.w3.org/1999/xhtml" />
    if(entry) {
      if (isBreak) {
        if (!QuickFolders.Util.hasValidLicense() || QuickFolders.Util.hasStandardLicense()) {
          QuickFolders.Util.popupRestrictedFeature("lineBreaks");
          return;
        }
        entry.breakBefore = true;
      }
      else
        delete entry.breakBefore;
      this.update();
    }
  } ,

  getMsgFolderFromUri:  function getMsgFolderFromUri(uri, checkFolderAttributes) {
    const util = QuickFolders.Util;
    let msgfolder = MailUtils.getExistingFolder(uri, checkFolderAttributes);
		if (msgfolder && !msgfolder.parent && !msgfolder.isServer) {
      util.logToConsole(`getMsgFolderFromUri(${uri}, ${checkFolderAttributes}) could not retrieve valid folder!`, msgfolder)
      return null; // invalid folder
    }
    return msgfolder;
  } ,

  // for optimization, let's cache the categories array in a model attribute.
  // this means we need to reset categories whenever a folder changing operation is carried out
  // (if a folder is deleted, this might render a category as obsolete;
  //  also whenever categories are added or removed.)
  resetCategories: function resetCategories() {
    this.categoriesList=[];
  } ,

  // get a sorted arrau of Categories from the current Folder Array
  get Categories() {
    let categories = [];
    if (this.categoriesList.length>0)
      return this.categoriesList; // return cached version of Categories list

    // can we add a color per category?
    for (let i = 0; i < this.selectedFolders.length; i++) {
      let entry = this.selectedFolders[i],
          category = entry.category;

      if (category) {
				// CHANGE restore tabs allows for invalid folder URLs. caregories must still be added.
        // if the folder doesn't exist anymore, we still show category (because of restore function)
        // allow multiple categories - comma separated list
        if (category) {
          let cats = category.split('|');
          for (let j=0; j<cats.length; j++) { // add it to list if it doesn't exist already.
            if  (cats[j].length 
              && cats[j] != '|' 
              && categories.indexOf(cats[j]) == -1) 
            {
							// includes the special category "NEVER" (folder alias)
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

  renameFolderCategory: function renameFolderCategory(oldName, newName) {
    QuickFolders.Util.logDebugOptional("categories","Model.renameFolderCategory()\n"
      + "from: " + oldName 
      + "to: "   + newName);
    let matches = 0;

    for (let i = 0; i < this.selectedFolders.length; i++) {
      let folder = this.selectedFolders[i];
      
      if (folder.category) {
        // multiple cats
        let cats = folder.category.split('|');
  
        for (let j=0; j<cats.length; j++)
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

  deleteFolderCategory: function deleteFolderCategory(category, noUpdate) {
    QuickFolders.Util.logDebugOptional("categories","Model.deleteFolderCategory(" + category + ")");
    let folderList = '';
    for (let i = 0; i < this.selectedFolders.length; i++) {
      let folder = this.selectedFolders[i];
      if (folder.category) {
        // herding cats
        let cats = folder.category.split('|');
  
        for (let j=0; j<cats.length; j++) {
          if (cats[j] == category) {
            cats[j] = '';
            folderList = folderList + ',' + folder.name;
          }
        }
          
        let str = cats.join('|');   
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

    if (!noUpdate) // avoid multiple updates when deleting multiple categories!
			this.update();
  } ,
  
  colorName: function colorName(paletteVersion, id) {
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
  
  correctFolderEntries: function (entries, withStorage = true) {
    let needsPatch = false;
    let is102 = QuickFolders.Util.versionGreaterOrEqual(QuickFolders.Util.Appversion, "102");
    
    function addAccountKey(e) {
      // [issue 281] - convert to new format
      if (!e.uri) {
        return;
      }
      let f = QuickFolders.Model.getMsgFolderFromUri(e.uri, false); // nsIMsgFolder
      if (!f) {
        e.account = "?uri";
        return false;
      }
      if (!f.server) {
        e.account = "?server";
        return false;
      }
      let ac = MailServices.accounts.FindAccountForServer(f.server);
      if (!ac) {
        e.account = "?account";
        return false;
      }
      e.account = ac.key;
      if (e.invalid) {
        delete e.invalid;
      }
      return true;
    }
    
    function reconstructUri(e) {
      let ac = MailServices.accounts.getAccount(e.account), acType = "N/A";
      if (ac && ac.incomingServer) {
        acType = ac.incomingServer.type || "unknown";
        if (acType!="im") { // do not reconnect to chat accounts - these are not supported.
          let oldUri = e.uri.replace("imap://", "http://"); // non-existent imap URIs throw!!
          let tempUri = Services.io.newURI(oldUri); // generate a fresh URI to retrieve path portion
          // or oldUri.filePath - not sure whether query params make sense or are allowed for  folder URIS
          return ac.incomingServer.serverURI + tempUri.pathQueryRef; 
        }
      }
      throw new Error(`Failed to reconstruct URL for ${e.uri} of account ${e.account} - account type ${acType}`);
    }

    for (let i = 0; i < entries.length; i++) {
      let e = entries[i];
      if (!e.account) {
        needsPatch = true;
        addAccountKey(e);
      }
      // Thunderbird 102 correction: read valid! account attribute, then try to match the folder to the account.
      if (is102 && e.uri) {
        let f = QuickFolders.Model.getMsgFolderFromUri(e.uri, false);
        if (e.account && !e.account.startsWith("?")) {
          if (f) {
            // The folder was found, clear invalid flag!
            if (e.invalid) {
              delete e.invalid;
            }
            continue;
          }
          // Folder uri is invalid, reconstruct!
          try {
            let newUri = reconstructUri(e); // this should make a new uri based on the current account key and remaining path
            // Validate the reconstructed uri.
            f = QuickFolders.Model.getMsgFolderFromUri(newUri, false);
            if (!f) {
              throw new Error(`Reconstructed URL ${newUri} for ${e.uri} of account ${e.account} is invalid`);
            }
            needsPatch = true;
            console.log(`QuickFolders\nSuccessfully fixed URI for folder ${f.prettyName}:\n%c${newUri}`, "background: blue; color:white;");
            e.uri = newUri;
            delete e.invalid;
          } catch (ex) {
            console.log(`QuickFolders\n%c${ex.message}`, "background: rgb(120,0,0); color:white;");
          }
        } else {
          if (f && (e.account.startsWith("?") || e.invalid)) {
            // The folder was found, add account key once again!
            if (addAccountKey(e)) { // account was corrected with a real accountname
              needsPatch = true;
            }
          }
          // No valid account, matching magic!
          // TO DO LATER.
        }
      }
    }
    
    if (needsPatch && withStorage) {
      QuickFolders.Preferences.storeFolderEntries(entries);
    }
  },
  
  // new palette indices
  updatePalette: function updatePalette() {
    // we only do this ONCE
    if (this.paletteUpdated) 
      return;

    let currentPalette = QuickFolders.Preferences.getIntPref("style.palette.version");
    QuickFolders.Util.logDebug('QuickFolders.Model.updatePalette()\nCurrent Palette Version=' + currentPalette);
    if (currentPalette < 1) {
      let folderEntries = QuickFolders.Preferences.loadFolderEntries();
  
      if (folderEntries.length > 0) {
        QuickFolders.Util.logDebug("Updating Palettes from version:" + currentPalette);
        let updateString='';
        for (let i = 0; i < folderEntries.length; i++) {
        
          let folderEntry = folderEntries[i],
              tabColor = 0;
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

        QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" }); // QuickFolders.Interface.updateFolders(true, false);
        QuickFolders.Preferences.storeFolderEntries(folderEntries);
  
      }
      QuickFolders.Preferences.setIntPref("style.palette.version", 1);
  
    }
  } ,
  
  // new upgrade function to switch over to multiple palettes
  upgradePalette: function upgradePalette(prefSvc) {
    function getBoolPref(key, boolDefault) {
      let result;
      try {
        result = prefSvc.getBoolPref(key)
      }
      catch(ex) {
        result = boolDefault;
      }
      finally {
        return result;
      }
    }
    function setPaletteType(key, wasPalette) {
      prefSvc.setIntPref('style.' + key + '.paletteType', wasPalette ? (wasPastel ? 2 : 1) : 0);
      let pType = prefSvc.getIntPref('style.' + key + '.paletteType');
      return key + " usePalette - was " + wasPalette + " ==> " + pType + " (" + QuickFolders.Interface.getPaletteClassToken(pType) + ")";
    }
    
    if (this.paletteUpgraded)
      return;
    QuickFolders.Util.logDebugOptional ("firstrun", "Upgrading Palette for 3.12...");
    
    let wasPastel = getBoolPref('pastelColors', true),
        wasInactivePalette = getBoolPref('style.InactiveTab.usePalette',false),
        wasActivePalette = getBoolPref('style.ActiveTab.usePalette',true),
        wasHoveredPalette = getBoolPref('style.HoveredTab.usePalette',false),
        wasDragOverPalette = getBoolPref('style.DragOver.usePalette',false);
    
    // default to no palette
    let s1 = setPaletteType('InactiveTab', wasInactivePalette),
        s2 = setPaletteType('ColoredTab', true), // this must use palette always, by definition!
        // default to "like Inactive Tab"
        s3 = setPaletteType('ActiveTab', wasActivePalette),
        s4 = setPaletteType('HoveredTab', wasHoveredPalette),
        s5 = setPaletteType('DragOver', wasDragOverPalette);
    
    QuickFolders.Util.logDebugOptional ("firstrun", "New Palette types selected:\n"
      + '(uncolored) ' + s1 + "\n"
      + s2 + "\n"
      + s3 + "\n"
      + s4 + "\n"
      + s5 + "\n");
      
    this.paletteUpgraded = true;
  } ,
  
  // moved from quickfolders-change-order.js
	insertAtPosition: function(buttonURI, targetURI, toolbarPos) {
		let folderEntry, folder, iSource, iTarget,
		    modelSelection = QuickFolders.Model.selectedFolders;

		switch(toolbarPos) {
			case "LeftMost":
				iTarget = 0;
				break;
			case "RightMost":
				iTarget = modelSelection.length-1;
				break;
		}

		for (let i = 0; i < modelSelection.length; i++) {
			folderEntry = QuickFolders.Model.selectedFolders[i];
			folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);

			if (toolbarPos=="")
				if (folderEntry.uri==targetURI) {
					iTarget = i;
					if (iSource!=null) break;
				}

			if (folderEntry.uri==buttonURI) {
				iSource = i;
				if (iTarget!=null) break;
			}
		}

		//button not found: might have been a menu item to add a new button!
		if (iSource==null && targetURI=="")
			return false;


		if (iSource!=iTarget)
		{
			let tmp;
			if (iSource<iTarget) { // drag right
				for (let i=iSource; i<iTarget; i++) {
					tmp = modelSelection[i];
					modelSelection[i] = modelSelection[i+1];
					modelSelection[i+1] = tmp;
				}
			}
			else {  // drag left
				for (let i=iSource; i>iTarget; i--) {
					tmp = modelSelection[i];
					modelSelection[i] = modelSelection[i-1];
					modelSelection[i-1] = tmp;
				}
			}
			QuickFolders.Model.update(); // update folders!
		}
		return true;
   }
   
}  // Model

  // cache accounts for speed??
  /*
  let folderAccounts = [],
      Accounts = MailServices.accounts,
  for (let a=0; a<Accounts.length; a++) {
    let account = Accounts[a]; // nsIMsgAccount
    let fA = folderAccounts.find(e => e.key == account.key);
    if (!fA && account.defaultIdentity) {
      folderAccounts.push (
        {
          key: account.key,
          name: account.incomingServer.prettyName,
          idName: account.defaultIdentity.fullName,
          serverKey: account.incomingServer.key,
          hostName: account.incomingServer.hostName,
          username: account.incomingServer.username
        }
      )
    }
  }
  */

