// interface functions specific top options.html
// keeping the old namespace so I know which funcitons I can retire when we convert to HTML

QuickFolders.Interface = {
	getPaletteClass: async function(tabStateId) {
	  let paletteType = await QuickFolders.Preferences.getIntPref("style." + tabStateId + ".paletteType");
		switch (paletteType) {
		  case -1:
			  if (tabStateId == "InactiveTab") {
					return "";  // error
				}
				else { // get from global tab style!
					return await this.getPaletteClass("InactiveTab");
				}
				break;
			default:
				return await this.getPaletteClassToken(paletteType);
		}
		return "";
	} ,

	getPaletteClassToken: async function(paletteType) {
		switch (parseInt(paletteType, 10)) {
		  case -1:
			  return await this.getPaletteClassToken(this.getPaletteClass("InactiveTab")); // default
			case 0:
			  return "";  // none
			case 1:
			  return " plastic";  // default
			case 2:
			  return " pastel";
      case 3:
        return " night";
		}
		return "";
	} ,
  
  applyTabStyle: function applyTabStyle(el, styleId) {
		if (!el) return;
    let prefs = QuickFolders.Preferences;
    if ((styleId != prefs.TABS_STRIPED))
      el.className = el.className.replace(/\s*striped/,"");
    if ((styleId == prefs.TABS_STRIPED) && (el.className.indexOf("striped")<0))
      el.className = el.className.replace(/(col[0-9]+)/,"$1striped");
  },
  
  // remove animated icons for pro version
  // at the moment this directly manipulates the style sheet, so we are going to do this via notification
  removeAnimations: async function(styleSheetName) {
   // needs to be done from the back end!!
  } ,  
  
  // show License dialog from Options dialog:
  showLicenseDialog: function() {
    let optionSelected = "options_" + QuickFolders.Options.currentOptionsTab;
    messenger.runtime.sendMessage({ 
      command: "showLicenseDialog", 
      referrer: optionSelected
    });
    window.close();
  }
  
}