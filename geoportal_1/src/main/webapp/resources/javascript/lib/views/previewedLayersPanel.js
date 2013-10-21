if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined'){
	OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object"){
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}

OpenGeoportal.Views.PreviewedLayersRow = Backbone.View.extend({
	 tagName: "tr",
	 className: "previewedRow",
	  events: {
		    "click .viewMetadataControl"   : "viewMetadata",//should be on the sub-view for the row?
		    "click .colSave"    : "toggleSave",
		    "click .colPreview" : "togglePreview",
		    "click .colExpand"	: "toggleExpand",
		    "click .colTitle"	: "toggleExpand",
		    "mouseover"			: "showBounds",
		    "mouseout"			: "hideBounds"

		 },
			initialize: function(){
				this.controls = OpenGeoportal.ogp.appState.get("controls");
				this.listenTo(this.model, "change:preview", this.render);
				this.listenTo(this.model, "change:showControls", this.toggleControls);

			},
			viewMetadata: function(){
				console.log(arguments);
				var layerId = this.model.get("LayerId");
				this.controls.viewMetadata(layerId);
			},

			toggleSave: function(){
				var cart = OpenGeoportal.ogp.cartView.collection;
				cart.toggleCartState(this.model);

			},
			togglePreview: function(){
				var previewState = this.model.get("preview");
				if (previewState === "on"){
	 				this.model.set({preview: "off"});
				} else {
					this.model.set({preview: "on"});
				}
			},
			toggleExpand: function(){
				console.log("toggleExpand");
				var controls = this.model.get("showControls");
				this.model.set({showControls: !controls});
			},

			render: function(){
				var html = "";
				var that = this;
				var model = this.model;

						//there should be a subview for each cell that has state?
						//this view should be able to determine which td elements are visible from the the tableConfig model
						html += 
							'<td class="colExpand"><div class="cellWrapper">' + that.controls.renderExpandControl(model.get("showControls")) + '</div></td>' +
							'<td class="colSave"><div class="cellWrapper">' + that.controls.renderSaveControl(model.get("LayerId")) + '</div></td>' +
							'<td class="colType"><div class="cellWrapper">' + that.controls.renderTypeIcon(model.get("DataType")) + '</div></td>' +
							'<td class="colTitle"><div class="cellWrapper">' + model.get("LayerDisplayName") + "</div></td>" +
							'<td class="colOriginator"><div class="cellWrapper">' + model.get("Originator") + "</div></td>" +
							'<td class="colSource"><div class="cellWrapper">' + that.controls.renderRepositoryIcon(model.get("Institution")) + '</div></td>' +
							'<td class="colMetadata"><div class="cellWrapper">' + that.controls.renderMetadataControl(model.get("DataType")) + '</div></td>' +
							'<td class="colPreview"><div class="cellWrapper">' + that.controls.renderPreviewControl(model.get("LayerId"), model.get("Access"), model.get("Institution")) + '</div></td>';
				
				var fullRow$ = this.$el;
				if (model.get("showControls")){
					fullRow$.add(this.$el.next());
				}
				if (model.get("preview") == "off"){
					model.set({showControls: false});
					fullRow$.hide();
				} else {
					fullRow$.show();
				}
				this.$el.html(html);
				
				return this;
				
			},
			toggleControls: function(){
				this.render();
				var colspan = 8;
				if (this.model.get("showControls")){
					if (!this.model.has("toolView")){
						this.$el.after('<tr class="controls"><td class="previewTools" colspan="' + colspan + '"><div></div></td></tr>');
						//a view that watches expand state
						// Open this row 
						var tools$ = this.$el.next().find(".previewTools").first(); 
						var view = new OpenGeoportal.Views.PreviewTools({model: this.model, el: tools$});//render to the container 
						this.model.set({toolView: view});
					}
				} else {
					if (this.model.has("toolView")){
						this.model.get("toolView").remove();
						this.model.unset("toolView");
						this.$el.next().parent(".controls").remove();
					}
				}
		
		},
		showBounds: function(){
			var currModel = this.model;
			var bbox= {};
			bbox.south = currModel.get("MinY");
			bbox.north = currModel.get("MaxY");
			bbox.west = currModel.get("MinX");
			bbox.east = currModel.get("MaxX");
			jQuery(document).trigger("map.showBBox", bbox);
			console.log("triggered map.showBBox");
			
		},
		hideBounds: function(){
			jQuery(document).trigger("map.hideBBox");
		}
});

OpenGeoportal.Views.PreviewedLayersTable = Backbone.View.extend({
	//should be sub-views for each control?

	initialize: function(){
		this.listenTo(this.collection, "add", this.renderRow);
		var that = this;
		jQuery(document).on("view.showInCart", function(){that.refreshRow.apply(that, arguments);});
		jQuery(document).on("view.showNotInCart", function(){that.refreshRow.apply(that, arguments);});
		this.initRender();
		this.render();
	},
	initRender: function(){
		jQuery(".dataTables_scrollHead table").append("<tbody></tbody>");
		this.tableLayerState = new OpenGeoportal.TableRowSettings();
	},
	refreshRow: function(event, data){
		var model = this.collection.findWhere({LayerId: data.layerId});
		if (typeof model != "undefined"){
			this.renderedViews[model.cid].render();
		}
	},

	assign : function (view, selector) {
	    view.setElement(this.$(selector)).render();
	},

	renderedViews: {}, //keep a reference to rendered views
	renderRow: function(model){
		this.renderedViews[model.cid] = new OpenGeoportal.Views.PreviewedLayersRow({model: model});
		this.$el.append(this.renderedViews[model.cid].render().el);
	},
	render: function(){
		var that = this;
		this.collection.each(function(model){
			that.renderRow(model);
		});
				
		return this;
		
	}

});

