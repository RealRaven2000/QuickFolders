# CustomUI

This WebExtension Experiment is a proof-of-concept framework for pure
WebExtension user interfaces integrated into Thunderbird's existing
features.

It currently features everything necessary for custom user interfaces
regarding contacts in the address book, as well as rudimentary support
for calendar (as there is no calendar access for WebExtensions yet, you
will need an additional experiment to do useful things with that).


## Overview

This API permits WebExtensions to register HTML documents, that will be
displayed in iframes at defined extension points ("locations") in
Thunderbird. Locations are defined by their capabilities, so they are
stable across design changes of the main Thunderbird user interface.

From within the documents registered through this API, special methods
permit to hook into the environment: for example, a document loaded into
the contact editing dialog can determine which contact is being edited,
and intercept the save operation to alter the contact.

The exact specifics of these operations are depending on each individual
location, and are documented alongside the schema. If this API gets merged
into the core, it is likely that some locations will require permissions
to protect the location-specific data available through them.


## Usage

Copy the experiment into your add-on and add it to your manifest.json:
```
{
  "experiment_apis": {
    "ex_customui": {
      "schema": "experiments/customui/api.json",
      "parent": {
        "scopes": ["addon_parent"],
        "paths": [["ex_customui"]],
        "script": "experiments/customui/parent.js"
      },
      "child": {
        "scopes": ["addon_child"],
        "paths": [["ex_customui"]],
        "script": "experiments/customui/child.js"
      }
    }
  }
}
```

You can now register new user interface parts, for example from the
background script:
```
// Register custom UI for the contact editing window
await messenger.ex_customui.add(
    messenger.ex_customui.LOCATION_ADDRESSBOOK_CONTACT_EDIT,
    "/path/to/a/document.html", {height: 30});

```

This will cause an iframe with the document `/path/to/a/document.html`
to be loaded. From within that document, you can access all WebExtension
APIs as well as some additional methods that permit you to determine
information about your environment and to react to the user's actions
outside of the iframe.

For example, this snippet could be used from a script loaded into the the
contact editing dialog:
```
// Define a function loading a contact into the custom UI:
const onContextChange = async function(context) {
  let contact;
  try {
    // Use normal WebExtension APIs to get access to contacts (in real
    // code, you also need to consider dialogs for new events that have no
    // id yet – you can get the address book's id via context.parentid):
    contact = await messenger.contacts.get(context.id);
    // ... in real code, you would do something with the contact here...
  } catch (e) {
    // Hide the custom UI on errors (you can also use setLocalOptions to
    // change the desired size):
    await messenger.ex_customui.setLocalOptions({hidden: true});
  }
};

// You can get the current context using getContext:
messenger.ex_customui.getContext().then(onContextChange).catch(/* ... */);

// To also get notified of the context changeing later on, and to alter
// the contact before saving it, you can also register listeners on
// onEvent; each event has a fixed type, as well as a details object with
// type-specific arguments:
messenger.ex_customui.onEvent.addListener((type, details) => {
  switch (type) {
    case "context":
      // This event fires if the context is changed dynamically: for example,
      // the user might alter the address book to create a new contact in
      onContextChange(details);
      return;
    case "apply":
      // This event fires if the dialog is saved; details are the contact's
      // properties. We can return an object with additional properties to
      // override:
      return { /* "Custom1" : "Value for fist custom field" */};
  }
});
```

Read the full schema.json for details on what operations are currently
available.

