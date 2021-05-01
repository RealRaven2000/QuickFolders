import {RSA} from './rsa/RSA.mjs.js';
import {log} from './qf-util.mjs.js';

//to log:     if (prefs.isDebug) {


class Validator {
    
    constructor(LicenseKey) {
        this.LicenseKey = LicenseKey;
    }
    
    get licenseDescription() {
    }
    
    get ValidationStatus() {
    }
    
    // format QF-EMAIL:DATE;CRYPTO
    // example: QF-joe.bloggs@gotmail.com:2015-05-20;
    getDate() {
      // get mail+date portion
      let arr = this.LicenseKey.split(';');
      if (!arr.length) {
        log("getDate()", "failed - no ; found");
        return ""; 
      }
      // get date portion
      let arr1=arr[0].split(':');
      if (arr1.length<2) {
        log("getDate()", "failed - no : found");
        return '';
      }
      return arr1[1];
    }
  
    getMai() {
      let arr1 = this.LicenseKey.split(':');
      if (!arr1.length) {
        log("getMail()", "failed - no : found");
        return '';
      }
      let pos = arr1[0].indexOf('-') + 1;
      return arr1[0].substr(pos); // split off QF- or QFD-
    }
  
    getCrypto() {
      let arr=LicenseKey.split(';');
      if (arr.length<2) {
        log("getCrypto()","failed - no ; found");
        return null;
      }
      return arr[1];
    }
    
    encryptLicense (maxDigits) {
      log('encryptLicense - initialising with maxDigits:', maxDigits);
      QuickFolders.RSA.initialise(maxDigits);
      // 64bit key pair
      log('encryptLicense - creating key pair object with bit length:', this.RSA_keylength);
      let key = new QuickFolders.RSA.RSAKeyPair(
        this.RSA_encryption,
        this.RSA_decryption,
        this.RSA_modulus,
        this.RSA_keylength
      );
      log('encryptLicense - starting encryption…');
      let Encrypted = QuickFolders.RSA.encryptedString(key, this.LicenseKey, 'OHDave');
      log('encryptLicense - finished encrypting registration key', {
        length: Encrypted.length,
        Encrypted
      });
      return Encrypted;    
    }    
    
    get RSA_decryption() {
    }
    
    get RSA_modulus() {
    }
    
    get RSA_keylength() {
    }
    
    get DecryptedMail() {
    }
    
    get DecryptedDate() {
    }
    
}
  
export async function validate(LicenseKey) {
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
    log("validateLicense", { LicenseKey});


    if (!LicenseKey) {
      this.ValidationStatus = ELS.Empty;
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
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
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
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
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
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
        log('validateLicense()\n returns ', [
          this.licenseDescription(parent.ValidationStatus),
          this.ValidationStatus,
        ]);
        return [this.ValidationStatus, RealLicense];
      }
    }
    if (clearTextEmail.toLocaleLowerCase() != this.DecryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = ELS.MailDifferent;
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
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
      log('validateLicense()\n returns ', [
        this.licenseDescription(parent.ValidationStatus),
        this.ValidationStatus,
      ]);
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
    log('validateLicense()\n returns ', [
      this.licenseDescription(parent.ValidationStatus),
      this.ValidationStatus,
    ]);
    return [this.ValidationStatus, RealLicense];
  }
  