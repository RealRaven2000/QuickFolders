/* globals formatAll, parseHTMLFragment, formatLocalizedMarkdown */
import { registrationConfig } from "./config.mjs";
import { resolveFeatureRequirement } from "../../scripts/feature-licensing.mjs";
import { buildDomainSeatsURL, contactFromIdentity, deriveActions, identityOptionLabels, licenseEdition } from "./model.mjs";
import { openCheckout } from "./checkout.mjs";
import { loadRegistrationData, openLicenseSettings } from "./adapter.mjs";
import { fixtureData } from "./fixtures.mjs";
import { localizePage, message, replaceLabelGlyphs } from "./localization.mjs";

const byId = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const scenario = params.get("scenario");
const selection = byId("selection-panel");
const terms = byId("terms-panel");
const toggle = byId("toggle-terms");
const workspace = document.querySelector(".workspace");
const feedback = byId("feedback");
const emailHelp = byId("email-help");
const emailHelpButton = byId("email-help-button");
let data;
let actions = [];
let loading = true;
let refreshInProgress = false;
let lastPurchaseButton;

function showFeedback(text) {
  feedback.textContent = text;
  feedback.hidden = false;
}

function closeEmailHelp(restoreFocus = false) {
  emailHelp.hidden = true;
  emailHelpButton.setAttribute("aria-expanded", "false");
  if (restoreFocus) {
    emailHelpButton.focus();
  }
}

function showTerms(showingTerms) {
  closeEmailHelp();
  terms.hidden = !showingTerms;
  selection.hidden = showingTerms;
  document.querySelector(".license-summary").hidden = showingTerms;
  byId("terms-breadcrumb").hidden = !showingTerms;
  toggle.setAttribute("aria-expanded", String(showingTerms));
  workspace.classList.toggle("terms-open", showingTerms);
  byId("step-label").textContent = message(showingTerms ? "terms.label" : "selection.label");
  byId("view-title").textContent = message(showingTerms ? "terms.heading" : "selection.heading");
  const key = showingTerms ? "terms.hide" : "terms.show";
  toggle.textContent = message(key);
  replaceLabelGlyphs(toggle);
  feedback.hidden = true;
  byId("personal-license-details").classList.remove("license-detail-highlight");
}

function selectIdentity() {
  const identity = data.identities.find((item) => item.id === byId("identity").value);
  if (!identity) {
    return;
  }
  const contact = contactFromIdentity(identity);
  byId("email").value = contact.email;
  byId("first-name").value = contact.firstName;
  byId("last-name").value = contact.lastName;
}

function renderIdentities(fillContact) {
  const select = byId("identity");
  const previous = select.value;
  const labels = identityOptionLabels(data.identities);
  select.replaceChildren();
  for (const [index, identity] of data.identities.entries()) {
    select.add(
      new Option(
        labels[index],
        identity.id
      )
    );
  }
  select.disabled = !data.identities.length;
  if (!data.identities.length) {
    select.add(new Option(message("identity.empty"), ""));
  } else if (data.identities.some((identity) => identity.id === previous)) {
    select.value = previous;
  }
  byId("identity-note").textContent = message("identity.none");
  byId("identity-note").hidden = !!data.identities.length;
  if (fillContact) {
    selectIdentity();
  }
}

function renderLicense() {
  const license = data.license;
  const edition = licenseEdition(license);
  const recognized = ["Valid", "Expired"].includes(license.status) && edition;
  byId("current-license").textContent = recognized
    ? edition === "domain"
      ? message("license.domain")
      : message("license.edition", [message("edition." + edition)])
    : message("license.none");
  byId("license-status").textContent =
    message("status." + license.status) || message("status.Unknown");
  const expiryWarning = byId("license-expiry-warning");
  // Match the toolbar's impending-expiry warning window and localized label.
  const showExpiryWarning =
    license.status === "Valid" && license.licensedDaysLeft < 15;
  expiryWarning.hidden = !showExpiryWarning;
  expiryWarning.textContent = showExpiryWarning
    ? message("license.expiresIn", [String(license.licensedDaysLeft)])
    : "";
  document
    .querySelector(".license-summary")
    .classList.toggle("valid-license", license.status === "Valid");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(license.expiryDate || "")
    ? new Date(license.expiryDate + "T12:00:00")
    : null;
  const formatted =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), { dateStyle: "long" }).format(date)
      : "";
  byId("license-date").textContent =
    recognized && formatted
      ? message(license.status === "Expired" ? "date.expired" : "date.valid", [formatted])
      : message("date.none");
  const requiredEdition = resolveFeatureRequirement(params.get("feature"), params.get("required"));
  actions = deriveActions(license, registrationConfig, { intent: params.get("intent"), requiredEdition });
  byId("selection-intro").textContent = message(requiredEdition === "pro" ? "subtitle" : "selection.intro");
  const expiredStandard = recognized && edition === "standard" && license.status === "Expired";
  const validStandard = recognized && edition === "standard" && license.status === "Valid";
  selection.classList.toggle("standard-upgrade-tip", !!(expiredStandard || validStandard));
  byId("renewal-hint").classList.toggle("localizedFormatting", !!(expiredStandard || validStandard));
  byId("renewal-hint").textContent = message(expiredStandard ? "renewal.expiredStandardHint" : validStandard ? "renewal.standardUpgradeHint" : "renewal.hint");
  if (expiredStandard || validStandard) {
    formatLocalizedMarkdown(byId("renewal-hint"));
  }
  const domainHolder = recognized && edition === "domain";
  byId("domain-pro-warning").hidden = !domainHolder;
  byId("domain-seats-note").hidden = !domainHolder;
  if (domainHolder) {
    const seatsLink = byId("domain-seats-note").querySelector("a");
    seatsLink.href = buildDomainSeatsURL(seatsLink.href, license).href;
  }
  for (const action of actions) {
    const card = document.querySelector(`.plan[data-edition="${action.edition}"]`);
    card.hidden = action.hidden;
    const button = card.querySelector(".purchase");
    const primary = action.edition === (domainHolder ? "domain" : "pro");
    const renewStandard = action.edition === "standard" &&
      (action.kind === "renew" || (action.kind === "extend" && params.get("intent") === "extend"));
    card.classList.toggle("featured", primary);
    button.classList.toggle("primary", primary || renewStandard);
    button.classList.toggle("secondary", !primary && !renewStandard);
    button.classList.toggle("renewal-emphasis", renewStandard);
    if (domainHolder && action.edition === "pro") {
      button.setAttribute("aria-describedby", "domain-pro-warning");
    }
    button.dataset.action = action.kind;
    button.disabled = loading || !action.available;
    button.querySelector(".action-label").textContent = action.kind === "buy" && action.edition === "domain"
      ? message("action.buyDomain")
      : message(
      "action." + action.kind,
      ["renew", "extend"].includes(action.kind) ? [] : [message("edition." + action.edition)]
    );
    if (["renew", "extend"].includes(action.kind) || ((expiredStandard || validStandard) && action.kind === "upgrade")) {
      button.setAttribute("aria-describedby", "renewal-hint");
    } else if (!(domainHolder && action.edition === "pro")) {
      button.removeAttribute("aria-describedby");
    }
  }
  document
    .querySelector(".plans")
    .style.setProperty("--plan-columns", actions.filter((action) => !action.hidden).length);
}

localizePage();
if (scenario) {
  byId("checkout-mode-note").textContent = message("fixture.checkoutNote");
}
showTerms(false);
byId("compare-editions").href = registrationConfig.comparisonURL;
for (const link of [byId("compare-editions"), byId("domain-seats-note").querySelector("a")]) {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (scenario && link.closest("#domain-seats-note")) {
      showFeedback(message("fixture.checkoutNote"));
      return;
    }
    try {
      await messenger.windows.openDefaultBrowser(link.href);
    } catch {
      showFeedback(message("checkout.error"));
    }
  });
}

toggle.addEventListener("click", () => {
  showTerms(terms.hidden);
  byId("license-section-heading").focus({ preventScroll: true });
  window.scrollTo({
    top: Math.max(0, window.scrollY + workspace.getBoundingClientRect().top - 24),
    behavior: "auto",
  });
});
byId("terms-back").addEventListener("click", () => toggle.click());
emailHelpButton.addEventListener("click", () => {
  const opening = emailHelp.hidden;
  emailHelp.hidden = !opening;
  emailHelpButton.setAttribute("aria-expanded", String(opening));
});
byId("email-help-close").addEventListener("click", () => closeEmailHelp(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !emailHelp.hidden) {
    event.preventDefault();
    closeEmailHelp(true);
  }
});
document.addEventListener("click", (event) => {
  if (!emailHelp.hidden && !event.target.closest(".email-field")) {
    closeEmailHelp();
  }
});
byId("email-learn-more").addEventListener("click", (event) => {
  event.preventDefault();
  showTerms(true);
  const details = byId("personal-license-details");
  details.classList.add("license-detail-highlight");
  details.focus({ preventScroll: true });
  details.scrollIntoView({ behavior: "auto", block: "center" });
});
byId("renewal-learn-more").addEventListener("click", (event) => {
  event.preventDefault();
  const details = byId("renewal-details");
  const opening = details.hidden;
  details.hidden = !opening;
  event.currentTarget.setAttribute("aria-expanded", String(opening));
  event.currentTarget.textContent = message(opening ? "showLess" : "learnMore");
});
byId("identity").addEventListener("change", selectIdentity);

document.querySelectorAll(".purchase").forEach((button) => {
  button.addEventListener("click", async () => {
    byId("checkout-notice").hidden = true;
    const email = byId("email");
    if (!email.reportValidity()) {
      return;
    }
    const action = actions.find((item) => item.edition === button.dataset.edition);
    if (!action?.available) {
      showFeedback(message("checkout.unconfirmed"));
      return;
    }
    const contact = {
      email: email.value,
      firstName: byId("first-name").value,
      lastName: byId("last-name").value,
    };
    button.disabled = true;
    try {
      const opened = await openCheckout(
        {
          action,
          contact,
          license: data.license,
          config: registrationConfig,
          originatingFeature: params.get("feature") || "",
          preview: !!scenario,
        },
        messenger
      );
      const noticeContent = byId("checkout-notice-content");
      noticeContent.textContent = (
        opened
          ? message("checkout.opened")
          : message("checkout.preview", [
              button.querySelector(".action-label").textContent,
              contact.email,
            ])
      );
      if (opened) {
        const guidance = document.createElement("p");
        guidance.className = "checkout-guidance";
        guidance.appendChild(parseHTMLFragment(formatAll(message("checkout.guidance"))));
        noticeContent.appendChild(guidance);
      }
      feedback.hidden = true;
      lastPurchaseButton = button;
      byId("checkout-notice").hidden = false;
    } catch {
      showFeedback(message("checkout.error"));
    } finally {
      // Retain the registration tab and contact fields for another attempt.
      button.disabled = false;
    }
    const notice = byId("checkout-notice");
    (notice.hidden ? feedback : notice).scrollIntoView({ behavior: "auto", block: "nearest" });
  });
});

byId("checkout-notice-close").addEventListener("click", () => {
  byId("checkout-notice").hidden = true;
  lastPurchaseButton?.focus({ preventScroll: true });
});

byId("enter-key").addEventListener("click", async () => {
  try {
    await openLicenseSettings();
  } catch {
    showFeedback(message("settings.error"));
  }
});

async function refresh(fillContact = false) {
  if (refreshInProgress) {
    return;
  }
  refreshInProgress = true;
  try {
    if (scenario) {
      data = fixtureData(scenario);
    } else {
      // A restored tab may run before the background has registered its listener.
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          data = await loadRegistrationData();
          break;
        } catch (error) {
          if (attempt === 19) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
    loading = false;
    renderLicense();
    renderIdentities(fillContact);
    feedback.hidden = true;
  } catch {
    showFeedback(message("load.error"));
  } finally {
    refreshInProgress = false;
  }
}

// Refresh when returning from account settings, preserving manual contact edits.
window.addEventListener("focus", () => {
  void refresh(loading);
});
void refresh(true);
