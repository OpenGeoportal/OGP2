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
	  events: {
		    "click .viewMetadataControl"   : "viewMetadata"//this should be on the subview for the row
		 },
			initialize: function(){
				this.controls = OpenGeoportal.ogp.appState.get("controls");
				this.listenTo(this.model, "change:preview", this.render);
			},
			viewMetadata: function(){
				console.log(arguments);
				var layerId = this.model.get("LayerId");
				this.controls.viewMetadata(layerId);
			},
			render: function(){
				var html = "";
				var that = this;
				var model = this.model;

						//there should be a subview for each cell that has state
						//this view should be able to determine which td elements are visible from the the tableConfig model
						html += 
							'<td class="colExpand">' + that.controls.renderExpandControl(false) + '</td>' +
							'<td class="colSave"></td>' +
							'<td class="colType">' + that.controls.renderTypeIcon(model.get("DataType")) + '</td>' +
							'<td class="colName">' + model.get("LayerDisplayName") + "</td>" +
							'<td class="colOriginator">' + model.get("Originator") + "</td>" +
							'<td class="colSource">' + that.controls.renderRepositoryIcon(model.get("Institution")) + '</td>' +
							'<td class="colMetadata">' + that.controls.renderMetadataControl(model.get("DataType")) + '</td>' +
							'<td class="colPreview"></td>';
							
						this.$el.html(html);

				
				
				/*
				 * 
				 *     this.$el.html(this.template());

		    		this.assign(this.expandSubview,        '.colExpand');
		    		this.assign(this.saveSubview, '.colSave');
				 * 
				 * 
				 */
				return this;
				
			}
});

//I don't think I even need this?
OpenGeoportal.Views.PreviewedLayersTable = Backbone.View.extend({
	//should be subviews for each control?
	assign : function (view, selector) {
	    view.setElement(this.$(selector)).render();
	},

	initialize: function(){
		this.listenTo(this.collection, "add", this.renderRow);
		this.initRender();
		this.render();
	},
	initRender: function(){
		jQuery(".dataTables_scrollHead table").append("<tbody></tbody>");
		
	},
	renderedViews: {}, //keep a reference to rendered views
	renderRow: function(model){
		this.renderedViews[model.cid] = new OpenGeoportal.Views.PreviewedLayersRow({model: model});
		
		this.$el.append(this.renderedViews[model.cid].render().el);
		var height = jQuery(this.renderedViews[model.cid].el).height();

		jQuery(".dataTables_scrollHead").height(jQuery(".dataTables_scrollHead").height() + height);
	},
	render: function(){
		console.log(arguments);
		var html = "";
		var height = 0;
		var table$ = this.$el;
		var that = this;
		this.collection.each(function(model){
			console.log(model);
			that.renderedViews[model.cid] = new OpenGeoportal.Views.PreviewedLayersRow({model: model});
			
			table$.append(that.renderedViews[model.cid].render().el);
			height += jQuery(that.renderedViews[model.cid].el).height();
		});
		jQuery(".dataTables_scrollHead").height(jQuery(".dataTables_scrollHead thead").height() + height);
		
		
		/*
		 * 
		 *     this.$el.html(this.template());

    		this.assign(this.expandSubview,        '.colExpand');
    		this.assign(this.saveSubview, '.colSave');
		 * 
		 * 
		 */
		return this;
		
	}

});

