/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */
/*
  globals
    SALES_DATE,
*/


async function getSalesEnd() {
  const overrideSale = await messenger.LegacyPrefs.getPref(
    "extensions.quickfolders.debug.saleDate"
  );
  if (overrideSale) {
    return new Date(overrideSale);
  }
  let sales_end = new Date(SALES_DATE);
  return new Date(sales_end.getTime() + 86400000);
}	



function hide(id) {
  let el = document.getElementById(id);
  if (!el) { return null; }
  el.setAttribute("collapsed", true);
  return el;
}

function hideSelectorItems(cId) {
  let elements = document.querySelectorAll(cId);
  for (let el of elements) {
    el.setAttribute("collapsed", true);
  }
}

function show(id) {
  let el = document.getElementById(id);
  if (!el) { return null; }
  el.setAttribute("collapsed", false);
  return el;
}

function formatAll(txt) {
  let localizedMsg = txt;
  return localizedMsg
    .replace(/\{boldStart\}/g, "<b>")
    .replace(/\{boldEnd\}/g, "</b>")
    .replace(/\{hr\}/g, "<hr>")
    .replace(/\{italicStart\}/g, "<i>")
    .replace(/\{italicEnd\}/g, "</i>")
    .replace(/\{U1\}/g, "<ul>")
    .replace(/\{U2\}/g, "</ul>")
    .replace(/\{L1\}/g, "<li>")
    .replace(/\{L2\}/g, "</li>")
    .replace(/\{P1(?:\s+([^}]+))?\}/g, (_, attrs) => {
      // attrs will be undefined if no class specified
      return attrs ? `<p ${attrs}>` : "<p>";
    })
    .replace(
      /\{ARelease\}/g,
      "<a href='https://blog.thunderbird.net/2025/03/thunderbird-release-channel-update/'>"
    )
    .replace(
      /\{AcompatCheck\}/g,
      "<a href='https://addons.thunderbird.net/thunderbird/addon/addon-compatibility-check/' class='native'>"
    )
    .replace(/\{P2\}/g, "</p>")
    .replace(/\{A2\}/g, "</a>")
    .replace(/\{br\}/g, "<br>")
    .replace(/\{A-findRelated\}/g, "<a href='https://quickfolders.org/premium.html#findRelated'>")
    .replace(/\{A\}/g, "</a>")
    .replace(/\[issue (\d*)\]/g, "<a class=issue no=$1 href='#'>[issue $1]</a>")
    .replace(/\[(.)\]/g, "<code class='keystroke'>$1</code>") // single keys
    .replace(/\[(F\d*)\]/g, "<code class='keystroke'>$1</code>") // F10
    .replace(/\[(CTRL|ALT)\]/g, "<code class='keystroke'>$1</code>"); // single keys
};

// eslint-disable-next-line no-unused-vars
async function insertLocalizedMessage(element, rawMessage) {
  try {
    const html = formatAll(rawMessage); // Expand custom tags into HTML
    const fragment = parseHTMLFragment(html); // Safely parse into a DocumentFragment
    element.textContent = ""; // Clear existing content

    if (!(await isSale())) {
      const salesElements = fragment.querySelectorAll(".specialOffer");
      for (const e of salesElements) {
        e.remove(); // Safely remove element from fragment
      }
    }

    element.appendChild(fragment); // Inject parsed content
  } catch (ex) {
    console.error("Failed to parse localized message:", ex);
    element.textContent = rawMessage; // Fallback: insert raw text only
  }
}

// replace unsafe innerHTML injections
// note: this will add closing tags and other markup ,e.g. <tr> or <table>
function parseHTMLFragment(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Spread childNodes to an array to avoid live list mutation issues
  const nodes = [...doc.body.childNodes];
  const fragment = document.createDocumentFragment();
  // appendChild moves nodes from doc.body to fragment (not cloned)
  nodes.forEach((node) => fragment.appendChild(node));
  return fragment;
}

// copy a html structure into [multiple] elements
// eslint-disable-next-line no-unused-vars
function updateWithSafeHtml(selector, htmlString) {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    el.textContent = "";
    el.appendChild(parseHTMLFragment(htmlString));
  }
}

async function isSale() {
  const currentTime = new Date();
  const endDate = await getSalesEnd(); // uses sales_end
  const isSale = currentTime < endDate;
  return isSale;
}


// eslint-disable-next-line no-unused-vars
async function updateActions() {
  const overrideSale = await messenger.LegacyPrefs.getPref(
    "extensions.quickfolders.debug.saleDate"
  );
  const endSale = new Date(overrideSale || SALES_DATE), // Next Sale End Date - see specialoffers.js
    currentTime = new Date();
  endSale.setDate(endSale.getDate() + 1); // add 1 day to include the last day?
  const isSale = currentTime < endSale;

  if (overrideSale) {
    console.log(
      "Debugging sales date - overwriting with test value from debug.saleDate:" + endSale
    );
  }

  // Currently we do not notify this page if the license information is updated in the background.
  const licenseInfo = await messenger.runtime.sendMessage({ command: "getLicenseInfo" });
  // LICENSING FLOW
  const isStandard = licenseInfo.keyType == 2,
    isProUser = licenseInfo.keyType == 0 || licenseInfo.keyType == 1,
    isExpired = licenseInfo.isExpired,
    isValid = licenseInfo.isValid;

  // renew-your-license - already collapsed
  // renewLicenseListItem - already collapsed
  // purchaseLicenseListItem - not collapsed
  hide("licenseExtended");

  let isActionList = true;

  if (overrideSale) {
    console.log("isSale = " + isSale);
  }

  hideSelectorItems(".donations");
  if (isProUser) {
    hideSelectorItems(".noPro");
  }

  if (isValid || isExpired) {
    hide("purchaseLicenseListItem");
    hideSelectorItems(".donations");
    hide("register");

    if (isExpired) {
      // License Renewal
      hide("extendLicenseListItem");
      hide("extend");
      show("renewLicenseListItem");
      show("renew");
      hide("purchaseHeader");
      if (isStandard) {
        show("upgrade");
      }
    } else {
      // License Extension
      hide("renewLicenseListItem");
      hide("renew");
      let gpdays = licenseInfo.licensedDaysLeft;
      if (gpdays < 20) {
        // they may have seen this popup. Only show extend License section if it is < 20 days away
        show("extendLicenseListItem");
        show("extend");
        if (isStandard) {
          show("upgrade");
        }
      } else {
        hide("news-license");
        show("licenseExtended");
        hide("time-and-effort");
        hide("purchaseHeader");
        hide("whyPurchase");
        hide("extendLicenseListItem");
        hide("extend");
        let animation = document.getElementById("gimmick");
        if (animation) {
          animation.parentNode.removeChild(animation);
        }

        isActionList = false;
      }
    }
    if (isStandard) {
      hide("licenseExtended");
      let regBtn = show("register");
      regBtn.innerText = messenger.i18n.getMessage("qf.notification.premium.btn.upgrade");
    }
  } else {
    // no license at all
  }

  if (isSale) {
    if (!isValid) {
      // not shown with Standard license either.
      if (isExpired) {
        if (isStandard) {
          show("specialOfferUpgrade");
        } else {
          show("specialOfferRenew");
        }
        document.getElementById("purchaseHeader").setAttribute("collapsed", true);
        hide("whyPurchase");
      } else {
        show("specialOffer");
      }
      hideSelectorItems(".donations");
      hide("whyPurchase");
      isActionList = false;
    } else if (isStandard) {
      show("specialOfferUpgrade");
      hideSelectorItems(".donations");
      hide("whyPurchase");
      isActionList = false;
    } else if (licenseInfo.licensedDaysLeft <= 10) {
      show("specialOfferRenew");
      hide("purchaseSection");
      document.getElementById("purchaseHeader").setAttribute("collapsed", true);
      hide("whyPurchase");
    }
  }

  if (!isActionList) {
    hide("actionBox");
    hide("purchaseHeader");
  }

  // make sure add-on links stay in Thunderbird! (<a class=native>)
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.native");
    if (link) {
      event.preventDefault();
      browser.tabs.create({ url: link.href });
      link.classList.add("link-visited"); // [issue 592]
      // Find or create the status span next to the link
      let status = link.nextElementSibling;
      if (!status || !status.classList.contains("link-visited")) {
        status = document.createElement("span");
        status.className = "link-visited";
        link.parentNode.insertBefore(status, link.nextSibling);
      }
      status.textContent = " " + messenger.i18n.getMessage("message.linkInTab");
    }
  });

  // resize to contents if necessary...
  let win = await browser.windows.getCurrent();
  let wrapper = document.getElementById("innerwrapper"),
    r = wrapper.getBoundingClientRect(),
    newHeight = Math.round(r.height) + 80,
    maxHeight = window.screen.height;

  let { os } = await messenger.runtime.getPlatformInfo(); // mac / win / linux
  wrapper.setAttribute("os", os);

  if (newHeight > maxHeight) {
    newHeight = maxHeight - 15;
  }
  browser.windows.update(win.id, { height: newHeight });
}