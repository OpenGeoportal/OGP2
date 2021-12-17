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