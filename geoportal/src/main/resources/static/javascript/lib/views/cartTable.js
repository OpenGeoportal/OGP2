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
                            userAuth: this.userAuth,
                            config: this.config,
                            template: this.template
						});
                this.appendSubview(row);

				return row;
			},

			addSharedLayers: function() {
				if (OpenGeoportal.Config.shareIds.length > 0) {
					var that = this;

					// remove surrounding quotes
					var searchIds = OpenGeoportal.Config.shareIds.map(id => id.replaceAll('"', ''));
					var query = jQuery.param({layerIds: searchIds.join(",")});
					var params = {
						type : "GET",
						url : "searchByIds?" + query,
						dataType : 'json',
						timeout : 5000,
						success : function() {
							that.getLayerInfoSuccess.apply(that, arguments);
						},
						error : function() {
							that.getLayerInfoError.apply(that, arguments);
						}
					}
					jQuery.ajax(params);
					return true;
				} else {
					return false;
				}
			},

			// converts search response object to backbone models
			solrToCollection: function(rowList) {

				var arrModels = [];
				_.each(rowList, function(row){
					//just parse the json here, so we can use the results elsewhere
					var locationParsed = {};
					try {
						var rawVal = row.Location;
						if (rawVal.length > 2){
							locationParsed = jQuery.parseJSON(rawVal);
						}
					} catch (e){
						console.log([row["LayerId"], e]);
					}
					row.Location = locationParsed;
					arrModels.push(row);
				});
				return arrModels;
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

			getLayerInfoError:function() {
				throw new Error(
						"The attempt to retrieve layer information from layerIds failed.");
			}


		});
