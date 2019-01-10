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
 * CartTable renders the CartCollection as a table. It is a parent view of CartRow, which handles rendering
 * at the row level. Extends LayerTable to add cart specific functions and behaviors.
 *
 * @type {any}
 */
OpenGeoportal.Views.CartTable = OpenGeoportal.Views.LayerTable
		.extend({
			events : {
                "change #downloadHeaderCheck": "setChecks"
			},
			
			emptyTableMessage: "No data layers have been added to the cart.",

            initSubClass: function (options) {
                _.extend(this, _.pick(options, "previewed", "config"));
                this.cart = this.collection;
                this.listenTo(this.collection, "add", this.addedToCart);
				this.listenTo(this.collection, "remove", this.removedFromCart);
                this.updateSavedLayersNumber();
			},
			
			setChecks: function(e){
				var isChecked = jQuery(e.target).is(':checked');
				
					this.collection.each(function(model){
						model.set({isChecked: isChecked});
					});
				
			},
			
			addedToCart : function(model) {
				model.set({
					isChecked : true
				});

				this.updateSavedLayersNumber();
				this.render();
			},
			
			removedFromCart : function(model) {

				this.updateSavedLayersNumber();
				this.render();
			},
			
			updateSavedLayersNumber : function() {
				var number$ = jQuery('.savedLayersNumber');

				number$.text('(' + this.collection.length + ')');

				OpenGeoportal.Utility.elementFlash(number$.parent());

			},

			createNewRow: function(model){
				var row = new OpenGeoportal.Views.CartRow(
						{
							model : model,
                            tableConfig: this.tableConfig,
                            previewed: this.previewed,
                            metadataViewer: this.metadataViewer,
                            userAuth: this.userAuth,
                            config: this.config,
                            template: this.template
						});
                this.appendSubview(row);

				return row;
			},
			
			addSharedLayers: function() {
                if (_.has(this.config, "shareIds") && this.config.shareIds.length > 0) {
					var solr = new OpenGeoportal.Solr();
					var that = this;
                    solr.getLayerInfoFromSolr(this.config.shareIds,
							function(){that.getLayerInfoSuccess.apply(that, arguments);}, 
							function(){that.getLayerInfoError.apply(that, arguments);});
					return true;
				} else {
					return false;
				}
			},

			getLayerInfoSuccess: function(data) {

				var arr = this.solrToCollection(data);
				this.collection.add(arr);
				this.previewed.add(arr);
				this.previewed.each(function(model){
					model.set({previewed: "on"});
				});
                var self = this;
				jQuery(document).trigger("map.zoomToLayerExtent", {
                    bbox: self.config.shareBbox
				});

			},

			getLayerInfoJsonpError:function() {
				throw new Error(
						"The attempt to retrieve layer information from layerIds failed.");
			}


		});
