# test
"C:\Program Files\7-Zip\7z" a -xr!.svn quickFolders.zip install.rdf chrome.manifest chrome defaults license.txt
set /P quickFoldersRev=<revision.txt
set /a quickFoldersRev+=1
echo %quickFoldersRev% > revision.txt
move *.xpi "..\..\Release\_Test Versions\4.8\"
rename quickFolders.zip QuickFolders-tb-pb-sm-4.8.3pre%quickFoldersRev%.xpi