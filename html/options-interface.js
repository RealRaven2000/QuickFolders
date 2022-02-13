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

  
}