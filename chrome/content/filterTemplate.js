"use strict";

/* BEGIN LICENSE BLOCK

    QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
    Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
    For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK */


var FilterTemplate = {
    loadTemplate : function loadTemplate() {
        // initialize list and preselect last chosen item!
        let element = document.getElementById('qf-filter-templates'),
        util = QuickFolders.Util;
        element.value = QuickFolders.FilterWorker.getCurrentFilterTemplate();
        try {
          let loc = Services.locale.requestedLocales[0]; // QuickFolders.Preferences.service.getStringPref("general.useragent.locale");
          if (loc) {
            util.logDebug('Locale found: ' + loc);
            if (loc.indexOf('en')!=0) {
              // hide quickFilters hint for non-english locales for now:
              // document.getElementById('quickFiltersPromoBox').collapsed = true;
            }
          }
  
          window.addEventListener('dialogcancel', this.cancelTemplate.bind(this));
          window.addEventListener('dialogextra1', this.acceptTemplate.bind(this));
          window.addEventListener('dialogextra2', function (event) { 
            QuickFolders.Util.openLinkInBrowser(event,'https://quickfolders.org/donate.html');
          });		  
        }
        catch (ex) {
          util.logException("QuickFolders.FilterWorker.loadTemplate()", ex);
        }    
    },
	
	acceptTemplate : function acceptTemplate() {
		this.selectTemplate();
		QuickFolders.FilterWorker.TemplateSelected = true;
        let retVals = window.arguments[0];
		retVals.answer  = true;
		setTimeout(function() {window.close()});
		return true;
	},
	
	cancelTemplate : function cancelTemplate() {
		QuickFolders.FilterWorker.TemplateSelected = false;
        let retVals = window.arguments[0];
		retVals.answer = false;
		return true;
	},

	selectTemplate : function selectTemplate(element) {
		if (!element) {
			element = document.getElementById('qf-filter-templates');
		}
		QuickFolders.FilterWorker.SelectedValue = element.selectedItem.value;
        QuickFolders.FilterWorker.setCurrentFilterTemplate(element.selectedItem.value);
	},
}

window.addEventListener("load", 
  FilterTemplate.loadTemplate.bind(FilterTemplate), 
  { once: true }
);
window.document.addEventListener("DOMContentLoaded", () => 
  {
    QuickFolders.Util.localize(
      window,
      {
        cancel: "qf.label.cancel", // buttonlabelcancel="__MSG_qf.label.cancel__"
        extra1: "qf.continueFilter.label", // buttonlabelextra1="__MSG_qf.continueFilter.label__"
        extra2: "qf.label.donate", // buttonlabelextra2="__MSG_qf.label.donate__"
      },
      {
        extra1: "qf.continueFilter.shortcut", // buttonaccesskeyextra1="__MSG_qf.continueFilter.shortcut__"
      }
    ); 
  }, { once: true }
);
