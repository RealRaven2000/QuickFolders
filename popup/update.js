/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */
// Script for splash screen displayed when updating this Extension

addEventListener("click", async (event) => {
	if (event.target.id.startsWith("register")) {
    messenger.Utilities.showLicenseDialog("splashScreen");
	}
  switch (event.target.id) {
    case "compLink":
      messenger.windows.openDefaultBrowser("https://quickfolders.org/premium.html#featureComparison");
      break;
    case "whatsNew":
      messenger.Utilities.showVersionHistory();
      break;
  }
  if (event.target.classList.contains("issue")) {
    let issueId = event.target.getAttribute("no");
    if (issueId) {
      messenger.windows.openDefaultBrowser(`https://github.com/RealRaven2000/QuickFolders/issues/${issueId}`);
    }
  }    
  
  
  if (event.target.id.startsWith("extend") || event.target.id.startsWith("renew")) {
    messenger.Utilities.showXhtmlPage("chrome://quickfolders/content/register.xhtml");
    window.close(); // not allowed by content script!
  }

	if (event.target.id.startsWith("donate")) {
    messenger.windows.openDefaultBrowser("https://quickfolders.org/donate.html#donate");
	}
});

function formatAll(id, arg=null) {
  let localizedMsg = 
    arg ? messenger.i18n.getMessage(id, arg)  : messenger.i18n.getMessage(id);
  return localizedMsg
    .replace(/\{boldStart\}/g,"<b>")
    .replace(/\{boldEnd\}/g,"</b>")
    .replace(/\{hr\}/g,"<hr>")
    .replace(/\{italicStart\}/g,"<i>")
    .replace(/\{italicEnd\}/g,"</i>")
    .replace(/\{L1\}/g,"<li>")
    .replace(/\{L2\}/g,"</li>")
    .replace(/\{P1\}/g,"<p>")
    .replace(/\{P2\}/g,"</p>")
    .replace(/\[issue (\d*)\]/g,"<a class=issue no=$1>[issue $1]</a>")
    .replace(/\[(.)\]/g,"<code class='keystroke'>$1</code>")     // single keys
    .replace(/\[(F\d*)\]/g,"<code class='keystroke'>$1</code>") // F10
    .replace(/\[(CTRL|ALT)\]/g,"<code class='keystroke'>$1</code>");  // single keys
};

addEventListener("load", async (event) => {
    const manifest = await messenger.runtime.getManifest(),
          browserInfo = await messenger.runtime.getBrowserInfo(),
          addonName = manifest.name,
          addonVer = manifest.version,
          appVer = browserInfo.version,
          remindInDays = 10;

    // internal functions
    function hideSelectorItems(cId) {
      let elements = document.querySelectorAll(cId);
      for (let el of elements) {
        el.setAttribute('collapsed',true);
      }	    
    }
    // force replacement for __MSG_xx__ entities
    // using John's helper method (which calls i18n API)
    i18n.updateDocument();
    
    let loc = window.location,
        hasMsg = loc.search && loc.search.length>1,
        msg;
    
    if (hasMsg) {
      // retrieve text  from queryString
      let qs = new URLSearchParams(window.location.search);
      msg = qs.get("msg");
      if (!msg) {
        hasMsg = false;
      }
      else console.log ("Splash screen - got a message\n" + msg);
    }
      
    let h1 = document.getElementById("heading-updated");
    if (h1) {
      // this api function can do replacements for us
      if (!hasMsg) {
        h1.innerText = messenger.i18n.getMessage("heading-updated", addonName);
      } else {
        h1.innerText = "License Supported Feature";
      }
    }
    
    if (hasMsg) {
      document.getElementById("licenseExtended").setAttribute("collapsed",true);
      document.getElementById("changesList").setAttribute("collapsed",true);
      document.getElementById("purchaseHeader").setAttribute("collapsed",true);
      hideSelectorItems('.donations');
    }
    
    let introMsg = document.getElementById('intro-msg');
    if (introMsg) {
      if (!hasMsg) {
        introMsg.innerText = messenger.i18n.getMessage("thanks-for-updating-intro", addonName);
      } else {
        introMsg.innerText = msg;
      }
    }
    
    let verInfo = document.getElementById('active-version-info');
    if (verInfo) {
      // use the i18n API      
      // You are now running <b class="versionnumber">version {version}</b> on Thunderbird {appver}.
      // for multiple replacements, pass an array
      if (hasMsg) {
        verInfo.setAttribute("collapsed",true);
      } else {
        verInfo.innerHTML = messenger.i18n.getMessage("active-version-info", [addonVer, appVer])
          .replace("{boldStart}","<b class='versionnumber'>")
          .replace("{boldEnd}","</b>");
      }
    }
    
    let timeAndEffort =  document.getElementById('time-and-effort');
    if (timeAndEffort) {
      if (hasMsg) timeAndEffort.setAttribute('collapsed',true);
      else timeAndEffort.innerText = messenger.i18n.getMessage("time-and-effort", addonName);
    }    
    
    let suggestion = document.getElementById('support-suggestion');
    if (suggestion) {
      suggestion.innerText = messenger.i18n.getMessage("support-suggestion", addonName);
    }
    
    let preference = document.getElementById('support-preference');
    if (preference) {
      preference.innerText = messenger.i18n.getMessage("support-preference", addonName);
    }
    
    let remind = document.getElementById('label-remind-me');
    if (remind) {
      remind.innerText = messenger.i18n.getMessage("label-remind-me", remindInDays);
    }
    
    
    updateSpecialOffersFields(addonName);

    let whatsNewLst = document.getElementById('whatsNewList');
    if (whatsNewLst) {
      whatsNewLst.innerHTML =  formatAll("whats-new-list");
    }

    let newsSection = document.getElementById('newsDetail');
    if (newsSection) {
      newsSection.innerHTML = formatAll("newsSection", addonName);
    }

    let ongoing = document.getElementById('ongoing-work');
    if (ongoing) {
      ongoing.innerText = messenger.i18n.getMessage("ongoing-work", addonName);
    }
    
    let title = document.getElementById('window-title');
    title.innerText = messenger.i18n.getMessage("window-title", addonName);
           
    updateActions();

    // addAnimation('body');
  });  

  addEventListener("unload", async (event) => {
    let remindMe = document.getElementById("remind").checked;
  });  





