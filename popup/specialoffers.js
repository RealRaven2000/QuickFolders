/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/*
  globals
    insertHtmlSafely
*/


/* shared module for installation and update popups */

const REDUCTION_RENEW = "20%", // 25
  REDUCTION_PRO = "33%", // 40
  REDUCTION_UPGRADE = "33%",
  // eslint-disable-next-line no-unused-vars
  SALE_END_DATE = "2025-07-08";

function getSaleEndLabel() {
  // format date based on user’s locale
  const now = new Date();
  const endSale = new Date(SALE_END_DATE);
  const includeYear = endSale.getFullYear() !== now.getFullYear();
  const dateOptions = includeYear
    ? { month: "long", day: "numeric", year: "numeric" }
    : { month: "long", day: "numeric" };
  return endSale.toLocaleDateString(messenger.i18n.getUILanguage(), dateOptions);
}

addEventListener("click", async (event) => {
  switch (event.target.id) {
    case "bargainIcon":
      // to get the bargain, go straight to offer!
      messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/quickfolders?referrer=splashScreen-bargainIcon");
      // messenger.Utilities.showLicenseDialog("splashScreen-bargainIcon");
      break;
    case "bargainRenewIcon":
    case "bargainUpgradeIcon":
      messenger.Utilities.showXhtmlPage("chrome://quickfolders/content/register.xhtml");
      window.close(); // not allowed by content script!
      break;
    case "stdLink":
      messenger.windows.openDefaultBrowser("http://sites.fastspring.com/quickfolders/product/quickfoldersstandard?referrer=splashScreen-standard");
      break;
    case "proLink":
      messenger.windows.openDefaultBrowser("https://sites.fastspring.com/quickfolders/product/quickfolders?referrer=splashScreen-standard");
      break;      
  }
});


// eslint-disable-next-line no-unused-vars
async function updateSpecialOffersFields(addonName) {
  let elements = document.querySelectorAll(".specialOfferHead"),
      txtHead = messenger.i18n.getMessage("special-offer-head", addonName),
      userName = await messenger.Utilities.getUserName();

  for (let el of elements) {
    el.textContent = txtHead;
  }	           

  let elementsSI = document.querySelectorAll(".specialOfferIntro"),
    txtSI = messenger.i18n.getMessage('special-offer-intro', addonName)
            .replace(/\{boldStart\}/g,"<b>")
            .replace(/\{boldEnd\}/g,"</b>")
            .replace("{name}", userName);
  for (let el of elementsSI) {
    insertHtmlSafely(el, txtSI, true);
  }

  let elementsC = document.querySelectorAll(".featureComparison"),
      txtComp = messenger.i18n.getMessage("licenseComparison")
        .replace(/\{linkStart\}/, "<a id='compLink'>")
        .replace(/\{linkEnd\}/, "</a>");
  for (let el of elementsC) {
    insertHtmlSafely(el, txtComp, true);
  }  

  const specialOffer = document.getElementById("specialOfferTxt");
  const endSale = getSaleEndLabel(); // localized date of sales end.
  if (specialOffer) {
    let reduction = REDUCTION_PRO;
    // note: expiry day is set in specialoffers.js "SALES_DATE" variable
    insertHtmlSafely(
      specialOffer,
      messenger.i18n
        .getMessage("special-offer-content", [endSale, reduction])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>")
        .replace(/\{linkStart\}/, "<a id='stdLink'>")
        .replace(/\{linkEnd\}/g, "</a>")
        .replace(/\{linkStartPro\}/, "<a id='proLink'>"),
      true
    );
  }
  
  const specialRenew = document.getElementById("specialOfferRenewTxt");
  if (specialRenew) {
    let reduction = REDUCTION_RENEW;
    // note: expiry day is set in specialoffers.js "SALES_DATE" variable
    insertHtmlSafely(
      specialRenew,
      messenger.i18n
        .getMessage("special-offer-renew", [endSale, reduction])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>"),
      true
    );
  }
  
  
  const specialOfferUpgrade = document.getElementById("specialOfferUpgradeTxt");
  if (specialOfferUpgrade) {
    // note: expiry day is set in popup.js "endSale" variable
    insertHtmlSafely(
      specialOfferUpgrade,
      messenger.i18n
        .getMessage("special-offer-upgrade", [endSale, REDUCTION_UPGRADE])
        .replace(/\{boldStart\}/g, "<b>")
        .replace(/\{boldEnd\}/g, "</b>")
        .replace(/\{linkStart\}/, "<a id='stdLink'>")
        .replace(/\{linkEnd\}/, "</a>"),
      true
    );
  }

}

