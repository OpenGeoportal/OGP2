if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

/**
 * Basemap model. handles some logic for holding and changing basemaps
 */
OpenGeoportal.Models.Basemap = Backbone.Model.extend({
	initialize : function() {
		this.listenTo(this, "change:selected", this.changeSelection);
	},

	changeSelection : function() {
		if (this.get("selected")) {
			$(document).trigger('map.selectBasemap', this);
		}
	}
});

/**
 * collection of Basemap models
 */
OpenGeoportal.BasemapCollection = Backbone.Collection.extend({
	model : OpenGeoportal.Models.Basemap
});
