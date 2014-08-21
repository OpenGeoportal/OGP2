if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}


OpenGeoportal.Models.LayerAttribute = Backbone.Model.extend({
});


//collection for the feature info ; the collection should be transient
OpenGeoportal.LayerAttributeCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.LayerAttribute,

	url : 'featureInfo',
	
	parse: function(response){
		//embed title? attribute definitions?
		return response;
	},
	
	abort: function(){
		this.fetchStatus.abort();
		this.destroy();
	}
});




/**
 * convert the click on layer event into a param object to request feature info
 */
this.getFeatureAttributes = function(e) {
		// console.log("getFeatureAttributes");
		if (typeof this.map !== "undefined") {
			var mapObject = this.map;// since this is an event handler, the
			// context isn't the MapController
			// Object, it's the map layer. Should it
			// be?

			// generate the query params
			var layerId = this.ogpLayerId;
			var mapExtent = mapObject.getExtent();
			var pixel = e.xy;
			// geoserver doesn't like fractional pixel values

			var params = {
					ogpid: layerId,
					bbox: mapExtent.toBBOX(),
					x: Math.round(pixel.x),
					y: Math.round(pixel.y),
					height: mapObject.size.h,
					width: mapObject.size.w
			};
			
			var layerModel = mapObject.previewed.findWhere({
				LayerId : layerId
			});
			
			var title = layerModel.get("LayerDisplayName");
			var institution = layerModel.get("Institution");
			
			//destroy any existing attribute views & collections, abort ongoing requests if possible
			var attributes = new OpenGeoportal.LayerAttributeCollection();
			var attributeView = new OpenGeoporal.Views.LayerAttributeView({collection: attributes, title: title});
			attributes.fetch({data: params});
			
			mapObject.currentAttributeRequests.push(attributeView);

			analytics.track("Layer Attributes Viewed", institution, layerId);
		} else {
			new OpenGeoportal.ErrorObject(
					new Error(),
					"This layer has not been previewed. <br/>You must preview it before getting attribute information.");
		}
	};

	this.currentAttributeRequests = [];
	
	

