"use strict";
/* BEGIN LICENSE BLOCK

	QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
	Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
	For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */

// to see Postbox doing it,
// check mailnews\base\search\resources\content\SearchDialog.js
//   and                                        searchTermOverlay.js
QuickFolders.SearchDialog = {
  addSearchTerm: function addSearchTerm(searchTerm) {
    const Ci = Components.interfaces, 
          Cc = Components.classes,
          utils = QuickFolders.Util,
          typeAttrib = Ci.nsMsgSearchAttrib,
          typeOperator = Ci.nsMsgSearchOp;
    utils.logDebug('addSearchTerm(attrib = ' + searchTerm.attrib + ')');
    // let's try and clone the term using the proper session
    let rowIndex = gSearchTermList.getRowCount();
    // from http://mxr.mozilla.org/comm-central/source/mailnews/base/search/content/searchTermOverlay.js#232
    //      onMore() called when the [+] button is clicked on a row (simulate last row)
    
    createSearchRow(rowIndex, gSearchScope, searchTerm, false);
    gTotalSearchTerms++;
    updateRemoveRowButton();

    // the user just added a term, so scroll to it
    // gSearchTermList.ensureIndexIsVisible(rowIndex);
  } ,
  
  onLoad: function(event)  {
    const Ci = Components.interfaces,
          Cc = Components.classes,
          nsMsgSearchScope = Ci.nsMsgSearchScope,
          util = QuickFolders.Util;
    
    if (QuickFolders.Preferences.isDebug)  debugger;
    util.logDebug('QF-Search Load'); // this is exectued after SearchDialog.js searchOnLoad() !
    if (window.arguments && window.arguments[0]) {
      let args = window.arguments[0],
          searchTerms = args.searchTerms || null;
      if (!searchTerms) return;
      // set the folder to the server uri
      let folder = args.folder || null;
      if (typeof selectFolder != 'undefined' && folder) {
        selectFolder(folder)
      }
      else
        if (typeof updateSearchFolderPicker != 'undefined' && folder) {
          if (!folder.isServer)
            updateSearchFolderPicker(folder.URI);
        }
        
      if ((util.Application == 'Postbox' || util.Application == 'SeaMonkey')
          && 
          typeof initializeSearchRows == 'function') 
      {
        // create a collection from array and pass it to initializeSearchRows
        let termsArray = args.searchTerms,
            templateCollection = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsICollection),
            count = termsArray.length;
        for (let i = 0; i < count; i++) {
          templateCollection.AppendElement(termsArray[i]);
        }
        for (let j = 0; j < count; j++) { // just doing it this way to prove my collection 'works'
          gSearchSession.appendTerm(templateCollection.QueryElementAt(j, Ci.nsIMsgSearchTerm));
        }
        
        // remove last row?
        removeSearchRow(0); // possible?
        --gTotalSearchTerms;
        // now pass the collection
        initializeSearchRows(nsMsgSearchScope.offlineMail, templateCollection);
        initializeBooleanWidgets(); // make sure radiobutton 'all' is selected (from first searchTerm)
      }
      else {
        for (let i=0; i<searchTerms.length; i++) {
          this.addSearchTerm(searchTerms[i]);
        }
        // remove first (empty) row
        removeSearchRow(0);
        --gTotalSearchTerms;
      }
      // Postbox only ?
      if (saveSearchTerms && window.gSearchSession) {
        util.logDebug('Saving search terms... to session: ' + window.gSearchSession);
        saveSearchTerms(searchTerms, window.gSearchSession);
      }
    }
    
  }
  
}