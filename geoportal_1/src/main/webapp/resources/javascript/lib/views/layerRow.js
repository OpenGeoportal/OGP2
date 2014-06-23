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

OpenGeoportal.Views.LayerRow = Backbone.View.extend({
	tagName : "div",
	className : "tableRow",
	events : {
		"click .viewMetadataControl" : "viewMetadata",
		"click .previewControl" : "togglePreview",
		"click .colExpand" : "toggleExpand",
		"click .colTitle" : "toggleExpand",
		"mouseover" : "doMouseoverOn",
		"mouseout" : "doMouseoverOff"
	},
	
	constructor: function (options) {
		//allow options to be passed in the constructor argument as in previous Backbone versions.
		    this.options = options;
		    Backbone.View.apply(this, arguments);
		  },
		  
	initialize : function() {
		this.template = OpenGeoportal.ogp.template;
		this.metadataViewer = new OpenGeoportal.MetadataViewer();
		this.previewed = OpenGeoportal.ogp.appState.get("previewed");

		var that = this;

		this.options.tableConfig.listenTo(this.options.tableConfig, "change:visible",
				function() {
					that.render.apply(that, arguments);
				});
		this.login = OpenGeoportal.ogp.appState.get("login").model;

		this.login.listenTo(this.login, "change:authenticated", function() {
			that.removeOnLogout(that, arguments);
			that.render.apply(that, arguments);
		});
		this.listenTo(this.model, "change:showControls change:hidden", this.render);
		this.subClassInit();
		this.render();
	},
	
	subClassInit: function(){
		//nop
	},
	
	removeOnLogout : function(loginView) {
		if (!this.login.hasAccess(this.model)) {
			this.model.set({
				preview : "off"
			});
		}
	},

	viewMetadata : function() {
		// console.log(arguments);
		this.metadataViewer.viewMetadata(this.model);
	},

	updateView: function(e, data){

		if (this.model.get("LayerId") === data.LayerId){
			if (e.type === "previewLayerOff"){
				if (this.model.has("hidden")){
					this.model.set({hidden: false});
					return;
				}
			}
			this.render();
		}
	},
	
	togglePreview : function(e) {
		var layerId = this.model.get("LayerId");
		var model = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof model === "undefined") {
			var layerAttr = null;
			try {

				layerAttr = this.model.attributes;
				layerAttr.preview = "on";
			} catch (err) {
				console.log(err);
			}
			// add them to the previewed collection. Add them as attributes
			// since we
			// are using different models in the previewed collection, and we
			// want
			// "model" to be called
			this.previewed.add(_.clone(layerAttr));

		} else {
			var update = "";
			if (model.get("preview") === "on") {
				update = "off";		

			} else {
				update = "on";
			}
			
			model.set({preview: update});	

		}
	
	},

	getModelFromPreviewed: function(){
		var layerId = this.model.get("LayerId");
		var model = this.previewed.findWhere({
			LayerId : layerId
		});
		if (typeof model === "undefined") {
			// get the attributes for the layer retrieved from solr
			var layerAttr = null;
			try {

				layerAttr = this.model.attributes;
			} catch (e) {
				console.log(e);
			}
			// add them to the previewed collection. Add them as attributes
			// since we
			// are using different models in the previewed collection, and we
			// want
			// "model" to be called
			this.previewed.add(_.clone(layerAttr));
			var newmodel = this.previewed.findWhere({
				LayerId : layerId
			});
			return newmodel;
		} else {
			return model;
		}
	},
	
	toggleExpand : function() {
		// console.log("toggleExpand");
		var controls = this.model.get("showControls");
		this.model.set({
			showControls : !controls
		});
	},
	
	skipLayer: function(){
		return false;
	},
	
	render : function() {
		//console.log("render row");
		if (this.skipLayer()){
			this.$el.html("");
			this.$el.addClass("hiddenRow");
			return this;
		} else {
			this.$el.removeClass("hiddenRow");
		}
		var html = "";
		var that = this;
		var model = this.model;
		// determine which td elements are visible from the the
		// tableConfig model
		var visibleColumns = this.options.tableConfig.where({
			visible : true
		});

		var i = null;
		_.each(visibleColumns, function(currCol){
			
			var contents = "";
			if (currCol.has("modelRender")) {
				contents = currCol.get("modelRender")(model);
				html += that.template.cartCell({
					colClass : currCol.get("columnClass"),
					contents : contents
				});
			} else {
				contents = model.get(currCol.get("columnName"));
				html += that.template.textCartCell({
					colClass : currCol.get("columnClass"),
					contents : contents
				});
			}
		});
		
		var container$ = this.renderExpand();
		
		if (container$ !== ""){
			this.$el.html(html).append(container$);

		} else {
			this.$el.html(html);
		}
		
		this.options.tableConfig.each(
				function(model){
					var width = model.get("width");
					var cclass = model.get("columnClass"); 
					that.$el.find("." + cclass).width(width);
					});
		
		this.$el.trigger("render.row");
		return this;

	},
	
	renderExpand: function(){
		var expand$ = "";
		
		if (this.model.get("showControls")) {
				expand$ = jQuery(this.template.cartPreviewToolsContainer());
				// a view that watches expand state
				// Open this row
				var tools$ = expand$.find(".previewTools").first();
				var previewModel = this.getModelFromPreviewed();
				var view = new OpenGeoportal.Views.PreviewTools({
					model : previewModel,
					el : tools$
				});// render to the container
				this.model.set({
					toolView : view
				});
		
		} else {
			if (this.model.has("toolView")) {
				this.model.get("toolView").remove();
				this.model.unset("toolView");
			}
		}
		return expand$;
	},
	
	doMouseoverOn : function(){
		this.highlightRow();
		this.showBounds();
	},
	
	doMouseoverOff: function(){
		this.unHighlightRow();
		this.hideBounds();
	},
	
	highlightRow : function(){
		jQuery(".tableRow").removeClass("rowHover");
		this.$el.addClass("rowHover");

	},
	
	unHighlightRow: function(){
		this.$el.removeClass("rowHover");
	},
	
	showBounds : function() {
		var currModel = this.model;
		var bbox = {};
		bbox.south = currModel.get("MinY");
		bbox.north = currModel.get("MaxY");
		bbox.west = currModel.get("MinX");
		bbox.east = currModel.get("MaxX");
		jQuery(document).trigger("map.showBBox", bbox);
		// console.log("triggered map.showBBox");

	},
	
	hideBounds : function() {
		jQuery(document).trigger("map.hideBBox");
	}
});
