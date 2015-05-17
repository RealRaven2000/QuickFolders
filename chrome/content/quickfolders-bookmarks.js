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
  get document() {
    return QuickFolders.doc;
  },
  get hasEntries() {
    return (this.Entries.length > 0); // QuickFolders.readingListUris
  },
  indexOfEntry: function indexOfEntry(URI) {
    for (let i=0; i<this.Entries.length; i++) {
      if (this.Entries[i].Uri == URI)
        return i;
    }
    return -1;
  },
  
  onClick: function onClickBookmark(menuItem, evt, entry) {
    let util = QuickFolders.Util;
    evt.stopPropagation();
    switch(evt.button) {
      case 0: // left button
        QuickFolders.Util.openMessageTabFromUri(entry.Uri);
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
    while (this.Entries.length) {  // QuickFolders.readingListUris
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
  
  add: function add(newUri, sourceFolder)  {
    if (this.indexOfEntry(newUri) == -1) { // avoid duplicates!
      let util = QuickFolders.Util,
          chevron = ' ' + "\u00BB".toString() + ' ',
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
              bookmarkType:'msgUri'
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
    alert('to do: Add Current Mail / content tab\n'
          + 'If in a single message tab, simply drag the "mail icon" from the left of current folder bar instead.');
  } ,
  
  // Update the User Interface (Reading List Menu)
  update: function update() {
    let isActive = this.hasEntries,
        util = QuickFolders.Util,
        QI = QuickFolders.Interface;
    QI.isMoveActive = isActive; 
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
      let fileEntry = entries[i];
      let Entry = {
        Uri:fileEntry.Uri, 
        FolderUri:fileEntry.FolderUri,
        label:fileEntry.label, 
        bookmarkType:fileEntry.bookmarkType ? fileEntry.bookmarkType : 'msgUri'
      };
        
      // populate the Entries array; fallback to browser bookmark type if undefined
      bookmarks.Entries.push(Entry);
      bookmarks.addMenuItem(Entry);
    }
    // update Menu structure based on content
    bookmarks.update();
  } ,
    
  load: function load() {
    if (QuickFolders.Preferences.isDebug) debugger;
    let util = QuickFolders.Util,
        bookmarks = QuickFolders.bookmarks; // "this" didn't work
    util.logDebug ('bookmarks.load...'); 
    if (util.Application == 'Postbox') {
      let data = this.Postbox_readFile();
      this.readBookmarksFromJson(data);
      return;
    }
    
    let promise3;
    try {
      let promise2 = bookmarks.readStringFile().then (
        function onSuccess(data) {
          // populate the bookmarks
          util.logDebug ('readStringFile() - Success'); 
          if (QuickFolders.Preferences.isDebug) debugger;
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
          QuickFolders.populateMenu(doc);
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
    if (QuickFolders.Preferences.isDebug) debugger;
    let util = QuickFolders.Util;
    util.logDebug("bookmarks.save()...");
    if (util.Application == "Postbox") {
      this.Postbox_writeFile(this);  // pass bookmarks object
      return;
    }
    try {
      const {OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
      if (QuickFolders.Preferences.isDebug) debugger;
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
