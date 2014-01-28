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
/*
 * OpenGeoportal.Ogpsettings object to hold setting info for the application
 */

OpenGeoportal.Models.OgpSettings = Backbone.Model.extend({
	initialize : function() {
		this.set({
			queryTerms : new OpenGeoportal.Models.QueryTerms(),
			previewed : new OpenGeoportal.PreviewedLayers(),
			cart : new OpenGeoportal.CartCollection(),
			template : new OpenGeoportal.Template(),
			login : new OpenGeoportal.Views.Login({
				model : new OpenGeoportal.Models.User()
			}),
			requestQueue : new OpenGeoportal.RequestQueue(),
			currentTab : 0
		});
	}
});
