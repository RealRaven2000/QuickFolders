"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

var QuickFolders_StringBundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var QuickFolders_bundle = QuickFolders_StringBundleSvc.createBundle("chrome://quickfolders/locale/quickfolders.properties");

QuickFolders.ChangeOrder = {
	window: null,
	upString: "",
	downString: "",

	getUIstring: function(id, defaultString) {
		let s;
		try{s=QuickFolders_bundle.GetStringFromName(id);}
		catch(e) { 
			QuickFolders.Util.logException('Exception during getUIstring(' + id + ') ', e);
			s = defaultString; 
		}
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
		let rows = this.$('QuickFolders-change-order-grid-rows');
		QuickFolders.Util.clearChildren(rows);

		for(let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
			let folderEntry = QuickFolders.Model.selectedFolders[i],
			    folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);

			if (folder != undefined) {
				this.addFolderButton(folder, folderEntry.name)
			}
		}
	} ,

	addFolderButton: function(folder, useName) {
		let label = (useName && useName.length) ? useName : folder.name;

		if (this.upString=="")
			this.upString = this.getUIstring("qfUp","Up");
		if (this.downString=="")
			this.downString = this.getUIstring("qfDown","Down");

		let rows = this.$('QuickFolders-change-order-grid-rows'),
		    row = document.createElement("row"),
		    folderLabel = document.createElement("label");
		folderLabel.appendChild(document.createTextNode(label));
		row.appendChild(folderLabel);

		let buttonUp = document.createElement("button");
		buttonUp.className = "order-button-up"

		buttonUp.setAttribute("label",this.upString);
		buttonUp.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonUp, "oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");
		row.appendChild(buttonUp);

		let buttonDown = document.createElement("button");
		buttonDown.className = "order-button-down"
		buttonDown.setAttribute("label",this.downString);
		buttonDown.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonDown, "oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
		row.appendChild(buttonDown);
		rows.appendChild(row);
	} ,

	onButtonClick: function(button, direction, folderURI) {
		let modelSelection = QuickFolders.Model.selectedFolders,
        tmp;

		for(let i = 0; i < modelSelection.length; i++) {
			let folderEntry = modelSelection[i];
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
		let folderEntry, folder, iSource, iTarget,
		    modelSelection = QuickFolders.Model.selectedFolders;

		switch(toolbarPos) {
			case "LeftMost":
				iTarget = 0;
				break;
			case "RightMost":
				iTarget = modelSelection.length-1;
				break;
		}

		for (let i = 0; i < modelSelection.length; i++) {
			folderEntry = QuickFolders.Model.selectedFolders[i];
			folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);

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
			let tmp;
			if (iSource<iTarget) { // drag right
				for (let i=iSource; i<iTarget; i++) {
					tmp = modelSelection[i];
					modelSelection[i] = modelSelection[i+1];
					modelSelection[i+1] = tmp;
				}
			}
			else {  // drag left
				for (let i=iSource; i>iTarget; i--) {
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