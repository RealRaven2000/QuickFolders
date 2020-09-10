
	async function loglic() {
		
		let name = await messenger.Utilities.getAddonName();
		console.log ( 		 name);
		let lis = await messenger.Utilities.isLicensed();		 
		console.log ( 		 lis);
		let ver = await messenger.Utilities.getAddonVersion();	
		console.log ( 		 ver);	
	}


addEventListener("click", async (event) => {
	if (event.target.id.startsWith("register")) {
	console.log ( messenger.Utilities.isLicensed()  );
	messenger.Utilities.openLinkExternally("http://sites.fastspring.com/quickfolders/product/quickfolders?referrer=landing-update");
	}
  });


  addEventListener("click", async (event) => {
	if (event.target.id.startsWith("donate")) {

	  messenger.Utilities.openLinkExternally("http://quickfolders.org/donate.html");
	}
  });  


  loglic();



