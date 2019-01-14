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
    },

    setFacetValue: function (facet, key, val) {
        $('.facet_' + facet + '.facetValue_' + key).text(' (' + val + ')');
    }
});

OpenGeoportal.FacetCollection = Backbone.Collection.extend({
    model: OpenGeoportal.Models.Facet,

    parseFacets: function (facetResponse) {
        var facets = [];
        _.each(facetResponse.facet_fields, function (v, k) {
            var f = {
                field_id: k
            };
            for (var i = 0; i < v.length; i += 2) {
                f[v[i]] = v[i + 1];
            }
            facets.push(f);
        });

        return facets;
    },

    updateFacets: function (facetResponse) {
        var updatedFacets = this.parseFacets(facetResponse);
        var self = this;
        _.each(updatedFacets, function (facet) {
            var f = self.findWhere({field_id: facet.field_id});
            // aggregate scanned map values
            if (facet.field_id === 'DataTypeSort'){
                var count = 0;
                var vals = ["Paper Map", "Scanned Map", "ScannedMap"];
                _.each(vals, function(k){
                    if (_.has(facet, k)){
                        count += facet[k];
                        delete facet[k];
                    }
                });
                facet["ScannedMap"] = count;
            }

            if (_.isUndefined(f)) {
                self.add(facet);
            } else {
                f.set(facet);
            }
        });

    },
});