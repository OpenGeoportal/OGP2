/*
 * create the namespace objects if they don't already exist
 */
if (typeof OpenGeoportal == 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

OpenGeoportal.BootstrapModels = function (ogpInstance) {

    var self = this;
    var instance = ogpInstance;


    self.setInstance = function (ogpInstance) {
        instance = ogpInstance;
    };


    self.bootstrapUserState = function (userState) {
        var cart = instance.cart;
        if (_.has(userState, "cart")) {
            cart.add(userState.cart);
        }

        var preview = instance.previewed;
        if (_.has(userState, "previewed")) {
            var pState = userState.previewed;
            instance.map.ready.then(function () {
                //TODO: if in the cart and previewed, don't add here, or at least
                //don't trigger preview
                preview.add(pState);
            });
        }

        var queue = instance.requestQueue;
        if (_.has(userState, "queue")) {
            queue.add(userState.queue);
        }

        var tabId = instance.panel.get("currentTab");
        if (_.has(userState, "tabId")) {
            tabId = userState.tabId;
        } else {
            tabId = 0;
        }
        instance.panel.set("currentTab", tabId);
    };


};