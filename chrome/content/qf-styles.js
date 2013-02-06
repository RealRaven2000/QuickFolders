/* BEGIN LICENSE BLOCK

GPL3 applies.
For detail, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
"use strict";


QuickFolders.Styles = {

	getMyStyleSheet: function(Name, Title) {
		let ssFirstMatch = null;
		let sList = '';
		let styleSheetList = document.styleSheets;
		for (let i = 0; i < styleSheetList.length; i++) {
			let ss = styleSheetList[i];
			let href = ss.href ? ss.href : "";

			sList += i.toString() + '. ' + href
			         + (ss.title ? ' [' + ss.title + ']' : '') + '\n';
			if (	(	(Title && ss.title == Title)
			    		||
			    		(href && href.indexOf(Name)>=0) )
			    &&
			    typeof ss.cssRules != 'undefined')
			{
				QuickFolders.Util.logDebugOptional("css.styleSheets",
				    "============================================\n"
				  + "getMyStyleSheet (" + Name + "," + Title + ") [" + i + ", " + ss.title + "] =" + href
					+ "\nwin.doc.title   =" + window.document.title
					+ "\ndoc.title       =" + document.title
					+ "\nwindow.location =" + window.location
					+ "\n============================================");
				if (!ssFirstMatch)
					ssFirstMatch = ss;
				break;
			}
		}
		QuickFolders.Util.logDebugOptional("css.styleSheets", styleSheetList.length + " StyleSheets found:\n" + sList);

		if (!ssFirstMatch)
			QuickFolders.Util.logDebug("Can not find style sheet: " + Name + " - " + Title + " in "
			  + (window.closed ? "closed window" : window.location)
				+ "\nwin.doc.title=" + window.document.title
				+ "\ndoc.documentURI=" + document.documentURI);
		return ssFirstMatch;
	},

	getElementStyle: function(ss, rule, attribute) {
	  function getRuleFromList(rulesList, rule, attribute, recurse) {
			let leftTrim = function(S) { return S ? S.replace(/^\s+/,"") : ''; };
			try {
				let match = false;
				let i;
				for (i=0; i<rulesList.length; i++)
				{
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
							for each (let r in selectorArray) {
								if (rule == leftTrim(r)) {
									match = true;
									break;
								}
							}
							if (match) {
								let st = theRule.style; // CSSStyleDeclaration
								QuickFolders.Util.logDebugOptional("css.Detail", "found relevant style: " + theRule.selectorText + " searching rule " + attribute);

								//iterate rules!
								for (let k=0;k<st.length;k++) {
									if (attribute == st.item(k)) {
										let val = st.getPropertyValue(attribute);
										QuickFolders.Util.logDebugOptional ("css.Detail", "attribute Found:\n" + attribute + " : " + val);
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
				QuickFolders.Util.logException ("getElementStyle( " + rule + ", " + attribute + ")", e);
			};
			return null;  // not found
		}
	
		QuickFolders.Util.logDebugOptional("css.Detail", "getElementStyle( " + rule + ", " + attribute + ")");
		
		// get rule recusrsively (includes imported style sheets)
		return getRuleFromList(ss.cssRules, rule, attribute, true);
	},

	setElementStyle: function(ss, rule, attribute, value, important) {
		function setRuleFromList(rulesList, rule, attribute, value, important, recurse) {
			let i;
			let found = false;
			let foundRule = false;
			let st; // new style rule
			
			for (i=0; i<rulesList.length; i++)
			{
				let theRule = rulesList[i];
				switch (theRule.type) {
					case theRule.IMPORT_RULE:
						// try to set imported rule (recursive) and return true.
						if (!recurse) // don't allow deep recursion (break circular @import refs!)
							continue;
						if (setRuleFromList(theRule.styleSheet.cssRules, rule, attribute, value, important, false))
							return true;
						break;
					case theRule.STYLE_RULE:
						let selectors = theRule.selectorText;
						if (!selectors || !selectors.length)
							continue;

						if (rule == selectors) {
							st = theRule.style; // CSSStyleDeclaration
							QuickFolders.Util.logDebugOptional("css.Detail", "found relevant style: " + theRule.selectorText + " searching rule " + attribute);
							let k;//iterate rules!

							for (k = 0; k < st.length; k++) {
								try {
									if (attribute == st.item(k)) {
										foundRule = true;
										QuickFolders.Util.logDebugOptional ("css.Detail", "\n=============\nModify item: " + st.item(k)) + " =====================";
										QuickFolders.Util.logDebugOptional ("css.Detail", "\ntheRule.style[k]=" + theRule.style[k]
													+ "\ntheRule.style[k].parentRule=" + theRule.style.parentRule
													+ "\ntheRule.style.getPropertyPriority=" + theRule.style.getPropertyPriority(attribute)
													+ "\nst.getPropertyValue(" + attribute + "):" + st.getPropertyValue(attribute)
													+ "\ntheRule.style.getPropertyValue=" + theRule.style.getPropertyValue(attribute));
										st.removeProperty(attribute);
										if (null!=value) {
											st.setProperty(attribute,value,((important) ?	"important" : ""));
										}
										break;
									}
								}
								catch (e) { QuickFolders.Util.logToConsole ("(error) " + e) };
								break;
							}
						}
						if (foundRule) // keep searching if exact rule was not found!
							return true; // if rule found, early exit
						break;
					default: // other rules: unknown, media, page, font_face, charset 
						// don't do anything here
						break;
				}
			}
			return foundRule; // was rule found?
		}
		
		// to do: find elements of this class and change their attribute (e.g. color)
		// find the class element itself and change its properties
		// persist in options
		// load on startup
		try {
			if (!ss || ss==null) {
				// fallback style sheet retrieval
				// ss = this.getMyStyleSheet("QuickFolderStyles", 'quickfolders-layout.css'); // not always 100% right but we hope that it is being passed in correctly
				// if (!ss || ss==null)
				return false;
			}
			if (typeof ss.cssRules == 'undefined')
				return false;

			QuickFolders.Util.logDebugOptional("css.Detail", "setElementStyle( " + rule + ", " + attribute + ", " + value + ")");

			let rulesList = ss.cssRules;
			if (setRuleFromList(rulesList, rule, attribute, value, important, true))
				return true;
			// not found:
			if (null!=value) {
				let sRule=rule +"{" + attribute + ":" + value + ((important) ? " !important" : "") + ";}";
				QuickFolders.Util.logDebugOptional("css.AddRule", "Adding new CSS rule:" + sRule );
				ss.insertRule(sRule, ss.cssRules.length);
			}

		}
		catch(e) {
			QuickFolders.Util.logException ("setElementStyle( " + rule + ", " + attribute + ", " + value + ")", e);
		};
		return false;
	},

	removeElementStyle: function(ss, rule, attribute) {
		return QuickFolders.Styles.setElementStyle(ss, rule, attribute, null, true);
	}

}