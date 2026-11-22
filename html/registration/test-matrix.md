# QuickFolders registration: end-to-end test matrix

The previous quickFilters template contained results and shop paths for a different add-on. The QuickFolders checks below start unchecked.

For each case, open **QuickFolders Settings → Licenses** and check the license status and date. Stop at the shop page; no purchase is required. Check the product and contact details, and do not record real keys or personal details. Every existing license key, valid or expired, takes precedence over feature attribution in the `referrer` parameter. With no key, the originating feature is used when supplied.

## Expected QuickFolders shop paths

Paths are relative to `https://sites.fastspring.com/quickfolders/`. The first three were confirmed in the no-license test; the others are configured routes awaiting end-to-end verification.

| Action | Expected shop path |
| --- | --- |
| Buy Standard | `instant/quickfoldersstandard` |
| Renew or extend Standard | `instant/quickfoldersstdrenewal` |
| Buy Pro | `instant/quickfolders` |
| Renew or extend Pro | `instant/quickfoldersrenew` |
| Upgrade Standard to Pro | `product/quickfoldersupgrade` |
| Buy Domain | `instant/quickfoldersdomain` |
| Renew Domain | `instant/quickfoldersdomainrenewal` |
| Add Domain users | `product/quickfolders_domainseat` |

## No license

| # | Tested | Step |
| --- | --- | --- |
| 1 | [x] | From QuickFolders Settings → Licenses, click **Get License**. Registration offers Standard, Pro and Domain. |
| 2 | [x] | Select an account and edit the contact details; verify that the chosen details are passed to the shop. |
| 3 | [x] | Buy Standard opens `instant/quickfoldersstandard`. |
| 4 | [x] | Buy Pro opens `instant/quickfolders`. |
| 5 | [x] | Buy Domain opens `instant/quickfoldersdomain`. |

Observed: all three product routes opened with `options_licenseTab` as the referrer. Edited contact details reached the Pro checkout URL, including correctly encoded plus signs.

## Valid Standard license

Use a license more than 30 days from expiry.

| # | Tested | Step |
| --- | --- | --- |
| 6 | [x] | Settings offers **Upgrade to Pro**. Open it; registration offers Pro and Domain, with Standard extension hidden. |
| 7 | [x] | Return to Settings, click the valid license date, and check that **Extend License** appears. |
| 8 | [x] | Click **Extend License**. Registration shows Standard extension in orange and Pro upgrade in green. |
| 9 | [x] | Standard extension opens `instant/quickfoldersstdrenewal` with the existing key as referrer. |
| 10 | [x] | Pro upgrade opens `product/quickfoldersupgrade` with the existing key as referrer. |

Observed: Settings offered Upgrade to Pro; registration displayed Pro and Domain. Clicking the date exposed Extend License; registration then highlighted Standard extension in orange and Pro upgrade in green. Standard extension, Pro upgrade and Domain purchase opened their configured routes with the existing license as referrer.

## Standard license soon to expire

Use a valid license within the Settings extension window.

| # | Tested | Step |
| --- | --- | --- |
| 11 | [x] | Settings offers **Extend License**. When fewer than 15 days remain, an orange expiry badge appears beside the date. |
| 12 | [x] | Click **Extend License**. Registration highlights Standard extension in orange and Pro upgrade in green. |
| 13 | [x] | Standard extension opens `instant/quickfoldersstdrenewal`; Pro upgrade opens `product/quickfoldersupgrade`. Both pass the existing key as referrer. |
| 14 | [x] | Open registration without explicit extension intent. If Standard extension is available, it is not highlighted orange; Pro upgrade remains green. |

Observed: Settings displayed the 10-day expiry badge and Extend License; registration showed the three choices with Standard extension orange and Pro upgrade green. Both checkout routes carried the existing license as referrer. The toolbar menu showed Standard extension without orange emphasis; the changelog Extend action highlighted it.

## Expired Standard license

| # | Tested | Step |
| --- | --- | --- |
| 15 | [x] | Settings shows the expired status and offers **Renew License**. |
| 16 | [x] | Click **Renew License**. Registration identifies the Standard edition and highlights Standard renewal in orange and Pro upgrade in green. |
| 17 | [x] | Standard renewal opens `instant/quickfoldersstdrenewal` with the existing key as referrer. |
| 18 | [x] | Pro upgrade opens `product/quickfoldersupgrade` with the existing key as referrer. |

Observed: Settings displayed the expired date and badge; registration highlighted Standard renewal and Pro upgrade. Renewal, upgrade and Domain purchase used their expected routes and passed the existing license as referrer.

## Valid Pro license

Use a license more than 30 days from expiry.

| # | Tested | Step |
| --- | --- | --- |
| 19 | [x] | Settings shows the valid status and normally hides its purchase button. |
| 20 | [x] | Click the valid license date. **Extend License** appears. |
| 21 | [x] | Click **Extend License**. Registration offers Pro extension and Domain, with no Standard card. |
| 22 | [x] | Pro extension opens `instant/quickfoldersrenew` with the existing key as referrer. |

Observed: the valid Pro license initially showed no purchase button; clicking the date exposed Extend License. The registration tab opened with extension intent and displayed Pro and Domain. Pro extension and Domain purchase used the expected routes with the existing key as referrer.

## Pro license soon to expire

| # | Tested | Step |
| --- | --- | --- |
| 23 | [x] | Settings offers **Extend License**. When fewer than 15 days remain, an orange expiry badge appears beside the date. |
| 24 | [x] | Click **Extend License**. Registration offers Pro extension and Domain. |
| 25 | [x] | Pro extension opens `instant/quickfoldersrenew` with the existing key as referrer. |

Observed: at 13 days, Settings showed the expiry badge and Extend License; clicking it opened registration with extension intent. The toolbar label did not change, consistent with its current 10-day threshold. Registration showed Pro extension and Domain purchase; both opened the expected routes with the existing key as referrer.

## Expired Pro license

| # | Tested | Step |
| --- | --- | --- |
| 26 | [x] | Settings shows the expired status and offers **Renew License**. |
| 27 | [x] | Click **Renew License**. Registration offers Pro renewal and Domain, with no Standard card. |
| 28 | [x] | Pro renewal opens `instant/quickfoldersrenew` with the existing key as referrer. |

Observed: expired Pro displayed the expired badge and renewal action. Registration showed Pro and Domain; renewal and Domain purchase opened their expected routes with the existing key as referrer.

## Valid Domain license

| # | Tested | Step |
| --- | --- | --- |
| 29 | [x] | Click the valid license date, then **Extend License**. Registration highlights the Domain action, labeled **Renew License**. |
| 30 | [x] | The Domain card shows **Add users** beneath its description. |
| 31 | [x] | Pro is secondary and clearly described as a separate personal license. |
| 32 | [x] | Domain renewal opens `instant/quickfoldersdomainrenewal` with the existing key as referrer. |
| 33 | [x] | **Add users** opens `product/quickfolders_domainseat` in the external browser with `referrer=domain:...` containing the licensed domain only. Confirmed with a domain-only encoded referrer. |

Observed: the valid Domain date-click opened registration with extension intent; Domain renewal was highlighted, Add users was visible, and Pro showed the separate-license warning. Domain renewal and the separate Pro purchase opened their expected routes with the Domain key as referrer. The maintainer normally records a resulting Pro order internally as a downgrade.

## Expired Domain license

| # | Tested | Step |
| --- | --- | --- |
| 34 | [x] | Click **Renew License**. Registration highlights Domain renewal and shows **Add users**. |
| 35 | [x] | Pro is secondary and carries the separate-personal-license warning. |
| 36 | [x] | Domain renewal opens `instant/quickfoldersdomainrenewal` with the existing key as referrer. |

Observed: expired Domain showed the expired badge and Renew License; clicking it opened registration from Settings. Registration highlighted Domain renewal, showed Add users and the separate Pro warning; renewal opened the expected route with the existing key as referrer.

## Navigation and other entry points

| # | Tested | Step |
| --- | --- | --- |
| 37 | [x] | **Enter license key…** opens Settings on Licenses and closes the registration tab only after Settings opens successfully. |
| 38 | Not tested | If opening a destination fails, the source Settings or splash page remains open and can be used again. |
| 39 | [ ] | Install and update splash license actions open registration with the appropriate license context; explicit Extend passes extension intent. Update renewal and update Extend passed; install splash remains to be tested. |
| 40 | [x] | The QuickFolders toolbar registration menu opens the new registration tab. |
| 41 | [ ] | A previously open registration tab is reused with the latest feature and intent, rather than retaining an earlier scenario. Reuse with `mainPopup` was confirmed; clearing an earlier intent or scenario remains to be checked. |
| 42 | [x] | Checkout opens in the external browser, leaves registration open and retains edited contact details. |
| 43 | [x] | With an expired license, click the QuickFolders toolbar’s **Renew License** label. The new registration tab opens with feature mainLabelRenewal and the expired license’s renewal choices. |
| 44 | [x] | Leave registration open with a valid license and restart Thunderbird. The restored tab loads the current license status and account identities, prefills contact details and retains the requested extension intent. |

Step 43: expired Pro opened the new tab with `mainLabelRenewal` and showed Pro renewal and Domain purchase.

Navigation observations: Enter license key passed. Failure handling was not tested. The update splash renewal opened registration with `landing-update` and the expected Domain renewal route and existing license referrer. The update splash Extend action previously passed its highlight check.
