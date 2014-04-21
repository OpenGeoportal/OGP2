/**
 * This javascript module includes functions for dealing with the search results
 * table, which inherits from the object LayerTable. LayerTable uses the
 * excellent jQuery-based dataTables as the basis for the table.
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * SearchResultsTable constructor this object defines the behavior of the search
 * results table, inherits from the LayerTable
 * 
 * @param object
 *            OpenGeoportal.OgpSettings
 */
OpenGeoportal.SearchResultsTable = function SearchResultsTable() {
	OpenGeoportal.LayerTable.call(this);

	this.tableOrganize = new OpenGeoportal.TableSortSettings();
	var that = this;

	this.backingData = OpenGeoportal.ogp.results;

	this.cart = OpenGeoportal.ogp.appState.get("cart");

	this.addTableDrawCallback("sortGraphics", function() {
		this.createSortGraphics();
	});
	// this.addTableDrawCallback("markPreviewed",
	// function(){this.markPreviewedLayers();});

	/*
	 * insert into tableConfig "Save": {"ajax": false, "resizable": false,
	 * "organize": false, "columnConfig": {"sName": "Save", "sTitle": "<div
	 * class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>",
	 * "bVisible": true, "aTargets": [ 3 ], "sClass": "colSave", "sWidth":
	 * "19px", "bSortable": false, "fnRender": function(oObj){return
	 * thisObj.getSaveControl(oObj);}}}
	 */
	
	var columnObj = {
		order : 1,
		columnName : "Save",
		solr : false,
		resizable : false,
		organize : false,
		visible : true,
		hidable : false,
		header : "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>",
		columnClass : "colSave",
		width : 19,
		dtRender : function(data, type, full) {
			var layerId = full.LayerId;
			var stateVal = false;
			var selModel =	that.cart.findWhere({
				LayerId : layerId
			});
			if (typeof selModel !== 'undefined') {
				stateVal = true;
			}
			return that.controls.renderSaveControl(stateVal);
		},
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

	};

	this.tableHeadingsObj.add(columnObj);

	this.adjustForScrollbar = function() {
		// we need to make adjustments for Windows non webkit browsers
		// console.log(columnDefs[columnDefs.length - 1]);
		// returns 0 for browsers that don't need adjustment
		var scrollbarWidth = OpenGeoportal.Utility.getScrollbarWidth();
		if (scrollbarWidth === 0) {
			return;
		}

		var models = this.tableHeadingsObj.where({
			visible : true
		});
		// models are ordered by display order, so we can just take the last
		// visible one
		var model = models[models.length - 1];
		var newWidth = model.get("width") + scrollbarWidth;
		var newClass = model.get("columnClass") + " scrollBarAdjust";
		model.set({
			width : newWidth,
			columnClass : newClass
		}, {
			silent : true
		});

		// this needs to apply after creation of cells
		jQuery(
				"<style>td.scrollBarAdjust > div { margin-right:"
						+ scrollbarWidth + "px;}</style>").appendTo(
				document.documentElement);

		var panelModel = OpenGeoportal.ogp.ui.panelView.model;
		panelModel.set({
			openWidth : panelModel.get("openWidth") + scrollbarWidth
		});
		panelModel.set({
			panelMinWidth : panelModel.get("panelMinWidth") + scrollbarWidth
		});

	};

	this.lastResponse = {};

	// override
	/*
	 * In the new search paradigm, we need to have dataTable's sSource point to
	 * a function that gets a url to solr with appropriate params. some params
	 * will be passed directly from the table so that it can handle paging;
	 * possibly sorting as well
	 * 
	 */
	this.getDataTableParams = function() {
		try {
			var that = this;
			// table created
			// TODO: find the column index for "score"..probably can use
			// tableHeadingsObj since this is initialization
			var sortArr = [ 3, "desc" ];

			// we need to make adjustments for Windows IE and Firefox scrollbars
			// if we do it before getColumnDefinitions, we only have to modify
			// the model for the column
			this.adjustForScrollbar();

			var columnDefs = this.getColumnDefinitions();

			var scrollY = Math.floor(jQuery("#tabs").height() - 60) + "px";
			this.searchQ = [];
			var params = {
				"aoColumnDefs" : columnDefs,
				"fnDrawCallback" : that.runTableDrawCallbacks,
				"bAutoWidth" : false,
				"sDom" : 'rtS',
				"oLanguage" : {
					"sEmptyTable" : "No matching layers."// function(){that.getEmptyTableMessage();}()//initialize
				// the empty table
				// message
				},
				"bProcessing" : true,
				"bServerSide" : true,
				"aaSorting" : [ sortArr ],
				"iDeferLoading" : [ 0 ],
				"sScrollY" : scrollY, // should be a function to set this when
				// table height should change
				"bScrollAutoCss" : false,
				"oScroller" : {
					// "loadingIndicator": true,
					"serverWait" : 100,
					// "rowHeight": 25,
					"displayBuffer" : 3
				},
				"bDeferRender" : true,
				"sAjaxSource" : that.searcher.getSearchRequest(),
				"fnServerData" : function(sSource, aoData, fnCallback,
						oSettings) {
					oSettings.jqXHR = jQuery
							.ajax({
								"dataType" : 'jsonp',
								"crossDomain" : true,
								"jsonp" : 'json.wrf',
								"type" : "GET",
								// this should just be the solr url
								"url" : that.searcher.getSearchRequest(),
								// this should contain all the query params
								"data" : that.getAdditionalQueryData(aoData),
								"beforeSend" : function(jqXHR, settings) {
									// console.log(that.searchQ);
									// if the request is identical to the
									// previous one, then cancel call to server
									// otherwise abort previous searchs and
									// remove
									// from queue
									var paramsArr = [ "_=", "json.wrf=" ];
									var continueSend = true;

									for ( var i in that.searchQ) {
										if (OpenGeoportal.Utility.compareUrls(
												settings.url,
												that.searchQ[i].settings.url,
												paramsArr)) {

											// console.log("identical search; no
											// new search should be fired. using
											// cached results");

											// make sure that the lastResponse
											// is populated
											if (that.lastResponse
													.hasOwnProperty("aaData")) {
												that.lastResponse.sEcho = that
														.processAoData(aoData).echo;
												fnCallback(that.lastResponse);
												continueSend = false;
											}
										}
										that.searchQ[i].request.abort();
									}

									that.searchQ = [];

									if (continueSend) {
										var time = Date.now();
										that.searchQ.push({
											time : time,
											request : jqXHR,
											settings : settings
										});
									}
									// console.log(continueSend);
									return continueSend;
								},
								"success" : function(returnedData, textStatus,
										jqXHR) {

									// console.log(jqXHR);

									var dtData = {};
									var totalRecords = parseInt(returnedData.response.numFound);

									dtData.iTotalRecords = totalRecords;
									dtData.iTotalDisplayRecords = totalRecords;

									dtData.sEcho = that.processAoData(aoData).echo;
									dtData.aaData = that
											.processSearchResponse(returnedData);
									// console.log(dtData.aaData);
									fnCallback(dtData);

									that.lastResponse = dtData;
									jQuery(document).trigger(
											"searchResults.totalFound",
											totalRecords);

								},

								"error" : function(xhr, error, thrown) {
									var log = oSettings.oApi._fnLog;

									if (error == "parsererror") {
										log(oSettings, 0,
												'Invalid JSON response', 1);
									} else if (error == "abort") {
										// log(oSettings, 0, 'response aborted',
										// 1);
										console.log("request aborted");
									} else {
										log(oSettings, 0, 'Ajax error', 7);
									}
								}

							});
				}
			};

		} catch (e) {
			console.log("problem creating params.");
			console.log(e);
			throw new Error(e);
		}

		try {
			for ( var param in params) {
				this.dataTableParams[param] = params[param];
			}
		} catch (e) {
			console.log("problem setting params");
			console.log(e);
		}
		return this.dataTableParams;
	};

	this.processAoData = function(aoData) {
		var data = {};
		// console.log(aoData);
		for ( var i in aoData) {
			if (aoData[i].hasOwnProperty("name")
					&& aoData[i].hasOwnProperty("value")) {
				if (aoData[i].name === "sEcho") {
					// console.log("echo:" + aoData[i].value);
					data.echo = aoData[i].value;
				} else if (aoData[i].name === "iDisplayStart") {
					data.start = aoData[i].value;
				} else if (aoData[i].name === "iDisplayLength") {
					data.rows = aoData[i].value;
				}
			}
		}
		return data;
	};

	this.getAdditionalQueryData = function(aoData) {

		var data = this.processAoData(aoData);
		var queryData = {
			start : data.start,
			rows : data.rows
		};

		return queryData;
	};

	this.searcher = new OpenGeoportal.Views.Query({
		model : new OpenGeoportal.Models.QueryTerms(),
		el : "form#searchForm"
	});

	// we must override initControlHandlers to add additional eventhandlers to
	// the table
	this.initControlHandlers = function() {
		this.initControlHandlersDefault();
		this.initSearchResultsHandlers();
		this.sortView = new OpenGeoportal.Views.Sort({
			model : this.tableOrganize,
			el : $("#sortDropdown")
		});
		var that = this;
		this.sortView.listenTo(this.sortView.model, "change", function() {
			that.fireSearch();
		});

		var iconRenderer = function() {
			return "";
		};
		var columnMenu = new OpenGeoportal.Views.CollectionMultiSelectWithCheckbox(
				{
					collection : that.tableHeadingsObj,
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
				});

		this.previewedLayers = new OpenGeoportal.Views.PreviewedLayersTable({
			collection : that.previewed,
			el : jQuery(".dataTables_scrollHead table")
		});

	};


	// *******Search Results only

	// save "view"
	this.saveControlShowOn = function(saveControl$) {
		saveControl$.removeClass("notInCart").addClass("inCart");
		var tooltipText = "Remove this layer from your cart.";
		saveControl$.attr("title", tooltipText);
	};

	this.saveControlShowOff = function(saveControl$) {
		saveControl$.removeClass("inCart").addClass("notInCart");
		var tooltipText = "Add this layer to your cart for download.";
		saveControl$.attr("title", tooltipText);
	};

	this.saveToCartViewHandler = function() {
		var that = this;
		jQuery(document).on("view.showInCart", function(event, data) {
			var control$ = that.findSaveControl(data.layerId);
			if (control$.length > 0) {
				that.saveControlShowOn(control$);
			}
		});
		jQuery(document).on("view.showNotInCart", function(event, data) {
			var control$ = that.findSaveControl(data.layerId);
			if (control$.length > 0) {
				that.saveControlShowOff(control$);
			}
		});
	};

	this.findSaveControl = function(layerId) {
		return this.findTableControl(layerId, "td.colSave", "div.saveControl");
	};

	// save "controller"
	this.saveHandler = function() {
		var that = this;
		jQuery(document).on("click.save",
				"#" + this.getTableId() + " div.saveControl", function(event) {
					var aData = that.getRowData(this).data;
					var layerId = that.getColumnData(aData, "LayerId");
					var layerModel = that.backingData.findWhere({
						LayerId : layerId
					});
					that.cart.toggleCartState(layerModel);
				});
	};

	// *******Search Results only
	// saveLayer or previewLayer add a layer to the layerState obj, if it is not
	// there.
	// click-handler for save column

	/***************************************************************************
	 * Sorting
	 **************************************************************************/

	this.createSortGraphics = function() {
		var tableId = this.getTableId();
		var that = this;
		jQuery('#' + tableId + ' > thead > tr > th')
				.each(
						function() {
							var innerThis = jQuery(this);
							var organize = that.tableOrganize;

							that.tableHeadingsObj
									.each(function(model) {
										if (model.get("header") == innerThis
												.find('div').text()) {
											if (model.get("organize")) {
												// now, we need to get a value
												// for organize to determine
												// which class is added
												innerThis
														.removeClass("sortGraphic_unsorted");
												innerThis
														.removeClass("sortGraphic_sortedAsc");
												innerThis
														.removeClass("sortGraphic_sortedDesc");
												if (organize.get("organizeBy") == model
														.get("columnName")) {
													if (organize
															.get("organizeDirection") == "asc") {
														innerThis
																.addClass("sortGraphic_sortedAsc");
													} else if (organize
															.get("organizeDirection") == "desc") {
														innerThis
																.addClass("sortGraphic_sortedDesc");
													}
												} else {
													innerThis
															.addClass("sortGraphic_unsorted");
												}
											}
										}
									});
						});
	};

	this.headerSort = function() {
		// for each column header; will have to add a similar click handler for
		// showCol
		// the datatables object holds state info for which columns are visible
		var that = this;
		jQuery('#searchResults th').each(function() {
			jQuery(this).unbind("mouseenter.header");
			jQuery(this).bind("mouseenter.header", function() {
				jQuery(this).find('img.sortGraphic').css("display", "inline");
			});
			jQuery(this).unbind("mouseleave.header");
			jQuery(this).bind("mouseleave.header", function() {
				jQuery(this).find('img.sortGraphic').css("display", "none");
			});
			jQuery(this).unbind("click.header");
			jQuery(this).bind("click.header", function() {
				var title = jQuery(this).text();
				// translate title to tableHeading
				that.tableHeadingsObj.each(function(model) {
					if (model.get("header") == title) {
						that.sortColumns(model.get("columnName"), true);
						return;
					}
				});
			});
		});
	};

	this.sortColumns = function(heading, toggle) {
		if (heading == 'score') {
			this.tableOrganize.set({
				"organizeBy" : heading,
				"organizeDirection" : "desc"
			});
		} else if (this.tableHeadingsObj.findWhere({
			columnName : heading
		}).get("organize")) {
			var currentSort = this.tableOrganize;
			var sortDirection = "asc";
			if (currentSort.get("organizeBy") == heading) {
				// toggle direction
				if (toggle) {
					if (currentSort.get("organizeDirection") == "asc") {
						sortDirection = "desc";
					}
				}
			}
			this.tableOrganize.set({
				"organizeBy" : heading,
				"organizeDirection" : sortDirection
			});
		}
	};

	this.getEmptyTableMessage = function getEmptyTableMessage() {
		var resultsMessage = "No results were found for the terms specified.";
		return resultsMessage;
		;
	};

	/**
	 * message handler for addSpatialToEmptySearchMessage tell user how many
	 * search results are available if they turn off the map constraint
	 * 
	 * @param data
	 * @return
	 */
	this.emptySearchMessageHandler = function(data) {
		var numberOfResults = data.response.numFound;
		if (numberOfResults > 0) {
			var result = "results lie";
			if (numberOfResults == 1)
				result = "result lies";
			var initialMessage = "<p>No results were found for the terms specified.</p><p>Search results are currently limited to the visible map area.</p>";

			jQuery('#searchResultsMessage').html(
					initialMessage + "  " + numberOfResults + " " + result
							+ " outside the current map area.");
		}
	};

	this.fireSearch = function() {
		// redrawing the table causes the search to be performed
		// console
		// .log("*********************fire search***************************"
		// + Date.now());
		this.getTableObj().fnDraw();
	};

	// *******Search Results only
	/*
	 * this.tableEffect = function(status){ if (status == 'searchStart'){
	 * jQuery("#searchResults").animate({ opacity: 0.5 }, {queue: false,
	 * duration: 25}); } else if (status == 'searchEnd'){
	 * jQuery("#searchResults").animate({ opacity: 1 }, {queue: false, duration:
	 * 25}); } };
	 */

	this.updateResultsNumber = function(numFound) {
		jQuery('.resultsNumber').text(numFound);
	};
	/*
	 * if (parseInt(numFound) == 0){ //set some html below the search results
	 * table var resultsMessage = "<p>No results were found for the terms
	 * specified.</p>"; if (this.appState.get("spatialSearch")){
	 * this.addSpatialToEmptySearchMessage(); }
	 * jQuery('#searchResultsMessage').html(resultsMessage);
	 * jQuery('#searchResultsMessage').css("display", "block"); } else {
	 * jQuery('#searchResultsMessage').css("display", "none"); }
	 */

	// *******Search Results only
	this.currentSearchRequests = 0;
	/*
	 * this.searchRequest = function(startIndex){ //wait a moment before firing
	 * search, reset the wait if a new search is fired.
	 * this.currentSearchRequests++; this.deferredSearchSetTimeOut(startIndex); };
	 */

	/*
	 * Highlight previewed layers, add separator; called on table draw callback
	 */
	this.markPreviewedLayers = function() {
		// console.log("mark previewed");
		jQuery(".previewOn").closest('tr').addClass('previewedLayer');
		var previewedLayer$ = jQuery(".previewedLayer");
		previewedLayer$.removeClass('previewSeparator');
		previewedLayer$.last().addClass('previewSeparator');
	};

	this.updateSortMenu = function() {
		new OpenGeoportal.View.Sort();
		var organize = this.tableOrganize;

		var fields = this.tableHeadingsObj;
		var buttonHtml = fields.findWhere({
			columnName : organize.get("organizeBy")
		}).displayName;
		jQuery("#sortDropdownSelect > span > span").html(buttonHtml);
		jQuery("#sortDropdownMenu").find("input:radio").each(function() {
			if (jQuery(this).val() == organize.get("organizeBy")) {
				jQuery(this).attr("checked", true);
			}
		});

	};

	this.updateResultsTotalHandler = function() {
		var that = this;
		jQuery(document).on("searchResults.totalFound", function(event, data) {
			that.updateResultsNumber(data);
		});
	};

	/*
	 * this.updateSortMenuHandler = function(){ var that = this;
	 * jQuery(document).on("view.updateSortMenu", that.updateSortMenu()); };
	 */

	this.fireSearchHandler = function() {
		var that = this;
		jQuery(document).on("fireSearch", function(event) {
			// console.log(event);
			that.fireSearch.apply(that, arguments);
		});
	};

	this.initSearchResultsHandlers = function() {
		this.saveHandler();
		this.saveToCartViewHandler();
		// this.updateSortMenuHandler();

		this.fireSearchHandler();
		this.updateResultsTotalHandler();
	};
};

OpenGeoportal.SearchResultsTable.prototype = Object
		.create(OpenGeoportal.LayerTable.prototype);
