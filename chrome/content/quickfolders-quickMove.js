"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */
  var {MailServices} = ChromeUtils.import("resource:///modules/MailServices.jsm");

// drop target which defers a move to a quickJump operation
QuickFolders.quickMove = {
  // for drop target code see QuickFolders-Recent-CurrentFolderTool
  // drop code uses QuickFolders.buttonDragObserver
  // this.QuickMoveButton ...
  suspended: false,
  isMoveActive: false,
  Uris: [],      // message Uris of mails lined up for move (quickMove)
  folders: [],
  IsCopy: [],    // copy flag, false for move, this is synced to the list of messages / folders.
  Origins: [],   // source folder array
  history: [],
  MAX_HISTORY: 25, // maximum storage for quickMove / quickJump targets
  MAX_HISTORY_STD: 10,
  MAX_HISTORY_FREE: 5,
  
  get isActive() {
    return (this.isMoveActive && !this.suspended)  // QuickFolders.quickMoveUris.length>0
  },
  
  get hasMails() {
    return (this.Uris.length > 0)
  },
  
  get hasFolders() {
    return (this.folders.length > 0)
  },
  
  onClick: function onClick(button, evt, forceDisplay) {
    // we need to display a popup menu with a "cancel" item (this will delete the list of mails to be moved.
    // this.QuickMoveButton ...
    if (confirm('Cancel quickMove operation?')) {
      this.resetList();
    }
  },
  
  initLog: function() {
    let stored = QuickFolders.Preferences.getStringPref("quickMove.history");    
    let parsed = JSON.parse(stored);
    QuickFolders.quickMove.history = [];
    for (let i=0; i<parsed.length; i++) {
      QuickFolders.quickMove.history.push(parsed[i]);
    }
  },
  
  addToHistory: function(fld) {
    let uri = fld.URI;
    QuickFolders.Util.logDebugOptional("quickMove","addToHistory()", fld);
    if (uri) {
      if (QuickFolders.quickMove.history[0] == uri) return;
      let newLogged = [];
      newLogged.push(uri);
      for (let i=0; i<QuickFolders.quickMove.history.length; i++) {
        if (QuickFolders.quickMove.history[i] == uri) continue;
        if (i>QuickFolders.quickMove.MAX_HISTORY) continue;
        newLogged.push(QuickFolders.quickMove.history[i]); // append the rest
      }
      QuickFolders.quickMove.history = newLogged; // discard old array.#
      let stored = JSON.stringify(newLogged);
      QuickFolders.Preferences.setStringPref("quickMove.history", stored);
    }
  },  
	
	rememberLastFolder: function rememberLastFolder(URIorFolder, parentName) {
		const prefs = QuickFolders.Preferences,
		      util = QuickFolders.Util;
    try {
      if (prefs.isDebugOption('quickMove')) {
        util.logDebugOptional('quickMove',"rememberLastFolder(" + URIorFolder + ", " + parentName + ")")
      }
      let fld = (URIorFolder.name) ? URIorFolder : QuickFolders.Model.getMsgFolderFromUri(URIorFolder),
          sRememberFolder = (parentName) ? parentName + "/" + fld.prettyName : fld.prettyName;
      prefs.setStringPref("quickMove.lastFolderName", sRememberFolder);
      prefs.setStringPref("quickMove.lastFolderURI", fld.URI);
      util.logDebugOptional("quickMove", "Storing: " + sRememberFolder + " - " + fld.URI);
      QuickFolders.quickMove.addToHistory(fld);
    }
    catch (ex) {
      util.logException("rememberLastFolder( " + URIorFolder + ", " + parentName + ")", ex);
    }
	},
	
  // move or copy mails (or both at the same time!)
	// parentName = optional parameter for remembering for autofill - 
	// only pass this when search was done in the format parent/folder
  execute: async function(targetFolderUri, parentName) {
    function showFeedback(actionCount, messageIdList, isCopy) {
      // show notification
      if (!actionCount) 
        return;
    
      let msg = 
        isCopy 
        ?  util.getBundleString("quickfoldersQuickCopiedMails")
        :  util.getBundleString("quickfoldersQuickMovedMails");
      let notify = PluralForm.get(actionCount, msg).replace("{1}", actionCount).replace("{2}", fld.prettyName);
      
      // if we are in single message mode we now have to jump into the folder and reselect the message!
      if (tabMode == "mailMessageTab" && messageIdList.length) {
        let theMessage = messageIdList[0];
        //let treeView = (typeof gFolderTreeView!='undefined') ? gFolderTreeView : GetFolderTree().view; 
        //treeView.selectFolder(fld);
        let messageDb = fld.msgDatabase || null;
        if (messageDb && !isCopy) {
          // reusing the existing Tab didn't work so we close & re-open msg from the new location.
          // [issue 132] only reopen the moved mail if this option is enabled (default is false)
          if (QuickFolders.quickMove.Settings.isReopen) {
            setTimeout( 
              function() {
                let msgHdr = messageDb.getMsgHdrForMessageID(theMessage);
                util.logDebugOptional('quickMove', 'reopen mail in tab:' + msgHdr.mime2DecodedSubject );
                QuickFolders.Util.openMessageTabFromHeader(msgHdr);
              }, 1200);
          }
        }
      }
			if (!QuickFolders.quickMove.Settings.isSilent) {
				util.slideAlert("QuickFolders", notify);
      }
    }
    async function copyList(uris, origins, isCopy) {
      if (!uris.length) return;
      actionCount = 0;
      
      // Move / Copy Messages
      let messageIdList = await util.moveMessages(fld, uris, isCopy);

      // should return an array of message ids...
      if (messageIdList) { 
        // ...which we should match before deleting our URIs?
        // use new flag FilterModeLegacy to avoid multiple assistant triggers.
        if (QuickFolders.FilterWorker.FilterMode && QuickFolders.FilterWorker.FilterModeLegacy) {
          let sourceFolder = origins.length ? origins[0] : null;
          for (let i=0; i<origins.length; i++) {
            if (sourceFolder!=origins[i]) {
              sourceFolder = null;
              util.slideAlert('creating filters from multiple folders is currently not supported!');
              break;
            }
          }
          await QuickFolders.FilterWorker.createFilterAsync(sourceFolder, fld, messageIdList, isCopy, true);
        }
        actionCount = messageIdList.length;
      }
      let theAction = isCopy ? 'copy Messages' : 'move Messages';
      util.logDebugOptional('quickMove', 'After ' + theAction + ' actionCount: ' + actionCount + ' resetting menu');
      // ==================================================================
      showFeedback(actionCount, messageIdList, isCopy);  // .bind(QuickFolders.quickMove)
    }
    // isCopy should depend on modifiers while clicked (CTRL for force Control, move default)
		const util = QuickFolders.Util,
		      QI = QuickFolders.Interface;
					
    var { PluralForm } = Components.utils.import("resource://gre/modules/PluralForm.jsm");
					
    let actionCount,
        fld = QuickFolders.Model.getMsgFolderFromUri(targetFolderUri, true),
        tabMode = QI.CurrentTabMode,    
        tabmail = document.getElementById("tabmail"),
        currentTab = tabmail.selectedTab;
				
		this.rememberLastFolder(fld, parentName);
    
    let hasMove = (this.IsCopy.includes(false)); // are any message moved, close in case this is a single message tab
    if (tabMode == "mailMessageTab" && hasMove) {
      
      if (QuickFolders.quickMove.Settings.isSingleTabAutoClose) {
        // close currentTab!
        if (currentTab.canClose) {
          tabmail.closeTab(currentTab);
        }
      }
    }
        
    util.logDebugOptional('quickMove', 'quickMove.execute() , tabMode = ' + tabMode);
    
    // ========================================
    // folder moving - separate
		try {
      if (this.folders.length) { // [issue 75] move folders instead
        QI.moveFolders(this.folders, this.IsCopy, fld);
      }
      else {
        // split mails to copy / move:   
        let uriCopy=[], uriMove=[],
            originCopy=[], originMove=[];
        for (let j=this.Uris.length-1; j>=0; j--) {
          if (this.IsCopy[j]) {
            uriCopy.push(this.Uris[j]);
            originCopy.push(this.Origins[j]);
          }
          else {
            uriMove.push(this.Uris[j]);
            originMove.push(this.Origins[j]);
          }
        }
        await copyList(uriCopy, originCopy, true);
        await copyList(uriMove, originMove, false);
      }
			this.resetList();
			this.update();
			QI.hideFindPopup();
		}
		catch(ex) { util.logException('quickMove.execute()', ex); }
		finally {
      setTimeout(function(){
        util.touch(fld); // update MRUTime
        util.logDebugOptional('quickMove', "End of quickMove.execute()\nTimestamp of [" + fld.prettyName + "] = " +  util.getMruTime(fld));
      },
      800);
		}
  },
  
  resetMenu: function resetMenu() {
    let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
    for (let i = menu.children.length-1; i>0; i--) {
      let item = menu.children[i];
      if (item.classList.contains('msgUri') || 
          item.classList.contains('folderUri') || 
          item.classList.contains('folderCopy') || 
          item.tagName=='menuseparator')
        menu.removeChild(item);
    }    
  },
  
  resetList: function resetList() {
    while (this.Uris.length) {
      this.Uris.pop();
    }
    while (this.folders.length) {
      this.folders.pop();
    }
    while (this.Origins.length) {
      this.Origins.pop();
    }
    while (this.IsCopy.length) {
      this.IsCopy.pop();
    }
    this.resetMenu();
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
  
  // [issue 75] support moving folders through quickMove
  addFolders: function addFolders(foldersArray, isCopy) {
    const QI = QuickFolders.Interface;
    let initialCount = this.folders.length;
    if (!initialCount && this.Uris.length) {
      // clear uris for moving mails
      this.resetMenu();
      while (this.Uris.length) this.Uris.pop();
    }    
    
    // add folder items to menu
    let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
    if (!initialCount)
      menu.appendChild(document.createXULElement('menuseparator'));
    for (let f of foldersArray) {
      if (this.folders.includes(f)) {
        util.logDebug("Omitting folder " + f.prettyname + " as it is already on the list!")
        continue;
      }
      this.folders.push(f);
      this.IsCopy.push(isCopy);
      let label = f.prettyName,
          menuitem = document.createXULElement("menuitem");
      menuitem.setAttribute("label", label);
      menuitem.classList.add(isCopy ? 'folderCopy' : 'folderUri');
      menuitem.classList.add('menuitem-iconic');
      menuitem.addEventListener("command", function() { QuickFolders_MySelectFolder(f.URI); });  // or QI.openFolderInNewTab(folder)
      menu.appendChild(menuitem);
    }
    
    if (this.hasFolders) {
      this.isMoveActive = true;
      QI.toggleMoveModeSearchBox(true);
    }
  } ,
  
  // Add an item to the list of things to be moved.
  add: function add(newUri, sourceFolder, isCopy)  {
    // remove any pending folders to move!
    if (this.hasFolders) {
      this.resetMenu();
      while (this.folders.length) this.folders.pop();
    }
    if (this.Uris.indexOf(newUri) == -1) { // avoid duplicates!
      let chevron = ' ' + "\u00BB".toString() + ' ',
          showFolder = QuickFolders.Preferences.getBoolPref('quickMove.folderLabel'); 
      this.Uris.push(newUri);
      this.IsCopy.push(isCopy);
      this.Origins.push(sourceFolder);
      // now add to menu!
      let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
      if (this.Uris.length==1) {
        menu.appendChild(document.createXULElement('menuseparator'));
      }
      let hdr = MailServices.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label = QuickFolders.Util.getFriendlyMessageLabel(hdr),
              menuitem = document.createXULElement("menuitem");
          if (showFolder && sourceFolder)
            label = sourceFolder.prettyName + chevron + label;
          menuitem.setAttribute("label", label);
          menuitem.className='msgUri menuitem-iconic' + (isCopy ? ' msgCopy' : '');
          QuickFolders.Interface.setEventAttribute(menuitem, "oncommand","QuickFolders.Util.openMessageTabFromUri('" + newUri + "');");
          menu.appendChild(menuitem);
        }
        catch(ex) {
          QuickFolders.Util.logException('quickMove.add', ex);
        }
      }
      if (this.hasMails) {
        this.isMoveActive = true;
        QuickFolders.Interface.toggleMoveModeSearchBox(true);
      }
    }
  },
  
  remove: function remove(URI)  {
    let i = this.Uris.indexOf(URI),
        QI = QuickFolders.Interface;
    if (i >= 0) {
      this.Uris.splice(i, 1);
      this.Origins.splice(i, 1);
      this.IsCopy.splice(i, 1);
    }
       
    if (!this.hasMails) {
      this.isMoveActive = false; // Cancel Move operation if last one is removed
      QI.toggleMoveModeSearchBox(false);
    }
  },
  
  update: function update() {
    let isActive = this.hasMails || this.hasFolders, // ? true : false;
        QI = QuickFolders.Interface,
        util = QuickFolders.Util;
    this.isMoveActive = isActive; 
    util.logDebug('QuickFolders.quickMove.update()\n' + 'isActive = ' + isActive);
    // indicate number of messages on the button?
    let moveItems = isActive ? (this.Uris.length + this.folders.length) : 0;
    QI.QuickMoveButton.label = isActive ? moveItems.toString() : '';
    // toggle quickMove searchbox visible
    util.$('QuickFolders-quickMove-cancel').collapsed = !isActive;
    QI.updateFindBoxMenus(isActive);
    QI.toggleMoveModeSearchBox(isActive);
    QI.findFolder(isActive, isActive ? 'quickMove' : null);
  }  
}; // quickMove
