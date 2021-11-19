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
		this.initView();
	},
	//defaut initView is a nop.  override if subclasses require additional initialization
	initView: function(){
		//nop
	},
	// the default filter for a cart action. It should be overridden in the
	// subclassed view
	cartFilter : function(model) {
		return model.get("isChecked");
	},

	getApplicableLayers : function() {
		var that = this;

		var arrItems = this.collection.filter(function(model) {

			return that.cartFilter(model);

		});
		return arrItems;
	},

	//deferred: jQuery.Deferred(),
	// entry point, returns promise, resolved at the end of the action
	cartAction : function() {
		alert("Please implement an override for 'cartAction'");
		//this.deferred.resolve();
		//return this.deferred.promise();
	}

});