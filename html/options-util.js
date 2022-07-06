"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


// Functions from quickfolders-util - specific to options.js
QuickFolders.Util = {
  ADDON_ID: "quickfolders@curious.be",
  ADDON_NAME: "QuickFolders",
  ADDON_SUPPORT_MAIL: "axel.grude@gmail.com",
  
  getSystemColor : function (sColorString) {
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }

    try {
      let container = document.getElementById("qf-options-prefpane");
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
  
  openLinkInTab: function(uri) {
    browser.tabs.create(
      {active:true, url: uri}
    );
  }
    
  
} // QuickFolders.Util