const QF_CC = Components.classes;
const QF_CI = Components.interfaces;
var 	consoleService=null;


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
	    catch(e) { this.logToConsole("Quickfolders:" + e); };
	    
    },
    logToConsole: function (msg) {
	  if (consoleService == null)
	    consoleService = Components.classes["@mozilla.org/consoleservice;1"]
	                                 .getService(Components.interfaces.nsIConsoleService);
	  consoleService.logStringMessage("Quickfolders:" +msg);
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
		  this.logToConsole("Quickfolders: could not find my style sheet!\n")
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
        this.logToConsole ("\nQuickfolders.getElementColor: could not find rule " + RuleName);
	    return 0;
      }
      catch(e) {
	     this.logToConsole ("\nQuickfolders.getElementColor: " + e);   
      };
	    
    },
    
    setElementColor: function(rule, colortype, color) {
	    // alert("setElementColor!");
	    alert("Set color of css class " + rule + " to " + color);
	    // to do: find elements of this class and change their color
	    // find the class element itself and change its properties
	    // persist in options
	    // load on startup
	  try {
	    var ss = this.getMyStyleSheet();
	    if (!ss || ss==null) {
		  this.logToConsole("Quickfolders: could not find my style sheet!\n")
	      return;
        }
	    
	    var rulesList=ss.cssRules; //  ? ss.cssRules : ss.rules
	    var i;
	    var RuleName = '#QuickFolders-Toolbar' + rule;
	    this.logToConsole("\nSearching Rule Name: " + RuleName +"\n" + "rulesList.length=" + rulesList.length);
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
		      this.logToConsole ("------- MATCHED  ----------" 
	          + "\nrule(" + i + ") - selectorText: " + rulesList[i].selectorText
			  + "\n"+ "setting " + colortype + " to " + color);
			  var st=rulesList[i].style; // readonly  CSSStyleDeclaration 
			  //iterate styles!
			  var k;
			  
			  /*
			  for (k=0;k<st.length;k++) {
		        this.logToConsole ("\nRule Item "+k+": " + st.item(k));
			  }
			  */
			  
			  for (k=0;k<st.length;k++) {
				try{
			      if (colortype==st.item(k)) {
			        this.logToConsole ("\n=============\nModify item: " + st.item(k)) + " =====================";
				    //this.logToConsole ("\ncssText BEFORE:" + st.cssText);
				   this.logToConsole ("\nrulesList[i].style[k]=" + rulesList[i].style[k]
				              + "\nrulesList[i].style[k].parentRule=" + rulesList[i].style.parentRule
				              + "\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(colortype)
				              + "\nst.getPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype)
				              + "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(colortype));
				   this.logToConsole ("\n -->> REMOVING AND ADDING PROPERTY NOW:");
				    st.removeProperty(colortype);
				    st.setProperty(colortype,color,"important");
				   this.logToConsole ("\nrulesList[i].style.getPropertyPriority=" + rulesList[i].style.getPropertyPriority(colortype)
				              + "\nrulesList[i].style.getPropertyValue=" + rulesList[i].style.getPropertyValue(colortype)
				               + "\ngetPropertyValue(" + colortype + "):" + st.getPropertyValue(colortype)
			                   + "\n==========================================\n");
				   
				   //alert("st.item(k).style=" + st.item(k).style);undefined
				   //alert("st.item(k).type=" + st.item(k).type);undefined
				    //this.logToConsole ("\ncssText AFTER:" + st.cssText);
				    break;
			      }
		        }
		        catch (e) { this.logToConsole ("error: " + e) };
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
	    	    var colorRule;

				  if(rulesList[i].selectorText.toLowerCase()==RuleName.toLowerCase())
				  { //find "a:hover" rule
		            colorRule=rulesList[i];
		            alert("found rule:" +colorRule.cssText);
		            break;
		          }
		          */
		          
	    //ss.deleteRule(colorRule);
	    //ss.insertRule(colorRule, ss.cssRules.length);
		          
	        }
		    
	    }
	    // HOW DO WE FORCE REFRESH OF ELEMENTS FROM STYELSHEET?
	    // this doesn't work =>
	    // ss.disabled=true;
	    // ss.disabled=false;
        
	    
	    
	    return true;
	    // planned for later: 
	    //            add default color pick; 
	    //            add system colors such as ButtonFace, Highlight, HighlightText etc.
	    // even later: 
	    //            extend the color picker to select 2 colors and a gradient direction (vertical / horizontal)
      }
      catch(e) {
	     this.logToConsole ("\nQuickfolders: " + e);   
      };
    }
}


