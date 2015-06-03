"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
//QuickFolders.Util.logDebug('Defining QuickFolders.bookmarks...');
Components.utils.import("resource://gre/modules/Services.jsm");


if (QuickFolders.Util.Application == 'Postbox') {
  XPCOMUtils.defineLazyGetter(this, "NetUtil", function() {
  Components.utils.import("resource://gre/modules/NetUtil.jsm");
  return NetUtil;
  });
}


// drop target - persistable "reading list"
QuickFolders.bookmarks = {
  Entries: [],  // { Uri , Folder , label? }
  charset: "UTF-8",
  get isDebug() {
    return (QuickFolders.Preferences.isDebugOption('bookmarks'));
  },
  get document() {
    return QuickFolders.doc;
  },
  get hasEntries() {
    return (this.Entries.length > 0); 
  },
  indexOfEntry: function indexOfEntry(URI) {
    for (let i=0; i<this.Entries.length; i++) {
      if (this.Entries[i].Uri == URI)
        return i;
    }
    return -1;
  },
  
  findBookmark: function findBookmark(entry) {
    function setTermValue(term, attr, op, valStr) {
      let val = term.value;
      term.attrib = attr;
      val.attrib = attr;
      if (attr == Ci.nsMsgSearchAttrib.Date)
        val.date = valStr;
      else
        val.str = valStr;
      term.op = op;
      term.value = val; // copy back object.
    }
	  function _getEmailAddress(a) {
			return a.replace(/.*<(\S+)>.*/g, "$1");
		}    
    const Ci = Components.interfaces,
          Cc = Components.classes,
          typeOperator = Ci.nsMsgSearchOp;
    if (this.isDebug)  debugger;
    let folder = QuickFolders.Model.getMsgFolderFromUri(entry.FolderUri),
        util = QuickFolders.Util,
        searchSession = (util.Application=='Thunderbird') 
                      ? gFolderDisplay.view.search.session
                      : Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession),
        searchTerms = [],
        realTerm = searchSession.createTerm(),
        subj = entry.subject || entry.label.substring(entry.label.indexOf(':')+1, entry.label.lastIndexOf('-'));
    setTermValue(realTerm,
                 Ci.nsMsgSearchAttrib.Subject,
                 typeOperator.Contains,
                 subj.trim())
    searchTerms.push(realTerm);
    if (entry.author) {
        realTerm = searchSession.createTerm();
        let em = _getEmailAddress(entry.author);
        em = em || author;
        setTermValue(realTerm,
                     Ci.nsMsgSearchAttrib.Sender,
                     typeOperator.Contains,
                     em);
        searchTerms.push(realTerm);
    }
    if (entry.date) {
        realTerm = searchSession.createTerm();
        setTermValue(realTerm,
                     Ci.nsMsgSearchAttrib.Date,
                     typeOperator.Is,
                     entry.date);
        searchTerms.push(realTerm);
    }
    window.openDialog("chrome://messenger/content/SearchDialog.xul", "_blank",
                      "chrome,resizable,status,centerscreen,dialog=no",
                      { folder: folder, searchTerms: searchTerms});          
  },
  
  onClick: function onClickBookmark(menuItem, evt, entry) {
    let util = QuickFolders.Util;
    if (this.isDebug)  debugger;
    evt.stopPropagation();
    switch(evt.button) {
      case 0: // left button
        if (!util.openMessageTabFromUri(entry.Uri)) {
          util.logDebug("Invalid Uri - couldn't open message tab from: " + entry.Uri);
          let text = util.getBundleString('qf.prompt.readingList.searchMissingItem', 'Cannot find the mail, it might have been moved elsewhere in the meantime.\n{1}\n\nDo you want to search for it?'),
              search = Services.prompt.confirm(window, "QuickFolders", text.replace("{1}", entry.label));
          if (search) {
            this.findBookmark(entry);
          }
            
        }
        break;
      case 2: // right button
        // remove item!
        let question = util.getBundleString('qf.prompt.readingList.removeItem', "Remove this item?");
        if (Services.prompt.confirm(window, "QuickFolders", question)) {
          let bm = QuickFolders.bookmarks;
          bm.removeUri(entry.Uri);
          menuItem.parentNode.removeChild(menuItem);
          bm.update();
          bm.save();
          evt.preventDefault();
        }
        break;
    }
  } ,
  
  resetList: function resetList(isSave) {
    let util = QuickFolders.Util;
    util.logDebug ('bookmarks.resetList()'); 
    while (this.Entries.length) {  
      this.Entries.pop();
    }
    let menu = util.$('QuickFolders-readingListMenu');
    for (let i = menu.childNodes.length-1; i>0; i--) {
      let item = menu.childNodes[i];
      if (item.className.indexOf('msgUri')>=0 || item.tagName=='menuseparator')
        menu.removeChild(item);
    }
    this.update();
    if (isSave)
      this.save();
  },  
  
  addMenuItem: function addMenuItem(entry) {
    let util = QuickFolders.Util,
        menu = util.$('QuickFolders-readingListMenu'),
        menuitem = document.createElement("menuitem");
    if (this.Entries.length==1)
      menu.appendChild(document.createElement('menuseparator'));
    menuitem.setAttribute("label", entry.label);
    menuitem.className='msgUri menuitem-iconic';
    menuitem.addEventListener("click", function(event) { 
      QuickFolders.bookmarks.onClick(event.target, event, entry); return false; }, false);
    menu.appendChild(menuitem);
  },
  
  addMail: function addMail(newUri, sourceFolder)  {
    let util = QuickFolders.Util,
        countEntries = this.Entries.length;
    const MAX_BOOKMARKS = 5;
    if (!util.hasPremiumLicense(false) && countEntries>2) {
      let text = util.getBundleString("qf.notification.premium.readingList",
                  "You have now {1} bookmarks defined. The free version of QuickFolders allows a maximum of {2}.");
      util.popupProFeature("bookmarks", text.replace("{1}", countEntries).replace("{2}", MAX_BOOKMARKS.toString()));
      // early exit if no license key and maximum icon number is reached
      if (countEntries >= MAX_BOOKMARKS)
        return false;
    }
    
    if (countEntries >= QuickFolders.Preferences.getIntPref('bookmarks.maxEntries')) {
      util.logToConsole('Maximum number of bookmarks reached! You can change this via right-click on the Reading List checkbox in QuickFolders Options / General / Main Toolbar Elements.');
      return false;
    }
    
    if (this.indexOfEntry(newUri) == -1) { // avoid duplicates!
      let chevron = ' ' + "\u00BB".toString() + ' ',
          showFolder = QuickFolders.Preferences.getBoolPref('bookmarks.folderLabel'),
          hdr = messenger.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label = util.getFriendlyMessageLabel(hdr);
          if (showFolder && sourceFolder)
            label = sourceFolder.prettyName + chevron + label;
          let entry = 
            { 
              Uri:newUri, 
              FolderUri: sourceFolder.URI, 
              label: label, 
              bookmarkType:'msgUri',
              subject: hdr.subject,
              author: hdr.author,
              date: hdr.date
            }
          /* add to Entries */
          this.Entries.push(entry);
          // now add to menu!
          this.addMenuItem(entry);
        }
        catch(ex) {
          util.logException('bookmarks.add', ex);
        }
      }
    }
    else {
      util.logDebugOptional("bookmarks", "Skipping duplicate entry for uri:\n" + newUri);
    }
    return true;
  },
  
  removeUri: function removeUri(URI)  {
    let i = this.indexOfEntry(URI);
    if (i>=0) {
      if (this.Entries[i].Uri == URI) {
        this.Entries.splice(i, 1);
      }
    }
  },
  
  addCurrent: function addCurrent() {
    if (this.isDebug) debugger;
    let util = QuickFolders.Util,
        uris,
        actUris = this.getActiveUri();
        
    if (!actUris) return; // something went wrong
    
    if (Object.prototype.toString.call(actUris)  === "[object Array]") {
      uris = actUris;
    }
    else {
      uris = [];
      uris.push(actUris); // create array
    }
    
    util.logDebugOptional("bookmarks", "Adding + " + uris.length + " bookmarks...");
    // iterate the array
    for (let i=0; i< uris.length; i++) {
      let uriObject = uris[i]; 
      // create blank entry    
      if (Object.keys(uriObject).length === 0) {
        util.alert("Could not determine context URL!","QuickFolders");
        return;
      }
      let earlyExit = false;
      switch (uriObject.bookmarkType) {
        case 'msgUri':
          if (!this.addMail(uriObject.url, uriObject.folder))
            earlyExit = true; // if it fails (because no license / max items hit)
          break;
        case 'browser':
          let entry = 
            { Uri: uriObject.url, 
              FolderUri: uriObject.folder ? uriObject.folder.URI : '', 
              label: uriObject.label || uriObject.url, 
              bookmarkType: 'browser' };
          /* add to Entries */
          this.Entries.push(entry);
          // now add to menu!
          this.addMenuItem(entry);
          break;
        default:
          util.alert('Currently unsupported bookmark type: ' + uriObject.bookmarkType + '\n'
                + 'Select at least one message or just drag mails on the button');
          return;
      }
      if (earlyExit) break;
    }
    
    this.update(); // update UI
    this.save();   // persist to file
  } ,
  
  getBrowser: function getBrowser() {
		const Ci = Components.interfaces;
    let util = QuickFolders.Util,
		    interfaceType = Ci.nsIDOMWindow,
        mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
        browsers = null,
        DomWindow = null,
        theBrowser = null;
    if (util.Application=='Postbox') return null;
    
    let getWindowEnumerator = 
      (util.isLinux) ?
      mediator.getXULWindowEnumerator :
      mediator.getZOrderXULWindowEnumerator;
    browsers = getWindowEnumerator ('navigator:browser', true);
    if (browsers) {
      theBrowser = browsers.getNext();
      if (theBrowser) {
        if (theBrowser.getInterface)
          DomWindow = theBrowser.getInterface(interfaceType);
        else {
          try {
            // Linux
            DomWindow = theBrowser.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(interfaceType);
          }
          catch(e) {;}
        }
      }
    }
    if (!DomWindow) {
      browsers = getWindowEnumerator ('navigator:browser', true);
      if (!browsers || !(util.Application!='Firefox' && browsers.hasMoreElements()))
        browsers = getWindowEnumerator ('mail:3pane', true);
      if (!browsers)
        return  null;
      try {
        if (browsers.hasMoreElements()) {
          theBrowser = browsers.getNext();
          if (theBrowser.getInterface)
            DomWindow = theBrowser.getInterface(interfaceType);
          else // Linux
            DomWindow = theBrowser.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(interfaceType)
        }
        else {
          DomWindow=getBrowser();  // Linux last resort
        }
      }
      catch(ex) {
        util.logException("getBrowser() failed:", ex);
      }
    }
    return DomWindow;
  },
  
	alternativeGetSelectedMessageURI : function alternativeGetSelectedMessageURI(win) {
	try {
		let view = win.GetDBView();
		if (view.URIForFirstSelectedMessage)
			return view.URIForFirstSelectedMessage;
		
		let messageArray = {};
		let length = {};
		view.getURIsForSelection(messageArray, length);
		if (length.value)
			return messageArray.value[0];
		else
			return null;
		}
		catch (ex) {
			dump("alternativeGetSelectedMessageURI ex = " + ex + "\n");
			return null;
		}
	},  
  
  getActiveUri: function getActiveUri() {
    let util = QuickFolders.Util,
        browser = this.getBrowser(),
        tabmail = document.getElementById("tabmail"),
        currentURI = '',
        currentLabel = '',
        currentType = '',
        currentFolder = null;
		if (!browser && !tabmail) 
      return null; // in Linux we cannot get the browser while options dialog is displayed :(
    try {
      let isOriginBrowser = false;
      // for SeaMonkey we need to determine whether we opened from the messenger or from the navigator window
      if (util.Application=='SeaMonkey' && !tabmail) {
        tabmail = browser.document ? browser.document.getElementById("tabmail") : document.getElementById("tabmail");
        // double check whether we come from browser
        if (util.Application=='SeaMonkey') {
          if (!tabmail) {
            isOriginBrowser = true;
          }
        }
      }
      /*     GET CONTEXT FROM CURRENT MAIL TAB  */
      if (!isOriginBrowser) {
        if (tabmail) {
          let tab = tabmail.selectedTab || tabmail.currentTab,  // Pb currentTab
              theMode = tab.mode ? tab.mode.name : tab.getAttribute("type");
          if (!browser)
            browser = tab.browser;
          if (theMode == 'folder') {
            if (util.Application == 'Postbox') {
              if (GetNumSelectedMessages()>0)
                theMode = 'message';
            }
            else {
              // if we are in folder mode we might have a message selected
              if (tab.folderDisplay && tab.folderDisplay.focusedPane && tab.folderDisplay.focusedPane.id =='threadTree') {
                theMode = 'message';
              }
            }
          }
          
          currentType = theMode;
          util.logDebugOptional("bookmarks", "bookmarks.getActiveUri() - Selected Tab Type: " + theMode);
          switch (theMode) {
            case 'folder':
              try {
                let currentFolder = util.CurrentFolder;
                currentURI = currentFolder.server.hostName; // password manager shows the host name
                if (currentURI == 'localhost') {
                  currentURI = currentFolder.server.realHostName;
                }
                currentLabel = currentFolder.prettyName;
              }
              catch(ex) {
                util.logException("Could not determine current folder: ",ex);
                return ""
              }
              break;

            case 'calendar':
              currentURI="Calendar";
              currentLabel="Calendar";
              break;
            case 'contentTab':      // fall through
            case 'thunderbrowse':
              currentURI = tab.browser.currentURI.host;
              currentLabel = tab.browser.contentTitle;
              currentType = 'browser';
              break;
            case 'glodaFacet':         // fall through
            case 'glodaSearch-result': // fall through
            case 'glodaList':          // fall through
            case 'message':            // fall through => type = msgUri
              // find out about currently viewed message
              try {
                // are multiple mails selected?
                let selectionCount =
                  (['Postbox', 'SeaMonkey'].indexOf(util.Application)>=0) ? GetNumSelectedMessages() :
                  ((tab.messageDisplay && gFolderDisplay) ? gFolderDisplay.selectedIndices.length : 0);
                util.logDebugOptional("bookmarks", "selectionCount: " + selectionCount);
                if (selectionCount>=1) { 
                  let selectedMessages;
                  if (util.Application === 'Postbox') {
                    selectedMessages = util.pbGetSelectedMessages();
                  }
                  else {
                    selectedMessages = gFolderDisplay.selectedMessages; 
                  }
                  let uriObjects = [];
                  for (let j=0; j<selectedMessages.length; j++) {
                    let msg = selectedMessages[j];
                    let uriObject = 
                        {url: msg.folder.generateMessageURI(msg.messageKey),
                         label: msg.mime2DecodedSubject.substring(0, 70), 
                         bookmarkType: 'msgUri', 
                         folder:msg.folder}
                    uriObjects.push(uriObject);
                  }
                  return uriObjects;
                }
                // let msg = null;
                // if (tab.folderDisplay) {
                  // msg = tab.folderDisplay.selectedMessage;
                // }
                // else {
                  // if (tab.messageDisplay && tab.messageDisplay.selectedCount==1) {
                    // msg = tab.messageDisplay.displayedMessage;
                  // }
                  // else {
                    // let msgUri = this.alternativeGetSelectedMessageURI (browser);
                    // if (msgUri) {
                      // msg = browser.messenger.messageServiceFromURI(msgUri).messageURIToMsgHdr(msgUri);
                    // }
                  // }
                // }
                // if (!msg) return '';
                // currentURI = msg.folder.generateMessageURI(msg.messageKey) 
                // currentLabel = msg.mime2DecodedSubject.substring(0, 70);
                // currentType = 'msgUri';
                // currentFolder = msg.folder;
              }
              catch(ex) { 
                util.logException("Could not retrieve message from context menu", ex);
                currentURI = "{no message selected}"; 
              };
              break;
            case 'chat':
              currentLabel = tab.title;
              currentURI = '#msg: not yet implemented - chat bookmarks.';
              break;
            default:  // case 'tasks':
              Services.prompt.alert(null, 'QuickFolders.bookmarks - getActiveUri', 'Not supported: bookmarking ' + theMode + ' tab!');
              break;
          }
        }
      }
      /*     GET CONTEXT FROM CURRENT BROWSER  */
      else {
        // https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/tabs_utils
        // Fx
        currentType = 'browser';
        let lB = browser.gBrowser.selectedTab.linkedBrowser;
        // SM:
        let uri = lB.registeredOpenURI || lB.currentURI; // nsIURI
        currentLabel = lB.contentTitle;
        currentURI = uri.spec;  // whole URL including query parameters; there is also asciiSpec and specIgnoringRef
      }
    }
    catch(ex) {
      util.logException("Error retrieving current URL:", ex);
    }

    // Assign the object to pass back
    let uriObject = 
      {url: currentURI,
       label: currentLabel, 
       bookmarkType: currentType, 
       folder: currentFolder};
		return uriObject;
  },
  
  // Update the User Interface (Reading List Menu)
  update: function update() {
    let isActive = this.hasEntries,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface;
    util.logDebug('QuickFolders.bookmarks.update()\n' + 'isActive = ' + isActive);
    // indicate number of messages on the button?
    QI.ReadingListButton.label = 
      isActive ?
      this.Entries.length : '';  
    let btn = util.$('QuickFolders-readingList-reset');
    if (btn) btn.collapsed = !isActive;
  } ,

  readStringFile: function readStringFile() {
    // To read content from file
    const {TextDecoder,OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
    // To read & write content to file
    // const {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});  
    
    let profileDir = OS.Constants.Path.profileDir,
        path = OS.Path.join(profileDir, "extensions", "quickFoldersBookmarks.json"),
        decoder = new TextDecoder(),        // This decoder can be reused for several reads
        promise = OS.File.read(path, { encoding: "utf-8" }); // Read the complete file as an array - returns Uint8Array 
    return promise;
  } ,
  
  readBookmarksFromJson: function readJson(data) {
    let util = QuickFolders.Util,
        bookmarks = QuickFolders.bookmarks,
        entries = JSON.parse(data);  
    util.logDebug ('parsed ' + entries.length + ' entries'); 
    // empty list.
    bookmarks.resetList(false);
    for (let i=0; i<entries.length; i++) {
      let fileEntry = entries[i],
          Entry = {
        Uri: fileEntry.Uri, 
        FolderUri: fileEntry.FolderUri,
        label: fileEntry.label, 
        bookmarkType: fileEntry.bookmarkType || 'msgUri'
      };
        
      // populate the Entries array; fallback to browser bookmark type if undefined
      bookmarks.Entries.push(Entry);
      bookmarks.addMenuItem(Entry);
    }
    // update Menu structure based on content
    bookmarks.update();
  } ,
    
  load: function load() {
    if (this.isDebug) debugger;
    let util = QuickFolders.Util,
        bookmarks = QuickFolders.bookmarks; // "this" didn't work
    util.logDebug ('bookmarks.load...'); 
    if (util.Application == 'Postbox') {
      try {
        let data = this.Postbox_readFile();
        this.readBookmarksFromJson(data);
      }
      catch(ex) {
        util.logException('QuickFolders.bookmarks.load()', ex);
      }
      return;
    }
    
    let promise3;
    try {
      let promise2 = bookmarks.readStringFile().then (
        function onSuccess(data) {
          // populate the bookmarks
          util.logDebug ('readStringFile() - Success'); 
          // bookmarks.clearList(); -- clear menu would be better here.
          bookmarks.readBookmarksFromJson(data);
        },
        function onFailure(ex) {
          util.logDebug ('readStringFile() - Failure: ' + ex); 
          if (ex.becauseNoSuchFile) {
            // File does not exist);
          }
          else {
            // Some other error
            Services.prompt.alert(null, 'QuickFolders - loadCustomMenu', 'Reading the bookmarks file failed\n' + ex);
          }     
          // no changes to Entries array
        }
      );
      
      promise3 = promise2.then(
        function populateMenu() {
          util.logDebug ('populateMenu() ...'); 
          let win = QuickFolders.Util.getMail3PaneWindow(),
              doc = win.document;
          // QuickFolders.populateMenu(doc);
          return promise2; // make loadCustomMenu chainable
        },
        function onFail(ex) {
          util.logDebug ('promise2 onFail():\n' + ex); 
          let win = QuickFolders.Util.getMail3PaneWindow();
          Services.prompt.alert(null, 'QuickFolders - promise2.then', 'Did not load main menu\n' + ex);
          return promise2; // make loadCustomMenu chainable
        }
      );
    }
    catch(ex) {
      util.logException('QuickFolders.bookmarks.load()', ex);
    }
    return promise3;
  } ,

  save: function save()  {
    if (this.isDebug)  debugger;
    let util = QuickFolders.Util;
    util.logDebug("bookmarks.save()...");
    if (util.Application == "Postbox") {
      this.Postbox_writeFile(this);  // pass bookmarks object
      return;
    }
    try {
      const {OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
      let bookmarks = this, // closure this
          profileDir = OS.Constants.Path.profileDir,
          path = OS.Path.join(profileDir, "extensions", "quickFoldersBookmarks.json"),
          backPath = OS.Path.join(profileDir, "extensions", "quickFoldersBookmarks.json.bak"),
          promiseDelete = OS.File.remove(backPath),  // only if it exists
          promiseBackup = promiseDelete.then(
        function () { 
          util.logDebug ('OS.File.move is next...'); 
          OS.File.move(path, backPath); 
        },
        function failedDelete(fileError) { 
          util.logDebug ('OS.File.remove failed for reason:' + fileError); 
          OS.File.move(path, backPath); 
        }
      );

      promiseBackup.then( 
        function backSuccess() {
          let entity = bookmarks.Entries.length ? bookmarks.Entries : '';
          let outString = JSON.stringify(entity, null, '  '); // prettify
          try {
            // let theArray = new Uint8Array(outString);
            let promise = OS.File.writeAtomic(path, outString, { encoding: "utf-8"});
            promise.then(
              function saveSuccess(byteCount) {
                util.logDebug ('successfully saved ' + bookmarks.Entries.length + ' bookmarks [' + byteCount + ' bytes] to file');
              },
              function saveReject(fileError) {  // OS.File.Error
                util.logDebug ('bookmarks.save error:' + fileError);
              }
            );
          }
          catch (ex) {
            util.logException('QuickFolders.bookmarks.save()', ex);
          }
        },
        function backupFailure(fileError) {
          util.logDebug ('promiseBackup error:' + fileError);
        }
      )
    }
    catch(ex) {
      util.logException('QuickFolders.bookmarks.save()', ex);
    }
        
  } ,
  
  Postbox_writeFile: function Pb_writeFile(bookmarks) {
    const Ci = Components.interfaces,
          Cc = Components.classes;
    
    let dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties),
        file = dirService.get("ProfD", Ci.nsILocalFile),
    // stateString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        entity = bookmarks.Entries.length ? bookmarks.Entries : '',
        outString = JSON.stringify(entity, null, '  '); // prettify
    
    file.append("extensions");
    file.append("quickFoldersBookmarks.json");
    // stateString.data = aData;
    // Services.obs.notifyObservers(stateString, "sessionstore-state-write", "");

    // Initialize the file output stream.
    let ostream = Cc["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    ostream.init(file, 
                 0x02 | 0x08 | 0x20,   // write-only,create file, reset if exists
                 0x600,   // read+write permissions
                 ostream.DEFER_OPEN); 

    // Obtain a converter to convert our data to a UTF-8 encoded input stream.
    let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";

    // Asynchronously copy the data to the file.
    let istream = converter.convertToInputStream(outString); // aData
    NetUtil.asyncCopy(istream, ostream, function(rc) {
      if (Components.isSuccessCode(rc)) {
        // Services.obs.notifyObservers(null, "sessionstore-state-write-complete", "");
        // do something for success
      }
    });
  } ,
  
  Postbox_readFile: function Pb_readFile() {
    const Ci = Components.interfaces,
          Cc = Components.classes;
    let dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties),
        file = dirService.get("ProfD", Ci.nsILocalFile);
    file.append("extensions");
    file.append("quickFoldersBookmarks.json");
          
    let fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Ci.nsIFileInputStream);
    fstream.init(file, -1, 0, 0);

    let cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Ci.nsIConverterInputStream);
    cstream.init(fstream, "UTF-8", 0, 0);

    let string  = {};
    cstream.readString(-1, string);
    cstream.close();
    return string.value;    
  }
};
