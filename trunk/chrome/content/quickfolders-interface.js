var gquickfoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var qfBundle = gquickfoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");


QuickFolders.Interface = {
	TimeoutID: 0,
    buttonsByOffset: [],
    menuPopupsByOffset: [],
    specialButtons: [],
    //myPopup: null,
    boundKeyListener: false,

    setBoundKeyListener: function(b) {
	    this.boundKeyListener=b;
    },

    setFolderUpdateTimer: function() {
	    QuickFolders.Util.logDebug(" Old Timer ID = " + this.TimeoutID);

	    // avoid the overhead if marking a folder with lots of unread mails as read or getting emails
	    // made folder update asynchronous instead.
	    if (!(this.TimeoutID>0)) {
		  try {
		      var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.queuedFolderUpdateDelay');
		      if (!nDelay>0) nDelay = 750;
		      this.TimeoutID = setTimeout("QuickFolders.Interface.queuedFolderUpdate()", nDelay);
		      QuickFolders.Util.logDebug("New Folder Update Timer ID = " + this.TimeoutID);
          }
          catch (e) {
	          QuickFolders.Util.logDebug("setFolderUpdateTimer: " + e);
          }

	    }

    },

    queuedFolderUpdate: function() {
	  this.updateFolders(false);
	  this.TimeoutID=0;
    },

    // added parameter to avoid deleting categories dropdown while selecting from it!
    updateFolders: function(rebuildCategories) {
	    this.TimeoutID=0;
        // AG made flat style configurable
        QuickFolders.Util.logDebug('updateFolders(' + rebuildCategories + ')');

        var toolbar = QuickFolders.Util.$('QuickFolders-Toolbar');

        if (QuickFolders.Preferences.isShowToolbarFlatstyle())
          toolbar.className = "toolbar-flat";
        else
          toolbar.className = "";


        this.buttonsByOffset = [];
        this.menuPopupsByOffset = [];
        this.specialButtons = [];


        QuickFolders.Util.clearChildren(this.getToolbar(),rebuildCategories);
        //QuickFolders.Util.$('QuickFolders-title-label').style.visibility = QuickFolders.Preferences.isShowQuickFoldersLabel() ? 'visible' : 'hidden';
        QuickFolders.Util.$('QuickFolders-title-label').value = QuickFolders.Preferences.isShowQuickFoldersLabel() ? 'QuickFolders:' : '';

        //QuickFolders.Util.$('QuickFolders-title-label').style.display = QuickFolders.Preferences.isShowQuickFoldersLabel() ? '' : 'none';
        if (rebuildCategories || null==QuickFolders.Util.$('QuickFolders-Category-Selection'))
          this.updateCategories();


        var offset = 0;

        if (QuickFolders.Model.selectedFolders.length) {
            for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
                var folderEntry = QuickFolders.Model.selectedFolders[i];
                var folder;
                var tabColor;

                if(!this.shouldDisplayFolder(folderEntry)) {
                    continue;
                }
                try {
	                tabColor = folderEntry.tabColor;
                }
                catch(e) {tabColor = null};

                if((folder = GetMsgFolderFromUri(folderEntry.uri, true))) {
                    var button = this.addFolderButton(folder, folderEntry.name, offset, tabColor)
                    this.buttonsByOffset[offset] = button;
			        if (tabColor)
			          this.setButtonColor(button, tabColor);

                    offset++;
                }
            }
            QuickFolders.Util.logDebug(QuickFolders.Model.selectedFolders.length + " bookmarked folders added to Model.");

            this.onFolderSelected();
        }

        /*
        // Experimental; for new 'drop to thread' feature
        QuickFolders.Util.clearChildren(this.getSpecialToolbar());

        // new special button to find thread of dropped msg (good to archive sent messages)
        this.specialButtons[0] = this.addSpecialButton("findMsgThreadFolder", "Thread", 0, "drag messages to their thread");
        //this.specialButtons[1] = this.addSpecialButton("findMyTrashFolder", "Trash", 1);
        */

    } ,

    updateCategories: function() {
        QuickFolders.Util.logDebug("updateCategories()");

        var bookmarkCategories = QuickFolders.Model.getCategories();
        var menuList = QuickFolders.Util.$('QuickFolders-Category-Selection');
        var menuPopup = menuList.menupopup;

        QuickFolders.Util.clearChildren(menuPopup,true);

        if(bookmarkCategories.length > 0) {
            menuList.style.display = 'block';

            menuPopup.appendChild(this.createMenuItem("__ALL", qfBundle.GetStringFromName("qfAll")))
            for(var i = 0; i < bookmarkCategories.length; i++) {
                var category = bookmarkCategories[i];

                if (bookmarkCategories[i] != "__ALWAYS") {
                    menuPopup.appendChild(this.createMenuItem(category, category))
                }
            }

            menuPopup.appendChild(document.createElement('menuseparator'));
            menuPopup.appendChild(this.createMenuItem("__UNCATEGORIZED", qfBundle.GetStringFromName("qfUncategorized")))

            if(QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
                menuList.value = this.currentlySelectedCategory
            }
            else {
                menuList.value = "__ALL"
            }
        }
        else {
	        QuickFolders.Util.logDebug("bookmarkCategories.length=" + bookmarkCategories.length);
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

    selectCategory: function(categoryName, rebuild) {
       this.currentlySelectedCategory = categoryName;
       QuickFolders.Util.logDebug("Selecting Category: " + categoryName);
       this.updateFolders(rebuild);

       QuickFolders.Preferences.setLastSelectedCategory(categoryName);
       QuickFolders.Util.logDebug("Successfully selected Category: " + categoryName);
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
	    try {
	        if(this.currentlySelectedCategory==null || this.currentlySelectedCategory == "__ALL" || folderEntry.category=="") {
	            return true;
	        }
	        else if(this.currentlySelectedCategory == "__UNCATEGORIZED" && !folderEntry.category) {
	            return true;
	        }
	        else if(!QuickFolders.Model.isValidCategory(this.currentlySelectedCategory)) {
	            return true;
	        }
	        else if (typeof folderEntry.category != "undefined"
	                    && folderEntry.category== "__ALWAYS"
	                    && this.currentlySelectedCategory != "__UNCATEGORIZED")
	          return true;
	        else {
	            return this.currentlySelectedCategory == folderEntry.category;
	        }
        }
        catch (e) {
	        QuickFolders.Util.logDebug("shouldDisplayFolder caught error: " + e);
	        return true;
	    }
    } ,

    windowKeyPress: function(e,dir) {

        if(QuickFolders.Preferences.isUseKeyboardShortcuts()) {
            var shouldBeHandled =
                (!QuickFolders.Preferences.isUseKeyboardShortcutsCTRL() && e.altKey)
                ||
                (QuickFolders.Preferences.isUseKeyboardShortcutsCTRL() && e.ctrlKey)
            ;

            if(shouldBeHandled) {
				QuickFolders.Util.logDebug(dir + " ALT " + e.altKey + " - CTRL " + e.ctrlKey + "   kC: " + e.keyCode + "  cC:" + e.charCode);
                var shortcut = -1;
                if (dir=='up')
                    shortcut = e.keyCode-48;
                if (dir=='down')
                    shortcut = e.charCode-48;

                if (shortcut >= 0 && shortcut < 10) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dir=='down') return;
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
	         // doesn't work for search folders?
             if(button.folder.URI == folder.URI) {
               //QuickFolders.Util.logDebug("getButtonByFolder: " + button.folder.URI + " = " + folder.URI);
               return button;
             }


           }
           catch(e) {
             QuickFolders.Util.logDebug("getButtonByFolder: could not match " + button.folder.URI + " error: " + e);
	       }
       }

       return null;
    } ,

    getToolbar: function() {
        return QuickFolders.Util.$('QuickFolders-FoldersBox');
    } ,

    getSpecialToolbar: function() {
        return QuickFolders.Util.$('Quickfolders-SpecialTools');
    } ,

    endsWith:  function(sURI, sFolder) {
	    if (sFolder.length == sURI.length - sURI.indexOf(sFolder))
	      return true;
	    return false;
    },

    addFolderButton: function(folder, useName, offset, tabColor) {
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
	    // QuickFolders.Util.logDebug ("\nQuickFolders: " + folder.URI );

	    // does the folder end with this name?
        if (this.endsWith(folder.URI, "/Inbox"))
	        specialFolderType="inbox" + sDisplayIcons;
        else if (this.endsWith(folder.URI, "/Sent"))
	        specialFolderType="sent" + sDisplayIcons;
        else if (this.endsWith(folder.URI, "/Trash"))
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
        this.updateFolders(true);
    } ,

    onRenameBookmark: function(folder) {
	    var sOldName = this.getButtonByFolder(folder).label;
        // strip shortcut numbers
	    if(QuickFolders.Preferences.isShowShortcutNumbers()) {
		  var i = sOldName.indexOf('. ');
		  if (i<3 && i>0)
	        sOldName = sOldName.substring(i+2,sOldName.length);
        }
        // find if trhere is a number of total messages / unread message in the label, and strip them from renaming!!
        if(QuickFolders.Preferences.isShowTotalCount() || QuickFolders.Preferences.isShowUnreadCount()) {
		  var i = sOldName.lastIndexOf(' (');
		  var j = sOldName.lastIndexOf(')');
		  // TODO: additional check if there are just numbers and commas within the brackets!

		  //making sure there is stuff between the () and the last char is a )
		  if (i>1 && sOldName.substr(i, j-i).length>0 && j==sOldName.length-1) {
			  var bracketedLen = j-i+1;
			  QuickFolders.Util.logDebug("Suspected number of new / total mails = " + sOldName.substr(i, j-i+1) + "   length = " + bracketedLen);
		    // lets check if this is numeral, after removing any ','
	          	sOldName = sOldName.substring(0,sOldName.length - bracketedLen);
          }

        }


        var newName = window.prompt(qfBundle.GetStringFromName("qfNewName")+"\n"+folder.URI,sOldName); // replace folder.name!
        if(newName) {
            QuickFolders.Model.renameFolder(folder.URI, newName);
        }
    } ,

    onCompactFolder: function(folder) {
        var msgfolder = GetMsgFolderFromUri(folder.URI,true);
        var targetResource = msgfolder.QueryInterface(Components.interfaces.nsIRDFResource);

        if (QuickFolders.Util.Appver() > 2)
          alert ("to do: add compactfolder for TB3");
        else
          messenger.CompactFolder(GetFolderDatasource(),targetResource, false);
        alert(qfBundle.GetStringFromName("qfCompacted") +" "+folder.name);
    },

    addPopupSet: function(popupId, folder, offset) {
        var popupset = document.createElement('popupset');
        this.getToolbar().appendChild(popupset);

        var menupopup = document.createElement('menupopup');
        menupopup.setAttribute('id',popupId);
        menupopup.setAttribute('position','after_start');

        menupopup.className = 'QuickFolders-folder-popup';
        menupopup.folder = folder;

        popupset.appendChild(menupopup);

        var menuitem;
        //QuickFolders.Util.logDebug("Creating Popup Set for " + folder.name);

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute("tag","qfRemove");
        menuitem.className='cmd menuitem-iconic';

        menuitem.setAttribute('label',qfBundle.GetStringFromName("qfRemoveBookmark"));
        menuitem.setAttribute("accesskey",qfBundle.GetStringFromName("qfRemoveBookmarkAccess"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.onRemoveFolder(event.target.parentNode.folder)");
        menupopup.appendChild(menuitem);

        menuitem = document.createElement('menuitem');
        menuitem.className='cmd menuitem-iconic';
        menuitem.setAttribute("tag","qfRename");
        menuitem.setAttribute('label',qfBundle.GetStringFromName("qfRenameBookmark"));
        menuitem.setAttribute("accesskey",qfBundle.GetStringFromName("qfRenameBookmarkAccess"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.onRenameBookmark(event.target.parentNode.folder)");
        menupopup.appendChild(menuitem);

        if (QuickFolders.Util.Appver() < 3) {
	        // TB3 we will implement that one later :)
	        menuitem = document.createElement('menuitem');
	        menuitem.className='cmd menuitem-iconic';
	        menuitem.setAttribute("tag","qfCompact");
	        menuitem.setAttribute('label',qfBundle.GetStringFromName("qfCompactFolder"));
	        menuitem.setAttribute("accesskey",qfBundle.GetStringFromName("qfCompactFolderAccess"));
	        menuitem.setAttribute("oncommand","QuickFolders.Interface.onCompactFolder(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
	        menupopup.appendChild(menuitem);
        }

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute("class","menuitem-iconic");
        menuitem.className='cmd';
        menuitem.setAttribute("tag","qfCategory");
        menuitem.setAttribute('label',qfBundle.GetStringFromName("qfSetCategory"));
        menuitem.setAttribute("accesskey",qfBundle.GetStringFromName("qfSetCategoryA"));
        menuitem.setAttribute("oncommand","QuickFolders.Interface.addFolderToCategory(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
        menupopup.appendChild(menuitem);

        // tab colors menu
        var colorMenu = document.createElement('menu');
        colorMenu.setAttribute("tag",'qfTabColorMenu');
        colorMenu.setAttribute("label", qfBundle.GetStringFromName("qfMenuTabColorPopup") );
        colorMenu.className = 'QuickFolders-folder-popup';
        menuitem.setAttribute("class","menuitem-iconic");

        var menuColorPopup = document.createElement("menupopup");
        colorMenu.appendChild(menuColorPopup);

        // create color pick items
        var jCol;
        for (jCol=0; jCol<=20;jCol++) {
	        menuitem = document.createElement('menuitem');
	        menuitem.className='color';
		    menuitem.setAttribute("tag","qfColor"+jCol);
	        if (jCol) {
	          menuitem.setAttribute('label',qfBundle.GetStringFromName("qfMenuColor") + " "+ jCol);
	          //menuitem.setAttribute("style","background-image:url('cols/tabcol-" + jCol + ".png')!important;");
            }
	        else
	          menuitem.setAttribute('label',qfBundle.GetStringFromName("qfMenuTabColorNone"));
	        menuitem.setAttribute("oncommand","QuickFolders.Interface.setTabColor(event.target.parentNode.parentNode.parentNode.folder,'" + jCol + "')");  // "MsgCompactFolder(false);" only for current folder
	        menuColorPopup.appendChild(menuitem);
        }

        // append it to main popup menu
	    menupopup.appendChild(colorMenu);

	    //moved this out of addSubFoldersPopup for recursive menus
	    if (folder.hasSubFolders) {
           menupopup.appendChild(document.createElement('menuseparator'));

	       QuickFolders.Util.logToConsole("Create popup menu " + folder.name + "...");
	       this.addSubFoldersPopup(menupopup, folder);
        }

        this.menuPopupsByOffset[offset] = menupopup;

    } ,

    // add all subfolders (1st level, non recursive) of folder to popupMenu
    addSubFoldersPopup: function(popupMenu, folder) {
        if (folder.hasSubFolders) {
            var subfolder, subfolders;
	        var appver=QuickFolders.Util.Appver();
	        if (appver<3)
              subfolders = folder.GetSubFolders();
            else
              subfolders = folder.subFolders;

            var done = false;

            while (!done) {
	        	if (appver<3)
                  subfolder = subfolders.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder);
                else {
	                if (subfolders.hasMoreElements())
	                  subfolder = subfolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
	                else {
	                  done=true;
	                  break;
	                }
                }

                try {
				    //QuickFolders.Util.logToConsole("   creating menu item " + subfolder.name + "...");
                    var menuitem = document.createElement('menuitem');
                    menuitem.setAttribute('label', subfolder.name); //+ subfolder.URI
                    menuitem.setAttribute("tag","sub");

                    if (subfolder.getNumUnread(false)>0) {
                      menuitem.setAttribute("class","hasUnread menuitem-iconic");
                      menuitem.setAttribute('label', subfolder.name + ' (' + subfolder.getNumUnread(false) + ')');
                    }
                    else
                      menuitem.setAttribute("class","menuitem-iconic");
                    menuitem.setAttribute("oncommand","QuickFolders.Interface.onSelectSubFolder('" + subfolder.URI + "')");

                    menuitem.folder = subfolder;
                    menuitem.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver)");
                    menuitem.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");

				    //QuickFolders.Util.logToConsole("   adding menu item " + subfolder.name + " to " + folder.name + "...");
                    popupMenu.appendChild(menuitem);

	                if (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders()) {
                      //QuickFolders.Util.logToConsole("folder " + subfolder.name + " has subfolders");
				      var subMenu = document.createElement('menu');
				      subMenu.setAttribute("label", subfolder.name);
				      subMenu.className = 'QuickFolders-folder-popup';

				      subMenu.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
                      //subMenu.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

		              var subPopup = document.createElement("menupopup");


                      subMenu.appendChild(subPopup);
                      popupMenu.appendChild(subMenu); // append it to main menu
                      subPopup.appendChild(menuitem); // add parent entry

		              this.addSubFoldersPopup(subPopup,subfolder); // populate the sub menu
	                }

                    if (appver<3)
                      subfolders.next();
                }
                catch(e) {done = true;}
            }

        }
    } ,

    // select subfolder (on click)
    onSelectSubFolder: function(folderUri) {
       MySelectFolder (folderUri);
       // rename parent tab EXPERIMENTAL!!
       /*
        var entry, parentEntry;
        var li=folderUri.lastIndexOf('/');
        if (li<=1) return;
        var uriParent=folderUri.substr(0, li);
        QuickFolders.Util.logDebug("uriParent: " + uriParent);
        entry = QuickFolders.Model.getFolderEntry(folderUri);

        if((parentEntry = QuickFolders.Model.getFolderEntry(uriParent))) {
            parentEntry.name = parentEntry.name + ' - ' + entry.name;
            QuickFolders.Model.update();
        }
        */
    } ,


    viewOptions: function() {
        // temporarily disable instantApply! Necessary for the time consuming style sheet changes in Layout tab.
	    var b=QuickFolders.Preferences.getInstantApplyPref();
	    QuickFolders.Preferences.setInstantApplyPref(false);
        window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,centerscreen,modal,resizable',QuickFolders);
	    QuickFolders.Preferences.setInstantApplyPref(b);
    } ,

    viewChangeOrder: function() {
        window.openDialog('chrome://quickfolders/content/change-order.xul','quickfolders-change-order',
                          'chrome,titlebar,toolbar,centerscreen,resizable,dependent',QuickFolders); // dependent = modeless
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
        }
    },

    addFolderToCategory: function(folder) {
	    var retval={btnClicked:null};
        window.openDialog('chrome://quickfolders/content/set-folder-category.xul','quickfolders-set-folder-category','chrome,titlebar,toolbar,centerscreen,modal',QuickFolders,folder,retval);
        if (retval.btnClicked!=null) {
         QuickFolders.Model.update();
       }
    },

    setButtonColor: function(button, col) {
	  var ss=QuickFolders.Styles.getMyStyleSheet();
	  if (!ss)
	    return false;

	  var folderLabel = button.label;
	  var nTabStyle = QuickFolders.Preferences.getIntPref('extensions.quickfolders.colorTabStyle');

      // have to do wildcard matching because of shortcut numbers / unread emails
	  if (col!='0') {
	    QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[label*="' + folderLabel  + '"]','background-repeat', 'repeat-x',true);
	    var sColFolder;
	    if (nTabStyle==0)
	      sColFolder="striped"
	    else
	      sColFolder="cols"
        QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[label*="' + folderLabel  + '"]','background-image', 'url("' + sColFolder + '/tabcol-' + col + '.png")',true);
      }
      else {
        QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[label*="' + folderLabel  + '"]','background-image', 'none',false);
        return  true;
      }
      // CSS 3 test in TB3
      if (QuickFolders.Util.Appver() > 2)
        QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[label*="' + folderLabel  + '"]','background-clip', 'padding-box',false);
      return  true;

    },

    setTabColor: function(folder, col) {
	    QuickFolders.Util.logToConsole("Interface.setTabColor(" + folder.URI + ", " + col + ")" );
	    this.setButtonColor(this.getButtonByFolder(folder), col);
	    QuickFolders.Model.setFolderColor(folder.URI, col); // store color in folder string
    },

    updateUserStyles: function() {
	  try {
		  var ss=QuickFolders.Styles.getMyStyleSheet();
		  if (!ss) {
		    QuickFolders.Util.logToConsole("updateUserStyles() - No style sheet found = not attempting any style modifications.");
		    return false;
	      }
   	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton','background-color',
                   QuickFolders.Preferences.getUserStyle("InactiveTab","background-color","ButtonFace"),true);
    	  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton','color',
                   QuickFolders.Preferences.getUserStyle("InactiveTab","color","black"),true);

          var colActiveBG = QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight");
	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','background-color',
                   colActiveBG, true);
          // for full colored tabs color the border as well!
	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','border-right-color',
                   colActiveBG, true);

	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','border-left-color',
                   colActiveBG, true);

	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','border-top-color',
                   colActiveBG, true);

    	  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),true);

	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat','border-bottom-color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","background-color","Highlight"),true);

		  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton:hover','background-color',
	               QuickFolders.Preferences.getUserStyle("HoveredTab","background-color","Orange"),true);
	  	  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton:hover','color',
	               QuickFolders.Preferences.getUserStyle("HoveredTab","color","Black"),true);

	   	  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton:-moz-drag-over','background-color',
	               QuickFolders.Preferences.getUserStyle("DragTab","background-color","#E93903"),true);
   		  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton:-moz-drag-over','color',
	               QuickFolders.Preferences.getUserStyle("DragTab","color","White"),true);

		  QuickFolders.Styles.setElementStyle(ss, '.toolbar','background-color',
	               QuickFolders.Preferences.getUserStyle("Toolbar","background-color","ButtonFace"),true);
		  QuickFolders.Util.logDebug("updateUserStyles(): success");
		  return true;


      }
      catch(e) {
	      alert("Quickfolders.updateUserStyles - error " + e);
		  return false;
      };
	  return false;

    }

};