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

OpenGeoportal.Models.LeftPanel = Backbone.Model.extend({
	defaults : {
		mode : "closed",
		openWidth : 500, // maybe initial openWidth should be a certain
							// percentage of the screen width or panelminwidth
		panelMinWidth : 390,
		mapMinWidth : 550
	}
});
