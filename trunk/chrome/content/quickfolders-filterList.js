"use strict";

/* BEGIN LICENSE BLOCK

for detail, please refer to license.txt in the root folder of this extension

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or (at your option) any later version.

If you use large portions of the code please attribute to the authors
(Axel Grude)

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You can download a copy of the GNU General Public License at
http://www.gnu.org/licenses/gpl-3.0.txt or get a free printed
copy by writing to:
  Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor,
  Boston, MA 02110-1301, USA.
  
END LICENSE BLOCK 
*/


QuickFolders.FilterList = {

	eventsAreHooked: false,
	
	// FILTER LIST DIALOG FUNCTIONS
	getFilterListElement: function()
	{
		var el = document.getElementById("filterList");
		if (!el)
			el = document.getElementById("filterTree");
		return el;
	} ,
	
	getSelectedFilterAt: function(list, i)
	{
		if (typeof list.selectedItems !== "undefined")
			return list.selectedItems[i]._filter;

		// SeaMonkey uses a tree view: - we ignore i as we know that there is only 1 item selected, hence i would be selection index 0
		var start = new Object();
		var end = new Object();

  		list.view.selection.getRangeAt(0,start,end);
  		
		// return list.view.getFilterAt(start.value);
		return getFilter(start.value); // defined in FilterListDialog.js (SM only)


	} ,
	
	getSelectedCount: function(list)
	{
		if (typeof list.selectedItems !== "undefined")
			return list.selectedItems.length;
		return list.view.selection.count;
	} ,
	
	onTop : function (evt) 
	{
		var filtersList = this.getFilterList(); // Tb / SM
		var list = this.getFilterListElement();
		try {
			if (this.getSelectedCount(list) != 1) {
				alert("Exactly one filter entry must be highlighted!");
				return;
			}
			var activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) {
				filtersList.removeFilter(activeFilter);
				filtersList.insertFilterAt(0, activeFilter);
				this.rebuildFilterList();  // not on SM?
				// SM
				if (list.view) {
					list.view.selection.clearSelection();  // Pb: gFilterTree
					list.view.selection.select(0); 
					list.focus();
				}
				else
					this.onFindFilter(true, false);

				document.getElementById("qf-reorderButtonTop").disabled=true;
			}
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception while moving filter to top: ', ex); 
		}
	} ,
	
	onBottom : function (evt) 
	{
		var filtersList = this.getFilterList();
		var list =this.getFilterListElement();
		try {
			if (this.getSelectedCount(list) != 1) {
				alert("Exactly one filter entry must be highlighted!");
				return;
			}
			var activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) {
				filtersList.removeFilter(activeFilter);
				filtersList.insertFilterAt(filtersList.filterCount, activeFilter); // rolled back :P
				this.rebuildFilterList();
				// SM
				if (list.view) {
					list.view.selection.clearSelection();  // Pb: gFilterTree
					list.view.selection.select(filtersList.filterCount-1); 
					list.focus();
				}
				else
					this.onFindFilter(true, false);

				document.getElementById("qf-reorderButtonBottom").disabled=true;
			}
		}
		catch(ex) {
			QuickFolders.Util.logException('Exception while moving filter to bottom: ', ex); 
		}
	} ,
	
	onUp: function(event) {
		var searchBox = document.getElementById("qf-Filter");
		if (searchBox.value) {
			var filtersList = this.getFilterList(); // Tb / SM
			var list = this.getFilterListElement();
			if (this.getSelectedCount(list) != 1)
				return;

			var activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) try {
				var nextIndex = list.selectedIndex-1;
				var nextFilter = list.getItemAtIndex(nextIndex)._filter;
				this.rebuildFilterList();  

				// assumption: item stays selected even after removing the search condition
				var newIndex = list.selectedIndex-1; 
				filtersList.removeFilter(activeFilter);

				// insert before next visible item
				// go up from selected index until finding the correct filter name
				while (nextFilter.filterName!=list.getItemAtIndex(newIndex)._filter.filterName && nextIndex<list.itemCount)
					newIndex--;
				filtersList.insertFilterAt(newIndex, activeFilter);
				this.rebuildFilterList();  
				list.selectedIndex = newIndex;

			}
			catch (ex) {
				QuickFolders.Util.logException('QuickFolders.FilterList.onDown: ', ex); 
			}
			this.onFindFilter(true, false);
		}
		else
			moveCurrentFilter(Components.interfaces.nsMsgFilterMotion.up);
	} ,
	
	onDown: function(event) {
		var searchBox = document.getElementById("qf-Filter");
		if (searchBox.value) {
			var filtersList = this.getFilterList(); // Tb / SM
			var list = this.getFilterListElement();
			if (this.getSelectedCount(list) != 1)
				return;

			var activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) try {
				var nextIndex = list.selectedIndex+1;
				var nextFilter = list.getItemAtIndex(nextIndex)._filter;
				this.rebuildFilterList();  

				// assumption: item stays selected even after removing the search condition
				var newIndex = list.selectedIndex+1; 
				filtersList.removeFilter(activeFilter);


				// insert after next visible item
				// go down from selected index until finding the correct filter name
				while (nextFilter.filterName!=list.getItemAtIndex(newIndex)._filter.filterName && nextIndex<list.itemCount)
					newIndex++;
				filtersList.insertFilterAt(newIndex, activeFilter);
				this.rebuildFilterList();  
				list.selectedIndex = newIndex;

			}
			catch (ex) {
				QuickFolders.Util.logException('QuickFolders.FilterList.onDown: ', ex); 
			}
			this.onFindFilter(true, false);
		}
		else
			moveCurrentFilter(Components.interfaces.nsMsgFilterMotion.down);
	} ,
	
	getListElementCount: function (list) {
		if (typeof list.getRowCount !== "undefined")
			return list.getRowCount();
		return list.view.rowCount; // SM: treeview
	} ,
	
	onSelectFilter : function (evt) {
		var list = this.getFilterListElement();
		var numFiltersSelected = this.getSelectedCount(list);
		var oneFilterSelected = (numFiltersSelected == 1);
		var buttonTop = document.getElementById("qf-reorderButtonTop");
		var buttonBottom = document.getElementById("qf-reorderButtonBottom");
		var upDisabled = !(oneFilterSelected && 
		                   this.getSelectedFilterAt(list, 0) != list.childNodes[1]);
		if (list.currentIndex == 0) // SM
			upDisabled = true;
		buttonTop.disabled = upDisabled;
		var downDisabled = (!oneFilterSelected 
				|| list.currentIndex == this.getListElementCount(list)-1);
		buttonBottom.disabled = downDisabled;
	} ,
	
	onLoadFilterList: function(evt) 
	{
		function removeElement(el) {
			el.collapsed = true;
			// document.removeChild(el);
		}
		// check whether [Bug 450302] has landed
		let nativeSearchBox = document.getElementById("searchBox");
		//move buttons to the correct place
		var buttonTop = document.getElementById("qf-reorderButtonTop");
		var up = document.getElementById("reorderUpButton");
		var buttonBottom = document.getElementById("qf-reorderButtonBottom");
		var down = document.getElementById("reorderDownButton");
		var searchBox = document.getElementById("qf-Filter");
		var countBox = document.getElementById("qf-FilterCount");
		if (nativeSearchBox) {
			// once [Bug 450302] has landed, we do not need to add this functionality ourselves :)
			removeElement(buttonTop);
			removeElement(buttonBottom);
			removeElement(searchBox);
			removeElement(countBox);
			return;
	  	}
	  	// overwrite handlers for moving filters while search is active
		if (up){
			up.parentNode.insertBefore(buttonTop, up);
		}
		if (down){
			down.parentNode.insertBefore(buttonBottom, down.nextSibling);
		}
		// add additional listener for the filter list to select event 
		var filterList = this.getFilterListElement();
		if (filterList) {
			filterList.addEventListener("select", 
				function(e) { QuickFolders.FilterList.onSelectFilter(e);}, 
				false); 
			// make sure to disable the correct buttons on dialog load
			window.setTimeout(function() {QuickFolders.FilterList.onSelectFilter(null);}, 250);
			
			// Update filter counts after new and delete:
			// removed DOM NodeInserted events and chose some monkey patching instead.
			if (!QuickFolders.FilterList.eventsAreHooked) {
				let theOnNew = onNewFilter;
				if (theOnNew) {
					onNewFilter = function() {
						theOnNew(arguments);
						try {
							QuickFolders.FilterList.updateCountBox();
						}
						catch(e) {
							if (QuickFolders && QuickFolders.Util)
								QuickFolders.Util.logException('onNewFilter - ',e);
						}
					}
				}
				let theOnDelete = onDeleteFilter;
				if (theOnDelete) {
					onDeleteFilter = function() {
						theOnDelete(arguments);
						try {
							QuickFolders.FilterList.updateCountBox();
						}
						catch(e) {
							if (QuickFolders && QuickFolders.Util)
								QuickFolders.Util.logException('onDeleteFilter - ',e);
						}
					}
				}
				QuickFolders.FilterList.eventsAreHooked = true; // avoid multiple hooking.
			}

		}
		
		if (QuickFolders.Util.Application == 'Thunderbird') {
			// move the search filter box
			var dropDown = document.getElementById("serverMenu");

			dropDown.parentNode.insertBefore(searchBox, dropDown.nextSibling);
			dropDown.addEventListener("command", function(e) { window.setTimeout(function() {QuickFolders.FilterList.onFindFilter(true, false);}, 50); }, false);
			
			// create a container that holds list label and count...
			var rowAbove = filterList.parentNode.parentNode.previousSibling;
			var filterHeader = rowAbove.firstChild;
			filterHeader.id='filterHeader';
			var hbox = document.createElement('hbox');
			rowAbove.appendChild(hbox);
			hbox.appendChild(filterHeader);
			hbox.appendChild(document.createElement('spacer'));
			countBox.flex="1"; // make sure this is never obscured by the label
			hbox.appendChild(countBox);
			 
			this.updateCountBox();
			// we need to overwrite the existing functions in order to support the "filtered" state
			var reorderUpButton = document.getElementById("reorderUpButton");
			QuickFolders.Interface.setEventAttribute(reorderUpButton, "oncommand", "QuickFolders.FilterList.onUp(event);");
			var reorderDownButton = document.getElementById("reorderDownButton");
			QuickFolders.Interface.setEventAttribute(reorderDownButton, "oncommand", "QuickFolders.FilterList.onDown(event);");
			
			var runFiltersButton =  document.getElementById("runFiltersButton");
			// find the log button (first button in hbox) and move it down
			var filterLogButton = dropDown.parentNode.getElementsByTagName("button")[0];
			// insert Filter log button at the bottom
			runFiltersButton.parentNode.insertBefore(filterLogButton, runFiltersButton)
			// move run filters button to left 
			var runFiltersFolderMenu =  document.getElementById("runFiltersFolder");
			runFiltersFolderMenu.parentNode.appendChild(runFiltersButton);
		}
		else {
			// for the moment we do not support this on SM / POstbox as I have problems with removing stuff from the treeview!
			// in future we need to build our own tree
			// build a treeview that supports hidden elements and overwrite gFilterTreeView 
			// #maildev@Neil: could create a virtual list, the SeaMonkey view is only interested in the filterCount property and the getFilterAt method
			searchBox.collapsed = true;
			
			filterHeader = document.getElementById("filterHeader");
			let row=filterHeader.parentNode;
			hbox = document.createElement('hbox');
			row.appendChild(hbox);
			
			hbox.appendChild(countBox);
			hbox.appendChild(document.createElement('spacer'));
			countBox.flex="1"; // make sure this is never obscured by the label
			hbox.appendChild(countBox);
			
			this.updateCountBox();
			
		}
		
	} ,
	
	// helper function for SeaMonkey/Postbox (which doesn't have a gCurrentFilterList)
	getFilterList: function()
	{
		try {
			if (typeof gCurrentFilterList !== "undefined")
				return gCurrentFilterList;
			if (currentFilterList)
				return currentFilterList();
		}
		catch(ex) {
			QuickFolders.Util.logException('QuickFolders.FilterList.getFilterList: ', ex); 
		}
		return null;
	} ,
	
	// SeaMonkey / Postbox helper
	gFilterTreeView: function() {
		if (typeof gFilterTreeView !== "undefined")
			return gFilterTreeView; // SM
		//Postbox
		return gFilterTree.view;
		
	} ,
	
	// event is optional, used only when DOM NodeInserted or DOM NodeRemoved are fired
	updateCountBox: function(event)
	{
		var countBox = document.getElementById("qf-FilterCount");
		var sum = this.getFilterList().filterCount;
		var filterList = this.getFilterListElement();
		var len = this.getListElementCount(filterList); 
		
		if (len == sum) 
			countBox.value = 
				(len == 1)
				? document.getElementById ('qf-FilterCount-1-item').value
				: len.toString() + " " + document.getElementById ('qf-FilterCount-items').value;
		else 
			countBox.value = document.getElementById ('qf-FilterCount-n-of-m').value
				.replace('{0}', len.toString())
				.replace('{1}', sum.toString());
		
	} ,
	
	rebuildFilterList: function()
	{
		if (typeof gCurrentFilterList !== "undefined") {
			rebuildFilterList(gCurrentFilterList);
		}
		else {
			if (QuickFolders.Util.Application=='Postbox') {
				refresh();
				this.updateCountBox();
				return;
			}
			
			// force a repaint through the BoxObject
			var fl = this.getFilterListElement();
			
			// from: SM's setServer(uri) function
			var resource = gRDF.GetResource(gCurrentServerURI);
			var msgFolder = resource.QueryInterface(Components.interfaces.nsIMsgFolder);
			
			//Calling getFilterList will detect any errors in rules.dat, backup the file, and alert the user
			switch(QuickFolders.Util.Application) {
				case 'Postbox': 
					this.gFilterTreeView().filterList = msgFolder.getFilterList(gFilterListMsgWindow);
					break;
				default:
					this.gFilterTreeView().filterList = msgFolder.getEditableFilterList(gFilterListMsgWindow);
					break;
			}
			fl.boxObject.invalidate();
		}
		this.updateCountBox();
	} ,
	
	onFindFilter: function(whenNotEmpty, focusSearchBox) 
	{
		var searchBox = document.getElementById("qf-Filter");
		var filterList = this.getFilterListElement();
		var keyWord = searchBox.value.toLocaleLowerCase();
		this.updateCountBox();
		if (!keyWord && whenNotEmpty) 
			return;
		this.rebuildFilterList();
		if (!keyWord) {
			searchBox.focus();
			return;
		}

		var rows = this.getListElementCount(filterList); 
		
		for(var i = rows - 1; i>=0; i--){
			var matched = true;
			 // SeaMonkey (Postbox) vs Thunderbird - treeview vs listbox
			if (filterList.nodeName == 'tree') 
			{
				// SeaMonkey
				item = getFilter(i); // SM: defined in FilterListDialog.js (SM only)
				title = item.filterName;
				if(title.toLocaleLowerCase().indexOf(keyWord) == -1){
					matched = false;
					this.gFilterTreeView().performActionOnRow("delete", i);
					filterList.boxObject.invalidateRow(i);
					filterList.boxObject.rowCountChanged(i + 1, -1);
				}
			}
			else {
				// Thunderbird
				var item = filterList.getItemAtIndex(i);
				var title = item.firstChild.getAttribute("label");
				if(title.toLocaleLowerCase().indexOf(keyWord) == -1)
				{
					matched = false;
					filterList.removeChild(item);
				}
				
			}
			if (matched)
				QuickFolders.Util.logDebugOptional("filters", "matched filter: " + title);
		}
		this.updateCountBox();
		if (focusSearchBox)
			searchBox.focus();

	} ,
	
	validateFilterTargets: function(sourceURI, targetURI) {
		// fix any filters that might still point to the moved folder.
		
		// 1. nsIMsgAccountManager  loop through list of servers
		try {
			let Ci = Components.interfaces;
			let acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]  
	                        .getService(Ci.nsIMsgAccountManager);  
			for (let account in fixIterator(acctMgr.accounts, Ci.nsIMsgAccount)) {
				if (account.incomingServer && account.incomingServer.canHaveFilters ) 
				{ 
					let srv = account.incomingServer.QueryInterface(Ci.nsIMsgIncomingServer);
					QuickFolders.Util.logDebugOptional("filters", "checking account for filter changes: " +  srv.prettyName);
					// 2. getFilterList
					let filterList = srv.getFilterList(msgWindow).QueryInterface(Ci.nsIMsgFilterList);
					// 3. use  nsIMsgFilterList.matchOrChangeFilterTarget(oldUri, newUri, false) 
					if (filterList) {
						filterList.matchOrChangeFilterTarget(sourceURI, targetURI, false) 
					}
				}
			}    
		}
		catch(ex) {
			QuickFolders.Util.logException("Exception in QuickFolders.FilterList.validateFilterTargets ", ex);
		}

	}
	
	
};

