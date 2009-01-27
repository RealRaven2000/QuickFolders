var gquickfoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var _bundle = gquickfoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");

QuickFolders.Interface = {


    buttonsByOffset: [],
    menuPopupsByOffset: [],
    specialButtons: [],

    updateFolders: function() {
        // AG made flat style configurable

        var toolbar = QuickFolders.Util.$('QuickFolders-Toolbar');

        if (QuickFolders.Preferences.isShowToolbarFlatstyle()) {
            toolbar.className = "toolbar-flat";
        }
        else {
            toolbar.className = "";
        }

        this.updateCategories();


        this.buttonsByOffset = [];
        this.menuPopupsByOffset = [];
        this.specialButtons = [];

        QuickFolders.Util.$('QuickFolders-title-label').style.display = QuickFolders.Preferences.isShowQuickFoldersLabel() ? '' : 'none';

        QuickFolders.Util.clearChildren(this.getToolbar());

        var offset = 0;

        for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
            var folderEntry = QuickFolders.Model.selectedFolders[i];
            var folder;

            if(!this.shouldDisplayFolder(folderEntry)) {
                continue;
            }

            if((folder = GetMsgFolderFromUri(folderEntry.uri, true))) {
                var button = this.addFolderButton(folder, folderEntry.name, offset)
                this.buttonsByOffset[offset] = button;
                offset++;
            }
        }

        this.onFolderSelected();

        /*
        // Experimental; for new 'drop to thread' feature
        QuickFolders.Util.clearChildren(this.getSpecialToolbar());

        // new special button to find thread of dropped msg (good to archive sent messages)
        this.specialButtons[0] = this.addSpecialButton("findMsgThreadFolder", "Thread", 0, "drag messages to their thread");
        //this.specialButtons[1] = this.addSpecialButton("findMyTrashFolder", "Trash", 1);
        */

    } ,

    updateCategories: function() {
        var bookmarkCategories = QuickFolders.Model.getCategories();
        var menuList = QuickFolders.Util.$('QuickFolders-Category-Selection');
        var menuPopup = menuList.menupopup;

        QuickFolders.Util.clearChildren(menuPopup)

        if(bookmarkCategories.length > 0) {
            menuList.style.display = '';

            menuPopup.appendChild(this.createMenuItem("__ALL", "(All)"))
            for(var i = 0; i < bookmarkCategories.length; i++) {
                var category = bookmarkCategories[i]
                if (bookmarkCategories[i] != "__ALWAYS")
	                menuPopup.appendChild(this.createMenuItem(category, category))
            }

            menuPopup.appendChild(this.createMenuItem("__UNCATEGORIZED", "Uncategorized"))

            if(QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
                menuList.value = this.currentlySelectedCategory
            }
            else {
                menuList.value = "__ALL"
            }
        }
        else {
            menuList.style.display = 'none';
        }
    } ,

    createMenuItem: function(value, label) {
        var menuItem = document.createElement("menuitem");
        menuItem.setAttribute("label", label);
        menuItem.setAttribute("value", value);

        return menuItem;
    } ,

    currentlySelectedCategory: null,

    selectCategory: function(categoryName) {
       this.currentlySelectedCategory = categoryName;
       this.updateFolders();

       QuickFolders.Preferences.setLastSelectedCategory(categoryName)
    } ,

    getCurrentlySelectedCategoryName: function() {
       if(this.currentlySelectedCategory == "__ALL" || this.currentlySelectedCategory == "__UNCATEGORIZED") {
           return null;
       }
       else {
           return this.currentlySelectedCategory;
       }
    } ,

    shouldDisplayFolder: function(folderEntry) {
        if(!this.currentlySelectedCategory || this.currentlySelectedCategory == "__ALL") {
            return true;
        }
        else if(this.currentlySelectedCategory == "__UNCATEGORIZED" && !folderEntry.category) {
            return true;
        }
        else if(!QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
            return true;
        }
        else if (typeof folderEntry.category != "undefined" 
                  && folderEntry.category== "__ALWAYS")
          return true;
        else {
            return this.currentlySelectedCategory == folderEntry.category;
        }
    } ,

    windowKeyPress: function(e) {
        if(QuickFolders.Preferences.isUseKeyboardShortcuts()) {
            if(e.altKey) {
                var shortcut = e.charCode-48;

                if (shortcut >= 0 && shortcut < 10) {
                    if(shortcut == 0) {
                        shortcut = 10;
                    }

                    //alert(shortcut);
                    var button = this.buttonsByOffset[shortcut - 1];
                    if(button) {
                        if(e.shiftKey) {
                            MsgMoveMessage(button.folder.URI);
                        }
                        else {
                            this.onButtonClick(button);
                        }
                    }
                }
            }
        }
    } ,

    getButtonByFolder: function(folder) {
       for(var i = 0; i < this.buttonsByOffset.length; i++) {
           var button = this.buttonsByOffset[i];
           try {
             if(button.folder.URI == folder.URI) 
               return button;
           
           }
           catch(e) { }
       }

       return null;
    } ,

    getToolbar: function() {
        return QuickFolders.Util.$('QuickFolders-FoldersBox');
    } ,

    getSpecialToolbar: function() {
        return QuickFolders.Util.$('Quickfolders-SpecialTools');
    } ,

    addFolderButton: function(folder, useName, offset) {
        var numUnread = folder.getNumUnread(false);
        var numTotal = folder.getTotalMessages(false);

        var label = "";

        if(QuickFolders.Preferences.isShowShortcutNumbers()) {
            if(offset < 10) {
                if(offset == 9) {
                    label += "0. ";
                }
                else {
                    label += (offset + 1) + ". ";
                }
            }

        }

        label += (useName && useName.length > 0) ? useName : folder.name;

        var displayNumbers = [];

        if(numUnread > 0 && QuickFolders.Preferences.isShowUnreadCount()) {
            displayNumbers.push(numUnread);
        }

        if(numTotal > 0 && QuickFolders.Preferences.isShowTotalCount()) {
            displayNumbers.push(numTotal);
        }

        if(displayNumbers.length > 0) {
            label += " (" + displayNumbers.join(' / ') + ")";
        }

        var button = document.createElement("toolbarbutton");

        //button.setAttribute("class",ToolbarStyle);  // was toolbar-height!
        
        
        // find out whether this is a special button and add specialFolderType
        // for (optional) icon display
        var specialFolderType="";
        var sDisplayIcons = QuickFolders.Preferences.isShowToolbarIcons() ? ' icon': '';
        if (0 < folder.URI.indexOf("/Inbox")) 
	        specialFolderType="inbox" + sDisplayIcons;
        else if (0 < folder.URI.indexOf("/Sent")) 
	        specialFolderType="sent" + sDisplayIcons;
        else if (0 < folder.URI.indexOf("/Trash")) 
	        specialFolderType="trash" + sDisplayIcons;
	    else
	        specialFolderType=sDisplayIcons;

	                
        this.styleFolderButton(button, numUnread, numTotal, specialFolderType);

        button.setAttribute("label", label);

        button.folder = folder;

        button.setAttribute("oncommand",'QuickFolders.Interface.onButtonClick(event.target);');


        var popupId = 'QuickFolders-folder-popup-' + folder.URI;
        button.setAttribute('context',popupId);

        this.getToolbar().appendChild(button);
        this.addPopupSet(popupId,folder, offset);

        button.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
        button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
        button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
        
// INSERT COLOR RULES HERE LATER

        // AG add dragging of buttons
        button.setAttribute("ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
        button.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
        return button;
    } ,

    styleFolderButton: function(button, numUnread, numTotal, specialStyle) {
        if(numUnread > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold()) {
            button.className += " has-unread";
        }

        if(numTotal > 0 && QuickFolders.Preferences.isShowFoldersWithMessagesItalic()) {
            button.className += " has-messages";
        }
        
        if (specialStyle!="")
          button.className += " " + specialStyle;

        var buttonFontSize = QuickFolders.Preferences.getButtonFontSize();
        if(buttonFontSize) {
            button.style.fontSize = buttonFontSize + "px";
        }
    } ,

    addSpecialButton: function(SpecialFunction, SpecialId, Offset, tooltip) {
        var button = document.createElement("toolbarbutton");
        var image='';
        var lbl=''; // for testing
        switch (SpecialId) {
           case 'Thread':
             image = "url('chrome://quickfolders/content/thread.png')";  // "thread.png" ; //
             lbl = ''; // Thread
             break;
           case 'Trash':
             image = "url('folder-trash.png')";
             lbl = 'trash';
             break;
           default:
             break;
        }
        button.setAttribute("label", lbl);
        button.setAttribute("class","specialButton");
        button.setAttribute("list-style-image", image);
        button.setAttribute("dir", "normal");
        button.setAttribute("orient", "horizontal");
        button.setAttribute("validate", "always");
        button.setAttribute("tooltiptext", tooltip);
        button.setAttribute("id", SpecialId);

        button.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
        button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
        button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
        this.getSpecialToolbar().appendChild(button);

    },


    onButtonClick: function(button) {
        MySelectFolder(button.folder.URI);
    } ,

    onRemoveFolder: function(folder) {
        QuickFolders.Model.removeFolder(folder.URI);
        this.updateFolders();
    } ,

    onRenameBookmark: function(folder) {
        var newName = window.prompt(_bundle.GetStringFromName("qfNewName")+"\n"+folder.URI,QuickFolders.Interface.getButtonByFolder(folder).label); // replace folder.name!
        if(newName) {
            QuickFolders.Model.renameFolder(folder.URI, newName);
        }
    } ,

    onCompactFolder: function(folder) {
        var msgfolder = GetMsgFolderFromUri(folder.URI,true);
        var targetResource = msgfolder.QueryInterface(Components.interfaces.nsIRDFResource);

        messenger.CompactFolder(GetFolderDatasource(),targetResource, false);
        alert(_bundle.GetStringFromName("qfCompacted") +" "+folder.name);
    },

    addPopupSet: function(popupId, folder,offset) {
        var popupset = document.createElement('popupset');
        this.getToolbar().appendChild(popupset);

        var menupopup = document.createElement('menupopup');
        menupopup.setAttribute('id',popupId);
        menupopup.className = 'QuickFolders-folder-popup';
        menupopup.folder = folder;

        popupset.appendChild(menupopup);

        var menuitem;

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label',_bundle.GetStringFromName("qfRemoveBookmark"));
        menuitem.setAttribute("accesskey",_bundle.GetStringFromName("qfRemoveBookmarkAccess"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.onRemoveFolder(event.target.parentNode.folder)");
        menupopup.appendChild(menuitem);

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label',_bundle.GetStringFromName("qfRenameBookmark"));
        menuitem.setAttribute("accesskey",_bundle.GetStringFromName("qfRenameBookmarkAccess"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.onRenameBookmark(event.target.parentNode.folder)");
        menupopup.appendChild(menuitem);

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label',_bundle.GetStringFromName("qfCompactFolder"));
        menuitem.setAttribute("accesskey",_bundle.GetStringFromName("qfCompactFolderAccess"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.onCompactFolder(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
        menupopup.appendChild(menuitem);

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label',_bundle.GetStringFromName("qfSetCategory"));
        menuitem.setAttribute("accesskey",_bundle.GetStringFromName("qfSetCategoryA"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.addFolderToCategory(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
        menupopup.appendChild(menuitem);

        this.addSubFoldersPopup(menupopup, folder);

        this.menuPopupsByOffset[offset] = menupopup;

    } ,

    // add all subfolders (1st level, non recursive) of folder to popupMenu
    addSubFoldersPopup: function(popupMenu, folder) {
        if (folder.hasSubFolders) {
            var subfolders = folder.GetSubFolders();
            var done = false;
            var menuitem = document.createElement('menuseparator');
            popupMenu.appendChild(menuitem);

            while (!done) {
                var subfolder = subfolders.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder);
                try {
                    menuitem = document.createElement('menuitem');
                    menuitem.setAttribute('label', subfolder.name); //+ subfolder.URI
                    // MySelectFolder(button.folder.URI);
                    menuitem.setAttribute("oncommand","QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "')");  // "MsgCompactFolder(false);" only for current folder

                    menuitem.folder = subfolder;
                    menuitem.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver)");
                    menuitem.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");


                    popupMenu.appendChild(menuitem);
                    subfolders.next();
                }
                catch(e) {done = true;}
            }

        }
    } ,

    // select subfolder (on click)
    onSelectSubFolder: function(folderUri) {
       MySelectFolder (folderUri);
    } ,


    viewOptions: function() {
        window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,modal',QuickFolders);
    } ,

    viewChangeOrder: function() {
        window.openDialog('chrome://quickfolders/content/change-order.xul','quickfolders-change-order','chrome,titlebar,toolbar,centerscreen,modal',QuickFolders);
    } ,

    onFolderSelected: function() {
        var folder = GetFirstSelectedMsgFolder();

        for(var i = 0; i < this.buttonsByOffset.length; i++) {
           var button = this.buttonsByOffset[i];
           button.className = button.className.replace(/\s*selected-folder/,"");
        }

        var selectedButton;

        if((selectedButton = this.getButtonByFolder(folder))) {
            selectedButton.className += " selected-folder";
            // selectedButton.setAttribute("text-decoration","underline !important");
        }
    },

    addFolderToCategory: function(folder) {
        window.openDialog('chrome://quickfolders/content/set-folder-category.xul','quickfolders-set-folder-category','chrome,titlebar,toolbar,centerscreen,modal',QuickFolders, folder);
    },
    
    updateUserStyles: function() {
	  try {
      QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton.selected-folder','background-color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight")); 
      QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton.selected-folder','color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText")); 
      QuickFolders.Styles.setElementStyle('.toolbar-flat','border-bottom-color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight")); 
                   
      
	  QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton:hover','background-color',
	               QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","Orange")); 
	  QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton:hover','color',
	               QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black")); 

   	  QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton:-moz-drag-over','background-color', 
	               QuickFolders.Preferences.getUserStyle("DragTab","background-color","#E93903")); 
   	  QuickFolders.Styles.setElementStyle('.toolbar-flat toolbarbutton:-moz-drag-over','color', 
	               QuickFolders.Preferences.getUserStyle("DragTab","color","White")); 
	               
	  QuickFolders.Styles.setElementStyle('.toolbar','background-color', 
	               QuickFolders.Preferences.getUserStyle("Toolbar","background-color","ButtonFace")); 
	               
	               
      }
      catch(e) { alert("Quickfolders.updateUserStyles - error " + e); };
  
    }
    
};