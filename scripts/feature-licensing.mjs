// Registration requirements for feature-triggered purchase flows.
// The invoking feature's explicit requirement takes precedence: some limits,
// notably tabs, depend on the current license and cannot be classified by name.
export const featureLicenseRequirements = Object.freeze({
  advancedTabProperties: "pro",
  bookmarks: "pro",
  lineBreaks: "pro",
  markFolderReadAndSkip: "pro",
  tabIcons: "pro",
  tabSeparator: "pro",
  load_config: "standard",
  pasteFolderEntries: "standard",
  save_config: "standard",
  skipUnreadFolder: "standard",
});

export function resolveFeatureRequirement(feature, explicitRequirement = "") {
  if (explicitRequirement === "pro" || explicitRequirement === "standard") {
    return explicitRequirement;
  }
  if (typeof feature !== "string") {
    return "";
  }
  return Object.hasOwn(featureLicenseRequirements, feature) ? featureLicenseRequirements[feature] : "";
}
