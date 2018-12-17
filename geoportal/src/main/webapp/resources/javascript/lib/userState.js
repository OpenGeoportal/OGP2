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
    var self = this;

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
                // alert("second success");
            })
            .fail(function () {
                alert("error");
            })
            .always(function () {
                //  alert("finished");
            });
    };

    var models_and_collections = {};

    self.getUserState = function () {
        return models_and_collections;
    };

    /**
     * if the state is managed by a Backbone model or collection, we can add a listener to update on change.
     * @param key
     * @param collection
     * @param events
     */
    self.listenForModelUpdates = function (key, collection, events) {

        models_and_collections[key] = collection;

        collection.listenTo(collection, events, self.save);
    };

    /**
     * use this function to manually update state
     * @param key
     * @param valueObj
     * @param options
     */
    self.updateUserState = function(key, valueObj, options){
        models_and_collections[key] = valueObj;
        if (_.has(models_and_collections, key)){
            // merge
        } else {
            models_and_collections[key] = valueObj;
        }

        if (_.has(options, 'silent') && options.silent){
            //
        } else {
            self.save();
        }
    };

/*    self.listenForUpdates = function (collections) {
        var valid = true;
        var vals = ["cart", "previewed", "requestQueue", "panel"];
        _.each(vals, function (k) {
            valid = valid && _.has(collections, k);
        });
        if (!valid) {
            throw new Error("missing properties!");
        }

        models_and_collections = collections;

        collections.cart.listenTo(collections.cart, "add remove", self.save);
        collections.previewed.listenTo(collections.previewed, "add remove", self.save);
        collections.requestQueue.listenTo(collections.requestQueue, "add remove", self.save);
        collections.panel.listenTo(collections.panel, "change:currentTab change:openWidth change:mode", self.save);
    };*/

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

        var coll = self.getUserState();

        _.each(coll, function(v, k){
            state[k] = v.toJSON();
        });

        console.log('gather state');
        console.log(state);
        return state;
    };

};