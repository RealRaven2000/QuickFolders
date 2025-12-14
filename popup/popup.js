/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

/* shared module for installation popups */
/*
  globals
    SALE_END_DATE
*/


async function getSalesEnd() {
  const overrideSale = await messenger.LegacyPrefs.getPref(
    "extensions.quickfolders.debug.saleDate"
  );
  if (overrideSale) {
    return new Date(overrideSale);
  }
  let sales_end = new Date(SALE_END_DATE);
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
  el.removeAttribute("collapsed");
  return el;
}

function formatAll(txt) {
  if (!txt) {
    return "";
  }
  let localizedMsg = txt
    .replace(/\{bold\}/g, "<b>")
    .replace(/\{\/bold\}/g, "</b>")
    .replace(/\{b\}/g, "<b>")
    .replace(/\{\/b\}/g, "</b>")
    .replace(/\{italic\}/g, "<i>")
    .replace(/\{\/italic\}/g, "</i>")
    .replace(/\{emph\}/g, "<span class='important'>")
    .replace(/\{\/emph\}/g, "</span>")
    .replace(/\{hr\}/g, "<hr>")
    .replace(/\{U\}/g, "<ul>")
    .replace(/\{\/U\}/g, "</ul>")
    .replace(/\{L(?:\s+([^}]+))?\}/g, (_, attrs) => (attrs ? `<li ${attrs}>` : "<li>"))
    .replace(/\{\/L\}/g, "</li>")
    .replace(/\{P(?:\s+([^}]+))?\}/g, (_, attrs) => (attrs ? `<p ${attrs}>` : "<p>"))
    .replace(/\{\/P\}/g, "</p>")
    .replace(
      /\{ARelease\}/g,
      "<a href='https://blog.thunderbird.net/2025/03/thunderbird-release-channel-update/'>"
    )
    .replace(
      /\{AcompatCheck\}/g,
      "<a href='https://addons.thunderbird.net/thunderbird/addon/addon-compatibility-check/' class='native'>"
    )
    .replace(/\{A2\}/g, "</a>")
    .replace(/\{A-findRelated\}/g, "<a href='https://quickfolders.org/premium.html#findRelated'>")
    .replace(/\{A\}/g, "</a>")
    .replace(/\{br\}/g, "<br>")
    .replace(/\[Bugzilla (\d*)\]/g, "<a class='bugzilla' no='$1' href='#'>[Bugzilla $1]</a>")
    .replace(/\[issue (\d*)\]/g, "<a class=issue no=$1 href='#'>[issue $1]</a>")
    .replace(/\[(.)\]/g, "<code class='keystroke'>$1</code>")
    .replace(/\[(F\d*)\]/g, "<code class='keystroke'>$1</code>")
    .replace(/\[(CTRL|ALT)\]/g, "<code class='keystroke'>$1</code>");
  return localizedMsg;
}


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
  const endSale = new Date(overrideSale || SALE_END_DATE), // Next Sale End Date - see specialoffers.js
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
      hide("news-license");
      let gpdays = licenseInfo.licensedDaysLeft;
      if (gpdays < 20) {
        // they may have seen this popup. Only show extend License section if it is < 20 days away
        show("extendLicenseListItem");
        const renewLicenseText = document.getElementById("renewLicenseText");
        renewLicenseText.innerText =
          messenger.i18n.getMessage("qf.premium.renew", [gpdays]);
        show("extend");
        if (isStandard) {
          show("upgrade");
        }
      } else {
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

// Updates the element's content without triggering announcements by screen readers
// eslint-disable-next-line no-unused-vars
function ariaPoliteUpdate(el, text, isHtml = false) {
  if (!el) {return;}
  
  // Temporarily set the aria-live attribute to "polite"
  el.setAttribute("aria-live", "polite");

  // Update content based on whether it's HTML or plain text
  if (isHtml) {
    el.textContent = ""; // clear existing
    const fragment = parseHTMLFragment(text);
    el.appendChild(fragment);
  } else {
    el.innerText = text;
  }

  // Remove the aria-live attribute after the update
  el.removeAttribute("aria-live");
}

// eslint-disable-next-line no-unused-vars
function addAriaHint() {
  const splashHint = document.getElementById("splash-hint");
  // Temporarily remove aria-hidden to make the hint accessible for screen readers
  splashHint.removeAttribute("aria-hidden");

  setTimeout(() => {
    splashHint.textContent = `${browser.i18n.getMessage("aria.escape")}`;

    // Optionally, re-hide it after a brief time if it's not meant to stay visible
    setTimeout(() => {
      splashHint.setAttribute("aria-hidden", "true");
    }, 3000); // Adjust delay time as needed
  }, 300); // Slight delay to let the title be read first
}
