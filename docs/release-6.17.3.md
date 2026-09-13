# QuickFolders 6.17.3 emergency release preparation

Target submission date: September 13, 2026 (Europe/Dublin).
Status: preparation; not submitted to ATN or published on GitHub.

## Scope and candidate

- Lead fix: #711, the 6.17.2 startup race that applied unpaid tab restrictions before license validation completed. Four users have reported success with the fix.
- Existing accompanying changes: #710 clipboard improvements and the external-message listener fix.
- The intermittent current-folder-bar rendering issue is deferred and is not claimed as fixed.
- Keep `6.17.3pre2` during preparation. The existing `QuickFolders-mx-6.17.3pre2.xpi` matches the current manifest, background script, and main window script exactly, as checked September 12.
- ATN change history: `release-notes.html`. GitHub release description: `release-notes.md`.
- Release notes and the source change-history comment now include the confirmed startup fix. The source history update changes comments only; the existing candidate package is unchanged.

## Final release steps

1. Finish any remaining candidate testing and confirm the release scope. Preserve the tested startup fix.
2. Remove WIP labels from the release notes when the release is ready.
3. Only when 100% ready, remove the `pre2` suffix from the manifest as the final version-editing step before the final release commits. Keep `build.bat` as a prerelease builder; it increments the prerelease revision and moves existing XPI files, so do not use it to produce the final package unchanged.
4. Build a clean `QuickFolders-mx-6.17.3.xpi` with the same runtime contents as the tested candidate, allowing only intentional final version and documentation changes. Verify its manifest version, required files, and absence of unwanted files.
5. Submit the final package to ATN with the HTML release notes. Publish the tagged GitHub release on the same day, with the final XPI and Markdown release notes as the fallback while ATN review is pending.
6. If ATN review is urgent, request expedited review through Matrix.

## Website publication status

`version.html` is not in this checkout. Update it in the website repository, keeping the main published version/date aligned with actual ATN publication. Do not advance those merely because the package has been submitted for review.

For the newest maintenance release, retain a maintenance badge on each item with a tooltip explaining the urgent regression fixes. Move earlier maintenance releases under their own recent-history headings without per-item badges; abridge older items where useful.
