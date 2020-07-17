
function onLoad(window, wasAlreadyOpen) {

	// Get the label using an entry from the i18n locale JSON file in the _locales folder.
	// you currently do not have any JSON locales
	// let label = this.extension.localeData.localizeMessage("menuLabel");

	// Parse a XUL fragment
	// The oncommand attribute does not know "this", so we need to specify
	// the entiry hierachy, including "ListenerExampleAddon" namespace of this
	// JavaScript files as defined in messenger.WindowListener.startListening()
	// in background.js.
	let xul = window.MozXULElement.parseXULToFragment(`
<menuseparator 
	id="quickfolders-settings-sep" />
<menuitem id="quickfolders-settings"
	label="&qf.toolbar.quickfolders.toolbar;" 
	oncommand="window.openDialog('chrome://quickfolders/content/settings.xhtml', 'quicktextConfig', 'chrome,resizable,centerscreen')" 
	class="menu-iconic  menuitem-iconic" />
`, 
	["chrome://quickfolders/locale/calendar.dtd"]);

	// Add the parsed fragment to the UI.
	let refItem = window.document.getElementById("prefSep");
	menuAccountmgr.parentNode.insertBefore(xul, refItem);
}

function onUnload(window, isAddOnShutDown) {
	// Remove any added elements.
	window.document.getElementById("quickfolders-settings-sep").remove();
	window.document.getElementById("quickfolders-settings").remove();
}
