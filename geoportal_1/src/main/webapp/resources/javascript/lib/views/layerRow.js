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
		"click .previewLink"	: "handlePreviewLink",
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
		this.template = OpenGeoportal.Template;
		this.previewed = OpenGeoportal.ogp.appState.get("previewed");

		this.login = OpenGeoportal.ogp.appState.get("login").model;

		var that = this;
		this.login.listenTo(this.login, "change:authenticated", function() {
			that.removeOnLogout.apply(that, arguments);
			that.render.apply(that, arguments);
		});
		this.listenTo(this.model, "change:showControls change:hidden", this.render);
		this.listenTo(this.model, "change:selected", this.handleSelection);
		this.subClassInit();
		this.addSubClassEvents();
		//console.log("init render");
		this.subviewStorage();
		this.render();
	},
	
	subClassInit: function(){
		//nop
	},
	subClassEvents: {},
	
	addSubClassEvents: function(){
		jQuery.extend(this.events, this.subClassEvents);
	},
	
	subviewStorage: function(){
		this.subviews = [];
	},
	
	removeOnLogout : function(loginView) {
		if (!this.login.hasAccess(this.model)) {
			this.model.set({
				preview : "off"
			});
		}
	},

	getMetadataViewer: function(){
		if (typeof this.metadataViewer === "undefined"){
			this.metadataViewer = new OpenGeoportal.MetadataViewer();	
		}
		return this.metadataViewer;
	},
	
	viewMetadata : function() {
        //temporarily disable mouseout event listener. reenable once the dialog is open.
        this.stopListening(this, "mouseout");
		var promise = this.getMetadataViewer().viewMetadata(this.model);
        var that = this;
        $.when(promise).then(function(){
            that.listenTo(that, "mouseout", that.doMouseoverOff);
        });
	},
	
	handlePreviewLink: function(){
		//if there is a previewLink, prefer it
		var url = this.getPreviewLink();
		
		if (url === null){
			//otherwise, try to form a link from the repository config info
			url = this.getRepositoryLink();
		}
		
			
		//open the url in a new tab/window
		var target = "_blank";
		window.open(url, target);

		
	},
	
	getPreviewLink: function(){
		var url = null;
		if (this.model.has("Location")){
			if (typeof this.model.get("Location").previewLink !== "undefined"){
				//go to the previewLink url
				url = this.model.get("Location").previewLink;
			} else if (typeof this.model.get("Location").externalLink !== "undefined"){
				url = this.model.get("Location").externalLink;
			}
		}
		return url;
	},
	
	getRepositoryLink: function(){
		var url = null;
		var model = this.model;
		//try to assemble a link from the config
		var rep = OpenGeoportal.Config.Repositories.findWhere({id: model.get("Institution").toLowerCase()});
				
		if (typeof rep == "undefined"){
				throw new Error("Repository could not be found");
		}
				
		
		if (rep.has("nodeType")){
			var nodeType = rep.get("nodeType");
			var url = null;
			if (rep.has("url")){
				url = rep.get("url");
			} else {
				throw new Error("Repository definition must have the parameter 'url'");
			}
			
			if (nodeType == "ogp1"){
//http://calvert.hul.harvard.edu:8080/opengeoportal/openGeoPortalHome.jsp?layer=HARVARD.SDE.GLB_INWTRA&minX=-557.578125&minY=-85.051128779807&maxX=557.578125&maxY=85.051128779807
				var params = {
						layer: model.get("LayerId"),
						minX: model.get("MinX"),
						minY: model.get("MinY"),
						maxX: model.get("MaxX"),
						maxY: model.get("MaxY")
						};
				url += "/openGeoPortalHome.jsp?" + jQuery.param(params);
				
			} else if (nodeType == "ogp2"){
//http://localhost:8080/ogp/?ogpids=HARVARD.SDE.GLB_BAILEY&bbox=-180%2C-85.051129%2C180%2C85.051129
				var bbox = [ model.get("MinX"), model.get("MinY"),model.get("MaxX"), model.get("MaxY")].join();
				var params = {
						ogpids: model.get("LayerId"),
						bbox: bbox
						};
				url += "/?" + jQuery.param(params);

			} else if (nodeType == "geoweb"){

					url += "/layer/" + model.get("LayerId");
	
			}
			
	
		} else {
			throw new Error("Repository type is not defined.");
		}
				
		return url;
			
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

		var model = this.previewed.getLayerModel(this.model);

			var update = "";
			if (model.get("preview") === "on") {
				update = "off";		

			} else {
				update = "on";
			}
			
			model.set({preview: update});	
	
	},

	
	toggleExpand : function() {
		var controls = this.model.get("showControls");
		this.model.set({
			showControls : !controls
		});
	},
	
	skipLayer: function(){
		return false;
	},
	
	close: function(){

		if (this.closeSubviews){
			this.closeSubviews();
		}
		this.remove();		
		this.stopListening();
		if (this.onClose){
			this.onClose();
		}
		
	},
	
	closeSubviews: function(){
		_.each(this.subviews, function(view){
			if (view.close){
				view.close();
			} else {
				view.remove();
				view.stopListening();
			}
		});
		if (this.expandView !== null){
			this.expandView.close();
		}
		this.subviews = [];
	},

	render : function() {
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

		_.each(visibleColumns, function(currCol){
			
			var contents = "";
			if (currCol.has("modelRender")) {
				contents = currCol.get("modelRender")(model);
				html += that.template.get('cartCell')({
					colClass : currCol.get("columnClass"),
					contents : contents
				});
			} else {
				contents = model.get(currCol.get("columnName"));
				html += that.template.get('textCartCell')({
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
		
		return this;

	},
	
	expandView: null,
	
	renderExpand: function(){

		var expand$ = "";
		if (this.model.get("showControls")) {

				expand$ = jQuery(this.template.get('cartPreviewToolsContainer')());
				// a view that watches expand state
				// Open this row
				var tools$ = expand$.find(".previewTools").first();

				var previewModel = this.previewed.getLayerModel(this.model);


				this.expandView = new OpenGeoportal.Views.PreviewTools({
					model : previewModel,
					el : tools$
				});// render to the container

		} else {
			if (this.expandView !== null){

				this.expandView.close();
			}
		}

		return expand$;
	},

	handleSelection: function(){
		if (this.model.get("selected")){
            //this.stopListening(this, ["mouseover", "mouseout"]);
			this.doSelectionOn();
		} else {
			this.doSelectionOff();
            //this.listenTo(this, "mouseover", this.doMouseoverOn);
            //this.listenTo(this, "mouseout", this.doMouseoverOff);
		}
	},

    doMouseoverOn: function(){
        this.model.set({selected: true});
    },

    doMouseoverOff: function(){
        this.model.set({selected: false});
    },

	doSelectionOn : function(){
		this.highlightRow();
		this.showBounds();
	},
	
	doSelectionOff: function(){
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

    getBounds: function(){
        var currModel = this.model;
        var bbox = {};
        bbox.south = currModel.get("MinY");
        bbox.north = currModel.get("MaxY");
        bbox.west = currModel.get("MinX");
        bbox.east = currModel.get("MaxX");
        return bbox;
    },
	
	showBounds : function() {
        var bbox = this.getBounds();
		jQuery(document).trigger("map.showBBox", bbox);

	},
	
	hideBounds : function() {
        var bbox = this.getBounds();
        jQuery(document).trigger("map.hideBBox", bbox);

    }
});
