/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

var gQuickFoldersBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var QuickFolders_bundle = gQuickFoldersBundle.createBundle("chrome://quickfolders/locale/quickfolders.properties");

QuickFolders.ChangeOrder = {
	window: null,
	upString: "",
	downString: "",

	getUIstring: function(id, defaultString) {
		var s;
		try{s=QuickFolders_bundle.GetStringFromName(id);}
		catch(e) { s=defaultString; }
		return s;
	},

	init: function(window) {
		this.window = window;
		this.showFolders();
		window.sizeToContent();
		window.resizeTo(window.outerWidth, window.parent.innerHeight * 0.8);
	} ,

	$: function(id) {
		return this.window.document.getElementById(id);
	} ,

	showFolders: function() {
		var rows = this.$('QuickFolders-change-order-grid-rows');
		QuickFolders.Util.clearChildren(rows);

		for(var i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
			var folderEntry = QuickFolders.Model.selectedFolders[i];
			var folder = GetMsgFolderFromUri(folderEntry.uri, true);

			if(folder != undefined) {
				this.addFolderButton(folder, folderEntry.name)
			}
		}
	} ,

	addFolderButton: function(folder, useName) {
		var label = (useName && useName.length > 0) ? useName : folder.name;

		if (this.upString=="")
			this.upString = this.getUIstring("qfUp","Up");
		if (this.downString=="")
			this.downString = this.getUIstring("qfDown","Down");

		var rows = this.$('QuickFolders-change-order-grid-rows');
		var row = document.createElement("row");

		var folderLabel = document.createElement("label");
		folderLabel.appendChild(document.createTextNode(label));
		row.appendChild(folderLabel);

		var buttonUp = document.createElement("button");
		buttonUp.className = "order-button-up"

		buttonUp.setAttribute("label",this.upString);
		buttonUp.linkedFolder = folder;
		buttonUp.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");
		row.appendChild(buttonUp);

		var buttonDown = document.createElement("button");
		buttonDown.className = "order-button-down"
		buttonDown.setAttribute("label",this.downString);
		buttonDown.linkedFolder = folder;
		buttonDown.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
		row.appendChild(buttonDown);

		rows.appendChild(row);
	} ,

	onButtonClick: function(button, direction, folderURI) {
		var modelSelection = QuickFolders.Model.selectedFolders;

		for(var i = 0; i < modelSelection.length; i++) {
			var folderEntry = modelSelection[i];

			if(folderEntry.uri == folderURI) {

				if(i > 0 && direction == 'up') {
					var tmp = modelSelection[i - 1];
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

		switch(toolbarPos) {
			case "LeftMost":
				iTarget = 0;
				break;
			case "RightMost":
				iTarget = modelSelection.length-1;
				break;
		}

		for(var i = 0; i < modelSelection.length; i++) {
			folderEntry = QuickFolders.Model.selectedFolders[i];
			folder = GetMsgFolderFromUri(folderEntry.uri, true);

			if (toolbarPos=="")
				if (folderEntry.uri==targetURI) {
					iTarget = i;
					if (iSource!=null) break;
				}

			if (folderEntry.uri==buttonURI) {
				iSource = i;
				if (iTarget!=null) break;
			}
		}

		//button not found: might have been a menu item to add a new button!
		if (iSource==null && targetURI=="")
			return false;


		if (iSource!=iTarget)
		{
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
		return true;
   }
}