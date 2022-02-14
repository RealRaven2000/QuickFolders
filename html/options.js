

// add event listeners for tabs
const activateTab = (event) => {
  const tabSheets = document.querySelectorAll('.tabcontent-container section'),
        tabs = document.querySelectorAll('#QuickFolders-Options-Tabbox button');
  let btn = event.target;
  Array.from(tabSheets).forEach(tabSheet => {
    tabSheet.classList.remove("active");
  });
  Array.from(tabs).forEach(button => {
    button.classList.remove("active");
  });

  const { target: { value: activeTabSheetId = "" } } = event;
  if (activeTabSheetId) {
    document.getElementById(activeTabSheetId).classList.add("active");
    btn.classList.add("active");
    // store last selected tab
    browser.LegacyPrefs.setPref('extensions.quickfolders.lastSelectedOptionsTab', btn.getAttribute("tabNo"));
  }
}

for (let button of document.querySelectorAll("#QuickFolders-Options-Tabbox button")) {
  button.addEventListener("click", activateTab);
}

for (let colorpicker of document.querySelectorAll("input[type=color]")) {
  let options = QuickFolders.Options,
      elementName, elementStyle, label,
      isStyleUpdate = true;
  function initParams(eN, eS, s, l) {
    elementName=eN, elementStyle=eS, label=l
  }
  switch (colorpicker.id) {
    case "toolbar-colorpicker":
      initParams("Toolbar", "background-color", "qf-StandardColors");
      break;
    case "inactive-fontcolorpicker":
      initParams('InactiveTab','color', 'inactivetabs-label');
      break;
    case "inactive-colorpicker":
        isStyleUpdate = false;
        colorpicker.addEventListener("input", function() { 
          options.colorPickerTranslucent(this).bind(options);
        } );
      break;
    case "activetab-fontcolorpicker":
      initParams('ActiveTab','color', 'activetabs-label');
      break;
    case "activetab-colorpicker":
      initParams('ActiveTab','background-color','activetabs-label');
      break;
    case "hover-fontcolorpicker":
      initParams('HoveredTab','color','hoveredtabs-label');
      break;
    case "hover-colorpicker":
      initParams('HoveredTab','background-color', 'hoveredtabs-label');
      break;
    case "dragover-fontcolorpicker":
      initParams('DragTab', 'color', 'dragovertabs-label');
      break;
    case "dragover-colorpicker":
      initParams('DragTab', 'background-color', 'dragovertabs-label');
      break;
    default:
      isStyleUpdate = false;
  }
  if (isStyleUpdate)
    colorpicker.addEventListener("input", function() { // used to be "oncommand"
      options.styleUpdate(elementName, elementStyle, this.value, label);
    } );
}

// all dropdowns that end with "paletteType"
for (let palettepicker of document.querySelectorAll("select[data-pref-name$=paletteType]")) {
  let buttonState;
  // common window update
  switch (palettepicker.id) {
    case "menuStandardPalette":
      buttonState = "standard";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.showPalettePreview(true);
      });
      break;
    case "menuColoredPalette":
      buttonState = "colored";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.showPalettePreview(true);
      });
      break;
    case "menuActiveTabPalette":
      buttonState = "active";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
    case "menuHoverPalette":
      buttonState = "hovered";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
    case "menuDragOverPalette":
      buttonState = "dragOver";
      palettepicker.addEventListener("change", async (event) => {
        await QuickFolders.Options.toggleUsePalette(buttonState, event.target.value, true); //.bind(QuickFolders.Options);
        QuickFolders.Options.updateMainWindow();
      });
      break;
  }
}

// other dropdowns
let themeSelector = document.getElementById("QuickFolders-Theme-Selector");
themeSelector.addEventListener("change", async (event) => {
  let themeId = event.target.value;
  QuickFolders.Options.selectTheme(window.document, themeId, true); //.bind(QuickFolders.Options);
});


async function savePref(event) {
  let target = event.target,
      prefName = target.dataset.prefName; // automatically added from data-pref-name
  
	if (target instanceof HTMLInputElement) {
		if (target.getAttribute("type") === "checkbox") {
			await browser.LegacyPrefs.setPref(prefName, target.checked);
		} 
    else if (target.getAttribute("type") === "text" ||
			target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else if (target.getAttribute("type") === "number") {
			await browser.LegacyPrefs.setPref(prefName, parseInt(target.value, 10));
		} 
    else if (target.getAttribute("type") === "radio" && target.checked) {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else if (target.getAttribute("type") === "color") {
      await browser.LegacyPrefs.setPref(prefName, target.value);
    }    
    else {
			console.error("Received change event for input element with unexpected type", event);
		}
	} 
  else if (target instanceof HTMLSelectElement) {
		if (target.dataset.prefType === "string") {
			await browser.LegacyPrefs.setPref(prefName, target.value);
		} 
    else {
      let v = isNaN(target.value) ? target.value : parseInt(target.value, 10);
			await browser.LegacyPrefs.setPref(prefName, v);
		}
	} 
  else if (element instanceof HTMLTextAreaElement) {
    await browser.LegacyPrefs.setPref(prefName, target.value);
  }  
  else {
		console.error("Received change event for unexpected element", event);
	}  
}



async function loadPrefs() {
  console.log("loadPrefs");
  // use LegacyPrefs
	const prefElements = Array.from(document.querySelectorAll("[data-pref-name]"));
	for (let element of prefElements) {
		let prefName = element.dataset.prefName;
		if (!prefName) {
			console.error("Preference element has unexpected data-pref attribute", element);
			continue;
		}
		if (element instanceof HTMLInputElement) {
      if (element.getAttribute("type") === "checkbox") {
        element.checked = await browser.LegacyPrefs.getPref(prefName);
      } 
      else if (element.getAttribute("type") === "text" ||
        element.dataset.prefType === "string"
      ) {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      } 
      else if (element.getAttribute("type") === "number") {
        element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
      } 
      else if (element.getAttribute("type") === "radio") {
        let radioVal = (await browser.LegacyPrefs.getPref(prefName)).toString();
        if (element.value === radioVal) {
          element.checked = true;
        }
      }
      else if (element.getAttribute("type") === "color") {
        element.value = await browser.LegacyPrefs.getPref(prefName);
      }    
      else {
        console.error("Input element has unexpected type", element);
      }
		} 
    else if (element instanceof HTMLSelectElement) {
			if (element.dataset.prefType === "string") {
				element.value = await browser.LegacyPrefs.getPref(prefName);
			} else {
				element.value = (await browser.LegacyPrefs.getPref(prefName)).toString();
			}
		} else if (element instanceof HTMLTextAreaElement) {
      element.value = await browser.LegacyPrefs.getPref(prefName);
    }
    else {
			console.error("Unexpected preference element", element);
		}
    
    // Wire up individual event handlers
    element.addEventListener("change", savePref);
    
	}  
}

// preselect the correct tab.
async function preselectTab() {
  let selectOptionsPane = await browser.LegacyPrefs.getPref('extensions.quickfolders.lastSelectedOptionsTab'),
      selectedTabElement = document.getElementById("QuickFolders-General"); //default = first tab
    // selectOptionsPane can be overwritten by URL parameter "selectedTab"
  let optionParams = new URLSearchParams(document.location.search);
  let selTab = optionParams.get("selectedTab");
  if (selTab.toString() != "" && selTab .toString() != "-1") {
    selectOptionsPane = selTab;
  }
  // select the tab:
  let tabs = document.querySelectorAll('#QuickFolders-Options-Tabbox button');
  Array.from(tabs).forEach(button => {
    if (button.getAttribute("tabNo").toString() == selectOptionsPane.toString()) {
      selectedTabElement = button;
    }
  });
  
  let tabEvent = new Event("click");
  selectedTabElement.dispatchEvent(tabEvent);
}

async function initVersionPanel() {
  const manifest = await messenger.runtime.getManifest();
  document.getElementById("qf-options-header-description").value = manifest.version;
}

let licenseInfo;

async function initLicenseInfo() {
  licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  document.getElementById('txtLicenseKey').value = licenseInfo.licenseKey;
  
  if (licenseInfo.licenseKey) {
    await validateLicenseInOptions(true);
  }
  
  // add an event listener for changes:
  // window.addEventListener("QuickFolders.BackgroundUpdate", validateLicenseInOptions);
  
  messenger.runtime.onMessage.addListener (
    (data, sender) => {
      if (data.msg=="updatedLicense") {
        licenseInfo = data.licenseInfo;
        updateLicenseOptionsUI(false); // we may have to switch off silent if we cause this
        configureBuyButton();
        return Promise.resolve(true); // returns a promise of "undefined"
      }
    }
  );
  

  /*
  I would now like to call the logic in the original options.js
  QuickFolders.Options.validateLicenseInOptions();
  which calls
  QuickFolders.Options.updateLicenseOptionsUI();
  
  // original code in options.load
  if (QuickFolders.Util.licenseInfo.licenseKey) {
    this.validateLicenseInOptions(true);      
  }
    
  // could this be done via a background message?
  we were using the event 
  QuickFolders.BackgroundUpdate 
  */
}

// make a validation message visible but also repeat a notification for screen readers.
async function showValidationMessage(el, silent=true) {
  if (el.getAttribute("collapsed") != false) {
    el.setAttribute("collapsed",false);
    if (!silent) {
      // TO DO: OS notification 
      // QuickFolders.Util.slideAlert (util.ADDON_NAME, el.textContent);
      await messenger.runtime.sendMessage( {
        command:"slideAlert", 
        args: ["QuickFolders", el.textContent] 
      } );
    }
  }
}

function enablePremiumConfig(isEnabled) {
  let getElement      = document.getElementById.bind(document),
      premiumConfig   = getElement('premiumConfig'),
      quickJump       = getElement('chkQuickJumpHotkey'),
      quickMove       = getElement('chkQuickMoveHotkey'),
      quickCopy       = getElement('chkQuickCopyHotkey'),
      skipFolder      = getElement('chkSkipFolderHotkey'),
      quickJumpTxt    = getElement('qf-QuickJumpShortcut'),
      quickMoveTxt    = getElement('qf-QuickMoveShortcut'),
      quickCopyTxt    = getElement('qf-QuickCopyShortcut'),
      quickMoveAutoFill = getElement('chkQuickMoveAutoFill'),
      skipFolderTxt   = getElement('qf-SkipFolderShortcut'),
      quickMoveFormat = getElement('menuQuickMoveFormat'),
      quickMoveDepth  = getElement('quickmove-path-depth'),
      quickMoveAdvanced = getElement('quickMoveAdvanced'),
      multiCategories = getElement('chkCategories');
  premiumConfig.disabled = !isEnabled;
  quickJump.disabled = !isEnabled;
  quickMove.disabled = !isEnabled;
  quickCopy.disabled = !isEnabled;
  skipFolder.disabled = !isEnabled;
  quickJumpTxt.disabled = !isEnabled;
  quickMoveTxt.disabled = !isEnabled;
  quickCopyTxt.disabled = !isEnabled;
  skipFolderTxt.disabled = !isEnabled;
  quickMoveFormat.disabled = !isEnabled;
  quickMoveDepth.disabled = !isEnabled;
  quickMoveAdvanced.disabled = !isEnabled;
  multiCategories.disabled = !isEnabled;
  quickMoveAutoFill.disabled = !isEnabled;
  enableStandardConfig(isEnabled);
}

function enableStandardConfig(isEnabled) {
  let getElement      = document.getElementById.bind(document),
      chkConfigIncludeTabs = getElement('chkConfigIncludeTabs'),
      chkConfigGeneral= getElement('chkConfigIncludeGeneral'),
      chkConfigLayout = getElement('chkConfigIncludeLayout'),
      btnLoadConfig   = getElement('btnLoadConfig');
  btnLoadConfig.disabled = !isEnabled;
  chkConfigGeneral.disabled = !isEnabled;
  chkConfigIncludeTabs.disabled = !isEnabled;
  chkConfigLayout.disabled = !isEnabled;
}

async function updateLicenseOptionsUI(silent = false) {
  let getElement = document.getElementById.bind(document),
      validationPassed       = getElement('validationPassed'),
      validationStandard     = getElement('validationStandard'),
      validationFailed       = getElement('validationFailed'),
      validationInvalidAddon = getElement('validationInvalidAddon'),
      validationExpired      = getElement('validationExpired'),
      validationInvalidEmail = getElement('validationInvalidEmail'),
      validationEmailNoMatch = getElement('validationEmailNoMatch'),
      validationDate         = getElement('validationDate'),
      validationDateSpace    = getElement('validationDateSpace'),
      licenseDate            = getElement('licenseDate'),
      licenseDateLabel       = getElement('licenseDateLabel'),
      decryptedMail = licenseInfo.email , 
      decryptedDate = licenseInfo.expiryDate,
      result = licenseInfo.status;

  validationStandard.setAttribute("collapsed",true);
  validationPassed.setAttribute("collapsed",true);
  validationFailed.setAttribute("collapsed",true);
  validationExpired.setAttribute("collapsed",true);
  validationInvalidAddon.setAttribute("collapsed",true);
  validationInvalidEmail.setAttribute("collapsed",true);
  validationEmailNoMatch.setAttribute("collapsed",true);
  validationDate.setAttribute("collapsed",false);
  validationDateSpace.setAttribute("collapsed",false);
  enablePremiumConfig(false);
  try {
    let niceDate = decryptedDate;
    if (decryptedDate) {
      try { 
        let d = new Date(decryptedDate);
        niceDate =d.toLocaleDateString();
      }
      catch(ex) { niceDate = decryptedDate; }
    }
    licenseDate.textContent = niceDate; // invalid ??
    switch(result) {
      case "Valid":
        if (licenseInfo.keyType==2) { // standard license
          showValidationMessage(validationStandard, silent);
          enableStandardConfig(true);
        }
        else {
          enablePremiumConfig(true);
          showValidationMessage(validationPassed, silent);
          getElement('dialogProductTitle').value = "QuickFolders Pro";
        }          
        licenseDate.textContent = niceDate;
        licenseDateLabel.value = getBundleString("qf.label.licenseValid");
        break;
      case "Invalid":
        validationDate.setAttribute("collapsed",true);
        validationDateSpace.setAttribute("collapsed",true);
        let addonName = "";
        switch (licenseInfo.licenseKey.substr(0,2)) {
          case "QI":
            addonName = "quickFilters";
            break;
          case "S1":
          case "ST":
            addonName = "SmartTemplates";
            break;
          case "QF":
          case "QS":
          default: 
            showValidationMessage(validationFailed, silent);
        }
        if (addonName) {
          let txt = validationInvalidAddon.textContent;
          txt = txt.replace('{0}','QuickFolders').replace('{1}','QF'); // keys for {0} start with {1}
          if (txt.indexOf(addonName) < 0) {
            txt += " " + getBundleString("qf.licenseValidation.guessAddon").replace('{2}',addonName);
          }
          validationInvalidAddon.textContent = txt;
          showValidationMessage(validationInvalidAddon, silent);
        }
        break;
      case "Expired":
        licenseDateLabel.value = getBundleString("qf.licenseValidation.expired");
        licenseDate.textContent = niceDate;
        showValidationMessage(validationExpired, false); // always show
        break;
      case "MailNotConfigured":
        validationDate.setAttribute("collapsed",true);
        validationDateSpace.setAttribute("collapsed",true);
        validationInvalidEmail.setAttribute("collapsed",false);
        // if mail was already replaced the string will contain [mail address] in square brackets
        validationInvalidEmail.textContent = validationInvalidEmail.textContent.replace(/\[.*\]/,"{1}").replace("{1}", '[' + decryptedMail + ']');
        break;
      case "MailDifferent":
        validationDate.setAttribute("collapsed",true);
        validationDateSpace.setAttribute("collapsed",true);
        showValidationMessage(validationFailed, true);
        showValidationMessage(validationEmailNoMatch, silent);
        break;
      case "Empty":
        validationDate.setAttribute("collapsed",true);
        validationDateSpace.setAttribute("collapsed",true);
        break;
      default:
        Services.prompt.alert(null,"QuickFolders",'Unknown license status: ' + result);
        break;
    }
    
  }    
  catch(ex) {
    // util.logException("Error in QuickFolders.Options.updateLicenseOptionsUI():\n", ex);
    console.error("Error in updateLicenseOptionsUI():\n", ex);
  }
  return result;
}

// from Util
function getBundleString(id, substitions = []) { // moved from local copies in various modules.
  // [mx-l10n]
  let localized = browser.i18n.getMessage(id, substitions);
  let s = "";
  if (localized) {
    s = localized;
  }
  else {
    s = defaultText;
    this.logToConsole ("Could not retrieve bundle string: " + id + "");
  }
  return s;
}
  

// put appropriate label on the license button and pass back the label text as well
function labelLicenseBtn(btnLicense, validStatus) {
  switch(validStatus) {
    case  "extend":
      let txtExtend = getBundleString("qf.notification.premium.btn.extendLicense");
      btnLicense.setAttribute("collapsed",false);
      btnLicense.label = txtExtend; // text should be extend not renew
      btnLicense.setAttribute('tooltiptext',
        getBundleString("qf.notification.premium.btn.extendLicense.tooltip"));
      return txtExtend;
    case "renew":
      let txtRenew = getBundleString("qf.notification.premium.btn.renewLicense");
      btnLicense.label = txtRenew;
      return txtRenew;
    case "buy":
      let buyLabel = getBundleString("qf.notification.premium.btn.getLicense");
      btnLicense.label = buyLabel;
      return buyLabel;
    case "upgrade":
      let upgradeLabel = getBundleString("qf.notification.premium.btn.upgrade");
      btnLicense.label = upgradeLabel;
      btnLicense.classList.add('upgrade'); // stop flashing
      return upgradeLabel;
      
  }
  return "";
}

function configExtra2Button() {
   // to do - OK / Cancel / donate buttons from legacy code QuickFolders.Options 
}

// broken out from validateLicenseInOptions:
async function configureBuyButton() {
  function replaceCssClass(el,addedClass) {
    if (!el) return;
    el.classList.add(addedClass);
    if (addedClass!='paid') el.classList.remove('paid');
    if (addedClass!='expired')  el.classList.remove('expired');
    if (addedClass!='free') el.classList.remove('free');
  }

  let wd = window.document,
      getElement = wd.getElementById.bind(wd),
      btnLicense = getElement("btnLicense"),
      proTab = getElement("QuickFolders-Pro");
  let result = licenseInfo.status;
  
  switch(result) {
    case "Valid":
      let today = new Date(),
          later = new Date(today.setDate(today.getDate()+30)), // pretend it's a month later:
          dateString = later.toISOString().substr(0, 10),
          forceExtend = await messenger.LegacyPrefs.getPref("debug.premium.forceShowExtend");
      // if we were a month ahead would this be expired?
      if (licenseInfo.expiryDate < dateString || forceExtend) {
        labelLicenseBtn(btnLicense, "extend");
      }
      else {
        if (licenseInfo.keyType==2) { // standard license
          btnLicense.classList.add("upgrade"); // removes "pulsing" animation
          btnLicense.setAttribute("collapsed",false);
          labelLicenseBtn(btnLicense, "upgrade");
        }
        else
          btnLicense.setAttribute("collapsed",true);
      }
      replaceCssClass(proTab, "paid");
      replaceCssClass(btnLicense, "paid");
      break;
    case "Expired":
      labelLicenseBtn(btnLicense, "renew");
      replaceCssClass(proTab, "expired");
      replaceCssClass(btnLicense, "expired");
      btnLicense.setAttribute("collapsed",false);
      break;
    default:
      labelLicenseBtn(btnLicense, "buy");
      btnLicense.setAttribute("collapsed",false);
      replaceCssClass(btnLicense, "register");
      replaceCssClass(proTab, "free");
  }
}


function pasteLicense() {
  navigator.clipboard.readText().then(
    clipText => {
      if (clipText) {
        let txtBox = document.getElementById('txtLicenseKey');
        txtBox.value = clipText;
        let finalLicense = trimLicense();
        validateNewKey();
      }       
    }
  );
}

async function validateLicenseInOptions(evt = false) {

  let silent = (typeof evt === "object") ? false : evt; // will be an event when called from background script!
      
  // old call to decryptLicense was here
  // 1 - sanitize License
  // 2 - validate license
  // 3 - update options ui with reaction messages; make expiry date visible or hide!; 
  updateLicenseOptionsUI(silent); // async!
  
  // this the updating the first button on the toolbar via the main instance
  // we use the quickfolders label to show if License needs renewal!
  // use notify tools for updating the [QuickFolders] label 
  messenger.runtime.sendMessage({ command:"updateQuickFoldersLabel" });
  
  // 4 - update buy / extend button or hide it.
  configureBuyButton();
  
  configExtra2Button();
  // util.logDebug('validateLicense - result = ' + result);
} 

trimLicense: function trimLicense() {
  let txtBox = document.getElementById('txtLicenseKey'),
      strLicense = txtBox.value.toString();
  // Remove line breaks and extra spaces:
  let trimmedLicense =  
    strLicense.replace(/\r?\n|\r/g, ' ') // replace line breaks with spaces
      .replace(/\s\s+/g, ' ')            // collapse multiple spaces
      .replace('\[at\]','@')
      .trim();
  txtBox.value = trimmedLicense;
  return trimmedLicense;
} 

async function validateNewKey() {
  trimLicense();
  // do a round trip through the background script.
  let rv = await messenger.runtime.sendMessage({command:"updateLicense", key: document.getElementById('txtLicenseKey').value });
}

function initButtons() {
  // License Tab
  document.getElementById("btnValidateLicense").addEventListener("click", validateNewKey);
  document.getElementById("btnPasteLicense").addEventListener("click", pasteLicense);
  
  // Support Tab
  document.getElementById("L1").addEventListener("click", function () {
    messenger.windows.openDefaultBrowser("https://www.youtube.com/channel/UCCiqw9IULdRxig5e-fcPo6A");
  }); // YouTube
  document.getElementById("L2").addEventListener("click", function () {
    messenger.windows.openDefaultBrowser(event,"https://github.com/RealRaven2000/QuickFolders/issues");
  }); // report bugs
  document.getElementById("L3").addEventListener("click", function () {
    messenger.Utilities.showVersionHistory();
  }); // version history
  document.getElementById("L4").addEventListener("click", function () {
    messenger.windows.openDefaultBrowser(event,"https://github.com/RealRaven2000/QuickFolders/tree/ESR91/_locales");
  }); // localization
  document.getElementById("L5").addEventListener("click", function () {
    // options.sendMail(); setTimeout(function() { window.close(); });
  }); // contact me
  
}



async function initBling() {
  const getElement = document.getElementById.bind(document),
        wd = window.document,
        util = QuickFolders.Util,
        getUserStyle = QuickFolders.Preferences.getUserStyle.bind(QuickFolders.Preferences);

/*  PREVIOUS METHOD vs NEW METHOD
  let test = await messenger.Utilities.getUserStyle("ActiveTab","color","#ddFFFF"),
      test2 = await getUserStyle("ActiveTab","color","#ddFFFF");
  */
  
  let col = util.getSystemColor(await getUserStyle("ActiveTab","color","#FFFFFF")), 
      bcol = util.getSystemColor(await getUserStyle("ActiveTab","background-color","#000090"));
  getElement("activetab-colorpicker").value = bcol;
  getElement("activetab-fontcolorpicker").value = col;
  getElement("activetabs-label").style.setProperty('color', col, 'important');
  getElement("activetabs-label").style.backgroundColor = bcol;
  
  bcol = util.getSystemColor(await getUserStyle("InactiveTab","background-color","buttonface"));
  getElement("inactive-colorpicker").value = bcol;
  
  col = util.getSystemColor(await getUserStyle("InactiveTab","color","buttontext"));
  getElement("inactive-fontcolorpicker").value = col;
  getElement("inactivetabs-label").style.setProperty('color', col, 'important');
  
  
  bcol = util.getSystemColor(await getUserStyle("HoveredTab","background-color","#FFFFFF"));
  getElement("hover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("HoveredTab","color","Black"));
  getElement("hover-fontcolorpicker").value = col;
  getElement("hoveredtabs-label").style.setProperty('color', col, 'important');
  getElement("hoveredtabs-label").style.backgroundColor = bcol;

  bcol = util.getSystemColor(await getUserStyle("DragTab","background-color", "#E93903"));
  getElement("dragover-colorpicker").value = bcol;
  col = util.getSystemColor(await getUserStyle("DragTab","color", "White"));
  getElement("dragover-fontcolorpicker").value = col;
  getElement("dragovertabs-label").style.setProperty('color', col, 'important');
  getElement("dragovertabs-label").style.backgroundColor = bcol;
  getElement("toolbar-colorpicker").value = util.getSystemColor(await getUserStyle("Toolbar","background-color", "White"));
  
  getElement("chkShowIconButtons").collapsed = !QuickFolders.Preferences.supportsCustomIcon; 
  
  
  let currentTheme = await QuickFolders.Options.selectTheme(wd, await QuickFolders.Preferences.getCurrentThemeId());

  // initialize Theme Selector by adding original titles to localized versions
  let cbo = getElement("QuickFolders-Theme-Selector"); // HTMLSelectElement
  if (cbo.length) {
    for (let index = 0; index<cbo.itemCount; index++) {
      let item = cbo.options.item( index ),
          theme = QuickFolders.Themes.Theme(item.value);
      if (theme) {
        if (item.label != theme.name)
          item.label = theme.name + ' - ' + item.label
      }
    }  
  }
  
  
  if (false)  { // to do: build HTML palette popups
    let menupopup = getElement("QuickFolders-Options-PalettePopup"); // doesn't exist in HTML!! 
    // we need to rewrite this from scratch for the HTML options dialog
    QuickFolders.Interface.buildPaletteMenu(0, menupopup, true, true);  
    
  }
  
  // customized coloring support
  QuickFolders.Options.initPreviewTabStyles();
      
  
  let paletteType = await QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'),
      disableStriped = !(QuickFolders.Options.stripedSupport(paletteType) || 
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref('style.ColoredTab.paletteType')) ||
                         QuickFolders.Options.stripedSupport(await QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType')));
  
  getElement('qf-individualColors').collapsed = !currentTheme.supportsFeatures.individualColors;
  getElement('qf-individualColors').disabled = disableStriped;
  getElement('ExampleStripedColor').disabled = disableStriped;
  getElement('buttonTransparency').disabled = (paletteType!=0) && disableStriped; // only with "no colors"
  
}

console.log("i18n.updateDocument");
i18n.updateDocument();

loadPrefs();
preselectTab();
initLicenseInfo();
initVersionPanel();
initButtons();
/*  THIS CODE CANNOT WORK "Uncaught ReferenceError: ChromeUtils is not defined"
debugger;
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
*/

initBling();
 
