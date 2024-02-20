"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */



/*
  conversion to HTML

  TO DO:


  #mailIdentity => menulist to select
  #menuCustomTabPalette => menulist to select


*/

// from qf-advancedTab.js
QuickFolders.AdvancedTab = {
  ADVANCED_FLAGS: { // from quickfolders-util.js
    NONE : 0x0000,
    SUPPRESS_UNREAD : 0x0001,
    SUPPRESS_COUNTS : 0x0002,
    EMAIL_RECURSIVE : 0x0004,
    CUSTOM_CSS :      0x0100,
    CUSTOM_PALETTE :  0x0200,
    IGNORE_QUICKJUMP: 0x0400,
    SETMAIL_UNREAD:   0x0800         // [Bug 26683]
  },

  /*** FUNCTIONS FROM  qf-advancedTab.js  ***/
  close: function() {
    window.close();
    return true;
  } ,  

  apply: function() {
    console.log("to do: implement QuickFolders.AdvancedTab.apply()");

  },

  configureCategory: function() {
    console.log("to do: configure category (of selected tab  / with folder somehow identified possibly via folder URI");
    /*
      let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");  
      QuickFolders.Interface.configureCategory(this.folder, mail3PaneWindow.QuickFolders); // should actually get the "parent" QuickFolders
      let lbl = document.getElementById('lblCategories');
      lbl.value = this.entry.category + " *";
    */
  } ,  

	updateCSSpreview: function() {
		try {
			let preview = document.getElementById('cssPreview');
			if (preview) {
				preview.style.color = document.getElementById('txtColor').value;
				preview.style.background = document.getElementById('txtBackground').value;
				preview.style.visibility = document.getElementById('chkCustomCSS').checked ? "visible" : "hidden";
			}
		} catch(ex) {;}
	} ,  

	headerClick: function(event) {
		const Cc = Components.classes,
          Ci = Components.interfaces,
					util = QuickFolders.Util;
		let clipboardhelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
		event.stopPropagation();
		switch (event.button) {
			case 0: // default = left button
			  break;
			case 1: // middle button
			  break;
			case 2: // right button
        let infoTxt = "URI: " + this.folder.URI;
        if (this.entry) {
          infoTxt += `\nTab [${this.entry.name}]`
            + `\nAccount (from tab): ${this.entry.account}`;
        }
				clipboardhelper.copyString(infoTxt);
			  util.slideAlert("QuickFolders", "Copied folder Info to clipboard\n" + infoTxt);
			  break;
		}
	} , 

  pickColor: function(color) {
    document.getElementById('txtColor').value = color;
    this.apply();
    return true;
  } ,  

	sanitizeCSS: function (el) {
    let val = el.value;
    // code copied from quickfolders-util.js
    let colon = val.indexOf(':');
    if (colon>=0) val = val.substr(colon+1);
    let semicolon = val.indexOf(';');
    if (semicolon>0) val = val.substr(0,semicolon);
    val = val.trim ? val.trim() : val;
    return val;    
	},

  updatePicker: function updatePicker(textbox) {
    if (textbox.length) {
      document.getElementById('txtColorPicker').value = textbox.value;
    }
  } ,
    

}

i18n.updateDocument();

const myHeader = document.getElementById("myHeader");
myHeader.addEventListener("click", (event) => { QuickFolders.AdvancedTab.headerClick(event) } );
const chkCustomCSS = document.getElementById("chkCustomCSS");
chkCustomCSS.addEventListener("click", (event) => { QuickFolders.AdvancedTab.updateCSSpreview(); } );
const txtBackground =  document.getElementById("txtBackground");
txtBackground.addEventListener("blur", (event) => { QuickFolders.AdvancedTab.sanitizeCSS(txtBackground); } );

const txtColorPicker = document.getElementById("txtColorPicker");
txtColorPicker.addEventListener("change", (event) => { QuickFolders.AdvancedTab.pickColor(txtColorPicker.value); } );
// onchange="return QuickFolders.AdvancedTab.pickColor(this.value);"
const txtColor = document.getElementById("txtColor");
txtColor.addEventListener("blur", (event) => { 
  QuickFolders.AdvancedTab.sanitizeCSS(txtColor);
  QuickFolders.AdvancedTab.updatePicker(txtColor);
});
const btnClose = document.getElementById("btnClose");
btnClose.addEventListener("command", () => { QuickFolders.AdvancedTab.close(); } );

const btnCategory = document.getElementById("btnCategory");
btnCategory.addEventListener("command", () => { QuickFolders.AdvancedTab.configureCategory(); } );


