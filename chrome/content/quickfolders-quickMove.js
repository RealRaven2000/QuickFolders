// drop target which defers a move to a quickJump operation
QuickFolders.quickMove = {
  // for drop target code see QuickFolders-Recent-CurrentFolderTool
  // drop code uses QuickFolders.buttonDragObserver
  // this.QuickMoveButton ...
  suspended: false,
  
  get isActive() {
    return (QuickFolders.Interface.isMoveActive && !this.suspended)  // QuickFolders.quickMoveUris.length>0
  },
  
  get hasMails() {
    return (QuickFolders.quickMoveUris.length > 0)
  },
  
  onClick: function onClick(button, evt, forceDisplay) {
    // we need to display a popup menu with a "cancel" item (this will delete the list of mails to be moved.
    // this.QuickMoveButton ...
    if (confirm('Cancel quickMove operation?')) {
      this.resetList();
    }
  },
  
  execute: function execute(folderUri, isCopy) {
    // isCopy should depend on modifiers while clicked (CTRL for force Control, move default)
    let util = QuickFolders.Util,
        actionCount = 0,
        fld = QuickFolders.Model.getMsgFolderFromUri(folderUri, true),
        tabMode = QuickFolders.Interface.CurrentTabMode,    
        tabmail = document.getElementById("tabmail"),
        currentTab = (QuickFolders.Util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;
        
    if (tabMode == 'message' && !isCopy) {
      // close currentTab!
      if (currentTab.canClose)
        tabmail.closeTab(currentTab);
    }
        
    // Move / Copy Messages
    let messageIdList = util.moveMessages(fld, QuickFolders.quickMoveUris, isCopy);
        
    util.logDebugOptional('quickMove', 'quickMove.execute() , tabMode = ' + tabMode);
        
    // should return an array of message ids...
    if (messageIdList) { 
      // ...which we should match before deleting our URIs?
      if (QuickFolders.FilterWorker.FilterMode) {
        let sourceFolder = QuickFolders.quickMoveOrigins.length ? QuickFolders.quickMoveOrigins[0] : null;
        for (let i=0; i<QuickFolders.quickMoveOrigins.length; i++) {
          if (sourceFolder!=QuickFolders.quickMoveOrigins[i]) {
            sourceFolder = null;
            util.slideAlert('creating filters from multiple folders is currently not supported!');
            break;
          }
        }
        QuickFolders.FilterWorker.createFilterAsync(sourceFolder, fld, messageIdList, isCopy, true);
      }
      actionCount = messageIdList.length;
    }
    util.logDebugOptional('quickMove', 'After moveMessages actionCount: ' + actionCount + ' resetting menu');
    this.resetList();
    this.update();
    QuickFolders.Interface.hideFindPopup();
    util.logDebugOptional('quickMove', 'After hideFindPopup');
    // show notification
    if (actionCount) {
      let msg = 
        isCopy 
        ?  util.getBundleString("quickfoldersQuickCopiedMails","Email copied to folder {2};{1} Emails copied to folder {2}")
        :  util.getBundleString("quickfoldersQuickMovedMails","Email moved to folder {2};{1} Emails moved to folder {2}");
      let notify = PluralForm.get(actionCount, msg).replace("{1}", actionCount).replace("{2}", fld.prettyName);
      
      // if we are in single message mode we now have to jump into the folder and reselect the message!
      if (tabMode == 'message' && messageIdList.length) {
        let theMessage = messageIdList[0];
        //let treeView = (typeof gFolderTreeView!='undefined') ? gFolderTreeView : GetFolderTree().view; 
        //treeView.selectFolder(fld);
        let messageDb = fld.msgDatabase ? fld.msgDatabase : null;
        if (messageDb && !isCopy) {
          // reusing the existing Tab didn't work so we close & re-open msg from the new location.
          // let tab = (QuickFolders.Util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;
          // currentTab.folderDisplay.selectMessage(msgHdr, true);
          setTimeout( 
            function() {
              let msgHdr = messageDb.getMsgHdrForMessageID(theMessage);
              util.logDebugOptional('quickMove', 'reopen mail in tab:' + msgHdr.mime2DecodedSubject );
              QuickFolders.Util.openMessageTabFromHeader(msgHdr);
            }, 1200);
        }
      }
      
      util.slideAlert("QuickFolders",notify);
    }
  },
  
  resetList: function resetList() {
    while (QuickFolders.quickMoveUris.length) {
      QuickFolders.quickMoveUris.pop();
    }
    while (QuickFolders.quickMoveOrigins.length) {
      QuickFolders.quickMoveOrigins.pop();
    }
    let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
    for (let i = menu.childNodes.length-1; i>0; i--) {
      let item = menu.childNodes[i];
      if (item.className.indexOf('msgUri')>=0 || item.tagName=='menuseparator')
        menu.removeChild(item);
    }
    this.update();
  },
  
  cancel: function cancel() {
    this.resetList();
  },
  
  showSearch: function showSearch() {
    QuickFolders.Util.logDebugOptional("interface.findFolder,quickMove", "quickMove.showSearch()");
    QuickFolders.Interface.findFolder(true, 'quickMove');
    QuickFolders.Interface.updateFindBoxMenus(true);
  },
  
  hideSearch: function hideSearch() {
    QuickFolders.Util.logDebugOptional("interface.findFolder,quickMove", "quickMove.hideSearch()");
    QuickFolders.Interface.findFolder(false);
    QuickFolders.Interface.updateFindBoxMenus(false);
  },
  
  toggleSuspendMove: function(menuitem) {
    if (!menuitem) {
      menuitem = document.getElementById('QuickFolders-quickMove-suspend');
      if (!menuitem) return;
    }
    this.suspended = !this.suspended;
    menuitem.checked = this.suspended;
    if (this.suspended) { // show the box
      QuickFolders.Interface.findFolder(true, 'findFolder');
    }
  },
  
  add: function add(newUri, sourceFolder)  {
    if (QuickFolders.quickMoveUris.indexOf(newUri) == -1) { // avoid duplicates!
      let chevron = ' ' + "\u00BB".toString() + ' ',
          showFolder = QuickFolders.Preferences.getBoolPref('quickMove.folderLabel'); 
      QuickFolders.quickMoveUris.push(newUri);
      QuickFolders.quickMoveOrigins.push(sourceFolder);
      // now add to menu!
      let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
      if (QuickFolders.quickMoveUris.length==1)
        menu.appendChild(document.createElement('menuseparator'));
      let hdr = messenger.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label = QuickFolders.Util.getFriendlyMessageLabel(hdr),
              menuitem = document.createElement("menuitem");
          if (showFolder && sourceFolder)
            label = sourceFolder.prettyName + chevron + label;
          menuitem.setAttribute("label", label);
          menuitem.className='msgUri menuitem-iconic';
          QuickFolders.Interface.setEventAttribute(menuitem, "oncommand","QuickFolders.Util.openMessageTabFromUri('" + newUri + "');");
          menu.appendChild(menuitem);
        }
        catch(ex) {
          QuickFolders.Util.logException('quickMove.add', ex);
        }
      }
      if (QuickFolders.quickMove.hasMails) {
        QuickFolders.Interface.isMoveActive = true;
        QuickFolders.Interface.toggleMoveModeSearchBox(true);
      }
    }
  },
  
  remove: function remove(URI)  {
    let i = QuickFolders.quickMoveUris.indexOf(URI),
        QI = QuickFolders.Interface;
    if (i >= 0) {
      QuickFolders.quickMoveUris.splice(i, 1);
      QuickFolders.quickMoveOrigins.splice(i, 1);
    }
       
    if (!QuickFolders.quickMove.hasMails) {
      QI.isMoveActive = false;
      QI.toggleMoveModeSearchBox(false);
    }
  },
  
  update: function update() {
    let isActive = QuickFolders.quickMove.hasMails, // ? true : false;
        QI = QuickFolders.Interface;
    QI.isMoveActive = isActive; 
    QuickFolders.Util.logDebug('QuickFolders.quickMove.update()\n' + 'isActive = ' + isActive);
    // indicate number of messages on the button?
    QI.QuickMoveButton.label = 
      isActive ?
      QuickFolders.quickMoveUris.length.toString() : '';
    // toggle quickMove searchbox visible
    QuickFolders.Util.$('QuickFolders-quickMove-cancel').collapsed = !isActive;
    QI.updateFindBoxMenus(isActive);
    QI.toggleMoveModeSearchBox(isActive);
    QI.findFolder(isActive, isActive ? 'quickMove' : null);
  }  
}; // quickMove
