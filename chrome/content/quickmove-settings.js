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
    },
    
    load: function () {
      // add accounts:
      let myAccounts = util.Accounts,
          accountsbox = document.getElementById('currentFolderCustomize'),
          iCount=0;
          
      this.loadExclusions();
          
      let createElement =  document.createXULElement ? document.createXULElement.bind(document) : document.createElement.bind(document);
      for (let i=0; i<myAccounts.length; i++) {
        let ac = myAccounts[i],
            server = ac.incomingServer;
            
        if (server && server.canFileMessagesOnServer) {
          let name = server.prettyName,
              key = server.key;
          // let container = createElement("hbox");
          // container.classList.add('accountItem');
          let label = createElement("label"),
              chk = createElement("checkbox");
          chk.id = key;
          if(this.excludedIds.includes(key)) {
            chk.checked = true;
          }
          chk.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleAccountExclusion(chk, evt)} );
          chk.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleAccountExclusion(chk, evt)} );
          // container.appendChild(label);
          // container.appendChild(chk);
          // accountsbox.appendChild(container);
          accountsbox.appendChild(label);
          accountsbox.appendChild(chk);
          label.setAttribute('value', key + " - " + name);
          util.logDebug("Listed Account: " + ac.incomingServer.serverURI);
          iCount++;
        }
        else {
          util.logDebug("Omitting Account (no incoming server):"  + ac.key);
        }
      }
      if(iCount) {
        let dummy=document.getElementById('dummy');
        accountsbox.removeChild(dummy);
      }
      let chkLock = document.getElementById('chkLockAccounts');
      chkLock.checked = settings.isLockInAccount;
      chkLock.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleLockInAccount(chkLock, evt)} );
      chkLock.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleLockInAccount(chkLock, evt)} );
      
      let chkSilent = document.getElementById('chkSilent');
      chkSilent.checked = settings.isSilent;
      chkSilent.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleSilent(chkSilent, evt)} );
      chkSilent.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleSilent(chkSilent, evt)} );
      
      
      let chkEsc = document.getElementById('chkEscapeClearsList');
      chkEsc.checked = settings.isClearList;
      chkEsc.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleClearList(chkEsc, evt)} );
      chkEsc.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleClearList(chkEsc, evt)} );
      
      let chkGoNext = document.getElementById('chkGoNext');
      chkGoNext.checked = settings.isGoNext;
      chkGoNext.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleGoNext(chkGoNext, evt)} );
      chkGoNext.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleGoNext(chkGoNext, evt)} );
      
      let chkReopen = document.getElementById('chkReopen');
      chkReopen.checked = settings.isReopen;
      chkReopen.addEventListener("click", function(evt) {QuickFolders.quickMove.Settings.toggleReopen(chkReopen, evt)} );
      chkReopen.addEventListener("keypress", function(evt) {QuickFolders.quickMove.Settings.toggleReopen(chkReopen, evt)} );
      
      
      let maxResults = document.getElementById('maxResults');
      maxResults.value = prefs.getIntPref("quickMove.maxResults");
      maxResults.addEventListener("change", function(evt) {QuickFolders.quickMove.Settings.changeMaxResults(maxResults)} );
    },
    
    toggleAccountExclusion: function toggleAccountExclusion(el, evt) {
      // check box command handler
      let isChecked = el.checked,
          list = QuickFolders.quickMove.Settings.excludedIds,
          isModified = false,
          txtDebug = "";
      if (evt.type == "keypress" && evt.key != " ") return;
      if (el.id) {
        if (el.checked) {
          if (!list.includes(el.id)) {
            list.push(el.id);
            isModified = true;
            txtDebug += " " + el.id + "=true";
          }
        }
        else {
          if (list.includes(el.id)) {
            list = list.filter(item => item !== el.id);
            isModified = true;
            txtDebug += " " + el.id + "=false";
          }
        }
      }
      if (isModified) {
        util.logDebug ('modified!\n' + txtDebug);
        prefs.setStringPref('quickMove.premium.excludedAccounts',list.join(","));
      }
    },
    
    toggleLockInAccount: function(el, evt) {
      let isChecked = el.checked;
      if (evt.type == "keypress" && evt.key != " ") return;
      prefs.setBoolPref("quickMove.premium.lockInAccount", isChecked);
    },
    
    toggleSilent: function(el, evt) {
      let isChecked = el.checked;
      if (evt.type == "keypress" && evt.key != " ") return;
      prefs.setBoolPref("quickMove.premium.silentMode", isChecked);
    },
    
    toggleClearList: function(el, evt) {
      let isChecked = el.checked;
      if (evt.type == "keypress" && evt.key != " ") return;
      prefs.setBoolPref("quickMove.premium.escapeClearsList", isChecked);
    },
    
    toggleGoNext: function(el, evt) {
      let isChecked = el.checked;
      if (evt.type == "keypress" && evt.key != " ") return;
      prefs.setBoolPref("quickMove.gotoNextMsgAfterMove", isChecked);
    },
    
    toggleReopen: function(el, evt) {
      let isChecked = el.checked;
      if (evt.type == "keypress" && evt.key != " ") return;
      prefs.setBoolPref("quickMove.reopenMsgTabAfterMove", isChecked);
    },
    
    changeMaxResults: function(el) {
      prefs.setIntPref("quickMove.maxResults", el.value);
    },
    
    accept: function() {
      // transmit to main window:
      util.Mail3PaneWindow.QuickFolders.quickMove.Settings.loadExclusions();
    }
    
  }

  const settings = QuickFolders.quickMove.Settings,
      prefs = QuickFolders.Preferences,
      util = QuickFolders.Util;

}