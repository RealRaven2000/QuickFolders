"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

var QuickFolders = window.arguments[0];

var ChangeOrder = {
	window: null,
	upString: "",
	downString: "",

	getUIstring: function(id, defaultString) {
		return QuickFolders.Util.getBundleString(id, defaultString);
	} ,
  
  
	init: function() {
		this.window = window;
    // [mx-l10n]
    QuickFolders.Util.localize(window); 
	} ,
  
  load: function() {
		this.window = window;
		this.showFolders();
    window.sizeToContent();
    window.resizeTo(window.outerWidth, window.parent.innerHeight * 0.8);
  } ,  
  

	$: function(id) {
		return this.window.document.getElementById(id);
	} ,
  
  accept: function() {
    QuickFolders.Model.update(); 
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: "false" }); // QuickFolders.Interface.updateMainWindow(false);
  } ,

	showFolders: function() {
		let rows = this.$('QuickFolders-change-order-grid-rows');
		QuickFolders.Util.clearChildren(rows);

		for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
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
		    row = document.createXULElement("row"),
		    folderLabel = document.createXULElement("label");
		folderLabel.appendChild(document.createTextNode(label));
		row.appendChild(folderLabel);

		let buttonUp = document.createXULElement("button");
		buttonUp.className = "order-button-up";
		buttonUp.setAttribute("label", this.upString);
    
		buttonUp.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonUp, "oncommand","ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");
		row.appendChild(buttonUp);

		let buttonDown = document.createXULElement("button");
		buttonDown.className = "order-button-down";
		buttonDown.setAttribute("label", this.downString);
    
		buttonDown.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonDown, "oncommand","ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
		row.appendChild(buttonDown);
    try {
      rows.appendChild(row);
    }
    catch (ex) {
      ;
    }
	} ,

	onButtonClick: function(button, direction, folderURI) {
		let modelSelection = QuickFolders.Model.selectedFolders,
        tmp;

		for (let i = 0; i < modelSelection.length; i++) {
			let folderEntry = modelSelection[i];
			if(folderEntry.uri == folderURI) {

				if(i > 0 && direction == 'up') {
					tmp = modelSelection[i - 1];
					modelSelection[i - 1] = modelSelection[i];
					modelSelection[i] = tmp;
					ChangeOrder.showFolders();
					return;
				}

				if(i < modelSelection.length - 1 && direction == 'down') {
					tmp = modelSelection[i + 1];
					modelSelection[i + 1] = modelSelection[i];
					modelSelection[i] = tmp;
					ChangeOrder.showFolders();
					return;
				}
			}
		}
	} 
}
    
window.document.addEventListener("DOMContentLoaded", 
  ChangeOrder.init,
  { once: true }
);
window.addEventListener("load", 
  ChangeOrder.load.bind(ChangeOrder), 
  { once: true }
);
window.addEventListener('dialogaccept', function () { ChangeOrder.accept(); });

