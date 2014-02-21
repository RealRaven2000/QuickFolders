"use strict";

Components.utils.import("resource://gre/modules/Dict.jsm");

// we shall use a dictionary for the folder customization (minimum version Thunderbird 19 for JSON support)


QuickFolders.FolderTree = {
  dictionary: null,
  init: function() {
		// override getCellProperties()
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.init()');
		gFolderTreeView.QFGetCellProperties = gFolderTreeView.getCellProperties;
		gFolderTreeView.getCellProperties = function(row, col) {
			var props = gFolderTreeView.QFGetCellProperties(row, col);
			if (col.id == "folderNameCol") {
				var folder = gFolderTreeView.getFolderForIndex(row);
				var folderIcon;
				if ( folderIcon = folder.getStringProperty("folderIcon") ) {
					// save folder icon for css rule.
					props += " " + folderIcon;
				}
			}
			return props;
		} // end of override		
    // now we need to iterate all Folders and find matches in our dictionary,
		// then inject the style rules for the icons...
		this.loadDictionary();
	} ,
	
	restoreStyles: function() {
	  if (!this.dictionary.listitems().length) return;
		let styleEngine = QuickFolders.Styles;
		let ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
		for (let [key, value]  in this.dictionary.items) {
			let selector = this.makeSelector(key);
			// the folder properties are (or should be) restored by the msf file automatically.
			styleEngine.setElementStyle(ss, selector, 'list-style-image', value); 
			styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
		}
		this.forceRedraw();
	} ,
	
	loadDictionary: function() {
	  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Dict.jsm
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.loadDictionary()');
	  let service = QuickFolders.Preferences.service;
	  if(!service.prefHasUserValue("extensions.quickfolders.folderIcons")) {
			this.dictionary = new Dict(); // empty dictionary
		}		
		else {
      let myJson = service.getComplexValue("extensions.quickfolders.folderIcons", Components.interfaces.nsISupportsString).data;		
			this.dictionary = new Dict(myJson);
		}
		if (QuickFolders.Preferences.isDebugOption('folderTree'))
			this.debugDictionary();
		this.restoreStyles();
	} ,
	
	storeDictionary: function() {
		QuickFolders.Util.logDebugOptional('folderTree', 'QuickFolders.FolderTree.storeDictionary()');
	  let myJson = this.dictionary.toJSON();
		QuickFolders.Util.logDebugOptional('folderTree', 'myJson = ' + myJson);
		QuickFolders.Preferences.setCharPrefQF("folderIcons", myJson);
		/*
		let str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		str.data = myJson;
	  QuickFolders.Preferences.service.setComplexValue("extensions.quickfolders.folderIcons", Components.interfaces.nsISupportsString, str);
		*/
		this.debugDictionary();
	} ,
	
	debugDictionary: function(withAlert) {
	  let txt = "QuickFolders.FolderTree - Dictionary Contents";
		for (let [key, value]  in this.dictionary.items) {
		  txt += '\n' + key + ': ' + value;
		}
		// alert(txt);
	  QuickFolders.Util.logDebug(txt);
		if (withAlert) alert(txt);
	} ,
	
	addItem: function(key, uri) {
	  this.dictionary.set(key, uri);
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
		let fileURL, fileSpec;
		let styleEngine = QuickFolders.Styles;
		let ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
		let names = folder.URI.split("/");
		let serverKey = folder.server.key;
		let GUID = serverKey + '_' + names[names.length-2] + '_' + names[names.length-1];
		GUID = GUID.replace(/[\s\,\:\.\@\%\[\]\{\}\(\)\|\/]/g,'_');
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
				styleEngine.setElementStyle(ss, selector, 'list-style-image', cssUri); 
				styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
				this.addItem(propName, cssUri);
			}
			else {
			  QuickFolders.Util.logDebug("Model.setFolderTreeIcon(" + folder.prettyName + ", empty)");
				QuickFolders.Util.logDebugOptional('folderTree', 'REMOVING:\n' + selector + ' {\n' + 'list-style-image\n}');
				styleEngine.removeElementStyle(ss, 'treechildren::-moz-tree-image(folderNameCol,' + propName + ')','list-style-image');
			  folder.setStringProperty("folderIcon", "noIcon");
			  folder.setForcePropertyEmpty("folderIcon", false); // remove property
				this.removeItem(propName);
			}
	    this.storeDictionary();
			this.debugDictionary(); // test dictionary, just for now
			this.forceRedraw();
		}
		catch (ex) {
		  QuickFolders.Util.logException('setFolderTreeIcon',ex);
		}
	}
} ;


/* folder color labes support - experimental */
// OLD CODE!
QuickFolders.OldTree = {
	initLabelColors : function () {
		// extend getCellProperties()
		gFolderTreeView.quickFolders_GetCellProperties = gFolderTreeView.getCellProperties;
		gFolderTreeView.getCellProperties = 
				function(row, col, props) {
					gFolderTreeView.quickFolders_GetCellProperties(row, col, props);
					var aAtomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
					if (col.id == "folderNameCol") {
						var folder = gFolderTreeView.getFolderForIndex(row);
						var paletteClass;
						if ( paletteClass = folder.getStringProperty("quickFoldersPalette") ) {
							// save folder color
							props.AppendElement(aAtomService.getAtom(paletteClass));
						}
					}
				};
	} ,
	
	setLabelColor: function(uri, paletteClass) {
		// apply for selected folder
		folder = QuickFolders.Model.getMsgFolderFromUri(uri, true).QueryInterface(Components.interfaces.nsIMsgFolder)
		folder.setStringProperty("quickFoldersPalette", paletteClass)
		
		// force redraw the folder pane
		var box = document.getElementById("folderTree").boxObject;
		box.QueryInterface(Components.interfaces.nsITreeBoxObject);
		box.invalidate();
	}
}
