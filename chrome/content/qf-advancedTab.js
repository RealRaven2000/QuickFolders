"use strict";

QuickFolders.AdvancedTab = {
  ADVANCED_FLAGS: {
    NONE : 0x0000,
    SUPPRESS_UNREAD : 0x0001,
    SUPPRESS_COUNTS : 0x0002,
    CUSTOM_CSS :      0x0100,
    CUSTOM_PALETTE :  0x0200
  } ,
  get folder() {
    return window.arguments[0];
  } ,
  get entry() {
    return window.arguments[1];
  } ,
  get MainQuickFolders() {
    let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(QuickFolders_CI.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");  
    return mail3PaneWindow.QuickFolders;
  } ,
  
  checkIsFlagged: function checkIsFlagged() {
    let e = this.entry;
    // TO DO: check all flags of this entry to see whether it has _any_ advanced settings.
    // in that case return true.
    if (e.advanced) {
      if (e.advanced.flags) {
        if (e.advanced.flags & this.ADVANCED_FLAGS.SUPPRESS_UNREAD)
          return true;
      }
    }
    return false;
  } ,
  
  load: function load() {
    let entry = this.entry,
        elem = document.getElementById.bind(document);
    if (entry.flags) {
      let ig = elem('chkIgnoreUnread'),
          ic = elem('chkIgnoreCounts'),
          iss = elem('chkCustomCSS'),
          ip = elem('chkCustomPalette');
      // ignore unread counts
      ig.checked = (entry.flags & this.ADVANCED_FLAGS.SUPPRESS_UNREAD) && true;
      // ignore all counts
      ic.checked = (entry.flags & this.ADVANCED_FLAGS.SUPPRESS_COUNTS) && true;
      // custom css rules
      iss.checked = (entry.flags & this.ADVANCED_FLAGS.CUSTOM_CSS) && true;
      elem('txtColor').value = entry.cssColor ? entry.cssColor : '';
      elem('txtColorPicker').color = elem('txtColor').value;
      elem('txtBackground').value = entry.cssBack ? entry.cssBack : '';
      // custom palette
      let isPalette = (entry.flags & this.ADVANCED_FLAGS.CUSTOM_PALETTE) && true;
      ip.checked = isPalette;
      if (isPalette) {
        let menuList = elem('menuCustomTabPalette');
        menuList.value = this.entry.customPalette.toString();
      }
    }
    
    let lbl = elem('lblCategories');
    lbl.value = entry.category;
    let tabHeader = elem('myHeader');
    tabHeader.setAttribute('description', entry.name);
    
    // we wait as the width isn't correct on load
    // might be unnecessary as we react to WM_ONRESIZE
    setTimeout(
      function () { QuickFolders.AdvancedTab.resize(); }, 
      2000);  
  } ,
  
  close: function() {
    window.close();
    return true;
  } ,
  
  accept: function accept() {
    this.apply();
    return true;
  } ,
  
  apply: function apply() {
    function addFlag(checkboxId, setFlag) {
      let isFlagged = document.getElementById(checkboxId).checked;
      if (isFlagged) {
        flags = flags | setFlag;
      }
      return isFlagged;
    }
    
    let f = this.folder,
        isChange = false,
        flags = this.ADVANCED_FLAGS.NONE;
    
    addFlag('chkIgnoreUnread', this.ADVANCED_FLAGS.SUPPRESS_UNREAD);
    addFlag('chkIgnoreCounts', this.ADVANCED_FLAGS.SUPPRESS_COUNTS);
    if (addFlag('chkCustomCSS', this.ADVANCED_FLAGS.CUSTOM_CSS)) {
      this.entry.cssColor = document.getElementById('txtColor').value;
      this.entry.cssBack = document.getElementById('txtBackground').value;
    }
    if (addFlag('chkCustomPalette', this.ADVANCED_FLAGS.CUSTOM_PALETTE)) {
      this.entry.customPalette = document.getElementById('menuCustomTabPalette').value;
    }
    else {
      delete this.entry.customPalette;
    }
    
    // .. add more special properties
    
    if (flags)
      this.entry.flags = flags;
    else {
      if (this.entry.flags || this.entry.flags === 0) try {
        delete this.entry.flags; // minimize storage space.
        delete this.entry.cssBack;
        delete this.entry.cssColor;
        delete this.entry.customPalette;
      } catch(ex) {
        QuickFolders.Util.logException('QuickFolders.AdvancedTab.accept()', ex);
      }
    }
    // refresh the model
    // QuickFolders.Interface.updateFolders(false, true);
    QuickFolders.Interface.updateMainWindow();
    this.MainQuickFolders.Model.store();  
  } ,
  
  defaults: function defaults() {
    let elem = document.getElementById.bind(document);
    elem('chkIgnoreUnread').checked = false;
    elem('chkIgnoreCounts').checked = false;
    elem('chkCustomCSS').checked = false;
    elem('chkCustomPalette').checked = false;
    elem('txtColor').value = '';
    elem('txtBackground').value = '';
    this.entry.flags = this.ADVANCED_FLAGS.NONE;
    // let's close the window with apply to unclunk it
    this.accept();
    window.close();
  } ,
  
  resize: function resize() {
    // make sure the window is placed below the referenced Tab, but not clipped by screen edge
    let x = window.screenX;
    let y = window.screenY;
    QuickFolders.Util.logDebug('Move window: \n' +
      'Screen width      : ' + window.screen.width + '\n' +
      'Window outer width: ' + window.outerWidth + '\n' +
      'Current x position: ' + (x) + '\n' +
      'Right hand edge   : ' + (x + window.outerWidth) + '\n'
      );
    let x2 = window.screen.width - window.outerWidth;
    if (x+window.outerWidth > window.screen.width) {
      window.moveTo(x2, y);
    }
    
  } ,
  
  configureCategory: function configureCategory() {
    let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(QuickFolders_CI.nsIWindowMediator)
				.getMostRecentWindow("mail:3pane");  
    QuickFolders.Interface.configureCategory(this.folder, mail3PaneWindow.QuickFolders); // should actually get the "parent" QuickFolders
    let lbl = document.getElementById('lblCategories');
    lbl.value = this.entry.category + " *";
  } ,
  
  getCssGradient: function getCssGradient(evt) {
    this.MainQuickFolders.Util.openURL(evt,'http://www.colorzilla.com/gradient-editor');
  } ,
  
  getCssColor: function getCssColor(evt) {
    this.MainQuickFolders.Util.openURL(evt,'https://developer.mozilla.org/en-US/docs/Web/CSS/color');
  } ,
  
  pickColor: function pickColor(color) {
    document.getElementById('txtColor').value = color;
    this.apply();
    return true;
  } ,
  
  updatePicker: function updatePicker(textbox) {
    if (textbox.length) {
      document.getElementById('txtColorPicker').color = textbox.value;
    }
  } ,
  
  updatePalette: function updatePalette() {
    // alert ('palette update');
  } ,
  
  selectPalette: function selectPalette(el, paletteId) {
    this.entry.customPalette = paletteId;
    document.getElementById('chkCustomPalette').checked = true;
  } 
  
    
}  // AdvancedTab

