"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
QuickFolders.Util = {
  ADDON_ID: "quickfolders@curious.be",
  ADDON_NAME: "QuickFolders",
  ADDON_SUPPORT_MAIL: "axel.grude@gmail.com",
  ADVANCED_FLAGS: {
    NONE : 0x0000,
    SUPPRESS_UNREAD : 0x0001,
    SUPPRESS_COUNTS : 0x0002,
    EMAIL_RECURSIVE : 0x0004,
    CUSTOM_CSS :      0x0100,
    CUSTOM_PALETTE :  0x0200,
    IGNORE_QUICKJUMP: 0x0400,
    SETMAIL_UNREAD:   0x0800         // [Bug 26683]
  } , 
  
  init: async function() {
    // mx // TO DO
    QuickFolders.Util.licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
    
  },
  
  getSystemColor : function (sColorString) {
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }

    try {
      let container = document.getElementById("colorTest");
      if (!container) return sColorString;
      
      if (sColorString.startsWith('rgb')) {
        // rgb colors.
        let components = sColorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/),
            hexColor = "#" + hex(components[1]) + hex(components[2]) + hex(components[3]); // ignore transparency
        return hexColor;
      }
      let theColor, // convert system colors such as menubackground etc. to hex
          d = document.createElement("div");
      d.style.color = sColorString;
      container.appendChild(d)
      theColor = window.getComputedStyle(d,null).color;
      container.removeChild(d);

      if (theColor.search("rgb") == -1)
        return theColor; // unchanged
      else {
        // rgb colors.
        theColor = theColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        let hexColor = "#" + hex(theColor[1]) + hex(theColor[2]) + hex(theColor[3]);
        return hexColor;
      }
    }
    catch(ex) { // Bug 26387
      debugger;
      console.error("getSystemColor(" + sColorString + ") failed", ex);
      return "#000000";
    }

  },  
  
  getRGBA: function getRGBA(hexIn, alpha) {
    function cutHex(h) {
      let rv = ((h.toString()).charAt(0)=='#') ? h.substring(1,7) : h;
      return rv.toString();
    }
    function HexToR(h) {
      return parseInt(h.substring(0,2),16);
    }
    function HexToG(h) {
      return parseInt(h.substring(2,4),16);
    }
    function HexToB(h) {
      return parseInt(h.substring(4,6),16);
    }

    let hex = hexIn,
        isRGB = (hexIn.indexOf('rgb')>=0),
        isRGBA = (hexIn.indexOf('rgba')>=0);
    if (isRGB) {
      // inject alpha value:
      let li = isRGBA ?
               hexIn.lastIndexOf(',') :   // replace alpha
               hexIn.indexOf(')');        // append alpha
      hex = hexIn.substring(0, li) + ',' +  alpha.toString() +')';
      if (!isRGBA)
        hex = hex.replace('rgb','rgba');
      return hex;
    }
    else {
      try {
        if (hex.charAt(0) == '#')
          parseInt(cutHex(hex),16);
        else
          hex = QuickFolders.Util.getSystemColor(hex);
      }
      catch(e) {
        hex = QuickFolders.Util.getSystemColor(hex);
      }
    }
    if (hex) { // 6 digit hex string
      hex = cutHex(hex);
      let r = HexToR(hex).toString();
      let g = HexToG(hex).toString();
      let b = HexToB(hex).toString();
      return "rgba(" + r + ',' + g + ',' + b + ',' + alpha.toString() +')';
    }
    else {
      QuickFolders.Util.logDebugOptional ("css", "Can not retrieve color value: " + hexIn);
      return "#666";
    }
  },  
  
  clearChildren: function clearChildren(element, withCategories) {
    if (!element) return;
    QuickFolders.Util.logDebugOptional ("events","clearChildren(withCategories= " + withCategories + ")");
    if (withCategories)
      while(element.children.length > 0) {
        element.removeChild(element.children[0]);
      }
    else {
      let nCount=0; // skip removal of category selection box
      while(element.children.length > nCount) {
        if (element.children[nCount].id=='QuickFolders-Category-Box')
          nCount++;
        else
          element.removeChild(element.children[nCount]);
      }
    }
  } ,  
  
  $: function(id) {
    // get an element from the custom folder UI for manipulating
    let doc = document; // we want the main document (NOPE) but we might need the Current Folder Bar later!!
    // if (doc.documentElement && doc.documentElement.tagName) {
      // if (doc.documentElement.tagName=="prefwindow" || doc.documentElement.tagName=="dialog") {
          // let mail3PaneWindow = QuickFolders.Util.getMail3PaneWindow();
          // if (mail3PaneWindow && mail3PaneWindow.document)
            // doc = mail3PaneWindow.document;
      // }
    // }
    let elem = doc.getElementById(id);
    return elem;
  } ,
  
  // if folder is deleted we should not throw an error!
  getCurrentFolder: async function() { // WAS get CurrentFolder
    let aFolder = await messenger.Utilities.getCurrentFolder();
    return aFolder;
  } ,
  
  logTime: function logTime() {
    let timePassed = '',
        end = new Date(),
        endTime = end.getTime();
    try { // AG added time logging for test
      if (this.lastTime==0) {
        this.lastTime = endTime;
        return "[logTime init]"
      }
      let elapsed = new String(endTime - this.lastTime); // time in milliseconds
      timePassed = '[' + elapsed + ' ms]   ';
      this.lastTime = endTime; // remember last time
    }
    catch(e) {;}
    return end.getHours() + ':' + end.getMinutes() + ':' + end.getSeconds() + '.' + end.getMilliseconds() + '  ' + timePassed;
  },
  
  // first argument is the option tag
  logWithOption: function logWithOption(a) {
    arguments[0] =  "QuickFolders "
      +  '{' + arguments[0].toUpperCase() + '} ' 
      + QuickFolders.Util.logTime() + "\n";
    console.log(...arguments);
  },

  logToConsole: function logToConsole(a) {
    let msg = "QuickFolders " + QuickFolders.Util.logTime() + "\n";
    console.log(msg, ...arguments);
  },

  logException: function logException(aMessage, ex) {
    let stack = ''
    if (typeof ex.stack!='undefined')
      stack= ex.stack.replace("@","\n  ");
    // let's display a caught exception as a warning.
    let fn = ex.fileName || "?";
    // this.logError(aMessage + "\n" + ex.message, fn, stack, ex.lineNumber, 0, 0x1);
    console.error(aMessage, ex);
  },

  logDebug: async function (a) {
    if (QuickFolders.Preferences.isDebug) {
      this.logToConsole(...arguments);  /* ...msg */
    }
  },
  
  /** 
  * only logs if debug mode is set and specific debug option are active
  * 
  * @optionString {string}: comma delimited options
  * @msg {string}: text to log 
  */   
  logDebugOptional: async function(optionString, msg) {
    let options = optionString.split(',');
    for (let i=0; i<options.length; i++) {
      let option = options[i];
      if (await QuickFolders.Preferences.isDebugOption(option)) {
        this.logWithOption(...arguments);
        break; // only log once, in case multiple log switches are on
      }
    }
  },
  
///// 1365  
  getBundleString: function (id, substitions = []) { // moved from local copies in various modules.
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
  },
  
  
///// 1398  
  getFolderTooltip: function getFolderTooltip(folder, btnLabel) {
    // tooltip - see also Attributes section of
    // https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIMsgFolder#getUriForMsg.28.29
    // and docs for nsIMsgIncomingServer
    let getPref = function(arg) { return QuickFolders.Preferences.getBoolPref('tooltips.' + arg); },
        sVirtual = folder && (folder.type == "virtual") ? " (virtual)" : "",
        baseFolder = '',
        srvName = '',
        tooltip = '',
        folderName = '',
        flags = '';
    if (!folder) {
      if (btnLabel)
        return "No Folder for [" + btnLabel + "] - try the 'Find Orphaned Tabs' command.";
      return "Missing Folder - try the 'Find Orphaned Tabs' command.";
    }
    
    try {
      folderName = folder.name;
    }
    catch(ex) {
      folderName = 'no name?';
      this.logException('No folder.name for folder:' + folder.toString() + '!', ex);
    }
    
    try {
      try {
        let srv = folder.server;
        if (getPref('serverName')) {
          if (srv) {
            try {srvName = ' [' + srv.hostName + ']';}
            catch(e) { };
          }
        }
      }
      catch(ex) {
        this.logException('No folder.server for folder:' + folderName + '!', ex);
      }
      
      if (getPref('baseFolder')) {
        try {
          if (folder.rootFolder) {
            try {baseFolder = ' - ' + folder.rootFolder.name;}
            catch(e) { };
          }
          else
            this.logDebug('getFolderTooltip() - No rootFolder on: ' + folderName + '!');
        }
        catch(e) { 
          this.logDebug('getFolderTooltip() - No rootFolder on: ' + folderName + '!');
        };
      }
      
      if (getPref('msgFolderFlags')) { // no flags available
        flags = ' ' + folder.type;
      }
    
      if (getPref('parentFolder')) {
        let parent = folder.parent;
        if (parent && !parent.isServer) {
          tooltip += parent.name+'/';
        }
      }
    } // outer try for "foreign" objects, such as localfolders
    catch(ex) {
      this.logDebug('could not retrieve tooltip data for a folder');
    }
    
    tooltip += folderName + baseFolder + srvName + flags;
    tooltip += getPref('virtualFlag') ? sVirtual : '';

    return tooltip;
  },

//////1591

  getAnonymousNodes(doc,el) {
    let aN = [];
    for (let i = el.childNodes.length-1; i>0; i--) {
      let c = el.childNodes[i];
      if (!c.getAttribute("id") && !c.getAttribute("name"))
        aN.push(c);
    }
    return aN;
  } ,
      
  
} // QuickFolders.Util

