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
 * Model holding settings for Results panel behavior.
 * @type {any}
 */
OpenGeoportal.Models.LeftPanel = Backbone.Model.extend({
    initialize: function () {
        var width = Math.ceil($(window).width() * .4);
        if (this.get("openWidth") !== null) {
        	width = this.get("openWidth");
        }
        this.set("openWidth", Math.max(width, this.get("panelMinWidth")));
    },

	defaults : {
		mode : "closed",
        openWidth: null,
		panelMinWidth : 390,
        mapMinWidth: 550,
        currentTab: 0
	}
});
