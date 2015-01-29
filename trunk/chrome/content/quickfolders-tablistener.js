"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

///// tab listener watches tabmail
QuickFolders.TabListener = {
  select: function(evt){
    try {
      if (QuickFolders) {
        let util = QuickFolders.Util;
        let QI = QuickFolders.Interface;
        // restore the category
        let tabmail = document.getElementById("tabmail");
        let idx = QuickFolders.tabContainer.selectedIndex;
        idx = idx ? idx : 0;
        util.logDebugOptional("listeners.tabmail", "TabListener.select() - tab index = " + idx);
				let tabs = tabmail.tabInfo ? tabmail.tabInfo : tabmail.tabOwners; // Pb: tabOwners
        let info = util.getTabInfoByIndex(tabmail, idx);  // tabs[idx]
				if (!info)
					return;
        if (info.QuickFoldersCategory) {
          util.logDebugOptional("listeners.tabmail", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
          let isFolderUpdated = QI.selectCategory(info.QuickFoldersCategory, false);
          QI.updateCategories();
					// do not select folder if selectCategory had to be done
          if (!isFolderUpdated)
            QI.setFolderSelectTimer();	
        }
        // Do not switch to current folder's category, if current tab has another selected!
        else {
          // there is no need for this if it is not a mail tab.
					let tabMode = util.getTabModeName(info);
          if (tabMode) { 
            util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode);
            if (tabMode == util.mailFolderTypeName || tabMode == "message") {
              QI.setTabSelectTimer();
            }
            else {
              // we should initialize the (navigation) buttons on CurrentFolderTab in case this is a search folder?
              QI.initCurrentFolderTab(QI.CurrentFolderTab, null, null, info);
            }
          }
        }
        // for non-folder tabs: reset lastTabSelected to force refresh of current folder 
        // when we go back to a folder tab
        if (util.getTabModeName(info) != util.mailFolderTypeName)
          QI.lastTabSelected = null;
        
      }
    }
    catch(e) {QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected: " + e)};
  },
  
  closeTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    let idx = QuickFolders.tabContainer.selectedIndex;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.closeTab() - idx = " + idx);
  } ,
  
  newTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    let idx = QuickFolders.tabContainer.selectedIndex;
    idx = idx ? idx : 0;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.newTab()  - idx = " + idx);
  } ,
  
  moveTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    let idx = QuickFolders.tabContainer.selectedIndex;
    idx = idx ? idx : 0;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.moveTab()  - idx = " + idx);
  } 
}
