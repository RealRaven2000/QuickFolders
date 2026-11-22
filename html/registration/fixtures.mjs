// Synthetic data only. Select via ?scenario=expired-standard, valid-pro, etc.
export function fixtureData(scenario) {
  const [status, edition] = scenario.split("-");
  const keyType = { standard: 2, pro: 0, domain: 1 }[edition];
  const license = {
    status: status === "valid" ? "Valid" : status === "expired" ? "Expired" : "Empty",
    keyType,
    expiryDate: status === "expired" ? "2026-11-11" : "2027-11-11",
    licensedDaysLeft: status === "expired" ? 0 : 360,
    licenseKey: keyType === undefined ? "" : "SYNTHETIC-TEST-KEY",
    email: "alex@example.com",
  };
  return {
    license,
    identities:
      scenario === "no-identities"
        ? []
        : [
            {
              id: "fixture-personal",
              name: "Alex Morgan",
              email: "alex@example.com",
              accountName: "Personal",
            },
            {
              id: "fixture-unicode",
              name: "Éva María García",
              email: "eva@studio.example",
              accountName: "Work",
            },
          ],
  };
}
