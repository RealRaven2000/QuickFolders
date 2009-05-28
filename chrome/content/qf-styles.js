
QuickFolders.Styles = {

    getMyStyleSheet: function() {
	  var styleSheetList = document.styleSheets;
      for (var i=0; i<document.styleSheets.length; i++) {
	    var ss = document.styleSheets[i];
	    if (ss.title == "qfStyles" || ss.href.indexOf("//quickfolders/content/layout.css")>0) {
		    QuickFolders.Util.logDebug("stylesheet (" + i + ") [" + ss.title + "] =" + ss.href
		      + "\nwin.doc.title=" + window.document.title
		      + "\ndoc.title=" + document.title
		      + "\nwin.location=" + window.location);
	      return ss;
        }
        /*QuickFolders.Util.logDebug ("stylesheet (" + i + ")"
          + (ss.title.length ? "[" + ss.title + "]" : "")
          + " = " + ss.href);*/
      }
	  QuickFolders.Util.logToConsole("Can not find style sheet: qfStyles in " +(window.closed ? "closed window" : window.location)
	          + "\nwin.doc.title=" + window.document.title
		        + "\ndoc.documentURI=" + document.documentURI);
	  return 0;
    },

    getElementStyle: function(rule, colortype) {
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  QuickFolders.Util.logToConsole("Quickfolders: could not find my style sheet!\n")
	      return "";
        }

	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    var rAtoms=RuleName.split(" ");
	    for (i=1; i<rulesList.length; i++)
	    {
		    var found;
		    for (var j=0; j<rAtoms.length; j++) {
			  found=true;

		      if (-1 == rulesList[i].selectorText.indexOf(rAtoms[j])) {
		        found=false;
		        break;
	          }
	        }
	        if (found) {
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration
		      return st.getPropertyValue(colortype);
	        }

	    }
        QuickFolders.Util.logToConsole ("\nQuickFolders.getElementStyle: could not find rule " + RuleName);
      }
      catch(e) {
	     QuickFolders.Util.logToConsole ("(error)\nQuickFolders.getElementStyle: " + e);
      };
      return "";

    },

    setElementStyle: function(ss, rule, colortype, color, important) {
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	  try {
	    if (!ss || ss==null) {
		  ss = this.getMyStyleSheet();
		  if (!ss || ss==null)
		    return false;
        }
        QuickFolders.Util.logDebug("setElementStyle( " + rule + ", " + colortype + ", " + color + ")");

	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    var rAtoms=RuleName.split(" ");
	    var found=false;
	    var foundRule=false;
	    var st; // new style rule
	    for (i=1; i<rulesList.length; i++)
	    {
		    for (var j=0; j<rAtoms.length; j++) {
			  found=true;

		      if (-1 == rulesList[i].selectorText.indexOf(rAtoms[j])) {
		        found=false;
		        break;
	          }
	        }
	        if (found && !(undefined == found)) {
			  st=rulesList[i].style; // CSSStyleDeclaration
	          QuickFolders.Util.logDebug("found relevant style: " + rulesList[i].selectorText + " searching rule " + colortype);
			  var k;//iterate styles!

			  for (k=0;k<st.length;k++) {
				try{
			      if (colortype==st.item(k)) {
				    foundRule=true;
			        QuickFolders.Util.logDebug ("\n=============\nModify item: " + st.item(k)) + " =====================";
				    QuickFolders.Util.logDebug ("\nrulesList[i].style[k]=" + rulesList[i].style[k]
				              + "\nrulesList[i].style[k].parentRule=" + rulesList[i].style.parentRule
				              + "\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(colortype)
				              + "\nst.getPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype)
				              + "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(colortype));
				   st.removeProperty(colortype);
				   st.setProperty(colortype,color,"important");
				   break;
			      }
		        }
		        catch (e) { QuickFolders.Util.logToConsole ("(error) " + e) };
		      }
		      if (foundRule) // keep searching if exact rule was not found!
		        break;
	        }

	    }
	    if (found)
	      return true;
	    else {  // add the rule
	      var sRule=RuleName +"{" + colortype + ":" + color + " !important;}";
	      QuickFolders.Util.logDebug("Adding new rule..." + sRule );
	      ss.insertRule(sRule,ss.length)
	      return true;
	    }

      }
      catch(e) {
	     QuickFolders.Util.logToConsole ("(error) " + e);
      };
	  return false;
    }



}