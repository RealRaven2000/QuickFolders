"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

// drop target which defers a move to a quickJump operation
QuickFolders.quickMove = {
  // for drop target code see QuickFolders-Recent-CurrentFolderTool
  // drop code uses QuickFolders.buttonDragObserver
  // this.QuickMoveButton ...
  suspended: false,
  isMoveActive: false,
  Uris: [],      // message Uris of mails lined up for move (quickMove)
  IsCopy: [],    // copy flag, false for move
  Origins: [],   // source folder array
  
	get silent() {
		return QuickFolders.Preferences.getBoolPref('quickMove.premium.silentMode');
	},

  get isActive() {
    return (this.isMoveActive && !this.suspended)  // QuickFolders.quickMoveUris.length>0
  },
  
  get hasMails() {
    return (this.Uris.length > 0)
  },
  
  onClick: function onClick(button, evt, forceDisplay) {
    // we need to display a popup menu with a "cancel" item (this will delete the list of mails to be moved.
    // this.QuickMoveButton ...
    if (confirm('Cancel quickMove operation?')) {
      this.resetList();
    }
  },
  
	
	rememberLastFolder: function rememberLastFolder(URIorFolder, parentName) {
		const prefs = QuickFolders.Preferences,
		      util = QuickFolders.Util;
		if (prefs.isDebugOption('quickMove')) {
			util.logDebugOptional('quickMove',"rememberLastFolder(" + URIorFolder + ", " + parentName + ")")
		}
		let fld = (URIorFolder.name) ? URIorFolder : QuickFolders.Model.getMsgFolderFromUri(URIorFolder),
		    sRememberFolder = (parentName) ? parentName + "/" + fld.prettyName : fld.prettyName;
		prefs.setStringPref("quickMove.lastFolderName", sRememberFolder);
		util.logDebugOptional('quickMove',"Storing: " + sRememberFolder)
	},
	
  // move or copy mails (or both at the same time!)
	// parentName = optional parameter for remembering for autofill - 
	// only pass this when search was done in the format parent/folder
  execute: function execute(targetFolderUri, parentName) {
    function showFeedback(actionCount, messageIdList, isCopy) {
      // show notification
      if (!actionCount) 
        return;
    
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
        let messageDb = fld.msgDatabase || null;
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
			if (!QuickFolders.quickMove.silent)
				util.slideAlert("QuickFolders",notify);
    }
    function copyList(uris, origins, isCopy) {
      if (!uris.length) return;
      actionCount = 0;
      // Move / Copy Messages
      let messageIdList = util.moveMessages(fld, uris, isCopy);
      // should return an array of message ids...
      if (messageIdList) { 
        // ...which we should match before deleting our URIs?
        if (QuickFolders.FilterWorker.FilterMode) {
          let sourceFolder = origins.length ? origins[0] : null;
          for (let i=0; i<origins.length; i++) {
            if (sourceFolder!=origins[i]) {
              sourceFolder = null;
              util.slideAlert('creating filters from multiple folders is currently not supported!');
              break;
            }
          }
          QuickFolders.FilterWorker.createFilterAsync(sourceFolder, fld, messageIdList, isCopy, true);
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
		      QI = QuickFolders.Interface,
		      prefs = QuickFolders.Preferences;
    let actionCount,
        fld = QuickFolders.Model.getMsgFolderFromUri(targetFolderUri, true),
        tabMode = QI.CurrentTabMode,    
        tabmail = document.getElementById("tabmail"),
        currentTab = (util.Application=='Thunderbird') ? tabmail.selectedTab : tabmail.currentTabInfo;
				
		this.rememberLastFolder(fld, parentName);
        
    let hasMove = (this.IsCopy.indexOf(false)>=0); // are any message moved, close in case this is a single message tab
    if (tabMode == 'message' && !hasMove) {
      // close currentTab!
      if (currentTab.canClose)
        tabmail.closeTab(currentTab);
    }
        
    util.logDebugOptional('quickMove', 'quickMove.execute() , tabMode = ' + tabMode);

		try {
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
			copyList(uriCopy, originCopy, true);
			copyList(uriMove, originMove, false);
			
			this.resetList();
			this.update();
			QI.hideFindPopup();
		}
		catch(ex) { logException('quickMove.execute()', ex); }
		finally {
			util.touch(fld); // update MRUTime
			util.logDebugOptional('quickMove', 'After hideFindPopup');
		}
  },
  
  resetList: function resetList() {
    while (this.Uris.length) {
      this.Uris.pop();
    }
    while (this.Origins.length) {
      this.Origins.pop();
    }
    while (this.IsCopy.length) {
      this.IsCopy.pop();
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
  
  add: function add(newUri, sourceFolder, isCopy)  {
    if (this.Uris.indexOf(newUri) == -1) { // avoid duplicates!
      let chevron = ' ' + "\u00BB".toString() + ' ',
          showFolder = QuickFolders.Preferences.getBoolPref('quickMove.folderLabel'); 
      this.Uris.push(newUri);
      this.IsCopy.push(isCopy);
      this.Origins.push(sourceFolder);
      // now add to menu!
      let menu = QuickFolders.Util.$('QuickFolders-quickMoveMenu');
      if (this.Uris.length==1)
        menu.appendChild(document.createElement('menuseparator'));
      let hdr = messenger.messageServiceFromURI(newUri).messageURIToMsgHdr(newUri);
      if (hdr) {
        try {
          let label = QuickFolders.Util.getFriendlyMessageLabel(hdr),
              menuitem = document.createElement("menuitem");
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
    let isActive = this.hasMails, // ? true : false;
        QI = QuickFolders.Interface;
    this.isMoveActive = isActive; 
    QuickFolders.Util.logDebug('QuickFolders.quickMove.update()\n' + 'isActive = ' + isActive);
    // indicate number of messages on the button?
    QI.QuickMoveButton.label = 
      isActive ?
      this.Uris.length.toString() : '';
    // toggle quickMove searchbox visible
    QuickFolders.Util.$('QuickFolders-quickMove-cancel').collapsed = !isActive;
    QI.updateFindBoxMenus(isActive);
    QI.toggleMoveModeSearchBox(isActive);
    QI.findFolder(isActive, isActive ? 'quickMove' : null);
  }  
}; // quickMove
