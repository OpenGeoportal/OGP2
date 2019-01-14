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
 * The PreviewedLayersTable extends LayerTable and renders and controls the preview pane.
 */
OpenGeoportal.Views.PreviewedLayersTable = OpenGeoportal.Views.LayerTable
		.extend({

            initSubClass: function (options) {
                _.extend(this, _.pick(options, "cart", "tableConfig"));
                this.previewed = this.collection;
                this.listenTo(this.collection, "change:preview add remove", this.render);
				var that = this;
				this.tableConfig.listenTo(this.collection, "change:visible", function(model){ that.updateSubviews.call(that);});
				this.listenTo(this.collection, "change:showControls", function(){jQuery(document).trigger("previewRow.expand");});
				this.listenTo(this.collection, "sort", this.render);

			},

			afterRender: function(){
            	this.addSortable();
                this.$el.on("render", $.proxy(this.addSortable, this));

            },

			addSortable: function(){
            	var that = this;
            	var $sortable = this.$el.find('.rowContainer');
            	if (!_.isUndefined($sortable.sortable('instance'))){
            		$sortable.sortable('destroy');
                }
                $sortable.sortable(
                	{
						containment: "parent",
						tolerance: "pointer",
						cursor: "move",
						update: function(){
							var newOrder = $sortable.sortable('instance').toArray();
							var order = _.range(1, newOrder.length + 1);
							_.each(newOrder, function(elId){

								var m = that.collection.get(elId.replace('preview_', ''));

								var newz = order.pop();
								m.set({zOrder: newz});
							});
							that.collection.sort();
						}
                	});
			},
			
			handleEmptyTable: function(table$){
				table$.addClass("hiddenTable");
			},
			
			renderHeaders: function(){
				//nop
			},
			
			createNewRow: function(model){
				var row = new OpenGeoportal.Views.PreviewedLayersRow(
						{
							model : model,
                            tableConfig: this.tableConfig,
                            template: this.template,
                            cart: this.cart,
                            userAuth: this.userAuth,
                            config: this.config,
                            layerState: this.layerState,
                            metadataViewer: this.metadataViewer,
                            previewed: this.collection

                        });
                this.appendSubview(row);

				return row;
			},
			
			getTable: function(){
                return jQuery(this.template.get('tableView')({tableHeader: "", tableFooter: ""}));
			},
			
			shouldProcessRow: function(model){
				return (model.get("preview") === "on");
			},
			
			createTableConfig: function() {
				//we're going to pass in the table config from the search results view.
				return null;
			}

		});
