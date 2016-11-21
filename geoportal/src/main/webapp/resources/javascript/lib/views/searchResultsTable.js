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
 * The SearchResultsTable displays the search results. It extends LayerTable. Adds logic for infinite scroll. It's
 * backed by the ResultsCollection
 *
 * @extends OpenGeoportal.Views.LayerTable
 */
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

                //this.listenTo(this.collection, "reset", this.closeAllSubview);
				this.listenTo(this.collection, "reset", this.render);
				this.listenTo(this.collection, "reset", this.updateResultsNumber);
				//should call setFrameHeight whenever the search panel height changes or on render or render of previewPanel, or row render
				jQuery(document).on("search.resize previewRow.expand",  function(){that.setFrameHeight.apply(that, arguments);});

			
				this.fireSearchHandler();

			},

			afterRender: function(){

                if (typeof this.previewedLayersTable === "undefined") {
                    var previewed$ = this.$(".previewedLayers");
                    this.previewedLayersTable = new OpenGeoportal.Views.PreviewedLayersTable({
                        el: previewed$[0],
                        collection: this.previewed,
                        tableConfig: this.tableConfig
                    });
                }
				var that = this;
				this.tableConfig.listenTo(this.tableConfig, "change:visible", function(model){that.renderHeaders.apply(that, arguments); that.updateSubviews.call(that); 
					that.previewedLayersTable.render();that.adjustColumnSizes(); that.resizeColumns();});

			},

			scrollOffset: 300,
			
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

				var spacer$ = this.$(".topSpacer").first();
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
                return jQuery(this.template.get('tableView')({
                    tableHeader: this.template.get('tableHeader')(this.getHeaderInfo()),
                    tableFooter: ""
                }));
			},
			
			render : function() {
				//console.log("full render");
				var that = this;
				var previewedTable = null;
				if (this.$(".previewedLayers").length > 0){
					previewedTable = this.$(".previewedLayers").detach();
				}

                this.closeAllSubview();

				var rowcount = 0;
				var rows = [];
				this.collection.each(function(model) {
					var row = that.createNewRow(model);
					rows.push(row.el);
					rowcount++;
				});


                var template$ = this.getTable();

                if (rows.length === 0) {
                    template$.append(this.template.get('emptyTable')({message: this.emptyTableMessage}));
					
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
                var columns = this.columnsTemplate();
                var that = this;
                columns.splice(1, 1, {
                    order: 1,
                    columnName: "Save",
                    resizable: false,
                    organize: false,
                    visible: true,
                    hidable: false,
                    header: "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>",
                    columnClass: "colSave",
                    width: 19,
                    modelRender: function (model) {
                        var layerId = model.get("LayerId");

                        var stateVal = false;
                        var selModel = that.cart.findWhere({
                            LayerId: layerId
                        });
                        if (typeof selModel !== 'undefined') {
                            stateVal = true;
                        }

                        return that.tableControls.renderSaveControl(stateVal);
                    }
                });
                tableConfigCollection.add(columns);
			}


		});
