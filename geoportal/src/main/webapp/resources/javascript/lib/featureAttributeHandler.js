/**
 *
 * This javascript module includes functions for dealing with feature attribute display
 *
 * @authors Chris Barnett
 */

if (typeof OpenGeoportal === 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * FeatureAttribute constructor
 *
 * @constructor
 * @requires Leaflet
 *
 */
OpenGeoportal.FeatureAttributeHandler = function(layerModel) {
    this.model = layerModel;
    /*****************************************
     * WMS GetFeature handling
     **************************************/

    /**
     * request feature info given a param object
     * @param params
     */
    this.getFeatureAttributes = function (params) {

        /**
         * convert the click on layer event into a param object to request feature info
         *
         * @param e
         */

/*        bbox
            :
            "-87.20947265625001,28.01380137638074,-67.10449218750001,50.93073802371819"
        coord
            :
            "43.389081939117496,-74.39941406250001"
        ogpid
            :
            "Tufts.NYProtectedAreas0511"
        pixel
            :
            "1607,506"
        size
            :
            "915,1373"
        srs
            :
            "EPSG:4326"*/
        var attrDictionaryPromise = this.getAttributeDictionaryPromise();


        var view = this.createFeatureAttributeView();

        this.queueAttrRequests(view);
        view.setDictionaryPromise(attrDictionaryPromise);
        params.ogpid = this.model.get("LayerId");
        view.fetchAttributes(params);
        //TODO: add feature to geojson code
        /*                view.fetchAttributes(params)
         .then(function(){ return view.fetchGeometry(params); })
         .done(function(data){ that.highlightFeature(data);});*/

    };

    this.getAttributeDictionaryPromise = function () {
        var def = $.Deferred();
        var model = this.model;
        var layerId = this.model.get("LayerId");
        if (model.has("dictionary")) {
            def.resolve(model.get("dictionary"));
        } else {
            var url = "layer/" + layerId + "/metadata/attributes";
            $.get(url, function (data) {
                var dictionary = data.attributeTable;
                model.set({dictionary: dictionary});
                def.resolve(dictionary);
            });

        }

        return def.promise();
    };

    this.currentAttributeRequests = [];
    /**
     * Keep track of LayerAttributeView's
     * @param view
     */
    this.queueAttrRequests = function (view) {
        //close any open attribute dialogs
        while (this.currentAttributeRequests.length > 0) {
            this.currentAttributeRequests.pop().close();
        }

        this.currentAttributeRequests.push(view);
    };

    /**
     * Create the feature attribute view (dialog)
     * @returns {OpenGeoportal.LayerAttributeView}
     */
    this.createFeatureAttributeView = function () {

        return new OpenGeoportal.Views.LayerAttributeView(
            {
                collection: new OpenGeoportal.LayerAttributeCollection()
            });

        //analytics.track("Layer Attributes Viewed", institution, layerId);
    };


    /**
     * turns off the getFeatureAttribute function by unregistering the click handler for a layer
     * @param e
     * @param data
     */
    this.getFeatureAttributesOff = function (e, data) {
        // generate the query params
/*        var layerId = data.LayerId;
        var olLayer = this.getOLLayer(layerId);
        if (olLayer === null) {
            // layer is not in OpenLayers...
            throw new Error(
                "This layer has not yet been previewed.  Please preview it first.");
        } else {

            this.ol.events.unregister("click", olLayer,
                this.getFeatureAttributes);
        }*/
    };

};