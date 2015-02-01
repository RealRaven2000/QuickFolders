"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

QuickFolders.Licenser = {
  LicenseKey: '',  // store in preference when given
  RSA_encryption: "", // 
  RSA_decryption: "1a9a5c4b1cc62e975e3e10e4b5746c5de581dcfab3474d0488cb2cd10073e01b",
  RSA_modulus:    "2e1a582ecaab7ea39580890e1db6462137c20fb8abcad9b2dad70a610011e685",
  RSA_keylength: 256,
  MaxDigits: 35,
  DecryptedMail: '',
  DecryptedDate: '',
  AllowSecondaryMails: false,
  get isValidated() {
    return (this.ValidationStatus == this.ELicenseState.Valid);
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
  
  showDialog: function showDialog(featureName) {
		let params = {inn:{referrer:featureName, instance: QuickFolders}, out:null};
    window.openDialog('chrome://quickfolders/content/register.xul','quickfolders-register','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',QuickFolders,params).focus();
  } ,
  // list of eligible accounts
  get Accounts() {
    let util = QuickFolders.Util; 
    let aAccounts=[];
    let accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager).accounts;
    if (util.Application == 'Postbox') 
      aAccounts = util.getAccountsPostbox();
    else {
      aAccounts = [];
      for (let ac in fixIterator(accounts, Components.interfaces.nsIMsgAccount)) {
        aAccounts.push(ac);
      };
    }
    return aAccounts;
  },
  
  accept: function accept() {
  
  } ,
  
  cancel: function cancel() {
  
  } ,
  
  load: function load() {
    function appendIdentity(dropdown, id, account) {
      if (!id.email) {
        QuickFolders.Util.logToConsole('Omitting account ' + id.fullName + ' - no mail address');
        return;
      }
      let menuitem = document.createElement('menuitem');
      menuitem.setAttribute("id", "id" + idCount++);
      // this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
      menuitem.setAttribute("fullName", id.fullName);
      menuitem.setAttribute("value", id.email);
      menuitem.setAttribute("accountKey", account.key);
      menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
      dropdown.appendChild(menuitem);
    }
    let idCount = 0;
    
    let util = QuickFolders.Util; 
		if (window.arguments && window.arguments[1].inn.referrer) {
      let ref = document.getElementById('referrer');
      ref.value = window.arguments[1].inn.referrer;
    }
    
    // iterate accounts
    let idSelector = document.getElementById('mailIdentity');
    let popup = idSelector.menupopup;
    for each (let ac in this.Accounts) { 
      if (ac.defaultIdentity) {
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      let ids = ac.identities; // array of nsIMsgIdentity 
      if (ids) {
        for (let i=0; i<ids.length; i++) {
          // use ac.defaultIdentity ??
          // populate the dropdown with nsIMsgIdentity details
          let id = ids.queryElementAt(i, Components.interfaces.nsIMsgIdentity);
          if (!id) continue;
          appendIdentity(popup, id, ac);
        }
      }      
    }
    // select first item
    idSelector.selectedIndex = 0;
    this.selectIdentity(idSelector);
    
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
    let it = element.selectedItem;
    let fName = this.sanitizeName(it.getAttribute('fullName'));
    let email = it.getAttribute('value');
    let names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names[names.length-1];
    document.getElementById('email').value = email;
  } ,
  
  goPro: function goPro() {
    // redirect to registration site; pass in the feature that brought user here
    let url;
    // short order process
    const shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfolders";
    // view product detail
    const productDetail = "http://sites.fastspring.com/quickfolders/product/quickfolders";
    let firstName = document.getElementById('firstName').value;
    let lastName = document.getElementById('lastName').value;
    let email = document.getElementById('email').value;
    let util = QuickFolders.Util; 
    
    url = shortOrder 
        + "?contact_fname=" + firstName 
        + "&contact_lname=" + lastName 
        + "&contact_email=" + email;
        
    let queryString = '';  // action=adds
    let featureName = document.getElementById('referrer').value;
    if (featureName) {
      queryString = "&referrer=" + featureName;
    }
    alert("The web shop is still work in progress - it will be ready for your order when the full version of QuickFolders Pro is released");
    util.openLinkInBrowser(null, url + queryString);
    window.close();
  }  ,

   /* obsolete form submission from code */
  postForm  : function postForm_obsolete(util) {
    let url ="http://sites.fastspring.com/quickfolders/product/quickfolders?action=order";
    let oReq;
    
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
    QuickFolders.Util.openURL(event,'http://quickfolders.mozdev.org/premium.html');
  },
  
  // format QF-EMAIL:DATE;CRYPTO
  // example: QF-joe.bloggs@gotmail.com:2015-05-20;
  getDate: function getDate(LicenseKey) {
    // get mail+date portion
    let arr = LicenseKey.split(';');
    if (!arr.length)
      return null; 
    // get date portion
    let arr1=arr[0].split(':');
    if (arr1.length<2)
      return null;
    return arr1[1];
  },
  
  getMail: function getMail(LicenseKey) {
    let arr1 = LicenseKey.split(':');
    if (!arr1.length)
      return null;
    return arr1[0].substr(3); // split off QF-
  },
  
  getCrypto: function getCrypto(LicenseKey) {
    let arr=LicenseKey.split(';');
    if (arr.length<2)
      return null;
    return arr[1];
  },
  
  validateLicense: function validate(LicenseKey, maxDigits) {
    // extract encrypted portion after ;
    const ELS = this.ELicenseState;
    if (!LicenseKey) {
      this.ValidationStatus = ELS.Empty;
      return [this.ValidationStatus, ''];
    }
    let encrypted = this.getCrypto(LicenseKey);
    let clearTextEmail = this.getMail(LicenseKey);
    let clearTextDate = this.getDate(LicenseKey);
    let RealLicense = '';
    if (!encrypted) {
      this.ValidationStatus = ELS.Invalid;
      return [this.ValidationStatus, ''];
    }
    // RSAKeyPair(encryptionExponent, decryptionExponent, modulus)
    QuickFolders.RSA.initialise(maxDigits);
    QuickFolders.Util.logDebug ('Creating RSA key + decrypting');
    // we do not pass encryptionComponent as we don't need it for decryption
    let key = new QuickFolders.RSA.RSAKeyPair("", this.RSA_decryption, this.RSA_modulus, this.RSA_keylength);
    // decrypt
    // verify against remainder of string
    this.DecryptedMail = '';
    this.DecryptedDate = '';
    if (encrypted) try {
      RealLicense = QuickFolders.RSA.decryptedString(key, encrypted);
      QuickFolders.Util.logDebug ('Decryption Complete : decrypted string = ' + RealLicense);
    }
    catch (ex) {
      QuickFolders.Util.logException('RSA Decryption failed: ', ex);
    }
    if (!RealLicense) {
      this.ValidationStatus = ELS.Invalid;
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
        return [this.ValidationStatus, RealLicense];
      }
    }
    if (clearTextEmail.toLocaleLowerCase() != this.DecryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = ELS.MailDifferent;
      return [this.ValidationStatus, RealLicense];
    }
    // ******* CHECK LICENSE EXPIRY  ********
    // get current date
    let today = new Date();
    let dateString = today.toISOString().substr(0, 10);
    if (this.DecryptedDate < dateString) {
      this.ValidationStatus = ELS.Expired;
      return [this.ValidationStatus, RealLicense];
    }
    // ******* MATCH MAIL ACCOUNT  ********
    // check mail accounts for setting
    // if not found return MailNotConfigured
    let isMatched = false;
    for each (let ac in this.Accounts) { 
      if (ac.defaultIdentity) {
        if (ac.defaultIdentity.email.toLowerCase()==this.DecryptedMail.toLowerCase()) {
          isMatched = true;
          break;
        }
      }
      else {
        if (!this.AllowSecondaryMails) continue;
        // ... allow using non default identities 
        // we might protect this execution branch 
        // with a config preference!
        let ids = ac.identities; // array of nsIMsgIdentity 
        if (ids) {
          for (let i=0; i<ids.length; i++) {
            // use ac.defaultIdentity ??
            // populate the dropdown with nsIMsgIdentity details
            let id = ids.queryElementAt(i, Components.interfaces.nsIMsgIdentity);
            if (!id) continue;
            if (id.email.toLowerCase()==this.DecryptedMail.toLowerCase()) {
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
      this.ValidationStatus = ELS.Valid;
    }
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
    QuickFolders.Util.logDebug ('encryptLicense - starting encryption...');
    let Encrypted = QuickFolders.RSA.encryptedString(key, LicenseKey, 'OHDave');
    QuickFolders.Util.logDebug ('encryptLicense - finished encrypting registration key of length: ' + Encrypted.length + '\n'
      + Encrypted);
    return Encrypted;
    
  }

}
