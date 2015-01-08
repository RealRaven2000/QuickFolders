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
        // restore the category
        let tabmail = document.getElementById("tabmail");
        let idx = QuickFolders.tabContainer.selectedIndex;
        idx = idx ? idx : 0;
        QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.select() - tab index = " + idx);
				let tabs = tabmail.tabInfo ? tabmail.tabInfo : tabmail.tabOwners; // Pb: tabOwners
        let info = QuickFolders.Util.getTabInfoByIndex(tabmail, idx);  // tabs[idx]
				if (!info)
					return;
        if (info.QuickFoldersCategory) {
          QuickFolders.Util.logDebugOptional("listeners.tabmail", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
          QuickFolders.Interface.selectCategory(info.QuickFoldersCategory, false);
          let isFolderUpdated = QuickFolders.Interface.updateCategories();
					// do not select folder if selectCategory had to be done
          if (!isFolderUpdated)
            QuickFolders.Interface.setFolderSelectTimer();					
        }
        // Do not switch to current folder's category, if current tab has another selected!
        else {
          // there is no need for this if it is not a mail tab.
					let tabMode = QuickFolders.Util.getTabModeName(info);
          if (tabMode) { 
            QuickFolders.Util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode);
            if (tabMode == QuickFolders.Util.mailFolderTypeName || tabMode == "message") {
              QuickFolders.Interface.setTabSelectTimer();
            }
            else {
              // we should initialize the (navigation) buttons on CurrentFolderTab in case this is a search folder?
              QuickFolders.Interface.initCurrentFolderTab(QuickFolders.Interface.CurrentFolderTab, null, null, info);
            }
          }
        }
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
