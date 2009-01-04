QuickFolders.ChangeOrder = {
    window: null,

    init: function(window) {
        this.window = window;
        this.showFolders();
    } ,

    $: function(id) {
        return this.window.document.getElementById(id);
    } ,

    showFolders: function() {
        rows = this.$('QuickFolders-change-order-grid-rows');
        QuickFolders.Util.clearChildren(rows);

        for(i = 0; i < QuickFolders.Model.selectedFolders.length; i++) {
            folderEntry = QuickFolders.Model.selectedFolders[i];

            folder = GetMsgFolderFromUri(folderEntry.uri, true);

            if(folder != undefined) {
                this.addFolderButton(folder, folderEntry.name)
            }
        }
    } ,

    addFolderButton: function(folder, useName) {
        label = (useName && useName.length > 0) ? useName : folder.name;

        rows = this.$('QuickFolders-change-order-grid-rows');
        row = document.createElement("row");

        folderLabel = document.createElement("label");
        folderLabel.appendChild(document.createTextNode(label));
        row.appendChild(folderLabel);

        var buttonUp = document.createElement("button");
        buttonUp.setAttribute("label","Up");
        buttonUp.linkedFolder = folder;
        buttonUp.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'up','"+folder.URI+"');");
        row.appendChild(buttonUp);

        var buttonDown = document.createElement("button");
        buttonDown.setAttribute("label","Down");
        buttonDown.linkedFolder = folder;
        buttonDown.setAttribute("oncommand","QuickFolders.ChangeOrder.onButtonClick(event.target, 'down','"+folder.URI+"');");
        row.appendChild(buttonDown);

        rows.appendChild(row);
    } ,

    onButtonClick: function(button, direction, folderURI) {
        modelSelection = QuickFolders.Model.selectedFolders;

        for(var i = 0; i < modelSelection.length; i++) {
            folderEntry = modelSelection[i];

            if(folderEntry.uri == folderURI) {

                if(i > 0 && direction == 'up') {
                    tmp = modelSelection[i - 1];
                    modelSelection[i - 1] = modelSelection[i];
                    modelSelection[i] = tmp;
                    QuickFolders.ChangeOrder.showFolders();
                    return;
                }

                if(i < modelSelection.length - 1 && direction == 'down') {
                    tmp = modelSelection[i + 1];
                    modelSelection[i + 1] = modelSelection[i];
                    modelSelection[i] = tmp;
                    QuickFolders.ChangeOrder.showFolders();
                    return;
                }
            }
        }
    } ,

    insertAtPosition: function(buttonURI, targetURI, toolbarPos) {
      var folderEntry, folder;
      var iSource, iTarget;

          // alert (i + " " + folder.name + " lbl: " + folderEntry.name + " uri: " + folderEntry.uri);
      // alert("insertAtPosition(" + buttonURI +", "+ targetURI +  ")");
      var modelSelection = QuickFolders.Model.selectedFolders;

      for(var i = 0; i < modelSelection.length; i++) {
          folderEntry  = QuickFolders.Model.selectedFolders[i];
          folder = GetMsgFolderFromUri(folderEntry.uri, true);

          if (toolbarPos=="")
            if (folderEntry.uri==targetURI)
                iTarget = i;

          if (folderEntry.uri==buttonURI)
            iSource = i;
      }

      switch(toolbarPos) {
          case "LeftMost":
            iTarget = 0;
            break;
          case "RightMost":
            iTarget = modelSelection.length-1;
            break;
      }

      if (iSource!=iTarget) {
          var tmp;
          if (iSource<iTarget) { // drag right
              for (i=iSource; i<iTarget; i++) {
                tmp = modelSelection[i];
                modelSelection[i] = modelSelection[i+1];
                modelSelection[i+1] = tmp;
            }
          }
          else {  // drag left
              for (i=iSource; i>iTarget; i--) {
                tmp = modelSelection[i];
                modelSelection[i] = modelSelection[i-1];
                modelSelection[i-1] = tmp;
              }
          }
          QuickFolders.Model.update(); // update folders!
     }
   }
}