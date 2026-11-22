/**
 * Open or reuse the modern license-registration tab from the background context.
 *
 * All normal registration entry points should use this helper, directly from
 * background code or through the openRegistrationTab runtime request. Legacy
 * chrome callers use the existing background bridge for the same operation.
 * The emergency legacy menu intentionally opens register.xhtml instead.
 *
 * Build the page URL with runtime.getURL() here so installed extensions use a
 * moz-extension: URL rather than a privileged chrome: or jar: package URL.
 * Find an existing registration tab regardless of its previous query string,
 * then activate and navigate it with the current options. This replaces stale
 * feature, intent and synthetic-scenario parameters. Otherwise create a tab.
 * Focus the tab's owning window as well: activating a tab alone does not bring
 * Thunderbird's main window in front of a separate composer window.
 *
 * @param {object} api - Thunderbird MailExtension API (browser or messenger).
 *   Requires runtime.getURL, tabs.query/create/update and windows.update.
 *   Passed explicitly so unit tests can supply a fake API without Thunderbird;
 *   production code could otherwise use the background's browser global.
 * @param {object} [options={}] - Context for this registration visit.
 * @param {string} [options.feature=""] - Originating feature or entry point,
 *   such as "licenseTab", "MAX_STANDARD_CATEGORIES", "landing-update", or a
 *   pipe-separated list of composer features. Passed as the feature query
 *   parameter; new-license checkout may use it as the shop referrer. Renewals
 *   and upgrades use the existing license key instead. Empty/non-string values
 *   are omitted. URLSearchParams handles encoding; supply the raw string.
 * @param {string} [options.intent=""] - Explicit purchase intent. Only "extend"
 *   is forwarded, revealing Standard extension even outside its default offer
 *   window. This does not purchase anything or change license eligibility.
 *   Empty or unsupported values leave normal action selection in effect.
 * @returns {Promise<object>} The created or updated Thunderbird Tab object.
 *   The caller may close its initiating Settings/splash page after receiving a
 *   valid tab ID. This helper never closes the source page or the composer.
 * @throws {Error} Propagates URL, tab or window-focus failures. Callers must retain their
 *   source page if opening fails. Success confirms tab creation/navigation,
 *   not completion of page loading or checkout.
 */
export async function openRegistrationTab(api, { feature = "", intent = "" } = {}) {
  const baseURL = api.runtime.getURL("html/registration/registration.html");
  const destination = new URL(baseURL);
  if (typeof feature === "string" && feature) {
    destination.searchParams.set("feature", feature);
  }
  if (intent === "extend") {
    destination.searchParams.set("intent", intent);
  }
  const url = destination.href;
  const [existing] = await api.tabs.query({ url: baseURL + "*" });
  const tab = existing
    ? await api.tabs.update(existing.id, { active: true, url })
    : await api.tabs.create({ active: true, url });
  await api.windows.update(tab.windowId, { focused: true });
  return tab;
}

// Run in Settings: retain the source tab if opening registration fails.
export async function openRegistrationFromSettings(api, options = {}) {
  const settingsTab = await api.tabs.getCurrent();
  const registrationTab = await api.runtime.sendMessage({ command: "openRegistrationTab", ...options });
  if (!Number.isInteger(registrationTab?.id)) {
    throw new Error("Registration tab did not open");
  }
  if (Number.isInteger(settingsTab?.id) && settingsTab.id !== registrationTab.id) {
    await api.tabs.remove(settingsTab.id);
  }
  return registrationTab;
}
