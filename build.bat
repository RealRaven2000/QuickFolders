REM  create a new build for QuickFolders
set /P quickFoldersRev=<revision.txt
set /a oldRev=%quickFoldersRev%
set /a quickFoldersRev+=1
REM replace previous rev with new
pwsh -Command "(gc -en UTF8NoBOM install.rdf) -replace 'pre%oldRev%'.trim(), 'pre%quickFoldersRev%' | Out-File install.rdf"
pwsh -Command "(gc -en UTF8NoBOM manifest.json) -replace 'pre%oldRev%', 'pre%quickFoldersRev%' | Out-File manifest.json"
rem "C:\Program Files\7-Zip\7z" a -xr!.svn quickFolders.zip install.rdf chrome.manifest chrome defaults license.txt
"C:\Program Files\7-Zip\7z" a -xr!.svn QuickFoldersWeb.zip manifest.json install.rdf chrome.manifest chrome defaults license.txt
echo %quickFoldersRev% > revision.txt
move QuickFolders*.xpi "..\..\Release\_Test Versions\4.18\"
pwsh -Command "Start-Sleep -m 150"
rename QuickFoldersWeb.zip QuickFolders-wx-4.18.1pre%quickFoldersRev%.xpi