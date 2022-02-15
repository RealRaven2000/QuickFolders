// parts from the old options interface that are specific for the options dialog UI
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Options = {

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
  preparePreviewTab: async function preparePreviewTab(colorPickerId, preference, previewId, paletteColor, paletteType) {
    const prefs = QuickFolders.Preferences;
    let wd = window.document,
        previewTab = wd.getElementById(previewId),
        colorPicker = colorPickerId ? wd.getElementById(colorPickerId) : null;
    
    // Address [Bug 25589] - when color is set from a drop down, the preference wasn't transmitted leading to wrong palette (always 1)
    if (!preference) {  
      switch(previewId) {
        case "inactivetabs-label":
          preference = "style.InactiveTab.";
          break;
        case "activetabs-label":
          preference = "style.ActiveTab.";
          break;
        case "hoveredtabs-label":
          preference = "style.HoveredTab.";
          break;
        case "dragovertabs-label":
          preference = "style.DragOver.";
          break;
      }
    }
    let paletteKey = paletteType;
    if (null == paletteType || typeof paletteType == "undefined") {
      paletteKey = await prefs.getIntPref(preference + "paletteType");
    }
    let paletteClass = await QuickFolders.Interface.getPaletteClassToken(paletteKey);
    
    
    if (paletteKey) { // use a palette
      let paletteIndex = paletteColor;
      if (null== paletteColor || typeof paletteColor == "undefined") {
        paletteIndex = await prefs.getIntPref(preference + "paletteEntry");
      }
                         
      // hide the color picker when not striped
      if (colorPicker) {
        if (colorPickerId=='inactive-colorpicker') {
          if (await prefs.getIntPref("colorTabStyle")==prefs.TABS_STRIPED)
            paletteIndex = '' + paletteIndex + 'striped';
        }
        else {
          // do not hide background color for active tab so we can adjust  
          // the bottom border color of the toolbar
          if (colorPickerId!='activetab-colorpicker')
            colorPicker.collapsed = true;
        }
      }
      
      previewTab.className = 'qfTabPreview col' + paletteIndex + paletteClass;
    }
    else {
      previewTab.className = 'qfTabPreview';
      if (colorPicker) {
        colorPicker.collapsed = false; // paletteKey = 0  ->  no palette
        let transcol =
          (previewId=='inactivetabs-label') 
            ? this.getTransparent(colorPicker.value, await prefs.getBoolPref("transparentButtons"))
            : colorPicker.value;
        previewTab.style.backgroundColor = transcol;
      }
      
    }
  },
  
  colorPickerTranslucent: function colorPickerTranslucent(picker) {
    document.getElementById('inactivetabs-label').style.backgroundColor=
      this.getTransparent(picker.value, document.getElementById('buttonTransparency').checked);
    this.styleUpdate('InactiveTab','background-color', picker.value);
  },  
  
  getTransparent: function getTransparent(color, transparent) {
    return QuickFolders.Util.getRGBA(color, transparent ? 0.25 : 1.0);
  },
  
  styleUpdate: async function styleUpdate(elementName, elementStyle, styleValue, label ) {
    let util = QuickFolders.Util;
    messenger.Utilities.logDebug("styleUpdate(" + elementName + ")...");
    util.logDebugOptional('interface.buttonStyles', 'styleUpdate(' + elementName + ', ' + elementStyle + ', ' + styleValue + ')');
    await QuickFolders.Preferences.setUserStyle(elementName, elementStyle, styleValue);
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
    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "true" });
    messenger.runtime.sendMessage({ command:"updateFoldersUI", minimal: "true" });
    return true;  // return updateResult;
  },
  

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
  showPalettePreview: async function showPalettePreview(withUpdate) {
    let defaultPalette = await QuickFolders.Preferences.getIntPref('style.InactiveTab.paletteType'),
        isPastel = (defaultPalette == 2),
        getElement = document.getElementById.bind(document);
    
    // we need to solve the radio element background image being displayed by setting the src attribute.
    // probably should be a CSS style instead?
    getElement('ExampleStripedColor').src = isPastel ? "../chrome/content/skin/ico/striped-example-pastel.gif" : "../chrome/content/skin/ico/striped-example.gif";
    getElement('ExampleFilledColor').src = isPastel ? "../chrome/content/skin/ico/full-example-pastel.gif" : "../chrome/content/skin/ico/full-example.gif";

    let picker = getElement('inactive-colorpicker');
  
    getElement("activetabs-label").style.backgroundColor = this.getTransparent(picker.value, isPastel);
    QuickFolders.Preferences.setUserStyle("InactiveTab","background-color", picker.value);
    QuickFolders.Preferences.setBoolPref("pastelColors", isPastel);
    
    this.initPreviewTabStyles();
    
    if (withUpdate) {
      QuickFolders.Options.updateMainWindow(); 
    }
  },
  
  setColoredTabStyleFromRadioGroup: function setColoredTabStyleFromRadioGroup(rgroup) {
    let styleId = parseInt(rgroup.value, 10);
    this.setColoredTabStyle(styleId, true);
  },
  
  // select: striped style / filled style
  setColoredTabStyle: async function setColoredTabStyle(styleId, force) {
    const prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface;
    if (!force && await prefs.getIntPref("colorTabStyle") == styleId)
      return; // no change!
    await prefs.setIntPref("colorTabStyle", styleId); // 0 striped 1 filled
    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); 
    QuickFolders.Options.updateMainWindow(false)
    
    let inactiveTab = document.getElementById('inactivetabs-label');
    QI.applyTabStyle(inactiveTab, styleId);
  },   
  
  getButtonStatePrefId: function getButtonStatePrefId(buttonState) {
    switch(buttonState) {
      case "colored":
        return "ColoredTab";
      case "standard":
        return "InactiveTab";
      case "active":
        return "ActiveTab";
      case "hovered":
        return "HoveredTab";
      case "dragOver":
        return "DragOver";
      default:
        throw("QuickFolders.Options.getButtonStatePrefId - Invalid buttonState: " + buttonState); // error!
    }
  } ,
  
  getButtonMenuId: function getButtonMenuId(buttonState) {
    switch(buttonState) {
      case "colored":
        return "menuColoredPalette";
      case "standard":
        return "menuStandardPalette";
      case "active":
        return "menuActiveTabPalette";
      case "hovered":
        return "menuHoverPalette";
      case "dragOver":
        return "menuDragOverPalette";
      default:
        throw("QuickFolders.Options.getButtonMenuId - Invalid buttonState: " + buttonState); // error!
    }
  } ,
    
  /*********************
   * toggleUsePalette() 
   * Set whether (and which) palette is used for a particular tab state.
   * also hides background colorpicker if a palette is used
   * @buttonState:   [string] which kind of tab state: standard, active, hovered, dragOver
   * @paletteType:   0 none, 1 plastic, 2 pastel, 3 night ....
   * @isUpdatePanelColor:  when switching palette type from dropdown, update color on button -> UI
   */  
  toggleUsePalette: async function toggleUsePalette(buttonState, paletteType, isUpdatePanelColor) {
    //let isChecked = checkbox.checked;
    const prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface;
    let getElement = document.getElementById.bind(document);
        
    if (typeof paletteType === "string")
      paletteType = parseInt(paletteType); // convert to int
        
    let idPreview = null,
        colorPicker = null,
        stylePref = this.getButtonStatePrefId(buttonState),
        isStripable = null,
        isTransparentSupport = false;
    switch(buttonState) {
      case 'colored':
        isStripable = this.stripedSupport(paletteType) || this.stripedSupport(await prefs.getIntPref('style.ColoredTab.paletteType'));
        break;
      case 'standard':
        idPreview = 'inactivetabs-label';
        colorPicker = 'inactive-colorpicker';
        isStripable = this.stripedSupport(paletteType) || this.stripedSupport(await prefs.getIntPref('style.ColoredTab.paletteType'));
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
    if (isStripable && paletteType==3) isStripable = false;
    if (isUpdatePanelColor) {
      getElement('buttonTransparency').disabled = !isTransparentSupport;
      // do not allow striped style if Night Vision is selected
      // [Bug 26348] 
      if (isStripable === null) {
          isStripable = this.stripedSupport(await prefs.getIntPref('style.ColoredTab.paletteType'))
                        ||
                        this.stripedSupport(await prefs.getIntPref('style.InactiveTab.paletteType'));
      }
      
      if (!isStripable) {
        this.setColoredTabStyle(prefs.TABS_FILLED);
      }
      getElement('qf-individualColors').disabled = !isStripable;
      getElement('ExampleStripedColor').disabled = !isStripable;
    }
    
    // preparePreviewTab(id, preference, previewId)
    await prefs.setIntPref('style.' + stylePref + '.paletteType', paletteType);
    if (colorPicker) {
      this.preparePreviewTab(colorPicker, 'style.' + stylePref + '.', idPreview, null, paletteType);
      // we need to force reselect the palette entry of the button
      // to update font & background color
      if (isUpdatePanelColor) {
        let m = getElement('QuickFolders-Options-PalettePopup');
        if (m) {
          // if (!m.targetNode)
          m.targetNode = (buttonState == 'colored') ? 
                         null : getElement(QI.getPreviewButtonId(buttonState));
          // retrieve palette index
          let col = await prefs.getIntPref('style.' + stylePref + '.paletteEntry');
          QI.setTabColorFromMenu(m.firstChild, col.toString()); // simulate a menu item! 155 lines of LEGACY code ...
        }
      }
    }
  },  
  
  stripedSupport : function(paletteType) {
    switch(parseInt(paletteType)) {
      case 1: // Standard Palette
        return true;
      case 2: // Pastel Palette
        return true;
      default: // 2 colors or  night vision do not support "striped" style
        return false;
    }
  },
  
  updateNavigationBar: function updateNavigationBar() {
    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateNavigationBar" }); 
    messenger.runtime.sendMessage({ command:"updateNavigationBar" });
  },
  
  updateMainWindow: function updateMainWindow(minimal = false) {
    // QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" });
    messenger.runtime.sendMessage({ command:"updateMainWindow", minimal: minimal ? "true" : "false" });
  },
  
  selectTheme : function (wd, themeId, isUpdateUI = false) {
    const util = QuickFolders.Util,
          QI = QuickFolders.Interface;
    let myTheme = QuickFolders.Themes.Theme(themeId),
        getElement = wd.getElementById.bind(wd);
    if (myTheme) {
      try {
        getElement("QuickFolders-Theme-Selector").value = themeId;
        getElement("Quickfolders-Theme-Author").textContent =  myTheme.author;

        // textContent wraps, value doesnt
        let themeDescription = messenger.i18n.getMessage("qf.themes." + themeId + ".description") || "N/A";
        getElement("Quickfolders-Theme-Description").textContent = themeDescription;
        getElement("qf-options-icons").disabled = !(myTheme.supportsFeatures.specialIcons);
        getElement("qf-options-shadow").disabled = !(myTheme.supportsFeatures.buttonShadows);
        getElement("button-font-size").disabled = !(myTheme.supportsFeatures.supportsFontSize);
        getElement("button-font-size-label").disabled = !(myTheme.supportsFeatures.supportsFontSize);
        getElement("btnHeightTweaks").collapsed = !(myTheme.supportsFeatures.supportsHeightTweaks);
        getElement("qf-tweakRadius").collapsed = !(myTheme.supportsFeatures.cornerRadius);
        getElement("qf-tweakToolbarBorder").collapsed = !(myTheme.supportsFeatures.toolbarBorder);
        getElement("qf-tweakColors").collapsed = !(myTheme.supportsFeatures.stateColors || myTheme.supportsFeatures.individualColors);
        getElement("qf-individualColors").collapsed = !(myTheme.supportsFeatures.individualColors);
        getElement("qf-StandardColors").collapsed = !(myTheme.supportsFeatures.standardTabColor);
        getElement("buttonTransparency").collapsed = !(myTheme.supportsFeatures.tabTransparency);
        getElement("qf-stateColors").collapsed = !(myTheme.supportsFeatures.stateColors);
        getElement("qf-stateColors-defaultButton").collapsed = !(myTheme.supportsFeatures.stateColors);
      }
      catch(ex) {
        // util.logException('Exception during QuickFolders.Options.selectTheme: ', ex); 
        console.error("Exception during QuickFolders.Options.selectTheme: ", ex); 
      }

      /******  FOR FUTURE USE ??  ******/
      // if (myTheme.supportsFeatures.supportsFontSelection)
      // if (myTheme.supportsFeatures.buttonInnerShadows)
      messenger.Utilities.logDebug ("Theme [" + myTheme.Id + "] selected");
    
      if (isUpdateUI) {
        // window.QuickFolders.Util.notifyTools.notifyBackground({ func: "updateFoldersUI" }); 
        messenger.runtime.sendMessage({ command:"updateFoldersUI" });
      }
    }
    return myTheme;
  },

  enablePremiumConfig : function (isEnabled) {
    let getElement      = document.getElementById.bind(document),
        premiumConfig   = getElement("premiumConfig"),
        quickJump       = getElement("chkQuickJumpHotkey"),
        quickMove       = getElement("chkQuickMoveHotkey"),
        quickCopy       = getElement("chkQuickCopyHotkey"),
        skipFolder      = getElement("chkSkipFolderHotkey"),
        quickJumpTxt    = getElement("qf-QuickJumpShortcut"),
        quickMoveTxt    = getElement("qf-QuickMoveShortcut"),
        quickCopyTxt    = getElement("qf-QuickCopyShortcut"),
        quickMoveAutoFill = getElement("chkQuickMoveAutoFill"),
        skipFolderTxt   = getElement("qf-SkipFolderShortcut"),
        quickMoveFormat = getElement("menuQuickMoveFormat"),
        quickMoveDepth  = getElement("quickmove-path-depth"),
        quickMoveAdvanced = getElement("quickMoveAdvanced"),
        multiCategories = getElement("chkCategories");
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
    QuickFolders.Options.enableStandardConfig(isEnabled);
  },

  enableStandardConfig : function (isEnabled) {
    let getElement      = document.getElementById.bind(document),
        chkConfigIncludeTabs = getElement("chkConfigIncludeTabs"),
        chkConfigGeneral= getElement("chkConfigIncludeGeneral"),
        chkConfigLayout = getElement("chkConfigIncludeLayout"),
        btnLoadConfig   = getElement("btnLoadConfig");
    btnLoadConfig.disabled = !isEnabled;
    chkConfigGeneral.disabled = !isEnabled;
    chkConfigIncludeTabs.disabled = !isEnabled;
    chkConfigLayout.disabled = !isEnabled;
  },

  updateLicenseOptionsUI : async function (silent = false) {
    let getElement = document.getElementById.bind(document),
        validationPassed       = getElement("validationPassed"),
        validationStandard     = getElement("validationStandard"),
        validationFailed       = getElement("validationFailed"),
        validationInvalidAddon = getElement("validationInvalidAddon"),
        validationExpired      = getElement("validationExpired"),
        validationInvalidEmail = getElement("validationInvalidEmail"),
        validationEmailNoMatch = getElement("validationEmailNoMatch"),
        validationDate         = getElement("validationDate"),
        validationDateSpace    = getElement("validationDateSpace"),
        licenseDate            = getElement("licenseDate"),
        licenseDateLabel       = getElement("licenseDateLabel"),
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
    QuickFolders.Options.enablePremiumConfig(false);
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
            QuickFolders.Options.showValidationMessage(validationStandard, silent);
            QuickFolders.Options.enableStandardConfig(true);
          }
          else {
            QuickFolders.Options.enablePremiumConfig(true);
            QuickFolders.Options.showValidationMessage(validationPassed, silent);
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
              QuickFolders.Options.showValidationMessage(validationFailed, silent);
          }
          if (addonName) {
            let txt = validationInvalidAddon.textContent;
            txt = txt.replace('{0}','QuickFolders').replace('{1}','QF'); // keys for {0} start with {1}
            if (txt.indexOf(addonName) < 0) {
              txt += " " + getBundleString("qf.licenseValidation.guessAddon").replace('{2}',addonName);
            }
            validationInvalidAddon.textContent = txt;
            QuickFolders.Options.showValidationMessage(validationInvalidAddon, silent);
          }
          break;
        case "Expired":
          licenseDateLabel.value = getBundleString("qf.licenseValidation.expired");
          licenseDate.textContent = niceDate;
          QuickFolders.Options.showValidationMessage(validationExpired, false); // always show
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
          QuickFolders.Options.showValidationMessage(validationFailed, true);
          QuickFolders.Options.showValidationMessage(validationEmailNoMatch, silent);
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
  },
  
  // make a validation message visible but also repeat a notification for screen readers.
  showValidationMessage : async function (el, silent=true) {
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
  },
    
  
  // put appropriate label on the license button and pass back the label text as well
  labelLicenseBtn : function (btnLicense, validStatus) {
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
  },
  
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
  } ,

  validateNewKey : async function () {
    QuickFolders.Options.trimLicense();
    // do a round trip through the background script.
    let rv = await messenger.runtime.sendMessage({command:"updateLicense", key: document.getElementById('txtLicenseKey').value });
  },
  
  pasteLicense : function () {
    navigator.clipboard.readText().then(
      clipText => {
        if (clipText) {
          let txtBox = document.getElementById('txtLicenseKey');
          txtBox.value = clipText;
          let finalLicense = trimLicense();
          QuickFolders.Options.validateNewKey();
        }       
      }
    );
  }
  
  
  
}  // QuickFolders.Options

