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
OpenGeoportal.Views.MapIt = OpenGeoportal.Views.CartActionView.extend({

	cartFilter : function(model) {
		return this.isMapItAvailable(model);
	},

	isMapItAvailable : function(model) {
		// public vector wms layers only. we can increase the complexity
		// if other web mapping sites have different criteria
		var isAvailable = false;
		if (model.isPublic() && model.isVector() && model.hasOGCEndpoint("wms")) {
			isAvailable = true;
		}

		return isAvailable;
	},
	
	cartAction : function() {
		var arrModels = this.getApplicableLayers();
		// filter the cart collection and retrieve those that can be
		// shared

		var exportObj = this.createExportParams(arrModels);
		// the dialog should probably be in this View; the export object should
		// be more abstract
		var geoCommonsExport = new OpenGeoportal.Export.GeoCommons(exportObj);
		var dialog$ = geoCommonsExport.exportDialog(this);

	},




	setMapItAttributes : function() {
		var attr = {};
		if (this.isMapItAvailable()) {
			attr = {
				mapit : [ "GeoCommons" ]
			};
		}
		this.set(attr);
	},

	createExportParams : function(arrModels) {
		var exportParams = {};
		exportParams.layers = arrModels;
		exportParams.extent = {};
		var map = OpenGeoportal.ogp.map;
		exportParams.extent.global = map.getSpecifiedExtent("global");
		exportParams.extent.current = map.getSpecifiedExtent("current");
		exportParams.extent.maxForLayers = map.getSpecifiedExtent(
				"maxForLayers", exportParams.layers);
		return exportParams;
	}
});