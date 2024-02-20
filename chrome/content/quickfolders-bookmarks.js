"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
//QuickFolders.Util.logDebug('Defining QuickFolders.bookmarks...');
var { MailUtils } = ChromeUtils.import("resource:///modules/MailUtils.jsm");
var {MailServices} = ChromeUtils.import("resource:///modules/MailServices.jsm");


// drop target - persistable "reading list"
QuickFolders.bookmarks = {
  Entries: [],  // { Uri , Folder , label? }
  charset: "UTF-8",
  dirty: false,     // force update (rload + rebuild menu) after removing invalid item
  get isDebug() {
    return (QuickFolders.Preferences.isDebugOption('bookmarks'));
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
    // note: we can't use nsMsgFolderFlags, Postbox doesn't know it!
    const Ci = Components.interfaces,
          Cc = Components.classes,
          nsMsgSearchScope = Ci.nsMsgSearchScope,
          nsMsgSearchAttrib = Ci.nsMsgSearchAttrib,
          nsMsgSearchOp = Ci.nsMsgSearchOp;
    function setTermValue(term, attr, op, valStr) {
      let val = term.value;
      term.attrib = attr;
      val.attrib = attr;
      if (attr == nsMsgSearchAttrib.Date)
        val.date = valStr;
      else
        val.str = valStr;
      term.op = op;
      term.value = val; // copy back object.
      term.booleanAnd = true;
      term.matchAll = false; // make sure "and" is selected in search box
    }
	  function _getEmailAddress(a) {
			return a.replace(/.*<(\S+)>.*/g, "$1");
		}    
    let getFolder = QuickFolders.Model.getMsgFolderFromUri,
        folder = getFolder(entry.FolderUri) || QuickFolders.Util.CurrentFolder, // [issue 265] fallback
        util = QuickFolders.Util,
        searchSession = Cc["@mozilla.org/messenger/searchSession;1"].createInstance(Ci.nsIMsgSearchSession),
        searchTerms = [],
        offlineScope = nsMsgSearchScope.onlineManual,
        serverScope = null,
        preferredUri = QuickFolders.Preferences.getStringPref('bookmarks.searchUri'),
        preferredStartFolder = preferredUri ? getFolder(preferredUri) : null;

    // [issue 265] make sure it works if no valid folder can be found
    if (folder)    {
      offlineScope = (folder.flags & util.FolderFlags.MSG_FOLDER_FLAG_OFFLINE) ? nsMsgSearchScope.offlineMail : nsMsgSearchScope.onlineManual;
      serverScope = (folder.server ? folder.server.searchScope : null);
    }
    let targetFolder = (preferredUri ? getFolder(preferredUri) : null)  // preferred start point for finding missing emails. could be localhost.
                       ||               
                       (folder ? (folder.server ? folder.server.rootFolder : folder) : null);
    util.logDebug("Search messages @ folder URI: " + targetFolder.URI + " … ");
    searchSession.addScopeTerm(serverScope, targetFolder);
    
    let realTerm = searchSession.createTerm(),
        subj = entry.subject || entry.label.substring(entry.label.indexOf(':')+1, entry.label.lastIndexOf('-')),
        ellipsis = subj.indexOf("\u2026".toString());
    if (ellipsis>5 && ellipsis>=subj.length-2)
      subj = subj.substr(0, ellipsis);
    setTermValue(realTerm,
                 nsMsgSearchAttrib.Subject,
                 nsMsgSearchOp.Contains,
                 subj.trim())
    searchTerms.push(realTerm);
    if (entry.author) {
        realTerm = searchSession.createTerm();
        let em = _getEmailAddress(entry.author);
        em = em || author;
        setTermValue(realTerm,
                     nsMsgSearchAttrib.Sender,
                     nsMsgSearchOp.Contains,
                     em);
        searchTerms.push(realTerm);
    }
    if (entry.date) {
        realTerm = searchSession.createTerm();
        setTermValue(realTerm,
                     nsMsgSearchAttrib.Date,
                     nsMsgSearchOp.Is,
                     entry.date);
        searchTerms.push(realTerm);
    }
    window.openDialog("chrome://messenger/content/SearchDialog.xhtml", "_blank",
                      "chrome,resizable,status,centerscreen,dialog=no",
                      { folder: targetFolder, searchTerms: searchTerms, searchSession: searchSession });          
  },
  
  openMessage: function (entry, forceMethod)  {
    let util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
        method = forceMethod || prefs.getStringPref('bookmarks.openMethod'),
        msgHdr;
    try {
      msgHdr = MailServices.messageServiceFromURI(entry.Uri).messageURIToMsgHdr(entry.Uri);
      if (!msgHdr) return false;
      if ((msgHdr.messageId.toString() + msgHdr.author + msgHdr.subject) == '' 
          && msgHdr.messageSize==0) // invalid message
        return false;
    }
    catch(ex) {
      util.logException('bookmarks.openMessage',ex);
      return false;
    }
    try {
      switch (method) {
        case 'currentTab':
          let mode = QuickFolders.Interface.CurrentTabMode,
              isInTab = (mode == "mail3PaneTab" || mode == "folder");
					
          // [Bug 26481] make sure to switch to another tab if that folder is open:
          if (util.CurrentFolder!=msgHdr.folder)
            QuickFolders_MySelectFolder(msgHdr.folder.URI);
          MailUtils.displayMessageInFolderTab(msgHdr);
          return true;
        case 'window':
          if (msgHdr) {
            MailUtils.openMessageInNewWindow(msgHdr);
            return true;
          }
          break;
        default:
          util.logDebug('Unknown bookmarks.open.method: {' + method + '}'); 
          // fall through
        case 'newTab':
          return util.openMessageTabFromUri(entry.Uri);
      } // switch method
    }
    catch(ex) {
      util.logException('bookmarks.openMessage',ex);
    }
      
    return false;
  },
  
  onClick: function onClickBookmark(menuItem, evt, entry) {
    let util = QuickFolders.Util,
        prefs = QuickFolders.Preferences,
		    isAlt = evt.altKey,
		    isCtrl = evt.ctrlKey,
		    isShift = evt.shiftKey;  
    evt.stopPropagation();
    switch(evt.button) {
      case 0: // left-click
        let method = null;
        // default will be user configured.
        if (isShift) 
          method = 'window';
        if (isCtrl) {
          method = (prefs.getStringPref('bookmarks.openMethod')=='newTab') ?
                   'currentTab' : 'newTab' ; // accelerator toggles method
        }
          
        if (!this.openMessage(entry, method)) {
          entry.invalid = true; // make sure this propagates to this.Entries!
					menuItem.classList.add('invalid');
          util.logDebug("Invalid Uri - couldn't open message tab from: " + entry.Uri);
          let text = util.getBundleString("qf.prompt.readingList.searchMissingItem"),
              search = Services.prompt.confirm(window, "QuickFolders", text.replace("{1}", entry.label));
          if (search) {
            this.findBookmark(entry);
          }
        }
        break;
      case 2: // right-click
        // remove item!
        let question = util.getBundleString("qf.prompt.readingList.removeItem");
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
  
  // removes all bookmarks from reading list. retain command items.
  tearDownMenu: function tearDownMenu() {
    let menu = QuickFolders.Util.$('QuickFolders-readingListMenu');
    for (let i = menu.children.length-1; i>0; i--) {
      let item = menu.children[i];
      if (!item.classList.contains('cmd') || item.tagName=='menuseparator')
        menu.removeChild(item);
    }
  } , 
  
  resetList: function resetList(isSave) {
    let util = QuickFolders.Util;
    util.logDebug ('bookmarks.resetList()'); 
    while (this.Entries.length) {  
      this.Entries.pop();
    }
    this.tearDownMenu();
    this.update();
    if (isSave)
      this.save();
  },  
  
  addMenuItem: function addMenuItem(entry) {
    let util = QuickFolders.Util,
        menu = util.$('QuickFolders-readingListMenu'),
        menuitem = document.createXULElement ? document.createXULElement("menuitem") : document.createElement("menuitem");
    if (this.Entries.length==1)
      menu.appendChild(document.createXULElement ? document.createXULElement("menuseparator") : document.createElement("menuseparator"));
    menuitem.setAttribute("label", entry.label);
    menuitem.className = 'msgUri menuitem-iconic';
    if (entry.invalid) menuitem.classList.add('invalid');
    menuitem.addEventListener("click", function(event) { 
      QuickFolders.bookmarks.onClick(event.target, event, entry); return false; }, false);
    menu.appendChild(menuitem);
  },
  
  // has the item been added before from a different folder uri? (mail was moved)
  findMovedMatch: function findMovedMatch(entry) {
    try {
      if (entry.bookmarkType=='msgUri') {
        for (let i=0; i<this.Entries.length; i++) {
          let e = this.Entries[i];
          if (entry.subject == e.subject
              &&
              entry.author == e.author
              &&
              entry.date == e.date
              && 
              entry.Uri != e.Uri) {
            return i;
          }
        }
      }
    }
    catch(e) {;}
    return -1;
  } ,

  addMail: function addMail(newUri, sourceFolder)  {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences,
          countEntries = this.Entries.length,
          isStandardLicense = util.hasStandardLicense();
    
    let MAX_BOOKMARKS = isStandardLicense ? 10 : 5;
          
    if (util.hasValidLicense() && !isStandardLicense) MAX_BOOKMARKS = 100000;
    
    if (countEntries>=MAX_BOOKMARKS-2) {
      let licenseType = isStandardLicense ? "standard" : "premium";
      let text = util.getBundleString(`qf.notification.${licenseType}.readingList`);
      util.popupRestrictedFeature("bookmarks", text.replace("{1}", countEntries).replace("{2}", MAX_BOOKMARKS.toString()));
      // early exit if no license key and maximum icon number is reached
      if (countEntries >= MAX_BOOKMARKS)
        return false;
    }
    
    if (countEntries >= prefs.getIntPref('bookmarks.maxEntries')) {
      util.logToConsole('Maximum number of bookmarks reached! You can change this via right-click on the Reading List checkbox in QuickFolders Options / General / Main Toolbar Elements.');
      return false;
    }
    
    if (this.indexOfEntry(newUri) == -1) { // avoid duplicates!
      let chevron = ' ' + "\u00BB".toString() + ' ',
          showFolder = prefs.getBoolPref('bookmarks.folderLabel'),
          hdr = MailServices.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label = util.getFriendlyMessageLabel(hdr);
          if (showFolder && sourceFolder) {
            label = sourceFolder.prettyName + chevron + label;
          }
          let entry = 
            { 
              Uri:newUri, 
              FolderUri: sourceFolder.URI, 
              label: label, 
              bookmarkType:'msgUri',
              subject: hdr.mime2DecodedSubject,
              author: hdr.author,
              date: hdr.date
            }
          let existing = this.findMovedMatch(entry);
          /* add to Entries */
          this.Entries.push(entry);
          // now add to menu!
          this.addMenuItem(entry);
          if (existing>=0) {
            this.removeUri(existing);
            this.dirty = true;
          }
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
    let i = (typeof URI=='string') ? this.indexOfEntry(URI) : URI;  // allow passing in index
    if (i>=0) {
      this.Entries.splice(i, 1);
    }
  },
  
  addCurrent: function addCurrent() {
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
    
    util.logDebugOptional("bookmarks", "Adding + " + uris.length + " bookmarks…");
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
          let msg = util.getBundleString("qf.alert.bookmarks.unsupportedType", uriObject.bookmarkType);
          util.alert(msg.replace("{NewLine}","\n"));
          return;
      }
      if (earlyExit) break;
    }
    
    this.persist(); // save + update UI
  } ,
  
  persist: function persist() {
    this.update(); // update UI
    this.save();   // persist to file
    if (this.dirty) {
      // recreate the UI
      this.tearDownMenu();
      for (let i=0; i<this.Entries.length; i++) {
        this.addMenuItem(this.Entries[i]);
      }
      this.dirty = false;
    }
  } ,
  
  getBrowser: function getBrowser() {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
					util = QuickFolders.Util,
					interfaceType = Ci.nsIDOMWindow;
    let browsers = null,
        DomWindow = null,
        theBrowser = null;

    try{
      let getWindowEnumerator = Services.wm.getEnumerator;
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
        if (!browsers || !browsers.hasMoreElements())
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
            DomWindow = getBrowser();  // Linux last resort
          }
        }
        catch(ex) {
          util.logException("getBrowser() failed:", ex);
        }
      }      
    }
    catch (ex) {
      util.logException("getBrowser() failed:", ex);
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
  
  getActiveUri: function() {
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
      /*     GET CONTEXT FROM CURRENT MAIL TAB  */
      if (!isOriginBrowser) {
        if (tabmail) {
          let tab = tabmail.selectedTab,  
              theMode = tab.mode ? tab.mode.name : tab.getAttribute("type");
          if (!browser)
            browser = tab.browser;
          if (theMode == "mail3PaneTab") {
            // if we are in folder mode we might have a message selected
            // if (tab.folderDisplay && tab.folderDisplay.focusedPane && tab.folderDisplay.focusedPane.id =='threadTree') {
              theMode = "message"; // mailMessageTab - single tab
            // }
          }
          
          currentType = theMode;
          util.logDebugOptional("bookmarks", "bookmarks.getActiveUri() - Selected Tab Type: " + theMode);
          switch (theMode) {
            case "mail3PaneTab":
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
            case 'message':            // fall through => type = msgUri (special mode by me)
            case 'mailMessageTab':     // Tb 115
              // find out about currently viewed message
              try {
                // are multiple mails selected?
                let selectedMessageUris = [] ; 
                let selectedMessages = quickFilters.Util.getSelectedMessages(selectedMessageUris);
                let selectionCount = selectedMessages.length;

                util.logDebugOptional("bookmarks", "selectionCount: " + selectionCount);
                if (selectionCount>=1) { 
                  let uriObjects = [];
                  for (let j=0; j<selectedMessages.length; j++) {
                    let msg = selectedMessages[j];
                    uriObjects.push(
                      {
                        url: selectedMessageUris[j] , // msg.folder.generateMessageURI(msg.messageKey)
                        label: msg.mime2DecodedSubject.substring(0, 70), 
                        bookmarkType: 'msgUri', 
                        folder:msg.folder,
                        threadId: msg.threadId,
                        threadParent: msg.threadParent
                      }
                    );
                  }
                  return uriObjects;
                }
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
  
  // Update the User Interface (Reading List Menu: context items only)
  // the list itself is only rebuilt when calling load() or setting dirty=true and calling persist()
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

  readStringFile: async function readStringFile() {
    let profileDir = PathUtils.profileDir,
        path = PathUtils.join(profileDir, "extensions", "quickFoldersBookmarks.json");
    if (!(await IOUtils.exists(path))) return null;
    let data = await IOUtils.readJSON(path, { encoding: "utf-8" }); // Read the complete file as an array - returns Uint8Array 
    return data;
  } ,
  
  readBookmarksFromJson: function readJson(data) {
    let util = QuickFolders.Util,
        bookmarks = QuickFolders.bookmarks,
        entries = data;
    util.logDebug ('parsed ' + entries.length + ' entries'); 
    // empty list.
    bookmarks.resetList(false);
    for (let i=0; i<entries.length; i++) {
      let fileEntry = entries[i];
      // lets forget about SANITIZING as this completely narrows us down. trust the file instead
      // note the labels are currently created when ADDING a bookmark and then simply stored
      // we need a separate method for regenerating the labels from the info we haVE:
      // 1 - entry.FolderUri => msgHeader.prettyName  (fallback to "unknown") + chevron
      // 2 - entry.author
      // 2 - entry.subject.substr()...
      // 3 - entry.date
      //     let label = util.getFriendlyMessageLabel(hdr);
      //     if (showFolder && sourceFolder)
      //       label = sourceFolder.prettyName + chevron + label;

      /*
          Entry = {
            Uri: fileEntry.Uri, 
            FolderUri: fileEntry.FolderUri,
            label: fileEntry.label, 
            bookmarkType: fileEntry.bookmarkType || 'msgUri'
          };
      */
      // if the type is undefined we assume this is a mail bookmark (as we are in a mail client)
      if (!fileEntry.bookmarkType)
        fileEntry.bookmarkType = 'msgUri';
      bookmarks.Entries.push(fileEntry);
      bookmarks.addMenuItem(fileEntry);
    }
    // update Menu structure based on content
    bookmarks.update();
  } ,
    
  load: async function load() {
    let util = QuickFolders.Util,
        bookmarks = QuickFolders.bookmarks; 
    util.logDebug ('bookmarks.load…'); 
    try {
      let data = await bookmarks.readStringFile();
      if (data) {
        // populate the bookmarks
        util.logDebug ("readStringFile() - Success"); 
        bookmarks.readBookmarksFromJson(data);
      } else {
        util.logDebug ("readStringFile() - no data - file doesn't exist"); 
      }
      return true;
    } catch(ex) {
      if (ex.becauseNoSuchFile) {
        // File does not exist);
        util.logDebug ("readStringFile() - exception.becauseNoSuchFile"); 
      }
      else {
        // Some other error
        Services.prompt.alert(null, 'QuickFolders - loadCustomMenu', 'Reading the bookmarks file failed\n' + ex);
        // no changes to Entries array
        util.logException('bookmarks.load()', ex);
      }     
    }
    return false;
  } ,

  save: function save()  {
    let util = QuickFolders.Util;
    util.logDebug("bookmarks.save()…");
    try {
      let bookmarks = this, // closure this
          profileDir = PathUtils.profileDir,
          path = PathUtils.join(profileDir, "extensions", "quickFoldersBookmarks.json"),
          backPath = PathUtils.join(profileDir, "extensions", "quickFoldersBookmarks.json.bak"),
          promiseDelete = IOUtils.remove(backPath),  // only if it exists
          promiseBackup = promiseDelete.then(
        function () { 
          util.logDebug ('Backup - IOUtils.move is next…'); 
          IOUtils.move(path, backPath); 
        },
        function failedDelete(fileError) { 
          util.logDebug ('IOUtils.remove failed for reason: ' + fileError); 
          IOUtils.move(path, backPath); 
        }
      );

      promiseBackup.then( 
        function backSuccess() {
          let entity = bookmarks.Entries.length ? bookmarks.Entries : '';
          let outString = JSON.stringify(entity, null, '  '); // prettify
          try {
            // let theArray = new Uint8Array(outString);
            let promise = IOUtils.writeUTF8(path, outString);
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
        
  }
  
  
};
