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
            idx = QuickFolders.tabContainer.tabbox.selectedIndex;
        idx = idx || 0;
        util.logDebugOptional("listeners.tabmail,categories", "TabListener.select() - tab index = " + idx);
				let info = util.getTabInfoByIndex(tabmail, idx);  // tabmail.tabInfo[idx]
				if (!info) { return; }
					
        let tabMode = util.getTabMode(info);
				
				let isToggleToolbar = false,
				    toolbarElement = isToggleToolbar ? QuickFolders.Interface.Toolbar : null;
        util.logDebugOptional("listeners.tabmail", "tabMode = " + tabMode + "\nisToggleToolbar = " + isToggleToolbar);
				
				if (isToggleToolbar) {
					let isCollapsed = 
						!(["message", "folder", "3pane", "glodaList", "mail3PaneTab"].includes(tabMode));
					util.logDebugOptional("listeners.tabmail", "Setting Toolbar collapsed to " + isCollapsed);
					toolbarElement.collapsed = isCollapsed;
				}
				
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
          // tabmail.restoreTab(tabmail.tabs[idx]);
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
          if (!isFolderUpdated)
            QI.setFolderSelectTimer();	
        }

        
        if (tabMode == "message") {
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
            if (tabMode == "mail3PaneTab") {
              // there is no need for this if it is not a mail tab.
              QI.setTabSelectTimer();
            }
            else {
              // should we initialize the (navigation) buttons on CurrentFolderTab in case this is a search folder?
              if (!QI.CurrentFolderTab.collapsed && tabMode !="contentTab") {
                QI.initCurrentFolderTab(QI.CurrentFolderTab, null, null, info);
              }
            }
          }
        }
        
        // for non-folder tabs: reset lastTabSelected to force refresh of current folder 
        // when we go back to a folder tab
        if (tabMode != "mail3PaneTab")
          QI.lastTabSelected = null;
      }
    }
    catch(e) {QuickFolders.LocalErrorLogger("Exception in Item event - calling mailTabSelected:\n" + e)};
  },
  
  closeTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    if (["folder","message","mail3PaneTab"].includes(evt.detail.tabInfo.mode.type)) {
      let info = evt.detail.tabInfo;
      QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.closeTab() - " + info.title);
      QuickFolders.Interface.storeTabSession("remove", info);
    }
  } ,
  
  newTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    // evt.detail.tabInfo.tabId 
    if (["folder","message","mail3PaneTab"].includes(evt.detail.tabInfo.mode.type)) {
      let newIndex = evt.detail.tabInfo.tabId;
      QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.newTab()  - newIndex = " + newIndex);
      let newTabInfo = tabmail.tabInfo.find(e => e == evt.detail.tabInfo);
      if (newTabInfo) {
        newTabInfo.QuickFoldersCategory = QuickFolders.Interface.currentActiveCategories;
        QuickFolders.Interface.storeTabSession();
      }
    }
  } ,
  
  moveTab: function(evt) {
    let tabmail = document.getElementById("tabmail");
    let idx = QuickFolders.tabContainer.tabbox.selectedIndex;
    idx = idx || 0;
    QuickFolders.Util.logDebugOptional("listeners.tabmail", "TabListener.moveTab()  - idx = " + idx);
    QuickFolders.Interface.storeTabSession();
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