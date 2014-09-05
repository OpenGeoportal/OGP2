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
				"render" : "attachEvents",
				"topmodel" : "renderPrevPage"
			},
			
			initSubClass: function(){
				
				this.cart = OpenGeoportal.ogp.appState.get("cart");
				
				this.tableOrganize = new OpenGeoportal.TableSortSettings();

				this.sortView = new OpenGeoportal.Views.Sort({
					model : this.tableOrganize,
					el : $("#sortDropdown"),
					headings: this.tableConfig
				});
				var that = this;
				this.sortView.listenTo(this.sortView.model, "change", function(){ that.collection.newSearch();});
				
								
				this.columnMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox(
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
								iconRenderer : function() {
									return "";
								},
								controlClass : "columnCheck"
							}
				);
				
				this.listenTo(this.collection, "add", this.appendRender);

				this.listenTo(this.collection, "reset", this.closeAllSubview);
				this.listenTo(this.collection, "reset", this.render);
				this.listenTo(this.collection, "reset", this.updateResultsNumber);
				//should call setFrameHeight whenever the search panel height changes or on render or render of previewPanel, or row render
				jQuery(document).on("search.resize previewRow.expand",  function(){that.setFrameHeight.apply(that, arguments);});

			
				this.fireSearchHandler();

			},

			afterRender: function(){
				var that = this;
				var previewed$ = this.$(".previewedLayers");
				this.previewedLayersTable = new OpenGeoportal.Views.PreviewedLayersTable({el: previewed$[0], collection: this.previewed, tableConfig: this.tableConfig});
				this.tableConfig.listenTo(this.tableConfig, "change:visible", function(model){that.renderHeaders.apply(that, arguments); that.updateSubviews.call(that); 
					that.previewedLayersTable.render();that.adjustColumnSizes(); that.resizeColumns();});

			},
			
			scrollOffset: 200,
			
			attachEvents: function(){
				this.collection.enableFetch();
				var that = this;
				this.setFrameHeight();
				var scrollTarget$ = this.$el.children(".tableWrapper").children(".rowContainer");
				scrollTarget$.off("scroll").on("scroll", function(){that.watchScroll.apply(that, arguments);});
				   
			},
			prevScrollY: 0,
			watchScroll: function(e) {
				var queryParams,
				$scrollTarget = $(e.target),
				scrollY = $scrollTarget.scrollTop() + $scrollTarget.height(),
				docHeight = $scrollTarget[0].scrollHeight;

				if (!docHeight) {
					docHeight = $(document).height();
				}

				
				if (scrollY >= docHeight - this.scrollOffset && this.prevScrollY <= scrollY) {
					this.collection.nextPage();

				} else if (scrollY < this.prevScrollY) {
					if (jQuery(".topSpacer").length > 0){
						if (jQuery(".topSpacer").position().top + jQuery(".topSpacer").height() > - this.scrollOffset){
							//add results to top
							//console.log("add results to top");
							this.$el.children(".tableWrapper").children(".rowContainer").children(".tableRow").first().trigger("istop");
						}
					}
				}
				this.prevScrollY = scrollY;
			},
			
			setFrameHeight: function(){
				var $scrollTarget = this.$el.children(".tableWrapper").children(".rowContainer");
				if ($scrollTarget.length === 0){
					return;
				}
				var previewedHeight = 0;
				if (this.$("previewedLayers").length > 0){
					previewedHeight = this.$("previewedLayers").height();
				}
				var ht = Math.ceil(jQuery(document).height() - $scrollTarget.offset().top - previewedHeight - jQuery("#footer").height());
				$scrollTarget.height(ht);
			},
			
			fireSearchHandler: function(){
				var that = this;
				jQuery(document).on("fireSearch", function(){
					that.$el.fadeTo("fast", .5);
					that.collection.newSearch();
					jQuery(document).one("newResults", function(){that.$el.fadeTo("fast", 1)});
				});
			},
			
			emptyTableMessage: "No matching layers.",
			

			
			renderPrevPage: function(event, model){
				var that = this;
				var pageSize = this.collection.pageParams.rows;
				var topResultNum = model.get("resultNum");
				
				var prevPage = this.collection.filter(function(currModel){
					var num = currModel.get("resultNum");
					return num < topResultNum && num >= Math.max(topResultNum - pageSize, 0);
				});

				var spacer$ = this.$(".topSpacer").first();;
				spacer$.css("min-height", 0);
				var container$ = this.$el.children(".tableWrapper").children(".rowContainer");
				//add them to the top in reverse order
				var revPrevPage = prevPage.reverse();
				_.each(revPrevPage, function(currModel){

					var newRow = that.createNewRow(currModel, true);
					var top$ = container$.children(".tableRow").first();
					var ht = jQuery(newRow.el).insertBefore(top$).height();
					spacer$.css("height", "-=" + ht);

					//remove rows from the end
					that.closeLastSubview();
					var last = that.collection.last();
					that.collection.remove(last);
				});
			},
			
			/*renderNextPage: function(event, model){
				var that = this;
				var pageSize = this.collection.pageParams.rows;

				var bottomResultNum = model.get("resultNum");
				var nextPage = model.collection.filter(function(currModel){
					var num = currModel.get("resultNum");
					return num > bottomResultNum && num <= bottomResultNum + pageSize;
				});
				

				var spacer$ = this.$(".bottomSpacer");
				spacer$.css("min-height", 0);
				_.each(nextPage, function(currModel){
					var newRow = that.createNewRow(currModel);
					var currentBottom$ = that.$(".tableRow").last();
					var ht = jQuery(newRow.el).insertAfter(currentBottom$).height();
					spacer$.css("height", "-=" + ht);
				});
				
				var lastNum = _.last(nextPage).get("resultNum");
				if (lastNum < this.collection.totalResults && lastNum < bottomResultNum + pageSize){
					this.collection.nextPage();
				}
			},*/

			
			appendRender: function(model){
				
				var newRow = this.createNewRow(model);
				var rowContainer$ = this.$el.children(".tableWrapper").children(".rowContainer");
				var rows$ = rowContainer$.children(".tableRow");
				rows$.last().after(newRow.el);

				if (model.get("resultNum") > 200){
					var top$ = rowContainer$.children(".tableRow").first();
					if (rowContainer$.children(".topSpacer").length === 0){
						rowContainer$.first().prepend('<div class="topSpacer"></div>');
					}
					rowContainer$.children(".topSpacer").first().css("height", "+=" + top$.height());
					this.closeFirstSubview();
					//as we add a new row, remove the last

				}

			},

			createNewRow: function(model, toTop){
				
				var row = new OpenGeoportal.Views.SearchResultsRow(
						{
							model : model,
							tableConfig: this.tableConfig
						});
				if (typeof toTop !== "undefined" && toTop){
					this.prependSubview(row);
				} else {
					this.appendSubview(row);
				}
				return row;
			},

			getTable: function(){
				return jQuery(this.template.tableView({tableHeader: this.template.tableHeader(this.getHeaderInfo()), tableFooter: ""}));
			},
			
			render : function() {
				//console.log("full render");
				var that = this;
				var previewedTable = null;
				if (this.$(".previewedLayers").length > 0){
					previewedTable = this.$(".previewedLayers").detach();
				}
				
				var template$ = this.getTable();
								
				var rowcount = 0;
				var rows = [];
				this.collection.each(function(model) {
					var row = that.createNewRow(model);
					rows.push(row.el);
					rowcount++;
				});
				
				if (rowcount === 0){
					template$.append(this.template.emptyTable({message: this.emptyTableMessage}));
					
				} else {
					template$.children(".rowContainer").append(rows);
				}
				

				if (previewedTable === null){
					previewedTable = jQuery('<div class="previewedLayers"></div>');
				}
				
				template$.children(".tableHeaders").after(previewedTable);

				this.$el.html(template$);
				
				this.updateColWidths();
				this.resizeColumns();
				
				this.$el.trigger("render");
				return this;

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
										return that.tableControls
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
													
										
										return that.tableControls.renderSaveControl(stateVal);
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
