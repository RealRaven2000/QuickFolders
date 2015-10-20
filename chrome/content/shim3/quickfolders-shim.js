// Outdated platform js (for in instead for of)

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