// Outdated platform js (for in instead for of)
// compatibility fixes for Task.async
// Components.utils.import('chrome://quickfolders/content/Task.jsm');

QuickFolders.Util.iterateFolders = function folderIterator(folders, findItem, fnPayload) {
  let found = false;
  for each (let folder in folders) {
    if (folder == findItem) {
      found = true;
      QuickFolders.Util.logDebugOptional('events','SHIM iterateFolders()\nfor..each - found the item and calling payload function(null, folder): ' + folder.prettyName);
      fnPayload(null, folder);
      break;
    }
  }
  return found;
}

QuickFolders.Util.allFoldersIterator = function allFoldersIterator(writable) {
	let Ci = Components.interfaces,
			Cc = Components.classes,
			acctMgr = Cc["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager),
			FoldersArray, allFolders,
			util = QuickFolders.Util;
	
	if (util.Application == 'Postbox') {
		FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		let servers = acctMgr.allServers;
		for (let i = 0; i < servers.Count(); i++)
		{
			let server = servers.QueryElementAt(i, Ci.nsIMsgIncomingServer),
					rootFolder = server.rootFolder;
			allFolders = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
			rootFolder.ListDescendents(allFolders);
			let numFolders = allFolders.Count();

			for (let folderIndex = 0; folderIndex < numFolders; folderIndex++)
			{
				let folder = allFolders.GetElementAt(folderIndex).QueryInterface(Ci.nsIMsgFolder);
				if (writable && !folder.canFileMessages) {
					continue;
				}
				FoldersArray.appendElement(folder, false);
			}
		}        
		return FoldersArray; // , Ci.nsIMsgFolder - can't return the fixIterator??
	}
	else if (acctMgr.allFolders) { // Thunderbird & modern builds
		FoldersArray = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
		allFolders = acctMgr.allFolders;
		for each (let aFolder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
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
		for (let account in fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
			if (account.rootFolder)
				account.rootFolder.ListDescendents(allFolders);
			for each (let aFolder in fixIterator(allFolders, Ci.nsIMsgFolder)) {
				FoldersArray.appendElement(aFolder, false);
				if (writable && !folder.canFileMessages) {
					continue;
				}
			}		 
		}	
		return fixIterator(FoldersArray, Ci.nsIMsgFolder);
	}
} 

QuickFolders.Util.getNextUnreadFolder = function getNextUnreadFolder(currentFolder) {
	const util = QuickFolders.Util,
				unwantedFolders = util.FolderFlags.MSG_FOLDER_FLAG_DRAFTS   // skip drafts
					                   | util.FolderFlags.MSG_FOLDER_FLAG_TRASH // skip trash
					                   | util.FolderFlags.MSG_FOLDER_FLAG_QUEUE // skip queue
					                   | util.FolderFlags.MSG_FOLDER_FLAG_JUNK; // skip spam
	let found = false,
	    isUnread = false,
		  lastFolder,
			folder,
			firstUnread = null; // remember this one for turnaround!
		// progress the folder variable to the next sibling
		// if no next sibling available to next sibling of parent folder (recursive)
		// question: should own child folders also be included?
		
	let AF = util.allFoldersIterator(false);
  for (let fi=0; fi<AF.length; fi++) {
		folder = AF.queryElementAt(fi,Components.interfaces.nsIMsgFolder);
		let unreadCount = (typeof folder.getNumUnread=='undefined') ? 0 : folder.getNumUnread(false);
		if (!found && !firstUnread) {
			// get first unread folder (before current folder)
			if (unreadCount && !(folder.flags & unwantedFolders)) {
				firstUnread = folder; // remember the first unread folder before we hit current folder
				util.logDebugOptional("navigation", "first unread folder: " + firstUnread.prettyName);
			}
		}
		if (found) {
			// after current folder: unread folders only
			if (unreadCount && !(folder.flags & unwantedFolders)) {
				isUnread = true;
				util.logDebugOptional("navigation", "Arrived in next unread after found current: " + folder.prettyName);
				break; // if we have skipped the folder in the iterator and it has unread items we are in the next unread folder
			}
		} 
		if (folder.URI === currentFolder.URI) {
			util.logDebugOptional("navigation", "Arrived in current folder. ");
			found = true; // found current folder
		}
		lastFolder = folder;
	}
	if (!isUnread) {
		if (firstUnread && firstUnread!=currentFolder) {
			util.logDebugOptional("navigation", "no folder found. ");
			return firstUnread;
		}
		util.logDebug("Could not find another unread folder after:" + lastFolder ? lastFolder.URI : currentFolder.URI);
		return currentFolder;
	}
	return folder;
}


QuickFolders.Util.iterateDictionary = function iterateKeys(dictionary, iterateFunction) {
	for (let [key, value] in dictionary.items) {
		iterateFunction(key,value);
	}
};

QuickFolders.Util.iterateDictionaryObject = function iterateKeysO(dictionary, iterateFunction, obj) {
	for (let [key, value] in dictionary.items) {
		iterateFunction(key,value,obj);
	}
};

QuickFolders.Util.allFoldersMatch = function allFoldersMatch(isFiling, isParentMatch, parentString, maxParentLevel, parents, addMatchingFolder, matches) {
	const util = QuickFolders.Util;
	util.logDebugOptional("interface.findFolder","shim12 / allFoldersMatch()");
	for (let folder in util.allFoldersIterator(isFiling)) {
		if (!isParentMatch(folder, parentString, maxParentLevel, parents)) continue;
		addMatchingFolder(matches, folder);
	}
};


if (QuickFolders.Util.Application == 'Postbox' && QuickFolders.Util.PlatformVersion<52) {
	QuickFolders.Util.Accounts = QuickFolders.Util.getAccountsPostbox();
}
else
	Object.defineProperty(QuickFolders.Util, "Accounts",
{ get: function() {
    const Ci = Components.interfaces,
		      Cc = Components.classes;
    let util = QuickFolders.Util, 
        aAccounts=[],
		    accounts = Cc["@mozilla.org/messenger/account-manager;1"]
								 .getService(Ci.nsIMsgAccountManager).accounts;
		aAccounts = [];
		for (let ac in fixIterator(accounts, Ci.nsIMsgAccount)) {
			aAccounts.push(ac);
		};
    return aAccounts;
  }
});




