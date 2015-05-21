"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

Components.utils.import('resource://gre/modules/Services.jsm');

var QuickFolders_TabURIregexp = {
	get _thunderbirdRegExp() {
		delete this._thunderbirdRegExp;
		return this._thunderbirdRegExp = new RegExp("^http://quickfolders.mozdev.org/");
	}
};


QuickFolders.Options = {
	optionsMode : "",  // filter out certain pages (for support / help only)
	message : "",      // alert to display on dialog opening (for certain update cases); make sure to clear out after use!
	QF_PREF_LAST : 5,    // last tab which can be filtered out
  QF_PREF_LICENSE : 5, // always show this one
	QF_PREF_SUPPORT : 4,
	QF_PREF_HELP : 3,
	QF_PREF_LAYOUT : 2,
	QF_PREF_ADVANCED : 1,
	QF_PREF_GENERAL : 0,

	rememberLastTab: function rememberLastTab() {
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.notifyObservers(null, "quickfolders-options-saved", null);
	} ,
	
	accept: function accept() {
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly" || this.optionsMode=="licenseKey")
			return; // do not store any changes!
    let getElement = document.getElementById.bind(document);
		// persist colors
		try {
			QuickFolders.Preferences.setCurrentThemeId(getElement("QuickFolders-Theme-Selector").value);

			QuickFolders.Preferences.setUserStyle("ActiveTab","background-color",
							getElement("activetab-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("ActiveTab","color",
							getElement("activetab-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("InactiveTab","background-color",
							getElement("inactive-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("InactiveTab","color",
							getElement("inactive-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("HoveredTab","background-color",
							getElement("hover-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("HoveredTab","color",
							getElement("hover-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("DragTab","background-color",
							getElement("dragover-colorpicker").color);
			QuickFolders.Preferences.setUserStyle("DragTab","color",
							getElement("dragover-fontcolorpicker").color);

			QuickFolders.Preferences.setUserStyle("Toolbar","background-color",
							getElement("toolbar-colorpicker").color);
			QuickFolders.Preferences.setIntPref('style.corners.customizedTopRadiusN',
							getElement("QuickFolders-Options-CustomTopRadius").value);
			QuickFolders.Preferences.setIntPref('style.corners.customizedBottomRadiusN',
							getElement("QuickFolders-Options-CustomBottomRadius").value);

			// QuickFolders.Interface.setPaintButtonColor(-1);
		}
		catch(e) {
			Services.prompt.alert(null,"QuickFolders","Error in QuickFolders:\n" + e);
		};
		this.rememberLastTab();
		let tabbox = getElement("QuickFolders-Options-Tabbox");
		QuickFolders.Preferences.setIntPref('lastSelectedOptionsTab', tabbox.selectedIndex);
	} ,
	
	close: function close() {
		// let's remember the last open tab on cancel as well
		this.rememberLastTab(); 
	},

	/*********************
	 * preparePreviewTab() 
	 * paints a preview tab on the options window
	 * collapses or shows the background color picker accordingly
	 * @colorPickerId: [optional] color picker for plain coloring - this is hidden when palette is used
	 * @preference: [optional] pull palette entry from this preference, ignored when paletteColor is passed
	 * @previewId: id of target element (preview tab)
	 * @paletteType: -1 {as standard tab} 0 none 1 plastic 2 pastel ...
	 * @paletteColor: [optional] palette index; 0=no styling
	 */
	preparePreviewTab: function preparePreviewTab(colorPickerId, preference, previewId, paletteColor, paletteType) {
		let wd = window.document,
		    previewTab = wd.getElementById(previewId),
		    colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;
		
		// Address [Bug 25589] - when color is set from a drop down, the preference wasn't transmitted leading to wrong palette (always 1)
		if (!preference) {  
			switch(previewId) {
			  case 'inactivetabs-label':
					preference = 'style.InactiveTab.';
					break;
			  case 'activetabs-label':
					preference = 'style.ActiveTab.';
					break;
			  case 'hoveredtabs-label':
					preference = 'style.HoveredTab.';
					break;
			  case 'dragovertabs-label':
					preference = 'style.DragOver.';
					break;
			}
		}
		let paletteKey = (typeof paletteType === 'undefined') ? QuickFolders.Preferences.getIntPref(preference + 'paletteType') : paletteType,
		    paletteClass = QuickFolders.Interface.getPaletteClassToken(paletteKey);
		
		
		if (paletteKey) { // use a palette
			let paletteIndex = (typeof paletteColor === 'undefined' || paletteColor === null) 
			                   ? QuickFolders.Preferences.getIntPref(preference + 'paletteEntry') :
			                   paletteColor;
												 
			// hide the color picker when not striped
			if (colorPicker) {
				if (colorPickerId=='inactive-colorpicker') {
					if (QuickFolders.Preferences.ColoredTabStyle==QuickFolders.Preferences.TABS_STRIPED)
						paletteIndex = '' + paletteIndex + 'striped';
				}
				else
					colorPicker.collapsed = true;
			}
			
			previewTab.className = 'qfTabPreview col' + paletteIndex + paletteClass;
		}
		else {
			previewTab.className = 'qfTabPreview';
		  if (colorPicker) {
				colorPicker.collapsed = false; // paletteKey = 0  ->  no palette
        let transcol =
          (previewId=='inactivetabs-label') 
            ? this.getTransparent(colorPicker.color, QuickFolders.Preferences.getBoolPref("transparentButtons"))
            : colorPicker.color;
				previewTab.style.backgroundColor = transcol;
      }
			
		}
	} ,
	
  getTransparent: function getTransparent(color, transparent) {
    return QuickFolders.Util.getRGBA(color, transparent ? 0.25 : 1.0);
  },
  
  stripedSupport: function stripedSupport(paletteType) {
    switch(parseInt(paletteType)) {
      case 1: // Standard Palette
        return true;
      case 2: // Pastel Palette
        return true;
      default:
        return false;
    }
  } ,
  
	load: function load() {
		let util = QuickFolders.Util;
    // version number must be copied over first!
		if (window.arguments && window.arguments[1].inn.instance) {
			// QuickFolders = window.arguments[1].inn.instance; // avoid creating a new QuickFolders instance, reuse the one passed in!!
			util.mExtensionVer = window.arguments[1].inn.instance.Util.Version;
		}
		let version = util.Version,
        wd = window.document,
        getElement = wd.getElementById.bind(wd);
		
    util.logDebugOptional('options', 'QuickFolders.Options.load()');
		if (window.arguments) {
			try {
				this.optionsMode = window.arguments[1].inn.mode;
				// force selection of a certain pane (-1 ignores)
				if (this.optionsMode >= 0)
					QuickFolders.Preferences.setIntPref('lastSelectedOptionsTab', this.optionsMode);
			}
			catch(e) {;}
    }
    
    // convert from string "24px" to number "24"
    let minToolbarHeight = QuickFolders.Preferences.getCharPrefQF('toolbar.minHeight'),
        mT = parseInt(minToolbarHeight);
    if (minToolbarHeight.indexOf('px' > 0)) {
      QuickFolders.Preferences.setCharPrefQF('toolbar.minHeight', mT.toString()) 
    }
    else if (minToolbarHeight.indexOf('em' > 0)) {
      // convert to px based on 12px default size (might be wrong for Mac+Linux)
      QuickFolders.Preferences.setCharPrefQF('toolbar.minHeight', (mT*12).toString()) ;  // 12 px default font size.
    }


		if (version=="") version='version?';
    // Error: TypeError: 'getElementById' called on an object that does not implement interface Document.
		getElement("qf-options-header-description").setAttribute("value", version);
		let tabbox = getElement("QuickFolders-Options-Tabbox");
        
		
    /*****  License  *****/
    // licensing tab - we also need a "renew license"  label!
    util.logDebugOptional('options', 'QuickFolders.Options.load - check License...');
    let regBtn = util.getBundleString("qf.notification.premium.btn.getLicense", "Get License!");
    getElement("btnLicense").label=regBtn;
    // validate License key
    QuickFolders.Licenser.LicenseKey = QuickFolders.Preferences.getCharPrefQF('LicenseKey');
    getElement('txtLicenseKey').value = QuickFolders.Licenser.LicenseKey;
    if (QuickFolders.Licenser.LicenseKey) {
      this.validateLicense(false);
    }
    
    /*****  Help / Support Mode  *****/
		// hide other tabs
    let earlyExit = false;
		if (this.optionsMode=="helpOnly" || this.optionsMode=="supportOnly" || this.optionsMode=="licenseKey") {
      util.logDebugOptional('options', 'QuickFolders.Options.load - Single Tab Mode!');
			if (tabbox) {
				let keep = [];
				switch(this.optionsMode) {
					case "helpOnly":
						keep.push(this.QF_PREF_HELP);
						break;
					case "supportOnly":
						keep.push(this.QF_PREF_SUPPORT);
						break;
          case "licenseKey":
						keep.push(this.QF_PREF_LICENSE);
            break;
				}
				for (let i=this.QF_PREF_LAST; i>=0; i--) {
					if (keep.indexOf(i)<0) {
            let panel = tabbox.tabpanels.children[i];
            util.logDebugOptional('options', 'collapsing panel: ' + panel.id + '...');
            panel.collapsed = true;
						// tabbox.tabpanels.removeChild(panel);
            tabbox.tabs.getItemAtIndex(i).collapsed = true; // removeItemAt();
          }
				}
			}
			earlyExit = true; // we do not set any values!
		}
		
    switch(this.optionsMode) {
      case "licenseKey":
        tabbox.selectedPanel = getElement('QuickFolders-Pro');
        break;
      case "helpOnly":
        tabbox.selectedPanel = getElement('QuickFolders-Help');
        break;
      case "supportOnly":
        tabbox.selectedPanel = getElement('QuickFolders-Support');
        break;
    }
    
    let EncryptionKey = QuickFolders.Preferences.getCharPrefQF('premium.encryptionKey');
    if (EncryptionKey) {
      getElement('boxKeyGenerator').collapsed = false;
      QuickFolders.Licenser.RSA_encryption = EncryptionKey;
    }
    
    if (earlyExit) return;
    
    util.logDebugOptional('options', 'QuickFolders.Options.load - continue with palette + bling initialisation');
    /***** Menu Items / Labels *****/
		// bundle strings
		// getElement("chkShowFolderMenuButton").label = util.getBundleString("qfFolderPopup");
		this.setCurrentToolbarBackground(QuickFolders.Preferences.getCharPrefQF('currentFolderBar.background.selection'), false);  

    /*****  Bling + Stuff  *****/
		// initialize colorpickers
		try {
      this.initBling(tabbox);
		}
		catch(e) {
			//alert("Error in QuickFolders.Options.load(initBling()):\n" + e);
			Services.prompt.alert(null,"QuickFolders","Error in QuickFolders.Options.load(initBling()):\n" + e);
		};    

    /***** Update message(s) *****/
		if (this.message && this.message!='') {
			//alert(message);
			Services.prompt.alert(null,"QuickFolders",message);
			message = '';
		}
    
    util.logDebugOptional('options', 'QuickFolders.Options.load - end with sizeToContent()');
    sizeToContent();
	},
  
  initBling: function initBling (tabbox) {
    let wd = window.document,
        getElement = wd.getElementById.bind(wd),
        col = QuickFolders.Preferences.getUserStyle("ActiveTab","color","#FFFFFF"), 
        bcol = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","#000090");
    getElement("activetab-colorpicker").color = bcol;
    getElement("activetab-fontcolorpicker").color = col;
    getElement("activetabs-label").style.setProperty('color', col, 'important');
    getElement("activetabs-label").style.backgroundColor = bcol;

    bcol = QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","buttonface");
    getElement("inactive-colorpicker").color = bcol;

    //support transparency and shadow
    let transcol  =  this.getTransparent(bcol, QuickFolders.Preferences.getBoolPref("transparentButtons"));
    QuickFolders.Util.logDebug('inactivetabs-label: setting background color to ' + transcol);
    getElement("inactivetabs-label").style.backgroundColor = transcol;
    // this.showButtonShadow(QuickFolders.Preferences.getBoolPref("buttonShadows"));

    col = QuickFolders.Preferences.getUserStyle("InactiveTab","color","buttontext");
    getElement("inactive-fontcolorpicker").color = col;
    getElement("inactivetabs-label").style.setProperty('color', col, 'important');


    bcol = QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","#FFFFFF");
    getElement("hover-colorpicker").color = bcol;
    col = QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black");
    getElement("hover-fontcolorpicker").color = col;
    getElement("hoveredtabs-label").style.setProperty('color', col, 'important');
    getElement("hoveredtabs-label").style.backgroundColor = bcol;

    bcol = QuickFolders.Preferences.getUserStyle("DragTab","background-color", "#E93903");
    getElement("dragover-colorpicker").color = bcol;
    col = QuickFolders.Preferences.getUserStyle("DragTab","color", "White");
    getElement("dragover-fontcolorpicker").color = col;
    getElement("dragovertabs-label").style.setProperty('color', col, 'important');
    getElement("dragovertabs-label").style.backgroundColor = bcol;
    getElement("toolbar-colorpicker").color = QuickFolders.Preferences.getUserStyle("Toolbar","background-color", "White");
    // disable folder tree icons - not supported on Postbox+Seamonkey
    getElement("chkShowIconButtons").collapsed = !QuickFolders.Preferences.supportsCustomIcon; 

    this.selectTheme(wd, QuickFolders.Preferences.CurrentThemeId);

    // initialize Theme Selector by adding original titles to localized versions
    let cbo = getElement("QuickFolders-Theme-Selector");
    if (cbo.itemCount)
      for (let index = 0; index<cbo.itemCount; index++) {
        let item = cbo.getItemAtIndex( index ),
            theme = QuickFolders.Themes.Theme(item.value);
        if (theme) {
          if (item.label != theme.name)
            item.label = theme.name + ' - ' + item.label
        }
      }

    try {
      let selectOptionsPane = QuickFolders.Preferences.getIntPref('lastSelectedOptionsTab');
      if (selectOptionsPane >=0)
        tabbox.selectedIndex = selectOptionsPane; // 1 for pimp my tabs
    }
    catch(e) { ; }
    
    let menupopup = getElement("QuickFolders-Options-PalettePopup");
    QuickFolders.Interface.buildPaletteMenu(0, menupopup);
    
    // customized coloring support
    this.initPreviewTabStyles();
    
    let paletteType = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType');
    getElement('qf-individualColors').collapsed = !
      (this.stripedSupport(paletteType) && 
       this.stripedSupport(QuickFolders.Preferences.getIntPref('style.ColoredTab.paletteType')));   
    getElement('buttonTransparency').disabled = (paletteType!=0); // only with "no colors"
  },

  trimLicense: function trimLicense() {
    let txtBox = document.getElementById('txtLicenseKey'),
        strLicense = txtBox.value.toString();
    QuickFolders.Util.logDebug('trimLicense() : ' + strLicense);
    strLicense = strLicense.replace(/^\s+|\s+$/g, ''); // remove line breaks
    strLicense = strLicense.replace('\[at\]','@');
    txtBox.value = strLicense;
    QuickFolders.Util.logDebug('trimLicense() result : ' + strLicense);
    return strLicense;
  } ,
  
  selectQuickMoveFormat: function selectQuickMoveFormat(menuList) {
    let prefString1 = menuList.getAttribute('preference'),
        prefName1 = document.getElementById(prefString1).getAttribute('name'),
        val = menuList.value;
    QuickFolders.Util.logDebug('Setting quick move format pref[' + prefName1 + ']: ' + val + '...');
    QuickFolders.Preferences.setIntPreference(prefName1, parseInt(val));
  } ,
  
  enablePremiumConfig: function enablePremiumConfig(isEnabled) {
    let getElement    = document.getElementById.bind(document),
        premiumConfig = getElement('premiumConfig'),
        quickJump     = getElement('chkQuickJumpHotkey'),
        quickMove     = getElement('chkQuickMoveHotkey'),
        quickJumpTxt  = getElement('qf-QuickJumpShortcut'),
        quickMoveTxt  = getElement('qf-QuickMoveShortcut'),
        quickMoveFormat = getElement('menuQuickMoveFormat'),
        quickMoveDepth = getElement('quickmove-path-depth');
    premiumConfig.disabled = !isEnabled;
    quickJump.disabled = !isEnabled;
    quickMove.disabled = !isEnabled;
    quickJumpTxt.disabled = !isEnabled;
    quickMoveTxt.disabled = !isEnabled;
    quickMoveFormat.disabled = !isEnabled;
    quickMoveDepth.disabled = !isEnabled;
  },
  
  decryptLicense: function decryptLicense(testMode) {
    let getElement = document.getElementById.bind(document),
        validationPassed       = getElement('validationPassed'),
        validationFailed       = getElement('validationFailed'),
        validationExpired      = getElement('validationExpired'),
        validationInvalidEmail = getElement('validationInvalidEmail'),
        validationEmailNoMatch = getElement('validationEmailNoMatch'),
        decryptedMail, decryptedDate,
        util = QuickFolders.Util;
    validationPassed.collapsed = true;
    validationFailed.collapsed = true;
    validationExpired.collapsed = true;
    validationInvalidEmail.collapsed = true;
    validationEmailNoMatch.collapsed = true;
    this.enablePremiumConfig(false);
    try {
      this.trimLicense();
      let State = QuickFolders.Licenser.ELicenseState,
          txtBox = getElement('txtLicenseKey'),
          license = txtBox.value;
      // store new license key
      if (!testMode) // in test mode we do not store the license key!
        QuickFolders.Preferences.setCharPrefQF('LicenseKey', license);
      
      let maxDigits = getElement('txtMaxDigits').value, // this will be hardcoded in production
          result, LicenseKey,
          crypto = QuickFolders.Licenser.getCrypto(license),
          mail = QuickFolders.Licenser.getMail(license),
          date = QuickFolders.Licenser.getDate(license);
      if (QuickFolders.Preferences.isDebug) {
        let test = "QuickFolders.Licenser found the following License components:\n"
          + "Email: " + mail + "\n"
          + "Date: " + date + "\n"
          + "Crypto: " + crypto + "\n";
        if (testMode)
          util.alert(test);
        util.logDebug(test);
      }
      if (crypto)
        [result, LicenseKey] = QuickFolders.Licenser.validateLicense(license, maxDigits);
      else 
        result = State.Invalid;
      decryptedDate = QuickFolders.Licenser.DecryptedDate;
      getElement('licenseDate').value = decryptedDate; // invalid ??
      decryptedMail = QuickFolders.Licenser.DecryptedMail;
      switch(result) {
        case State.Valid:
          this.enablePremiumConfig(true);
          validationPassed.collapsed=false;
          getElement('dialogProductTitle').value = "QuickFolders Pro";
          // test code
          getElement('txtEncrypt').value = LicenseKey;
          break;
        case State.Invalid:
          validationFailed.collapsed=false;
          break;
        case State.Expired:
          validationExpired.collapsed=false;
          break;
        case State.MailNotConfigured:
          validationInvalidEmail.collapsed=false;
          // if mail was already replaced the string will contain [mail address] in square brackets
          validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
          break;
        case State.MailDifferent:
          validationFailed.collapsed=false;
          validationEmailNoMatch.collapsed=false;
          break;
        default:
          Services.prompt.alert(null,"QuickFolders",'Unknown license status: ' + result);
          break;
      }
      if (testMode) {
        getElement('txtEncrypt').value = 'Date = ' + decryptedDate + '    Mail = ' +  decryptedMail +  '  Result = ' + result;
      }
      else {
        // reset License status of main instance
        if (window.arguments && window.arguments[1].inn.instance) {
          let mainLicenser = window.arguments[1].inn.instance.Licenser;
          if (mainLicenser) {
            mainLicenser.ValidationStatus =
              result != State.Valid ? State.NotValidated : result;
            mainLicenser.wasValidityTested = true; // no need to re-validate there
          }
        }
      }
      
    }    
    catch(ex) {
      util.logException("Error in QuickFolders.Options.decryptLicense():\n", ex);
    }
  } ,
  
  pasteLicense: function pasteLicense() {
    let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable),
        str       = {},
        strLength = {},
        finalLicense = '';        
    trans.addDataFlavor("text/unicode");
    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

    trans.getTransferData("text/unicode", str, strLength);
    if (strLength.value) {
      if (str) {
        let pastetext = str.value.QueryInterface(Components.interfaces.nsISupportsString).data,
            txtBox = document.getElementById('txtLicenseKey'),
            strLicense = pastetext.toString();
        txtBox.value = strLicense;
        finalLicense = this.trimLicense();
      }    
    }
    if (finalLicense) {
      let testMode = !document.getElementById('boxKeyGenerator').collapsed;
      this.validateLicense(testMode);
    }
  } ,
  
  validateLicense: function validateLicense(testMode) {
    try {
      this.decryptLicense(testMode);
    }
    catch(ex) {
      QuickFolders.Util.logException("Error in QuickFolders.Options.validateLicense():\n", ex);
    }
  } ,
  
  restoreLicense: function restoreLicense() {
    QuickFolders.Licenser.LicenseKey = QuickFolders.Preferences.getCharPrefQF('LicenseKey'); 
    document.getElementById('txtLicenseKey').value = QuickFolders.Licenser.LicenseKey;
  },
  
  encryptLicense: function encryptLicense() {
    let encryptThis = document.getElementById('txtEncrypt').value,
        maxDigits = document.getElementById('txtMaxDigits').value, // this will be hardcoded in production
        encrypted = QuickFolders.Licenser.encryptLicense(encryptThis, maxDigits);
    document.getElementById('txtLicenseKey').value = encryptThis + ';' + encrypted;
  },
  
	selectTheme: function selectTheme(wd, themeId) {
		let myTheme =  QuickFolders.Themes.Theme(themeId),
        getElement = wd.getElementById.bind(wd),
        util = QuickFolders.Util,
        main = util.getMail3PaneWindow(),
        QI = main.QuickFolders.Interface;
		if (myTheme) {
		  try {
				getElement("QuickFolders-Theme-Selector").value = themeId;
				getElement("Quickfolders-Theme-Author").value =  myTheme.author;

				// textContent wraps, value doesnt
				getElement("Quickfolders-Theme-Description").textContent
					= QI.getUIstring("qf.themes." + themeId + ".description", "N/A");

				getElement("qf-options-icons").disabled
					= !(myTheme.supportsFeatures.specialIcons);
				getElement("qf-options-shadow").disabled
					= !(myTheme.supportsFeatures.buttonShadows);

				getElement("button-font-size").disabled
					= !(myTheme.supportsFeatures.supportsFontSize);
				getElement("button-font-size-label").disabled
					= !(myTheme.supportsFeatures.supportsFontSize);

				getElement("qf-tweakRadius").collapsed
					= !(myTheme.supportsFeatures.cornerRadius);
          
        getElement("qf-tweakToolbarBorder").collapsed
					= !(myTheme.supportsFeatures.toolbarBorder);

				getElement("qf-tweakBorders").collapsed
					= !(myTheme.supportsFeatures.borderToggle);

				getElement("qf-tweakColors").collapsed
					= !(myTheme.supportsFeatures.stateColors || myTheme.supportsFeatures.individualColors);

				getElement("qf-individualColors").collapsed
					= !(myTheme.supportsFeatures.individualColors);

				getElement("qf-StandardColors").collapsed
					= !(myTheme.supportsFeatures.standardTabColor);

				getElement("buttonTransparency").collapsed
					= !(myTheme.supportsFeatures.tabTransparency);


				getElement("qf-stateColors").collapsed
					= !(myTheme.supportsFeatures.stateColors);
					
				getElement("qf-stateColors-defaultButton").collapsed
					= !(myTheme.supportsFeatures.stateColors);
			}
			catch(ex) {
				util.logException('Exception during QuickFolders.Options.selectTheme: ', ex); 
			}

			/******  FOR FUTURE USE ??  ******/
			// if (myTheme.supportsFeatures.supportsFontSelection)
			// if (myTheme.supportsFeatures.buttonInnerShadows)

			util.logDebug ('Theme [' + myTheme.Id + '] selected');
		}
	} ,
	
	BGCHOICE : {
	  default: 0,
		dark: 1,
		translucent: 2,
		custom: 3
	} ,

	toggleMutexCheckbox: function toggleMutexCheckbox(cbox, cbox2Name) {
		let prefString1 = cbox.getAttribute('preference'),
		    prefName1 = document.getElementById(prefString1).getAttribute('name'),
		    cbox2 = document.getElementById(cbox2Name);
		if(!QuickFolders.Preferences.getBoolPrefVerbose(prefName1)) { // not yet checked but will be after event is propagated.
			let prefString2 = cbox2.getAttribute('preference'),
			    prefName2 = document.getElementById(prefString2).getAttribute('name');
			// uncheck the other checkbox
			if (QuickFolders.Preferences.getBoolPrefVerbose(prefName2))
				QuickFolders.Preferences.setBoolPrefVerbose(prefName2, false);
		}
	},

	setDefaultButtonRadius: function setDefaultButtonRadius() {
		document.getElementById('QuickFolders-Options-CustomTopRadius').value = "4";
		document.getElementById('QuickFolders-Options-CustomBottomRadius').value = "0";
    QuickFolders.Preferences.setIntPref('style.corners.customizedTopRadiusN', 4);
    QuickFolders.Preferences.setIntPref('style.corners.customizedBottomRadiusN', 0);
    let main = QuickFolders.Util.getMail3PaneWindow(),
        QI = main.QuickFolders.Interface; 
    QI.updateUserStyles();
	},

	colorPickerTranslucent: function colorPickerTranslucent(picker) {
		document.getElementById('inactivetabs-label').style.backgroundColor=
      this.getTransparent(picker.color, document.getElementById('buttonTransparency').checked);
		QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
		return QuickFolders.Interface.updateMainWindow();
	},

  // set the custom value entered by user (only if custom is actually selected)
	setCurrentToolbarBackgroundCustom: function setCurrentToolbarBackgroundCustom() {
		let setting = document.getElementById('currentFolderBackground'),
		    backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');		
		if (backgroundCombo.selectedIndex == this.BGCHOICE.custom) {
		  // store the new setting!
			QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.custom', setting.value);  
			this.setCurrentToolbarBackground('custom', true);
		}
	} ,
	
	// change background color for current folder bar
	// 4 choices: default, dark, custom, translucent
	setCurrentToolbarBackground: function setCurrentToolbarBackground(choice, withUpdate) {
    let util = QuickFolders.Util,
		    setting = document.getElementById('currentFolderBackground'),
		    // store custom value, when going away from custom selection
		    backgroundCombo = document.getElementById('QuickFolders-CurrentFolder-Background-Select');		
		util.logDebugOptional ('interface','Options.setCurrentToolbarBackground');
		if (backgroundCombo.selectedIndex == this.BGCHOICE.custom && choice != 'custom') {
			QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.custom', setting.value);  
		}
	
		switch (choice) {
		  case 'default':
				backgroundCombo.selectedIndex = this.BGCHOICE.default;
				setting.value = (util.isCSSGradients)
							          ? 'linear-gradient(to top, #FFF 7%, #BDB9BD 88%, #EEE 100%)'
							          : '-moz-linear-gradient(bottom, #FFF 7%, #BDB9BD 88%, #EEE 100%)';
				break;
		  case 'dark':
				backgroundCombo.selectedIndex = this.BGCHOICE.dark;
				setting.value = (util.isCSSGradients)
				                ? 'linear-gradient(rgb(88, 88, 88), rgb(35, 35, 35) 45%, rgb(33, 33, 33) 48%, rgb(24, 24, 24))'
												: '-moz-linear-gradient(bottom, rgb(88, 88, 88), rgb(35, 35, 35) 45%, rgb(33, 33, 33) 48%, rgb(24, 24, 24))'
				break;
			case 'translucent':
				backgroundCombo.selectedIndex = this.BGCHOICE.translucent;
				setting.value = 'rgba(255, 255, 255, 0.2)';  // Gecko 1.9+
				break;
			case 'custom':
				backgroundCombo.selectedIndex = this.BGCHOICE.custom;
				// restore custom value
				setting.value = QuickFolders.Preferences.getCharPrefQF('currentFolderBar.background.custom');  
				break;
		}
		let styleValue = setting.value;
		QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background', styleValue);
		QuickFolders.Preferences.setCharPrefQF('currentFolderBar.background.selection', choice);
		if (withUpdate)
			QuickFolders.Interface.updateMainWindow();
	},
	
	styleUpdate: function styleUpdate(elementName, elementStyle, styleValue, label ) {
    let util = QuickFolders.Util;
    util.logDebugOptional('interface.buttonStyles', 'styleUpdate(' + elementName + ', ' + elementStyle + ', ' + styleValue + ')');
		QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue);
		if (label) {
			switch(elementStyle) {
				case 'color':
 			    // like inline styling = highest priority
					document.getElementById(label).style.setProperty('color', styleValue, 'important'); 
					break;
			  case 'background-color':
					document.getElementById(label).style.backgroundColor = styleValue; 
					break;
			}
		}
    let updateResult = QuickFolders.Interface.updateMainWindow(true);
    util.logDebugOptional('interface.buttonStyles', 'styleUpdate() updateMainWindow returned ' + updateResult);
		return updateResult;
	},

  setColoredTabStyleFromRadioGroup: function setColoredTabStyleFromRadioGroup(rgroup) {
    let styleId = parseInt(rgroup.value, 10);
    this.setColoredTabStyle(styleId, true);
  },
  
	// select: striped style / filled style
	setColoredTabStyle: function setColoredTabStyle(styleId, force) {
    let prefs = QuickFolders.Preferences;
    if (!force && prefs.getIntPref("colorTabStyle") == styleId)
      return; // no change!
		prefs.setIntPref("colorTabStyle", styleId); // 0 striped 1 filled
		QuickFolders.Interface.updateMainWindow(false);
		
		let inactiveTab = document.getElementById('inactivetabs-label');
		if (inactiveTab) {
			if ((styleId != prefs.TABS_STRIPED))
				inactiveTab.className = inactiveTab.className.replace(/\s*striped/,"");
			if ((styleId == prefs.TABS_STRIPED) && (inactiveTab.className.indexOf("striped")<0))
				inactiveTab.className = inactiveTab.className.replace(/(col[0-9]+)/,"$1striped");
		}
	}, 
	
	getButtonStatePrefId: function getButtonStatePrefId(buttonState) {
		switch(buttonState) {
		  case 'colored':
				return 'ColoredTab';
			case 'standard':
				return 'InactiveTab';
			case 'active':
				return 'ActiveTab';
			case 'hovered':
				return 'HoveredTab';
			case 'dragOver':
				return 'DragOver';
			default:
				throw('QuickFolders.Options.getButtonStatePrefId - Invalid buttonState: ' + buttonState); // error!
		}
	} ,
  
	getButtonMenuId: function getButtonMenuId(buttonState) {
		switch(buttonState) {
		  case 'colored':
        return 'menuColoredPalette';
			case 'standard':
        return 'menuStandardPalette';
			case 'active':
        return 'menuActiveTabPalette';
			case 'hovered':
        return 'menuHoverPalette';
			case 'dragOver':
        return 'menuDragOverPalette';
			default:
				throw('QuickFolders.Options.getButtonMenuId - Invalid buttonState: ' + buttonState); // error!
		}
	} ,
  
	/*********************
	 * toggleUsePalette() 
	 * Set whether (and which) palette is used for a particular tab state.
	 * also hides background colorpicker if a palette is used
	 * @mnuNode:       either a menuitem node or the menu with the correct paletteType value
	 * @buttonState:   [string] which kind of tab state: standard, active, hovered, dragOver
	 * @paletteType:   0 none, 1 plastic, 2 pastel, 3 night ....
   * @isUpdatePanelColor:  when switching palette type from dropdown, update color on button -> UI
	 */	 
	toggleUsePalette: function toggleUsePalette(mnuNode, buttonState, paletteType, isUpdatePanelColor) {
		//let isChecked = checkbox.checked;
		let paletteTypeMenu = null,
        prefs = QuickFolders.Preferences,
        getElement = document.getElementById.bind(document);
		if (mnuNode.tagName) {
		  switch(mnuNode.tagName) {
				case 'menulist':
				  paletteTypeMenu = mnuNode;
					break;
			  case 'menuitem':
				  paletteTypeMenu = mnuNode.parentNode.parentNode;
					break;
			}
		}
		let idPreview = null,
		    colorPicker = null,
		    stylePref = this.getButtonStatePrefId(buttonState),
        isStripable = null,
        isTransparentSupport = false;
		switch(buttonState) {
		  case 'colored':
        isStripable = this.stripedSupport(paletteType) && this.stripedSupport(prefs.getIntPref('style.InactiveTab.paletteType'));
				break;
			case 'standard':
				idPreview = 'inactivetabs-label';
				colorPicker = 'inactive-colorpicker';
        isStripable = this.stripedSupport(paletteType) && this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType'));
        isTransparentSupport = (paletteType==0);
				break;
			case 'active':
				idPreview = 'activetabs-label';
				colorPicker = 'activetab-colorpicker';
				break;
			case 'hovered':
				idPreview = 'hoveredtabs-label';
				colorPicker = 'hover-colorpicker';
				break;
			case 'dragOver':
				idPreview = 'dragovertabs-label';
				colorPicker = 'dragover-colorpicker';
				break;
		}
    if (isUpdatePanelColor) {
      getElement('buttonTransparency').disabled = !isTransparentSupport;
      if (isStripable === null) {
          isStripable = this.stripedSupport(prefs.getIntPref('style.ColoredTab.paletteType'))
                        && 
                        this.stripedSupport(prefs.getIntPref('style.InactiveTab.paletteType'));
      }
      
      if (!isStripable) {
        this.setColoredTabStyle(prefs.TABS_FILLED);
      }
      getElement('qf-individualColors').collapsed = !isStripable;
    }
		
		// preparePreviewTab(id, preference, previewId)
		prefs.setIntPref('style.' + stylePref + '.paletteType', paletteType);
		if (colorPicker) {
			this.preparePreviewTab(colorPicker, 'style.' + stylePref + '.', idPreview, null, paletteType);
      // we need to force reselect the palette entry of the button
      // to update font & background color
      if (isUpdatePanelColor) {
        let m = getElement('QuickFolders-Options-PalettePopup');
        if (m) {
          // if (!m.targetNode)
          m.targetNode = (buttonState == 'colored') ? 
                         null : getElement(QuickFolders.Interface.getPreviewButtonId(buttonState));
          // retrieve palette index
          let col = QuickFolders.Preferences.getIntPref('style.' + stylePref + '.paletteEntry');
          QuickFolders.Interface.setTabColorFromMenu(m.firstChild, col.toString()); // simulate a menu item!
        }
      }
    }
	},
	
	/*********************  
	 *	showPalette()       
	 *  open palette popup   
	 *  @label              parent node  
	 *  @buttonState        'standard', 'active', 'hovered', 'dragOver'
	 *  {paletteMenuId}     'menuStandardPalette', 'menuActivePalette', 'menuHoverPalette', 'menuDragOverPalette'
	 */
	showPalette: function showPalette(label, buttonState) {
		let id = label ? label.id : label.toString(),
        paletteMenuId = this.getButtonMenuId(buttonState),
		    paletteMenu = document.getElementById(paletteMenuId),
        QI = QuickFolders.Interface;
		QuickFolders.Util.logDebugOptional("interface", "Options.showPalette(" + id + ", " + buttonState + ")");
		if (paletteMenu) {
		  if (paletteMenu.value == "0") {
			  return;  // no menu, as 2 colors / no palette is selected
			}
			this.toggleUsePalette(paletteMenu, buttonState, paletteMenu.value, false);
			// allow overriding standard background for striped style!
			// Now style the palette with the correct palette class
			let context = label.getAttribute('context'),
			    menu = document.getElementById(context);
			menu.className = 'QuickFolders-folder-popup' + QI.getPaletteClass(this.getButtonStatePrefId(buttonState));
		}
		QI.showPalette(label);
	},

	changeTextPreference: function changeTextPreference(txtBox) {
		let prefString = txtBox.getAttribute("preference"),
		    pref = document.getElementById(prefString);
		
		if (pref) {
      let name = pref.getAttribute('name');
      if(name)
        QuickFolders.Preferences.setIntPreference(name, txtBox.value);
      else
        QuickFolders.Util.logToConsole('changeTextPreference could not find pref string: '  + prefString); 
    }
		return QuickFolders.Interface.updateMainWindow(false);
	},
	
	// doing what instantApply really should provide...
	toggleBoolPreference: function toggleBoolPreference(cb, noUpdate) {
		let prefString = cb.getAttribute("preference"),
		    pref = document.getElementById(prefString);
		
		if (pref)
			QuickFolders.Preferences.setBoolPrefVerbose(pref.getAttribute('name'), cb.checked);
		if (noUpdate)
			return true;
		return QuickFolders.Interface.updateMainWindow(false); // force full updated
	},
	
	toggleColorTranslucent: function toggleColorTranslucent(cb, pickerId, label, userStyle) {
		let picker = document.getElementById(pickerId);
		document.getElementById(label).style.backgroundColor=
			this.getTransparent(picker.color, cb.checked);
		if (userStyle)
			QuickFolders.Preferences.setUserStyle(userStyle, 'background-color', picker.color);

		// problems with instantapply?
		let prefString = cb.getAttribute("preference"),
		    pref = document.getElementById(prefString);
		
		if (pref)
			QuickFolders.Preferences.setBoolPrefVerbose(pref.getAttribute('name'), cb.checked);
		
		return QuickFolders.Interface.updateMainWindow(true);
	},
	
	// switch pastel mode on preview tabs
	initPreviewTabStyles: function initPreviewTabStyles() {
    let getElement = document.getElementById.bind(document),
		    inactiveTab = getElement('inactivetabs-label'),
		    activeTab = getElement('activetabs-label'),
		    hoverTab = getElement('hoveredtabs-label'),
		    dragTab = getElement('dragovertabs-label'),
		    menupopup = getElement("QuickFolders-Options-PalettePopup");
		
		this.preparePreviewTab('inactive-colorpicker', 'style.InactiveTab.', 'inactivetabs-label');
		this.preparePreviewTab('activetab-colorpicker', 'style.ActiveTab.', 'activetabs-label');
		this.preparePreviewTab('hover-colorpicker', 'style.HoveredTab.', 'hoveredtabs-label');
		this.preparePreviewTab('dragover-colorpicker', 'style.DragOver.', 'dragovertabs-label');

	} ,

	// toggle pastel mode was toggleColorPastel
  // NEEDS A REWRITE FOR MULTIPLE PALETTES!
	showPalettePreview: function showPalettePreview(withUpdate) {
	  let defaultPalette = QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'),
	      isPastel = (defaultPalette == 2),
        getElement = document.getElementById.bind(document);
    
		getElement('ExampleStripedColor').src=
			isPastel ? "chrome://quickfolders/skin/ico/striped-example-pastel.gif" : "chrome://quickfolders/skin/ico/striped-example.gif";
		getElement('ExampleFilledColor').src=
			isPastel ? "chrome://quickfolders/skin/ico/full-example-pastel.gif" : "chrome://quickfolders/skin/ico/full-example.gif";

		let picker = getElement('inactive-colorpicker');
	
		getElement('activetabs-label').style.backgroundColor=
			this.getTransparent(picker.color, isPastel);
		QuickFolders.Preferences.setUserStyle('InactiveTab','background-color', picker.color);
		QuickFolders.Preferences.setBoolPref('pastelColors', isPastel);
		
		this.initPreviewTabStyles();
		
		if (withUpdate) {
		  QuickFolders.Interface.updateMainWindow();
		}
	},

	showButtonShadow: function showButtonShadow(isChecked) {
		let el= document.getElementById('inactivetabs-label'),
		    myStyle = !isChecked ? "1px -1px 3px -1px rgba(0,0,0,0.7)" : "none";
		el.style.MozBoxShadow = myStyle;
		QuickFolders.Preferences.setBoolPref('buttonShadows', !isChecked);
		return QuickFolders.Interface.updateMainWindow(true);
	},

	// Set Default Colors (partly from system colors) 
	//   - will be converted to rgb values to avoid error messages on color pickers
	setDefaultColors: function setDefaultColors() {
		let util = QuickFolders.Util,
        highlightColor = util.getSystemColor("Highlight"),
		    highlightTextColor = util.getSystemColor("HighlightText"),
		    buttonfaceColor = util.getSystemColor("buttonface"),
		    buttontextColor = util.getSystemColor("buttontext"),
        getElement = document.getElementById.bind(document);

		getElement("activetab-colorpicker").color = highlightColor;
		getElement("activetabs-label").style.backgroundColor = highlightColor;
		getElement("activetab-fontcolorpicker").color = highlightTextColor;
		getElement("activetabs-label").style.color = highlightTextColor;

		getElement("hover-colorpicker").color = util.getSystemColor("orange");
		getElement("hover-fontcolorpicker").color = "#FFF";
		getElement("hoveredtabs-label").style.color = "#FFF";
		getElement("hoveredtabs-label").style.backgroundColor = util.getSystemColor("orange");

		getElement("dragover-colorpicker").color = "#E93903";
		getElement("dragover-fontcolorpicker").color = "#FFF";
		getElement("dragovertabs-label").style.color = "#FFF";
		getElement("dragovertabs-label").style.backgroundColor = "#E93903";

		getElement("toolbar-colorpicker").color = buttonfaceColor;
		getElement("inactive-colorpicker").color = buttonfaceColor;
		getElement("inactivetabs-label").style.backgroundColor = buttonfaceColor;
		getElement("inactive-fontcolorpicker").color = buttontextColor;
		getElement("inactivetabs-label").style.color = buttontextColor;
		return QuickFolders.Interface.updateMainWindow();
	},

	sendMail: function sendMail(mailto) {
    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService),
        util = QuickFolders.Util,       
        title = util.getBundleString('qf.prompt.contact.title', "Contact QuickFolders Support"),
        text = util.getBundleString('qf.prompt.contact.subject', "Please enter a short subject line:"),
        input = {value: ""},
        check = {value: false},
        result = prompts.prompt(window, title, text, input, null, check); 
    if (!result) return;
    
    let sURL="mailto:" + mailto + "?subject=[QuickFolders]" + encodeURI(" " + input.value), // urlencode
		    MessageComposer=Components.classes["@mozilla.org/messengercompose;1"].getService(Components.interfaces.nsIMsgComposeService),
		    // make the URI
		    ioService = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService),
		    aURI = ioService.newURI(sURL, null, null);
		window.close();
		// open new message
		MessageComposer.OpenComposeWindowWithURI (null, aURI);
	},
  
	dumpFolderEntries: function dumpFolderEntries() {
		// debug function for checking users folder string (about:config has trouble with editing JSON strings)
    const Cc = Components.classes,
          Ci = Components.interfaces;
		let service = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
        util = QuickFolders.Util;

		try {
			let sFolderString = service.getComplexValue("QuickFolders.folders", Ci.nsISupportsString).data,
			    clipboardhelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);

			util.logToConsole("Folder String: " & sFolderString);
      try {
        // format the json
        let prettyFolders = JSON.stringify(JSON.parse(sFolderString), null, '  '); 
        clipboardhelper.copyString(prettyFolders);
      }
      catch (e) {
        util.logException("Error prettifying folder string:\n", e);
        clipboardhelper.copyString(sFolderString);
      }
      let out = util.getBundleString("qfAlertCopyString", "Folder String copied to clipboard."),
          mail3PaneWindow = util.getMail3PaneWindow();
      
      if (mail3PaneWindow && mail3PaneWindow.QuickFolders) {
        out += " [" + mail3PaneWindow.QuickFolders.Model.selectedFolders.length + " folders]";
      }
			//alert(out);
			Services.prompt.alert(null,"QuickFolders",out);
		}
		catch(e) {
			//alert(e);
			Services.prompt.alert(null,"QuickFolders",e);
		}

	},

	configureTooltips: function configureTooltips(btn) {
	  setTimeout( function () {
			QuickFolders.Options.showAboutConfig(btn, 'extensions.quickfolders.tooltips', true, true);
			} );	
	},
	
	showAboutConfig: function showAboutConfig(clickedElement, filter, readOnly, updateFolders) {
    const Cc = Components.classes,
          Ci = Components.interfaces;
	  updateFolders = (typeof updateFolders != undefined) ? updateFolders : false;
    let util = QuickFolders.Util;
	  util.logDebug('showAboutConfig(clickedElement: ' 
      + (clickedElement ? clickedElement.tagName : 'none') 
      + ', filter: ' + filter 
      + ', readOnly: ' + readOnly +')');
		const name = "Preferences:ConfigManager";
		const uri = "chrome://global/content/config.xul";

		let mediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
		    w = mediator.getMostRecentWindow(name),
        // set parent window
		    win = (clickedElement && clickedElement.ownerDocument && clickedElement.ownerDocument.defaultView)
         		? clickedElement.ownerDocument.defaultView 
						: window;
		if (!w) {
			let watcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher),
          width = (util.HostSystem == 'linux') ? "650px" : "500px",
          height = (util.HostSystem == 'linux') ? "320px" : "300px",
          features = "alwaysRaised,dependent,chrome,resizable,width="+ width + ",height=" + height;
      if (util.HostSystem == 'winnt')
        w = watcher.openWindow(win, uri, name, features, null);
      else
        w = win.openDialog(uri, name, features);
		}
		if (updateFolders) {
		  // make sure QuickFolders UI is updated when about:config is closed.
			w.addEventListener('unload', function(event) { QuickFolders.Interface.updateMainWindow(); });
		}
		w.focus();
		w.addEventListener('load', 
			function () {
			  util.logDebug('showAboutConfig() : setting config Filter.\nreadonly = ' + readOnly);
				let flt = w.document.getElementById("textbox");
				if (flt) {
					 flt.value=filter;
				 	// make filter box readonly to prevent damage!
					 if (!readOnly)
					 	flt.focus();
					 else
						flt.setAttribute('readonly',true);
					 if (w.self.FilterPrefs) {
					 	w.self.FilterPrefs();
				 	}
				}
				else
				  util.logDebug('filter textbox not found');
			});
	},

	showVersionHistory: function showVersionHistory(label, ask) {
		let util = QuickFolders.Util,
        pureVersion=util.VersionSanitized,
		    sPrompt = util.getBundleString("qfConfirmVersionLink", "Display version history for QuickFolders");
		if (!ask || confirm(sPrompt + " " + pureVersion + "?")) {
			util.openURL(null, "http://quickfolders.mozdev.org/version.html" + "#" + pureVersion);
		}
	},
	
  // 3pane window only?
	toggleCurrentFolderBar: function toggleCurrentFolderBar(chk, selector) {
		let checked = chk.checked ? chk.checked : false,
        util = QuickFolders.Util,
        win = (selector=='messageWindow') ? util.getSingleMessageWindow() : util.getMail3PaneWindow();
    win.QuickFolders.Interface.displayNavigationToolbar(checked, selector);
	},
	
  onTabSelect: function onTabSelect(element, event) {
    let el = event.target;
    if (el.selectedPanel) {
      // let v = el.ownerDocument.defaultView;
      // el.ownerDocument.getElementsByTagName('pushbutton');
      let donateButton = document.documentElement.getButton('extra2');
      switch (el.selectedPanel.id) {
        case 'QuickFolders-Options-goPro':
          donateButton.collapsed = true;
          break;
        default:
          donateButton.collapsed = false;
          break;
      }
      QuickFolders.Util.logDebug('Tab Select: ' + element.id + ' selected panel = ' + el.selectedPanel.id);
    }
  }
}


