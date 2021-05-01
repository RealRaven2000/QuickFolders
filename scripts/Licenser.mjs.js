import * as crypto from './qf-crypto.mjs.js';
import {RSA} from './rsa/RSA.mjs.js';
import {log} from './qf-util.mjs.js';

const LicenseStates = {
    NotValidated: 0, // default status
    Valid: 1,
    Invalid: 2,
    Expired: 3,
    MailNotConfigured: 4,
    MailDifferent: 5,
    Empty: 6,
}

// format QF-EMAIL:DATE;CRYPTO
// example: QF-joe.bloggs@gotmail.com:2015-05-20;
function getDate(licence) {
  // get mail+date portion
  let arr = licence.split(';');
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

function getMail(licence) {
  let arr1 = licence.split(':');
  if (!arr1.length) {
    log("getMail()", "failed - no : found");
    return '';
  }
  let pos = arr1[0].indexOf('-') + 1;
  return arr1[0].substr(pos); // split off QF- or QFD-
}


export class Licenser {
    
    constructor(LicenseKey) {
      if (!LicenseKey) {
        throw new Error("No LicenseKey!");
      }
      this.LicenseKey = LicenseKey;
      this.reset();
    }
    
    reset() {
      this.ValidationStatus = LicenseStates.NotValidated;
      this.RealLicense = "";
      this.ExpiredDays = 0;

      if (this.LicenseKey.indexOf('QFD')==0) {
        this.key_type = 1; // Volume License
      } else {
        this.key_type = 0;
      }
    }
    
    get ValidationStatusDescription() {
      switch(this.ValidationStatus) {
        case LicenseStates.NotValidated: return 'Not Validated';
        case LicenseStates.Valid: return 'Valid';
        case LicenseStates.Invalid: return 'Invalid';
        case LicenseStates.Expired: return 'Invalid (expired)';
        case LicenseStates.MailNotConfigured: return 'Mail Not Configured';
        case LicenseStates.MailDifferent: return 'Mail Different';
        case LicenseStates.Empty: return 'Empty';
        default: return 'Unknown Status';
      }
    }
  
    isIdMatchedLicense(idMail, licenseMail) {
      try {
          switch(this.key_type) {
              case 0: // private license
                  return (idMail.toLowerCase() == licenseMail);
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
          log("validateLicense.isIdMatchedLicense() failed", ex);
      }
      return false;
    }
    
    getCrypto() {
      let arr = this.LicenseKey.split(';');
      if (arr.length<2) {
        log("getCrypto()","failed - no ; found");
        return null;
      }
      return arr[1];
    }
    
    // Testing purpose, may be removed
    encryptLicense () {
      log('encryptLicense - initialising with maxDigits:', this.RSA_maxDigits);
      RSA.initialise(this.RSA_maxDigits);
      // 64bit key pair
      log('encryptLicense - creating key pair object with bit length:', this.RSA_keylength);
      let key = new RSA.RSAKeyPair(
        this.RSA_encryption,
        this.RSA_decryption,
        this.RSA_modulus,
        this.RSA_keylength
      );
      log('encryptLicense - starting encryption…');
      let Encrypted = RSA.encryptedString(key, this.LicenseKey, 'OHDave');
      log('encryptLicense - finished encrypting registration key', {
        length: Encrypted.length,
        Encrypted
      });
      return Encrypted;    
    }    
    

    // Get these information from the crypto module, which is unique for each add-on.
    get RSA_encryption() {
      return ""
    }
    get RSA_decryption() {
      return crypto.getDecryption_key(this.key_type);
    }
    get RSA_modulus() {
      return crypto.getModulus(this.key_type);
    }
    get RSA_keylength() {
      return crypto.getKeyLength(this.key_type);      
    }
    get RSA_maxDigits() {
      return crypto.getMaxDigits(this.key_type);      
    }

    getClearTextMail() { 
      return getMail(this.LicenseKey);
    }
    getDecryptedMail() {
      return getMail(this.RealLicense + ":xxx");
    }
    
    getDecryptedDate() {
      return getDate(this.RealLicense + ":xxx");
    }

validate() {
    this.reset();
    log("validateLicense", { LicenseKey: this.LicenseKey });

    let encrypted = this.getCrypto();  
    if (!encrypted) {
      this.ValidationStatus = LicenseStates.Invalid;
      log('validateLicense()\n returns ', [
        this.ValidationStatusDescription,
        this.ValidationStatus,
      ]);
      return [this.ValidationStatus, ''];
    }
    
    // RSAKeyPair(encryptionExponent, decryptionExponent, modulus)
    log("RSA.initialise", this.RSA_maxDigits);
    RSA.initialise(this.RSA_maxDigits);
    log('Creating RSA key + decrypting');
    let key = new RSA.RSAKeyPair("", this.RSA_decryption, this.RSA_modulus, this.RSA_keylength);

    // verify against remainder of string
    try {
      log("get RSA.decryptedString()");
      this.RealLicense = RSA.decryptedString(key, encrypted);
      log("Decryption Complete", { RealLicense: this.RealLicense });
    } catch (ex) {
      log('RSA Decryption failed: ', ex);
    }
    
    if (!this.RealLicense) {
      this.ValidationStatus = LicenseStates.Invalid;
      log('validateLicense()\n returns ', [
        this.ValidationStatusDescription,
        this.ValidationStatus,
      ]);
      return [this.ValidationStatus, ''];
    }
    
    let decryptedDate = this.getDecryptedDate();
    // check ISO format YYYY-MM-DD
    let regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!decryptedDate.match(regEx)) {
      this.ValidationStatus = LicenseStates.Invalid;
      log('validateLicense()\n returns ', [
        this.ValidationStatusDescription,
        this.ValidationStatus,
      ]);
      return [this.ValidationStatus, this.RealLicense];
    }

    // ******* CHECK MAIL IS MATCHING ********
    let clearTextEmail = this.getClearTextMail();
    let decryptedMail = this.getDecryptedMail();
    if (clearTextEmail.toLocaleLowerCase() != decryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = LicenseStates.MailDifferent;
      log('validateLicense()\n returns ', [
        this.ValidationStatusDescription,
        this.ValidationStatus,
      ]);
      return [this.ValidationStatus, this.RealLicense];
    }

    // ******* CHECK LICENSE EXPIRY  ********
    // get current date
    let today = new Date();
    let dateString = today.toISOString().substr(0, 10);
    if (decryptedDate < dateString) {
      this.ValidationStatus = LicenseStates.Expired;
      let date1 = new Date(decryptedDate);
      this.ExpiredDays = parseInt((today - date1) / (1000 * 60 * 60 * 24)); 
      log('validateLicense()\n returns ', [
        this.ValidationStatusDescription,
        this.ValidationStatus,
      ]);
      return [this.ValidationStatus, this.RealLicense];
    }

    /* Still todo
    
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
    
    */


  return [this.ValidationStatus, this.RealLicense];
  }
    
}
  
/* Switch detectionis not part of Licencerm but UI or Logic
       if (QuickFolders.Crypto.key_type!=1) { // not currently a domain key?
         let txt = util.getBundleString("qf.prompt.switchDomainLicense", "Switch to Domain License?");
				  
         if (Services.prompt.confirm(null, "QuickFolders", txt)) {
           QuickFolders.Crypto.key_type=1; // switch to volume license
         }
       }
*/

