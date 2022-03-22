var ex_customui = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    const listenerFires = [];
    const onEventMessageListener = {
      receiveMessage(message) {
        // We'll collect promises resolving iff the listener returned a truthy
        // result, as long as we are expected to send back a result
        // (message.data.token is set)
        let promises = [];
        for (let fire of listenerFires) {
          const promise = (async () => await fire.sync(message.data.type,
              message.data.details))();
          if (message.data.token) {
            promises.push(promise.then(result => {
              if (!result) {
                throw new Error("no result");
              }
              return result;
            }));
          }
          promise.catch(console.error);
        }
        if (message.data.token) {
          if (!promises.length) {
            promises.push(Promise.resolve(null));
          }
          // We want to return the first successful result within promises or
          // return null iff all fail. As there is no Promise.any, we build it
          // by inverting promises and using Promise.all to get the first
          // failing one.
          const invertedPromises = promises.map(p => p.then(
              r => {throw r;}, e => e));
          Promise.all(invertedPromises).then(e => {throw null;}).catch(
              result => {
            context.messageManager.sendAsyncMessage("ex:customui:onEvent",
                {type: message.data.type, token: message.data.token, result});
          });
        }
      }
    };
    context.messageManager.addMessageListener("ex:customui:onEvent",
        onEventMessageListener);
    // Documentation is not clear if it is guaranteed that a message manager
    // does not persist if the context is closed. So we play safe for now:
    context.callOnClose({close(){context.messageManager.removeMessageListener(
        "ex:customui:onEvent", onEventMessageListener)}});
    return {
      ex_customui: {
        async getContext() {
          const contexts = context.messageManager.sendSyncMessage(
              "ex:customui:getContext");
          if (!contexts.length) {
            throw new Error("getContexts may only be called from within a "
                + "custom ui");
          }
          return contexts[0];
        },
        async setLocalOptions(options) {
          const success = context.messageManager.sendSyncMessage(
            "ex:customui:setLocalOptions", options);
          if (!success.length) {
            throw new Error("setLocalOptions may only be called from within a "
                + "custom ui");
          }
        },
        onEvent: new ExtensionCommon.EventManager({
          context,
          name: "ex_customui.onEvent",
          register: fire => {
            listenerFires.push(fire);
            return () => {
              const index = listenerFires.indexOf(fire);
              if (index >= 0) {
                listenerFires.splice(index, 1);
              }
            };
          }
        }).api()
      }
    };
  }
};
