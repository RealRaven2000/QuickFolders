// Modern platform js (for of instead for in)

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

QuickFolders.Util.iterateDictionary = function iterateKeys(dictionary, iterateFunction) {
	for (let [key, value] of dictionary.items) {
		iterateFunction(key,value);
	}
};

QuickFolders.Util.iterateDictionaryObject = function iterateKeysO(dictionary, iterateFunction, obj) {
	for (let [key, value] of dictionary.items) {
		iterateFunction(key,value,obj);
	}
};

QuickFolders.Util.allFoldersMatch = function allFoldersMatch(isFiling, isParentMatch, parentString, maxParentLevel, parents, addMatchingFolder, matches) {
	for (let folder of QuickFolders.Util.allFoldersIterator(isFiling)) {
		if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
		addMatchingFolder(matches, folder);
	}
};

Object.defineProperty(QuickFolders.Util, "Accounts",
{ get: function() {
    const Ci = Components.interfaces,
		      Cc = Components.classes;
    let util = QuickFolders.Util, 
        aAccounts=[];
    if (util.Application == 'Postbox') 
      aAccounts = util.getAccountsPostbox();
    else {
			let accounts = Cc["@mozilla.org/messenger/account-manager;1"]
				           .getService(Ci.nsIMsgAccountManager).accounts;
      aAccounts = [];
      for (let ac of fixIterator(accounts, Ci.nsIMsgAccount)) {
        aAccounts.push(ac);
      };
    }
    return aAccounts;
  }
});


