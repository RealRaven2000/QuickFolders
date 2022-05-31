"use strict";
/* 
  BEGIN LICENSE BLOCK

  QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');

QuickFolders.Options = {
  
  load: async function load() {
    const util = QuickFolders.Util,
          prefs = QuickFolders.Preferences,
          QI = QuickFolders.Interface,
          options = QuickFolders.Options;
    
    // get important state info from background
    await QuickFolders.Util.init();
    
    let isOptionsTab = window.arguments && window.arguments.length>1;
          
    util.logDebug("QuickFolders.Options.load()");
    
    if (prefs.isDebugOption('options')) debugger;
    // version number must be copied over first!
    if (isOptionsTab && window.arguments[1].inn.instance) {
      // QuickFolders = window.arguments[1].inn.instance; // avoid creating a new QuickFolders instance, reuse the one passed in!!
      util.mExtensionVer = window.arguments[1].inn.instance.Util.Version;
    }
    let version = util.Version,
        wd = window.document,
        getElement = wd.getElementById.bind(wd);
    
    if (!version) debugger;
    
    util.logDebugOptional('options', 'QuickFolders.Options.load()');
    let modeNum = -1;
    if (isOptionsTab) {
      try {
        this.optionsMode = window.arguments[1].inn.mode;
        // force selection of a certain pane (-1 ignores)
        if (this.optionsMode) {
          switch (this.optionsMode) {
            case "helpOnly":
              modeNum = this.QF_PREF_HELP;
              break;
            case "supportOnly":
              modeNum = this.QF_PREF_SUPPORT;
              break;
            case "licenseKey":
              modeNum = this.QF_PREF_LICENSE;
              break;
          }
        }
        if (modeNum >= 0)
          prefs.setIntPref('lastSelectedOptionsTab', modeNum);
      }
      catch(e) {;}
    }
    
    // convert from string "24px" to number "24"
    let minToolbarHeight = prefs.getStringPref('toolbar.minHeight'),
        mT = parseInt(minToolbarHeight);
    if (minToolbarHeight.indexOf('px' > 0)) {
      prefs.setStringPref('toolbar.minHeight', mT.toString());
    }
    else if (minToolbarHeight.indexOf('em' > 0)) {
      // convert to px based on 12px default size (might be wrong for Mac+Linux)
      prefs.setStringPref('toolbar.minHeight', (mT*12).toString()) ;  // 12 px default font size.
    }

    if (version=="") version='version?';
    // Error: TypeError: 'getElementById' called on an object that does not implement interface Document.
    getElement("qf-options-header-description").setAttribute("value", version);
    let tabbox = getElement("QuickFolders-Options-Tabbox");
    
    if (getElement('chkShowRepairFolderButton').label) {
      getElement('chkShowRepairFolderButton').label = QI.getUIstring("qfFolderRepair","Repair Folder");
    }
    else { // HTML version
      getElement('chkShowRepairFolderButton').parentNode.value=QI.getUIstring("qfFolderRepair","Repair Folder");
    }
    
    
    /*****  License  *****/
    options.labelLicenseBtn(getElement("btnLicense"), "buy");
    getElement('txtLicenseKey').value = QuickFolders.Util.licenseInfo.licenseKey;    
    if (QuickFolders.Util.licenseInfo.licenseKey) {
      this.validateLicenseInOptions(true);      
    }
    // add an event listener for changes:
    window.addEventListener("QuickFolders.BackgroundUpdate", this.validateLicenseInOptions.bind(this));
    
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
          if (!keep.includes(i)) {
            let panel = tabbox.tabpanels.children[i];
            util.logDebugOptional('options', 'collapsing panel: ' + panel.id + '…');
            panel.collapsed = true;
            // tabbox.tabpanels.removeChild(panel);
            tabbox.tabs.getItemAtIndex(i).collapsed = true; // removeItemAt();
          }
        }
      }
      earlyExit = true; // we do not set any values!
    }
    
    let displayPanel = null;
    switch(this.optionsMode) {
      case "licenseKey":
        displayPanel = getElement('QuickFolders-Options-goPro');
        break;
      case "helpOnly":
        displayPanel = getElement('QuickFolders-Options-quickhelp');
        break;
      case "supportOnly":
        displayPanel = getElement('QuickFolders-Options-support');
        break;
    }
    if (displayPanel) {
      // tabbox.selectedPanel = displayPanel;
      displayPanel.collapsed = false;
      // for some reason it always stays at the last one
      setTimeout(function() {
        tabbox.selectedPanel = displayPanel;
      }, 150);
      
    }
  
    if (earlyExit) return;
    if (QuickFolders.Util.licenseInfo.status == "Valid")
      setTimeout(function() { 
          util.logDebug('Remove animations in options dialog…');
          QI.removeAnimations('quickfolders-options.css');
        }
      );
    
    util.logDebugOptional('options', 'QuickFolders.Options.load - continue with palette + bling initialisation');
    /***** Menu Items / Labels *****/
    // bundle strings
    // getElement("chkShowFolderMenuButton").label = util.getBundleString("qfFolderPopup");
    this.setCurrentToolbarBackground(prefs.getStringPref('currentFolderBar.background.selection'), false);  

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
    
    // using main window elements to read system colors - should we do this via notifyTools, too?
    let main = util.getMail3PaneWindow(),
        getMainElement = main.QuickFolders.Util.$,
        mainToolbox = getMainElement('mail-toolbox'),
        messengerWin = getMainElement('messengerWindow'),
        backColor = main.getComputedStyle(mainToolbox).getPropertyValue("background-color"),
        backImage = main.getComputedStyle(messengerWin).getPropertyValue("background-image"),
        newTabMenuItem = getMainElement('folderPaneContext-openNewTab');
    if (newTabMenuItem && newTabMenuItem.label) {
      if (getElement('qfOpenInNewTab').label) {
        getElement('qfOpenInNewTab').label = newTabMenuItem.label.toString();
      }
      else { // HTML conversion
        getElement('qfOpenInNewTab').parentNode.value = newTabMenuItem.label.toString();
      }
      
    }
        
    // where theme styling fails.   
    if (backColor) {
      if (prefs.isDebugOption('options')) debugger;
      getElement('qf-flat-toolbar').style.setProperty('background-color', backColor);     
      getElement('qf-header-container').style.setProperty('background-color', backColor);
    }
    if (backImage) {
      getElement('qf-flat-toolbar').style.setProperty('background-image', backImage);     
      getElement('qf-flat-toolbar').style.setProperty("background-position","left top");
      getElement('qf-header-container').style.setProperty('background-image', backImage);
      getElement('qf-header-container').style.setProperty("background-position","right top")
    }
    
    util.loadPlatformStylesheet(window);
    
    let panels = getElement('QuickFolders-Panels');
    window.addEventListener('dialogaccept', function () { QuickFolders.Options.accept(); });
    window.addEventListener('dialogcancel', function () { QuickFolders.Options.close(); });
    window.addEventListener('dialogextra2', function (event) { 
      setTimeout(
        function() { 
          QuickFolders.Interface.showLicenseDialog('options_' + QuickFolders.Options.currentOptionsTab); 
          window.close(); 
        }
      );
    });
    try {
      let selectOptionsPane = prefs.getIntPref('lastSelectedOptionsTab');
      if (selectOptionsPane >=0) {
        panels.selectedIndex = selectOptionsPane; // for some reason the tab doesn't get selected
        let firstTabOffset = (panels.tabbox.tabs.children[0].tagName == 'tab') ? 0 : 1;
        panels.tabbox.selectedTab = panels.tabbox.tabs.children[selectOptionsPane + firstTabOffset];
      }
    }
    catch(e) { ; }
    panels.addEventListener('select', function(evt) { QuickFolders.Options.onTabSelect(panels,evt); } );
    options.configExtra2Button();
    
    // dialog buttons are in a shadow DOM which needs to load its own css.
    // https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM
    let linkEl = document.createElement("link");
    linkEl.setAttribute("href", "chrome://quickfolders/content/contribute.css");
    linkEl.setAttribute("type", "text/css");
    linkEl.setAttribute("rel", "stylesheet");
    document.documentElement.firstChild.shadowRoot.appendChild(linkEl);
    
    util.logDebug("QuickFolders.Options.load() - COMPLETE");
  },
  
}


