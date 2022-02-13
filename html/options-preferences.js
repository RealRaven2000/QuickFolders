// preference functions specific to options.html
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Preferences = {
  root: "extensions.quickfolders.",
	getStringPref: async function getStringPref(p) {
    let prefString ='',
		    key = QuickFolders.Preferences.root + p;        
		  
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
    return await browser.LegacyPrefs.setPref(QuickFolders.Preferences.root + p, v);
	},

	getIntPref: async function getIntPref(p) {
    let key = QuickFolders.Preferences.root + p;
    // QuickFolders.Preferences.getIntPreference(key); // parseInt(10,x) ?
    let i = await browser.LegacyPrefs.getPref(key);
		return i;
	},

	setIntPref: async function setIntPref(p, v) {
		// return this.setIntPreference("extensions.quickfolders." + p, v);
    return await browser.LegacyPrefs.setPref(QuickFolders.Preferences.root + p, v);
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
  },
}