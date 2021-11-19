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
 * LoadIndicator model
 */
OpenGeoportal.Models.LoadIndicator = Backbone.Model.extend({
	defaults: {
		actionId : "unspecified",
		actionType : "generic"
	}
});

/**
 * collection of Loading models
 */
OpenGeoportal.LoadIndicatorCollection = Backbone.Collection.extend({
	model : OpenGeoportal.Models.LoadIndicator
});




