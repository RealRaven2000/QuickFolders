/* folder color labes support - experimental */

QuickFolders.Tree = {
	initLabelColors : function () {
		// extend getCellProperties()
		gFolderTreeView.quickFolders_GetCellProperties = gFolderTreeView.getCellProperties;
		gFolderTreeView.getCellProperties = 
				function(row, col, props) {
					gFolderTreeView.quickFolders_GetCellProperties(row, col, props);
					var aAtomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
					if (col.id == "folderNameCol") {
						var folder = gFolderTreeView.getFolderForIndex(row);
						var paletteClass;
						if ( paletteClass = folder.getStringProperty("quickFoldersPalette") ) {
							// save folder color
							props.AppendElement(aAtomService.getAtom(paletteClass));
						}
					}
				};
	} ,
	
	setLabelColor: function(uri, paletteClass) {
		// apply for selected folder
		folder = QuickFolders.Model.getMsgFolderFromUri(uri, true).QueryInterface(QuickFolders_CI.nsIMsgFolder)
		folder.setStringProperty("quickFoldersPalette", paletteClass)
		
		// force redraw the folder pane
		var box = document.getElementById("folderTree").boxObject;
		box.QueryInterface(Components.interfaces.nsITreeBoxObject);
		box.invalidate();
	}
}
