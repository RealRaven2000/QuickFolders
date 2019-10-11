"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/
if (typeof ChromeUtils.import == "undefined")
	Components.utils.import('resource://gre/modules/Services.jsm'); // Thunderbird 52
else
	var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

QuickFolders.Crypto = {
  get key_type() {
    return QuickFolders.Preferences.getIntPref('licenseType');
  },
  set  key_type(t) {
    QuickFolders.Preferences.setIntPref('licenseType', t);
  },
	/* note the encryption key is private. Do not reverse engineer */
  get decryption_key() {
    switch (this.key_type) {
      case 0:  // private
        return "1a9a5c4b1cc62e975e3e10e4b5746c5de581dcfab3474d0488cb2cd10073e01b";
      case 1:  // domain
        return "68a025ffe52fd5cf9beaf0693b6e77e58278f6089f01bdac4afe965241f5cf8a5d9e25d0750091a7c8bcb3807909ddc290f00ed9ab6437d801ab1a2ac14cd5b";
      default:
        return -1; // unknown or free license
    }
  },
  get modulus() {
    switch (this.key_type) {
      case 0:  // private
        return "2e1a582ecaab7ea39580890e1db6462137c20fb8abcad9b2dad70a610011e685";
      case 1:  // domain
        return "12c127d3fb813f8bba7e863ab31c9943b76505f96cb87bfa9d4f9dc503a1bfe0c74e0057cff6ee9f3814fb90bc42207fdd908fbdb00cbf9a8f8c53dc7c4ed7b5";
      default:
        return -1; // unknown or free license
    }
  },
  get maxDigits() {
    switch (this.key_type) {
      case 0:  // private
        return 35;
      case 1:  // domain
        return 67;
      default:
        return 0; // unknown or free license
    }
  },
  get keyLength() {
    switch (this.key_type) {
      case 0:  // private
        return 256;
      case 1:  // domain
        return 512;
      default:
        return 0; // unknown or free license
    }
  }
};

QuickFolders.Licenser = {
  LicenseKey: '',  // store in preference when given
  RSA_encryption: "", // 
  get RSA_decryption() {return QuickFolders.Crypto.decryption_key;},
  get RSA_modulus()    {return QuickFolders.Crypto.modulus;},
  get RSA_keylength()  {return QuickFolders.Crypto.keyLength;},
  get MaxDigits()      {return QuickFolders.Crypto.maxDigits;},
  DecryptedMail: '',
  DecryptedDate: '',
  AllowSecondaryMails: false,
	ExpiredDays: 0,
  wasValidityTested: false, // save time do not validate again and again
  get isValidated() {
    return (this.ValidationStatus == this.ELicenseState.Valid);
  },
	get isExpired() {
		let key = QuickFolders.Preferences.getStringPref('LicenseKey');
		if (!key) return false;
		if (this.ValidationStatus == this.ELicenseState.NotValidated)
			this.validateLicense(key);
    return (this.ValidationStatus == this.ELicenseState.Expired);
	},
  ValidationStatus: 0,
  // enumeration for Validated state
  ELicenseState: {
    NotValidated: 0, // default status
    Valid: 1,
    Invalid: 2,
    Expired: 3,
    MailNotConfigured: 4,
    MailDifferent: 5,
    Empty: 6
  },
  
  licenseDescription: function licenseDescription(status) {
    const ELS = this.ELicenseState;
    switch(status) {
      case ELS.NotValidated: return 'Not Validated';
      case ELS.Valid: return 'Valid';
      case ELS.Invalid: return 'Invalid';
      case ELS.Expired: return 'Invalid (expired)';
      case ELS.MailNotConfigured: return 'Mail Not Configured';
      case ELS.MailDifferent: return 'Mail Different';
      case ELS.Empty: return 'Empty';
      default: return 'Unknown Status';
    }
  },
  
  showDialog: function showDialog(featureName) {
		let params = {inn:{referrer:featureName, instance: QuickFolders}, out:null};
    window.openDialog('chrome://quickfolders/content/register.xul','quickfolders-register','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',QuickFolders,params).focus();
  } ,
  
  accept: function accept() {
  
  } ,
  
  cancel: function cancel() {
  
  } ,
  
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
    
		if (window.arguments && window.arguments[1].inn.referrer) {
      let ref = getElement('referrer');
      ref.value = window.arguments[1].inn.referrer;
    }
		// prepare renew license button?
    let decryptedDate = licenser ? licenser.DecryptedDate : '';
    if (decryptedDate) {
			if (util.isDebug) {
				util.logDebug('QuickFolders.Licenser.load()\n' + 'ValidationStatus = ' + licenser.licenseDescription(licenser.ValidationStatus))
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
				btnLicense.setAttribute('oncommand', 'QuickFolders.Licenser.goPro(2);');
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
        fName = this.sanitizeName(it.getAttribute('fullName')),
        email = it.getAttribute('value'),
        names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names.length > 1 ? names[names.length-1] : "";
    document.getElementById('email').value = email;
  } ,
  
  goPro: function goPro(license_type) {
    const productDetail = "http://sites.fastspring.com/quickfolders/product/quickfolders",
					prefs =  QuickFolders.Preferences,
          util = QuickFolders.Util;
    // redirect to registration site; pass in the feature that brought user here
    // short order process
    if (util.isDebug) debugger;
    let shortOrder,
		    addQuery = '',
				featureName = document.getElementById('referrer').value; // hidden field
    switch	(license_type) {
			case 0:  // personal license
				shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfolders";
			  break;
			case 1: // domain license
				shortOrder = "http://sites.fastspring.com/quickfolders/instant/quickfoldersdomain";
			  break;
			case 2: // license renewal
				if (QuickFolders.Crypto.key_type==1) { // domain license!
					shortOrder = "http://sites.fastspring.com/quickfolders/instant/quickfoldersdomainrenewal";
				}
				else
					shortOrder = "http://sites.fastspring.com/quickfolders/instant/quickfoldersrenew";
				// addQuery = "&renewal=" + encodeURI(prefs.getStringPref('LicenseKey'));
				featureName = encodeURI(prefs.getStringPref('LicenseKey'));
				// should we autoselect the correct email address?
			  break;
		}
    // view product detail
    let firstName = document.getElementById('firstName').value,
        lastName = document.getElementById('lastName').value,
        email = document.getElementById('email').value,
        url = shortOrder 
            + "?contact_fname=" + firstName 
            + "&contact_lname=" + lastName 
						+ addQuery
            + "&contact_email=" + email;
        
    let queryString = '';  // action=adds
        
    if (featureName) {
      queryString = "&referrer=" + featureName;
    }
    util.openLinkInBrowser(null, url + queryString);
    window.close();
  }  ,

   /* obsolete form submission from code */
  postForm  : function postForm_obsolete(util) {
    let url ="http://sites.fastspring.com/quickfolders/product/quickfolders?action=order",
        oReq;
    
    if (util.PlatformVersion >=16.0) {
      const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");    
      oReq = new XMLHttpRequest();
    }
    else {
      const { XMLHttpRequest_Legacy } = Components.classes["@mozilla.org/appshell/appShellService;1"]
                                       .getService(Components.interfaces.nsIAppShellService)
                                       .hiddenDOMWindow;
      oReq = new XMLHttpRequest_Legacy();
    }
    // oReq.onload = reqListener;
    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);  
  } ,
  
  premiumInfo: function premiumInfo(event) {
    QuickFolders.Util.openURL(event,'http://quickfolders.org/premium.html');
  },
  
  // format QF-EMAIL:DATE;CRYPTO
  // example: QF-joe.bloggs@gotmail.com:2015-05-20;
  getDate: function getDate(LicenseKey) {
    // get mail+date portion
    let arr = LicenseKey.split(';');
    if (!arr.length) {
      QuickFolders.Util.logDebug('getDate() failed - no ; found');
      return ''; 
    }
    // get date portion
    let arr1=arr[0].split(':');
    if (arr1.length<2) {
      QuickFolders.Util.logDebug('getDate() failed - no : found');
      return '';
    }
    return arr1[1];
  },
  
  getMail: function getMail(LicenseKey) {
    let arr1 = LicenseKey.split(':');
    if (!arr1.length) {
      QuickFolders.Util.logDebug('getMail() failed - no : found');
      return '';
    }
    let pos = arr1[0].indexOf('-') + 1;
    return arr1[0].substr(pos); // split off QF- or QFD-
  },
  
  getCrypto: function getCrypto(LicenseKey) {
    let arr=LicenseKey.split(';');
    if (arr.length<2) {
      QuickFolders.Util.logDebug('getCrypto() failed - no ; found');
      return null;
    }
    return arr[1];
  },
  
  validateLicense: function validate(LicenseKey) {
    function logResult(parent) {
      util.logDebug ('validateLicense()\n returns ' 
                     + parent.licenseDescription(parent.ValidationStatus)
                     + '   [' + parent.ValidationStatus + ']');
    }
		
    function isIdMatchedLicense(idMail, licenseMail) {
			try {
				switch(QuickFolders.Crypto.key_type) {
					case 0: // private license
						return (idMail.toLowerCase()==licenseMail);
					case 1: // domain matching 
						// only allow one *
						if ((licenseMail.match(/\*/g)||[]).length != 1)
							return false;
						// replace * => .*
						let r = new RegExp(licenseMail.replace("*",".*"));
						let t = r.test(idMail);
						return t;
				}
			}
			catch (ex) {
				util.logException('validateLicense.isIdMatchedLicense() failed: ', ex);				
			}
      return false;
    }
    
    // extract encrypted portion after ;
    const ELS = this.ELicenseState,
          util = QuickFolders.Util,
          prefs = QuickFolders.Preferences,
          logIdentity = util.logIdentity.bind(util);
    if (prefs.isDebug) {
      util.logDebug("validateLicense(" + LicenseKey + ")");
    }
    if (!LicenseKey) {
      this.ValidationStatus = ELS.Empty;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    if (LicenseKey.indexOf('QFD')==0) {
       if (QuickFolders.Crypto.key_type!=1) { // not currently a domain key?
         let txt = util.getBundleString("qf.prompt.switchDomainLicense", "Switch to Domain License?");
				  
         if (Services.prompt.confirm(null, "QuickFolders", txt)) {
           QuickFolders.Crypto.key_type=1; // switch to volume license
         }
       }
    }
    else {
      QuickFolders.Crypto.key_type=0;
    }
    let maxDigits = QuickFolders.Crypto.maxDigits, // will be 67 for Domain License
        encrypted = this.getCrypto(LicenseKey),
        clearTextEmail = this.getMail(LicenseKey),
        RealLicense = '';
    if (!encrypted) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    // RSAKeyPair(encryptionExponent, decryptionExponent, modulus)
    if (prefs.isDebug) {
      util.logDebug("RSA.initialise(" +  maxDigits + ")");
    }
    
    QuickFolders.RSA.initialise(maxDigits);
    util.logDebug ('Creating RSA key + decrypting');
    // we do not pass encryptionComponent as we don't need it for decryption
    if (prefs.isDebug) {
      util.logDebug("new RSA.RSAKeyPair()");
    }
    let key = new QuickFolders.RSA.RSAKeyPair("", this.RSA_decryption, this.RSA_modulus, this.RSA_keylength);
    // decrypt
    // verify against remainder of string
    this.DecryptedMail = '';
    this.DecryptedDate = '';
    if (encrypted) try {
      if (prefs.isDebug) {
        util.logDebug("get RSA.decryptedString()");
      }
      RealLicense = QuickFolders.RSA.decryptedString(key, encrypted);
      this.wasValidityTested = true;
      util.logDebug ('Decryption Complete : decrypted string = ' + RealLicense);
    }
    catch (ex) {
      util.logException('RSA Decryption failed: ', ex);
    }
    if (!RealLicense) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    else {
      this.DecryptedMail = this.getMail(RealLicense + ":xxx");
      this.DecryptedDate = this.getDate(RealLicense + ":xxx");
      // check ISO format YYYY-MM-DD
      let regEx = /^\d{4}-\d{2}-\d{2}$/;
      if (!this.DecryptedDate.match(regEx)) {
        this.DecryptedDate = '';
        this.ValidationStatus = ELS.Invalid;
        logResult(this);
        return [this.ValidationStatus, RealLicense];
      }
    }
    if (clearTextEmail.toLocaleLowerCase() != this.DecryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = ELS.MailDifferent;
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* CHECK LICENSE EXPIRY  ********
    // get current date
    let today = new Date(),
        dateString = today.toISOString().substr(0, 10);
    if (this.DecryptedDate < dateString) {
      this.ValidationStatus = ELS.Expired;
			let date1 = new Date(this.DecryptedDate);
			this.ExpiredDays = parseInt((today - date1) / (1000 * 60 * 60 * 24)); 
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* MATCH MAIL ACCOUNT  ********
    // check mail accounts for setting
    // if not found return MailNotConfigured
    
    let isMatched = false, 
        iAccount=0,
        isDbgAccounts = prefs.isDebugOption('premium.licenser'),
        hasDefaultIdentity = false,
        myAccounts = util.Accounts,
        ForceSecondaryMail = prefs.getBoolPref('licenser.forceSecondaryIdentity');
				
		if (QuickFolders.Crypto.key_type==1) {
			ForceSecondaryMail = false;
			util.logToConsole	("Sorry, but forcing secondary email addresses with a Domain license is not supported!");
		}
    if (ForceSecondaryMail) {
      // switch for secondary email licensing
      this.AllowSecondaryMails = true;
    }
    else {
      for (let a=0; a < myAccounts.length; a++) { 
        if (myAccounts[a].defaultIdentity) {
          hasDefaultIdentity = true;
          break;
        }
      }
      if (!hasDefaultIdentity) {
        this.AllowSecondaryMails = true;
        util.logDebug("Premium License Check: There is no account with default identity!\n" +
                      "You may want to check your account configuration as this might impact some functionality.\n" + 
                      "Allowing use of secondary email addresses...");
      }
    }
    let licensedMail = this.DecryptedMail.toLowerCase();
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      iAccount++;
      if (ac.defaultIdentity && !ForceSecondaryMail) {
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] Default Identity =\n" 
          + logIdentity(ac.defaultIdentity));
				if (!ac.defaultIdentity || !ac.defaultIdentity.email) {
					if (ac.incomingServer.username != "nobody") {
						util.logDebug("Account " + ac.incomingServer.prettyName + " has no default identity!");
					}
					continue;
				}
        if (isIdMatchedLicense(ac.defaultIdentity.email, licensedMail)) {
          isMatched = true;
          break;
        }
      }
      else {
        // allow secondary matching using override switch, but not with domain licenses
        if (!this.AllowSecondaryMails
            ||  
            QuickFolders.Crypto.key_type == 1) 
          continue;  
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] secondary ids");
        // ... allow using non default identities 
        let ids = ac.identities, // array of nsIMsgIdentity 
            idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
        util.logDebugOptional("premium.licenser", "Iterating " + idCount + " ids…");
        if (ids) {
          for (let i=0; i<idCount; i++) {
            // use ac.defaultIdentity ??
            // populate the dropdown with nsIMsgIdentity details
            let id = util.getIdentityByIndex(ids, i);
            if (!id || !id.email) {
              util.logDebugOptional("premium.licenser", "Invalid nsIMsgIdentity: " + i);
              continue;
            }
            let matchMail = id.email.toLocaleLowerCase();
            if (isDbgAccounts) {
              util.logDebugOptional("premium.licenser", 
                "Account[" + ac.key + "], Identity[" + i + "] = " + logIdentity(id) +"\n"
                + "Email: [" + matchMail + "]");
            }
            if (isIdMatchedLicense(matchMail, licensedMail)) {
              isMatched = true;
              break;
            }
          }
          if (isMatched) break;
        }     
      }
    }
    if (!isMatched) {
      this.ValidationStatus = ELS.MailNotConfigured;
    }
    else {
      util.logDebug ("validateLicense() - successful.");
      this.ValidationStatus = ELS.Valid;
    }
    logResult(this);
    return [this.ValidationStatus, RealLicense];
  },
  
  /*** for test only, will be removed **/
  encryptLicense: function encryptLicense(LicenseKey, maxDigits) {
    QuickFolders.Util.logDebug ('encryptLicense - initialising with maxDigits = ' + maxDigits);
    QuickFolders.RSA.initialise(maxDigits);
    // 64bit key pair
    QuickFolders.Util.logDebug ('encryptLicense - creating key pair object, bit length = ' + this.RSA_keylength);
    let key = new QuickFolders.RSA.RSAKeyPair(
      this.RSA_encryption,
      this.RSA_decryption,
      this.RSA_modulus,
      this.RSA_keylength
    );
    QuickFolders.Util.logDebug ('encryptLicense - starting encryption…');
    let Encrypted = QuickFolders.RSA.encryptedString(key, LicenseKey, 'OHDave');
    QuickFolders.Util.logDebug ('encryptLicense - finished encrypting registration key of length: ' + Encrypted.length + '\n'
      + Encrypted);
    return Encrypted;
    
  }

};
