import test from "node:test";
import assert from "node:assert/strict";
import { deriveActions, buildCheckoutURL, buildDomainSeatsURL } from "../html/registration/model.mjs";
import { registrationConfig as config } from "../html/registration/config.mjs";
import { loadRegistrationData } from "../html/registration/adapter.mjs";
import { resolveFeatureRequirement } from "../scripts/feature-licensing.mjs";

const license = (status, keyType, licenseKey = "QF;user+test@example.com&key") => ({ status, keyType, licenseKey, licensedDaysLeft: 90 });
const contact = { firstName: "Alex", lastName: "Morgan", email: "alex@example.com" };

test("Standard extension requires proximity or explicit intent", () => {
  const state = license("Valid", 2);
  assert.equal(deriveActions(state, config)[0].hidden, true);
  assert.equal(deriveActions(state, config, { intent: "extend" })[0].kind, "extend");
  assert.equal(deriveActions(state, config)[1].kind, "upgrade");
});

test("Pro-only feature offers Pro and Domain but hides Standard", () => {
  const state = { status: "Empty", licenseKey: "" };
  const actions = deriveActions(state, config, { requiredEdition: "pro" });
  assert.equal(actions[0].hidden, true);
  assert.equal(actions[0].available, false);
  assert.equal(actions[1].hidden, false);
  assert.equal(actions[2].hidden, false);
  assert.equal(deriveActions(state, config)[0].hidden, false);
});

test("feature matrix uses contextual requirements for variable limits", () => {
  assert.equal(resolveFeatureRequirement("lineBreaks"), "pro");
  assert.equal(resolveFeatureRequirement("pasteFolderEntries"), "standard");
  assert.equal(resolveFeatureRequirement("lineBreaks", "standard"), "standard");
  assert.equal(resolveFeatureRequirement("tabs>10", "pro"), "pro");
  assert.equal(resolveFeatureRequirement("tabs>10", "standard"), "standard");
  assert.equal(resolveFeatureRequirement("toString"), "");
});

test("expired Standard renews the Standard product and offers Pro upgrade", () => {
  const actions = deriveActions(license("Expired", 2), config);
  assert.equal(actions[0].route, config.products.standard.renew);
  assert.equal(actions[1].route, config.products.upgrade);
});

test("existing keys always take precedence and query encoding round trips", () => {
  const state = license("Expired", 2);
  const action = deriveActions(state, config)[2];
  const url = buildCheckoutURL(action, contact, state, config, "tabs>5");
  assert.equal(url.searchParams.get("referrer"), state.licenseKey);
  const fresh = { status: "Empty", licenseKey: "" };
  assert.equal(buildCheckoutURL(deriveActions(fresh, config)[1], contact, fresh, config, "tabs>5").searchParams.get("referrer"), "tabs>5");
});

test("Domain renewal is distinguished from a separate Pro purchase", () => {
  const actions = deriveActions(license("Valid", 1), config);
  assert.equal(actions[0].hidden, true);
  assert.equal(actions[1].kind, "buy");
  assert.equal(actions[2].kind, "renew");
});

test("additional seats pass only the licensed domain", () => {
  const base = "https://sites.fastspring.com/quickfolders/product/quickfolders_domainseat";
  const url = buildDomainSeatsURL(base, { email: "*@example.com", licenseKey: "SECRET" });
  assert.equal(url.searchParams.get("referrer"), "domain:example.com");
  assert.ok(!url.href.includes("SECRET"));
  assert.equal(buildDomainSeatsURL(url, { email: "" }).searchParams.has("referrer"), false);
});

test("registration loads background license and default account identity", async () => {
  const identity = { id: "id1", name: "Alex Morgan", email: "alex@example.com" };
  const api = {
    runtime: { sendMessage: async ({ command }) => command === "getLicenseInfo"
      ? license("Valid", 2) : { forceSecondaryIdentity: false } },
    accounts: { list: async () => [{ id: "account1", name: "Personal", identities: [identity] }] },
    identities: { getDefault: async () => identity },
  };
  const data = await loadRegistrationData(api);
  assert.equal(data.license.status, "Valid");
  assert.equal(data.identities[0].email, identity.email);
  api.runtime.sendMessage = async () => undefined;
  await assert.rejects(loadRegistrationData(api), /unavailable/);
});
