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
        let util = QuickFolders.Util,
            QI = QuickFolders.Interface,
            tabmail = document.getElementById("tabmail"),
            idx = QuickFolders.tabContainer.selectedIndex;
        idx = idx || 0;
        util.logDebugOptional("listeners.tabmail", "TabListener.select() - tab index = " + idx);
				let tabs = tabmail.tabInfo || tabmail.tabOwners, // Pb: tabOwners
            info = util.getTabInfoByIndex(tabmail, idx);  // tabs[idx]
				if (!info)
					return;
        let tabMode = util.getTabMode(info);
        util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode);
        if (tabMode == 'message') {
          // Tb / Pb
          let msg = null, fld = null;
          switch (util.Application) {
            case 'Postbox': 
              msg = info._msgHdr;
              if (msg) fld = msg.folder;
              break;
            case 'Thunderbird': 
              msg = info.messageDisplay.displayedMessage
              if (msg) fld = msg.folder;
              break;
            case 'SeaMonkey':
              fld = info.msgSelectedFolder;
              break;
          }
          if (fld) {
            // reflect in current folder toolbar!
            QI.initCurrentFolderTab(QI.CurrentFolderTab, fld, null, info);
            // force reselection when we return to a folder tab
            QI.lastTabSelected = null;
            QI.setTabSelectTimer();
            return;
          }
          util.logDebug("TabListener single message - could not determine displayed Message message in " + util.Application);
        }
        else {
          // restore the category
          if (info.QuickFoldersCategory) {
            util.logDebugOptional("listeners.tabmail", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
            let isFolderUpdated = QI.selectCategory(info.QuickFoldersCategory, false);
            util.logDebugOptional("listeners.tabmail", "After QuickFoldersCategory - isFolderUpdated =" + isFolderUpdated );
            QI.updateCategories();
            // do not select folder if selectCategory had to be done
            if (!isFolderUpdated)
              QI.setFolderSelectTimer();	
          }
          // Do not switch to current folder's category, if current tab has another selected!
          else {
            // there is no need for this if it is not a mail tab.
            if (tabMode == util.mailFolderTypeName) {
              QI.setTabSelectTimer();
            }
            else {
              // should we initialize the (navigation) buttons on CurrentFolderTab in case this is a search folder?
              if (!QI.CurrentFolderTab.collapsed)
                QI.initCurrentFolderTab(QI.CurrentFolderTab, null, null, info);
            }
          }
        }
        
        // for non-folder tabs: reset lastTabSelected to force refresh of current folder 
        // when we go back to a folder tab
        if (tabMode != util.mailFolderTypeName)
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
    idx = idx || 0;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.newTab()  - idx = " + idx);
  } ,
  
  moveTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    let idx = QuickFolders.tabContainer.selectedIndex;
    idx = idx || 0;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.moveTab()  - idx = " + idx);
  } 
}
