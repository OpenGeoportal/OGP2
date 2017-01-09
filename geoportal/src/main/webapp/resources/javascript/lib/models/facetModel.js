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

/**
 * Model for holding facet info.
 */

//TODO: put the count update stuff into a view
OpenGeoportal.Models.Facet = Backbone.Model.extend({
    idAttribute: "field_id",
    initialize: function () {
        this.listenTo(this, "add change", this.updateCounts);
    },
    updateCounts: function (model) {
        var id = model.get("field_id");
        var self = this;
        _.each(model.attributes, function (v, k) {
            self.setFacetValue(id, k, v);
        });
        if (model.has("ScannedMap")) {
            var total = model.get("ScannedMap");
            if (model.has("Scanned Map")) {
                total += model.get("ScannedMap");
            }
            if (model.has("Paper Map")) {
                total += model.get("Paper Map");
            }
            self.setFacetValue(id, "ScannedMap", total);
        }
    },
    setFacetValue: function (facet, key, val) {
        $('.facet_' + facet + '.facetValue_' + key).text(' (' + val + ')');
    }
});

OpenGeoportal.FacetCollection = Backbone.Collection.extend({
    model: OpenGeoportal.Models.Facet
});