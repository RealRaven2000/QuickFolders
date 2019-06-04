"use strict";

/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

QuickFolders.FolderCategory = {
	window: null,
	folder: null,
	ALWAYS: "__ALWAYS",
  NEVER: "__NEVER",
	UNCATEGORIZED: "__UNCATEGORIZED",
	ALL: "__ALL",
	semaphorSel: null,
  
	get CategoriesListBox() {
		return this.$('existing-categories');
	} ,

  // whether the category can be selected in the Categoires dropdown (excludes ALWAYS, NEVER)
  isSelectableUI: function isSelectableUI(cat) {
    return (cat != this.ALWAYS && cat != this.NEVER && cat != this.UNCATEGORIZED);
  },

  // does this Category exist?
  isValidCategory: function isValidCategory(category) {
    return (
       !this.isSelectableUI(category)
      || category == QuickFolders.FolderCategory.ALL
      || QuickFolders.Model.Categories.indexOf(category) != -1
    );
  } ,  

	init: function init(window, folder) {
		this.window = window;

		this.folder = folder;

		this.populateCategories();
		window.setTimeout(function() {
			this.document.title = this.document.title + ": " + QuickFolders.FolderCategory.folder.prettyName;
		}, 200);
	} ,

	$: function(id) {
		try { return this.window.document.getElementById(id); }
		catch(e) {QuickFolders.Util.logDebug (e); return null;}
	} ,

	populateCategories: function populateCategories() {
		const util = QuickFolders.Util;
		let listBox = this.CategoriesListBox,
        item,
        folderEntry = this.folder ? QuickFolders.Model.getFolderEntry(this.folder.URI) : null,
        cat = folderEntry ? folderEntry.category : this.ALWAYS,
        // get array of categories for the folder
        cats = cat ? cat.split('|') : ''; // will be "" if no category is defined

		util.clearChildren(listBox);
		let categories = QuickFolders.Model.Categories;

		//deselect all
		listBox.selectedIndex=-1;

		for (let i = 0; i < categories.length; i++) {
			let category = categories[i];
			if (category!=this.ALWAYS  && category!=this.NEVER) {
				item = listBox.appendChild(this.createListItem(category, category));
				// is the current folder in this category?
				if (cats && cats.indexOf(category) >=0)
					listBox.addItemToSelection(item);
			}
		}
		item = listBox.appendChild(this.createListItem(this.ALWAYS, util.getBundleString("qfShowAlways","Show Always!")))
		if (cats && cats.indexOf(this.ALWAYS) >=0)
			listBox.addItemToSelection(item);
		item = listBox.appendChild(this.createListItem(this.NEVER, util.getBundleString("qfShowNever","Never Show (Folder Alias)")))
		if (cats && cats.indexOf(this.NEVER) >=0)
			listBox.addItemToSelection(item);
		// highlight uncategorized if no categories are defined in folder
		item = listBox.appendChild(this.createListItem("", util.getBundleString("qfUncategorized", "(Uncategorized)")))
		if (!cats) // "" or null
			listBox.addItemToSelection(item);
	} ,

	createListItem: function createListItem(value, label) {
		let listItem = document.createXULElement ? document.createXULElement("listitem") : document.createElement("listitem");
		listItem.setAttribute("label", label);
		listItem.setAttribute("value", value);
		return listItem;
	} ,

	addToNewCategory: function addToNewCategory() {
    const model = QuickFolders.Model;
		let categoryName = this.$('new-category-name').value;

		model.setFolderCategory(this.folder.URI, categoryName);
		//add new category to listbox
		this.CategoriesListBox.appendChild(this.createListItem(categoryName, categoryName));

		model.resetCategories();
		this.populateCategories();
	} ,

	// select Category into model
	setSelectedCategory: function setSelectedCategory() {
		const util = QuickFolders.Util;
		try {
			let listBox = this.CategoriesListBox,
			    category = '',
			    sel = 1, i = 0;
			listBox.blur();
			sel = listBox.getSelectedItem(i)
			// build a | delimited string of categories
			while (sel) {
			   category = category
						+ ((category.length) ? '|' : '')
						+ sel.value;
			   i++;
			   sel=listBox.getSelectedItem(i);
			}
			util.logDebugOptional("categories","set Selected Category for " + this.folder.prettyName + ": " + category + "...");

			QuickFolders.Model.setFolderCategory(this.folder.URI, category);
		}
		catch(e) {util.logDebug(e); }

		this.window.close();
	},

	setColor: function setColor(picker) {
		alert (QuickFolders.Util.getBundleString("qfColorPickingWIP", "Sorry, this feature is still Work in Progress!") + picker.color);
	},

	onSelectionChange: function onSelectionChange(evt) {
		const util = QuickFolders.Util;
		let i = 0, // just one iterator will do me :)
		    listBox = this.CategoriesListBox,
        target = null;
		if(this.semaphorSel)
			return;
		util.logDebugOptional("categories", "onSelectionChange() - listBox.value = " + listBox.value ); // " + evt.type + "

		if (listBox.selectedItems.length) {
			target = listBox.selectedItems[listBox.selectedItems.length-1]; // evt.originalTarget; // should be the list item
			if (target)
				util.logDebugOptional("categories", "target  = " + target.value + " - selected = " + target.selected);
		}
		else { // nothing selected.
			//special case: empty selection => select UNCATEGORIZED
			if (listBox.itemCount) {
				util.logDebugOptional("categories", "All Categories deselected - selecting UNCATEGORIZED");
				i = listBox.itemCount; // Fx 3+!!
				let item = listBox.getItemAtIndex(--i);
				while (item) {
					if (item.value == "")  // this.UNCATEGORIZED
					{
						listBox.addItemToSelection(item);
						break;
					}
					item = listBox.getItemAtIndex(--i);
				};
			}
			return;
		}
		// an item was unselected, but there are still others left in selection
		if (!target || !target.selected)
			return;

		let category = target.value,
        sel;
		// find out whether current item is selected or not:
		util.logDebugOptional("categories", "category = " + category + " - selected = " + target.selected);

		if (target.selected) {
			// unselect any other items for mutex categories (always / no category)
			this.semaphorSel=true; // lock reentry to avoid recursion
			i = listBox.selectedItems.length-1;

      // Remove from all 'real' Categories
			if (category == "" || category == this.ALWAYS || category == this.NEVER) {  // this.UNCATEGORIZED
				sel = listBox.getSelectedItem(i);
				while (sel) {
					if (sel.value != category)
						listBox.removeItemFromSelection(sel);
					i--;
					sel = listBox.getSelectedItem(i);
				}
			}
			else {
				sel = listBox.getSelectedItem(i);
				while (sel) {
          // Remove from special categories
					if (sel.value == "" || sel.value == this.ALWAYS || category == this.NEVER) 
						listBox.removeItemFromSelection(sel);
					i--;
					sel = listBox.getSelectedItem(i);
				}
			}
			this.semaphorSel=false;
		}
	},

	renameSelectedCategory: function renameSelectedCategory() {
		const util = QuickFolders.Util;
		util.logDebugOptional("categories","renameSelectedCategory()");
		let selectedCategory = this.CategoriesListBox.value

		util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "selectedCategory = "  + selectedCategory);
		if(!selectedCategory || selectedCategory.match(/$__/)) {
			//can't rename a "system category"
			return;
		}

		let newName = this.$('rename-category-new-name').value
		util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "newName = " + newName);

		if (!newName) {
			//no new name entered
			return;
		}

		QuickFolders.Model.renameFolderCategory(selectedCategory, newName)
		QuickFolders.Model.resetCategories();

		this.populateCategories();
		
		QuickFolders.Interface.selectCategory(newName, true);

		this.CategoriesListBox.value = newName;
	} ,

	deleteSelectedCategory: function deleteSelectedCategory(evt) {
    const util = QuickFolders.Util,
          model = QuickFolders.Model;
		util.logDebugOptional("categories","deleteSelectedCategory()");
		if (QuickFolders.Preferences.isDebugOption("categories")) debugger;
		// improve routine - make sure we can select multiple items
		let selectedItems = this.CategoriesListBox.selectedItems, // array
		    selCount = selectedItems.length;
		if (!selCount) return;
		if (selCount==1)  {
			let selectedCategory = selectedItems[0].value;
			if (!this.isSelectableUI(selectedCategory)) {
				util.getBundleString("qf.notification.categoryIsReadOnly", "This item cannot be deleted.");
				return;
			}
		}
		else {
			let question = util.getBundleString("qf.prompt.category.deleteMultiple","Ok to delete multiple categories?")
			if(!Services.prompt.confirm(this.window, "QuickFolders", question))
				return;
		}
		
		for (let i=0; i<selCount; i++) {
			let selectedCategory = selectedItems[i].value;
			util.logDebugOptional("categories","deleteSelectedCategory = " + selectedCategory);
			model.deleteFolderCategory(selectedCategory, true);
		}
		model.update(); // stores everything
		model.resetCategories();
		this.populateCategories();
		
		// check all categories and see if there are no user defined ones left. (exclude show always, never)
		let iCustomCategories = 0;
		for (let i=0; i<model.selectedFolders.length; i++) {
			let qftab = model.selectedFolders[i],
			    cat = qftab.category,
					cats = cat ? cat.split('|') : [];
			for (let j=0; j<cats.length; j++) {
				if (cats[j] && this.isSelectableUI(cats[j])) {
					iCustomCategories++;
				}
			}
		}
		if (!iCustomCategories) { // we should hide the categories box, but first reset all model eentrues that are set to UNCATEGORIZED / ALWAYS
			for (let i=0; i<model.selectedFolders.length; i++) {
				let cat = model.selectedFolders[i].category;
				if (cat==this.ALWAYS || cat==this.UNCATEGORIZED) 
					model.selectedFolders[i].category=null;
			}
		}
		
		this.CategoriesListBox.value = QuickFolders.FolderCategory.ALL;
		const mainInterface = util.getMail3PaneWindow().QuickFolders.Interface;
		mainInterface.updateCategories();
		// mainInterface.updateCategoryLayout();
	} ,

	getCategoryColor: function(cat) {

	}
}