/**
 * Created by cbarne02 on 11/23/16.
 */
/*
 * create the namespace objects if they don't already exist
 */
if (typeof OpenGeoportal == 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * UserState gathers state from the application and POSTs to the /user/state endpoint, where
 * it is stored. On page load, a GET request to /user/state retrieves the state and updates
 * application models with the info.
 * @constructor
 */
OpenGeoportal.UserState = function () {
    var instance;
    var self = this;

    /**
     * set the OGP instance
     * @param appInstance
     */
    self.setInstance = function (appInstance) {
        instance = appInstance;
    };

    /**
     * Save user state to the user/state endpoint
     */
    self.save = function () {
        var stateObj = self.gatherState();
        var callback = function () {
            console.log(arguments)
        };
        $.ajax({
            method: "POST",
            url: "user/state",
            data: JSON.stringify(stateObj),
            contentType: "application/json",
            success: callback,
            dataType: "json"
        })
            .fail(function () {
                throw new Error("Failed to save user state.");
            });
    };

    /**
     * Retrieve user state from the 'user/state' endpoint
     */
    self.retrieve = function () {
        var callback = function () {
            console.log(arguments)
        };
        return $.get("user/state", callback)
            .done(function () {
                alert("second success");
            })
            .fail(function () {
                alert("error");
            })
            .always(function () {
                alert("finished");
            });
    };

    /**
     * Gather state info from the instance.
     * @returns {{}}
     */
    self.gatherState = function () {
        var state = {};
        // what state should we save?
        //cart items...
        //currently processing items... request queue
        //previewed items
        //login
        //query terms?
        //ui settings? columns shown, widths, pane width, map extent, basemap, search type,
        // displayed dialogs?
        /*
         ogp.appState = new OpenGeoportal.Models.OgpSettings({
         queryTerms : new OpenGeoportal.Models.QueryTerms(),
         previewed : new OpenGeoportal.PreviewedLayers(),
         cart : new OpenGeoportal.CartCollection(),
         layerState: new OpenGeoportal.TableRowSettings(),
         login : new OpenGeoportal.Views.Login({
         model : new OpenGeoportal.Models.User()
         }),
         requestQueue: new OpenGeoportal.RequestQueue(),
         currentTab : 0
         });
         */

        //throw an error if instance is not defined
        if (_.isUndefined(instance) || _.isNull(instance)) {
            throw new Error("OGP Instance must be set.");
        }
        state.cart = instance.cart.toJSON();
        state.previewed = instance.previewed.toJSON();
        state.requests = instance.requestQueue.toJSON();
        state.tabId = instance.panel.get("currentTab");
        return state;
    };

};