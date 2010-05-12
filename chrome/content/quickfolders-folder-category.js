
QuickFolders.FolderCategory = {
    window: null,
    folder: null,

    init: function(window, folder) {
        this.window = window;
        this.folder = folder;

        this.populateCategories()

        this.getCategoriesListBox().value = QuickFolders.Model.getFolderEntry(this.folder.URI).category
    } ,

    $: function(id) {
	    try { return this.window.document.getElementById(id); }
        catch(e) {QuickFolders.Util.logDebug (e); return null;}
    } ,

    getCategoriesListBox: function() {
        return this.$('existing-categories')
    } ,

    populateCategories: function() {
        var listBox = this.getCategoriesListBox()

        QuickFolders.Util.clearChildren(listBox)

        var categories = QuickFolders.Model.getCategories();

        for(var i = 0; i < categories.length; i++) {
            var category = categories[i]
            if (category!="__ALWAYS")
              listBox.appendChild(this.createListItem(category, category))
        }
        listBox.appendChild(this.createListItem("__ALWAYS", QuickFolders.Util.getBundleString("qfShowAlways","Show Always!")))
        listBox.appendChild(this.createListItem("", QuickFolders.Util.getBundleString("qfUncategorized", "(Uncategorized)")))
    } ,

    createListItem: function(value, label) {
        var listItem = document.createElement("listitem")
        listItem.setAttribute("label", label)
        listItem.setAttribute("value", value)

        return listItem;
    } ,

    addToNewCategory: function() {
        var categoryName = this.$('new-category-name').value

        QuickFolders.Model.setFolderCategory(this.folder.URI, categoryName);

        this.window.close();
    } ,

    setSelectedCategory: function() {
	    try {
	        var listBox = this.$('existing-categories')
	        listBox.blur();
	        var category = listBox.value;

	        QuickFolders.Model.setFolderCategory(this.folder.URI, category);
        }
        catch(e) {QuickFolders.Util.logDebug(e); }

        this.window.close();
    },

    setColor: function(picker) {
	    alert (QuickFolders.Util.getBundleString("qfColorPickingWIP", "Sorry, this feature is still Work in Progress!") + picker.color);
    },

    getSelectedColor: function() {
        var listBox = this.$('existing-categories')
        var category = listBox.value;
        picker.color = getCategoryColor(category);
    },

    renameSelectedCategory: function() {
        var selectedCategory = this.$('existing-categories').value

        if(!selectedCategory || selectedCategory.match(/$__/)) {
            //can't rename a "system category"
            return;
        }

        var newName = this.$('rename-category-new-name').value

        if(!newName) {
            //no new name entered
            return;
        }

        QuickFolders.Model.renameFolderCategory(selectedCategory, newName)

        this.populateCategories()

        this.getCategoriesListBox().value = newName
    } ,

    deleteSelectedCategory: function() {
       var selectedCategory = this.$('existing-categories').value

       QuickFolders.Model.deleteFolderCategory(selectedCategory)

       this.populateCategories()

       this.getCategoriesListBox().value = "__ALL"
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