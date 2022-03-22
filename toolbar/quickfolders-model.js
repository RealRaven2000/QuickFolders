"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

QuickFolders.Model = {
  MAX_UNPAID_TABS: 10,
  MAX_STANDARD_TABS: 25,
  MAX_UNPAID_ICONS: 5,
  MAX_STANDARD_ICONS: 12,
  selectedFolders: [],
  categoriesList: [],
  
  getMsgFolderFromUri:  function getMsgFolderFromUri(uri, checkFolderAttributes) {
    console.error("MX CODE - DON'T USE getMsgFolderFromUri - USE getMsgFolderFromEntry INSTEAD!");
    return  null;
  } ,

  // MX compatible version  
  getMsgFolderFromEntry: async function(entry, checkFolderAttributes) {
    let apiPath = entry.apiPath;
    let realFolder;
    if (!apiPath) return null;
    let parents = await messenger.folders.getParentFolders(entry.apiPath, false);
    if (parents && parents.length) {
      let kids = await messenger.folders.getSubFolders(parents[0], false);
      realFolder = kids.find(x => x.path == apiPath.path);
    }
    else {
      let ac = await messenger.accounts.get(apiPath.accountId, true);
      realFolder = // context.extension.folderManager.get(apiPath.accountId, apiPath.path);
        ac.folders.find(x => x.path == apiPath.path);
    }
    return realFolder;
  } ,
  
  
  
}


