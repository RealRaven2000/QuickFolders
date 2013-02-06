"use strict";

QuickFolders.FolderCategory = {
	window: null,
	folder: null,
	ALWAYS: "__ALWAYS",
	UNCATEGORIZED: "__UNCATEGORIZED",
	ALL: "__ALL",
	semaphorSel: null,

	init: function(window, folder) {
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

	getCategoriesListBox: function() {
		return this.$('existing-categories');
	} ,

	populateCategories: function() {
		var listBox = this.getCategoriesListBox()
		var folderEntry = QuickFolders.Model.getFolderEntry(this.folder.URI);
		var cat = folderEntry.category;
		// get array of categories for the folder
		var cats = cat ? cat.split('|') : ''; // will be "" if no category is defined

		QuickFolders.Util.clearChildren(listBox);

		var categories = QuickFolders.Model.Categories;

		//deselect all
		listBox.selectedIndex=-1;

		for(var i = 0; i < categories.length; i++) {
			var category = categories[i];
			if (category!=this.ALWAYS) {
				var item = listBox.appendChild(this.createListItem(category, category));
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

	createListItem: function(value, label) {
		var listItem = document.createElement("listitem");
		listItem.setAttribute("label", label);
		listItem.setAttribute("value", value);

		return listItem;
	} ,

	addToNewCategory: function() {
		var categoryName = this.$('new-category-name').value;

		QuickFolders.Model.setFolderCategory(this.folder.URI, categoryName);
		//add new category to listbox
		this.$('existing-categories').appendChild(this.createListItem(categoryName, categoryName));

		QuickFolders.Model.resetCategories();
		this.populateCategories();
	} ,

	// select Category into model
	setSelectedCategory: function() {
		try {
			var listBox = this.$('existing-categories')
			listBox.blur();
			// build a csv string of categories
			var category = '';
			let sel = 1, i = 0;
			sel = listBox.getSelectedItem(i)
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

	setColor: function(picker) {
		alert (QuickFolders.Util.getBundleString("qfColorPickingWIP", "Sorry, this feature is still Work in Progress!") + picker.color);
	},

	onSelectionChange: function(evt) {
		var i = 0; // just one iterator will do me :)
		if(this.semaphorSel)
			return;
		var listBox = this.$('existing-categories')
		QuickFolders.Util.logDebugOptional("categories", "onSelectionChange() - listBox.value = " + listBox.value ); // " + evt.type + "

		if (listBox.selectedItems.length) {
			var target  = listBox.selectedItems[listBox.selectedItems.length-1]; // evt.originalTarget; // should be the list item
			if (target)
				QuickFolders.Util.logDebugOptional("categories", "target  = " + target.value + " - selected = " + target.selected);
		}
		else {
			target = null; // nothing selected.
			//special case: empty selection => select UNCATEGORIZED
			if (listBox.itemCount) {
				QuickFolders.Util.logDebugOptional("categories", "All Categories deselected - selecting UNCATEGORIZED");
				i = listBox.itemCount; // Fx 3+!!
				var item = listBox.getItemAtIndex(--i);
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
		if (!target.selected)
			return;

		var category = target.value;
		// find out whether current item is selected or not:
		QuickFolders.Util.logDebugOptional("categories", "category = " + category + " - selected = " + target.selected);

		if (target.selected) {
			// unselect any other items for mutex categories (always / no category)
			this.semaphorSel=true; // lock reentry to avoid recursion
			i = listBox.selectedItems.length-1;

			if (category == "" || category == this.ALWAYS) {  // this.UNCATEGORIZED
				var sel = listBox.getSelectedItem(i);
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

	renameSelectedCategory: function() {
		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()");
		var selectedCategory = this.$('existing-categories').value

		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "selectedCategory = "  + selectedCategory);
		if(!selectedCategory || selectedCategory.match(/$__/)) {
			//can't rename a "system category"
			return;
		}

		var newName = this.$('rename-category-new-name').value
		QuickFolders.Util.logDebugOptional("categories","renameSelectedCategory()\n"
			+ "newName = " + newName);

		if(!newName) {
			//no new name entered
			return;
		}

		QuickFolders.Model.renameFolderCategory(selectedCategory, newName)
		QuickFolders.Model.resetCategories();

		this.populateCategories();
		
		QuickFolders.Interface.selectCategory(newName, true);

		this.getCategoriesListBox().value = newName;
	} ,

	deleteSelectedCategory: function() {
		QuickFolders.Util.logDebugOptional("categories","deleteSelectedCategory()");
		var selectedCategory = this.$('existing-categories').value

		QuickFolders.Util.logDebugOptional("categories","selectedCategory = " + selectedCategory);
		
		QuickFolders.Model.deleteFolderCategory(selectedCategory)
		QuickFolders.Model.resetCategories();

		this.populateCategories();

		this.getCategoriesListBox().value = QuickFolders.FolderCategory.ALL;
	} ,

	getCategoryColor: function(cat) {

/*
		   <hbox>

			<colorpicker id="category-colorpicker" palettename="standard"
			  type="button"
			  onchange="QuickFolders.FolderCategory.setColor(this);"
			  />


			</hbox>

*/
	}
}