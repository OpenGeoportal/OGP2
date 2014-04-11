if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views === 'undefined') {
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views !== "object") {
	throw new Error("OpenGeoportal.Views already exists and is not an object");
}

/**
 * A Backbone View of the Cart Collection
 * 
 * @constructor
 */

OpenGeoportal.Views.CartActionView = Backbone.View.extend({
	initialize : function() {
		this.template = OpenGeoportal.ogp.template;
		this.controls = OpenGeoportal.ogp.controls;
		this.cartAction();
	},

	getApplicableLayers : function() {
		var that = this;

		var arrItems = this.collection.filter(function(model) {

			return that.cartFilter(model);

		});
		return arrItems;
	},

	// the default filter for a cart action. It should be overridden in the
	// subclassed view
	cartFilter : function(model) {
		return model.get("isChecked");
	},
	// entry point
	cartAction : function() {
		throw new Error("Please implement an override for 'cartAction'");
	}
/*
 * 
 * downloadFilter : function(model) { return model.isDownloadAvailable(); },
 * 
 * 
 */
});