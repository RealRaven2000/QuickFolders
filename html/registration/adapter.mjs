import { selectIdentities } from "./model.mjs";

export async function loadRegistrationData(api = messenger) {
  const [license, accounts, preferences] = await Promise.all([
    api.runtime.sendMessage({ command: "getLicenseInfo" }),
    api.accounts.list(false),
    api.runtime.sendMessage({ command: "getRegistrationPreferences" }),
  ]);
  if (!license || typeof license.status !== "string" || !preferences || preferences.storageUnavailable) {
    throw new Error("License information unavailable");
  }
  const defaults = Object.fromEntries(
    await Promise.all(
      accounts.map(async (account) => [
        account.id,
        await api.identities.getDefault(account.id),
      ])
    )
  );
  return {
    license,
    identities: selectIdentities(accounts, defaults, license, !!preferences?.forceSecondaryIdentity),
  };
}

export async function openLicenseSettings() {
  const registrationTab = await messenger.tabs.getCurrent();
  const settingsTab = await messenger.runtime.sendMessage({ command: "openPrefs", mode: "licenseKey" });
  if (!Number.isInteger(settingsTab?.id)) {
    throw new Error("License settings did not open");
  }
  if (Number.isInteger(registrationTab?.id) && registrationTab.id !== settingsTab.id) {
    await messenger.tabs.remove(registrationTab.id);
  }
  return settingsTab;
}
