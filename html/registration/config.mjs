// Add-on-specific checkout routes; prices are provided by the shop.
export const registrationConfig = Object.freeze({
  editions: ["standard", "pro", "domain"],
  extensionPromptDays: 30,
  comparisonURL: "https://quickfolders.org/premium.html#featureComparison",
  shopBase: "https://sites.fastspring.com/quickfolders/",
  products: {
    standard: { buy: "instant/quickfoldersstandard", renew: "instant/quickfoldersstdrenewal" },
    pro: { buy: "instant/quickfolders", renew: "instant/quickfoldersrenew" },
    domain: { buy: "instant/quickfoldersdomain", renew: "instant/quickfoldersdomainrenewal" },
    upgrade: "product/quickfoldersupgrade",
  },
});
