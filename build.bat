REM  create a new build for QuickFolders
set /P quickFoldersRev=<revision.txt
set /a oldRev=%quickFoldersRev%
set /a quickFoldersRev+=1
REM replace previous rev with new
powershell -Command "(gc -en UTF8 manifest.json) -replace 'pre%oldRev%', 'pre%quickFoldersRev%' | Out-File manifest.json  -encoding utf8"
"C:\Program Files\7-Zip\7z" a -xr!.svn QuickFoldersWeb.zip manifest.json _locales scripts chrome html popup license.txt *.js *.html
echo %quickFoldersRev% > revision.txt
move QuickFolders*.xpi "..\..\..\Release\_Test Versions\5.17\"
powershell -Command "Start-Sleep -m 150"
rename QuickFoldersWeb.zip QuickFolders-mx-5.17.1pre%quickFoldersRev%.xpi