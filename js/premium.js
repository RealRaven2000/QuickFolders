
/* functions that remove elements depending on the user type (from user=pro querystring ) */

	function getQueryVariable(variable)	{
		var query = window.location.search.substring(1),
				vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if (pair[0] == variable) 
				return pair[1];
		}
		return(null);
	}

	function removeClassItems(name) {
		var dbuttons = document.getElementsByClassName(name);
		for (var i=dbuttons.length-1; i>=0; i--) {
			// dbuttons[i].style.display='none';
			dbuttons[i].parentNode.removeChild(dbuttons[i]);
		}
	}
	
	document.addEventListener("DOMContentLoaded", function(event) { 
		var user = getQueryVariable("user");
		if (typeof user!='undefined') {
			if (user=='pro') {
				removeClassItems('donateButton');
				removeClassItems('QuickFoldersFreeUser');
				var navMenu = document.getElementsByClassName('navigation-list');
				if (navMenu.length) {
					for (var a in navMenu[0].children) {
						var href = a.getAttribute("href");
						if (href && href.indexOf("user="==-1))
							a.setAttribute("href", href + "&user=pro");
					}
					
				}
				
			}
			else
				removeClassItems('QuickFoldersProUser');
		}
	});

	