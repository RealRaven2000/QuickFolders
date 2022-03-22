"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */


QuickFolders.Styles = {
	getElementStyle: function(ss, rule, attribute) {
		const util = QuickFolders.Util;
	  function getRuleFromList(rulesList, rule, attribute, recurse) {
			let leftTrim = function(S) { return S ? S.replace(/^\s+/,"") : ''; };
			try {
				let match = false;
				for (let i=0; i<rulesList.length; i++) {
					let theRule = rulesList[i];
					switch (theRule.type) {
						case theRule.IMPORT_RULE:
							if (!recurse) // don't allow deep recursion (break circular refs!)
								continue;
						  let retVal = getRuleFromList(theRule.styleSheet.cssRules, rule, attribute, false);
							// try to find imported rule (recursive) and return it.
							if (! (retVal === null))
							  return (retVal);
							break;
					  case theRule.STYLE_RULE:
							let selectors = theRule.selectorText;
							if (!selectors || !selectors.length)
								continue;
							let selectorArray = selectors.split(',');
              // replaced for..each
              for (let r=0; r<selectorArray.length; r++) {
								if (rule == leftTrim(selectorArray[r])) {
									match = true;
									break;
								}
							}
							if (match) {
								let st = theRule.style; // CSSStyleDeclaration
								util.logDebugOptional("css.Detail", "found relevant style: " + theRule.selectorText + " searching rule " + attribute);

								//iterate rules!
								for (let k=0;k<st.length;k++) {
									if (attribute == st.item(k)) {
										let val = st.getPropertyValue(attribute);
										util.logDebugOptional ("css.Detail", "attribute Found:\n" + attribute + " : " + val);
										return val;
									}
								}
							}
							break;
						default: // other rules: unknown, media, page, font_face, charset 
						  // don't do anything here
							break;
					}
				}
				return null; // not found
			}
			catch(e) {
				util.logException ("getElementStyle( " + rule + ", " + attribute + ")", e);
			};
			return null;  // not found
		}
	
		util.logDebugOptional("css.Detail", "getElementStyle( " + rule + ", " + attribute + ")");
		
		// get rule recusrsively (includes imported style sheets)
		return getRuleFromList(ss.cssRules, rule, attribute, true);
	},
  
  
}