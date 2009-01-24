
QuickFolders.Styles = {
	

    getMyStyleSheet: function() {
	  var styleSheetList = document.styleSheets;
      for (var i=0; i<document.styleSheets.length; i++) {
	    var ss = document.styleSheets[i];
	    if (ss.title == "qfStyles") {
	      return ss;
        }
      }
	  QuickFolders.Util.logToConsole("Can not find style sheet:" +"qfStyles");
    },
    
    getElementStyle: function(rule, colortype) {
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  QuickFolders.Util.logToConsole("Quickfolders: could not find my style sheet!\n")
	      return;
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
	    return 0;
      }
      catch(e) {
	     QuickFolders.Util.logToConsole ("\nQuickFolders.getElementStyle: " + e);   
      };
	    
    },
    
    setElementStyle: function(rule, colortype, color) {
	    // alert("setElementStyle!");
	    // alert("Set color of css class " + rule + " to " + color);
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  QuickFolders.Util.logToConsole("could not find my style sheet!\n")
	      return;
        }
	    
	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    QuickFolders.Util.logToConsole("\nSearching Rule Name: " + RuleName +"\n" + "rulesList.length=" + rulesList.length);
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
		      QuickFolders.Util.logToConsole ("------- MATCHED  ----------" 
	          + "\nrule(" + i + ") - selectorText: " + rulesList[i].selectorText
			  + "\n"+ "setting " + colortype + " to " + color);
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration 
			  //iterate styles!
			  var k;
			  
			  /*
			  for (k=0;k<st.length;k++) {
		        QuickFolders.Util.logToConsole ("\nRule Item "+k+": " + st.item(k));
			  }
			  */
			  
			  for (k=0;k<st.length;k++) {
				try{
			      if (colortype==st.item(k)) {
			        QuickFolders.Util.logToConsole ("\n=============\nModify item: " + st.item(k)) + " =====================";
				    //QuickFolders.Util.logToConsole ("\ncssText BEFORE:" + st.cssText);
				   QuickFolders.Util.logToConsole ("\nrulesList[i].style[k]=" + rulesList[i].style[k]
				              + "\nrulesList[i].style[k].parentRule=" + rulesList[i].style.parentRule
				              + "\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(colortype)
				              + "\nst.getPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype)
				              + "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(colortype));
				   QuickFolders.Util.logToConsole ("\n -->> REMOVING AND ADDING PROPERTY NOW:");
				    st.removeProperty(colortype);
				    st.setProperty(colortype,color,"important");
				   QuickFolders.Util.logToConsole ("\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(colortype)
				              + "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(colortype)
				               + "\ngetPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype)
			                   + "\n==========================================\n");
				   
				   //alert("st.item(k).style=" + st.item(k).style);undefined
				   //alert("st.item(k).type=" + st.item(k).type);undefined
				    //QuickFolders.Util.logToConsole ("\ncssText AFTER:" + st.cssText);
				    break;
			      }
		        }
		        catch (e) { QuickFolders.Util.logToConsole ("error: " + e) };
		      }
		      break;
	        }
		    
	    }
	    // HOW DO WE FORCE REFRESH OF ELEMENTS FROM STYELSHEET?
	    // this doesn't work =>
	    // ss.disabled=true;
	    // ss.disabled=false;
	    
	    return true;
      }
      catch(e) {
	     QuickFolders.Util.logToConsole ("\nQuickfolders: " + e);   
      };
    }
	
}