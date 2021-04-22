"use strict";

/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

QuickFolders.FolderCategory = {
	ALWAYS: "__ALWAYS",
  NEVER: "__NEVER",
	UNCATEGORIZED: "__UNCATEGORIZED",
	ALL: "__ALL",
  

  // whether the category can be selected in the Categoires dropdown (excludes ALWAYS, NEVER)
  isSelectableUI: function isSelectableUI(cat) {
    return (cat != this.ALWAYS && cat != this.NEVER && cat != this.UNCATEGORIZED);
  },

  // does this Category exist?
  isValidCategory: function isValidCategory(category) {
    return (
       !this.isSelectableUI(category)
      || category == QuickFolders.FolderCategory.ALL
      || QuickFolders.Model.Categories.includes(category)
    );
  } 

}