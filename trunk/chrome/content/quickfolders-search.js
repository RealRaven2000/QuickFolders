

QuickFolders.SearchDialog = {
  addSearchTerm: function addSearchTerm(searchTerm) {
    const Ci = Components.interfaces, 
          Cc = Components.classes,
          utils = QuickFolders.Util,
          typeAttrib = Ci.nsMsgSearchAttrib,
          typeOperator = Ci.nsMsgSearchOp;
    if (utils.Debug) debugger;
    utils.logDebug('addSearchTerm(attrib = ' + searchTerm.attrib + ')');
    let rowIndex = gSearchTermList.getRowCount();
    // from http://mxr.mozilla.org/comm-central/source/mailnews/base/search/content/searchTermOverlay.js#232
    //      onMore() called when the [+] button is clicked on a row (simulate last row)
    
    createSearchRow(rowIndex, gSearchScope, searchTerm, false);
    gTotalSearchTerms++;
    updateRemoveRowButton();

    // the user just added a term, so scroll to it
    gSearchTermList.ensureIndexIsVisible(rowIndex);
  } ,
  
  onLoad: function(event)  {
    let util = QuickFolders.Util;
    util.logDebug('QF-Search Load');
    if (window.arguments && window.arguments[0]) {
      let searchTerms = window.arguments[0].searchTerms || null;
      if (!searchTerms) return;
      for (let i=0; i<searchTerms.length; i++) {
        this.addSearchTerm(searchTerms[i]);
      }
      // remove first row
      removeSearchRow(0);
      --gTotalSearchTerms;
    }
    
  }
  
}