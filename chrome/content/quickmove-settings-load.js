
// initialize the dialog and do l10n
window.document.addEventListener('DOMContentLoaded', 
  QuickFolders.quickMove.Settings.load.bind(QuickFolders.quickMove.Settings) , 
  { once: true });

window.addEventListener('dialogaccept', 
  function () { QuickFolders.quickMove.Settings.accept(); }
);