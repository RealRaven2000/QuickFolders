
/*===============
  Project History
  ===============
  
  05/09/2008
    AG added Code to remove dynamic "subfolder" popup menus that act as drop targets. this should also deal with resource issues
       made sorting with mouse more persistant (it sometimes jumped back!)
       
  07/07/2008
    AG added visual indication for drop position (like FX tabs)
    
  10/09/2008
    AG added Quick Help tab (options.xul, options.js)
       removed 'toolbar' style from option window to support tabbed interface
       
  05/10/2008
    AG loading version number dynamically in options dialog
    
  19/11/2008 - Release 0.9.3
    AG fixed bug with drifting popup menus
       fixed same popup not reappearing if first drag not completed
       
  24/11/2008
    AG rename bug fixed (this used to show original folder name not quickfolder name)  
    
  04/01/2009 - Release 0.9.4
    AM added folder category feature
       split sources into more manageable portions
       
  09/01/2009 - Release 0.9.5
    AG added "Always show" category and moved "(All)" to the top
       set category dialog: added [Add] button and made [Ok] button work differently
       re-added addon icon to install.rdf
       
  14/01/2009
    AG Split main options dialog into 3 tabs and added Layout tab
       Added Color Picker to Layout tab (WIP)
       Added Color Picker to Categories dialog (WIP)
       Added accelerator keys to popup menus
       Layout Improvements in style sheet (saves space)
       Tidied up Project History
       
  17/01/2009 0.9.7
    AG added locale support with help of goofy's sent code
       coloring of active, hovered tab and tabbar background 
       German locale
       
  19/01/2009 0.9.8
    AG storing of colors
       rounded tabs (flat style)!  
       updated screenshots on the site and added German translations
    Alex added Dutch locale

  28/01/2009 0.9.9
    AG Improved layout of flat style - tested under Crystal, default and outlook themes.
       added "show icons" option which displays special icons for Inbox, Sent, Trash and current folder
       tried "3d" look on flat-style tabs but removed it again
       fixed an issue with height of category dropdown
       removed (test) color picker from category dialog
       added menu highlighting on drag mail to popup
    
   07/02/2009 0.9.9.1
     AG force display of OK / Cancel button for applying color options
        improved detection of URIs for special icons

   08/02/2009 
     AG update count if total count is displayed
   
   12/02/2009 0.9.9.2
     AG added menu icons
        added gradient display for menu items

   12/02/2009 
     AG removed arbitrary error output caused by isCorrectWindow and initDelayed (?)
   
  KNOWN ISSUES
  ============
  05/09/2008
    - if folders are added / removed during session this is not refreshed in subfolder list of popup set!
    - folders can be orphaned in config settings and are not removable via interface
  
    
  PLANNED FEATURES
  ================
    - size of category dropdown should increase with size of 
    - colors for categories / single folders {TBD}
    
  WISHLIST
  ========  
    - drag to thread finds quickfolder with correct thread and drops message there
    - multiple lines for quickfolders (probably obsolete, since categories)
    - instantApply support (difficult, as there is no onclose event)


*/

var QuickFolders = {

    initDelayed: function() {
        if(QuickFolders.isCorrectWindow()) {
            document.getElementById('QuickFolders-Toolbar').style.display = '';
            setTimeout("QuickFolders.init()",1000);
        }
        else {
	      try { document.getElementById('QuickFolders-Toolbar').style.display = 'none'; }
	      catch(e) { ;}
        }
    } ,
    
    isCorrectWindow: function() {
	    try {
          return document.getElementById('messengerWindow').getAttribute('windowtype') == "mail:3pane";
        }
        catch(e) { return false; }
    } ,
	
    init: function() {
        window.addEventListener("keypress", function(e) { QuickFolders.Interface.windowKeyPress(e); }, true);
		
        var folderEntries = QuickFolders.Preferences.getFolderEntries();
		
        if(folderEntries.length > 0) {
            QuickFolders.Model.selectedFolders = folderEntries;

            var lastSelectedCategory = QuickFolders.Preferences.getLastSelectedCategory()

            if(QuickFolders.Model.isValidCategory(lastSelectedCategory)) {
                QuickFolders.Interface.selectCategory(QuickFolders.Preferences.getLastSelectedCategory())
            }

            QuickFolders.Interface.updateFolders();
            QuickFolders.Interface.updateUserStyles();

        }
        
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        
        observerService.addObserver({
            observe: function() { 
	           QuickFolders.Interface.updateFolders(); 
               QuickFolders.Interface.updateUserStyles();
                 }
               },"quickfolders-options-saved", false);
    } ,
	
    sayHello: function() {
        alert("Hello from QuickFolders")
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
                        QuickFolders.Model.addFolder(sourceUri, QuickFolders.Interface.getCurrentlySelectedCategoryName());
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
        try {
          if (property == "TotalUnreadMessages" || 
              (QuickFolders.Preferences.isShowUnreadCount() && property == "TotalMessages")) {  // FolderSize
	            if(QuickFolders) 
	                QuickFolders.Interface.updateFolders();
          }
        }
        catch(e) {};
    },
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
    OnItemEvent: function(item, event) {
        if(event == "FolderLoaded") {  // DeleteOrMoveMsgCompleted
	        try {
              if(QuickFolders) 
                QuickFolders.Interface.onFolderSelected();
            }
            catch(e) {};
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
