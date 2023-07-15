"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

///// tab listener watches tabmail (mail tabs)
QuickFolders.TabListener = {
  selectTab: function(evt){
    try {
      if (QuickFolders) {
        let util = QuickFolders.Util,
            QI = QuickFolders.Interface,
            tabmail = document.getElementById("tabmail");
        util.logDebugOptional("listeners.tabmail,categories", "TabListener.select() - ");
				let info = tabmail.currentTabInfo;
				if (!info) { return; }
					
        let tabMode = QI.CurrentTabMode; // util.getTabMode(info);
				
        util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode, info );
				
        let wasRestored = false;
        if (tabMode == "mail3PaneTab" && QuickFolders.Preferences.isDebugOption("listeners.tabmail") && typeof info.QuickFoldersCategory == "undefined") {
          // need to retrieve the info from the session store!
          console.log("{LISTENERS.TABMAIL}\nMissing QuickFoldersCategory in tabInfo:", info);
          let lastCats = QuickFolders.Preferences.getStringPref("lastActiveCategories"); // last one looked at
          if (lastCats) {
            console.log(`{LISTENERS.TABMAIL} select category ${lastCats}`);
            QI.selectCategory(lastCats, false);
            wasRestored = true;
          }
          // Tb102 needs a new method for persisting categories.
          console.log("{LISTENERS.TABMAIL}\nRESTORE FROM SESSION OR LOCAL STORAGE??", info);
        }        
        
         // restore the category
        if (info.QuickFoldersCategory) {
          let isFolderUpdated = false;
          if (!wasRestored) {
            util.logDebugOptional("listeners.tabmail,categories", "tab info - setting QuickFolders category: " + info.QuickFoldersCategory);
            isFolderUpdated = QI.selectCategory(info.QuickFoldersCategory, false);
            util.logDebugOptional("listeners.tabmail", `After selectCategory(${info.QuickFoldersCategory}) - isFolderUpdated =${isFolderUpdated}`);
          }
          // do not select folder if selectCategory had to be done
          if (!isFolderUpdated) {
            QI.setFolderSelectTimer();
          }
        }

        
        if (tabMode == "message" || tabMode == "mailMessageTab") { // "mailMessageTab"
          let msg = null, fld = null;
          msg = info.message || info.messageDisplay ? info.messageDisplay.displayedMessage : null;
          if (msg) fld = msg.folder;
          if (fld) {
            // reflect in current folder toolbar!
            QI.initCurrentFolderTab(QI.CurrentFolderTab, fld, null, info);
            // force reselection when we return to a folder tab
            QI.lastTabSelected = null;
            QI.setTabSelectTimer();
          }
          else {
            util.logDebug("TabListener single message - could not determine currently displayed Message.");
          }
        }
        else
        {
          // Do not switch to current folder's category, if current tab has another selected!
          if (!info.QuickFoldersCategory) {
            switch(tabMode) {
              case "mail3PaneTab":
                // there is no need for this if it is not a mail tab.
                QI.setTabSelectTimer();
                break;
              case "contentTab":
                break;
              default:
                // should we initialize the (navigation) buttons on CurrentFolderTab in case this is a search folder?
                if (!QI.CurrentFolderTab.collapsed) {
                  QI.initCurrentFolderTab(QI.CurrentFolderTab, null, null, info);
                }
                break;
            }
          }
        }
        
        // for non-folder tabs: reset lastTabSelected to force refresh of current folder 
        // when we go back to a folder tab
        if (tabMode != "mail3PaneTab")
          QI.lastTabSelected = null;
      }
    }
    catch(e) {
      QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected:\n" + e)
    };
  },
  
  closeTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    if (["folder","message","mail3PaneTab"].includes(evt.detail.tabInfo.mode.type)) {
      let info = evt.detail.tabInfo;
      QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.closeTab() - " + info.title);
    }
  } ,
  
  newTab: function(evt) {
    if (["folder","message","mail3PaneTab"].includes(evt.detail.tabInfo.mode.name)) { // ,"mailMessageTab"
      let newTabInfo = evt.detail.tabInfo;
      if (newTabInfo) {
        newTabInfo.QuickFoldersCategory = QuickFolders.Interface.currentActiveCategories;
      }
    }
  } ,
  
  moveTab: function(evt) {
    let idx = QuickFolders.tabContainer.tabbox.selectedIndex;
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