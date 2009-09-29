
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

   15/02/2009
     AG+Alex added error handlers for isCorrectWindow and initDelayed functions

   17/02/2009
     AG added number of unread messages to popup menu (jump to menu, not drag menu)

   18/02/2009
     AG do not force switching to All Folders view if not necessary
        added debug mode switch to options
        tidied options layout

   26/02/2009
     AG added configurable init Delay and better error logging

   04/03/2009
     AG added more focused stylesheet logging
        added an option for changing color of inactive tabs

   05/03/2009
     AG do not display folders of category "ALWAYS" when "Uncategorized" is selected.
        for consistency, categories drop down now shows the translated string for "uncategorized"

   08/03/2009  0.9.9.7
     AG  made compatible with TB 3.0 beta 2
   20/03/2009  0.9.10
     AG renamed global instances of Compontents.classes & interfaces to QF_CC, QF_CI to allow for release from sandbox

   30/03/2009
     AG added option to use CTRL instead of ALT for keyboard shortcuts
        suppress event bubbling (for better Lightning compatibility)
        added button for copying folder string to clipboard

   17/04/2009  0.9.12
     AM Fixed some problems with keyboard handler
     AM added italian locale (provided by Leopoldo Saggin)

   19/04/2008
     AG removed constant debug output of keyboard handler (now only visible in debug mode and when relevant)
        increased width of options window to avoid truncation of italian quickhelp texts
        added language resources for debug items
        added icon for folder to clipboard

   11/05/2009
     AG added multiple line support
        added option for focusing message pane after changing category & selecting a tab (to be improved)

   12/05/2009
     AM added Delete and Rename Category features.

   13/05/2009 Release 1.0.1
     AG fixed focus problem after changing of categories
        fixed remembered categories not being selected on startup

   15/05/2009  Release 1.0.2 (permanently sandboxed)
     AG fixed problem on startup when short delay - GetMsgFolderFromUri did not work!!
        Rejected by AMO - not able to add new Category

   26/05/2009 Release 1.0.3
     AG Fixed previous problem by AMO
        added l10n for copy folders to clipboard message
        added colored panels to category screen

   02/06/2009
     AG added individual Tab Color feature (experimental, does not save yet!)
        added feedback link (mail to me) to options dialog
        made options dialog resizable

   24/06/2009
     AG fixed renaming bug for numbered folders
        automatically switch to folder when trying to add it and it already exists.
        Store Tab Colors!

   02/07/2009 Release 1.1
     AG fixed renaming bug for total/unread folders

   28/07/2009 Release 1.2
     AG added: Categories are sorted alphabetically
               Compatibility for Tb3.0b3
        fixed: Quickfolders label floats to right when switched on via options dialog
               warning "QuickFolders is not defined" in quickfolders.js

   26/08/2009:
     AG fixed: in Tb3 the folder tree view would not scroll
        added: whole tab coloring

   12/09/2009  Release 1.3 (Test Release)
     AG added subfolders in popup menus - configurable
               whole / striped tab option and backgrounds
     fixed slowdown of operations that change the number of Total / Unread emails because QF was updated every time
            this is now donw asynchroneously with a 1000ms timer.

    23/09/2009 Release 1.4
      AG added scrollbars and animation to "change order of bookmarks" dialog
         added subfolder expansion
         added Postbox support
    open items tweaks in whole tab coloring (active, hover consistency)
  known issues  sometimes the colors do not show up on program startup. Any folder modification (e.g. unread/read) or Category selection will make the color appear
                popup menus might close delayed
                change the order of bookmarks has the wrong height (should be 80% of its parent)
                chevrons for moving Tabs don't show up in TB3 (beta bug?)
  --------------1.4  Postbox specific
  known issues color submenu still has no colors
               some minor CSS errors


    23/09/2009 Release 1.5b
      AG bumped compatibility to 3.0.4b
         fixed 2 security issues releated to setTimer



  KNOWN ISSUES
  ============
  05/09/2008
    - if folders are added / removed during session this is not refreshed in subfolder list of popup set!
    - folders can be orphaned in config settings and are not removable via interface


  PLANNED FEATURES
  ================
    - persist categories in separate JSON list for more flexibility (e.g. rename)
    - size of category dropdown should expand with length of list

  WISHLIST
  ========
    - drag to thread finds quickfolder with correct thread and drops message there
    - instantApply support (difficult, as there is no onclose event)
    - multiple categories per folder (like tags)

*/
var gFolderTree;

var QuickFolders = {
	keyListen: EventListener,
	loadListen: false,
	initDone: false,
    initDelayed: function() {
       var sWinLocation;
       if (this.initDone) return;
       var nDelay = QuickFolders.Preferences.getIntPref('extensions.quickfolders.initDelay');
       if (!nDelay>0) nDelay = 750;
       sWinLocation = new String(window.location);

       if(QuickFolders.isCorrectWindow()) {
		    QuickFolders.Util.logDebug ("initDelayed ==== correct window: " + sWinLocation + " - " + window.document.title + "\nwait " + nDelay + " msec until init()...");
            // document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';
            var thefunc='QuickFolders.init()';
            setTimeout(thefunc, nDelay);
	        this.initDone=true;
        }
        else {
	      try {
		    document.getElementById('QuickFolders-Toolbar').style.display = 'none';

		    QuickFolders.Util.logDebug ("DIFFERENT window type(messengerWindow): "
		            + document.getElementById('messengerWindow').getAttribute('windowtype')
		            + "\ndocument.title: " + window.document.title )
          }
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
        QuickFolders.Util.logDebug("quickfolders.init()");
        document.getElementById('QuickFolders-Toolbar').style.display = '-moz-inline-box';

        // only add event listener on startup if necessary as we don't
        // want to consume unnecessary performance during keyboard presses!
        if (QuickFolders.Preferences.isUseKeyboardShortcuts()) {
            if(!QuickFolders.Interface.boundKeyListener) {
                window.addEventListener("keypress", this.keyListen = function(e) {
                    QuickFolders.Interface.windowKeyPress(e,'down');
                }, true);
                window.addEventListener("keyup", function(e) {
                    QuickFolders.Interface.windowKeyPress(e,'up');
                }, true);

                QuickFolders.Interface.boundKeyListener = true;
            }
        }
        var folderEntries = QuickFolders.Preferences.getFolderEntries();

        if(folderEntries.length > 0) {
            QuickFolders.Model.selectedFolders = folderEntries;

            QuickFolders.Interface.updateUserStyles(); // Pulled up from } below for speed

            var lastSelectedCategory = QuickFolders.Preferences.getLastSelectedCategory()
            QuickFolders.Util.logDebug("last selected Category:" + lastSelectedCategory );

            if(QuickFolders.Model.isValidCategory(lastSelectedCategory))
              QuickFolders.Interface.selectCategory(lastSelectedCategory, true)
            else
              QuickFolders.Interface.updateFolders(true);  // selectCategory already called updateFolders!

        }

        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

        observerService.addObserver({
            observe: function() {
                QuickFolders.Interface.updateFolders(true);
                QuickFolders.Interface.updateUserStyles();
            }
        },"quickfolders-options-saved", false);
        QuickFolders.Util.logDebug("quickfolders.init() ends.");
    } ,

    sayHello: function() {
        alert("Hello from QuickFolders")
    } ,

    // handler for dropping folder shortcuts
    toolbarDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-folder");
            flavours.appendFlavour("text/unicode");
            return flavours;
        },

        onDragOver: function (evt,flavour,session){
            session.canDrop = true;
        },

        onDrop: function (evt,dropData,dragSession) {

            switch (dropData.flavour.contentType) {
                case  "text/x-moz-folder":
                    var sourceUri;
                    if (QuickFolders.Util.Appver() > 2) {
                      var msgFolder = evt.dataTransfer.mozGetDataAt("text/x-moz-folder", 0);
                      sourceUri = msgFolder.URI;
                    }
                    else
                      sourceUri = QuickFolders.Util.getFolderUriFromDropData(dropData, dragSession)
                    if(sourceUri)
                      QuickFolders.Model.addFolder(sourceUri, QuickFolders.Interface.getCurrentlySelectedCategoryName());

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

    // recursive popups have to react to drag mails!
    popupDragObserver: {
        getSupportedFlavours : function () {
            var flavours = new FlavourSet();
            flavours.appendFlavour("text/x-moz-message");
            flavours.appendFlavour("text/unicode");  // test
            return flavours;
        },
        dragOverTimer: null,
        onDragEnter: function(evt, dragSession) {
            try {
	            var popupStart = evt.target;
	            if (popupStart.firstChild.nodeName == 'menupopup') {
 	              QuickFolders.Util.logDebug ("showing popup ");
	              popupStart.firstChild.showPopup();
                }
                else
 	              QuickFolders.Util.logDebug ("Dragenter with child node: " + popupStart.firstChild.nodeName);
            }
            catch(e) {
                QuickFolders.Util.logDebug ("onDragEnter: popupStart.firstChild has no nodeName - parents noder name" + popupStart.nodeName);
            }
        },

        // deal with old folder popups
        onDragExit: function(evt, dragSession) {
	        var popupStart = evt.target;
	        if (popupStart.nodeName == 'menupopup')
	          QuickFolders.Util.logDebug ("Popup DragExit on " + popupStart.firstChild.nodeName);
	          //popupStart.firstChild.hidePopup();
        } ,

        onDragOver: function (evt, flavor, session){
	        var popupStart = evt.target;
	        QuickFolders.Util.logDebug ("Popup DragOver " + popupStart.firstChild.nodeName);
            session.canDrop = (flavor.contentType == "text/x-moz-message");
        }


    },

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
                          dragSession.dragAction == Components.interfaces.nsIDragService.DRAGDROP_ACTION_COPY
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

    },

	addLoadEventListener: function() {
		// avoid registering this event listener twice!
		if (!this.loadListen)
			window.addEventListener("load", QuickFolders.initDelayed, true);
		this.loadListen=true;
	}


}

function MyEnsureFolderIndex(tree, msgFolder)
{
    // try to get the index of the folder in the tree
    try {
	    var index ;
        if (QuickFolders.Util.Appver() > 2  || QuickFolders.Util.Application() == 'Postbox' )
	      index = tree.getIndexOfFolder(msgFolder);
        else
          index= tree.builderView.getIndexOfResource(msgFolder);
        QuickFolders.Util.logDebug ("MyEnsureFolderIndex - index of " + msgFolder.name + ": " + index);

	    if (index == -1) {
	  	  var parentIndex = MyEnsureFolderIndex(tree, msgFolder.parent);

	      // if we couldn't find the folder, open the parent
	      if(!tree.builderView.isContainerOpen(parentIndex)) {
	            tree.builderView.toggleOpenState(parentIndex);
	      }

          if (QuickFolders.Util.Appver() > 2 || QuickFolders.Util.Application() == 'Postbox' )
	        index = tree.getIndexOfFolder(msgFolder);
          else
	        index = tree.builderView.getIndexOfResource(msgFolder);
	    }
	    return index;
	}
	catch(e) {
        QuickFolders.Util.logDebug ("MyEnsureFolderIndex - error " + e);
		return -1;
	}

}



function myRDF()
{
  if (QuickFolders.Util.Appver() > 2)
    return Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
  else
    return RDF;
}

// replaces TB2 only helper method GetFolderTree()
function MyGetFolderTree() {
  if (!gFolderTree)
     gFolderTree = document.getElementById("folderTree");
  return gFolderTree;
}

function MyChangeSelection(tree, newIndex)
{
  if(newIndex >= 0)
  {
    tree.view.selection.select(newIndex);
    tree.treeBoxObject.ensureRowIsVisible(newIndex);
  }
}

function MySelectFolder(folderUri)
{
    var folderTree = MyGetFolderTree();
    var folderResource = myRDF().GetResource(folderUri);
    var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
    var folderIndex;

    if (QuickFolders.Util.Appver() <= 2 || QuickFolders.Util.Application()=='Postbox' ) {
    // before we can select a folder, we need to make sure it is "visible"
    // in the tree.  to do that, we need to ensure that all its
    // ancestors are expanded
	    if (QuickFolders.Util.Application()=='Postbox')
		   folderIndex = EnsureFolderIndex(msgFolder);
		else
			folderIndex = MyEnsureFolderIndex(folderTree, msgFolder);
      // AG no need to switch the view if folder exists in the current one (eg favorite folders or unread Folders
      if (folderIndex<0) {
  		QuickFolders.Util.ensureNormalFolderView();
  		folderIndex = MyEnsureFolderIndex(folderTree, msgFolder);
      }
	  MyChangeSelection(folderTree, folderIndex);
	  // select message in top pane for keyboard navigation
	  if (QuickFolders.Preferences.isFocusPreview() && !(GetMessagePane().collapsed)) {
	      GetMessagePane().focus();
	      document.commandDispatcher.advanceFocus();
	      document.commandDispatcher.rewindFocus();
      }
	}
	else { // TB 3
		gFolderTreeView.selectFolder (msgFolder);
		folderTree.treeBoxObject.ensureRowIsVisible(folderTree.currentIndex);
	}

}


// set up the folder listener to point to the above function
var myFolderListener = {
    OnItemAdded: function(parent, item, viewString) {},
    OnItemRemoved: function(parent, item, viewString) {},
    OnItemPropertyChanged: function(parent, item, viewString) {},
    OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {
        try {

          if (property == "TotalUnreadMessages" ||
              (QuickFolders.Preferences.isShowTotalCount() && property == "TotalMessages")) {  // FolderSize
	            if(QuickFolders) {
				    QuickFolders.Util.logDebug("myFolderListener: " + property);
		            QuickFolders.Interface.setFolderUpdateTimer();
		            QuickFolders.Util.logDebug("myFolderListener: called setFolderUpdateTimer()");
                }
          }
        }
        catch(e) {};
    },
    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
    OnItemEvent: function(item, event) {
	    try {
          QuickFolders.Util.logDebug("event: " + event);
	      if(event == "FolderLoaded") {  // DeleteOrMoveMsgCompleted
		    try {
	          if(QuickFolders)
	                QuickFolders.Interface.onFolderSelected();
	          }
	          catch(e) {};
	        }
        }
        catch(e) {};
    },
    OnFolderLoaded: function(aFolder) { },
    OnDeleteOrMoveMessagesCompleted: function( aFolder) {}
}




// now register myself as a listener on every mail folder
var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
mailSession.AddFolderListener(myFolderListener, Components.interfaces.nsIFolderListener.all);

QuickFolders.addLoadEventListener();


var globalHidePopupId="";
window.dump("globalHidePopupId=" + globalHidePopupId + "\n");
