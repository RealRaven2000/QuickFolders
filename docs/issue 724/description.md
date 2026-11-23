Using Mail Commands >> Search Messages to get a contextual mail search from a folder bring up a micro window without content:

<img width="539" height="274" alt="image" src="https://github.com/user-attachments/assets/b22993c1-c55c-48c5-b03b-7989629e51dc" />

result is this broken tiny caption bar:

<img width="275" height="106" alt="image" src="https://github.com/user-attachments/assets/162328b1-a6ec-4955-abbe-428093b7e741" />

resizing this window:

<img width="463" height="329" alt="image" src="https://github.com/user-attachments/assets/5ce88cbe-573a-4e90-9189-fb3e6e66cc7c" />

log:


```log
08:42:44.720 QuickFolders 8:42:44.720  [122210 ms]   
 command event from popup - QI.clickHandler()
 label=Search Messages…
 tag=qfFolderSearch quickfolders-util.js:1432:13
08:42:44.721 QuickFolders 8:42:44.721  [1 ms]   
 Repeat event [qfFolderSearch] within 122216ms. quickfolders-util.js:1432:13
08:42:44.728 QuickFolders 8:42:44.728  [7 ms]   
 ..handled command from click event. quickfolders-util.js:1432:13
08:42:44.978 Uncaught ReferenceError: RPMGetBoolPref is not defined
    <anonymous> chrome://global/content/aboutNetErrorHelpers.mjs:42
 aboutNetErrorHelpers.mjs:42:27
```

