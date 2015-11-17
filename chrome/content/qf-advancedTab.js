"use strict";

QuickFolders.AdvancedTab = {
  ADVANCED_FLAGS: {
    NONE : 0x0000,
    SUPPRESS_UNREAD : 0x0001,
    SUPPRESS_COUNTS : 0x0002,
    CUSTOM_CSS :      0x0100,
    CUSTOM_PALETTE :  0x0200
  } ,
  get folder() {
    return window.arguments[0];
  } ,
  get entry() {
    return window.arguments[1];
  } ,
  get MainQuickFolders() {
    let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");  
    return mail3PaneWindow.QuickFolders;
  } ,
  
  checkIsFlagged: function checkIsFlagged() {
    let e = this.entry;
    // TO DO: check all flags of this entry to see whether it has _any_ advanced settings.
    // in that case return true.
    if (e.advanced) {
      if (e.advanced.flags) {
        if (e.advanced.flags & this.ADVANCED_FLAGS.SUPPRESS_UNREAD)
          return true;
      }
    }
    return false;
  } ,
  
  // list of accounts
  get Accounts() {
    const Ci = Components.interfaces;
    let util = this.MainQuickFolders.Util, 
        aAccounts=[],
        accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).accounts;
    if (util.Application == 'Postbox') 
      aAccounts = util.getAccountsPostbox();
    else {
      aAccounts = [];
      for (let ac in fixIterator(accounts, Ci.nsIMsgAccount)) {
        aAccounts.push(ac);
      };
    }
    return aAccounts;
  },
	
  load: function load() {
		const util = this.MainQuickFolders.Util;
    let dropdownCount = 0;
		
    function appendIdentity(dropdown, id, account) {
      try {
        util.logDebugOptional('identities', 
          'Account: ' + account.key + '...\n'  
          + 'appendIdentity [' + dropdownCount + ']\n'
          + '  identityName = ' + (id ? id.identityName : 'empty') + '\n'
          + '  fullName = ' + (id ? id.fullName : 'empty') + '\n' 
          + '  email = ' + (id.email ? id.email : 'empty'));
        let menuitem = document.createElement('menuitem');
				if (id==-1) {
					menuitem.setAttribute("value", "default");
					menuitem.setAttribute("label", "not set");
					menuitem.setAttribute("accountKey", 0);
				}
				else {
					if (!id.email) {
						util.logToConsole('Omitting account ' + id.fullName + ' - no mail address');
						return;
					}
					menuitem.setAttribute("id", "id" + dropdownCount++);
					// this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
					menuitem.setAttribute("fullName", id.fullName);
					menuitem.setAttribute("value", id.email);
					menuitem.setAttribute("accountKey", account.key);
					menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
				}
        dropdown.appendChild(menuitem);
      }
      catch (ex) {
        util.logException('appendIdentity failed: ', ex);
      }
    }
		
    let entry = this.entry,
        elem = document.getElementById.bind(document);
    if (entry.flags) {
      let ig = elem('chkIgnoreUnread'),
          ic = elem('chkIgnoreCounts'),
          iss = elem('chkCustomCSS'),
          ip = elem('chkCustomPalette'),
					cboIdentity = elem('mailIdentity');
      // ignore unread counts
      ig.checked = (entry.flags & this.ADVANCED_FLAGS.SUPPRESS_UNREAD) && true;
      // ignore all counts
      ic.checked = (entry.flags & this.ADVANCED_FLAGS.SUPPRESS_COUNTS) && true;
      // custom css rules
      iss.checked = (entry.flags & this.ADVANCED_FLAGS.CUSTOM_CSS) && true;
      elem('txtColor').value = entry.cssColor || '';
      elem('txtColorPicker').color = elem('txtColor').value;
      elem('txtBackground').value = entry.cssBack || '';
      // custom palette
      let isPalette = (entry.flags & this.ADVANCED_FLAGS.CUSTOM_PALETTE) && true;
      ip.checked = isPalette;
      if (isPalette) {
        let menuList = elem('menuCustomTabPalette');
        menuList.value = this.entry.customPalette.toString();
      }
    }
		// Addressing
		// iterate accounts for From Address dropdown
		let cboIdentity = elem('mailIdentity'),
		    popup = cboIdentity.menupopup,
				myAccounts = this.Accounts,
				acCount = myAccounts.length;
		appendIdentity(popup, -1, 0); // not set (id0)
		util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')...');
		for (let a=0; a < myAccounts.length; a++) { 
			let ac = myAccounts[a],
			    ids = ac.identities; // array of nsIMsgIdentity 
			if (ids) {
				let idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
				util.logDebugOptional('identities', ac.key + ': iterate ' + idCount + ' identities...');
				for (let i=0; i<idCount; i++) {
					// use ac.defaultIdentity ??
					// populate the dropdown with nsIMsgIdentity details
					let id = util.getIdentityByIndex(ids, i);
					if (!id) continue;
					appendIdentity(popup, id, ac);
				}
			}
			else {
				util.logDebugOptional('identities', 'Account: ' + ac.key + ':\n - No identities.');
			}  
		}
		
		if (entry.fromIdentity) 
			cboIdentity.value = entry.fromIdentity;
		else
			cboIdentity.value = 'default'; // default - no identity, so default is chosen.

		elem('txtToAddress').value = entry.toAddress ? entry.toAddress : '';
    
    let lbl = elem('lblCategories'),
        tabHeader = elem('myHeader');
    lbl.value = entry.category;
    tabHeader.setAttribute('description', entry.name);
    
    // we wait as the width isn't correct on load
    // might be unnecessary as we react to WM_ONRESIZE
    setTimeout(
      function () { QuickFolders.AdvancedTab.resize(); }, 
      2000);  
  } ,
  
  close: function() {
    window.close();
    return true;
  } ,
  
  accept: function accept() {
    this.apply();
    return true;
  } ,
  
  apply: function apply() {
		const util = this.MainQuickFolders.Util;
		let elem = document.getElementById.bind(document);
    function addFlag(checkboxId, setFlag) {
      let isFlagged = document.getElementById(checkboxId).checked;
      if (isFlagged) {
        flags = flags | setFlag;
      }
      return isFlagged;
    }
    
    let f = this.folder,
        isChange = false,
        flags = this.ADVANCED_FLAGS.NONE;
    
    addFlag('chkIgnoreUnread', this.ADVANCED_FLAGS.SUPPRESS_UNREAD);
    addFlag('chkIgnoreCounts', this.ADVANCED_FLAGS.SUPPRESS_COUNTS);
    if (addFlag('chkCustomCSS', this.ADVANCED_FLAGS.CUSTOM_CSS)) {
      this.entry.cssColor = elem('txtColor').value;
      this.entry.cssBack = elem('txtBackground').value;
    }
    if (addFlag('chkCustomPalette', this.ADVANCED_FLAGS.CUSTOM_PALETTE)) {
      this.entry.customPalette = elem('menuCustomTabPalette').value;
    }
    else {
      delete this.entry.customPalette;
    }
    
    // .. add more special properties
    
    if (flags)
      this.entry.flags = flags;
    else {
      if (this.entry.flags || this.entry.flags === 0) try {
        delete this.entry.flags; // minimize storage space.
        delete this.entry.cssBack;
        delete this.entry.cssColor;
        delete this.entry.customPalette;
      } catch(ex) {
        util.logException('QuickFolders.AdvancedTab.accept()', ex);
      }
    }
		
		let cboIdentity = elem('mailIdentity'),
		    fromId = cboIdentity.selectedItem.value,
				toAddress = elem('txtToAddress').value;
		if (fromId == 'default') {
			try {
				delete this.entry.fromIdentity; // default 'From:' identity 
			}
			catch (e) { ; }
		}
		else
			this.entry.fromIdentity = fromId;
		
		if (!toAddress) {
			try {
				delete this.entry.toAddress;
			}
			catch (e) { ; }
		}
		else
			this.entry.toAddress = toAddress;
		
    // refresh the model
    // QuickFolders.Interface.updateFolders(false, true);
    QuickFolders.Interface.updateMainWindow();
    this.MainQuickFolders.Model.store();  
  } ,
  
  defaults: function defaults() {
    let elem = document.getElementById.bind(document);
    elem('chkIgnoreUnread').checked = false;
    elem('chkIgnoreCounts').checked = false;
    elem('chkCustomCSS').checked = false;
    elem('chkCustomPalette').checked = false;
    elem('txtColor').value = '';
    elem('txtBackground').value = '';
    this.entry.flags = this.ADVANCED_FLAGS.NONE;
    // let's close the window with apply to unclunk it
    this.accept();
    window.close();
  } ,
  
  resize: function resize() {
    // make sure the window is placed below the referenced Tab, but not clipped by screen edge
    let x = window.screenX,
        y = window.screenY;
    QuickFolders.Util.logDebug('Move window: \n' +
      'Screen width      : ' + window.screen.width + '\n' +
      'Window outer width: ' + window.outerWidth + '\n' +
      'Current x position: ' + (x) + '\n' +
      'Right hand edge   : ' + (x + window.outerWidth) + '\n'
      );
    let x2 = window.screen.width - window.outerWidth;
    if (x+window.outerWidth > window.screen.width) {
      window.moveTo(x2, y);
    }
    
  } ,
  
  configureCategory: function configureCategory() {
    let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");  
    QuickFolders.Interface.configureCategory(this.folder, mail3PaneWindow.QuickFolders); // should actually get the "parent" QuickFolders
    let lbl = document.getElementById('lblCategories');
    lbl.value = this.entry.category + " *";
  } ,
  
  getCssGradient: function getCssGradient(evt) {
    this.MainQuickFolders.Util.openURL(evt,'http://www.colorzilla.com/gradient-editor');
  } ,
  
  getCssColor: function getCssColor(evt) {
    this.MainQuickFolders.Util.openURL(evt,'https://developer.mozilla.org/en-US/docs/Web/CSS/color');
  } ,
  
  pickColor: function pickColor(color) {
    document.getElementById('txtColor').value = color;
    this.apply();
    return true;
  } ,
  
  updatePicker: function updatePicker(textbox) {
    if (textbox.length) {
      document.getElementById('txtColorPicker').color = textbox.value;
    }
  } ,
  
  updatePalette: function updatePalette() {
    // alert ('palette update');
  } ,
  
  selectPalette: function selectPalette(el, paletteId) {
    this.entry.customPalette = paletteId;
    document.getElementById('chkCustomPalette').checked = true;
  } ,
  
	selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
        email = it.getAttribute('value');
	}
    
}  // AdvancedTab

