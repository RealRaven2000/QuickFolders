"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

if (QuickFolders.Util.Application != 'Postbox') {
  Components.utils.import("resource:///modules/MailUtils.js");
}

QuickFolders.Model = {
  selectedFolders: [],
  categoriesList: [],
  paletteUpdated: false,
  paletteUpgraded: false,

  addFolder: function addFolder(uri, categoryName) {
    function unpackURI(URL) {
      if (!URL) return URL;
      // remove url(...) from Icon file name for storing in model.entry.icon
      return URL.substr(4, URL.length-5);
    }
    let util = QuickFolders.Util;
    util.logDebug("model.addFolder");
    let entry = this.getFolderEntry(uri);
    if (entry) {
      // adding existing folder ...
      let category = entry.category || '',
          currentCategory = QuickFolders.Interface.CurrentlySelectedCategoryName;

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
    // Create entirely new QF Tab
    if(!entry) {
      let folder = this.getMsgFolderFromUri(uri, false),
          iconURI = null;
      // SeaMonkey: GetFolderTree().view
      if (typeof gFilterTreeView !== "undefined" 
          && 
          gFolderTreeView.supportsIcons) {
        iconURI = unpackURI(folder.getStringProperty("iconURL"));
      }

      this.selectedFolders.push({
        uri: uri,
        name: (folder==null) ? '' : folder.prettyName,
        category: categoryName,
        tabColor: 0,
        icon: iconURI
      });

      this.update();
      util.logDebug ("\nQuickFolders: added Folder URI " + uri + "\nto Category: " + categoryName);
      return true;
    }
    else {
      try {
        util.alert(util.getBundleString("qfFolderAlreadyBookmarked","The folder " + uri  + " is already bookmarked."));
      } catch (e) { 
        let msg = "Folder already bookmarked: " + uri + "\nCan not display message - " + e; 
        util.logToConsole (msg); 
        util.alert(msg); 
      }

      // switch to category if it exists
      QuickFolders.Interface.selectCategory(entry.category,true);
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

  moveFolderURI: function moveFolderURI(fromUri, toUri) {
    QuickFolders.Util.logDebug("model.moveFolderURI");
    let entry;

    if((entry = this.getFolderEntry(fromUri))) {
      entry.uri = toUri;
      this.update();
      return true;
    }
    return false;

  } ,

  store: function store() {
    QuickFolders.Preferences.storeFolderEntries(QuickFolders.Model.selectedFolders);
  } ,
  
  update: function update() {
    QuickFolders.Util.logDebug("model.update");
    this.store();
    QuickFolders.Interface.updateFolders(true, false);
  } ,

  setTabIcon: function setTabIcon(button, entry, iconURI, menuItem) {
    let fileSpec = '';
    if (iconURI) {
      let fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
      QuickFolders.Util.logDebug("Model.setTabIcon(" + entry.name + "," + fileURL.path + ")");
      fileSpec = fileURL.asciiSpec;
    }
    
    if (fileSpec)  {
      entry.icon = fileSpec; 
      if (button) 
        QuickFolders.Interface.applyIcon(button, entry.icon);
      if (menuItem)
        menuItem.nextSibling.collapsed = false; // uncollapse the menu item for removing icon
    }
    else {
      if (entry.icon) delete entry.icon;
      if (button)
        QuickFolders.Interface.applyIcon(button, '');
    }
      
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
      entry.category = name;
      this.update();
    }
  } ,

  setTabSeparator: function setTabSeparator(entry, isSpace) {
    if(entry) {
      // add class "spaced" with .spaced { margin-left: 2em;}
      if (isSpace) {
        entry.separatorBefore = true;
        QuickFolders.Util.popupProFeature("tabSeparator");
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
        entry.breakBefore = true;
        QuickFolders.Util.popupProFeature("lineBreaks");
      }
      else
        delete entry.breakBefore;
      this.update();
    }
  } ,

  getMsgFolderFromUri:  function getMsgFolderFromUri(uri, checkFolderAttributes) {
    let msgfolder = null;
    if (typeof MailUtils != 'undefined' && MailUtils.getFolderForURI) {
      return MailUtils.getFolderForURI(uri, checkFolderAttributes);
    }
    try {
      let mw = QuickFolders.win,
          resource = mw.GetMsgFolderFromUri ? mw.GetMsgFolderFromUri(uri, checkFolderAttributes) : mw.GetResourceFromUri(uri);
      msgfolder = resource.QueryInterface(Components.interfaces.nsIMsgFolder);
      if (checkFolderAttributes) {
        if (!(msgfolder && (msgfolder.parent || msgfolder.isServer))) {
          msgfolder = null;
        }
      }
    }
    catch (ex) {
       QuickFolders.Util.logException("getMsgFolderFromUri( " + uri + ")", ex);
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

  // get the list of Categories from the current Folder Array
  get Categories() {
    let categories = [];
    if (this.categoriesList.length>0)
      return this.categoriesList;

    // can we add a color per category?
    for (let i = 0; i < this.selectedFolders.length; i++) {
      let entry = this.selectedFolders[i],
          category = entry.category;

      if (category) {
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
          let cats = category.split('|');
          for (let j=0; j<cats.length; j++) { // add it to list if it doesn't exist already.
            if(  cats[j].length 
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

  isValidCategory: function isValidCategory(category) {
    return (
         category == QuickFolders.FolderCategory.ALL
      || category == QuickFolders.FolderCategory.UNCATEGORIZED 
      || category == QuickFolders.FolderCategory.ALWAYS
      || this.Categories.indexOf(category) != -1
    );
  } ,

  renameFolderCategory: function renameFolderCategory(oldName, newName) {
    QuickFolders.Util.logDebugOptional("categories","Model.renameFolderCategory()\n"
      + "from: " + oldName 
      + "to: "   + newName);
    let matches = 0;

    for(let i = 0; i < this.selectedFolders.length; i++) {
      let folder = this.selectedFolders[i];
      
      if (folder.category) {
        // multiple cats
        let cats = folder.category.split('|');
  
        for(let j=0; j<cats.length; j++)
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

  deleteFolderCategory: function deleteFolderCategory(category) {
    QuickFolders.Util.logDebugOptional("categories","Model.deleteFolderCategory(" + category + ")");
    let folderList = '';
    for(let i = 0; i < this.selectedFolders.length; i++) {
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

    this.update()
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
        for(let i = 0; i < folderEntries.length; i++) {
        
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

        QuickFolders.Interface.updateFolders(true, false);
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
  }
}  // Model
