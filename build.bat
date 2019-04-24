REM  create a new build for QuickFolders
set /P quickFoldersRev=<revision.txt
set /a oldRev=%quickFoldersRev%
set /a quickFoldersRev+=1
REM replace previous rev with new
pwsh -Command "(gc -en UTF8NoBOM install.rdf) -replace 'pre%oldRev%'.trim(), 'pre%quickFoldersRev%' | Out-File install.rdf"
"C:\Program Files\7-Zip\7z" a -xr!.svn quickFolders.zip install.rdf chrome.manifest chrome defaults license.txt
echo %quickFoldersRev% > revision.txt
move QuickFolders-tb*.xpi "..\..\Release\_Test Versions\4.14.1\"
pwsh -Command "Start-Sleep -m 150"
rename quickFolders.zip QuickFolders-tb-pb-sm-4.14.1pre%quickFoldersRev%.xpi