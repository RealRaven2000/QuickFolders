"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

///// tab listener watches tabmail (mail tabs)
QuickFolders.TabListener = {
  select: function(evt){
    try {
      if (QuickFolders) {
        let util = QuickFolders.Util,
            QI = QuickFolders.Interface,
            tabmail = document.getElementById("tabmail"),
            idx = QuickFolders.tabContainer.selectedIndex;
        idx = idx || 0;
        util.logDebugOptional("listeners.tabmail,categories", "TabListener.select() - tab index = " + idx);
				let tabs = tabmail.tabInfo || tabmail.tabOwners, // Pb: tabOwners
            info = util.getTabInfoByIndex(tabmail, idx);  // tabs[idx]
				if (!info)
					return;
        let tabMode = util.getTabMode(info);
				
				let isToggleToolbar = false,
				    toolbarElement = isToggleToolbar ? QuickFolders.Toolbar : null;
        util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode + "\nisToggleToolbar = " + isToggleToolbar);
				
				if (isToggleToolbar) {
					let isCollapsed = 
						!(tabMode == 'message' || tabMode == 'folder' || tabMode == '3pane' || tabMode == 'glodaList');
					util.logDebugOptional("listeners.tabmail", "Setting Toolbar collapsed to " + isCollapsed);
					toolbarElement.collapsed = isCollapsed;
				}
				
         // restore the category
        if (info.QuickFoldersCategory) {
          util.logDebugOptional("listeners.tabmail,categories", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
          let isFolderUpdated = QI.selectCategory(info.QuickFoldersCategory, false);
          util.logDebugOptional("listeners.tabmail", "After QuickFoldersCategory - isFolderUpdated =" + isFolderUpdated );
          // do not select folder if selectCategory had to be done
          if (!isFolderUpdated)
            QI.setFolderSelectTimer();	
        }
        
        if (tabMode == 'message') {
          let msg = null, fld = null;
          if (info.messageDisplay)
            msg = info.messageDisplay.displayedMessage;
          if (msg) fld = msg.folder;
          if (fld) {
            // reflect in current folder toolbar!
            QI.initCurrentFolderTab(QI.CurrentFolderTab, fld, null, info);
            // force reselection when we return to a folder tab
            QI.lastTabSelected = null;
            QI.setTabSelectTimer();
          }
          else 
            util.logDebug("TabListener single message - could not determine currently displayed Message.");
        }
        else
        {
          // Do not switch to current folder's category, if current tab has another selected!
          if (!info.QuickFoldersCategory) {
            if (tabMode == "folder") {
              // there is no need for this if it is not a mail tab.
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
        if (tabMode != "folder")
          QI.lastTabSelected = null;
      }
    }
    catch(e) {QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected:\n" + e)};
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

QuickFolders.onGlobalQFCommand = (data) => {
  if (data.event) {
    switch(data.event) {
      case "showAboutConfig":
        QuickFolders.Interface.showAboutConfig(data.element, data.filter, data.readOnly, data.updateUI);
        break;
      case "showLicenseDialog":
        QuickFolders.Interface.showLicenseDialog(data.referrer);
        break;
      case "legacyAdvancedSearch":
      {
        let params = {inn:{mode:"allOptions", instance: QuickFolders}, out:null},
            win = window.openDialog('chrome://quickfolders/content/quickmove.xhtml',
              'quickfolders-search-options',
              'chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',
              QuickFolders,
              params).focus();
      }          
        break;
    }
  }
}

QuickFolders.Util.notifyTools.registerListener(QuickFolders.onGlobalQFCommand);