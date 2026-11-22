import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { openRegistrationTab } from "../html/registration/open-tab.mjs";

async function notificationFixture(status, keyType, level = 0) {
  const source = await readFile(new URL("../chrome/content/quickfolders-util.js", import.meta.url), "utf8");
  const start = source.indexOf("popupRestrictedFeature: async function");
  const end = source.indexOf("\n  },", start);
  assert.ok(start >= 0 && end > start);
  const method = source.slice(start, end + 4);
  let buttons;
  const requests = [];
  const notificationBox = {
    PRIORITY_INFO_HIGH: 1,
    getNotificationWithValue: () => null,
    appendNotification: async (_key, _options, actions) => {
      buttons = actions;
      return {};
    },
  };
  const util = {
    licenseInfo: { isExpired: status === "Expired", keyType },
    hasValidLicense: () => status === "Valid",
    logDebugOptional() {},
    getBundleString: (key) => key,
    notifyTools: { notifyBackground: (request) => requests.push(request) },
  };
  const QuickFolders = {
    Util: util,
    Preferences: { getIntPref: () => 0, setIntPref: async () => {} },
  };
  const holder = vm.runInNewContext(`({${method}})`, {
    QuickFolders,
    specialTabs: { msgNotificationBar: notificationBox },
  });
  await holder.popupRestrictedFeature("tabs>5", "", level);
  return { buttons, requests };
}

test("restricted-feature notification sends its feature through the background bridge", async () => {
  for (const [status, keyType, expected] of [
    ["Empty", -1, "getLicense"], ["Valid", 2, "upgrade"], ["Expired", 0, "renewLicense"],
  ]) {
    const { buttons, requests } = await notificationFixture(status, keyType);
    assert.ok(buttons[0].label.endsWith(expected));
    buttons[0].callback();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].func, "openRegistrationTab");
    assert.equal(requests[0].feature, "tabs>5");
    assert.equal(requests[0].requiredEdition, "pro");
  }
  const standardFeature = await notificationFixture("Empty", -1, 2);
  standardFeature.buttons[0].callback();
  assert.equal(standardFeature.requests[0].requiredEdition, "standard");
  const covered = await notificationFixture("Valid", 0);
  assert.equal(covered.buttons, undefined);
});

test("background opener reuses a registration tab and replaces stale context", async () => {
  let updated;
  let focused;
  const api = {
    runtime: { getURL: (p) => `moz-extension://fixture/${p}` },
    tabs: {
      query: async () => [{ id: 7, windowId: 3 }],
      update: async (id, options) => { updated = { id, ...options }; return { id, windowId: 3 }; },
      create: async () => { throw new Error("existing tab should be reused"); },
    },
    windows: { update: async (id, options) => { focused = { id, ...options }; } },
  };
  await openRegistrationTab(api, { feature: "tabs>5", requiredEdition: "pro" });
  const url = new URL(updated.url);
  assert.equal(url.searchParams.get("feature"), "tabs>5");
  assert.equal(url.searchParams.get("required"), "pro");
  assert.equal(url.searchParams.has("intent"), false);
  assert.equal(url.searchParams.has("scenario"), false);
  assert.equal(focused.id, 3);
  await openRegistrationTab(api, { feature: "mainPopup" });
  assert.equal(new URL(updated.url).searchParams.has("required"), false);
  await openRegistrationTab(api, { feature: "tabs>5", requiredEdition: "standard" });
  assert.equal(new URL(updated.url).searchParams.get("required"), "standard");
});
