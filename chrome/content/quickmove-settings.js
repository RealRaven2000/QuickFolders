"use strict";
/* 
  BEGIN LICENSE BLOCK

  QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

// globals from quickmove.xhtml:
/*
  const settings = QuickFolders.quickMove.Settings,
          prefs = QuickFolders.Preferences;
*/

{
  const prefs = QuickFolders.Preferences;

  QuickFolders.quickMove.Settings = {
    excludedIds: [],
    get isLockInAccount() {
      return prefs.getBoolPref("quickMove.premium.lockInAccount");
    },
    get isSilent() {
      return prefs.getBoolPref('quickMove.premium.silentMode');
    },
    get isClearList() {
      return prefs.getBoolPref('quickMove.premium.escapeClearsList');
    },
    get isGoNext() {
      return prefs.getBoolPref('quickMove.gotoNextMsgAfterMove');
    },
    get isReopen() {
      return prefs.getBoolPref('quickMove.reopenMsgTabAfterMove');
    },
    
    
    loadExclusions: function loadExclusions() {
      let excludedList = prefs.getStringPref('quickMove.premium.excludedAccounts');
      this.excludedIds = excludedList.trim() ? excludedList.split(',') : [];
    }
    

  }
  
}

