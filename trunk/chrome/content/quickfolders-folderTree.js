"use strict";

if (typeof Map != "function")
  Components.utils.import("resource://gre/modules/Dict.jsm");

// we shall use a dictionary for the folder customization (minimum version Thunderbird 19 for JSON support)


QuickFolders.FolderTree = {
  dictionary: null,
  init: function() {
    const util = QuickFolders.Util;
    try {
      // override getCellProperties()
      util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.init()');
      let treeView;
      if (typeof gFolderTreeView=='undefined') { 
        treeView = GetFolderTree().view; 
        return; // for now, disable it
      }
      else { treeView = gFolderTreeView; }
      if (treeView.supportsIcons) return; // already defined!
      QuickFolders.FolderTree.GetCellProperties = treeView.getCellProperties.bind(treeView);
      //gFolderTreeView.getCellPropsWithoutIcons = gFolderTreeView.getCellProperties;  
      treeView.qfIconsEnabled = QuickFolders.Preferences.getBoolPref('folderTree.icons');
      treeView.getCellProperties = function(row, col) {
        let props = QuickFolders.FolderTree.GetCellProperties(row, col);
        if (col.id == "folderNameCol") {
          let folder = treeView.getFolderForIndex(row);
          if (!treeView.qfIconsEnabled) {
            return props;
          }
          
          try {
            let folderIcon = folder.getStringProperty("folderIcon");
            if (folderIcon) {
              // save folder icon selector
              props += " " + folderIcon;
            }
          }
          catch(ex) {
            if (QuickFolders)
              util.logException('QuickFolders.FolderTree.getCellProperties()',ex);
          }
        }
        return props;
      } // end of override		
      treeView.supportsIcons = true;
      // now we need to iterate all Folders and find matches in our dictionary,
      // then inject the style rules for the icons...
      this.loadDictionary();
    }
    catch(ex) { util.logException('QuickFolders.FolderTree.init()',ex); };
  } ,
	
	restoreStyles: function() {
    const util = QuickFolders.Util,
          makeSelector = this.makeSelector;
    function iterate (key,value) {
			let selector = makeSelector(key);
      util.logDebugOptional('folderTree.icons', 'made selector: ' + selector + '\nvalue: ' + value);
			// the folder properties are (or should be) restored by the msf file automatically.
			styleEngine.setElementStyle(ss, selector, 'list-style-image', value); 
			styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
      // -moz-tree-row: Use this to set the background color of a row.
      // -moz-tree-cell-text: the text in a cell. Use this to set the font and text color.
    }
    // if (QuickFolders.Preferences.isDebugOption('folderTree.icons')) debugger;
    if (!this.dictionary) return;
    let len = util.supportsMap ?
      this.dictionary.size :
      this.dictionary.listitems().length;
	  if (!len)  {
      util.logDebugOptional('folderTree.icons', 'dictionary empty?');
      return;
    }
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons')) return;
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons.injectCSS')) return;
		let styleEngine = QuickFolders.Styles,
		    ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
    util.logDebugOptional('folderTree.icons', 'iterate Dictionary: ' + len + ' items...');
    if (util.supportsMap) { 
      /*    NOT ALLOWED BECAUSE STUPID POSTBOX THROWS A SYNTAX ERROR
            EVEN THOUGH THIS CODE IS NEVER EXECUTED
      for (let [key, value] of theEntries) {
        iterate(key,value);
      }
      */
      this.dictionary.forEach(
        function(value, key, map) {
          iterate(key,value);
        }
      );
    }
    else {
      for (let [key, value] in this.dictionary.items) {
        iterate(key,value);
      }
    }
		this.forceRedraw();
	} ,
	
  hasTreeItemFolderIcon: function(folder) {
    let folderIcon = folder ? folder.getStringProperty("folderIcon") : '';
    if (!folder || folderIcon=='' || folderIcon=='noIcon') 
      return false;
    return true;
  } ,
  
	// returns whether element has icon or not
	addFolderIconToElement: function(element, folder) {
    const util = QuickFolders.Util;
    util.logDebugOptional('folderTree.icons', 'addFolderIconToElement(' + element.tagName + ', ' + folder.prettyName + ')');
	  let hasIcon;
	  try {
			let folderIcon = folder ? folder.getStringProperty("folderIcon") : '';
			if (!folder || folderIcon=='' || folderIcon=='noIcon') {
				// element.style.listStyleImage = '';
				hasIcon = false;
        util.logDebugOptional('folderTree.icons','no icon:' + folderIcon);
			}
			else {
				let iconURL = folder.getStringProperty("iconURL");
				if (iconURL) {
					element.style.listStyleImage = iconURL;
					hasIcon = true;
				}
			}
			util.logDebugOptional('folderTree.icons','Set element.style.listStyleImage = ' + element.style.listStyleImage);
		}
		catch(ex) { util.logException('addFolderIconToElement()',ex) };
		return hasIcon;
	} ,
	
	loadDictionary: function() {
	  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Dict.jsm
    const util = QuickFolders.Util,
          debug = QuickFolders.Preferences.isDebugOption('folderTree');
		util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.loadDictionary()');
    
    this.dictionary = util.supportsMap ? new Map() : new Dict(); // Tb / ES6 = Map; Postbox ES5 = dictionary		
		let txtList = 'Folders without Icon\n',
		    txtWithIcon = 'Folders with Icon\n',
		    iCount = 0,
		    iIcons = 0;
		for (let folder in util.allFoldersIterator()) {
		  iCount++;
			let key = folder.getStringProperty("folderIcon"),
			    url = folder.getStringProperty("iconURL");
		
			if (key && key!='noIcon' && url) {
				this.addItem(key, url);
				if (debug) {
					txtWithIcon += iCount.toString() + ' - ' + folder.server.hostName + ' - ' + folder.prettyName;
					txtWithIcon += '   ' + key + ': ' + url + '\n';
				}
				iIcons++;
			}
			else { // folder w/o icon
				if (debug) txtList += iCount.toString() + ' - ' + folder.server.hostName + ' - ' + folder.prettyName + '\n';
			}
		}
		util.logDebugOptional('folderTree', txtList);
		util.logDebugOptional('folderTree', txtWithIcon);
		util.logDebugOptional('folderTree', 'Total Number of Folders:' + iCount + '\nFolders with Icon:' + iIcons);
		
	  let service = QuickFolders.Preferences.service;

		if (debug) {
      util.logDebugOptional('folderTree.icons','calling debugDictionary()...');
			this.debugDictionary();
    }
    util.logDebugOptional('folderTree.icons','calling restoreStyles...');
		this.restoreStyles();
    util.logDebugOptional('folderTree.icons','loadDictionary() finished.');
	} ,
	
	storeDictionary: function() {
	  if (!this.dictionary) return;
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.storeDictionary()');
	  // let myJson = 
    //    this.ES6 ?
    //    JSON.stringify(Array.from(this.dictionary.entries()))
    //    this.dictionary.toJSON();
		// no need for this anymore
		// QuickFolders.Preferences.setCharPrefQF("folderIcons", myJson);
		this.debugDictionary();
	} ,
	
	debugDictionary: function(withAlert) {
    let util = QuickFolders.Util;
	  if (!this.dictionary) {
			util.logDebug('no FolderTree.dictionary');
			return;
		}
	  let txt = "QuickFolders.FolderTree - Dictionary Contents";
    if (util.supportsMap) 
      this.dictionary.forEach( function(value, key, map) {
        txt += '\n' + key + ': ' + value;
      });
    else
      for (let [key, value] in this.dictionary.items) {
        txt += '\n' + key + ': ' + value;
      }
	  util.logDebugOptional('folderTree', txt);
		if (withAlert) util.alert(txt);
	} ,
	
	addItem: function(key, uri) {
	  QuickFolders.FolderTree.dictionary.set(key, uri);
	} ,
	
	removeItem: function(key) {
    if (QuickFolders.Util.supportsMap)
      this.dictionary.delete(key);
    else
      this.dictionary.del(key);
	} ,

	makeSelector: function(propName) {
	  return  'treechildren::-moz-tree-image(folderNameCol,'+ propName + ')';
	} ,
	
	forceRedraw: function() {
		// force redrawing the folder pane
		var box = document.getElementById("folderTree").boxObject;
		box.QueryInterface(Components.interfaces.nsITreeBoxObject);
		box.invalidate();
	} ,
	/*									 
	Adds following styles to a folder tree item:
	treechildren::-moz-tree-image(folderIconCol, folderIcon_mail_inbox) {
		-moz-image-region: rect(0px, 16px, 16px, 0px);
		list-style-image: url("...");
	}	
	*/								 
	setFolderTreeIcon: function(folder, iconURI) {
	  // https://developer.mozilla.org/en-US/docs/XUL/Tutorial/Styling_a_Tree
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface,
          styleEngine = QuickFolders.Styles;
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons')) return;
		let fileURL, fileSpec,
		    ss = QI.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles'),
		    names = folder.URI.split("/"),
		    serverKey = folder.server.key,
		    GUID = serverKey + '_' + names[names.length-2] + '_' + names[names.length-1],
        // always update current folder toolbar icon?
        currentFolderTab = QI.CurrentFolderTab;
		GUID = GUID.replace(/[\s\,\:\.\@\%\[\]\{\}\(\)\|\/\+\&\^]/g,'_');
		// GUID = GUID.replace(/\_/g,'');// removed replacement with _; instead replace with ''
		let propName = "folderIcon_" + GUID, // removed _
		    selector = this.makeSelector(propName);
		try {
		  if (iconURI) {
				fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
				util.logDebug("FolderTree.setFolderTreeIcon(" + folder.prettyName + "," + fileURL.path + ")");
				fileSpec = fileURL.asciiSpec;
				folder.setStringProperty("folderIcon", propName);
				let cssUri = 'url(' + fileSpec + ')';
				util.logDebugOptional('folderTree.icons', 'setFolderTreeIcon()\n'
					+ 'folder.URI: ' + folder.URI + '\n'
					+ 'fileURL:    ' + fileURL.path + '\n'
					+ 'propName:   ' + propName + '\n'
					+ 'cssUri:     ' + cssUri + '\n'
					+ 'GUID:       ' + GUID);
				util.logDebugOptional('folderTree.icons', 'ADDING:\n' + selector + ' {\n' + 'list-style-image' + cssUri + '\n}');
				folder.setStringProperty("iconURL", cssUri);
				styleEngine.setElementStyle(ss, selector, 'list-style-image', cssUri); 
				styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
        if (QuickFolders.FolderTree.dictionary)
          this.addItem(propName, cssUri);
			}
			else {
			  util.logDebug("FolderTree.setFolderTreeIcon(" + folder.prettyName + ", empty)");
				util.logDebugOptional('folderTree.icons', 'REMOVING:\n' + selector + ' {\n' + 'list-style-image\n}');
				styleEngine.removeElementStyle(ss, 'treechildren::-moz-tree-image(folderNameCol,' + propName + ')','list-style-image');
			  folder.setStringProperty("folderIcon", "noIcon");
				folder.setStringProperty("iconURL", "");
			  folder.setForcePropertyEmpty("folderIcon", false); // remove property
        if (QuickFolders.FolderTree.dictionary)
          this.removeItem(propName);
			}
	    this.storeDictionary();
			this.debugDictionary(); // test dictionary, just for now
			this.forceRedraw();
			QI.updateFolders(false, true);  // forces rebuilding subfolder menus
		}
		catch (ex) {
		  util.logException('setFolderTreeIcon',ex);
		}
    finally {
      if (currentFolderTab && currentFolderTab.folder && currentFolderTab.folder.URI == folder.URI) {
        QuickFolders.Interface.initCurrentFolderTab(currentFolderTab, currentFolderTab.folder);
      }
    }
	}
} ;

