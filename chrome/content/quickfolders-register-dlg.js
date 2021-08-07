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

// removed UI function from QuickFolders.Licenser
var Register = {
  l10n: function() {
    QuickFolders.Util.localize(document);
    let featureComparison = document.getElementById("featureComparison");
    if (featureComparison) {
      let htmlFragment = "<label class='para' id='featureComparison'>"
        + QuickFolders.Util.getBundleString("licenseComparison")
          .replace(/\{linkStart\}/, "<a id='compLink' class='link'>")
          .replace(/\{linkEnd\}/, "</a>")
        + "</label>";
      let e = featureComparison.ownerGlobal.MozXULElement.parseXULToFragment(htmlFragment);
      
      featureComparison.parentElement.insertBefore(e, featureComparison);
      featureComparison.parentElement.removeChild(featureComparison);
      window.addEventListener("click", async (event) => {
        if (event.target.id == "compLink") {
          QuickFolders.Util.openLinkInBrowser(event,"https://quickfolders.org/premium.html#featureComparison");
        }         
      });
    } 
  },
  load: async function load() {
    await QuickFolders.Util.init();
    this.updateUI();
    this.updateLicenseUI();
    window.addEventListener("QuickFolders.BackgroundUpdate", this.updateLicenseUI.bind(this));
  },
  
  updateLicenseUI: async function updateLicenseUI() {
    const licenseInfo = QuickFolders.Util.licenseInfo,
          getElement = document.getElementById.bind(document),
          util = QuickFolders.Util;
		// for renewals, referrer is always the old license!
    let referrerTxt = getElement('referrer');
		if (licenseInfo.status=="Valid")
			referrerTxt.value = licenseInfo.licenseKey;
    
    let decryptedDate = licenseInfo.expiryDate;
    let btnProLicense = getElement('btnLicense');
    btnProLicense.label = util.getBundleString("buyProLicense.button");
    if (decryptedDate) {
			if (util.isDebug) {
				util.logDebug('Register.updateLicenseUI()\n' + 'ValidationStatus = ' + licenseInfo.description)
			}
				
      getElement('licenseDate').value = decryptedDate; // invalid ??
			if (licenseInfo.status == "Expired" || licenseInfo.status == "Valid") {
				let btnDomainLicense = getElement('btnDomainLicense'),
				    btnStdLicense = getElement('btnStdLicense');
        
				if(licenseInfo.status == "Expired") {
          switch (licenseInfo.keyType) {
            case 0: // Pro
              btnProLicense.label = util.getBundleString("qf.notification.premium.btn.renewLicense");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(0, true);');
              break;
            case 1: // Domain
              btnDomainLicense.label = util.getBundleString("qf.notification.premium.btn.renewLicense");
              btnDomainLicense.removeAttribute('oncommand');
              btnDomainLicense.setAttribute('oncommand', 'Register.goPro(1, true);');
              btnDomainLicense.classList.add('register');
              btnProLicense.classList.remove('register');
              break;
            case 2: // Standard
              btnProLicense.label = util.getBundleString("qf.notification.premium.btn.upgrade");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(3);'); // upgrade from standard
              btnProLicense.classList.add('upgrade'); // no flashing
              break;
          }
					
        }
				else { // EXTEND
					let extBtn, extText;
          switch(licenseInfo.keyType) {
            case 0:
              extBtn = btnProLicense;
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(0, true);');
              extText = util.getBundleString("qf.notification.premium.btn.extendLicense")
              break;
            case 1:
              extBtn = btnDomainLicense;
              btnProLicense.classList.remove('register'); // not flashing
              btnDomainLicense.removeAttribute('oncommand');
              btnDomainLicense.setAttribute('oncommand', 'Register.goPro(1, true);');
              extText = util.getBundleString("qf.notification.premium.btn.extendLicense");
              break;
            case 2:
              btnProLicense.label = util.getBundleString("qf.notification.premium.btn.upgrade");
              btnProLicense.removeAttribute('oncommand');
              btnProLicense.setAttribute('oncommand', 'Register.goPro(3, true);');
              extBtn = btnStdLicense;
              btnStdLicense.removeAttribute('oncommand');
              btnStdLicense.setAttribute('oncommand', 'Register.goPro(2, true);');
              extText = util.getBundleString("qf.notification.premium.btn.extendLicense")
              // check whether renewal is up within 30 days
              let today = new Date(),
                  later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
                  dateString = later.toISOString().substr(0, 10);
              
              if (!(licenseInfo.expiryDate < dateString)) { // not close to expiry yet. let's hide this path.
                let standardRow = getElement('StandardLicenseRow');
                standardRow.collapsed=true;
              }
              break;        
          }

					extBtn.label = extText;
          extBtn.classList.add("register");
					// add tooltip
					extBtn.setAttribute("tooltiptext", util.getBundleString("qf.notification.premium.btn.extendLicense.tooltip"));
				}

				// hide the "Enter License Key..." button + label
				if (licenseInfo.status == "Valid") {
					getElement('haveLicense').collapsed=true;
					getElement('btnEnterCode').collapsed=true;
				}
        getElement('licenseDate').collapsed = false;
			}
		}
    else {
      getElement('haveLicense').collapsed=false;
      getElement('btnEnterCode').collapsed=false;
      getElement('licenseDate').collapsed = true;
    }
    
    getElement('qfLicenseTerm').classList.remove('expired');
		switch(licenseInfo.status) {
			case "Expired":
			  getElement("licenseDateLabel").value = util.getBundleString("qf.register.licenseValid.expired")
				getElement("qfLicenseTerm").classList.add("expired");
			  break;
			case "Valid":
			  btnProLicense.classList.remove("register"); // remove the "pulsing effect" if license is valid.
        getElement("licenseDateLabel").value = util.getBundleString("qf.label.licenseValid");
			  break;
			case "Empty":
			case "NotValidated":
				getElement("licenseDateLabel").value = " ";
			  break;
			default: // default class=register will animate the button
        let txt = "License Status: " + licenseInfo.description;
			  getElement("licenseDateLabel").value = txt;
        util.logToConsole("Registration Problem\n" + txt + "\nDecrypted part: " + licenseInfo.decryptedPart);
        
		}
			
  } ,
  
  updateUI: async function updateUI() {
    const getElement = document.getElementById.bind(document),
          util = QuickFolders.Util,
          prefs = QuickFolders.Preferences;
        
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
        let menuitem = document.createXULElement("menuitem");
				menuitem.setAttribute("id", "id" + dropdownCount++);
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
        let idCount = ids ? ids.length : 0;
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
  
  goPro: function goPro(license_type, isRenew = false) {
    const productDetail = "https://sites.fastspring.com/quickfolders/product/quickfolders",
					prefs =  QuickFolders.Preferences,
          util = QuickFolders.Util;
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    if (util.isDebug) debugger;
    let shortOrder,
		    featureName = document.getElementById("referrer").value; // hidden field
    if (isRenew || license_type==3) {
      featureName = encodeURI(prefs.getStringPref("LicenseKey"));
    }
    switch	(license_type) {
			case 0:  // pro license
				if (isRenew) { 
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersrenew";
				}
				else // NEW
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfolders";
				
			  break;
			case 1: // domain license
        if (isRenew) { 
          shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersdomainrenewal";
        }
        else
          shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersdomain";
			  break;
			case 2: // standard license
				if (isRenew) { 
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersstdrenewal";
				}
				else
					shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfoldersstandard";
			  break;

			case 3: // upgrade standard to pro
				shortOrder = "https://sites.fastspring.com/quickfolders/product/quickfoldersupgrade"; // product to be created
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
  
  sanitizeName: function sanitizeName(name) {
    // remove bracketed stuff: "fred jones (freddy)" => "fred jones"
    let x = name.replace(/ *\([^)]*\) */g, "");
    if (x.trim)
      return x.trim();
    return x;
  },
  
  selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
        fName = Register.sanitizeName(it.getAttribute('fullName')), // not sure whether I can use this.sanitizeName
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

