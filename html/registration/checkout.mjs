import { buildCheckoutURL } from "./model.mjs";

export async function openCheckout(
  { action, contact, license, config, originatingFeature = "", preview = false },
  api
) {
  const url = buildCheckoutURL(action, contact, license, config, originatingFeature);
  if (preview) {
    return false;
  }
  await api.windows.openDefaultBrowser(url.href);
  return true;
}
