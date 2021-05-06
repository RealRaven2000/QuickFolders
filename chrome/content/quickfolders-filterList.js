"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */


QuickFolders.FilterList = {
	eventsAreHooked: false,
	
	// FILTER LIST DIALOG FUNCTIONS
	getFilterListElement: function()	{
		let el = document.getElementById("filterList");
		if (!el)
			el = document.getElementById("filterTree");
		return el;
	} ,
	
	getSelectedFilterAt: function(list, i) {
		if (typeof list.selectedItems !== "undefined")
			return list.selectedItems[i]._filter;

		// SeaMonkey uses a tree view: - we ignore i as we know that there is only 1 item selected, hence i would be selection index 0
		let start = new Object(),
		    end = new Object();

  	list.view.selection.getRangeAt(0,start,end);
  		
		// return list.view.getFilterAt(start.value);
		return getFilter(start.value); // defined in FilterListDialog.js (SM only)
	} ,
	
	getSelectedCount: function(list) {
		if (typeof list.selectedItems !== "undefined")
			return list.selectedItems.length;
		return list.view.selection.count;
	} ,
	
	onTop : function (evt) {
		let filtersList = this.getFilterList(), // Tb / SM
		    list = this.getFilterListElement();
		try {
			if (this.getSelectedCount(list) != 1) {
				QuickFolders.Util.alert("Exactly one filter entry must be highlighted!");
				return;
			}
			let activeFilter = this.getSelectedFilterAt(list, 0); 
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
	
	onBottom : function (evt) {
		let filtersList = this.getFilterList(),
		    list =this.getFilterListElement();
		try {
			if (this.getSelectedCount(list) != 1) {
				QuickFolders.Util.alert("Exactly one filter entry must be highlighted!");
				return;
			}
			let activeFilter = this.getSelectedFilterAt(list, 0); 
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
		let searchBox = document.getElementById("qf-Filter");
		if (searchBox.value) {
			let filtersList = this.getFilterList(), // Tb / SM
			    list = this.getFilterListElement();
			if (this.getSelectedCount(list) != 1)
				return;

			let activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) try {
				let nextIndex = list.selectedIndex-1,
				    nextFilter = list.getItemAtIndex(nextIndex)._filter;
				this.rebuildFilterList();  

				// assumption: item stays selected even after removing the search condition
				let newIndex = list.selectedIndex-1; 
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
		let searchBox = document.getElementById("qf-Filter");
		if (searchBox.value) {
			let filtersList = this.getFilterList(), // Tb / SM
			    list = this.getFilterListElement();
			if (this.getSelectedCount(list) != 1)
				return;

			let activeFilter = this.getSelectedFilterAt(list, 0); 
			if (activeFilter) try {
				let nextIndex = list.selectedIndex+1,
				    nextFilter = list.getItemAtIndex(nextIndex)._filter;
				this.rebuildFilterList();  

				// assumption: item stays selected even after removing the search condition
				let newIndex = list.selectedIndex+1; 
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
    try {
      if (typeof list.getRowCount !== "undefined")
        return list.getRowCount();
    } catch (ex) {;}
		return list.view.rowCount; // SM: treeview
	} ,
	
	onSelectFilter : function (evt) {
		let list = this.getFilterListElement(),
		    numFiltersSelected = this.getSelectedCount(list),
		    oneFilterSelected = (numFiltersSelected == 1),
		    buttonTop = document.getElementById("qf-reorderButtonTop"),
		    buttonBottom = document.getElementById("qf-reorderButtonBottom"),
		    upDisabled = !(oneFilterSelected && 
		                   this.getSelectedFilterAt(list, 0) != list.children[1]);
		if (list.currentIndex == 0) // SM
			upDisabled = true;
		buttonTop.disabled = upDisabled;
		let downDisabled = (!oneFilterSelected 
				|| list.currentIndex == this.getListElementCount(list)-1);
		buttonBottom.disabled = downDisabled;
	} ,
	
	onLoadFilterList: function(evt) {
		function removeElement(el) {
			el.collapsed = true;
			// document.removeChild(el);
		}
    const util = QuickFolders.Util;
    // if (util.Debug) debugger;
		// check whether [Bug 450302] has landed
		let nativeSearchBox = document.getElementById("searchBox"),
		    //move buttons to the correct place
		    buttonTop = document.getElementById("qf-reorderButtonTop"),
		    up = document.getElementById("reorderUpButton"),
		    buttonBottom = document.getElementById("qf-reorderButtonBottom"),
		    down = document.getElementById("reorderDownButton"),
		    searchBox = document.getElementById("qf-Filter"),
		    countBox = document.getElementById("qf-FilterCount"),
        filterHeader;
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
		let filterList = this.getFilterListElement();
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
							if (util)
								util.logException('onNewFilter - ',e);
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
							if (util)
								util.logException('onDeleteFilter - ',e);
						}
					}
				}
				QuickFolders.FilterList.eventsAreHooked = true; // avoid multiple hooking.
			}
		}
		
    // move the search filter box
    let dropDown = document.getElementById("serverMenu");

    dropDown.parentNode.insertBefore(searchBox, dropDown.nextSibling);
    dropDown.addEventListener("command", function(e) { window.setTimeout(function() {QuickFolders.FilterList.onFindFilter(true, false);}, 50); }, false);
    
    // create a container that holds list label and count...
    let rowAbove = filterList.parentNode.parentNode.previousSibling,
        hbox = document.createXULElement ? document.createXULElement('hbox') : document.createElement('hbox');
    filterHeader = rowAbove.firstChild;
    filterHeader.id='filterHeader';
    rowAbove.appendChild(hbox);
    hbox.appendChild(filterHeader);
    hbox.appendChild(document.createXULElement ? document.createXULElement('spacer') : document.createElement('spacer'));
    countBox.flex="1"; // make sure this is never obscured by the label
    hbox.appendChild(countBox);
     
    this.updateCountBox();
    // we need to overwrite the existing functions in order to support the "filtered" state
    let reorderUpButton = document.getElementById("reorderUpButton"),
        reorderDownButton = document.getElementById("reorderDownButton"),
        runFiltersButton =  document.getElementById("runFiltersButton");
    QuickFolders.Interface.setEventAttribute(reorderUpButton, "oncommand", "QuickFolders.FilterList.onUp(event);");
    QuickFolders.Interface.setEventAttribute(reorderDownButton, "oncommand", "QuickFolders.FilterList.onDown(event);");
    
    // find the log button (first button in hbox) and move it down
    let filterLogButton = dropDown.parentNode.getElementsByTagName("button")[0];
    // insert Filter log button at the bottom
    runFiltersButton.parentNode.insertBefore(filterLogButton, runFiltersButton)
    // move run filters button to left 
    let runFiltersFolderMenu =  document.getElementById("runFiltersFolder");
    runFiltersFolderMenu.parentNode.appendChild(runFiltersButton);
	} ,
	
	// helper function for SeaMonkey/Postbox (which doesn't have a gCurrentFilterList)
	getFilterList: function() {
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
	updateCountBox: function(event) {
		let countBox = document.getElementById("qf-FilterCount"),
		    sum = this.getFilterList().filterCount,
		    filterList = this.getFilterListElement(),
		    len = this.getListElementCount(filterList); 
		
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
	
	rebuildFilterList: function() {
		const util = QuickFolders.Util;
    rebuildFilterList(gCurrentFilterList);
		this.updateCountBox();
	} ,
	
	onFindFilter: function(whenNotEmpty, focusSearchBox) {
		let searchBox = document.getElementById("qf-Filter"),
		    filterList = this.getFilterListElement(),
		    keyWord = searchBox.value.toLocaleLowerCase();
		this.updateCountBox();
		if (!keyWord && whenNotEmpty) 
			return;
		this.rebuildFilterList();
		if (!keyWord) {
			searchBox.focus();
			return;
		}

		let rows = this.getListElementCount(filterList); 
		
		for (let i = rows - 1; i>=0; i--){
			let matched = true, item, title;
			 // SeaMonkey (Postbox) vs Thunderbird - treeview vs listbox
			if (filterList.nodeName == 'tree') 
			{
				// SeaMonkey + Postbox
				item = getFilter(i); // SM: defined in FilterListDialog.js (SM only)
				title = item.filterName;
				if (title.toLocaleLowerCase().indexOf(keyWord) == -1){
					matched = false;
					this.gFilterTreeView().performActionOnRow("delete", i);
					filterList.boxObject.invalidateRow(i);
					filterList.boxObject.rowCountChanged(i + 1, -1);
				}
			}
			else {
				// Thunderbird
				item = filterList.getItemAtIndex(i);
				title = item.firstChild.getAttribute("label");
				if (title.toLocaleLowerCase().indexOf(keyWord) == -1) {
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

	} 
	
	
};

