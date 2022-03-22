"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


async function initToolbox() {
  QuickFolders.Util.logToConsole("=--- initToolbox() ---=");
  let mp = document.getElementById("QuickFolders-mainPopup"); // for testing we wire this up with the folder load event
  mp.addEventListener(
    "click",
    async function () { // test
      await QuickFolders.Preferences.initPrefsCache();
      let entries = await QuickFolders.Preferences.loadFolderEntries();
      QuickFolders.initTabsFromEntries(entries); // this on is async, too.
    }
  )
}



initToolbox();