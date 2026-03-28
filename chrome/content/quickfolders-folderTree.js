"use strict";

/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */
	
// we shall use a dictionary for the folder customization (minimum version Thunderbird 19 for JSON support)
/*
  globals
    gFolderTreeView,
*/


QuickFolders.FolderTree = {
  dictionary: null,
  customIcons: [], // new array
  documents: [],
  hasContentIcons: false,
  init: function (doc, tabOrWindow) {
    // you need to restart QuickFolders to bypass
    let isEnabled = QuickFolders.Preferences.getBoolPref("folderTree.icons");
    try {
      // Thunderbird 115 uses FolderUtils.getFolderIcon(gFolder); - see about3Pane.js
      QuickFolders.Util.logDebugOptional(
        "folderTree",
        `QuickFolders.FolderTree.init()\nIcons enabled = ${isEnabled}`
      );
      // now we need to iterate all Folders and find matches in our dictionary,
      // then inject the style rules for the icons...
      QuickFolders.FolderTree.documents.push({ document: doc, tabOrWindow: tabOrWindow });

      let folderIcon = doc.querySelector("#folderTree li > .container > .icon");
      if (folderIcon) {
        let computedStyle = doc.defaultView.getComputedStyle(folderIcon);
        const styleMap = new Map(
          Array.from(computedStyle).map((prop) => [prop, computedStyle.getPropertyValue(prop)]),
        );
        const contentValue = styleMap.get("content");
        if (contentValue && (contentValue.startsWith("url") || contentValue.endsWith('svg")'))) {
          QuickFolders.FolderTree.hasContentIcons = true;
        }
      }

      this.loadDictionary(doc);
    } catch (ex) {
      QuickFolders.Util.logException("QuickFolders.FolderTree.init()", ex);
    }
  },

  // remove references to closed tab
  // pass in a tabInfo object (which has tabId)
  release: function (tabOrWindow) {
    if (tabOrWindow.tabId) {
      let id = tabOrWindow.tabId;
      let d = this.documents.find((e) => e.tabOrWindow.tabId == id);
      if (d) {
        let idx = this.documents.indexOf(d),
          removed = this.documents.splice(idx, 1);
        QuickFolders.Util.logDebugOptional(
          "folderTree.icons",
          `released tab [${tabOrWindow.tabId}] `,
          ...removed
        );
      }
    }
  },

  restoreStyles: function (doc) {
    const util = QuickFolders.Util,
      prefs = QuickFolders.Preferences,
      makeSelector = this.makeSelector,
      isIcons = prefs.getBoolPref("folderTree.icons"),
      isInjectCSS = prefs.getBoolPref("folderTree.icons.injectCSS"),
      debugIcons = prefs.isDebugOption("folderTree.icons");

    function iterate(key, value) {
      let selector = makeSelector(key);
      if (debugIcons) {
        util.logDebugOptional("folderTree.icons", `made selector: ${selector}\nvalue: ${value}`);
      }
      // the folder properties are (or should be) restored by the msf file automatically.
      QuickFolders.Styles.setElementStyle(ss, selector, "list-style-image", value);
      // -moz-tree-row: Use this to set the background color of a row.
      // -moz-tree-cell-text: the text in a cell. Use this to set the font and text color.
    }
    function logEarlyExit(reason) {
      util.logDebugOptional("folderTree.icons", "restoreStyles - Early Exit\n" + reason);
      return false;
    }
    if (debugIcons) {
      QuickFolders.Util.logHighlight("folderTree.restoreStyles()", {
        color: "#FFFFCC",
        background: "#994C00",
      });
    }
    if (!this.dictionary) {
      return;
    }
    let len = this.dictionary.size;
    if (!len) {
      return logEarlyExit("dictionary empty?");
    }
    if (!isIcons) {
      return logEarlyExit("folderTree.icons = false!");
    }
    if (!isInjectCSS) {
      return logEarlyExit("folderTree.icons.injectCSS = false!");
    }
    let ss = QuickFolders.Interface.getStyleSheet(
      doc,
      "qf-foldertree.css",
      "QuickFolderFolderTreeStyles"
    );
    util.logDebugOptional("folderTree.icons", `iterate Dictionary: ${len} items…`);
    // should be for..of
    this.dictionary.forEach(function (value, key, _map) {
      iterate(key, value);
    });
  },

  hasTreeItemFolderIcon: function (folder) {
    try {
      if (!folder) {
        return false;
      }
      // folder.getStringProperty may throw in C++, even if not called as a function!
      let folderIcon = folder.getStringProperty("folderIcon") || "";
      if (!folderIcon || folderIcon === "noIcon") {
        return false;
      }
      return true;
    } catch (ex) {
      const fName = folder.prettyName || folder.localizedName;
      QuickFolders.Util.logDebugOptional(
        "folderTree",
        `hasTreeItemFolderIcon(${fName}) exception`,
        ex
      );
      return false;
    }
  },

  hasFolderCustomIcon: function (fld) {
    if (!fld) {
      return false;
    }
    let entry = QuickFolders.FolderTree.customIcons.find((e) => e.folderURI == fld.URI);
    if (entry) {
      return true;
    }
    return false;
  },

  // returns whether element has icon or not
  addFolderIconToElement: function (element, folder) {
    const util = QuickFolders.Util;
    util.logDebugOptional(
      "folderTree.icons",
      `addFolderIconToElement(${element.tagName}, ${folder.prettyName || folder.localizedName})`
    );
    let hasIcon;
    try {
      let folderIcon = "";
      try {
        if (folder && typeof folder.getStringProperty != "undefined") {
          folderIcon = folder.getStringProperty("folderIcon");
        }
      } catch {;}
      if (!folder || folderIcon == "" || folderIcon == "noIcon") {
        hasIcon = false;
        util.logDebugOptional("folderTree.icons", "no icon:" + folderIcon);
        if (!folder) {
          util.logDebugOptional("folderTree.icons", "folder=null");
        } else if (folderIcon == "") {
          util.logDebugOptional("folderTree.icons", "folderIcon=empty");
        } else if (folderIcon == "noIcon") {
          util.logDebugOptional("folderTree.icons", "folderIcon=noIcon");
        }
      } else {
        let iconURL = folder.getStringProperty("iconURL");
        if (iconURL) {
          element.style.listStyleImage = iconURL;
          hasIcon = true;
        }
      }
      util.logDebugOptional(
        "folderTree.icons",
        `Set element.style.listStyleImage = ${element.style.listStyleImage}`
      );
    } catch (ex) {
      util.logException("addFolderIconToElement()", ex);
    }
    return hasIcon;
  },

  loadDictionary: async function (doc) {
    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Dict.jsm
    const util = QuickFolders.Util,
      prefs = QuickFolders.Preferences,
      debug = prefs.isDebugOption("folderTree");
    let isProfiling = QuickFolders.Preferences.isDebugOption("performance");
    if (isProfiling) {
      util.stopWatch("start", "loadDictionary");
    }
    let allIcons = [];
    let filedIcons = await QuickFolders.FolderTree.loadTreeIcons(); // [issue 399]
    if (prefs.isDebugOption("folderTree.icons")) {
      console.log("restoreTreeIcons, read data:", filedIcons);
    }
    QuickFolders.FolderTree.customIcons = filedIcons;

    util.logDebugOptional(
      "folderTree,folderTree.icons",
      "QuickFolders.FolderTree.loadDictionary()"
    );

    let styleSheet = QuickFolders.Interface.getStyleSheet(
      doc,
      "qf-foldertree.css",
      "QuickFolderFolderTreeStyles"
    );
    let fileSpec;

    for (let i = 0; i < filedIcons.length; i++) {
      let item = filedIcons[i];
      let fld = QuickFolders.Model.getMsgFolderFromUri(item.folderURI);
      if (fld) {
        fileSpec = item.iconURL;
        QuickFolders.FolderTree.setFolderTreeIcon(fld, fileSpec, true, styleSheet);
      }
    }
    // [issue 619] avoid cropping of icons in folder tree
    if (prefs.getBoolPref("folderTree.icons.injectCSS")) {
      QuickFolders.FolderTree.injectGlobalIconCSS(doc);
    }

    this.dictionary = new Map();
    let txtList = "",
      txtWithIcon = "",
      iCount = 0,
      iIcons = 0,
      iNoIcon = 0,
      iErrors = 0;

    for await (let folder of util.allFoldersIterator()) {
      iCount++;

      try {
        if (typeof folder.getStringProperty == "undefined") {
          continue;
        }
        let key = folder.getStringProperty("folderIcon"),
          url = key && key != "noIcon" ? folder.getStringProperty("iconURL") : "";

        if (key && key != "noIcon" && url) {
          this.addItem(key, url);
          allIcons.push({
            folderURI: folder.URI,
            cssKey: key,
            iconURL: url,
          });

          if (debug) {
            txtWithIcon += `${iCount.toString()} - ${folder.server.hostName} - ${
              folder.prettyName || folder.localizedName
            }`;
            txtWithIcon += `   ${key}: ${url}\n`;
          }
          iIcons++;
        } else {
          // folder w/o icon
          if (debug) {
            txtList += `${iCount.toString()} - ${folder.server.hostName} - ${
              folder.prettyName || folder.localizedName
            }\n`;
          }
          iNoIcon++;
        }
      } catch (ex) {
        switch (ex.result) {
          case 0x80550007: // NS_ERROR_FAILURE
            util.logException(
              `QuickFolders.FolderTree.loadDictionary() - ${
                folder.prettyName || folder.localizedName
              }`,
              ex
            );
            break;
          case 0x80550005: // NS_MSG_ERROR_FOLDER_SUMMARY_OUT_OF_DATE
            util.logDebugOptional(
              "folderTree",
              "QuickFolders.FolderTree.loadDictionary()\n" +
                `Skipping folder (folder summary out of date): ${
                  folder.prettyName || folder.localizedName
                }`
            );
            iErrors++;
            break;
          default:
            // likely thrown by nsIMsgFolder.getStringProperty
            iErrors++;
        }
        iNoIcon++;
      }
    }
    util.logDebugOptional(
      "folderTree",
      "Total Number of Folders:" +
        iCount +
        "\nFolders with Icon:" +
        iIcons +
        `\nErrors thrown by Tb: ${iErrors}`
    );
    util.logDebugOptional("folderTree", `${iNoIcon} Folders without Icon\n`, txtList);
    util.logDebugOptional("folderTree", `${iIcons} Folders WITH Icon\n`, txtWithIcon);

    if (isProfiling) {
      let time = util.stopWatch("stop", "loadDictionary");
      console.log(
        `%cFolderTree.loadDictionary() - after creating dictionary ${time} `,
        "background-color: rgb(0,80,140); color:white;"
      );
    }

    if (debug) {
      this.debugDictionary();
    }
    this.restoreStyles(doc);
    if (isProfiling) {
      let time = util.stopWatch("all", "loadDictionary");
      console.log(
        `%cFolderTree.loadDictionary() - Ends, altogether took: ${time}`,
        "background-color: rgb(0,80,140); color:white;"
      );
    }

    util.logDebugOptional("folderTree.icons", "loadDictionary() finished.");
    return allIcons;
  },

  storeDictionary: function () {
    if (!this.dictionary) {
      return;
    }
    QuickFolders.Util.logDebugOptional("folderTree", "QuickFolders.FolderTree.storeDictionary()");
    // let myJson =
    //    this.ES6 ?
    //    JSON.stringify(Array.from(this.dictionary.entries()))
    //    this.dictionary.toJSON();
    // no need for this anymore
    // QuickFolders.Preferences.getStringPref("folderIcons", myJson);
    this.debugDictionary();
  },

  storeTreeIcons: async function () {
    let folderIcons = QuickFolders.FolderTree.customIcons || [];
    let jsonData = JSON.stringify(folderIcons, null, "  ");

    let profileDir = PathUtils.profileDir,
        path = PathUtils.join(profileDir, "extensions", "quickFolders-FolderTree.json");

    try {
      await IOUtils.writeUTF8(path, jsonData);
      console.log(`Backed up ${folderIcons.length} folder tree icons to ${path}`);
    } catch (ex) {
      QuickFolders.Util.logException("Saving Folder Tree icons failed", ex);
    }
  },

  loadTreeIcons: async function () {
    let profileDir = PathUtils.profileDir,
      path = PathUtils.join(profileDir, "extensions", "quickFolders-FolderTree.json");
    /* Returns an Array of items:
    [
      {
        folderURI: folder.URI,
        cssKey: key,
        iconURL: url,
      }                  
    ]
    */

    try {
      let allIcons = await IOUtils.readJSON(path);

      if (!Array.isArray(allIcons)) {
        throw new Error("Invalid folder tree icon data (not an array)");
      }

      QuickFolders.Util.logDebugOptional(
        "folderTree.icons",
        `loadTreeIcons: read ${allIcons.length} Icons.`,
      );

      return allIcons;
    } catch (reason) {
      QuickFolders.Util.logDebug(`loadTreeIcons() - Failure: ${reason}`);
      return [];
    }
  },

  debugDictionary: function (withAlert) {
    // eslint-disable-next-line no-unused-vars
    function appendKeyValue(key, value, t) {
      t.txt += "\n" + key + ": " + value;
    }
    let util = QuickFolders.Util;
    if (!this.dictionary) {
      util.logDebug("no FolderTree.dictionary");
      return;
    }
    let txt = "QuickFolders.FolderTree - Dictionary Contents";
    this.dictionary.forEach(function (value, key, _map) {
      txt += "\n" + key + ": " + value;
    });

    util.logDebugOptional("folderTree", txt);
    if (withAlert) {
      util.alert(txt);
    }
  },

  addItem: function (key, uri) {
    QuickFolders.FolderTree.dictionary.set(key, uri);
  },

  removeItem: function (key) {
    this.dictionary.delete(key);
  },

  makeSelector: function (folder) {
    // cssRules inserts a space so we need to do it too - otherwise we will end up with duplicates
    let uriAscII = btoa(folder.URI);
    // the id starts with "modeName-"" we want to eliminate modeName and use the "endsWith" operator
    let rv = `#folderTree li[id$="${uriAscII}"] > .container > .icon`; // set background-image
    return rv;
  },

  // [issue 283] optimisation: method to always generate a CSS selectable attribute (based on folder uri),
  //             to avoid folder.getStringProperty()
  // [issue 399] we can drop the prefix!
  makeSelectorGUID: function (folder, prefix = "folderIcon_") {
    let names = folder.URI.split("/"),
      serverKey = folder.server.key,
      GUID = serverKey + "_" + names[names.length - 2] + "_" + names[names.length - 1];
    let rv =
      // eslint-disable-next-line no-useless-escape
      prefix + GUID.replace(/[\s\,\?\!\:\.\@\%\[\]\{\}\(\)\|\/\+\&\^]/g, "_");

    return rv;
  },
  /*									 
	Adds following styles to a folder tree item:
	treechildren::-moz-tree-image(folderIconCol, folderIcon_mail_inbox) {
		-moz-image-region: rect(0px, 16px, 16px, 0px);
		list-style-image: url("...");
	}	
	*/
  setFolderTreeIcon: function (folder, iconURI, silent = false, styleSheet = null) {
    // https://developer.mozilla.org/en-US/docs/XUL/Tutorial/Styling_a_Tree
    const util = QuickFolders.Util,
      QI = QuickFolders.Interface,
      prefs = QuickFolders.Preferences,
      isIcons = prefs.getBoolPref("folderTree.icons"),
      isInjectCSS = prefs.getBoolPref("folderTree.icons.injectCSS");

    if (!isInjectCSS) {
      util.logDebug(
        "Folder Tree Icons are disabled! \n" +
          `extensions.quickfolders.folderTree.icons=${isIcons}\n` +
          `extensions.quickfolders.folderTree.icons.injectCSS=${isInjectCSS}`
      );
      return false;
    }

    let existingItem = QuickFolders.FolderTree.customIcons.find((e) => e.folderURI == folder.URI);
    let selector = this.makeSelector(folder);
    let iconGUID = this.makeSelectorGUID(folder); // folderIcon_ property
    let cssUri;
    let fileSpec;

    if (iconURI) {
      let fileURL;
      if (typeof iconURI == "string") {
        fileSpec = iconURI;
        cssUri = fileSpec;
      } else {
        fileURL = iconURI.QueryInterface(Components.interfaces.nsIURI);
        let fPath = fileURL.filePath || fileURL.path,
          parts = fPath.split("/"),
          shortenedPath = fPath;
        if (parts.length > 4) {
          // buid shortened path.
          const start = parts[0] || parts[1]; // if path starts with /
          parts.shift(); // remove 1st (empty?) item
          while (parts.length > 3) {
            parts.shift();
          } // remove first element.
          shortenedPath = start + "/ … /" + parts.join("/");
        }
        util.logDebugOptional(
          "folderTree.icons",
          `FolderTree.setFolderTreeIcon(${
            folder.prettyName || folder.localizedName
          },${shortenedPath})`
        );
        fileSpec = fileURL.asciiSpec;
        cssUri = "url(" + fileSpec + ")";
      }
      try {
        folder.setStringProperty("iconURL", cssUri);
      } catch (ex) {
        util.logException("setFolderTreeIcon", ex);
        // should we exit?
      }
    } else {
      let removeIdx = QuickFolders.FolderTree.customIcons.indexOf(existingItem);
      if (removeIdx >= 0) {
        QuickFolders.FolderTree.customIcons.splice(removeIdx, 1);
      }
    }

    // need to do this for ALL 3pane tabs!
    // let doc = || this.document document; // 3pane doc
    // need to iterate this.documents!
    for (let docInfo of this.documents) {
      // make sure this tab still exists
      let doc = docInfo.document;
      // check if tab is illegal (was closed in the meantim)
      if (!docInfo.tabOrWindow.chromeBrowser) {
        continue;
      }

      // this needs to be retrieved from the correct document!
      // QI.CurrentFolderTab; // always update current folder toolbar icon?
      let currentFolderTab = doc.getElementById("QuickFoldersCurrentFolder");

      let ss =
        styleSheet || QI.getStyleSheet(doc, "qf-foldertree.css", "QuickFolderFolderTreeStyles");

      // [issue 283] - avoid folder.getStringProperty and create hardcoded selector
      if (!ss) {
        QuickFolders.Util.logDebug(
          "setFolderTreeIcon() early exit - Couldn't retrieve style sheet!",
          doc
        );
      }
      try {
        if (!iconURI) {
          // when do we force this to be executed?
          util.logDebug(
            `FolderTree.setFolderTreeIcon(${folder.prettyName || folder.localizedName}, empty)`,
          );
          util.logDebugOptional(
            "folderTree.icons",
            `REMOVING:\n${selector} {\nbackground-image\n}`,
          );
          QuickFolders.Styles.removeElementStyle(ss, selector, "background-image");
          folder.setStringProperty("folderIcon", "noIcon");
          folder.setStringProperty("iconURL", "");
          if (typeof folder.setForcePropertyEmpty === "function") {
            folder.setForcePropertyEmpty("folderIcon", false); // remove property
          }
          if (QuickFolders.FolderTree.hasContentIcons) {
            // Tb 148+ from about3Pane.css - restore the default icon (yellow folder)
            QuickFolders.Styles.setElementStyle(
              ss,
              selector,
              "content",
              "var(--icon-folder)",
              true,
            );
          }
          return true; // something changed! [issue 651]
        }
        // folder.setStringProperty("folderIcon", propName);
        util.logDebugOptional(
          "folderTree.icons",
          "setFolderTreeIcon()\n" + "folder.URI: " + folder.URI + "\n" + "cssUri:     " + cssUri
        );
        util.logDebugOptional(
          "folderTree.icons",
          "ADDING:\n" + selector + " {\n" + "background-image:" + cssUri + "\n}"
        );

        // overwrite messenger/skin/folderPane.css
        QuickFolders.Styles.setElementStyle(ss, selector, "background-image", cssUri, true);
        if (QuickFolders.FolderTree.hasContentIcons) {
          // overwrite the folder icon in modern versions of Tb 148+
          QuickFolders.Styles.setElementStyle(
            ss,
            selector,
            "content",
            "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'></svg>\")",
            true,
          );
        }
        // let key = folder.getStringProperty("folderIcon"); // "folderIcon_" + selector ??
        if (existingItem) {
          existingItem.cssKey = iconGUID;
          existingItem.iconURL = cssUri;
        } else {
          QuickFolders.FolderTree.customIcons.push({
            folderURI: folder.URI,
            cssKey: iconGUID,
            iconURL: cssUri,
          });
        }
        folder.setStringProperty("folderIcon", iconGUID);
        if (prefs.isDebugOption("folderTree.icons")) {
          util.logDebug(
            "DOUBLE CHECK FOLDER STRING PROPS HAVE BEEN SET:\n" +
              `iconURL = ${folder.getStringProperty("iconURL")}\n` +
              `folderIcon = [${folder.getStringProperty("folderIcon")}]`
          );
        }
        // [issue 283] - do not force update during setFolderTreeIcon
      } catch (ex) {
        util.logException("setFolderTreeIcon", ex);
        return true; // [issue 546] signal that the change was done anyway!
        // setForcePropertyEmpty always throws...
      } finally {
        if (!silent) {
          this.debugDictionary(); // test dictionary, just for now
        }
        if (
          currentFolderTab &&
          currentFolderTab.folder &&
          currentFolderTab.folder.URI == folder.URI
        ) {
          QuickFolders.Interface.initCurrentFolderTab(currentFolderTab, currentFolderTab.folder);
        }
      }
    } // iterate folder pane documents
    return true;
  },

  refreshTree: async function () {
    const util = QuickFolders.Util,
      theTreeView = gFolderTreeView,
      ImapNoselect = 0x01000000; // thrown by performExpand if offline!
    let iCount = 0;

    let isProfiling = QuickFolders.Preferences.isDebugOption("folderTree,performance");
    if (isProfiling) {
      util.stopWatch("start", "refreshTree");
    }

    // disable updating recent folders
    let touch = util.touch; // back up.
    util.touch = function () {};

    try {
      let result = Services.prompt.confirm(
        window,
        "QuickFolders.FolderTree",
        "Rebuild the tree for IMAP?\n" +
          "This may take a long time, depending on the number of folders on the server."
      );
      if (!result) {
        return;
      }
      util.ensureNormalFolderView();
      let collapsedFolders = [];
      util.logDebug("refreshTree() starting to iterate all folders which Thunderbird sees...");
      for await (let folder of QuickFolders.Util.allFoldersIterator()) {
        // open folder in tree...
        let rowIndex = theTreeView.getIndexOfFolder(folder),
          isExpanded = rowIndex ? theTreeView._rowMap[rowIndex].open : false;
        if (folder.incomingServerType == "imap" && !(folder.flags & ImapNoselect)) {
          iCount++;
          if (!isExpanded) {
            collapsedFolders.push(folder);
          } // remember folders that are not open, to restore later.
          // let subscribableServer = folder.server.QueryInterface(Ci.nsISubscribableServer); // gSubscribableServer
          try {
            theTreeView.selectFolder(folder, true); // forceSelect
            // FolderPaneSelectionChange() - gFolderDisplay.show will fail if the folder is missing on Imap!
            // FolderDisplayWidget.
            let rowIndex = theTreeView.getIndexOfFolder(folder),
              hasSubFolders = folder.hasSubFolders;
            //    subCount = hasSubFolders ? countSubfolders(folder) : 0;
            util.logDebug(
              `[${
                folder.prettyName || folder.localizedName
              }] => index = ${rowIndex}, hasSubFolders = ${hasSubFolders}, open = ${isExpanded}`
            );

            folder.performExpand(msgWindow);
            //let newSubCount = countSubfolders(folder);
            //if (subCount != newSubCount) {
            //   util.logToConsole("Subfolder count for [" + (folder.prettyName || folder.localizedName) + "] has changed from " + subCount + " to " + newSubCount);
            //}
          } catch (ex) {
            util.logException(
              `Couldn't select [${folder.prettyName || folder.localizedName}] - skipping that one!`,
              ex
            );
          }
          // if number of subfolders has changed: preserve subscribe state of parent and propagate
          // subscribableServer.unsubscribe(name);
        }
      }
      for (let i = collapsedFolders.length - 1; i > 0; i--) {
        let folder = collapsedFolders[i];
        let rowIndex = theTreeView.getIndexOfFolder(folder);
        if (rowIndex > 0 && theTreeView._rowMap[rowIndex].open) {
          theTreeView._toggleRow(rowIndex);
        }
      }
    } catch (ex) {
      util.logException("FolderTree.refreshTree()", ex);
    } finally {
      setTimeout(function () {
        util.touch = touch; // restore update function.
      }, 10000);
      util.logDebug("refreshTree() iterated all accessible (" + iCount + ") folders.");
    }

    if (isProfiling) {
      let time = util.stopWatch("all", "refreshTree");
      console.log(
        `%cRunning refreshTree() took: ${time}`,
        "background-color: rgb(0,160,40); color:white;"
      );
    }
  },

  injectGlobalIconCSS: function (doc) {
    if (!doc) {
      return;
    }
    const TREE_STYLE_TITLE = "QuickFoldersFolderTreeGlobalStyles";

    const selector = "#folderTree .icon";
    const property = "background-size";
    const value = "contain";
    const ruleText = `${selector} { ${property}: ${value} !important; }`;

    // if the sheet is already there, through WL - so most likely the icon size rule is, too.
    let ss = QuickFolders.Interface.getStyleSheet(doc, null, TREE_STYLE_TITLE);

    if (!ss) {
      let styleEl = doc.createElement("style");
      styleEl.setAttribute("title", TREE_STYLE_TITLE);
      doc.documentElement.appendChild(styleEl);
      ss = styleEl.sheet;
    }

    // robust detection using existing helper
    let existingVal = QuickFolders.Styles.getElementStyle(ss, selector, property);

    if (existingVal && existingVal.trim() === value) {
      return; // rule already present, nothing to do
    }

    try {
      ss.insertRule(ruleText, ss.cssRules.length);
    } catch (ex) {
      QuickFolders.Util.logException("injectGlobalIconCSS()", ex);
    }    
  },
};

