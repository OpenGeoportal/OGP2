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


OpenGeoportal.Views.LayerTable = Backbone.View
		.extend({

			initialize : function() {
				this.template = OpenGeoportal.ogp.template;
				this.tableControls = OpenGeoportal.ogp.tableControls;
				this.tableConfig = this.createTableConfig();

				this.previewed = OpenGeoportal.ogp.appState.get("previewed");
				this.adjustColumnsHandler();
				this.initSubClass();
				this.subviewStorage();
				this.render();
				this.afterRender();

			},
			initSubClass: function(){
				//nop
			},
			afterRender: function(){
				//nop
			},
			emptyTableMessage: 	"No data layers have been added to the collection.",

			adjustColumnsHandler: function() {
				var that = this;

				jQuery(document).on("panelResizing adjustContents", "#left_col", function() {
					// console.log("adjustColumns triggered");
					that.adjustColumnSizes();
				});
			},
			    
			createNewRow: function(model){
				var row = new OpenGeoportal.Views.LayerRow(
						{
							model : model,
							tableConfig: this.tableConfig
						});
				this.appendSubview(row);
				return row;
			},
			
			getTable: function(){
				return jQuery(this.template.tableView({tableHeader: this.template.tableHeader(this.getHeaderInfo()), tableFooter: this.template.divNoId({elClass: "bottomSpacer"})}));
			},
			
			
			subviewStorage: function(){
				this.subviews = {rows: []};
			},
			
			appendSubview: function(view){
				this.subviews.rows.push(view);	
				//console.log("adding to end:" + view.model.get("resultNum"));
			},
			
			prependSubview: function(view){
				this.subviews.rows.unshift(view);	
				//console.log("adding to beginning:" + view.model.get("resultNum"));
			},
			
			closeFirstSubview: function(){
				var view = this.subviews.rows.shift();
				//console.log("closing first:" + view.model.get("resultNum"));
				view.close();
			},
			
			closeLastSubview: function(){
				var view = this.subviews.rows.pop();
				//console.log("closing last:" + view.model.get("resultNum"));
				view.close();
			},
			
			closeAllSubview: function(){
				_.each(this.subviews.rows, function(view){
					//console.log("closing all");
					view.close();
				});
				this.subviews.rows = [];
			},
			
			updateSubviews: function(){
				_.each(this.subviews.rows, function(view){
					//console.log("update subviews");
					view.render();
				});
				
			},
			
			
			renderHeaders: function(){

				this.$el.children(".tableWrapper").children(".tableHeaders").first().replaceWith(this.template.tableHeader(this.getHeaderInfo()));

			},
			
			handleEmptyTable: function(table$){
				table$.append(this.template.emptyTable({message: this.emptyTableMessage}));
			},
			
			shouldProcessRow: function(model){
				return true;
			},
			
			render : function() {
				var that = this;
				var template$ = this.getTable();
				
				
				var rowcount = 0;
				var rows = [];

				this.collection.each(function(model) {
					if (!that.shouldProcessRow(model)){return;}
					var row = that.createNewRow(model);
					rows.push(row.el);
					rowcount++;
				});
				
				if (rowcount === 0){
					this.handleEmptyTable(template$);
					
				} else {
					template$.find(".rowContainer").first().prepend(rows);
				}
				
				this.$el.html(template$);
				
				this.updateColWidths();
				this.resizeColumns();
				this.$el.trigger("render");
				return this;

			},
			
			getHeaderInfo: function(){
				var headers = this.tableConfig.where({visible: true});
				var arrHeaders = [];
				_.each(headers, function(model){
					var obj = {
							header: model.get("header"),
							columnClass: model.get("columnClass")
					};
					arrHeaders.push(obj);
				});
				
				return {headers: arrHeaders};
			},
			
			updateColWidths: function(){
				var that = this;
				this.tableConfig.each(
						function(model){
							var width = model.get("width");
							var cclass = model.get("columnClass"); 
							that.$el.find("." + cclass).width(width);
							});
			},

			// dynamically size the table depending on visible columns & the width of
			// the container
			adjustColumnSizes: function() {

				/*
				 * determine which fields are showing, set widths from header object if
				 * they add up to the total width, we're done. otherwise we need to
				 * adjust. we also need to maintain minimum widths
				 */

				var resizables = this.tableConfig.where({visible: true, resizable: true});
				var fixed = this.tableConfig.where({visible: true, resizable: false});
				
				
				var test$ = jQuery(".tableHeaders ." + resizables[0].get("columnClass"));
				var extrawidth = parseInt(test$.css("padding-left")) + parseInt(test$.css("padding-right")) + parseInt(test$.css("border-right-width")) + parseInt(test$.css("border-left-width"));
				var numColumns = resizables.length;
				if (numColumns === 0) {
					throw new Error("No resizable columns!");
					//return; // we're done. exit the function
				}

				// remaining width must be distributed among visible resizable columns
				// outerWidth of visible resizable columns must total remaining width
				var fixedWidth = 0;
				_.each(fixed, function(model){
					fixedWidth += model.get("width") + extrawidth;
				});
				var remainingWidth = this.$el.parent().width()
						- fixedWidth - OpenGeoportal.Utility.getScrollbarWidth();

				// at this point, remainingWidth must be a positive value. make sure
				// minWidth of the panel is set to ensure this.
				if (remainingWidth < 0) {
					return;
					//throw new Error("Minimum column width is less than panel width. Adjust minWidth for the panel to ensure this does not happen.");
				}

				
				var resizablesWidth = 0;
				var resizablesMinWidth = 0;
				_.each(resizables, function(model){
					resizablesWidth += model.get("width");
					resizablesMinWidth += model.get("minWidth");
				});

				
				if (remainingWidth === resizablesWidth) {
					// console.log("no change. quitting resize.");
					return;
				}

				// console.log("remaining width minus minwidths: " + (remainingWidth -
				// totalMinWidth));
				while ((remainingWidth - resizablesMinWidth) < 0) {
					console.log("should remove a column");
					// we need to remove columns until remainingWidth is a positive
					// value
					//resizables = this.removeExtraColumn(resizables);
					//resizablesMinWidth = this.getTotalMinWidths(resizables);
					//resizablesWidth = this.getTotalWidths(resizables);
				}

				numColumns = resizables.length;
				if (numColumns === 0) {
					// console.log("no resizables found.");
					return; // we're done. exit the function
				}

				var play = remainingWidth - resizablesWidth;

				// padding and border accounted in totalWidth
				var colOffset = Math.floor(play / numColumns) - extrawidth;
				var colRemainder = play % numColumns;

				var newSizes = [];
				var totalNewWidth = 0;
				var minWidthCarryOver = 0;

				_.each(resizables, function(model){
					var size = {};

					size.oldWidth = model.get("width");
					
					size.newWidth = size.oldWidth + colOffset + colRemainder;
					// just apply the remainder for the first iteration
					colRemainder = 0;

					size.minWidth = model.get("minWidth");
					newSizes.push(size);


					if (size.newWidth < size.minWidth) {
						// what happens if it's the last resizable?
						minWidthCarryOver += size.minWidth - size.newWidth;
						size.newWidth = size.minWidth - extrawidth;
					}

				});



				for (var i in resizables){
					var model = resizables[i];
					var currSize = newSizes[i];
					var newWidth = currSize.newWidth - minWidthCarryOver;
					if (newWidth >= currSize.minWidth) {
						model.set({
							width : newWidth
						});
						minWidthCarryOver = 0;
					} else {
						model.set({
							width : currSize.minWidth
						});

						minWidthCarryOver = currSize.minWidth - currSize.newWidth
								+ minWidthCarryOver;
						// need to propogate the difference bw minWidth and newWidth

					}
				};

				this.updateColWidths();
				
			},
			
			resizeColumns: function() {
				//mark columns that are resizable and store selectors
				//this.markResizableColumns();

				var columns = this.tableConfig.where({resizable: true, visible: true});
				// we need at least 2 columns for resizing to work
				if (columns.length < 2) {
					return;
				}

				/*var that = this;
				try{
				_.each(columns, function(model){
					var colClass = model.get("columnClass");
					var sel = that.$el.find(".tableHeaders ." + colClass).first()[0];					
					model.set({headerEl: sel});
				});
				} catch (e){
					console.log("error");
					console.log(e);
				}*/
				
				//don't apply resizable to the last resizable column
				for (var i = 0; i < (columns.length - 1); i++) {
					if (!columns.hasOwnProperty(i)){
						continue;
					}
					var currentModel = columns[i];
					var remainingColumns = columns.slice(i);

					// reset column resizable state; trying to destroy a 'resizable' that hasn't been initialized causes an error
					if (currentModel.has("resizableApplied") && currentModel.get("resizableApplied")){
						try{
							jQuery(sel).resizable("destroy");
							currentModel.set({resizableApplied: false})
							//console.log("resizable removed");
						} catch (e){
							//sometimes no resizable to destroy...
							//TODO: debug
						}

					}

					this.addResizableColumn(currentModel, remainingColumns);

					
					
				}

			},

			addResizableColumn: function(model, remainingColumns) {
				var that = this;
				var colClass = model.get("columnClass");
				var alsoResizeString = ".rowContainer ." + colClass; 
				
				var resizableEl$ = that.$el.find(".tableHeaders ." + colClass);
				resizableEl$.resizable(
						{
							create: function( event, ui ) {
								//console.log("created resizable");
								model.set({resizableApplied: true});
							},
							alsoResize : alsoResizeString,
							handles : "e",
							minWidth : model.get("minWidth"),
							start : function(event, ui) {
								var remainingWidth = 0;
								var remainingMinWidth = 0;
								for ( var j in remainingColumns) {
									var currentCol = remainingColumns[j];
									var measuredWidth = that.$el.find(".tableHeaders ." + currentCol
											.get("columnClass")).width();

									remainingWidth += measuredWidth;
									remainingMinWidth += currentCol.get("minWidth");
								}
								var maxWidth = remainingWidth
										- (remainingMinWidth - model.get("minWidth"));
								resizableEl$.resizable("option",
										"maxWidth", maxWidth);
							},

							resize : function(event, ui) {
								var totalPlay = ui.size.width - ui.originalSize.width;

								for ( var k in remainingColumns) {
									if (remainingColumns[k] === model) {
										continue;
									}
									// no room to adjust
									if (totalPlay === 0) {
										break;
									}
									var colModel = remainingColumns[k];
									var currentWidth = colModel.get("width");

									var currentMinWidth = colModel.get("minWidth");
									var newWidth = 0;
									var proposedNewWidth = currentWidth - totalPlay;

									if (proposedNewWidth <= currentMinWidth) {
										totalPlay -= (currentWidth - currentMinWidth);
										newWidth = currentMinWidth;
									} else {
										newWidth = proposedNewWidth;
										totalPlay = 0;
									}
									var innerResize$ = that.$el.find(".rowContainer ." + colModel.get("columnClass"));
									var header$ = that.$el.find(".tableHeaders ." + colModel
											.get("columnClass"))
									var colResizables$ = header$.add(innerResize$);
									//console.log("next resize " + colModel.get("columnClass"));
									colResizables$.width(newWidth);
								}
								// adjust all remaining resizables a little
								// (difference/num remaining resizables). apply any
								// remainder to the next resizable
								// we also have to keep track of deltas that don't get
								// applied since we hit minWidth
							},

							stop : function(event, ui) {
								//update widths in the collection
								model.set({width: resizableEl$.width() });
								for ( var j in remainingColumns) {
									var currentCol = remainingColumns[j];
									var measuredWidth = that.$el.find(".tableHeaders ." + currentCol
											.get("columnClass")).width();
									currentCol.set({
										width : measuredWidth 
									});
								}
								that.updateColWidths();

							}

						});
			},

			// converts solr response object to backbone models
			solrToCollection: function(dataObj) {
				// dataObj is a Javascript object (usually) returned by Solr

				// var solrResponse = dataObj.response;
				// var totalResults = solrResponse.numFound;
				// var startIndex = solrResponse.start;
				var solrLayers = dataObj.response.docs;

				// solr docs holds an array of hashtables, each hashtable contains a
				// layer

				var arrModels = [];
				_.each(solrLayers, function(solrLayer){
					//just parse the json here, so we can use the results elsewhere
					var locationParsed = {};
					try {
						var rawVal = solrLayer.Location;
						if (rawVal.length > 2){
							locationParsed = jQuery.parseJSON(rawVal);
						}
					} catch (e){
						console.log([solrLayer["LayerId"], e]);
					}
					solrLayer.Location = locationParsed;
					
					try {
						var dataType = solrLayer.DataType.toLowerCase();
						dataType = dataType.replace(" ", "");
						if (dataType == "papermap" || dataType == "scannedmap"){
							solrLayer.DataType = "ScannedMap";
						}
					} catch (e1){
						console.log(e1);
					}
					arrModels.push(solrLayer);
				});
				return arrModels;
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
			},


			createTableConfig: function() {
				var that = this;
				var tableConfigCollection = new OpenGeoportal.TableConfig();
				this.addColumns(tableConfigCollection);

				return tableConfigCollection;
			}


		});
