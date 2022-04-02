/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */

async function updateActions(addonName) { 
  let endSale = new Date("2022-04-15"), // Next Sale End Date
      currentTime = new Date();
      
  // Currently we do not notify this page if the license information is updated in the background.
  let licenseInfo = await messenger.runtime.sendMessage({command:"getLicenseInfo"});
  // LICENSING FLOW
  let isExpired = licenseInfo.isExpired,
      isValid = licenseInfo.isValid,
      isProUser = (licenseInfo.keyType == 0 || licenseInfo.keyType == 1),
      isStandard = (licenseInfo.keyType==2);
  
  function hide(id) {
    let el = document.getElementById(id);
    if (el) {
      el.setAttribute('collapsed',true);
      return el;
    }
    return null;
  }
  function hideSelectorItems(cId) {
    let elements = document.querySelectorAll(cId);
		for (let el of elements) {
      el.setAttribute('collapsed',true);
		}	    
  }
  function show(id) {
    let el = document.getElementById(id);
    if (el) {
      el.setAttribute('collapsed',false);
      return el;
    }
    return null;
  }
  function showSelectorItems(cId) {
    let elements = document.querySelectorAll(cId);
		for (let el of elements) {
      el.setAttribute('collapsed',false);
    }
  }
  // renew-your-license - already collapsed
  // renewLicenseListItem - already collapsed
  // purchaseLicenseListItem - not collapsed
  hide('licenseExtended');
  
  let isActionList = true;
  let overrideSale = await messenger.LegacyPrefs.getPref("extensions.quickfolders.debug.saleDate");
  if (overrideSale) endSale = overrideSale;
  
  let isSale = (currentTime < endSale);

  hideSelectorItems('.donations');
  
  if (isValid || isExpired) {
    hide('purchaseLicenseListItem');
    hide('register');
    hide('new-licensing'); // hide box that explains new licensing system..
    
    if (isExpired) { // License Renewal
      hide('extendLicenseListItem');
      hide('extend');
      show('renewLicenseListItem');
      show('renew');
    }
    else { // License Extension
      hide('renewLicenseListItem');
      hide('renew');
			let gpdays = licenseInfo.licensedDaysLeft;
      if (gpdays < 20) { // they may have seen this popup. Only show extend License section if it is < 20 days away
        show('extendLicenseListItem');
        show('extend');
      }
      else {
        show('licenseExtended');
        hide('time-and-effort');
        hide('purchaseHeader');
        hide('whyPurchase');
        hide('extendLicenseListItem');
        hide('extend');
        let animation = document.getElementById('gimmick');
        if (animation)
          animation.parentNode.removeChild(animation);

        isActionList = false;
      }
      if(isStandard) {
        hide('licenseExtended');
        let regBtn = show('register');
        regBtn.innerText = messenger.i18n.getMessage("qf.notification.premium.btn.upgrade");
      }
    }
  }
  else { // no license at all
    

  }
  
  if (isSale) {
    if (!isValid) { // not shown with Standard license either.
      if (isExpired) { 
        if (isStandard)
          show('specialOfferUpgrade');
        else
          show('specialOfferRenew');
      }
      else
        show('specialOffer');
      hideSelectorItems('.donations');
      hide('whyPurchase');
      isActionList = false;
    }
    else if (isStandard) {
      show('specialOfferUpgrade');
      hideSelectorItems('.donations');
      hide('whyPurchase');
      isActionList = false;
    }
  }

  if (!isActionList) {
    hide('actionBox');
  }

  // resize to contents if necessary...
  let win = await browser.windows.getCurrent(),
      wrapper = document.getElementById('innerwrapper'),
      r = wrapper.getBoundingClientRect(),
      newHeight = Math.round(r.height) + 80,
      maxHeight = window.screen.height;

  let { os } = await messenger.runtime.getPlatformInfo(); // mac / win / linux
  wrapper.setAttribute("os", os);
     
  if (newHeight>maxHeight) newHeight = maxHeight-15;
  browser.windows.update(win.id, 
    {height: newHeight}
  );
}