"use strict";
/* 
  BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/
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
    window.openDialog('chrome://quickfolders/content/register.xhtml',
      'quickfolders-register','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',
      QuickFolders,
      params).focus();
  } ,
  
  accept: function accept() {
  
  } ,
  
  sanitizeName: function sanitizeName(name) {
    // remove bracketed stuff: "fred jones (freddy)" => "fred jones"
    let x = name.replace(/ *\([^)]*\) */g, "");
    if (x.trim)
      return x.trim();
    return x;
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
            idCount = ids ? ids.length : 0;
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
