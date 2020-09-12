
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



addEventListener("load", async (event) => {
	debugger;
	let text= document.body.innerHTML;//	console.log (document.body.innerText);
	let htmltext=text.replace(/{addon}/g, await browser.runtime.getManifest().name );//messenger.Utilities.getAddonName());
	let  htmltext2=htmltext.replace(/{version}/g, await messenger.Utilities.getAddonVersion()); //oder: browser.runtime.getManifest().version
	htmltext=htmltext2.replace(/{appver}/g, await messenger.Utilities.getTBVersion());
		//same for license,   let htmltext=text.replace(/{addon}/g, await messenger.Utilities.getAddonName());
		document.body.innerHTML=htmltext;

  });  

  loglic();



