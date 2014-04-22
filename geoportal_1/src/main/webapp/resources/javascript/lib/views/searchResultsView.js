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


OpenGeoportal.Views.SearchResultsTable = OpenGeoportal.Views.LayerTable
		.extend({

			events: {
				"render": "attachScrollHandler"
			},
			initSubClass: function(){
				this.cart = OpenGeoportal.ogp.appState.get("cart");
				this.tableOrganize = new OpenGeoportal.TableSortSettings();
				
				this.tableLayerState = new OpenGeoportal.TableRowSettings();
				this.sortView = new OpenGeoportal.Views.Sort({
					model : this.tableOrganize,
					el : $("#sortDropdown"),
					headings: this.tableConfig
				});
				var that = this;
				this.sortView.listenTo(this.sortView.model, "change", function(){ that.collection.getResults();});
				var iconRenderer = function() {
						return "";
				};
				
				var columnMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox(
							{
								collection : this.tableConfig,
								el : "div#columnDropdown",
								collectionFilter : {
									attr : "hidable",
									val : true
								},
								valueAttribute : "columnName",
								displayAttribute : "displayName",
								selectionAttribute : "visible",
								buttonLabel : "Columns",
								itemClass : "columnMenuItem",
								iconRenderer : iconRenderer,
								controlClass : "columnCheck"
							}
				);
				
				this.listenTo(this.collection, "reset", this.render);
				this.listenTo(this.collection, "reset", this.updateResultsNumber);
				//should call setFrameHeight whenever the search panel height changes
				this.listenTo(this.collection, "reset", this.setFrameHeight);
			    this.listenTo(this.collection.fullCollection, "add", this.renderRow);

				$(".rowContainer").scroll(function(e){that.checkScroll();});
				this.fireSearchHandler();
			},
			attachScrollHandler: function(){
				var that = this;
				$(".rowContainer").on("scroll", function(){that.checkScroll();});
			},
			checkScroll: function () {
			      var triggerPoint = 100; // 100px from the bottom
			      var scrollEl = $(".rowContainer")[0];
			        if( scrollEl.scrollTop + scrollEl.clientHeight + triggerPoint > scrollEl.scrollHeight ) {
			          this.collection.getNextPage(); // Load next page
			        }
			    },
			setFrameHeight: function(){
				if ($(".rowContainer").length === 0){
					return;
				}
				
				var ht = Math.ceil(jQuery(document).height() - $(".rowContainer").position().top - jQuery("#footer").height() - jQuery("#header").height());
				$(".rowContainer").height(ht);
			},
			fireSearchHandler: function(){
				var that = this;
				jQuery(document).on("fireSearch", function(){
					that.collection.getFirstPage({dataType: "jsonp", jsonp: "json.wrf"});
				});
			},
			emptyTableMessage: "No matching layers.",
			//renderedViews : {}, // keep a reference to rendered
			// views...necessary?
			renderRow : function(model) {
				var row = new OpenGeoportal.Views.SearchResultsRow(
						{
							model : model,
							tableConfig: this.tableConfig
						});
				this.$el.find(".rowContainer").append(row.el);
			},
			updateResultsNumber: function() {
				jQuery('.resultsNumber').text(this.collection.totalResults);
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
										return that.controls
												.renderExpandControl(showControls);
									}

								},
								{
									order : 1,
									columnName : "Save",
									resizable : false,
									organize : false,
									visible : true,
									hidable : false,
									header : "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>",
									columnClass : "colSave",
									width : 19,
									modelRender : function(model) {
										var layerId = model.get("LayerId");
								
										var stateVal = false;
										var selModel =	that.cart.findWhere({
											LayerId : layerId
										});
										if (typeof selModel !== 'undefined') {
											stateVal = true;
										}
													
										
										return that.controls.renderSaveControl(stateVal);
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
											return that.controls.renderTypeIcon(dataType);
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
											return that.controls.renderDate(date);
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
											return that.controls.renderRepositoryIcon(repository);

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
										return that.controls.renderMetadataControl();
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
										
										var hasAccess = true;
										var canLogin = true;
										
										var previewable = canPreview(location);
										if (previewable){
											var loginModel = OpenGeoportal.ogp.appState.get("login").model;
											hasAccess = loginModel.hasAccessLogic(access, institution);
											canLogin = loginModel.canLoginLogic(institution);
										} 

										return that.controls.renderPreviewControl(previewable, hasAccess, canLogin, stateVal);
									}
								} ]);
			}


		});
