"use strict";

QuickFolders.AdvancedTab = {
  ADVANCED_FLAGS: QuickFolders.Util.ADVANCED_FLAGS,
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
  
  updatePremiumFeatures: function() {
    let hasLicense = QuickFolders.Util.hasValidLicense();
    let isPremium = (hasLicense && !QuickFolders.Util.hasStandardLicense());
    let isRecursive = document.getElementById('chkComposerSubFolders');
    
    document.getElementById("mailIdentity").disabled = !hasLicense;
    document.getElementById("txtToAddress").disabled = !hasLicense;
    
    isRecursive.disabled = !isPremium;
    let proImg1 = document.getElementById('proRecursiveIcon'),
        theText = QuickFolders.Util.getBundleString("qf.notification.premium.text");
    proImg1.collapsed = isPremium;
    proImg1.setAttribute('tooltiptext', theText.replace ("{1}", "[" + isRecursive.label + "]"));    
  },
  
  load: async function load() {
    let dropdownCount = 0;
    // get important state info from background
    await QuickFolders.Util.init();
    // add an event listener for changes:
    window.addEventListener("QuickFolders.BackgroundUpdate", this.updatePremiumFeatures.bind(this));
    
		const util = QuickFolders.Util,
		      ADVANCED_FLAGS = this.ADVANCED_FLAGS || util.ADVANCED_FLAGS;
		
    function appendIdentity(dropdown, id, account) {
      try {
        util.logDebugOptional('identities', 
          'Account: ' + (account ? account.key : '0') + '...\n'  
          + 'appendIdentity [' + dropdownCount + ']\n'
          + '  identityName = ' + (id ? id.identityName : 'empty') + '\n'
          + '  fullName = ' + (id ? id.fullName : 'empty') + '\n' 
          + '  email = ' + (id.email ? id.email : 'empty'));
        let menuitem = document.createXULElement ? document.createXULElement('menuitem') : document.createElement('menuitem');
				if (id==-1) {
					let defaultLabel = elem('defaultAccountAddress');
					menuitem.setAttribute("value", "default");
					menuitem.setAttribute("label", defaultLabel.getAttribute('value'));
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
					menuitem.setAttribute("value", id.key);
					menuitem.setAttribute("accountKey", account.key);
					menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
				}
        dropdown.appendChild(menuitem);
      }
      catch (ex) {
        util.logException('appendIdentity failed: ', ex);
      }
    }
		
		
		window.addEventListener('dialogaccept', function () { QuickFolders.AdvancedTab.accept(); });
		window.addEventListener('dialogextra1', function (event) { QuickFolders.AdvancedTab.apply(); });
		window.addEventListener('dialogextra2', function (event) { QuickFolders.AdvancedTab.defaults(); });
		
    let entry = this.entry || QuickFolders.AdvancedTab.entry,
        elem = document.getElementById.bind(document);
    if (entry.flags) {
      let ig = elem('chkIgnoreUnread'),
          ic = elem('chkIgnoreCounts'),
					ixjQ = elem('chkHideFromQuickJump'),
          iUnread = elem('chkSetMailsUnread'),
          iss = elem('chkCustomCSS'),
          ip = elem('chkCustomPalette'),
					isRecursive = elem('chkComposerSubFolders'),
					cboIdentity = elem('mailIdentity');
      // ignore unread counts
      ig.checked = (entry.flags & ADVANCED_FLAGS.SUPPRESS_UNREAD) && true;
      // ignore all counts
      ic.checked = (entry.flags & ADVANCED_FLAGS.SUPPRESS_COUNTS) && true;
      // custom css rules
      iss.checked = (entry.flags & ADVANCED_FLAGS.CUSTOM_CSS) && true;
			// ignore from quickJump
			ixjQ.checked = (entry.flags & ADVANCED_FLAGS.IGNORE_QUICKJUMP) && true;
      // set mail to unread [Bug 26683]
      iUnread.checked = (entry.flags & ADVANCED_FLAGS.SETMAIL_UNREAD) && true;
      
      elem('txtColor').value = entry.cssColor || '';
      elem('txtColorPicker').value = elem('txtColor').value;
      elem('txtBackground').value = entry.cssBack || '';
      // custom palette
      let isPalette = (entry.flags & ADVANCED_FLAGS.CUSTOM_PALETTE) && true;
      ip.checked = isPalette;
      if (isPalette) {
        let menuList = elem('menuCustomTabPalette');
        menuList.value = entry.customPalette.toString();
      }
			// apply email settings to all child folders
			isRecursive.checked = (entry.flags & ADVANCED_FLAGS.EMAIL_RECURSIVE) && true;
    }
    this.updatePremiumFeatures();
		// Addressing
		// iterate accounts for From Address dropdown
		let cboIdentity = elem('mailIdentity'),
		    popup = cboIdentity.menupopup,
				myAccounts = util.Accounts,
				acCount = myAccounts.length;
		appendIdentity(popup, -1, 0); // not set (id0)
		util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')…');
		for (let a=0; a < myAccounts.length; a++) { 
			let ac = myAccounts[a],
			    ids = ac.identities; // array of nsIMsgIdentity 
			if (ids) {
				let idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
				util.logDebugOptional('identities', ac.key + ': iterate ' + idCount + ' identities…');
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
		
    cboIdentity.value = entry.fromIdentity || 'default'; // default - no identity, so default is chosen.

		elem('txtToAddress').value = entry.toAddress ? entry.toAddress : '';
    
    let lbl = elem('lblCategories'),
        tabHeader = elem('myHeader'),
				tabName = elem('tabName');
    lbl.value = entry.category;
    tabHeader.setAttribute('description', entry.name); // not working anymore, dialogheader is not displayed
		tabHeader.setAttribute('tooltiptext', 'URI: ' + this.folder ? this.folder.URI : QuickFolders.AdvancedTab.folder.URI);
		tabName.value = entry.name;
    
    // [mx-l10n]
    QuickFolders.Util.localize(window, {
      extra1: "btnApply", 
      extra2: "btnReset",
    });
		this.updateCSSpreview();
    
    // we wait as the width isn't correct on load
    // might be unnecessary as we react to WM_ONRESIZE
		let win = window;
    setTimeout(
      function () {   
			  QuickFolders.AdvancedTab.resize(win); 
			}
    );
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
		const util = this.MainQuickFolders.Util,
		      ADVANCED_FLAGS = util.ADVANCED_FLAGS;
		let elem = document.getElementById.bind(document),
		    entry = this.entry || QuickFolders.AdvancedTab.entry;
    function addFlag(checkboxId, setFlag) {
      let isFlagged = document.getElementById(checkboxId).checked;
      if (isFlagged) {
        flags = flags | setFlag;
      }
      return isFlagged;
    }
    
    let f = this.folder || QuickFolders.AdvancedTab.folder,
        isChange = false,
        flags = ADVANCED_FLAGS.NONE;
    
    addFlag('chkIgnoreUnread', ADVANCED_FLAGS.SUPPRESS_UNREAD);
    addFlag('chkIgnoreCounts', ADVANCED_FLAGS.SUPPRESS_COUNTS);
    addFlag('chkComposerSubFolders', ADVANCED_FLAGS.EMAIL_RECURSIVE);
		addFlag('chkHideFromQuickJump', ADVANCED_FLAGS.IGNORE_QUICKJUMP);
    addFlag('chkSetMailsUnread', ADVANCED_FLAGS.SETMAIL_UNREAD);
    if (addFlag('chkCustomCSS', ADVANCED_FLAGS.CUSTOM_CSS)) {
			elem('txtColor').value = util.sanitizeCSSvalue(elem('txtColor').value);
      entry.cssColor = elem('txtColor').value;
			elem('txtBackground').value = util.sanitizeCSSvalue(elem('txtBackground').value);
      entry.cssBack = elem('txtBackground').value;
    }
    if (addFlag('chkCustomPalette', ADVANCED_FLAGS.CUSTOM_PALETTE)) {
      entry.customPalette = elem('menuCustomTabPalette').value;
    }
    else {
      delete entry.customPalette;
    }
    
    // .. add more special properties
    
    if (flags)
      entry.flags = flags;
    else {
      if (entry.flags || entry.flags === 0) try {
        delete entry.flags; // minimize storage space.
        delete entry.cssBack;
        delete entry.cssColor;
        delete entry.customPalette;
      } catch(ex) {
        util.logException('QuickFolders.AdvancedTab.accept()', ex);
      }
    }
		
		let cboIdentity = elem('mailIdentity'),
		    fromId = cboIdentity.selectedItem.value,
				toAddress = elem('txtToAddress').value;
		if (fromId == 'default') {
			try {
				delete entry.fromIdentity; // default 'From:' identity 
			}
			catch (e) { ; }
		}
		else
			entry.fromIdentity = fromId;
		
		if (!toAddress) {
			try {
				delete entry.toAddress;
			}
			catch (e) { ; }
		}
		else
			entry.toAddress = toAddress;
		
    // refresh the model
    // QuickFolders.Interface.updateFolders(false, true);
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); 
    this.MainQuickFolders.Model.store(); 
		this.updateCSSpreview();
  } ,
  
  defaults: function defaults() {
    let elem = document.getElementById.bind(document);
    elem('chkIgnoreUnread').checked = false;
    elem('chkIgnoreCounts').checked = false;
    elem('chkHideFromQuickJump').checked = false;
    elem('chkCustomCSS').checked = false;
    elem('chkCustomPalette').checked = false;
    elem('txtColor').value = '';
    elem('txtBackground').value = '';
		elem('txtToAddress').value = '';
		elem('mailIdentity').value = 'default';
		
    this.entry.flags = this.ADVANCED_FLAGS.NONE;
    // let's close the window with apply to unclunk it
    this.accept();
    // window.close();
  } ,
  
  resize: function resize(wd) {
		const util = QuickFolders.Util;
		if (util.isDebug) debugger;
    // make sure the window is placed below the referenced Tab, but not clipped by screen edge
    let x = wd.screenX,
        y = wd.screenY,
				screen = wd.screen;
    util.logDebug('Move window: \n' +
      'Screen left, window left : ' + screen.left + ' , ' + x + '\n' +
      'Screen width             : ' + screen.width + '\n' +
      'Screen top,  window top  : ' + screen.top  + ' , '+ y + '\n' +
      'Screen height            : ' + screen.height+ '\n' +
      'Window outer width       : ' + wd.outerWidth + '\n' +
      'Right hand edge          : ' + (x + wd.outerWidth) + '\n'
      );
    let x2 = screen.width + screen.left - wd.outerWidth; // multi monitor corrections
    if (x + wd.outerWidth > screen.width + screen.left) {
      wd.moveTo(x2, y);
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
	
	updateCSSpreview: function updateCSSpreview() {
		try {
			let preview = document.getElementById('cssPreview');
			if (preview) {
				preview.style.color = document.getElementById('txtColor').value;
				preview.style.background = document.getElementById('txtBackground').value;
				preview.style.visibility = document.getElementById('chkCustomCSS').checked ? "visible" : "hidden";
			}
		} catch(ex) {;}
	} ,
	
	sanitizeCSS: function sanitizeCSS(el) {
		const util = QuickFolders.Util;
		el.value = util.sanitizeCSSvalue(el.value);
		this.updateCSSpreview();
	},	
  
  updatePicker: function updatePicker(textbox) {
    if (textbox.length) {
      document.getElementById('txtColorPicker').value = textbox.value;
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
	} ,
	
	headerClick: function headerClick(event) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
					util = QuickFolders.Util;
		let clipboardhelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
		event.stopPropagation();
		switch (event.button) {
			case 0: // default = left button
			  break;
			case 1: // middle button
			  break;
			case 2: // right button
				clipboardhelper.copyString(this.folder.URI);
			  util.slideAlert("QuickFolders", "Copied folder URI to clipboard\n" + this.folder.URI);
			  break;
		}
	}
    
}  // AdvancedTab

// initialize the dialog and do l10n
window.document.addEventListener('DOMContentLoaded', 
  QuickFolders.AdvancedTab.load.bind(QuickFolders.AdvancedTab) , 
  { once: true });
  
  