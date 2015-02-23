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
    let util = QuickFolders.Util;
    util.logDebugOptional('quickMove', 'quickMove.execute() ..');
    let actionCount = 0;
    // isCopy should depend on modifiers while clicked (CTRL for force Control, move default)
    let fld = QuickFolders.Model.getMsgFolderFromUri(folderUri, true);
    let messageIdList = util.moveMessages(fld, QuickFolders.quickMoveUris, isCopy);
    // should return an array of message ids...
    if (messageIdList) { 
      // ...which we should match before deleting our URIs?
      this.resetList();
      if (QuickFolders.FilterWorker.FilterMode) {
        QuickFolders.FilterWorker.createFilterAsync(null, fld, messageIdList, isCopy, true);
      }
      actionCount = messageIdList.length;
    }
    util.logDebugOptional('quickMove', 'After moveMessages actionCount: ' + actionCount);
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
      util.slideAlert("QuickFolders",notify);
    }
  },
  
  resetList: function resetList() {
    while (QuickFolders.quickMoveUris.length)
      QuickFolders.quickMoveUris.pop();
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
    QuickFolders.Interface.findFolder(true, 'quickMove');
    QuickFolders.Interface.updateFindBoxMenus(true);
  },
  
  hideSearch: function hideSearch() {
    QuickFolders.Interface.findFolder(false);
    QuickFolders.Interface.updateFindBoxMenus(false);
  },
  
  toggleSuspendMove: function(menuitem) {
    this.suspended = !this.suspended;
    menuitem.checked = this.suspended;
    if (this.suspended) { // show the box
      QuickFolders.Interface.findFolder(true, 'findFolder');
    }
  },
  
  add: function add(newUri)  {
    if (QuickFolders.quickMoveUris.indexOf(newUri) == -1) { // avoid duplicates!
      QuickFolders.quickMoveUris.push(newUri);
      // now add to menu!
      let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
      if (QuickFolders.quickMoveUris.length==1)
        menu.appendChild(document.createElement('menuseparator'));
      let hdr = messenger.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label;
          let fromName = hdr.mime2DecodedAuthor;
          let date;
          let maxLen = QuickFolders.Preferences.maxSubjectLength;
          let subject = hdr.mime2DecodedSubject.substring(0, maxLen);
          if (hdr.mime2DecodedSubject.length>maxLen)
            subject += ("\u2026".toString()); // ellipsis
          let matches = fromName.match(/([^<]+)\s<(.*)>/);
          if (matches && matches.length>=2)
            fromName = matches[1];
          try {
            date =(new Date(hdr.date/1000)).toLocaleString();
          } catch(ex) {date = '';}
          label = fromName + ': ' + (subject ? (subject + ' - ') : '') + date;
          let menuitem = document.createElement("menuitem");
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
        QuickFolders.Interface.toggleMoveMode(true);
      }
    }
  },
  
  remove: function remove(URI)  {
    let i = QuickFolders.quickMoveUris.indexOf(URI),
        QI = QuickFolders.Interface;
    if (i >= 0) {
      QuickFolders.quickMoveUris.splice(i, 1);
    }
    if (!QuickFolders.quickMove.hasMails) {
      QI.isMoveActive = false;
      QI.toggleMoveMode(false);
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
      '(' + QuickFolders.quickMoveUris.length +')' : '';
    // toggle quickMove searchbox visible
    QuickFolders.Util.$('QuickFolders-quickMove-cancel').collapsed = !isActive;
    QI.updateFindBoxMenus(isActive);
    QI.toggleMoveMode(isActive);
    QI.findFolder(isActive, isActive ? 'quickMove' : null);
  }  
}; // quickMove
