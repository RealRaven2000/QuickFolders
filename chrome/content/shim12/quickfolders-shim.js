// Modern platform js (for of instead for in)
Components.utils.import("resource://gre/modules/Task.jsm");

QuickFolders.Util.testShim = function testShim() {
  alert('modern platform code');
}

QuickFolders.Util.iterateFolders = function folderIterator(folders, findItem, fnPayload) {
  const util = QuickFolders.Util;
  let found = false;
  // old style iterator (Postbox) - avoid in Thunderbird to avoid warning
  for (let folder of folders) {
    if (folder == findItem) {
      found = true;
      util.logDebugOptional('events','iterateFolders()\nfor..of - found the item and calling payload function(null, folder): ' + folder.prettyName);
      fnPayload(null, folder);
      break;
    }
  }
  return found;
}

  // iterate all folders
  // writable - if this is set, exclude folders that do not accept mail from move/copy (e.g. newsgroups)
QuickFolders.Util.allFoldersIterator = function allFoldersIterator(writable) {
	let Ci = Components.interfaces,
			Cc = Components.classes,
			acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager),
			FoldersArray, allFolders,
			util = QuickFolders.Util;
	
  if (acctMgr.allFolders) { // Thunderbird & modern builds
		FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		allFolders = acctMgr.allFolders;
		for (let aFolder of fixIterator(allFolders, Ci.nsIMsgFolder)) {
			// filter out non-filable folders (newsgroups...)
			if (writable && 
					 (!aFolder.canFileMessages || 
					 (aFolder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSGROUP) ||
					 (aFolder.flags & util.FolderFlags.MSG_FOLDER_FLAG_NEWSHOST))) {
					continue;
			}
			FoldersArray.appendElement(aFolder, false);
		}		       
		return fixIterator(FoldersArray, Ci.nsIMsgFolder);
	}
	else { //old / SeaMonkey?
		/**   ### obsolete code  ###  */
		FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		let accounts = acctMgr.accounts;
		allFolders = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		// accounts will be changed from nsIMutableArray to nsIArray Tb24 (Sm2.17)
		for (let account of fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
			if (account.rootFolder)
				account.rootFolder.ListDescendents(allFolders);
			for (let aFolder of fixIterator(allFolders, Ci.nsIMsgFolder)) {
				FoldersArray.appendElement(aFolder, false);
				if (writable && !folder.canFileMessages) {
					continue;
				}
			}		 
		}	
		return fixIterator(FoldersArray, Ci.nsIMsgFolder);
	}
} 


QuickFolders.Util.generateMRUlist = function qfu_generateMRUlist(ftv) { 
  // generateMap: function ftv_recent_generateMap(ftv)
  const util = QuickFolders.Util,
	      prefs = QuickFolders.Preferences;
  let oldestTime = 0,
      recent = [],
      items = [],
      MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");
  function sorter(a, b) {
    return Number(a.getStringProperty("MRUTime")) < Number(b.getStringProperty("MRUTime"));
  }
  
  function addIfRecent(aFolder) {
    let time = 0;
		if (typeof aFolder.getStringProperty != 'undefined') {
			try {
				time = Number(aFolder.getStringProperty("MRUTime")) || 0;
			} catch (ex) {return;}
			if (time <= oldestTime)
				return 0;
			if (recent.length == MAXRECENT) {
				recent.sort(sorter);
				recent.pop();
				let oldestFolder = recent[recent.length - 1];
				oldestTime = Number(oldestFolder.getStringProperty("MRUTime"));
			}
			recent.push(aFolder);
		}
		return time;
  }

  util.logDebugOptional("interface,recentFolders", "generateMRUlist()");
  try {
    /**
     * Sorts our folders by their recent-times.
     */

    /**
     * This function will add a folder to the recentFolders array if it
     * is among the 15 most recent.  If we exceed 15 folders, it will pop
     * the oldest folder, ensuring that we end up with the right number
     *
     * @param aFolder the folder to check
     */

		let debugTxt = prefs.isDebugOption('recentFolders.detail') ? 'Recent Folders List' : '';
    for (let folder of ftv._enumerateFolders) {
			let t = addIfRecent(folder);
			if (debugTxt) {
				if (t)
					debugTxt += 'ADDED ' + folder.prettyName + ':\ntime = ' + t + ' = ' + util.getMruTime(folder) + '\n';
				else
					debugTxt += 'NOT ADDED: '  + folder.prettyName + '\n';
			}
		}
		if (debugTxt)
			util.logDebug(debugTxt);
      

    recent.sort(sorter);

    // remove legacy syntax:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1220564
		//items = [new ftvItem(f) for each (f in recent)];
		for (let f of recent) { 
		  items.push(new ftvItem(f)) 
	  };
		
    // There are no children in this view! flatten via empty array
    for (let folder of items)
      folder.__defineGetter__("children", function() { return [];});

  }
  catch(ex) {
    util.logException('Exception during generateMRUlist: ', ex);
    return null;
  }

  return items;
}

QuickFolders.Util.getOrCreateFolder = Task.async(function* (aUrl, aFlags) {
		const Ci = Components.interfaces,
		      Cc = Components.classes,
					Cr = Components.results,
          util = QuickFolders.Util,
	        prefs = QuickFolders.Preferences,
					isDebug = prefs.isDebugOption('getOrCreateFolder');
		if (isDebug) logDebug('getOrCreateFolder (' + aUrl + ', ' + aFlags + ')');
    // In theory, we should query our map first to see if we have the folder.
    // However, the way you create a new folder anyways presently requires
    // hitting up the RDF service in the first place, so there's no point trying
    // to force a double-query of the map in this error scenario.
    let rdf = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService),
    // Unlike above, we don't want to catch the exception--it will propagate to
    // a promise rejection.
        folder = rdf.GetResource(aUrl).QueryInterface(Ci.nsIMsgFolder);

		if (isDebug) logDebug('folder = ' + folder);		
    // Now try to ask the server if it has the folder. This will force folder
    // discovery, so if the folder exists, its properties will be properly
    // fleshed out if it didn't exist. This also catches folders on servers
    // that don't exist.
    try {
      folder = folder.server.getMsgFolderFromURI(folder, aUrl);
    } catch (e) {
			if (isDebug) logException('getMsgFolderFromURI ', ex);		
      throw Cr.NS_ERROR_INVALID_ARG;
    }

    // We explicitly do not want to permit root folders here. The purpose of
    // ensuring creation in this manner is to be able to query or manipulate
    // messages in the folder, and root folders don't have that property.
    if (folder.rootFolder == folder) {
			if (isDebug) logDebug('root folder, not allowed');		
      throw Cr.NS_ERROR_INVALID_ARG;
		}

    // Now set the folder flags if we need to.
    if (aFlags)
      folder.setFlag(aFlags);

    // If we are not a valid folder, we need to create the storage to validate
    // the existence of the folder. Unfortunately, the creation code is
    // sometimes synchronous and sometimes asynchronous, so handle that.
    if (folder.parent == null) {
      // Async folder creation is assumed to always succeed even if it exists.
      // Presumably, the same could apply for local message folders.
      let isAsync = folder.server.protocolInfo.foldersCreatedAsync,
          needToCreate = isAsync || !folder.filePath.exists();
					
			if (isDebug) logDebug('no folder parent. needToCreate = ' + needToCreate + ' async = ' + isAsync);		
					
      if (needToCreate) {
				// throws PromiseUtils not defined
				Components.utils.import("resource://gre/modules/PromiseUtils.jsm");
        let deferred = PromiseUtils.defer();
        let listener = {
          OnStartRunningUrl(url) {},
          OnStopRunningUrl(url, aExitCode) {
            if (aExitCode == Cr.NS_OK)
              deferred.resolve();
            else
              deferred.reject(aExitCode);
          },
          QueryInterface: XPCOMUtils.generateQI([Ci.nsIUrlListener])
        };

        // If any error happens, it will throw--causing the outer promise to
        // reject.
				if (isDebug) logDebug('folder.createStorageIfMissing()...');		
        folder.createStorageIfMissing(isAsync ? listener : null);
        if (!isAsync || !needToCreate)
          deferred.resolve();
        yield deferred.promise;
      }
    }

    if (folder.parent == null || folder.rootFolder == folder) {
			if (isDebug) logDebug('unexpected: no folder.parent or folder is its own root');		
      throw Cr.NS_ERROR_UNEXPECTED;
    }

    // Finally, we have a valid folder. Return it.
    return folder;
  }) ;
	
