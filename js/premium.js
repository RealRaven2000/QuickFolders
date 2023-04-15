
/* functions that remove elements depending on the user type (from user=pro querystring ) */

var removableItems = [
	"QuickFoldersFreeUser",
	"QuickFoldersProUser",
	"QuickFoldersProRenew"
];
var removedItems = [];

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

	function removeClassItems(name, replaceItem) {
		if (removedItems.includes(name)) { // already removed?
			return;
		}
		var dbuttons = document.getElementsByClassName(name);
		for (var i=dbuttons.length-1; i>=0; i--) {
			if (replaceItem) {
				var renewButton = document.createElement("a");
				renewButton.setAttribute("href", "https://sites.fastspring.com/quickfolders/instant/quickfoldersrenew&referrer=quickfolders-site");
				renewButton.className = "renewButton";
				renewButton.innerHTML = "Renew License";
				dbuttons[i].replaceWith(renewButton); // replace anchor tag (containing donate button)
			}
			else {
				dbuttons[i].parentNode.removeChild(dbuttons[i]);
			}
		}
		removedItems.push(name);
	}
	
	document.addEventListener("DOMContentLoaded", function(event) { 
		var user = getQueryVariable("user");
		if (typeof user!='undefined') {
			// propagate user type to all internal links
			if (user) {
				var navMenu = document.getElementsByClassName('navigation-list');
				if (navMenu.length) {
					var links = navMenu[0].children;
					for (var i=0; i<links.length; i++) {
						var href = links[i].getAttribute("href");
						if (href && href.indexOf("user="==-1))
							links[i].setAttribute("href", href + "?user=" + user);
					}
				}
			}
			
      // new class: QuickFoldersStdUser
			switch (user) {
				case 'std':
					removeClassItems('donateButton');
					removeClassItems('QuickFoldersFreeUser');
					removeClassItems('QuickFoldersProUser');
				  removeClassItems('QuickFoldersProRenew');
					break;
				case 'pro':
					removeClassItems('donateButton');
					removeClassItems('QuickFoldersFreeUser');
				  removeClassItems('QuickFoldersProRenew');
          removeClassItems('QuickFoldersStdUser');
					break;
				case 'proRenew':
					removeClassItems('donateButton');
					removeClassItems('QuickFoldersFreeUser');
				  removeClassItems('QuickFoldersProUser');
          removeClassItems('QuickFoldersStdUser');
				  break;
				default:
          removeClassItems('QuickFoldersStdUser');
				  removeClassItems('QuickFoldersProRenew');
				  removeClassItems('QuickFoldersProUser');
			}
		}
		// remove sales stuff
		if (sales_end && new Date() > sales_end) {
			removableItems.forEach(
				(e) => {
					if (!removedItems.includes(e)) {
						removeClassItems(e);
						removedItems.push(e);
					}
				}
			)

		}

	});
	
	

	