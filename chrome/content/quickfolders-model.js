"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

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
      // SeaMonkey: GetFolderTree().view
      if (typeof gFilterTreeView !== "undefined" 
          && gFolderTreeView.supportsIcons
					&& folder.getStringProperty) {
        iconURI =  unpackURI(folder.getStringProperty("iconURL"));
      }

      this.selectedFolders.push({
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
/*				
				// instead of replace do a mechanical substrings replacement.
				// this will honor changes caused by server side encoding / decoding
				let newUri = [],
						src = entry.uri.split("/"),
				    targ = toUri.split("/"),
						srcPos = 0,
						targPos = 0; // source string can have more parts, as it can be a subfolder.
				// find where path diverges:
				while (src[srcPos] == targ[targPos] && srcPos<src.length && targPos<targ.length) {
					newUri.push(toUri[targPos]);
					srcPos++; 
					targPos++;
				}
				// find the last slash in the URI string that matches, remove the front and insert the new path string
				srcPos--;
				let startPath = newUri.join("/");
				
				// find next match:
				{
					let k = srcPos, 
					    isMatch = false;
					while (!isMatch && k<src.length) {
						if (src[srcPos] == targ[k])
							isMatch = true;
						else k++;
					}
					if (isMatch) { // target longer than src.
						// remove extra stuff from src - continue at k
						while (k<targ.length) {
							newUri.push(targ[k]);
							k++;
						}
					}
					else {
						if (targ[srcPos] == src[k])
					}
				}
				
						
				for (let x=0; x<targ.length; x++) {
					src[x] = targ[x]; // overwrite with correctly encoded parts. keep the rest (any following parts).
				}
        entry.uri = src.join("/");// entry.uri.replace(fromUri, toUri);
*/				
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
   },
   

  // removed from options.js
  // the parameters will be empty when called from HTML
  // because there is no Preferences object in the HTML namespace
	storeConfig: async function(preferences, prefMap) {
		// see options.copyFolderEntries
    const Cc = Components.classes,
          Ci = Components.interfaces,
		      service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
					util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					sFolderString = service.getStringPref("QuickFolders.folders");
		let obj = JSON.parse(sFolderString),
        storedObj = { 
          folders: obj,
          general: [],
          advanced: [],
          layout: [],
          userStyle: []
        }; // wrap into "folders" subobject, so we can add more settings
    let isLicense = (QuickFolders.Util.licenseInfo.isExpired || QuickFolders.Util.licenseInfo.isValidated);
    if (isLicense) {
      storedObj.premium = [];
    }
    
    util.logDebug("Storing configuration...")

    // LEGACY BRANCH - if called from background this will contain the event
    let prefInfos = preferences.getAll();
    for (let info of prefInfos) {
      let originId = prefMap[info.id];
      let node = { key: info.id, val: info.value, originalId: originId };
      if (originId) {
        switch (originId.substr(0,5)) {
          case 'qfpg-':  // general
            storedObj.general.push(node);
            break;
          case 'qfpa-':  // advanced
            storedObj.advanced.push(node);
            break;
          case 'qfpl-':  // layout
            storedObj.layout.push(node);
            break;
          case 'qfpp-':  // premium - make sure not to import the License without confirmation!
            if (isLicense)
              storedObj.premium.push(node);
            break;
          default:
            util.logDebug("Not storing - unknown preference category: " + node.key);
        }
      }
      else {
        util.logDebug("Not found - map entry for " + info.id);
      }
    }
    
    // now save all color pickers.
    let elements = document.querySelectorAll("[type=color]"); //getElementsByTagName('html:input');
    for (let i=0; i<elements.length; i++) {
      let element = elements[i];
      let node = { elementInfo: element.getAttribute("elementInfo"), val: element.value };
      storedObj.userStyle.push(node);
    }
      
    
    // [issue 115] store selection for background dropdown
    const bgKey = 'currentFolderBar.background.selection';
    let backgroundSelection = prefs.getStringPref(bgKey);
    storedObj.layout.push({
      key: 'extensions.quickfolders.' + bgKey, 
      val: backgroundSelection, 
      originalId: 'qfpa-CurrentFolder-Selection'} 
    );

		let prettifiedJson = JSON.stringify(storedObj, null, '  ');
		this.fileConfig('save', prettifiedJson, 'QuickFolders-Config');
    util.logDebug("Configuration stored.")
	} ,

	loadConfig: async function(preferences) {
    const prefs = QuickFolders.Preferences,
          options = QuickFolders.Options,
				  util = QuickFolders.Util;

		function changePref(pref) {
      let p = preferences.get(pref.key);
      if (p) {
        if (p._value != pref.val) {
          // [issue 115] fix restoring of config values
          util.logDebug("Changing [" + p.id + "] " + pref.originalId + " : " + pref.val);
          p._value = pref.val;
          let e = foundElements[pref.key];
          if (e) {
            switch(e.tagName) {
              case 'checkbox':
                e.checked = pref.val;
                if (e.getAttribute('oncommand'))
                  e.dispatchEvent(new Event("command"));
                break;
              case 'textbox': // legacy
              case 'html:input':
              case 'html:textarea':
                e.value = pref.val;
                if (e.id == "currentFolderBackground") {
                  options.setCurrentToolbarBackgroundCustom();
                }
                break;
              case 'menulist':
                e.selectedIndex = pref.val;
                let menuitem = e.selectedItem;
                if (menuitem && menuitem.getAttribute('oncommand'))
                  menuitem.dispatchEvent(new Event("command"));
                break;
              case 'radiogroup':
                e.value = pref.val;
                if (e.getAttribute('oncommand'))
                  e.dispatchEvent(new Event("command"));
              default:
                debugger;
                break;
            }
          }
        }
      }
		}
    
    function readData(dataString) {
			const Cc = Components.classes,
						Ci = Components.interfaces,
						service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
            QI = QuickFolders.Interface;
			try {
				// removes prettyfication:
				let config = dataString.replace(/\r?\n|\r/, ''),
						data = JSON.parse(config),
				    entries = data.folders,
            isLayoutModified = false,
						question = util.getBundleString("qf.prompt.restoreFolders");
            
				if (prefs.getBoolPref('restoreConfig.tabs')
				   && Services.prompt.confirm(window, "QuickFolders", question.replace("{0}", entries.length))) {
					for (let ent of entries) {
						if (typeof ent.tabColor ==='undefined' || ent.tabColor ==='undefined')
							ent.tabColor = 0;
						// default the name!!
						if (!ent.name) {
							// retrieve the name from the folder uri (prettyName)
							let f = QuickFolders.Model.getMsgFolderFromUri(ent.uri, false);
							if (f)
								ent.name = f.prettyName;
							else
								ent.name = util.getNameFromURI(ent.uri);
						}
					}
					if (!entries.length)
						entries=[];
					// the following function calls this.updateMainWindow() which calls this.updateFolders()
					util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(entries);
					let invalidCount = 0,
					    modelEntries = util.getMail3PaneWindow().QuickFolders.Model.selectedFolders;
					// updateFolders() will append "invalid" property into entry of main model if folder URL cannot be found
					for (let i=0; i<modelEntries.length; i++) {
						if (modelEntries[i].invalid)
							invalidCount++;
					}

					question = util.getBundleString("qf.prompt.loadFolders.confirm");
					if (invalidCount) {
						let wrn =
						  util.getBundleString("qfInvalidTabCount");
						question = wrn.replace("{0}", invalidCount) + "\n" + question;
					}
					if (Services.prompt.confirm(window, "QuickFolders", question)) {
						// store
						prefs.storeFolderEntries(entries);
            // notify all windows
            QuickFolders.Util.notifyTools.notifyBackground({ func: "updateAllTabs" });
					}
					else {
						// roll back
						util.getMail3PaneWindow().QuickFolders.initTabsFromEntries(prefs.loadFolderEntries());
					}
					delete data.folders; // remove this part to move on to the rest of settings
				}
        // ====================================================================
        // [issue 107] Restoring general / layout Settings only works if option for restoring folders also active
        if (prefs.getBoolPref('restoreConfig.general') && data.general) {
          for (let i=0; i<data.general.length; i++) {
            changePref(data.general[i]);
          }
          isLayoutModified = true;
        }
        if (prefs.getBoolPref('restoreConfig.layout')) {
          if (data.layout) {
            for (let i=0; i<data.layout.length; i++) {
              changePref(data.layout[i]);
            }
            isLayoutModified = true;
          }
          if (data.advanced) {
            for (let i=0; i<data.advanced.length; i++) {
              changePref(data.advanced[i]);
            }
          }

          if (data.premium) {
            for (let i=0; i<data.premium.length; i++) {
              changePref(data.premium[i]);
            }
          }
          // load custom colors and restore color pickers
          // options.styleUpdate('Toolbar', 'background-color', this.value, 'qf-StandardColors')
          
          if (data.userStyle) { // legacy
            let elements = document.getElementsByTagName('html:input');
            for (let i=0; i<elements.length; i++) {
              let element = elements[i];
              try {
                if (element.getAttribute('type')=='color') {
                  let elementInfo = element.getAttribute('elementInfo');
                  // find the matching entry from json file
                  for(let j=0; j<data.userStyle.length; j++) {
                    let jnode = data.userStyle[j];
                    if (jnode.elementInfo == elementInfo) {
                      // only change value if nevessary
                      if (element.value != jnode.val) {
                        element.value = jnode.val; // change color picker itself
                        util.logDebug("Changing [" + elementInfo + "] : " + jnode.val);
                        let info = jnode.elementInfo.split('.');
                        if (info.length == 2)
                          options.styleUpdate(
                            info[0],   // element name e..g. ActiveTab
                            info[1],   // element style (color / background-color)
                            jnode.val,
                            element.getAttribute('previewLabel')); // preview tab / label
                      }
                      break;
                    }
                  }
                  // QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue)
                }
              }
              catch(ex) {
                util.logException("Loading layout setting[" + i + "] (color picker " + element.id + ") failed:", ex);
              }
            }
          }

        }
        if (isLayoutModified) { // instant visual feedback
          //  update the main window layout
          QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); // replaced QI.updateObserver();
        }
        
			}
			catch (ex) {
				util.logException("Error in QuickFolders.Model.readData():\n", ex);
				Services.prompt.alert(null,"QuickFolders", util.getBundleString("qf.alert.pasteFolders.formatErr"));
			}
		}
    
    // find all controls with bound preferences
    let myprefElements = document.querySelectorAll("[preference]"),
        foundElements = {};
    for (let myprefElement of myprefElements) {
      let prefName = myprefElement.getAttribute("preference");
      foundElements[prefName] = myprefElement;
    }	
    
		QuickFolders.Model.fileConfig('load', null, null, readData); // load does the reading itself?
    return true;
	} ,

	fileConfig: async function(mode, jsonData, fname, readFunction) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
          util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					NSIFILE = Ci.nsILocalFile || Ci.nsIFile;
		util.popupRestrictedFeature(mode + "_config", "", 2); // save_config, load_config
    
    let filterText,
		    fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker),
        fileOpenMode = (mode=='load') ? fp.modeOpen : fp.modeSave;

		let dPath = prefs.getStringPref('files.path');
		if (dPath) {
			let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(NSIFILE);
			defaultPath.initWithPath(dPath);
			if (defaultPath.exists()) { // avoid crashes if the folder has been deleted
				fp.displayDirectory = defaultPath; // nsILocalFile
				util.logDebug("Setting default path for filepicker: " + dPath);
			}
			else {
				util.logDebug("fileFilters()\nPath does not exist: " + dPath);
			}
		}
		fp.init(window, "", fileOpenMode); // second parameter: prompt
    filterText = util.getBundleString("qf.fpJsonFile");
    fp.appendFilter(filterText, "*.json");
    fp.defaultExtension = 'json';
    if (mode == 'save') {
			let fileName = fname;
      fp.defaultString = fileName + '.json';
    }

    let fpCallback = function fpCallback_FilePicker(aResult) {
      if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
        if (fp.file) {
          let path = fp.file.path;
					// Store last Path
					util.logDebug("File Picker Path: " + path);
					let lastSlash = path.lastIndexOf("/");
					if (lastSlash < 0) lastSlash = path.lastIndexOf("\\");
					let lastPath = path.substr(0, lastSlash);
					util.logDebug("Storing Path: " + lastPath);
					prefs.setStringPref('files.path', lastPath);

					const {OS} = (typeof ChromeUtils.import == "undefined") ?
						Components.utils.import("resource://gre/modules/osfile.jsm", {}) :
						ChromeUtils.import("resource://gre/modules/osfile.jsm", {});

          //localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
          switch (mode) {
            case 'load':
              let promiseRead = OS.File.read(path, { encoding: "utf-8" }); //  returns Uint8Array
              promiseRead.then(
                function readSuccess(data) {
                  readFunction(data);
                },
                function readFailed(reason) {
                  util.logDebug ('read() - Failure: ' + reason);
                }
              )
              break;
            case 'save':
              // if (aResult == Ci.nsIFilePicker.returnReplace)
              let promiseDelete = OS.File.remove(path);
              // defined 2 functions
              util.logDebug ('Setting up promise Delete');
              promiseDelete.then (
                function saveJSON() {
                  util.logDebug ('saveJSON()…');
                  // force appending correct file extension!
                  if (!path.toLowerCase().endsWith('.json'))
                    path += '.json';
                  let promiseWrite = OS.File.writeAtomic(path, jsonData, { encoding: "utf-8"});
                  promiseWrite.then(
                    function saveSuccess(byteCount) {
                      util.logDebug ('successfully saved ' + byteCount + ' bytes to file');
                    },
                    function saveReject(fileError) {  // OS.File.Error
                      util.logDebug ('bookmarks.save error:' + fileError);
                    }
                  );
                },
                function failDelete(fileError) {
                  util.logDebug ('OS.File.remove failed for reason:' + fileError);
                }
              );
              break;
          }
        }
      }
    }
    fp.open(fpCallback);

    return true;
 		
	},
  

   
   
}  // Model

