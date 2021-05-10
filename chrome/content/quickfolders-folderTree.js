"use strict";

/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */
	
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
      if (gFolderTreeView.supportsIcons) return; // already defined!
      if (QuickFolders.FolderTree.GetCellProperties)
        return;
      QuickFolders.FolderTree.GetCellProperties = gFolderTreeView.getCellProperties.bind(gFolderTreeView);
      //gFolderTreeView.getCellPropsWithoutIcons = gFolderTreeView.getCellProperties;  
      gFolderTreeView.qfIconsEnabled = QuickFolders.Preferences.getBoolPref('folderTree.icons');
      gFolderTreeView.getCellProperties = function QuickFolders_getCellProperties(row, col) {
        if (QuickFolders.FolderTree.GetCellProperties == gFolderTreeView.getCellProperties) {
          debugger;
          return null; // avoid "impossible" recursion?
        }
        let props = QuickFolders.FolderTree.GetCellProperties(row, col);
        if (col.id == "folderNameCol") {
          let folder = gFolderTreeView.getFolderForIndex(row);
          if (!gFolderTreeView.qfIconsEnabled) {
            return props;
          }
					/*
					if (folder.isServer) {
						util.logDebugOptional('folderTree.icons',"getCellProperties(" + folder.prettyName  + ") - Custom Icons not supported on Server node.")
						return props;
					}
					*/
					
          try {
						if (gFolderTreeView.supportsIcons) {
							let folderIcon = (typeof folder.getStringProperty != 'undefined') ? folder.getStringProperty("folderIcon") : null;
							if (folderIcon) {
								// save folder icon selector
								props += " " + folderIcon;
							}
						}
						else
							util.logToConsole("treeView.supportsIcons = false!")
          }
          catch(ex) {
            if (QuickFolders) {
							let txt;
							try {
								txt = "returning unchanged props for folder [" + folder.prettyName + "] : " + props;
							}
							catch(x) { txt="problem with reading props for folder " + folder.prettyName; }
              util.logException('QuickFolders.FolderTree.getCellProperties()\n' + txt, ex);
						}
          }
        }
        return props;
      } // end of override		
      gFolderTreeView.supportsIcons = true;
      // now we need to iterate all Folders and find matches in our dictionary,
      // then inject the style rules for the icons...
      this.loadDictionary();
    }
    catch(ex) { 
			util.logException('QuickFolders.FolderTree.init()',ex); 
		};
  } ,
	
	restoreStyles: function() {
    const util = QuickFolders.Util,
		      prefs = QuickFolders.Preferences,
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
    // if (prefs.isDebugOption('folderTree.icons')) debugger;
    if (!this.dictionary) return;
    let len = util.supportsMap ?
      this.dictionary.size :
      this.dictionary.listitems().length;
	  if (!len)  {
      util.logDebugOptional('folderTree.icons', 'dictionary empty?');
      return;
    }
    if (!prefs.getBoolPref('folderTree.icons')) return;
    if (!prefs.getBoolPref('folderTree.icons.injectCSS')) return;
		let styleEngine = QuickFolders.Styles,
		    ss = QuickFolders.Interface.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles');
    util.logDebugOptional('folderTree.icons', 'iterate Dictionary: ' + len + ' items…');
    if (util.supportsMap) { 
		  // should be for..of
      this.dictionary.forEach(
        function(value, key, map) {
          iterate(key,value);
        }
      );
    }
    else {
			util.iterateDictionary(this.dictionary, iterate);
    }
		this.forceRedraw();
	} ,
	
  hasTreeItemFolderIcon: function(folder) {
    let folderIcon = (folder && (typeof folder.getStringProperty != 'undefined')) ? folder.getStringProperty("folderIcon") : '';
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
			let folderIcon =  (folder && (typeof folder.getStringProperty != 'undefined')) ? folder.getStringProperty("folderIcon") : '';
			if (!folder || folderIcon=='' || folderIcon=='noIcon') {
				// element.style.listStyleImage = '';
				hasIcon = false;
        util.logDebugOptional('folderTree.icons','no icon:' + folderIcon);
				if(!folder)
					util.logDebugOptional('folderTree.icons', 'folder=null');
				else if(folderIcon=='')
					util.logDebugOptional('folderTree.icons', 'folderIcon=empty');
				else if(folderIcon=='noIcon')
					util.logDebugOptional('folderTree.icons', 'folderIcon=noIcon');
				else
					util.logDebugOptional('folder.getStringProperty=', 'folder.getStringProperty');
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
					prefs = QuickFolders.Preferences,
          debug = prefs.isDebugOption('folderTree');
		util.logDebugOptional('folderTree,folderTree.icons', 'QuickFolders.FolderTree.loadDictionary()');
    
    this.dictionary = util.supportsMap ? new Map() : new Dict(); // Tb / ES6 = Map; Postbox ES5 = dictionary		
		let txtList = 'Folders without Icon\n',
		    txtWithIcon = 'Folders with Icon\n',
		    iCount = 0,
		    iIcons = 0;
		for (let folder of util.allFoldersIterator()) {  // [Bug 26612] - we may need to abandon early Postbox versions for this.
		  iCount++;
			if (typeof folder.getStringProperty == 'undefined') continue;
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
		
	  let service = prefs.service;

		if (debug) {
			this.debugDictionary();
    }
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
		// QuickFolders.Preferences.getStringPref("folderIcons", myJson);
		this.debugDictionary();
	} ,
	
	debugDictionary: function(withAlert) {
		function appendKeyValue(key,value,t) {
			t.txt += '\n' + key + ': ' + value;
		}
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
    else {
			var t;
			t.txt = "";
			util.iterateDictionaryObject(this.dictionary, appendKeyValue, t);
			txt += t.txt;
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
		const util = QuickFolders.Util;
		// nsITreeBoxObject will be deprecated from Tb69
		try {
      const box = document.getElementById("folderTree").boxObject; // not working in Thunderbird 78
      if(!box) return;
			if (Components.interfaces.nsITreeBoxObject) {
				box.QueryInterface(Components.interfaces.nsITreeBoxObject);
				box.invalidate();
			}
			else 
				box.element.invalidate();
		}
		catch (ex) {
			util.logException('forceRedraw', ex);
		}
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
					prefs = QuickFolders.Preferences,
          styleEngine = QuickFolders.Styles;
    if (!prefs.getBoolPref('folderTree.icons')) {
			util.logDebug("Folder Tree Icons are disabled! \n" +
			  "extensions.quickfolders.folderTree.icons=" + prefs.getBoolPref('folderTree.icons') + '\n' +
				"extensions.quickfolders.folderTree.icons.injectCSS=" + prefs.getBoolPref('folderTree.icons.injectCSS'));
			return;
		}
		let fileURL, fileSpec,
		    ss = QI.getStyleSheet(styleEngine, 'qf-foldertree.css', 'QuickFolderFolderTreeStyles'),
		    names = folder.URI.split("/"),
		    serverKey = folder.server.key,
		    GUID = serverKey + '_' + names[names.length-2] + '_' + names[names.length-1],
        // always update current folder toolbar icon?
        currentFolderTab = QI.CurrentFolderTab;
		GUID = GUID.replace(/[\s\,\?\!\:\.\@\%\[\]\{\}\(\)\|\/\+\&\^]/g,'_');
		// GUID = GUID.replace(/\_/g,'');// removed replacement with _; instead replace with ''
		let prefix = "folderIcon_",
		    propName = prefix + GUID, 
		    selector = this.makeSelector(propName);
		try {
		  if (iconURI) {
				fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
				let fPath = fileURL.filePath || fileURL.path,
				    parts = fPath.split('/'),
						shortenedPath = fPath;
				if (parts.length>4) { // buid shortened path.
					const start = parts[0] || parts[1],  // if path starts with /
					      tri = " \u25B9 ";
					parts.shift(); // remove 1st (empty?) item
					while (parts.length>3) parts.shift(); // remove first element.
					shortenedPath = start + tri + " \u2026 " + tri + parts.join(tri);
				}
				util.logDebug("FolderTree.setFolderTreeIcon(" + folder.prettyName + "," + shortenedPath + ")");
				fileSpec = fileURL.asciiSpec;
				folder.setStringProperty("folderIcon", propName);
				let cssUri = 'url(' + fileSpec + ')';
				util.logDebugOptional('folderTree.icons', 'setFolderTreeIcon()\n'
					+ 'folder.URI: ' + folder.URI + '\n'
					+ 'fileURL:    ' + fPath + '\n'
					+ 'propName:   ' + propName + '\n'
					+ 'cssUri:     ' + cssUri + '\n'
					+ 'GUID:       ' + GUID);
				util.logDebugOptional('folderTree.icons', 'ADDING:\n' + selector + ' {\n' + 'list-style-image:' + cssUri + '\n}');
				folder.setStringProperty("iconURL", cssUri);
				
				// overwrite messenger/skin/folderPane.css
				styleEngine.setElementStyle(ss, selector, 'list-style-image', cssUri, true);  // add !important
				styleEngine.setElementStyle(ss, selector, '-moz-image-region',  'rect(0px, 16px, 16px, 0px)'); 
        if (QuickFolders.FolderTree.dictionary)
          this.addItem(propName, cssUri);
				if (prefs.isDebugOption('folderTree.icons')) {
					util.logDebug("DOUBLE CHECK FOLDER STRING PROPS HAVE BEEN SET:\n" +
					  "iconURL = " + folder.getStringProperty("iconURL") + "\n" +
					  "folderIcon = " + folder.getStringProperty("folderIcon")
					);
				}
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
	},
  
  refreshTree: function() {
    const util = QuickFolders.Util,
          Ci = Components.interfaces,
          theTreeView = gFolderTreeView,
          NS_MSG_ERROR_OFFLINE = 0x80550014,
          ImapNoselect    = 0x01000000; // thrown by performExpand if offline!
    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),
        iCount = 0;
    
    function countSubfolders(parentFolder) {
      let childFolders;
      if (parentFolder.subFolders.hasMoreElements) { // Tb78 and older
        let myenum = parentFolder.subFolders;
        childFolders = [];
        while (myenum.hasMoreElements()) {
          childFolders.push(myenum.getNext().QueryInterface(Ci.nsIMsgFolder));
        }
      }
      else { // Tb 88
        childFolders = parentFolder.subFolders;
      }
      return childFolders.length;
    }
    
    // disable updating recent folders
    let touch = util.touch;
    util.touch = function () {
      
    }
    
    try {
      let result = prompts.confirm(window, "QuickFolders.FolderTree", "Rebuild the tree for IMAP?\n" +
        "This may take a long time, depending on the number of folders on the server."); 
      if (!result) return;
      util.ensureNormalFolderView();
      let collapsedFolders = [];          
      util.logDebug("refreshTree() starting to iterate all folders which Thunderbird sees...");
      for (let folder of QuickFolders.Util.allFoldersIterator()) {
        // open folder in tree...
        let rowIndex = theTreeView.getIndexOfFolder(folder),
            isExpanded = rowIndex ? theTreeView._rowMap[rowIndex].open : false;
        if (folder.incomingServerType == "imap" && 
            !(folder.flags & ImapNoselect)) {
          iCount++;
          if (!isExpanded) collapsedFolders.push(folder); // remember folders that are not open, to restore later.
          let subscribableServer = folder.server.QueryInterface(Ci.nsISubscribableServer); // gSubscribableServer
          try {
            let isSelected = theTreeView.selectFolder(folder, true); // forceSelect
            // FolderPaneSelectionChange() - gFolderDisplay.show will fail if the folder is missing on Imap!
            // FolderDisplayWidget.
            let rowIndex = theTreeView.getIndexOfFolder(folder),
                hasSubFolders = folder.hasSubFolders,
                canCreateSubfolders = folder.canCreateSubfolders;
            //    subCount = hasSubFolders ? countSubfolders(folder) : 0;
            util.logDebug("[" + folder.prettyName + "] => index = " + rowIndex + ", hasSubFolders = " + hasSubFolders + ", open = " + isExpanded);
            folder.performExpand(msgWindow);
            //let newSubCount = countSubfolders(folder);
            //if (subCount != newSubCount) {
            //   util.logToConsole("Subfolder count for [" + folder.prettyName + "] has changed from " + subCount + " to " + newSubCount);
            //}
          }
          catch(ex) {
            util.logException("Couldn't select [" + folder.prettyName + "] - skipping that one!", ex);
          }
          // if number of subfolders has changed: preserve subscribe state of parent and propagate
          // subscribableServer.unsubscribe(name);
        }
      }
      for (let i=collapsedFolders.length-1; i>0; i--) {
        let folder = collapsedFolders[i];
        let rowIndex = theTreeView.getIndexOfFolder(folder)
        if (rowIndex > 0  && theTreeView._rowMap[rowIndex].open) {
          theTreeView._toggleRow(rowIndex);
        }
      }
    }
    catch (ex) {
      util.logException("FolderTree.refreshTree()", ex);
    }
    finally {
      setTimeout( function() {
        util.touch = touch; // restore update function.  
      }, 10000);
      util.logDebug("refreshTree() iterated all accessible (" + iCount + ") folders.");
    }
  }
} ;

