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
    
    setElementColor: function(rule, colortype, color) {
	    // alert("setElementColor!");
	    // alert("Set color of css class " + rule + " to " + color);
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	    
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null)
	      return;
	    
	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var colorRule;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    alert("Search Rule Name:" + RuleName +"\n" + "rulesList.length=" + rulesList.length);
	    var rAtoms=RuleName.split(" ");
	    for (i=1; i<rulesList.length; i++) 
	    { 
		    var found;
	        //alert("searching rule (" + i + "): " + rulesList[i].selectorText);
		    for (var j=0; j<r.length; j++) {
			  found=true;
			  
		      if (-1 == rulesList[i].selectorText.indexOf(rAtoms[j])) {
		        found=false;
		        break;
	          }
	        }
	        if (found) {
			  alert("Matched Rule(" + i + ")\n\nselectorText:" + rulesList[i].selectorText + "\n"+
			        "rule type:" + rulesList[i].type + "\n" +
			        "rule cssText:" + rulesList[i].cssText + "\n" +
			        "setting " + colortype + ":" + color);
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration  
			  alert("getPropertyValue(background):" + st.getPropertyValue("background"));
			  alert("getPropertyValue(background-color):" + st.getPropertyValue("background-color"));
			  var k;
			  for (k=0;k<st.length;k++) {
			    if (colortype==st.item(k)) {
			      alert("item(" + k  + "):" + st.item(k));
				  rulesList[k].style.setProperty(colortype,color,"important");
				  alert("changed? getPropertyValue(background):" + rulesList[k].style.getPropertyValue("background"));
			    }
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
    
}

