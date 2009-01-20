const QF_CC = Components.classes;
const QF_CI = Components.interfaces;


function QF_getAddon(aId) {
	var em = QF_CC["@mozilla.org/extensions/manager;1"]
       .getService(QF_CI.nsIExtensionManager);
  return em.getItemForID(aId);
}

function QF_getMyVersion() {
  return QF_getAddon("quickfolders@curious.be").version; 
}

var QuickFoldersOptions = {
    accept: function() {
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.notifyObservers(null, "quickfolders-options-saved", null);
    } ,
    load : function() {
	    var version=QF_getMyVersion();
		if (version=="") version='version?';
	    document.getElementById("qf-options-header-description").setAttribute("value", version);
	    // initialize colorpickers
	    try {
		    document.getElementById("activetab-colorpicker").color=this.getElementColor('.toolbar-flat toolbarbutton.selected-folder', 'background-color');
		    document.getElementById("hover-colorpicker").color=this.getElementColor('.toolbar-flat toolbarbutton:hover', 'background-color');
		    document.getElementById("toolbar-colorpicker").color=this.getElementColor('.toolbar', 'background-color');
	    }
	    catch(e) { Window.dump("Quickfolders:" + e); };
	    
    },
    
    getMyStyleSheet: function() {
	  var styleSheetList = document.styleSheets;
      for (var i=0; i<document.styleSheets.length; i++) {
	    var ss = document.styleSheets[i];
	    if (ss.title == "qfStyles") {
	      return ss;
        }
      }
      //return NaN;
    },
    
    getElementColor: function(rule, colortype) {
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  window.dump("Quickfolders: could not find my style sheet!\n")
	      return;
        }
	    
	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var colorRule;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    window.dump("\nSearching Rule Name:" + RuleName +"\n" + "rulesList.length=" + rulesList.length);
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
	          window.dump ("\nfound rule(" + i + ") - selectorText: " + rulesList[i].selectorText);
			  window.dump ("\n"+ "rule type:" + rulesList[i].type + "\n" +
			                     "getting " + colortype );
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration  
		      return st.getPropertyValue(colortype);
	        }
		    
	    }
	    return 0;
      }
      catch(e) {
	     window.dump ("\nQuickfolders: " + e);   
      };
	    
    },
    
    setElementColor: function(rule, colortype, color) {
	    // alert("setElementColor!");
	    // alert("Set color of css class " + rule + " to " + color);
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  window.dump("Quickfolders: could not find my style sheet!\n")
	      return;
        }
	    
	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var colorRule;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    window.dump("\nSearching Rule Name:" + RuleName +"\n" + "rulesList.length=" + rulesList.length);
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
		      window.dump ("\n ------- MATCHED  ----------")
	          window.dump ("\nrule(" + i + ") - selectorText: " + rulesList[i].selectorText);
			  window.dump ("\n"+ "rule type:" + rulesList[i].type + "\n" +
			                     "setting " + colortype + ": " + color);
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration  
			  //iterate styles!
			  var k;
			  for (k=0;k<st.length;k++) {
				try{
		         // window.dump ("\ngetPropertyValue(" + st.item(k) + "):" + rulesList[k].style.getPropertyValue(colortype));
			      if (colortype==st.item(k)) {
			        window.dump ("\n=============\nModify item(" + k  + "):" + st.item(k));
				    window.dump ("\ngetPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype));
				    //window.dump ("\ngetPropertyCSSValue(" + colortype + "):" + st.getPropertyCSSValue(colortype));
				    window.dump ("\ncssText BEFORE:" + st.cssText);
				    st.setProperty(colortype,color,"important");
				    window.dump ("\ngetPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype));
				    window.dump ("\ncssText AFTER:" + st.cssText);
				    break;
			      }
		        }
		        catch (e) { window.dump ("error: " + e) };
		      }
		      break;
		      //st.removeProperty(colortype);
			  //st.setProperty(colortype,color,"!important");
			  
			  
			  //rulesList[i].style.setProperty(colortype, color, "!important");
			  
			  
			  // now find the style declaration to modify
			  /*
			  var sStyleTextList="";
			  for (i=0; i<st.length; i++) {
				 sStyleTextList += st.DOMString[i] + "\n"
			  }
			  alert ("cssText list:" + sStyleTextList );
			  */
				  /*  
				  if(rulesList[i].selectorText.toLowerCase()==RuleName.toLowerCase())
				  { //find "a:hover" rule
		            colorRule=rulesList[i];
		            alert("found rule:" +colorRule.cssText);
		            break;
		          }
		          */
	        }
		    
	    }
	    
        //ss.deleteRule(colorRule);
	    //ss.insertRule(colorRule, ss.cssRules.length);
	    
	    return true;
	    // planned for later: 
	    //            add default color pick; 
	    //            add system colors such as ButtonFace, Highlight, HighlightText etc.
	    // even later: 
	    //            extend the color picker to select 2 colors and a gradient direction (vertical / horizontal)
      }
      catch(e) {
	     window.dump ("\nQuickfolders: " + e);   
      };
    }
}


