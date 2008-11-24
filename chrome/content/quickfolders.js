
/*
  File History
  ============
  
  05/09/2008
    AG added Code to remove dynamic "subfolder" popup menus that act as drop targets. this should also deal with resource issues
       made sorting with mouse more persistant (it sometimes jumped back!)
  07/07/2008
    AG added visual indication for drop position (like FX tabs)
  10/09/2008
    AG added Quick Help (options.xul, options.js)
       removed 'toolbar' style from option window to support tabbed interface
  05/10/2008
    AG loading version number dynamically in options dialog
  19/11/2008
    AG fixed bug with drifting popup menus
       fixed same popup not reappearing if first drag not completed
  24/11/2008
    AG rename improved (this used to show folder name not quickfolder name)  
    
  KNOWN ISSUES
  ============
  05/09/2008
    - if folders are added / removed during session this is not refreshed in subfolder list of popup set!
  
    
  PLANNED FEATURES / NICE TO HAVE
  ===============================
    - dragging onto Menus should highlight target folder (difficult?)
    - drag to thread finds quickfolder with correct thread and drops message there
    - multiple lines for quickfolders


*/

var QuickFolders = {

    initDelayed: function() {
        if(QuickFolders.isCorrectWindow()) {
            document.getElementById('QuickFolders-Toolbar').style.display = '';
            setTimeout("QuickFolders.init()",1000);
        }
        else {
            document.getElementById('QuickFolders-Toolbar').style.display = 'none';
        }
    } ,
    
    isCorrectWindow: function() {
        return document.getElementById('messengerWindow').getAttribute('windowtype') == "mail:3pane";
    } ,
	
    init: function() {
        QuickFolders.Util.ensureNormalFolderView();
        window.addEventListener("keypress", function(e) { QuickFolders.Interface.windowKeyPress(e); }, true);
		
        var folderEntries = QuickFolders.Preferences.getFolderEntries();
		
        if(folderEntries.length > 0) {
            QuickFolders.Model.selectedFolders = folderEntries;
            QuickFolders.Interface.updateFolders();
        }
        
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        
        observerService.addObserver({
            observe: function() { QuickFolders.Interface.updateFolders(); }
        },"quickfolders-options-saved", false);
    } ,
	
    sayHello: function() {
        alert("Hello from QuickFolders")
    } ,
	
    Interface: {
        
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
            
            this.buttonsByOffset = [];
            this.menuPopupsByOffset = [];
            this.specialButtons = [];
            
            QuickFolders.Util.$('QuickFolders-title-label').style.display = QuickFolders.Preferences.isShowQuickFoldersLabel() ? '' : 'none';

            QuickFolders.Util.clearChildren(this.getToolbar());
            
            var offset = 0;
			
            for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
                var folderEntry = QuickFolders.Model.selectedFolders[i];
                var folder;
                
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
               
               if(button.folder.URI == folder.URI) {
                   return button;
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
              
            button.setAttribute("label", label);
            
            if(numUnread > 0 && QuickFolders.Preferences.isShowUnreadFoldersBold()) {
                button.className += " has-unread";
            }
            
            if(numTotal > 0 && QuickFolders.Preferences.isShowFoldersWithMessagesItalic()) {
                button.className += " has-messages";
            }
			
            button.folder = folder;
			
            button.setAttribute("oncommand",'QuickFolders.Interface.onButtonClick(event.target);');
			
			
            var popupId = 'QuickFolders-folder-popup-' + folder.URI;
            button.setAttribute('context',popupId);

            this.getToolbar().appendChild(button);
            this.addPopupSet(popupId,folder, offset);
			
            button.setAttribute("ondragenter","nsDragAndDrop.dragEnter(event,QuickFolders.buttonDragObserver);");
            button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver);");
            button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver);");
            
            // AG add dragging of buttons
            button.setAttribute("ondraggesture","nsDragAndDrop.startDrag(event,QuickFolders.buttonDragObserver, true)");
            button.setAttribute("ondragexit","nsDragAndDrop.dragExit(event,QuickFolders.buttonDragObserver)");
            return button;
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
            var newName = window.prompt("Enter a new name for the bookmark",QuickFolders.Interface.getButtonByFolder(folder).label); // replace folder.name!
            if(newName) {
                QuickFolders.Model.renameFolder(folder.URI, newName);
            }
        } ,
        
        onCompactFolder: function(folder) {
            var msgfolder = GetMsgFolderFromUri(folder.URI,true);
            var targetResource = msgfolder.QueryInterface(Components.interfaces.nsIRDFResource);
            
            messenger.CompactFolder(GetFolderDatasource(),targetResource, false);
            alert("Compacted " + folder.name);
        },
        
        addPopupSet: function(popupId, folder,offset) {
            var popupset = document.createElement('popupset');
            this.getToolbar().appendChild(popupset);

            var menupopup = document.createElement('menupopup');
            menupopup.setAttribute('id',popupId);
            menupopup.className = 'QuickFolders-folder-popup';
            menupopup.folder = folder;
			
            popupset.appendChild(menupopup);
			
            var menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label','Remove bookmark');
            menuitem.setAttribute("oncommand","QuickFolders.Interface.onRemoveFolder(event.target.parentNode.folder)");			
            menupopup.appendChild(menuitem);
			
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label','Rename bookmark..');
            menuitem.setAttribute("oncommand","QuickFolders.Interface.onRenameBookmark(event.target.parentNode.folder)");
            menupopup.appendChild(menuitem);
            
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label','Compact Folder');
            menuitem.setAttribute("oncommand","QuickFolders.Interface.onCompactFolder(event.target.parentNode.folder)");  // "MsgCompactFolder(false);" only for current folder
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
            var prefWindow = window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options',
              'chrome,titlebar,centerscreen,modal',QuickFolders);
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
        } 
    } ,
	
    Model: {
        selectedFolders: [],
		
        addFolder: function(uri) {
            if(!this.getFolderEntry(uri)) {
                this.selectedFolders.push({
                    uri: uri, 
                    name: ''
                });
				
                this.update();
            }
            else {
                alert("Folder is already bookmarked");
            }
        } ,
		
        getFolderEntry: function(uri) {
            for(i = 0; i < this.selectedFolders.length; i++) {
                if(this.selectedFolders[i].uri == uri) {
                    return this.selectedFolders[i];
                }
            }
	
            return false;
        } ,
		
        removeFolder: function(uri) {
            for(i = 0; i < this.selectedFolders.length; i++) {
                if(this.selectedFolders[i].uri == uri) {
                    this.selectedFolders.splice(i,1);
                }
            }
			
            this.update();
        } ,
		
        renameFolder: function(uri, name) {
            if((entry = this.getFolderEntry(uri))) {
                entry.name = name;
                this.update();
            }
        } ,
		
        update: function() {
            QuickFolders.Interface.updateFolders();
            QuickFolders.Preferences.setFolderEntries(this.selectedFolders);
        }
		
    } ,
	
    // handler for dropping folder shortcuts
    toolbarDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-folder");
            flavours.appendFlavour("text/unicode");  // test
            return flavours;
        },
        
        onDragOver: function (evt,flavour,session){
            session.canDrop = true;
        },
        
        onDrop: function (evt,dropData,dragSession) {
            
            switch (dropData.flavour.contentType) {
                case  "text/x-moz-folder":
                    var sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession)
	            if(sourceUri) {
                        QuickFolders.Model.addFolder(sourceUri);
                    }
                    break;
                case "text/unicode":
                    // plain text: button was moved
                    var myDragPos;
                    if (evt.pageX<120) // should find this out by checking whether "Quickfolders" label is hit
                        myDragPos="LeftMost"
                    else
                        myDragPos="RightMost"
                    QuickFolders.ChangeOrder.insertAtPosition(dropData.data, "", myDragPos); 
                    break;
            }
        }
    } ,
    
    buttonDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-message");
            flavours.appendFlavour("text/unicode");  // test
            return flavours;
        },
        
        dragOverTimer: null,
        
        onDragEnter: function(evt, dragSession) {
            try {
                var button = evt.target;
            
                if(button.tagName == "toolbarbutton") {
                    // highlight drop target
                    if (dragSession.numDropItems==1) {
                      if (dragSession.isDataFlavorSupported("text/unicode" )) {
	                    // show reordering target position!
	                    // right or left of current button! (try styling button with > OR < to show on which side the drop will happen)
	                    var node = dragSession.sourceNode;  
	                    
	                    // find out whether drop target button is right or left from source button:
	                    if (node.hasAttributes()) {
							var j;
							var sDirection;
							  var box = node.boxObject;
							  if (box) {
								  var dx = (box.x - button.boxObject.x);
								  if (dx != 0) {
									  sDirection=(dx>0 ? "dragLEFT" : "dragRIGHT")
								      button.className += (" " + sDirection); // add style for drop arrow (remove onDragExit)
							      }
							  }
	                    }
                      }
                    } 
  
	                //show context menu if dragged over a button which has subfolders
                    var targetFolder = button.folder;
                    if(targetFolder.hasSubFolders) {
                        //close any other context menus
                        var otherPopups = QuickFolders.Interface.menuPopupsByOffset;
                        for(var i = 0; i < otherPopups.length; i++) {
                            otherPopups[i].hidePopup();
                        }
                        if (dragSession.isDataFlavorSupported("text/unicode" ))
	                      return;  // don't show popup when reordering tabs
                        
                        // instead of using the full popup menu (containing the 3 top commands)
                        // try to create droptarget menu that only contains the target subfolders "on the fly"
                        // haven't found a way to tidy these up, yet (should be done in onDragExit?) 
                        // Maybe they have to be created at the same time as the "full menus" and part of another menu array like menuPopupsByOffset
                        // no menus necessary for folders without subfolders!
			            var popupset = document.createElement('popupset');
			            QuickFolders.Interface.getToolbar().appendChild(popupset);
			            var menupopup = document.createElement('menupopup');
			            var popupId = 'moveTo_'+targetFolder.URI;
			            menupopup.setAttribute('id', popupId); 
			            menupopup.className = 'QuickFolders-folder-popup';
			            menupopup.folder = targetFolder;
			            popupset.appendChild(menupopup);
	                    QuickFolders.Interface.addSubFoldersPopup(menupopup, targetFolder);
	                    // a bug in showPopup when used with coordinates makes it start from the wrong origin
	                    //document.getElementById(popupId).showPopup(button, button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
	                    // AG fixed, 19/11/2008 - showPopup is deprecated in FX3!
	                    document.getElementById(popupId).showPopup(button, -1,-1,"context","bottomleft","topleft");
                        
	                    if (popupId==globalHidePopupId) globalHidePopupId=""; // avoid hiding "itself". globalHidePopupId is not cleared if previous drag cancelled.
	                    
						/* original by Alex (displays full menu)
                        var popupId = 'QuickFolders-folder-popup-' + targetFolder.URI;
                        var popup = document.getElementById(popupId);
                        popup.showPopup(button,button.boxObject.screenX, Number(button.boxObject.screenY) + Number(button.boxObject.height));
                        */
                    }
                  
                    
                }
		        // delete previous drag folders popup!
                if (globalHidePopupId && globalHidePopupId!="") {
	                    var popup = document.getElementById(globalHidePopupId);
				        try {
					        popup.parentNode.removeChild(popup); //was popup.hidePopup() 
				        }
				        catch (e) {
					        //window.dump("removing popup: " + globalHidePopupId + " failed!\n" + e + "\n");	
				        }
				        globalHidePopupId="";
                    }
            }
            catch(e) {
                alert("quickFolders:\n" + e);
            }
        } ,
        
        // deal with old folder popups 	
        onDragExit: function(event, dragSession) {
	        var button = event.target;
	        globalHidePopupId="";
	        if (dragSession.isDataFlavorSupported("text/unicode" )) 
	        {
		        // remove dragdrop marker:
		        button.className = button.className.replace(/\s*dragLEFT/,"");
		        button.className = button.className.replace(/\s*dragRIGHT/,"");
		    	return;  // don't remove popup when reordering tabs
	        }
		    // problem: event also fires when dragging into the menu, so we can not remove it then!
	        var targetFolder = button.folder;
	        var popupId = 'moveTo_'+targetFolder.URI;
	        
	        // this popup needs to be removed if we drag into another button.
	        try {
		        if (document.getElementById(popupId)) 
			        globalHidePopupId = popupId; // arm for hiding! GLOBAL VAR!!
            }
            catch(ex) {
	            window.dump("Cannot setup for delete: popup " + popupId + "\n" + ex);
            }

	            
        } ,
        

        onDragOver: function (evt,flavor,session){
            session.canDrop = (flavor.contentType == "text/x-moz-message" || flavor.contentType == "text/unicode");
        },
        
        onDrop: function (evt,dropData,dragSession) {
            var button = evt.target;
            var targetFolder = button.folder;
            globalHidePopupId="";
            
            switch (dropData.flavour.contentType) {
                case  "text/x-moz-message":  // fall through
                case  "text/x-moz-folder":
                    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                    trans.addDataFlavor("text/x-moz-message");
                    
                    var messageUris = [];
                    
                    for (var i = 0; i < dragSession.numDropItems; i++) {
                        dragSession.getData (trans, i);
                        var dataObj = new Object();
                        var flavor = new Object();
                        var len = new Object();
                        trans.getAnyTransferData(flavor, dataObj, len);
                        
                        if (flavor.value == "text/x-moz-message" && dataObj) {
                            dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
                            var messageUri = dataObj.data.substring(0, len.value);
                            
                            messageUris.push(messageUri);
                        }
                    }
                    // handler for dropping messages
                    if(messageUris.length > 0) {
                        QuickFolders.Util.moveMessages(
                          targetFolder, 
                          messageUris,
                          dragSession.dragAction == nsIDragService.DRAGDROP_ACTION_COPY
                        )
                    }
                    
                    break;
                case "text/unicode":
                    QuickFolders.ChangeOrder.insertAtPosition(dropData.data, button.folder.URI, ""); 
                    break;
            }
        },
        // new handler for starting drag of buttons (re-order)
        onDragStart: function (event, transferData, action) {
            var button = event.target;
            transferData.data = new TransferData();
            transferData.data.addDataForFlavour("text/unicode", button.folder.URI); // test 
        }
        
    } ,
    
    Preferences: {
        service: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
  		
        setFolderEntries: function(folderEntries) {
            this.service.setCharPref("QuickFolders.folders",JSON.stringify(folderEntries));
        } ,
  		
        getFolderEntries: function() {
            if(!this.service.prefHasUserValue("QuickFolders.folders")) {
                return [];
            }
            
            var folders;
  			
            if((folders = this.service.getCharPref("QuickFolders.folders"))) {
                return JSON.parse(folders);
            }
            else {
                return [];
            }
        } ,
  		
        isShowUnreadCount: function() {
            return this.service.getBoolPref("extensions.quickfolders.showUnreadOnButtons");
        } ,
  		
        isShowQuickFoldersLabel: function() {
            return this.service.getBoolPref("extensions.quickfolders.showQuickfoldersLabel");
        } ,
  		
        isShowUnreadFoldersBold: function() {
            return this.service.getBoolPref("extensions.quickfolders.showUnreadFoldersBold");
        } ,
        
        isUseKeyboardShortcuts: function() {
            return this.service.getBoolPref("extensions.quickfolders.useKeyboardShortcuts");
        } ,
        
        isShowShortcutNumbers: function() {
            return this.service.getBoolPref("extensions.quickfolders.showShortcutNumber");
        } ,
        
        isShowTotalCount: function() {
            return this.service.getBoolPref("extensions.quickfolders.showTotalNumber");
        } ,
        
        isShowFoldersWithMessagesItalic: function() {
            return this.service.getBoolPref("extensions.quickfolders.showFoldersWithMessagesItalic");
        } ,
        
        isShowToolbarFlatstyle: function() {
            return this.service.getBoolPref("extensions.quickfolders.showFlatStyle");
        }
        
        
    } ,
  	
    Util: {
        $: function(id) {
            return document.getElementById(id);
        } ,
		
        clearChildren: function(element) {
            while(element.childNodes.length > 0) {
                element.removeChild(element.childNodes[0]);
            }
        } ,
		
        ensureNormalFolderView: function() {
            if(loadFolderView != undefined) {
                //default folder view to "All folders", so we can select it
                loadFolderView(0);
            }
        } ,
		
		
        getFolderUriFromDropData: function(dropData, dragSession) {
           var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            trans.addDataFlavor("text/x-moz-folder");
		    
            dragSession.getData (trans, 0);
            var dataObj = new Object();
            var flavor = new Object();
            var len = new Object();
            trans.getAnyTransferData(flavor, dataObj, len);
        	
            if (dataObj) {
            	dataObj = dataObj.value.QueryInterface(Components.interfaces.nsISupportsString);
            	sourceUri = dataObj.data.substring(0, len.value);
            	return sourceUri;
            }
            
            return null;
        } ,
        
        moveMessages: function(targetFolder, messageUris, makeCopy) {
            var targetResource = targetFolder.QueryInterface(Components.interfaces.nsIRDFResource);
			
            var messageList = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
            
            for (var i = 0; i < messageUris.length; i++) {
                var messageUri = messageUris[i];
                messageList.AppendElement(messenger.messageServiceFromURI(messageUri).messageURIToMsgHdr(messageUri));
            }
            
            var sourceMsgHdr = messageList.GetElementAt(0).QueryInterface(Components.interfaces.nsIMsgDBHdr);				
            var sourceFolder = sourceMsgHdr.folder;
            var sourceResource = sourceFolder.QueryInterface(Components.interfaces.nsIRDFResource);
            
            messenger.CopyMessages(GetFolderDatasource(), sourceResource, targetResource, messageList, !makeCopy);
        } ,
		
		
        debugVar: function(value) {
            str = "Value: " + value + "\r\n";
            for(prop in value) {
                str += prop + " => " + value[prop] + "\r\n";
            }
			
            dump(str);
        } 
    } ,
  	
    ChangeOrder: {
        window: null,
  		
        init: function(window) {
            this.window = window;
            this.showFolders();
        } ,
  		
        $: function(id) {
            return this.window.document.getElementById(id);
        } ,
  		
        showFolders: function() {
            rows = this.$('QuickFolders-change-order-grid-rows');
            QuickFolders.Util.clearChildren(rows);
  			
            for(i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
                folderEntry = QuickFolders.Model.selectedFolders[i];
				
                folder = GetMsgFolderFromUri(folderEntry.uri, true);
				
                if(folder != undefined) {
                    this.addFolderButton(folder, folderEntry.name)
                }
            }
        } ,
  		
        addFolderButton: function(folder, useName) {
            label = (useName && useName.length > 0) ? useName : folder.name;
  			
            rows = this.$('QuickFolders-change-order-grid-rows');
            row = document.createElement("row");
  			
            folderLabel = document.createElement("label");
            folderLabel.appendChild(document.createTextNode(label));
            row.appendChild(folderLabel);
  			
            var buttonUp = document.createElement("button");
            buttonUp.setAttribute("label","Up");
            buttonUp.linkedFolder = folder;
            buttonUp.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");
            row.appendChild(buttonUp);
  			
            var buttonDown = document.createElement("button");
            buttonDown.setAttribute("label","Down");
            buttonDown.linkedFolder = folder;
            buttonDown.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
            row.appendChild(buttonDown);
  			
            rows.appendChild(row);
        } ,
  		
        onButtonClick: function(button, direction, folderURI) {
            modelSelection = QuickFolders.Model.selectedFolders;
  			
            for(var i = 0; i < modelSelection.length; i++) {
                folderEntry = modelSelection[i];
				
                if(folderEntry.uri == folderURI) {
					
                    if(i > 0 && direction == 'up') {
                        tmp = modelSelection[i - 1];
                        modelSelection[i - 1] = modelSelection[i];
                        modelSelection[i] = tmp;
                        QuickFolders.ChangeOrder.showFolders();
                        return;
                    }
					
                    if(i < modelSelection.length - 1 && direction == 'down') {
                        tmp = modelSelection[i + 1];
                        modelSelection[i + 1] = modelSelection[i];
                        modelSelection[i] = tmp;
                        QuickFolders.ChangeOrder.showFolders();
                        return;
                    }
                }
            }
        } ,
        
        insertAtPosition: function(buttonURI, targetURI, toolbarPos) {
          var folderEntry, folder;
          var iSource, iTarget;
          
		      // alert (i + " " + folder.name + " lbl: " + folderEntry.name + " uri: " + folderEntry.uri);
          // alert("insertAtPosition(" + buttonURI +", "+ targetURI +  ")");
          var modelSelection = QuickFolders.Model.selectedFolders;
          
          for(var i = 0; i < modelSelection.length; i++) {
              folderEntry  = QuickFolders.Model.selectedFolders[i];
	          folder = GetMsgFolderFromUri(folderEntry.uri, true);

	          if (toolbarPos=="")
	            if (folderEntry.uri==targetURI) 
		            iTarget = i;
            
              if (folderEntry.uri==buttonURI) 
	            iSource = i;
          }
          
          switch(toolbarPos) {
	          case "LeftMost":
	            iTarget = 0;
	            break;
	          case "RightMost":
	            iTarget = modelSelection.length-1;
	            break;
	      }

	      if (iSource!=iTarget) {
		      var tmp;
		      if (iSource<iTarget) { // drag right
			      for (i=iSource; i<iTarget; i++) {
		            tmp = modelSelection[i];
		            modelSelection[i] = modelSelection[i+1];
		            modelSelection[i+1] = tmp;
		        }
		      }
		      else {  // drag left
			      for (i=iSource; i>iTarget; i--) {
		            tmp = modelSelection[i];
		            modelSelection[i] = modelSelection[i-1];
		            modelSelection[i-1] = tmp;
		          }
		      }
		      QuickFolders.Model.update(); // update folders!
		 }
	   }
        
    }
}

function MyEnsureFolderIndex(builder, msgFolder)
{
    // try to get the index of the folder in the tree
    var index = builder.getIndexOfResource(msgFolder);
  
    if (index == -1) {
  	parentIndex = MyEnsureFolderIndex(builder, msgFolder.parent);
  	
        // if we couldn't find the folder, open the parent
        if(!builder.isContainerOpen(parentIndex)) {
            builder.toggleOpenState(parentIndex);
        }
    
        index = builder.getIndexOfResource(msgFolder);
    }
    return index;
}

function MySelectFolder(folderUri)
{
    QuickFolders.Util.ensureNormalFolderView();
	
    var folderTree = GetFolderTree();
    var folderResource = RDF.GetResource(folderUri);
    var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
    
    // before we can select a folder, we need to make sure it is "visible"
    // in the tree.  to do that, we need to ensure that all its
    // ancestors are expanded
    var folderIndex = MyEnsureFolderIndex(folderTree.builderView, msgFolder);
    ChangeSelection(folderTree, folderIndex);
}


// set up the folder listener to point to the above function
var myFolderListener = {
    OnItemAdded: function(parent, item, viewString) {},
    OnItemRemoved: function(parent, item, viewString) {},
    OnItemPropertyChanged: function(parent, item, viewString) {  },
    OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
        //alert("OnIntPropertyChanged has fired with property " + item + " / " + property + "\n");
        if (property == "TotalUnreadMessages") {
            if(QuickFolders) {
                QuickFolders.Interface.updateFolders();
            }
        }
    },
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
    OnItemEvent: function(item, event) {
        if(event == "FolderLoaded") {
            if(QuickFolders) {
                QuickFolders.Interface.onFolderSelected();
            }
        }
    },
    OnFolderLoaded: function(aFolder) { },
    OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}


// now register myself as a listener on every mail folder
var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
mailSession.AddFolderListener(myFolderListener, Components.interfaces.nsIFolderListener.all);

window.addEventListener("load", QuickFolders.initDelayed, true);

var globalHidePopupId="";
window.dump("globalHidePopupId=" + globalHidePopupId + "\n");
