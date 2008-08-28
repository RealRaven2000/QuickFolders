var QuickFolders = {

    initDelayed: function() {
        setTimeout("QuickFolders.init()",1000);
    } ,
	
    init: function() {
        QuickFolders.Util.ensureNormalFolderView();
        window.addEventListener("keypress", function(e) { QuickFolders.Interface.windowKeyPress(e); }, true);
		
        folderEntries = QuickFolders.Preferences.getFolderEntries();
		
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
		
        updateFolders: function() {
            this.buttonsByOffset = [];
            
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
            button.setAttribute("class","toolbar-height");
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
			
            this.addPopupSet(popupId,folder);
			
            button.setAttribute("ondragover","nsDragAndDrop.dragOver(event,QuickFolders.buttonDragObserver)");
            button.setAttribute("ondragdrop","nsDragAndDrop.drop(event,QuickFolders.buttonDragObserver)");
            
            return button;
        } ,
		
        onButtonClick: function(button) {
            MySelectFolder(button.folder.URI);
        } ,
		
        onRemoveFolder: function(folder) {
            QuickFolders.Model.removeFolder(folder.URI);
            this.updateFolders();
        } ,
		
        onRenameBookmark: function(folder) {
            var newName = window.prompt("Enter a new name for the bookmark",folder.name)
            if(newName) {
                QuickFolders.Model.renameFolder(folder.URI, newName);
            }
        } ,
		

        addPopupSet: function(popupId, folder) {
            popupset = document.createElement('popupset');
            this.getToolbar().appendChild(popupset);

            menupopup = document.createElement('menupopup');
            menupopup.setAttribute('id',popupId);
            menupopup.folder = folder;
			
            popupset.appendChild(menupopup);
			
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label','Remove bookmark');
            menuitem.setAttribute("oncommand","QuickFolders.Interface.onRemoveFolder(event.target.parentNode.folder)");			
            menupopup.appendChild(menuitem);
			
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label','Rename bookmark..');
            menuitem.setAttribute("oncommand","QuickFolders.Interface.onRenameBookmark(event.target.parentNode.folder)");
            menupopup.appendChild(menuitem);
        } ,
		
        viewOptions: function() {
            prefWindow = window.openDialog('chrome://quickfolders/content/options.xul','quickfolders-options','chrome,titlebar,toolbar,centerscreen,modal',QuickFolders);
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
	
    toolbarDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-folder");
            return flavours;
        },
  
        onDragOver: function (evt,flavour,session){
            session.canDrop = true;
        },
  
        onDrop: function (evt,dropData,dragSession) {
            if((sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession))) {
                QuickFolders.Model.addFolder(sourceUri);
            }
        }
    } ,
  	
    buttonDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-message");
            return flavours;
        },
  
        onDragOver: function (evt,flavor,session){
            session.canDrop = (flavor.contentType == "text/x-moz-message");
        },
  
        onDrop: function (evt,dropData,dragSession) {
            var button = evt.target;
            var targetFolder = button.folder;
			
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
            
            if(messageUris.length > 0) {
                QuickFolders.Util.moveMessages(
                  targetFolder, 
                  messageUris,
                  dragSession.dragAction == nsIDragService.DRAGDROP_ACTION_COPY
                )
            }
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
            QuickFolders.Interface.updateFolders();
        }
    },
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
    OnItemEvent: function(item, event) {
        if(event == "FolderLoaded") {
            QuickFolders.Interface.onFolderSelected();
        }
    },
    OnFolderLoaded: function(aFolder) { },
    OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}


// now register myself as a listener on every mail folder
var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
mailSession.AddFolderListener(myFolderListener, Components.interfaces.nsIFolderListener.all);

window.addEventListener("load", QuickFolders.initDelayed, true);