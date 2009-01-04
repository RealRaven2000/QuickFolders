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
        return this.window.document.getElementById(id);
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

            listBox.appendChild(this.createListItem(category, category))
        }

        listBox.appendChild(this.createListItem("", "Uncategorized"))
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
        var listBox = this.$('existing-categories')

        var category = listBox.value

        QuickFolders.Model.setFolderCategory(this.folder.URI, category);

        this.window.close();
    }
}