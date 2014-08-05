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


OpenGeoportal.Views.CartTable = OpenGeoportal.Views.LayerTable
		.extend({
			events : {
				"click #downloadHeaderCheck" : "setChecks"
			},
			
			emptyTableMessage: "No data layers have been added to the cart.",
			
			initSubClass: function(){
				this.listenTo(this.collection, "add", this.addedToCart);
				this.listenTo(this.collection, "remove", this.removedFromCart);
			},
			
			setChecks: function(e){
				var isChecked = jQuery(e.target).is(':checked');
				
					this.collection.each(function(model){
						model.set({isChecked: isChecked});
					});
				
			},
			
			addedToCart : function(model) {
				var layerId = model.get("LayerId");
				model.set({
					isChecked : true
				});

				this.updateSavedLayersNumber();
				this.render();
			},
			
			removedFromCart : function(model) {
				var layerId = model.get("LayerId");

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
							tableConfig: this.tableConfig
						});
				return row;
			},
			
			addSharedLayers: function() {
				if (OpenGeoportal.Config.shareIds.length > 0) {
					var solr = new OpenGeoportal.Solr();
					var that = this;
					solr.getLayerInfoFromSolr(OpenGeoportal.Config.shareIds,
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

				jQuery(document).trigger("map.zoomToLayerExtent", {
					bbox : OpenGeoportal.Config.shareBbox
				});

			},

			getLayerInfoJsonpError:function() {
				throw new Error(
						"The attempt to retrieve layer information from layerIds failed.");
			},

			addColumns: function(tableConfigCollection) {
				var that = this;
				tableConfigCollection
						.add([
								{
									order : 0,
									columnName : "expandControls",
									resizable : false,
									organize : false,
									visible : true,
									hidable : false,
									header : "",
									columnClass : "colExpand",
									width : 10,
									modelRender : function(model) {
										var showControls = model.get("showControls");
										return that.tableControls
												.renderExpandControl(showControls);
									}

								},
								{
										order : 1,
										columnName : "checkBox",
										resizable : false,
										organize : false,
										visible : true,
										hidable : false,
										header : "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />",
										columnClass : "colChkBoxes",
										width : 21,
										modelRender : function(model) {
											
											return that.tableControls.renderDownloadControl(model.get("isChecked"));
											
										}
									},
									{
										order : 2,
										columnName : "DataType",
										resizable : false,
										organize : "group",
										visible : true,
										hidable : true,
										displayName : "Data Type",
										header : "Type",
										columnClass : "colType",
										width : 30,
										modelRender : function(model) {
											var dataType = model.get("DataType");
											return that.tableControls.renderTypeIcon(dataType);
										}

									}, {
										order : 3,
										columnName : "score",
										resizable : true,
										minWidth : 27,
										width : 27,
										organize : "numeric",
										visible : false,
										hidable : false,
										displayName : "Relevancy",
										header : "Relev",
										columnClass : "colScore"
									}, {
										order : 4,
										columnName : "LayerDisplayName",
										resizable : true,
										minWidth : 35,
										width : 200,
										organize : "alpha",
										visible : true,
										hidable : false,
										displayName : "Name",
										header : "Name",
										columnClass : "colTitle"
									}, {
										order : 5,
										columnName : "Originator",
										resizable : true,
										minWidth : 62,
										width : 86,
										organize : "group",
										visible : true,
										hidable : true,
										displayName : "Originator",
										header : "Originator",
										columnClass : "colOriginator"

									}, {
										order : 6,
										columnName : "Publisher",
										resizable : true,
										minWidth : 58,
										width : 80,
										organize : "group",
										visible : false,
										hidable : true,
										displayName : "Publisher",
										header : "Publisher",
										columnClass : "colPublisher"

									}, {
										order : 7,
										columnName : "ContentDate",
										organize : "numeric",
										visible : false,
										displayName : "Date",
										resizable : true,
										minWidth : 30,
										width : 30,
										hidable : true,
										header : "Date",
										columnClass : "colDate",
										modelRender : function(model) {
											var date = model.get("ContentDate");
											return that.tableControls.renderDate(date);
										}

									}, {
										order : 8,
										columnName : "Institution",
										organize : "alpha",
										visible : true,
										hidable : true,
										resizable : false,
										displayName : "Repository",
										header : "Rep",
										columnClass : "colSource",
										width : 24,
										modelRender : function(model) {
											var repository = model.get("Institution");
											return that.tableControls.renderRepositoryIcon(repository);

										}

									}, {
										order : 9,
										columnName : "Access",
										resizable : false,
										organize : false,
										visible : false,
										hidable : false,
										header : "Access"
									}, 
								{
									order : 10,
									columnName : "Metadata",
									resizable : false,
									organize : false,
									visible : true,
									hidable : false,
									header : "Meta",
									columnClass : "colMetadata",
									width : 30,
									modelRender : function(model) {
										return that.tableControls.renderMetadataControl();
									}
								},
								{
									order : 11,
									columnName : "View",
									resizable : false,
									organize : false,
									visible : true,
									hidable : false,
									header : "View",
									columnClass : "colPreview",
									width : 39,
									modelRender : function(model) {
										var layerId = model.get("LayerId");
										var location = model.get("Location");
										var access = model.get("Access").toLowerCase();
										var institution = model.get("Institution").toLowerCase();

										var stateVal = false;
										var selModel =	that.previewed.findWhere({
											LayerId : layerId
										});
										if (typeof selModel !== 'undefined') {
											if (selModel.get("preview") === "on"){
												stateVal = true;
											}
										}
										
										var canPreview = function(location){
											//where is a good place to centralize this?
											return OpenGeoportal.Utility.hasLocationValueIgnoreCase(location, ["wms", "arcgisrest", "imagecollection"]);
										};
										
										var hasAccess = false;
										var canLogin = false;
										
										var previewable = canPreview(location);
										if (previewable){
											var loginModel = OpenGeoportal.ogp.appState.get("login").model;
											hasAccess = loginModel.hasAccessLogic(access, institution);
											canLogin = loginModel.canLoginLogic(institution);
										} else if (OpenGeoportal.Utility.hasLocationValueIgnoreCase(location, ["externallink"])){
											return that.tableControls.renderLinkControl();
										}

										return that.tableControls.renderPreviewControl(previewable, hasAccess, canLogin, stateVal);
									}
								} ]);
			}


		});
