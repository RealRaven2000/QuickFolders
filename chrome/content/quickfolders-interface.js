var gquickfoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var qfBundle = gquickfoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");


QuickFolders.Interface = {
	TimeoutID: 0,
	debugPopupItems: 0,
    buttonsByOffset: [],
    menuPopupsByOffset: [],
    specialButtons: [],
    //myPopup: null,
    boundKeyListener: false,

    setBoundKeyListener: function(b) {
	    this.boundKeyListener=b;
    },

    tabSelectUpdate: function() {
	    try {
		    var folder;
    		QuickFolders.Util.logDebugOptional("mailTabs", "tabSelectUpdate - "
    		     + QuickFolders.currentURI +"\ntabSelectEnable=" + QuickFolders.tabSelectEnable);
		    if (QuickFolders.tabSelectEnable) {
    		    QuickFolders.Interface.onFolderSelected();
		    	// change the category (if selected folder is in list)
	    		folder = GetFirstSelectedMsgFolder();
		    	if (folder) {
			    	QuickFolders.Util.logDebugOptional("mailTabs", "Selected Tab: "+ folder.name);
			        var entry=QuickFolders.Model.getFolderEntry(folder.URI);
			        if (entry) {
				        QuickFolders.Util.logDebugOptional ("mailTabs","Current Category =" + this.getCurrentlySelectedCategoryName());
				        QuickFolders.Util.logDebugOptional ("mailTabs","Category of selected folder=" + entry.category);
				        if (!entry.category)
				          QuickFolders.Interface.selectCategory("__UNCATEGORIZED", false);
				        if (entry.category && entry.category!=this.getCurrentlySelectedCategoryName() && entry.category!="__ALWAYS")
				          QuickFolders.Interface.selectCategory(entry.category, false);
				        this.updateCategories()

			        }
	            }
            }
    		else {
    			//folder = GetMsgFolderFromUri(QuickFolders.currentURI);
			}
        } catch(e) { QuickFolders.Util.logToConsole("tabSelectUpdate failed: " + e); }
        QuickFolders.tabSelectEnable=true;
    },

    setTabSelectTimer: function() {
		  try {
		      var nDelay = 250;
		      var func = "QuickFolders.Interface.tabSelectUpdate()";
		      var tID=setTimeout(func, nDelay);
		      QuickFolders.Util.logDebug("Folder Tab Select Timer ID: " + tID);
          }
          catch (e) {
	          QuickFolders.Util.logDebug("setTabSelectTimer: " + e);
          }
    },

    setFolderUpdateTimer: function() {
	    QuickFolders.Util.logDebug("setFolderUpdateTimer - Old Timer ID: " + this.TimeoutID);

	    // avoid the overhead if marking a folder with lots of unread mails as read or getting emails
	    // made folder update asynchronous instead.
	    if (!(this.TimeoutID>0)) {
		  try {
		      var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.queuedFolderUpdateDelay');
		      if (!nDelay>0) nDelay = 750;
		      var func = "QuickFolders.Interface.queuedFolderUpdate()";
		      this.TimeoutID = setTimeout(func, nDelay);
		      QuickFolders.Util.logDebug("New Folder Update Timer ID: " + this.TimeoutID);
          }
          catch (e) {
	          QuickFolders.Util.logDebug("setFolderUpdateTimer: " + e);
          }

	    }

    },

    queuedFolderUpdate: function() {
	  QuickFolders.Util.logDebug("Folder Update from Timer " + this.TimeoutID);
	  this.updateFolders(false);
	  this.TimeoutID=0;
    },

    // added parameter to avoid deleting categories dropdown while selecting from it!
    updateFolders: function(rebuildCategories) {
	    this.TimeoutID=0;
	    var sDebug='updateFolders(' + rebuildCategories + ')';
        var toolbar = QuickFolders.Util.$('QuickFolders-Toolbar');

        if (QuickFolders.Preferences.isShowToolbarFlatstyle())
          toolbar.className = "toolbar-flat";
        else {
	      if (QuickFolders.Preferences.isShowToolbarNativeTabstyle())
	        toolbar.className = "toolbar-native";
          else
	        toolbar.className = "";
        }
        switch (toolbar.className) {
	        case "":
	          sDebug += "Style: toolbarbuttons";
	          break;
	        case "toolbar-flat":
	          sDebug += "Style: flat style";
	          break;
	        case "toolbar-native":
	          sDebug += "Style: shell tabs style";
	          break;
        }
        QuickFolders.Util.logDebug(sDebug);


        this.buttonsByOffset = [];
        this.menuPopupsByOffset = [];
        this.specialButtons = [];

        QuickFolders.Util.clearChildren(this.getToolbar(), rebuildCategories);
        // force label when there are no folders!
        QuickFolders.Util.$('QuickFolders-title-label').value =
           (QuickFolders.Preferences.isShowQuickFoldersLabel()||(0==QuickFolders.Model.selectedFolders.length)) ? 'QuickFolders:' : '';

        if (rebuildCategories || null==QuickFolders.Util.$('QuickFolders-Category-Selection'))
          this.updateCategories();


        var offset = 0;

        // force user colors on first updateFolders (no selecteFolder yet!)
        if (QuickFolders.Model.selectedFolders.length) {
	        QuickFolders.Util.logDebug('QuickFolders.Model.selectedFolders.length = ' + QuickFolders.Model.selectedFolders.length);

            for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
                var folderEntry = QuickFolders.Model.selectedFolders[i];
                var folder;
                var tabColor;

                if(!this.shouldDisplayFolder(folderEntry))
                    continue;
                try {tabColor = folderEntry.tabColor;}
                catch(e) {tabColor = null};

                if((folder = GetMsgFolderFromUri(folderEntry.uri, true))) {
                    var button = this.addFolderButton(folder, folderEntry.name, offset, tabColor);

                    this.buttonsByOffset[offset] = button;
			        if (tabColor) {
			          this.setButtonColor(button, tabColor);
		              QuickFolders.Util.logDebugOptional("css","Button Color: " + tabColor);
		            }

                    offset++;
                }
            }
            QuickFolders.Util.logDebugOptional("folders",QuickFolders.Model.selectedFolders.length + " bookmarked folders added to Model.");

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
       QuickFolders.Util.logDebug("Selecting Category: " + categoryName + "...");
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
				QuickFolders.Util.logDebugOptional("events", dir + " ALT " + e.altKey + " - CTRL " + e.ctrlKey + "   kC: " + e.keyCode + "  cC:" + e.charCode);
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
	    QuickFolders.Util.logDebugOptional("folders", "addFolderButton " + folder.name + "...");

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

	    // does the folder end with this name?
	    var fString = folder.URI.toLowerCase();
        if (this.endsWith(fString, "/inbox"))
	        specialFolderType="inbox" + sDisplayIcons;
        else if (this.endsWith(fString, "/sent"))
	        specialFolderType="sent" + sDisplayIcons;
        else if (this.endsWith(fString, "/trash"))
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

        QuickFolders.Util.logDebugOptional("folders","Folder [" + label + "] added.\n===================================");

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
	    var msg=folder.name + " tab removed from QuickFolders";
        QuickFolders.Model.removeFolder(folder.URI);
        this.updateFolders(true);
	    try{window.MsgStatusFeedback.showStatusString(msg);} catch(e) {;};
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

        if (QuickFolders.Util.Appver() > 2 && QuickFolders.Util.Application()=='Thunderbird')
          alert ("to do: add compactfolder for TB3");
        else {
          messenger.CompactFolder(GetFolderDatasource(),targetResource, false);
          alert(qfBundle.GetStringFromName("qfCompacted") +" "+folder.name);
        }
    },

    addPopupSet: function(popupId, folder, offset) {
        var popupset = document.createElement('popupset');
        QuickFolders.Util.logDebugOptional("popupmenus", "Create popup menu " + folder.name + "...");
        this.getToolbar().appendChild(popupset);

        var menupopup = document.createElement('menupopup');
        menupopup.setAttribute('id',popupId);
        menupopup.setAttribute('position','after_start');

        menupopup.className = 'QuickFolders-folder-popup';
        menupopup.folder = folder;

        popupset.appendChild(menupopup);

        var menuitem;
        QuickFolders.Util.logDebugOptional("popupmenus","Creating Popup Set for " + folder.name);

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

        if (QuickFolders.Util.Appver() < 3 && QuickFolders.Util.Application()=='Thunderbird'
         || QuickFolders.Util.Application()=='Postbox') {
	        // IN TB3, Postbox, SeaMonkey we will implement that one later :)
	        // Postbox might get an indexing menu item?
	        menuitem = document.createElement('menuitem');
	        menuitem.className='cmd menuitem-iconic';
	        menuitem.setAttribute("tag","qfCompact");
	        menuitem.setAttribute('label',qfBundle.GetStringFromName("qfCompactFolder"));
	        menuitem.setAttribute("accesskey",qfBundle.GetStringFromName("qfCompactFolderAccess"));
	        menuitem.setAttribute("oncommand","QuickFolders.Interface.onCompactFolder(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
	        menupopup.appendChild(menuitem);
        }

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute("class","cmd menuitem-iconic");
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

        QuickFolders.Util.logDebugOptional("popupmenus","Popup set created..\n-------------------------");

        var menuColorPopup = document.createElement("menupopup");
        colorMenu.appendChild(menuColorPopup);

        // create color pick items
        var jCol;
        QuickFolders.Util.logDebugOptional("popupmenus","Creating Colors Menu for " + folder.name + "...");
        for (jCol=0; jCol<=20;jCol++) {
	        menuitem = document.createElement('menuitem');
	        menuitem.className='color menuitem-iconic';
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
        QuickFolders.Util.logDebugOptional("popupmenus","Colors Menu created.\n-------------------------");

        // append it to main popup menu
	    menupopup.appendChild(colorMenu);

	    //moved this out of addSubFoldersPopup for recursive menus
	    if (folder.hasSubFolders) {
	       QuickFolders.Util.logDebugOptional("popupmenus","Creating SubFolder Menu for " + folder.name + "...");
           menupopup.appendChild(document.createElement('menuseparator'));
	       this.debugPopupItems=0;
	       this.addSubFoldersPopup(menupopup, folder);
	       QuickFolders.Util.logDebugOptional("popupmenus","Created Menu " + folder.name + ": " + this.debugPopupItems + " items.\n-------------------------");
        }

        this.menuPopupsByOffset[offset] = menupopup;

    } ,

     /**
	* Sorts the passed in array of folder items using the folder sort key
	*
	* @param aFolders - the array of ftvItems to sort.
	*/
	sortFolderItems: function (aFtvItems) {
	  function sorter(a, b) {
		var sortKey;
	    sortKey = a._folder.compareSortKeys(b._folder);
	    if (sortKey)
	      return sortKey;
	    return a.text.toLowerCase() > b.text.toLowerCase();
	  }
	  aFtvItems.sort(sorter);
	},


    // add all subfolders (1st level, non recursive) of folder to popupMenu
    addSubFoldersPopup: function(popupMenu, folder) {
        if (folder.hasSubFolders) {
            var subfolder, subfolders;
	        var appver=QuickFolders.Util.Appver();
	        switch (QuickFolders.Util.Application()) {
		          case 'Postbox':
		            // was appver<2
	                subfolders = folder.GetSubFolders();
		            break;
		          case 'Thunderbird':
			        if (appver<3) {
		              subfolders = folder.GetSubFolders();
		              //subfolders.sort();
	                }
		            else
		              subfolders = folder.subFolders;
		            break;
		          case 'SeaMonkey':
	                subfolders = folder.subFolders;
		            break;
	        }

            var done = false;

            while (!done) {
	        	if ( (QuickFolders.Util.Application()=='Thunderbird' && appver<3)
	        	   || QuickFolders.Util.Application()=='Postbox')
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
	                this.debugPopupItems++;
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
                    if (!(QuickFolders.Util.Application()=='Thunderbird' && appver<3))
                      menuitem.setAttribute("ondragenter","event.preventDefault()"); // fix layout issues in TB3 + Postbox!
                    menuitem.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.popupDragObserver)"); // okay
                    menuitem.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);"); // use same as buttondragobserver for mail drop!
                    menuitem.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

				    //QuickFolders.Util.logToConsole("   adding menu item " + subfolder.name + " to " + folder.name + "...");
                    popupMenu.appendChild(menuitem);

	                if (subfolder.hasSubFolders && QuickFolders.Preferences.isShowRecursiveFolders()) {
		              this.debugPopupItems++;
                      //QuickFolders.Util.logToConsole("folder " + subfolder.name + " has subfolders");
				      var subMenu = document.createElement('menu');
				      subMenu.setAttribute("label", subfolder.name);
				      subMenu.className = 'QuickFolders-folder-popup';

				      subMenu.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.popupDragObserver);");
                      subMenu.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.popupDragObserver);");

		              var subPopup = document.createElement("menupopup");


                      subMenu.appendChild(subPopup);
                      popupMenu.appendChild(subMenu); // append it to main menu
                      subPopup.appendChild(menuitem); // add parent entry

		              this.addSubFoldersPopup(subPopup,subfolder); // populate the sub menu
	                }

                    if ((QuickFolders.Util.Application()=='Thunderbird' && appver<3)
                        || QuickFolders.Util.Application()=='Postbox') {
	                  try { subfolders.next(); } catch(e) { done=true; }
                    }
                }
                catch(e) {QuickFolders.Util.logDebug('Exception in addSubFoldersPopup: ' + e); done = true;}
            }

        }
    } ,

    // select subfolder (on click)
    onSelectSubFolder: function(folderUri) {
       MySelectFolder (folderUri);
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

        if (null==folder) return; // cut out lots of unneccessary processing!

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

	  var folderLabel = button.getAttribute("label"); // fixes disappearing colors on startup bug
	  var nTabStyle = QuickFolders.Preferences.getIntPref('extensions.quickfolders.colorTabStyle');

      // have to do wildcard matching because of shortcut numbers / unread emails
	  if (col!='0') {
	    //QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[label*="' + folderLabel  + '"]','background-repeat', 'repeat-x',true);
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
	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','background-color', colActiveBG, true);
          // for full colored tabs color the border as well!
          // but should only apply if background image is set!!
	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton[background-image].selected-folder','border-color', colActiveBG, true);


    	  QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat toolbarbutton.selected-folder','color',
                   QuickFolders.Preferences.getUserStyle("ActiveTab","color","HighlightText"),true);

	      QuickFolders.Styles.setElementStyle(ss, '.toolbar-flat','border-bottom-color', colActiveBG,true);

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
		  QuickFolders.Util.logDebugOptional ("css","updateUserStyles(): success");
		  return true;


      }
      catch(e) {
	      alert("Quickfolders.updateUserStyles - error " + e);
		  return false;
      };
	  return false;

    }

};