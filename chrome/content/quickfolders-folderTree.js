"use strict";

Components.utils.import("resource://gre/modules/Dict.jsm");

// we shall use a dictionary for the folder customization (minimum version Thunderbird 19 for JSON support)


QuickFolders.FolderTree = {
  dictionary: null,
  init: function() {
    try {
      // override getCellProperties()
      QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.init()');
      let treeView;
      if (typeof gFolderTreeView=='undefined') { 
        treeView = GetFolderTree().view; 
        return; // for now, disable it
      }
      else { treeView = gFolderTreeView; }
      if (gFolderTreeView.supportsIcons) return; // already defined!
      QuickFolders.FolderTree.GetCellProperties = gFolderTreeView.getCellProperties.bind(gFolderTreeView);
      //gFolderTreeView.getCellPropsWithoutIcons = gFolderTreeView.getCellProperties;  
      gFolderTreeView.qfIconsEnabled = QuickFolders.Preferences.getBoolPref('folderTree.icons');
      gFolderTreeView.getCellProperties = function(row, col) {
        let props = QuickFolders.FolderTree.GetCellProperties(row, col);
        if (col.id == "folderNameCol") {
          let folder = gFolderTreeView.getFolderForIndex(row);
          let folderIcon;
          if (!gFolderTreeView.qfIconsEnabled) {
            return props;
          }
          
          try {
            if ( folderIcon = folder.getStringProperty("folderIcon") ) {
              // save folder icon selector
              props += " " + folderIcon;
            }
          }
          catch(ex) {
            if (QuickFolders)
              QuickFolders.Util.logException('QuickFolders.FolderTree.getCellProperties()',ex);
          }
        }
        return props;
      } // end of override		
      gFolderTreeView.supportsIcons = true;
      // now we need to iterate all Folders and find matches in our dictionary,
      // then inject the style rules for the icons...
      this.loadDictionary();
    }
    catch(ex) { QuickFolders.Util.logException('QuickFolders.FolderTree.init()',ex); };
  } ,
	
	restoreStyles: function() {
	  if (!this.dictionary || !this.dictionary.listitems().length) return;
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons')) return;
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons.injectCSS')) return;
		let styleEngine = QuickFolders.Styles;
		let ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
		for (let [key, value]  in this.dictionary.items) {
			let selector = this.makeSelector(key);
			// the folder properties are (or should be) restored by the msf file automatically.
			styleEngine.setElementStyle(ss, selector, 'list-style-image', value); 
			styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
      // -moz-tree-row: Use this to set the background color of a row.
      // -moz-tree-cell-text: the text in a cell. Use this to set the font and text color.
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
    QuickFolders.Util.logDebugOptional('folderTree', 'addFolderIconToElement(' + element.tagName + ', ' + folder.prettyName + ')');
	  let hasIcon;
	  try {
			let folderIcon = folder ? folder.getStringProperty("folderIcon") : '';
			if (!folder || folderIcon=='' || folderIcon=='noIcon') {
				// element.style.listStyleImage = '';
				hasIcon = false;
        QuickFolders.Util.logDebugOptional('folderTree','no icon:' + folderIcon);
			}
			else {
				let iconURL = folder.getStringProperty("iconURL");
				if (iconURL) {
					element.style.listStyleImage = iconURL;
					hasIcon = true;
          QuickFolders.Util.logDebugOptional('folderTree','hasIcon:' + iconURL);
				}
			}
			QuickFolders.Util.logDebugOptional('folderTree','Set element.style.listStyleImage = ' + element.style.listStyleImage);
		}
		catch(ex) { QuickFolders.Util.logException('addFolderIconToElement()',ex) };
		return hasIcon;
	} ,
	
	loadDictionary: function() {
	  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Dict.jsm
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.loadDictionary()');
		QuickFolders.mailFolderTree

    this.dictionary = new Dict(); // empty dictionary		
		let txtList = 'Folders without Icon\n';  
		let txtWithIcon = 'Folders with Icon\n';
		let iCount = 0;
		let iIcons = 0;
		let debug = QuickFolders.Preferences.isDebugOption('folderTree');
		for (let folder in QuickFolders.Util.allFoldersIterator()) {
		  iCount++;
			let key = folder.getStringProperty("folderIcon");
			let url = folder.getStringProperty("iconURL");
		
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
		QuickFolders.Util.logDebugOptional('folderTree', txtList);
		QuickFolders.Util.logDebugOptional('folderTree', txtWithIcon);
		QuickFolders.Util.logDebugOptional('folderTree', 'Total Number of Folders:' + iCount + '\nFolders with Icon:' + iIcons);
		
	  let service = QuickFolders.Preferences.service;
	  // if(!service.prefHasUserValue("extensions.quickfolders.folderIcons")) {
			
		// }		
		// else {
      // let myJson = service.getComplexValue("extensions.quickfolders.folderIcons", Components.interfaces.nsISupportsString).data;		
			// this.dictionary = new Dict(myJson);
		// }
		if (QuickFolders.Preferences.isDebugOption('folderTree'))
			this.debugDictionary();
		this.restoreStyles();
	} ,
	
	storeDictionary: function() {
	  if (!this.dictionary) return;
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.storeDictionary()');
	  let myJson = this.dictionary.toJSON();
		// no need for this anymore
		// QuickFolders.Preferences.setCharPrefQF("folderIcons", myJson);
		this.debugDictionary();
	} ,
	
	debugDictionary: function(withAlert) {
	  if(!this.dictionary) {
			QuickFolders.Util.logDebug('no FolderTree.dictionary');
			return;
		}
	  let txt = "QuickFolders.FolderTree - Dictionary Contents";
		for (let [key, value]  in this.dictionary.items) {
		  txt += '\n' + key + ': ' + value;
		}
		// alert(txt);
	  QuickFolders.Util.logDebug(txt);
		if (withAlert) alert(txt);
	} ,
	
	addItem: function(key, uri) {
	  QuickFolders.FolderTree.dictionary.set(key, uri);
	} ,
	
	removeItem: function(key) {
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
    
    if (!QuickFolders.Preferences.getBoolPref('folderTree.icons')) return;
		let fileURL, fileSpec;
		let styleEngine = QuickFolders.Styles;
		let ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
		let names = folder.URI.split("/");
		let serverKey = folder.server.key;
		let GUID = serverKey + '_' + names[names.length-2] + '_' + names[names.length-1];
		GUID = GUID.replace(/[\s\,\:\.\@\%\[\]\{\}\(\)\|\/\+\&\^]/g,'_');
		// GUID = GUID.replace(/\_/g,'');// removed replacement with _; instead replace with ''
		let propName = "folderIcon_" + GUID; // removed _
		let selector = this.makeSelector(propName);
		try {
		  if (iconURI) {
				fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
				QuickFolders.Util.logDebug("Model.setFolderTreeIcon(" + folder.prettyName + "," + fileURL.path + ")");
				fileSpec = fileURL.asciiSpec;
				folder.setStringProperty("folderIcon", propName);
				let cssUri = 'url(' + fileSpec + ')';
				QuickFolders.Util.logDebugOptional('folderTree', 'setFolderTreeIcon()\n'
					+ 'folder.URI: ' + folder.URI + '\n'
					+ 'fileURL:    ' + fileURL.path + '\n'
					+ 'propName:   ' + propName + '\n'
					+ 'cssUri:     ' + cssUri + '\n'
					+ 'GUID:       ' + GUID);
				QuickFolders.Util.logDebugOptional('folderTree', 'ADDING:\n' + selector + ' {\n' + 'list-style-image' + cssUri + '\n}');
				folder.setStringProperty("iconURL", cssUri);
				styleEngine.setElementStyle(ss, selector, 'list-style-image', cssUri); 
				styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
				this.addItem(propName, cssUri);
			}
			else {
			  QuickFolders.Util.logDebug("Model.setFolderTreeIcon(" + folder.prettyName + ", empty)");
				QuickFolders.Util.logDebugOptional('folderTree', 'REMOVING:\n' + selector + ' {\n' + 'list-style-image\n}');
				styleEngine.removeElementStyle(ss, 'treechildren::-moz-tree-image(folderNameCol,' + propName + ')','list-style-image');
			  folder.setStringProperty("folderIcon", "noIcon");
				folder.setStringProperty("iconURL", "");
			  folder.setForcePropertyEmpty("folderIcon", false); // remove property
				this.removeItem(propName);
			}
	    this.storeDictionary();
			this.debugDictionary(); // test dictionary, just for now
			this.forceRedraw();
			QuickFolders.Interface.updateFolders(false, true);  // forces rebuilding subfolder menus
		}
		catch (ex) {
		  QuickFolders.Util.logException('setFolderTreeIcon',ex);
		}
	}
} ;

