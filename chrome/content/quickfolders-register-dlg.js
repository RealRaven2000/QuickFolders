"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
  
*/

/* [mx-l10n] This module handles front-end code for the licensing dialog  */

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

// removed UI functionde from QuickFolders.Licenser
var Register = {
  l10n: function() {
    QuickFolders.Util.localize(document);
  },
  load: function load() {
    const getElement = document.getElementById.bind(document),
          util = QuickFolders.Util,
					prefs = QuickFolders.Preferences,
					licenser = util.Licenser,
          ELS = licenser.ELicenseState;
        
    let dropdownCount = 0;
    function appendIdentity(dropdown, id, account) {
      if (!id) {
        util.logDebug('appendIdentity failed for account = ' + account ? account.key : 'unknown');
      }
      try {
        util.logDebugOptional('identities', 
          'Account: ' + account.key + '...\n'  
          + 'appendIdentity [' + dropdownCount + ']\n'
          + '  identityName = ' + (id ? id.identityName : 'empty') + '\n'
          + '  fullName = ' + (id ? id.fullName : 'empty') + '\n' 
          + '  email = ' + (id.email ? id.email : 'empty'));					
        if (!id.email) {
          util.logToConsole('Omitting account ' + id.fullName + ' - no mail address');
          return;
        }
        let menuitem = document.createXULElement ? document.createXULElement('menuitem') : document.createElement('menuitem');
				menuitem.setAttribute("id", "id" + dropdownCount++);
				// this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
				menuitem.setAttribute("fullName", id.fullName);
				menuitem.setAttribute("value", id.email);
				menuitem.setAttribute("accountKey", account.key);
				menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
        dropdown.appendChild(menuitem);
      }
      catch (ex) {
        util.logException('appendIdentity failed: ', ex);
      }
    }
    
    
    
		if (window.arguments && window.arguments.length>1 && window.arguments[1].inn.referrer) {
      let ref = getElement('referrer');
      ref.value = window.arguments[1].inn.referrer;
    }
		// prepare renew license button?
    let decryptedDate = licenser ? licenser.DecryptedDate : '';
    if (decryptedDate) {
			if (util.isDebug) {
				util.logDebug('Register.load()\n' + 'ValidationStatus = ' + licenser.licenseDescription(licenser.ValidationStatus))
				debugger;
			}
			if (licenser.ValidationStatus == ELS.NotValidated) {
				licenser.validateLicense(prefs.getStringPref('LicenseKey'));
				util.logDebug('Re-validated.\n' + 'ValidationStatus = ' + licenser.licenseDescription(licenser.ValidationStatus))
			}
				
      getElement('licenseDate').value = decryptedDate; // invalid ??
			if (licenser.isExpired || licenser.isValidated) {
				let btnLicense = getElement('btnLicense');
				if(licenser.isExpired)
					btnLicense.label = util.getBundleString("qf.notification.premium.btn.renewLicense", "Renew License!");
				else {
					btnLicense.label = util.getBundleString("qf.notification.premium.btn.extendLicense", "Extend License!");
					// add tooltip
					btnLicense.setAttribute('tooltiptext',
					  util.getBundleString("qf.notification.premium.btn.extendLicense.tooltip", 
						  "This will extend the current license date by 1 year. It's typically cheaper than a new license."));
				}

				btnLicense.removeAttribute('oncommand');
				btnLicense.setAttribute('oncommand', 'Register.goPro(2);');
				btnLicense.classList.add('expired');
				// hide the "Enter License Key..." button + label
				if (!licenser.isExpired) {
					getElement('haveLicense').collapsed=true;
					getElement('btnEnterCode').collapsed=true;
				}
			}
		}
    else
      getElement('licenseDate').collapsed = true;
		
		switch(licenser.ValidationStatus) {
			case ELS.Expired:
			  getElement('licenseDateLabel').value = util.getBundleString("qf.register.licenseValid.expired","Your license expired on:")
				getElement('qfLicenseTerm').classList.add('expired');
			  break;
			case ELS.Valid:
			  getElement('btnLicense').classList.remove('register'); // remove the "pulsing effect" if license is valid.
			  break;
			case ELS.Empty:
			case ELS.NotValidated:
				getElement('licenseDateLabel').value = " ";
			  break;
			default: // default class=register will animate the button
			  getElement('licenseDateLabel').value = licenser.licenseDescription(licenser.ValidationStatus) + ":";
		}
			

    // iterate accounts
    let idSelector = getElement('mailIdentity'),
        popup = idSelector.menupopup,
        myAccounts = util.Accounts,
        acCount = myAccounts.length;
    util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')…');
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      if (ac.defaultIdentity) {
        util.logDebugOptional('identities', ac.key + ': appending default identity…');
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      let ids = ac.identities; // array of nsIMsgIdentity
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
    // select first item
    idSelector.selectedIndex = 0;
    this.selectIdentity(idSelector);
		if (prefs.isDebugOption('premium.licenser')) getElement('referrer').collapsed=false;
    
  } ,
  
  cancel: function cancel() {
  
  } ,
  
  goPro: function goPro(license_type) {
    const productDetail = "https://sites.fastspring.com/quickfolders/product/quickfolders",
					prefs =  QuickFolders.Preferences,
          util = QuickFolders.Util;
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    if (util.isDebug) debugger;
    let shortOrder,
		    featureName = document.getElementById('referrer').value; // hidden field
    switch	(license_type) {
			case 0:  // personal license
				shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfolders";
			  break;
			case 1: // domain license
				shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersdomain";
			  break;
			case 2: // license renewal
				if (QuickFolders.Crypto.key_type==1) { // domain license!
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersdomainrenewal";
				}
				else
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersrenew";
				featureName = encodeURI(prefs.getStringPref('LicenseKey'));
				// should we autoselect the correct email address?
			  break;
		}
    // view product detail
    let firstName = document.getElementById('firstName').value,
        lastName = document.getElementById('lastName').value,
        email = document.getElementById('email').value,
        addQuery = featureName ?  "&referrer=" + featureName : "",
        url = shortOrder 
            + "?contact_fname=" + firstName 
						+ addQuery
            + "&contact_lname=" + lastName 
            + "&contact_email=" + email;
        
    util.openLinkInBrowser(null, url);
    window.close();
  }  ,

   /* obsolete form submission from code */
  postForm  : function postForm_obsolete(util) {
    let url ="https://sites.fastspring.com/quickfolders/product/quickfolders?action=order",
        oReq;
    
    const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");    
    oReq = new XMLHttpRequest();
    // oReq.onload = reqListener;
    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);  
  } ,
  
  premiumInfo: function premiumInfo(event) {
    QuickFolders.Util.openURL(event,'https://quickfolders.org/premium.html');
  },
  
  selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
        fName = QuickFolders.Licenser.sanitizeName(it.getAttribute('fullName')),
        email = it.getAttribute('value'),
        names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names.length > 1 ? names[names.length-1] : "";
    document.getElementById('email').value = email;
  } ,
  
    
  
}



// initialize the dialog and do l10n
//	onload="var load=Register.load.bind(Register); load();"
window.document.addEventListener('DOMContentLoaded', 
  Register.l10n.bind(Register) , 
  { once: true });
window.addEventListener('load', 
  Register.load.bind(Register) , 
  { once: true });

//	ondialogcancel="var cancelRegister.cancel.bind(Register); cancel();"
window.addEventListener('dialogcancel', 
  function () { Register.cancel(); }
);

