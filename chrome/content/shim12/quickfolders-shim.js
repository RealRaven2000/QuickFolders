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

QuickFolders.Util.generateMRUlist = function generateMRUlist(ftv) { 
  // generateMap: function ftv_recent_generateMap(ftv)
  const util = QuickFolders.Util;
  let oldestTime = 0,
      recent = [],
      items,
      MAXRECENT = QuickFolders.Preferences.getIntPref("recentfolders.itemCount");
  function sorter(a, b) {
    return Number(a.getStringProperty("MRUTime")) < Number(b.getStringProperty("MRUTime"));
  }
  
  function addIfRecent(aFolder) {
    let time;
    try {
      time = Number(aFolder.getStringProperty("MRUTime")) || 0;
    } catch (ex) {return;}
    if (time <= oldestTime)
      return;

    if (recent.length == MAXRECENT) {
      recent.sort(sorter);
      recent.pop();
      let oldestFolder = recent[recent.length - 1];
      oldestTime = Number(oldestFolder.getStringProperty("MRUTime"));
    }
    recent.push(aFolder);
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

    for (let folder of ftv._enumerateFolders)
      addIfRecent(folder);

    recent.sort(sorter);

    items = [new ftvItem(f) for each (f in recent)];
    // There are no children in this view!
    for (let folder of items)
      folder.__defineGetter__("children", function() { return [];});

  }
  catch(ex) {
    util.logException('Exception during generateMRUlist: ', ex);
    return null;
  }

  return items;
}