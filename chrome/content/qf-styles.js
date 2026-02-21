"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension
END LICENSE BLOCK */

QuickFolders.Styles = {
  defaults: new Map(), // use for restoration on theme changes
  loadedTheme: "", // id of last loaded theme, used for restoration on theme changes

  getMyStyleSheet: function (doc, Name, Title) {
    function checkMatch(sheet, href) {
      return (Title && sheet.title == Title) || (href && href.includes(Name));
    }
    function makeDebugEntry(cnt, ss, href) {
      return cnt + ". " + href + (ss.title ? " [" + ss.title + "]" : "") + "\n";
    }
    // now for some naasty closures... :)
    function checkNestedSheets(ss) {
      for (let j = 0; j < ss.cssRules.length; j++) {
        let rule = ss.cssRules[j];
        if (rule.styleSheet) {
          // rule.type == rule.IMPORT_RULE
          let nestedSS = rule.styleSheet; // nsIDOMCSSImportRule
          href = nestedSS.href || "";
          sList += makeDebugEntry("[nested]", nestedSS, href);
          if (checkMatch(nestedSS, href)) {
            ssFirstMatch = nestedSS;
            break;
          } else {
            checkNestedSheets(nestedSS);
          }
          if (ssFirstMatch) {
            break;
          }
        }
      }
      return ssFirstMatch ? true : false;
    }
    let href, // closured
      ssFirstMatch = null, // closured
      sList = "",
      styleSheetList = doc.styleSheets;
    for (let i = 0; i < styleSheetList.length; i++) {
      let ss = styleSheetList[i];
      href = ss.href || "";

      sList += makeDebugEntry(i.toString(), ss, href);
      if (typeof ss.cssRules != "undefined") {
        if (checkMatch(ss, href)) {
          if (!ssFirstMatch) {
            ssFirstMatch = ss;
          }
          break;
        }
        if (!ssFirstMatch) {
          // iterate rules to check for nested style sheets
          if (checkNestedSheets(ss)) {
            break;
          }
        }
      }
    }
    if (ssFirstMatch) {
      QuickFolders.Util.logDebugOptional(
        "css.styleSheets",
        "============================================\n" +
          `getMyStyleSheet (${Name},${Title}) [${ssFirstMatch.title}] =${href}\n` +
          `doc.title       =${doc.title}\n` +
          `doc.documentURI =${document.documentURI}` +
          "\n============================================",
      );
    } else {
      QuickFolders.Util.logDebugOptional(
        "css",
        `Can not find style sheet: ${Name} - ${Title} in 
 (${window.closed ? "closed window" : window.location})
 doc.title       = ${doc.title}
 doc.documentURI = ${document.documentURI}`,
      );
    }

    QuickFolders.Util.logDebugOptional(
      "css.styleSheets",
      styleSheetList.length + " StyleSheets found:\n" + sList,
    );

    return ssFirstMatch;
  },

  getElementStyle: function (ss, rule, attribute) {
    const util = QuickFolders.Util;
    function getRuleFromList(rulesList, rule, attribute, recurse) {
      let leftTrim = function (S) {
        return S ? S.replace(/^\s+/, "") : "";
      };
      try {
        for (let theRule of rulesList) {
          if (theRule.type == theRule.IMPORT_RULE) {
            if (!recurse) {
              // don't allow deep recursion (break circular refs!)
              continue;
            }
            let retVal = getRuleFromList(theRule.styleSheet.cssRules, rule, attribute, false);
            // try to find imported rule (recursive) and return it.
            if (!(retVal === null)) {
              return retVal;
            }
            continue;
          }
          if (theRule.type != theRule.STYLE_RULE) {
            // other rules: unknown, media, page, font_face, charset
            // don't do anything here
            continue;
          }

          // style rules only.

          const selectors = theRule.selectorText;
          if (!selectors?.length) {
            continue;
          }
          let selectorArray = selectors.split(",");
          const match = selectorArray.some((s) => rule === leftTrim(s));
          if (match) {
            let st = theRule.style; // CSSStyleDeclaration
            util.logDebugOptional(
              "css.Detail",
              `found relevant style: ${theRule.selectorText} searching rule ${attribute}`,
            );

            // Iterate rules!
            for (const prop of st) {
              if (attribute == prop) {
                let val = st.getPropertyValue(attribute);
                util.logDebugOptional("css.Detail", `attribute Found:\n${attribute} : ${val}`);
                return val;
              }
            }
          }
        }
        return null; // not found
      } catch (e) {
        util.logException("getElementStyle( " + rule + ", " + attribute + ")", e);
      }
      return null; // not found
    }

    util.logDebugOptional("css.Detail", "getElementStyle( " + rule + ", " + attribute + ")");

    // get rule recusrsively (includes imported style sheets)
    return getRuleFromList(ss.cssRules, rule, attribute, true);
  },

  setElementStyle: function (ss, rule, attribute, value, important, debug) {
    const util = QuickFolders.Util;
    let visitedStyleSheetList = [];
    visitedStyleSheetList.push(ss.href);
    function logDebug(text) {
      if (debug) {
        util.logDebug(text);
      } else {
        util.logDebugOptional("css.Detail", text);
      }
    }

    function setRuleFromList(rulesList, rule, attribute, value, important, recurse) {
      // selector normalization: remove leading/trailing spaces and reduce multiple spaces to single
      const normalize = (s) => s?.replace(/\s+/g, " ").trim();
      let foundRule = false,
        st; // new style rule

      for (const theRule of rulesList) {
        if (theRule.type == theRule.IMPORT_RULE) {
          // try to set imported rule (recursive) and return true.
          if (!recurse) {
            // don't allow deep recursion (break circular @import refs!)
            continue;
          }
          let styleSheetName = theRule.styleSheet.href;
          if (visitedStyleSheetList.includes(styleSheetName)) {
            // don't parse the same sheet twice :)
            continue;
          }
          logDebug("setting CSS rule in " + styleSheetName);
          if (
            setRuleFromList(theRule.styleSheet.cssRules, rule, attribute, value, important, true)
          ) {
            return true;
          }
          continue;
        }
        if (theRule.type != theRule.STYLE_RULE) {
          // other rules: unknown, media, page, font_face, charset
          // don't do anything here
          continue;
        }
        const selectors = theRule.selectorText;
        if (!selectors || !selectors.length) {
          continue;
        }

        if (normalize(rule) == normalize(selectors)) {
          // theRule = CSSStyleRule interface
          st = theRule.style; // CSSStyleDeclaration
          logDebug(
            `Found relevant selector: ${theRule.selectorText}\n` +
              `  ... searching rule:    ${attribute}`,
          );

          // if rule already exists, let's take a shortcut here
          const origProperty = st.getPropertyValue(attribute);
          const key = `${rule}{${attribute}}`; // e.g. "tab:not([selected]){color}"
          /*
            === Default CSS Tracking Strategy ===
            - Style engine dynamically modifies CSS rules at runtime via setElementStyle().
            - We want to capture the "original" default value of a property in our stylesheets,
              so that theme changes or resets can restore it exactly.
            - Approach:
              1. Maintain a Set of all selector+property pairs that have been injected by JS.
              2. When setRuleFromList encounters a rule:
                a) If the selector+property is NOT in the injected set and not already in the defaults map,
                    it must be a real CSS default. Capture it.
                b) If the property exists in the rule, store the value; otherwise, store `null` to indicate
                    the property is absent in the original CSS (so we can remove it when restoring).
            - This ensures:
                • Only real stylesheet defaults are stored.
                • Dynamically injected runtime rules are ignored.
                • Theme resets can safely restore or remove properties as appropriate.
          */
          if (!QuickFolders.Styles.defaults.has(key)) {
            const propExists = Array.from(st).includes(attribute);
            if (propExists) {
              // property exists in stylesheet, store the value
              QuickFolders.Styles.defaults.set(key, origProperty);
            } else {
              // property does NOT exist in stylesheet, mark as "explicitly absent"
              QuickFolders.Styles.defaults.set(key, null);
            }
          }

          if (origProperty) {
            foundRule = true;
            st.removeProperty(attribute);
            if (value != null) {
              logDebug(`Updating existing rule:\n${attribute}: ${origProperty} --> ${value}`);
              st.setProperty(attribute, value, important ? "important" : "");
            }
            
          } else {
            // if (origProperty=="");
            // st.setProperty(attribute, value, ((important) ?	"important" : ""));
            foundRule = false;
          }
        }
        if (foundRule && value != null) {
          // keep searching if exact rule was not found! but remove duplicates.
          return true; // if rule found, early exit
        }
      }
      return foundRule; // was rule found?
    }

    // to do: find elements of this class and change their attribute (e.g. color)
    // find the class element itself and change its properties
    // persist in options
    // load on startup
    try {
      if (!ss || ss == null) {
        logDebug("failed loading stylesheet, empty parameter.");
        return false;
      }
      if (typeof ss.cssRules == "undefined") {
        return false;
      }

      let action = value ? "Setting" : "Removing",
        actionResult = value ? "\nto " + value : "";
      logDebug(
        "======================================\n" +
          `${action} CSS rule in ${ss.href}\n${rule}${actionResult}`,
      );

      util.logDebugOptional(
        "css.Detail",
        "setElementStyle( " + rule + ", " + attribute + ", " + value + ")",
      );

      let rulesList = ss.cssRules,
        resultSet = true,
        attributes = [].concat(attribute); // support array for quick removal
      for (let at of attributes) {
        // reset recursion list
        while (visitedStyleSheetList.length > 1) {
          visitedStyleSheetList.pop();
        }
        let isSet = setRuleFromList(rulesList, rule, at, value, important, true);
        if (!isSet) {
          // not found:
          if (null != value) {
            let sRule = rule + "{" + at + ":" + value + (important ? " !important" : "") + ";}";
            util.logDebugOptional("css.AddRule", "Adding new CSS rule:" + sRule);
            ss.insertRule(sRule, ss.cssRules.length);
            logDebug("setElementStyle()\nNo Existing rule found, so inserted a fresh one.");
          } else {
            logDebug("setElementStyle()\nFailed finding rule " + rule + "\n{" + at + "}");
            resultSet = false; //removing style(s) failed
          }
        }
      }
      return resultSet;
    } catch (e) {
      util.logException("setElementStyle( " + rule + ", " + attribute + ", " + value + ")", e);
    }
    return false;
  },

  removeElementStyle: function (ss, rule, attribute, debug) {
    return QuickFolders.Styles.setElementStyle(ss, rule, attribute, null, true, debug);
  },

  restoreRules: function (ss) {
    const util = QuickFolders.Util;
    const visited = new Set(); // to avoid circular @import references
    const isDebug = QuickFolders.Preferences.isDebugOption("css.styles.restoreRules");
    const logOptions = { color: "rgb(204, 159, 49)", background: "rgb(70, 0, 18)" };
    const logOptions2 = { color: "rgb(245, 255, 167)", background: "rgb(9, 107, 19)" };
    if (!ss) {
      util.logHighlight("restoreRules() called without a style sheet. Aborting.", logOptions);
      return;
    }
    if (isDebug) {
      util.logHighlight(
        "======================================\n" + "Restoring default CSS rules in " + ss.href,
        logOptions,
      );
    }
    logOptions.color = "rgb(245, 247, 181)";
    const logDebug = function (first, ...rest) {
      if (!isDebug) {
        return;
      }
      util.logHighlight(first, logOptions, ...rest);
    };
    const logDebug2 = function (first, ...rest) {
      if (!isDebug) {
        return;
      }
      util.logHighlight(first, logOptions2, ...rest);
    };        

    function walkRules(rules) {
      for (const rule of rules) {
        if (rule.type === rule.IMPORT_RULE) {
          const href = rule.styleSheet?.href;
          if (!href || visited.has(href)) {
            continue;
          }
          visited.add(href);
          walkRules(rule.styleSheet.cssRules);
          continue;
        }

        if (rule.type !== rule.STYLE_RULE || !rule.selectorText) {
          continue;
        }

        restoreRule(rule);
      }
    }

    function restoreRule(cssRule) {
      const selector = cssRule.selectorText;
      const style = cssRule.style;

      for (const [key, defaultValue] of QuickFolders.Styles.defaults.entries()) {
        const [sel, attr] = parseKey(key);
        if (sel !== selector) {
          continue;
        }

        if (defaultValue === null) {
          logDebug(`restoreRules(): removing '${attr}' in selector '${selector}'`);          
          style.removeProperty(attr);
        } else {
          style.setProperty(attr, defaultValue);
          logDebug2(
            `restoreRules(): Restoring '${attr}' in selector '${selector} to '${defaultValue}'`,
          );          
        }
      }
    }

    function parseKey(key) {
      const match = key.match(/^(.*)\{(.*)\}$/);
      return match ? [match[1], match[2]] : [];
    }

    try {
      visited.add(ss.href);
      walkRules(ss.cssRules);
    } catch (e) {
      util.logException("restoreRules()", e);
    }
  },  

  resetTheme: function (ss) {
    if (!ss) {
      QuickFolders.Util.logHighlight("resetTheme() called without a style sheet. Aborting.");
      return;
    }
    QuickFolders.Util.logDebug(`Resetting theme ${this.loadedTheme} to default styles...`);

    const rv = this.restoreRules(ss);
    this.loadedTheme="";
    return rv;
  },
};