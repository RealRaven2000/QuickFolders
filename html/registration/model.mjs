const editionsByKey = { 0: "pro", 1: "domain", 2: "standard" };

export function licenseEdition(license) {
  return editionsByKey[license.keyType] || null;
}

export function deriveActions(license, config, { intent = "", requiredEdition = "" } = {}) {
  const current = licenseEdition(license);
  const recognized = ["Valid", "Expired"].includes(license.status) && current;
  return config.editions.map((edition) => {
    if (requiredEdition === "pro" && edition === "standard") {
      return { edition, kind: "buy", route: null, available: false, hidden: true };
    }
    let kind = "buy";
    let route = config.products[edition].buy;
    let available = true;
    if (recognized && edition === current) {
      kind = license.status === "Expired" || edition === "domain" ? "renew" : "extend";
      route = config.products[edition].renew;
      if (edition === "standard" && kind === "extend" &&
          license.licensedDaysLeft >= config.extensionPromptDays && intent !== "extend") {
        kind = "current";
        available = false;
        return { edition, kind, route: null, available, hidden: true };
      }
    } else if (recognized && current === "standard" && edition === "pro") {
      kind = "upgrade";
      route = config.products.upgrade;
      // Match the existing dialog: valid and expired Standard use this product.
    } else if (recognized && current === "domain" && edition === "pro") {
      // A separate personal license, never a renewal using the Domain key.
      kind = "buy";
      route = config.products.pro.buy;
    } else if (recognized && edition === "domain") {
      // Personal-license holders buy a new Domain license, even when expired.
      kind = "buy";
      route = config.products.domain.buy;
    } else if (recognized) {
      // Do not silently purchase a downgrade using the existing license key.
      return { edition, kind: "buy", route: null, available: false, hidden: true };
    }
    return { edition, kind, route, available, hidden: false };
  });
}

export function selectIdentities(accounts, defaults, license, forceSecondaryIdentity = false) {
  const choices = [];
  let secondaryAdded = false;
  for (const account of accounts) {
    const identities = account.identities || [];
    const primary = defaults[account.id];
    if (forceSecondaryIdentity && license.keyType !== 1 && !secondaryAdded) {
      const secondary = identities.find((identity) => identity.email &&
        identity.email.toLowerCase() === license.email?.toLowerCase() && identity.id !== primary?.id);
      if (secondary) {
        choices.push({ ...secondary, accountName: account.name });
        secondaryAdded = true;
      }
    }
    const eligible = primary ? [primary] : identities;
    for (const identity of eligible) {
      if (identity.email && !choices.some((choice) => choice.id === identity.id)) {
        choices.push({ ...identity, accountName: account.name });
      }
    }
  }
  return choices;
}

export function identityOptionLabels(identities) {
  const bases = identities.map((identity) => `${identity.accountName} · ${identity.email}`);
  const keys = bases.map((base) => base.toLowerCase());
  const labels = identities.map((identity, index) => {
    const duplicated = keys.some((key, other) => other !== index && key === keys[index]);
    return duplicated ? `${bases[index]} (${identity.name?.trim() || identity.id})` : bases[index];
  });
  return labels.map((label, index) => {
    const duplicated = labels.some((other, otherIndex) => otherIndex !== index && other === label);
    return duplicated ? `${bases[index]} (${identities[index].name?.trim() || ""} · ${identities[index].id})` : label;
  });
}

export function contactFromIdentity(identity) {
  const parts = (identity.name || "").replace(/\([^)]*\)/g, "").trim().split(/\s+/);
  return {
    email: identity.email || "",
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts.at(-1) : "",
  };
}

export function buildDomainSeatsURL(baseURL, license) {
  const url = new URL(baseURL);
  url.searchParams.delete("referrer");
  const match = typeof license.email === "string"
    ? /^[^@\s]+@([^@\s]+)$/.exec(license.email.trim())
    : null;
  if (match) {
    url.searchParams.set("referrer", `domain:${match[1]}`);
  }
  return url;
}

export function buildCheckoutURL(action, contact, license, config, originatingFeature = "") {
  if (!action.available || !action.route) {
    throw new Error("Unconfirmed checkout action");
  }
  const url = new URL(action.route, config.shopBase);
  url.searchParams.set("contact_fname", contact.firstName);
  url.searchParams.set("contact_lname", contact.lastName);
  url.searchParams.set("contact_email", contact.email);
  const needsKey = ["renew", "extend", "upgrade"].includes(action.kind);
  const referrer = license.licenseKey || originatingFeature;
  if (needsKey && !license.licenseKey) {
    throw new Error("Missing previous license for checkout");
  }
  if (referrer) {
    url.searchParams.set("referrer", referrer);
  }
  return url;
}
