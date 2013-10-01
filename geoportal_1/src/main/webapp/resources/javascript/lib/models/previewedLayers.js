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
/*OpenGeoportal.LayerSettings
*	object to hold display setting info, where it exists (opacity, etc.)
*/

/*
 * 
 * 
 * Attributes:
 * 
 * - resourceName: this is the layer name value needed to preview the layer.  Unfortunately, this may be different from the solr "Name" value, which should be the
 * layer name used to access ogc web services (ex: Harvard's name value to access their tilecache does not include the database prefixes, while ogc layer names (GeoServer) do.)
 * 
 * 
 */

//TODO: generalizing this, since I really need it for the cart collection as well.
OpenGeoportal.Models.DataTypeAware = OpenGeoportal.Models.ResultItem.extend({
	initialize: function(){
		this.assignDataTypeAttributes();
	},
	assignDataTypeAttributes: function() {
		//really, this should take into account location field....what url types does the layer have;
		//preview controls are available according to what attributes this model has
		var dataType = this.get("DataType").toLowerCase();
		var attr = {};
		switch(dataType){
		case "raster":
		case "paper map":
			attr = {baseType: "raster"};
			break;
		default:
			//we're defaulting to vector type
			attr = {baseType: "vector"};
		break;
		};
		this.set(attr);
		return this;

	},
	
});

OpenGeoportal.Models.PreviewLayer = OpenGeoportal.Models.DataTypeAware.extend({	
	previewSpecificAttributes: {
		preview: "off", 
		resourceName: "",
		previewType: "",
	},

	initialize: function(){
		this.assignDataTypeAttributes();
		this.assignPreviewAttributes();
	},
	assignPreviewAttributes: function(){
				//really, this should take into account location field....what url types does the layer have;
		//preview controls are available according to what attributes this model has
		var baseType = this.get("baseType").toLowerCase();
		var attr = {};
		switch(baseType){
		case "raster":
			attr = this.rasterDefaults;
			break;
		case "vector": 
			var typeSpecificAttr = this.getTypeSpecificVectorAttr(this.get("DataType"));
			attr = jQuery.merge(this.vectorDefaults, typeSpecificAttr);
			break;
		default:
			//should never get here as is
		break;
		};
		this.set(attr);
		return this;
	},
	rasterDefaults: {
		getFeature: false, 
		opacity: 100, 
		sld: ""
	},
	vectorDefaults: {
		getFeature: false, 
		opacity: 100, 
		colorPickerOn: false,
		sld: ""
	},
	getTypeSpecificVectorAttr: function(dataType){
		switch(dataType){
			case "point":
				return this.pointDefaults;
				break;
			case "line":
				return this.lineDefaults;
				break;
			case "polygon":
				return this.polygonDefaults;
				break;
			default:
				return this.unknownVectorDefaults;
				break;
		}
	},
	pointDefaults: {
		color: "#ff0000", 
		graphicWidth: 2 
	},
	lineDefaults:  {
		color: "#0000ff", 
		graphicWidth: 1 
	},
	polygonDefaults: {
		opacity: 80, 
		color: "#aaaaaa", 
		graphicWidth: 1 
	},
	unknownVectorDefaults: {
		color: "#aaaaaa", 
		graphicWidth: 1 
	}
});



OpenGeoportal.Models.Attribute = Backbone.Model.extend({});

OpenGeoportal.Attributes = Backbone.Collection.extend({
	model: OpenGeoportal.Models.Attribute
});

OpenGeoportal.PreviewedLayers = Backbone.Collection.extend({
	/*
	 * 			//the collection should handle setting the title
			this.previewed.getFeatureTitle = displayName;
	 */
	model: OpenGeoportal.Models.PreviewLayer,
	initialize: function(){
		this.listenTo(this, "change:preview", this.changePreview);  
		this.listenTo(this, "change:graphicWidth change:color", this.changeLayerStyle);  
		this.listenTo(this, "change:opacity", this.changeLayerOpacity);
		this.listenTo(this, "change:getFeature", this.changeGetFeatureState);

	},
	changeLayerStyle: function( model, val, options){
		var layerId = model.get("LayerId");
		//tell map to change the linewidth/pointsize/borderwidth for this layer
		//this event should be attached to the model, so it only fires once;
		//better yet, have a map view that listens for this change event
		jQuery(document).trigger("map.styleChange", {LayerId: layerId});
	},
	changeLayerOpacity: function(model, val, options){
		var value = model.get("opacity");
		var layerId = model.get("LayerId");
		//tell map to change the opacity for this layer
		jQuery(document).trigger("map.opacityChange", {LayerId: layerId, opacity: value});
	},
	changeGetFeatureState: function(model, val, options){
		var value = model.get("getFeature");
		var layerId = model.get("LayerId");
		//tell map to change the getFeature status for this layer
		var mapEvent = null;
		if (value){
			mapEvent = "map.getFeatureInfoOn";
		} else {
			mapEvent = "map.getFeatureInfoOff";
		}
		jQuery(document).trigger(mapEvent, {LayerId: layerId});
	},
	
	changePreview:function( model, val, options){
		var preview = model.get("preview");
		var layerId = model.get("LayerId");
		if (preview == "on"){
			jQuery(document).trigger("view.previewOn", {LayerId: layerId});//show correct state in table control
			jQuery(document).trigger("previewLayerOn", {LayerId: layerId});//show layer on map
		} else {
			jQuery(document).trigger("view.previewOff", {LayerId: layerId});
			jQuery(document).trigger("previewLayerOff", {LayerId: layerId});
			//also set getFeature state to off.
			if (model.has("getFeature")){
				model.set({getFeature: "off"});
			}
		}
		console.log( model.get("LayerId") + " changed preview to " + preview);
	},

	isPreviewed: function(layerId){
		var currModel = this.get(layerId);
		var stateVal = false;
		if (typeof currModel != "undefined"){
			var previewVal = currModel.get("preview");
			if (previewVal == "on"){
				stateVal = true;
			}
		}
		return stateVal;
	},
	getLayerModel: function(resultModel){
		this.add(resultModel.attributes);
		var layerModel = this.get(resultModel.get("LayerId"));
		return layerModel;
	},
	resetState: function(attributeName){
		this.each(function(currModel){
			var defaultValue = currModel.defaults[attributeName];
			console.log(defaultValue);
			if (typeof defaultValue != "undefined"){
				currModel.set(attributeName, defaultValue);
			}
		});
	}

});
