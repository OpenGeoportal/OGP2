if (typeof OpenGeoportal == 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined') {
    OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object") {
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}


OpenGeoportal.Models.LayerAttribute = Backbone.Model.extend({});


//collection for the feature info ; the collection should be transient
OpenGeoportal.LayerAttributeCollection = Backbone.Collection.extend({
    model: OpenGeoportal.Models.LayerAttribute,

    url: 'featureInfo',

    parse: function (response) {

        if (_.has(response, "title")) {
            this.title = response.title;
        }

        if (_.has(response, "layerId")) {
            this.layerId = response.layerId;
        }

        if (_.has(response, "attrDictionary")) {

            if (!_.has(response.attrDictionary, "fid")) {
                response.attrDictionary.fid = "feature identifier";
            }
            this.dictionary = new OpenGeoportal.Models.Attribute(response.attrDictionary);
        }

        if (_.has(response, "error")) {
            return {error: response.error};
        }

        return response.features;
    }
});


	
	

