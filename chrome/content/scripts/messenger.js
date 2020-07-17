var { myModule } = ChromeUtils.import(this.extension.rootURI.resolve("content/modules/myModule.jsm"));

function restart(window) {
	window.alert("I should do something now.");
}

function onLoad(window, wasAlreadyOpen) {
	myModule.incValue();
	console.log("onLoad from the MESSENGER script has been called by <"+this.extension.id+">");
	console.log("onLoad() has been called for already open window: " + wasAlreadyOpen);
	console.log("onLoad() for: " + window.location.href);
	console.log("onLoad() sees myModule value : " + myModule.getValue());
	
	// Get the label using an entry from the i18n locale JSON file in the _locales folder.
	let label = this.extension.localeData.localizeMessage("menuLabel");

	// Parse a XUL fragment
	// The oncommand attribute does not know "this", so we need to specify
	// the entiry hierachy, including "ListenerExampleAddon" namespace of this
	// JavaScript files as defined in messenger.WindowListener.startListening()
	// in background.js.
	let xul = window.MozXULElement.parseXULToFragment(`
<menuitem id="myMenuEntry"
  class="menuitem-iconic"
  oncommand="window.ListenerExampleAddon.restart(window)"
  label="${label}"/>
`);
	
	// Add the parsed fragment to the UI.
	let menuAccountmgr = window.document.getElementById("menu_accountmgr");
	menuAccountmgr.parentNode.insertBefore(xul, menuAccountmgr.nextSibling);
}

function onUnload(window, isAddOnShutDown) {
	myModule.incValue();
	console.log("onUnload() from the MESSENGER script has been called by <"+this.extension.id+">");
	console.log("onUnload() has been called because of global add-on shutdown: " + isAddOnShutDown);
	console.log("onUnload() for: " + window.location.href);
	console.log("onUnload() sees myModule value : " + myModule.getValue());

	// Remove any added elements.
	let me = window.document.getElementById("myMenuEntry");
	me.remove();
}
