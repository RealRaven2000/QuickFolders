"use strict";

QuickFolders.FolderCategory = {
	window: null,
	folder: null,
	ALWAYS: "__ALWAYS",
	UNCATEGORIZED: "__UNCATEGORIZED",
	ALL: "__ALL",
	semaphorSel: null,

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

	getCategoriesListBox: function getCategoriesListBox() {
		return this.$('existing-categories');
	} ,

	populateCategories: function populateCategories() {
		let listBox = this.getCategoriesListBox(),
        item,
        folderEntry = QuickFolders.Model.getFolderEntry(this.folder.URI),
        cat = folderEntry.category,
        // get array of categories for the folder
        cats = cat ? cat.split('|') : ''; // will be "" if no category is defined

		QuickFolders.Util.clearChildren(listBox);
		let categories = QuickFolders.Model.Categories;

		//deselect all
		listBox.selectedIndex=-1;

		for (let i = 0; i < categories.length; i++) {
			let category = categories[i];
			if (category!=this.ALWAYS) {
				item = listBox.appendChild(this.createListItem(category, category));
				// is the current folder in this category?
				if (cats && cats.indexOf(category) >=0)
					listBox.addItemToSelection(item);
			}
		}
		item = listBox.appendChild(this.createListItem(this.ALWAYS, QuickFolders.Util.getBundleString("qfShowAlways","Show Always!")))
		if (cats && cats.indexOf(this.ALWAYS) >=0)
			listBox.addItemToSelection(item);
		// highlight uncategorized if no categories are defined in folder
		item = listBox.appendChild(this.createListItem("", QuickFolders.Util.getBundleString("qfUncategorized", "(Uncategorized)")))
		if (!cats) // "" or null
			listBox.addItemToSelection(item);


	} ,

	createListItem: function createListItem(value, label) {
		let listItem = document.createElement("listitem");
		listItem.setAttribute("label", label);
		listItem.setAttribute("value", value);

		return listItem;
	} ,

	addToNewCategory: function addToNewCategory() {
		let categoryName = this.$('new-category-name').value;

		QuickFolders.Model.setFolderCategory(this.folder.URI, categoryName);
		//add new category to listbox
		this.$('existing-categories').appendChild(this.createListItem(categoryName, categoryName));

		QuickFolders.Model.resetCategories();
		this.populateCategories();
	} ,

	// select Category into model
	setSelectedCategory: function setSelectedCategory() {
		try {
			let listBox = this.$('existing-categories'),
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
			QuickFolders.Util.logDebugOptional("categories","set Selected Category for " + this.folder.prettyName + ": " + category + "...");

			QuickFolders.Model.setFolderCategory(this.folder.URI, category);
		}
		catch(e) {QuickFolders.Util.logDebug(e); }

		this.window.close();
	},

	setColor: function setColor(picker) {
		alert (QuickFolders.Util.getBundleString("qfColorPickingWIP", "Sorry, this feature is still Work in Progress!") + picker.color);
	},

	onSelectionChange: function onSelectionChange(evt) {
		let i = 0, // just one iterator will do me :)
		    listBox = this.$('existing-categories'),
        target = null;
		if(this.semaphorSel)
			return;
		QuickFolders.Util.logDebugOptional("categories", "onSelectionChange() - listBox.value = " + listBox.value ); // " + evt.type + "

		if (listBox.selectedItems.length) {
			target = listBox.selectedItems[listBox.selectedItems.length-1]; // evt.originalTarget; // should be the list item
			if (target)
				QuickFolders.Util.logDebugOptional("categories", "target  = " + target.value + " - selected = " + target.selected);
		}
		else { // nothing selected.
			//special case: empty selection => select UNCATEGORIZED
			if (listBox.itemCount) {
				QuickFolders.Util.logDebugOptional("categories", "All Categories deselected - selecting UNCATEGORIZED");
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
		QuickFolders.Util.logDebugOptional("categories", "category = " + category + " - selected = " + target.selected);

		if (target.selected) {
			// unselect any other items for mutex categories (always / no category)
			this.semaphorSel=true; // lock reentry to avoid recursion
			i = listBox.selectedItems.length-1;

			if (category == "" || category == this.ALWAYS) {  // this.UNCATEGORIZED
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
					if (sel.value == "" || sel.value == this.ALWAYS) // this.UNCATEGORIZED
						listBox.removeItemFromSelection(sel);
					i--;
					sel = listBox.getSelectedItem(i);
				}
			}
			this.semaphorSel=false;
		}
	},

	renameSelectedCategory: function renameSelectedCategory() {
		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()");
		let selectedCategory = this.$('existing-categories').value

		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "selectedCategory = "  + selectedCategory);
		if(!selectedCategory || selectedCategory.match(/$__/)) {
			//can't rename a "system category"
			return;
		}

		let newName = this.$('rename-category-new-name').value
		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "newName = " + newName);

		if (!newName) {
			//no new name entered
			return;
		}

		QuickFolders.Model.renameFolderCategory(selectedCategory, newName)
		QuickFolders.Model.resetCategories();

		this.populateCategories();
		
		QuickFolders.Interface.selectCategory(newName, true);

		this.getCategoriesListBox().value = newName;
	} ,

	deleteSelectedCategory: function deleteSelectedCategory() {
		QuickFolders.Util.logDebugOptional("categories","deleteSelectedCategory()");
		let selectedCategory = this.$('existing-categories').value;
		QuickFolders.Util.logDebugOptional("categories","selectedCategory = " + selectedCategory);
		
		QuickFolders.Model.deleteFolderCategory(selectedCategory)
		QuickFolders.Model.resetCategories();

		this.populateCategories();
		this.getCategoriesListBox().value = QuickFolders.FolderCategory.ALL;
	} ,

	getCategoryColor: function(cat) {

	}
}