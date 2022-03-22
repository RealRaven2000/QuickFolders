"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

var QuickFolders = {
  initTabsFromEntries: async function initTabsFromEntries(folderEntries) {
    const util = QuickFolders.Util,
					QI = QuickFolders.Interface; // main window Interface!
		
    util.logDebug("initTabsFromEntries()");
		if (folderEntries.length) try {
			let currentFolder = await util.getCurrentFolder(); // REPLACE CurrentFolder!
			QuickFolders.Model.selectedFolders = folderEntries;  // that.Model
			QuickFolders.Interface.updateUserStyles();

      debugger;
			let tab = await browser.tabs.getCurrent(),
          tabMode = tab ? tab.type : ""; 
			if (tab) {
				// is this a new Thunderbird window?
				let cats;
				if (typeof (tab.QuickFoldersCategory) == 'undefined') {
					let lc = QuickFolders.Preferences.lastActiveCats;
					// if (currentFolder) {
						// select first (or all?) category of any tab referencing this folder
						// if there is an originating window, try to inherit the categories from the last one
						if (lc) 
							cats = lc;
						else
							cats = QuickFolders.FolderCategory.ALL; // retrieve list!
					// }
				}
				else
				  cats = tab.QuickFoldersCategory;
				
				util.logDebug("init: setting categories to " + cats);
				if (tabMode == "folder" || tabMode == "message") {
					// restore categories of first tab; set to "all" if not set
					QuickFolders.Interface.currentActiveCategories = cats;
				}
			}
			else {
				util.logDebug('init: could not retrieve tab / tabMode\n tab=' + tab);
      }
				
		}
		catch(ex) {
			util.logException('init: folderEntries', ex);
		}
    finally {
      QuickFolders.Interface.updateMainWindow(false);
      // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: false }); 
      // selectCategory already called updateFolders!  was that.Interface.updateFolders(true,false)
      // make sure tabs not in active category are hidden - this at least doesn't happen if we load the extension from the debugging tab
      if (QuickFolders.Interface.currentActiveCategories) {
        util.logDebugOptional('categories', "forcing selectCategory");
        let bkCat = QuickFolders.Interface.currentActiveCategories; // force redraw by deleting it
        QuickFolders.Interface._selectedCategories = null;
        QuickFolders.Interface.selectCategory(bkCat);
      }
    }
	},

}

