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

