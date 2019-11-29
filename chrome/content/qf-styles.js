"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension
END LICENSE BLOCK */


QuickFolders.Styles = {
	getMyStyleSheet: function(Name, Title) {
    function checkMatch(sheet, href) {
      return (Title && sheet.title == Title)
                ||
              (href && href.indexOf(Name)>=0);
    }
    function makeDebugEntry(cnt, ss, href) {
      return  cnt + '. ' + href
			         + (ss.title ? ' [' + ss.title + ']' : '') + '\n';
    }
    // now for some naasty closures... :)
    function checkNestedSheets(ss) {
      for (let j=0; j<ss.cssRules.length; j++) {
        let rule = ss.cssRules[j];
        if (rule.styleSheet) { // rule.type == rule.IMPORT_RULE
          let nestedSS = rule.styleSheet;  // nsIDOMCSSImportRule
          href = nestedSS.href || "";
          sList += makeDebugEntry('[nested]', nestedSS, href);
          if (checkMatch(nestedSS, href)) {
            ssFirstMatch = nestedSS;
            break;
          }
          else
            checkNestedSheets(nestedSS);
          if (ssFirstMatch) break;
        }
      }
      return (ssFirstMatch) ? true : false;
    }
    let href, // closured
		    ssFirstMatch = null, // closured
		    sList = '',
		    styleSheetList = document.styleSheets;
		for (let i = 0; i < styleSheetList.length; i++) {
			let ss = styleSheetList[i];
			href = ss.href || "";

			sList += makeDebugEntry(i.toString(), ss, href);
      if (typeof ss.cssRules != 'undefined') {
        if (checkMatch(ss,href))
        {
          if (!ssFirstMatch)
            ssFirstMatch = ss;
          break;
        }
        if (!ssFirstMatch) {
          // iterate rules to check for nested style sheets
          if (checkNestedSheets(ss))
            break;
        }
      }
		}
    if (ssFirstMatch)
      QuickFolders.Util.logDebugOptional("css.styleSheets",
          "============================================\n"
        + "getMyStyleSheet (" + Name + "," + Title + ") [" + ssFirstMatch.title + "] =" + href
        + "\nwin.doc.title   =" + window.document.title
        + "\ndoc.title       =" + document.title
        + "\nwindow.location =" + window.location
        + "\n============================================");
    else
			QuickFolders.Util.logDebug("Can not find style sheet: " + Name + " - " + Title + " in "
			  + (window.closed ? "closed window" : window.location)
				+ "\nwin.doc.title=" + window.document.title
				+ "\ndoc.documentURI=" + document.documentURI);
        
		QuickFolders.Util.logDebugOptional("css.styleSheets", styleSheetList.length + " StyleSheets found:\n" + sList);

		return ssFirstMatch;
	},

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

	setElementStyle: function(ss, rule, attribute, value, important, debug) {
    const util = QuickFolders.Util;
    let visitedStyleSheetList = [];
    visitedStyleSheetList.push(ss.href);
    function logDebug(text) {
      if (debug) 
        util.logDebug(text);
      else
        util.logDebugOptional("css.Detail", text);
    }
    
		function setRuleFromList(rulesList, rule, attribute, value, important, recurse) {
			let found = false,
			    foundRule = false,
			    st; // new style rule
			
			for (let i=0; i<rulesList.length; i++) {
				let theRule = rulesList[i];
				switch (theRule.type) {
					case theRule.IMPORT_RULE:
						// try to set imported rule (recursive) and return true.
						if (!recurse) // don't allow deep recursion (break circular @import refs!)
							continue;
            let styleSheetName = theRule.styleSheet.href;
            if (visitedStyleSheetList.includes(styleSheetName)) // don't parse the same sheet twice :)
              continue;
            logDebug('setting CSS rule in ' + styleSheetName);
						if (setRuleFromList(theRule.styleSheet.cssRules, rule, attribute, value, important, true))
							return true;
						break;
					case theRule.STYLE_RULE:
						let selectors = theRule.selectorText;
						if (!selectors || !selectors.length)
							continue;

						if (rule == selectors) {
              // theRule = CSSStyleRule interface
							st = theRule.style; // CSSStyleDeclaration
              logDebug("Found relevant selector: " + theRule.selectorText + "\n" +
                       "  ... searching rule:    " + attribute);
                       
              // if rule already exists, let's take a shortcut here
              let origProperty = st.getPropertyValue(attribute);
              if (origProperty) {
                foundRule = true;
                st.removeProperty(attribute);
                st.setProperty(attribute, value, ((important) ?	"important" : ""));
              }
              else {
                if (origProperty=="");
                st.setProperty(attribute, value, ((important) ?	"important" : ""));
                foundRule = true;
              }
              
              /*
              logDebug ("=============\Current attribute: " + st.item(k) + " ====================="
                + "\noriginal value=" + origProperty
                + "\ntheRule.style[" + k +"]     = " + theRule.style[k]
                + "\n                .parentRule = " + theRule.style.parentRule
                + "\n                 Priority   = " + theRule.style.getPropertyPriority(attribute)
                + "\n.getPropertyValue(" + attribute + "):" + st.getPropertyValue(attribute));      
              else
                for (let k = 0; k < st.length; k++) {  //iterate rules!
                  try {
                    if (attribute == st.item(k)) {
                      foundRule = true;
                      logDebug ("=============\Current attribute: " + st.item(k) + " ====================="
                              + "\ntheRule.style[" + k +"]     = " + theRule.style[k]
                              + "\n                .parentRule = " + theRule.style.parentRule
                              + "\n                 Priority   = " + theRule.style.getPropertyPriority(attribute)
                              + "\n.getPropertyValue(" + attribute + "):" + st.getPropertyValue(attribute));
                      st.removeProperty(attribute);
                      if (null!=value) {
                        st.setProperty(attribute,value,((important) ?	"important" : ""));
                      }
                      break;
                    }
                  }
                  catch (e) { util.logToConsole ("(error) " + e) };
                  break;
                }
                */
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
				logDebug("failed loading stylesheet, empty parameter.")
				return false;
			}
			if (typeof ss.cssRules == 'undefined')
				return false;

      let action = value ? 'Setting' : 'Removing',
          actionResult = value ? ('\nto ' + value) : '';
      logDebug('======================================\n'
               + action + ' CSS rule in ' + ss.href +'\n'
               + rule + actionResult);
      
			util.logDebugOptional("css.Detail", "setElementStyle( " + rule + ", " + attribute + ", " + value + ")");

			let rulesList = ss.cssRules,
          resultSet = true,
          attributes = [].concat(attribute); // support array for quick removal
      for (let a=0; a<attributes.length; a++) {
        let at = attributes[a];
        // reset recursion list
        while (visitedStyleSheetList.length>1) visitedStyleSheetList.pop();
        let isSet = setRuleFromList(rulesList, rule, at, value, important, true);
        if (!isSet) {
          // not found:
          if (null!=value) {
            let sRule=rule +"{" + at + ":" + value + ((important) ? " !important" : "") + ";}";
            util.logDebugOptional("css.AddRule", "Adding new CSS rule:" + sRule );
            ss.insertRule(sRule, ss.cssRules.length);
            logDebug('setElementStyle()\nNo Existing rule found, so inserted a fresh one.');
          }
          else {
            logDebug('setElementStyle()\nFailed finding rule ' + rule + 
                     '\n{' + at +'}');
            resultSet = false; //removing style(s) failed
          }
        }
      }
      return resultSet;

		}
		catch(e) {
			util.logException ("setElementStyle( " + rule + ", " + attribute + ", " + value + ")", e);
		};
		return false;
	},

	removeElementStyle: function(ss, rule, attribute, debug) {
		return QuickFolders.Styles.setElementStyle(ss, rule, attribute, null, true, debug);
	}

}