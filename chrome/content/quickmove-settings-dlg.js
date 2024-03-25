"use strict";
/* 
  BEGIN LICENSE BLOCK

  QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/


{
  const prefs = QuickFolders.Preferences,
        util = QuickFolders.Util;

  var globalQuickMoveSettings;
  
  var qmSettings = {
    load: function () {
      globalQuickMoveSettings = util.getMail3PaneWindow().QuickFolders.quickMove.Settings;
      // add accounts:
      let myAccounts = util.Accounts,
          accountsbox = document.getElementById('currentFolderCustomize'),
          iCount=0;
          
      QuickFolders.quickMove.Settings.loadExclusions();
          
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
          if(QuickFolders.quickMove.Settings.excludedIds.includes(key)) {
            chk.checked = true;
          }
          chk.addEventListener("click", function(evt) { qmSettings.toggleAccountExclusion(chk, evt)} );
          chk.addEventListener("keypress", function(evt) { qmSettings.toggleAccountExclusion(chk, evt)} );
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
      chkLock.checked = globalQuickMoveSettings.isLockInAccount;
      chkLock.addEventListener("click", function(evt) { qmSettings.toggleLockInAccount(chkLock, evt)} );
      chkLock.addEventListener("keypress", function(evt) { qmSettings.toggleLockInAccount(chkLock, evt)} );
      
      let chkSilent = document.getElementById('chkSilent');
      chkSilent.checked = globalQuickMoveSettings.isSilent;
      chkSilent.addEventListener("click", function(evt) { qmSettings.toggleSilent(chkSilent, evt)} );
      chkSilent.addEventListener("keypress", function(evt) { qmSettings.toggleSilent(chkSilent, evt)} );
      
      
      let chkEsc = document.getElementById('chkEscapeClearsList');
      chkEsc.checked = globalQuickMoveSettings.isClearList;
      chkEsc.addEventListener("click", function(evt) { qmSettings.toggleClearList(chkEsc, evt)} );
      chkEsc.addEventListener("keypress", function(evt) { qmSettings.toggleClearList(chkEsc, evt)} );
      
      let chkGoNext = document.getElementById('chkGoNext');
      chkGoNext.checked = globalQuickMoveSettings.isGoNext;
      chkGoNext.addEventListener("click", function(evt) { qmSettings.toggleGoNext(chkGoNext, evt)} );
      chkGoNext.addEventListener("keypress", function(evt) { qmSettings.toggleGoNext(chkGoNext, evt)} );
      
      let chkReopen = document.getElementById('chkReopen');
      chkReopen.checked = globalQuickMoveSettings.isReopen;
      chkReopen.addEventListener("click", function(evt) { qmSettings.toggleReopen(chkReopen, evt)} );
      chkReopen.addEventListener("keypress", function(evt) { qmSettings.toggleReopen(chkReopen, evt)} );
      
      
      let maxResults = document.getElementById('maxResults');
      maxResults.value = prefs.getIntPref("quickMove.maxResults");
      maxResults.addEventListener("change", function(evt) { qmSettings.changeMaxResults(maxResults)} );
      
      
      // [mx-l10n]
      QuickFolders.Util.localize(window);

    
    },
    
    toggleAccountExclusion: function(el, evt) {
      // check box command handler
      let list = globalQuickMoveSettings.excludedIds,
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
        prefs.setStringPref('quickMove.premium.excludedAccounts', list.join(","));
        globalQuickMoveSettings.excludedIds = list; // write back the list!!
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
      globalQuickMoveSettings.loadExclusions();
    }
  }
    
}    


// initialize the dialog and do l10n
window.document.addEventListener('DOMContentLoaded', 
  qmSettings.load.bind(qmSettings) , 
  { once: true });

window.addEventListener('dialogaccept', 
  function () { qmSettings.accept(); }
);

