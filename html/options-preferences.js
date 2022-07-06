"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


// preference functions specific to options.html
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Preferences = {
	TABS_STRIPED: 0,
	TABS_FILLED: 1,
  root: "extensions.quickfolders.",
  
	isDebug: async function() {
		return await this.getBoolPref("debug");
	},
  
  
	isDebugOption: async function(option) { // granular debugging
		if(!await this.isDebug()) return false;
		try {return this.getBoolPref("debug." + option);}
		catch(e) { 
      return true; // more info is probably better in this case - this is an illegal value after all.
    }
	},
  
	getUserStyle: async function getUserStyle(sId, sType, sDefault) {
		// note: storing color as string in order to store OS specific colors like Menu, Highlight
		// usage: getUserStyle("ActiveTab","background-color","HighLight")
		// usage: getUserStyle("ActiveTab","color", "HighlightText")
		let sStyleName = 'style.' + sId + '.' + sType,
		    sReturnValue="";

    try {
			let localPref = await this.getStringPref(sStyleName);
			if (localPref || (localPref===0))
				sReturnValue = localPref;
			else
				sReturnValue = sDefault;
		}
    catch(ex) {
      sReturnValue = sDefault;
    }
		return sReturnValue;
	},

	setUserStyle: async function setUserStyle(sId, sType, sValue) {
		let sStyleName = 'style.' + sId + '.' + sType;
		await this.setStringPref(sStyleName, sValue);
	},
  
  /* universal storage */
	getIntPreference: async function getIntPreference(key) {
		try {
      let i = await browser.LegacyPrefs.getPref(key);
      return parseInt(i,10);
		}
		catch (ex) {
			QuickFolders.Util.logException("getIntPref(" + key + ") failed\n", ex);
			return 0;
		}
	},

	setIntPreference: async function setIntPreference(p, v) {
    return await browser.LegacyPrefs.setPref(p, v);
	},  
  
	setBoolPrefVerbose: async function setBoolPrefVerbose(p, v) {
		try {
			return await browser.LegacyPrefs.setPref(p, v);
		} 
    catch(e) {
			QuickFolders.Util.logException("setBoolPrefVerbose(" + p + ") failed\n", e);
			return false;
		}
	},
  
  /* preference setters / getters that are always prefixed with quickfolders extension namespace */
	getIntPref: async function getIntPref(p) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p,
        i = await browser.LegacyPrefs.getPref(key);
		return parseInt(i,10);
	},

	setIntPref: async function setIntPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    return await browser.LegacyPrefs.setPref(key, v);
	},  
  
	getStringPref: async function getStringPref(p) {
    let prefString ='',
		    key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    try {
      prefString = await browser.LegacyPrefs.getPref(key);
    }
    catch(ex) {
      QuickFolders.Util.logDebug("Could not retrieve string pref: " + p + "\n" + ex.message);
    }
    finally {
      return prefString;
    }
	},
	
	setStringPref: async function setStringPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    return await browser.LegacyPrefs.setPref(key, v);
	},

	getBoolPref: async function getBoolPref(p) {
	  let ans = false,
		    key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
    
	  try {
	    ans = await browser.LegacyPrefs.getPref(key);
		}
		catch(ex) {
		  QuickFolders.Util.logException("getBoolPref("  + p +") failed\n", ex);
		  throw(ex);
		}
		return ans;
	},
  
	setBoolPref: async function setBoolPref(p, v) {
    let key = p.startsWith(QuickFolders.Preferences.root) ? p : QuickFolders.Preferences.root + p;
		return await browser.LegacyPrefs.setPref(key, v);
	},  
  
	setShowCurrentFolderToolbar: async function setShowCurrentFolderToolbar(b, selector) {
		let tag = "showCurrentFolderToolbar";
		if (selector)
			tag = tag + "." + selector;
    let key = QuickFolders.Preferences.root + tag;
		return await browser.LegacyPrefs.setPref(key, b);
	},
 
	getCurrentTheme: async function() {
		let id = await this.getCurrentThemeId;
		return QuickFolders.Themes.Theme(id);
	},

	getCurrentThemeId: async function() {
		return await this.getStringPref("style.theme");
	},
  
  get supportsCustomIcon() {
    return true; // may be forbidden in future Thunderbird versions? 91+
  }
}