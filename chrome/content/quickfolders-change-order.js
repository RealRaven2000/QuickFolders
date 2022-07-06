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

	getUIstring: function(id, substitions) {
		return QuickFolders.Util.getBundleString(id, substitions);
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
    QuickFolders.Util.notifyTools.notifyBackground({ func: "updateMainWindow", minimal: false }); 
  } ,

	showFolders: function() {
		let grid = this.$("QuickFolders-change-order");
		QuickFolders.Util.clearChildren(grid);

		for (let i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
			let folderEntry = QuickFolders.Model.selectedFolders[i],
			    folder = QuickFolders.Model.getMsgFolderFromUri(folderEntry.uri, false);

			if (folder != undefined) {
				// this.addFolderButton(folder, folderEntry.name); // legacy
        this.addFolderRow(folder, folderEntry.name);
			}
		}
	} ,
  
  addFolderRow: function(folder, useName) {
    let label = (useName && useName.length) ? useName : folder.name;
    let grid = this.$("QuickFolders-change-order");
    let folderLabel = document.createXULElement("label");
		folderLabel.appendChild(document.createTextNode(label));
    folderLabel.className="col Label";
    
		let buttonUp = document.createXULElement("button");
		buttonUp.className = "order-button-up col Btn";
		buttonUp.setAttribute("label", this.upString);
    buttonUp.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonUp, "oncommand","ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");


		let buttonDown = document.createXULElement("button");
		buttonDown.className = "order-button-down col Btn";
		buttonDown.setAttribute("label", this.downString);
    
		buttonDown.linkedFolder = folder;
		QuickFolders.Interface.setEventAttribute(buttonDown, "oncommand","ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
     
    grid.appendChild(folderLabel);
    grid.appendChild(buttonUp);
    grid.appendChild(buttonDown);
    
  },

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

