/**
 * This javascript module includes functions for dealing with the search 
 * results table, which inherits from the object LayerTable.  LayerTable uses the excellent
 * jQuery-based dataTables as the basis for the table.
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * SearchResultsTable constructor
 * this object defines the behavior of the search results table, inherits from the LayerTable
 * 
 * @param object OpenGeoportal.OgpSettings
 */
OpenGeoportal.SearchResultsTable = function SearchResultsTable(stateObj){
	OpenGeoportal.LayerTable.call(this, stateObj);
	
	this.tableSettings.tableSorter = new OpenGeoportal.TableSortSettings();
	this.tableOrganize = this.tableSettings.tableSorter;
	
	this.addTableDrawCallback("sortGraphics", function(){this.createSortGraphics();});
	this.addTableDrawCallback("markPreviewed", function(){this.markPreviewedLayers();});
	
	/*
	 * insert into tableConfig
	"Save": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
	{"sName": "Save", "sTitle": "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>", "bVisible": true, "aTargets": [ 3 ], "sClass": "colSave", "sWidth": "19px", "bSortable": false,
		"fnRender": function(oObj){return thisObj.getSaveControl(oObj);}}}
		*/
	var that = this;
	var columnLabel = "Save";
	var columnObj = {
			"ajax": false, 
			"resizable": false, 
			"organize": false, 
			"columnConfig": {
				"sName": "Save", 
				"sTitle": "<div class=\"cartIconTable\" title=\"Add layers to your cart for download.\" ></div>", 
				"bVisible": true, 
				"aTargets": [ 2 ], 
				"sClass": "colSave", 
				"sWidth": "19px", 
				"bSortable": false,
				"fnRender": function(oObj){return that.getSaveControl(oObj);}
			}
	};
	
	this.tableSettings.tableConfig.insertColumn(columnLabel, columnObj);
		
	//override
	this.getDataTableParams = function(){
		var that = this;
		var columnDefinitions = this.tableHeadingsObj.getColumns();
		//table created
		var params = {
			"aoColumnDefs": columnDefinitions,
			"fnDrawCallback": that.runTableDrawCallbacks,
			"bAutoWidth": false,
			"sDom": 'rtS',
			"oLanguage": {
				"sEmptyTable": that.getEmptyTableMessage()//initialize the empty table message
			},
			"bProcessing": true,
			"bServerSide": true,
			"sScrollY": "630px",	//TODO: should be set elsewhere
			"oScroller": {
				"loadingIndicator": false
			},
			"bDeferRender": true,
			"sAjaxSource": that.searcher.getSearchRequest(),
			"fnServerData": function ( sSource, aoData, fnCallback, oSettings ) {
	        	//console.log(oSettings);
	            oSettings.jqXHR = jQuery.ajax( {
	    		  "jsonp": 'json.wrf',
	              "type": "GET",
	              "url": that.searcher.getSearchRequest(),
	              "data": that.getAdditionalQueryData(aoData),
	              "success": function(data){
	            	  var response = {};
	            	  data = jQuery.parseJSON(data);
	            	  var solrdocs = data.response.docs;
	            	  var totalRecords = parseInt(data.response.numFound);
	            	  response.iTotalRecords = totalRecords;
	            	  response.iTotalDisplayRecords = totalRecords;
	            	  response.sEcho = echo;
	            	  response.aaData = that.searcher.processData(data);
	            	  fnCallback(response);
	            	  }
	            } );
			}
		};
		
		try {
		for (var param in params){
			this.dataTableParams[param] = params[param];
		}
		} catch(e){
			console.log("problem setting params");
			console.log(e);
		}
		return this.dataTableParams;
	};
	
	this.getAdditionalQueryData = function(aoData){
		var data = {};
		for (var i in aoData){
    		if (aoData[i].name == "sEcho"){
            	echo = aoData[i].value;
			}
			if (aoData[i].name == "iDisplayStart"){
        		data["start"] = aoData[i].value;
			}
			if (aoData[i].name == "iDisplayLength"){
        		data["rows"] = aoData[i].value;
			}
			if (aoData[i].name == "iSortCol_0"){
        		console.log("sort col:" + aoData[i].value);
			}
			if (aoData[i].name == "sSortDir_0"){
        		console.log("sort dir:" + aoData[i].value);
			}
		}
		return data;
	};
	
	this.searcher = new OpenGeoportal.Search(this);
	
	//we must override initControlHandlers to add additional eventhandlers to the table
	this.initControlHandlers = function(){
		this.initControlHandlersDefault();
		this.initSearchResultsHandlers();
	};


	
	//*******Search Results only
	this.getSaveControl = function (rowObj){
		var layerId = this.getLayerIdFromRow(rowObj);
		
		var stateVal = this.layerState.getState(layerId, "inCart");
		if (typeof stateVal == 'undefined'){
			stateVal = false;
		}
		var rowNum = rowObj.iDataRow;
		if (stateVal == true){
			var value = '<div class="saveControl inCart" title="Remove this layer from your cart."></div>';
			return value;
		} else {
			var value = '<div class="saveControl notInCart" title="Add this layer to your cart for download."></div>';
			return value;
		}  
	};
	
	this.saveControlShowOn = function(saveControl$){
		saveControl$.removeClass("notInCart").addClass("inCart");
		var tooltipText = "Remove this layer from your cart.";
		saveControl$.attr("title", tooltipText);
		/*var options = { to: "#savedLayersNumberTab", className: "ui-effects-transfer"};
			jQuery(thisObj).closest('tr').effect( "transfer", options, 500, function(){
				OpenGeoportal.ui.updateSavedLayersNumber();
			});*/
	};

	this.saveControlShowOff = function(saveControl$){
		saveControl$.removeClass("inCart").addClass("notInCart");
		var tooltipText = "Add this layer to your cart for download.";
		saveControl$.attr("title", tooltipText);
	};
	
	this.saveToCartViewHandler = function(){
		var that = this;
		jQuery(document).on("view.showInCart", function(event, data){
			var control$ = that.findSaveControl(data.layerId);
			that.saveControlShowOn(control$);
		});
		jQuery(document).on("view.showNotInCart", function(event, data){
			var control$ = that.findSaveControl(data.layerId);
			that.saveControlShowOff(control$);
		});
	};
	
	this.saveHandler = function(){
		var that = this;
		jQuery(document).on("click.save", "#" + this.getTableId() + " div.saveControl", function(event){
			that.saveLayer(this);
		});
	};
	
	this.findSaveControl = function(layerId){
		return this.findTableControl(layerId, "td.colSave", "div.saveControl");
	};
	
	//*******Search Results only
	//saveLayer or previewLayer add a layer to the layerState obj, if it is not there.
	//click-handler for save column

	this.saveLayer = function(thisObj){
		var aData = this.getRowData(thisObj).data;
		var layerId = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
		var layerState = this.layerState;
		if (!layerState.layerStateDefined(layerId)){
			var dataType = aData[this.tableHeadingsObj.getColumnIndex("DataType")];
			layerState.addNewLayer(layerId, {"dataType": dataType});
		}
		if (!layerState.getState(layerId,"inCart")){
			var previewControl$ = jQuery(aData[this.tableHeadingsObj.getColumnIndex("View")]);
			if (previewControl$.hasClass("loginButton")){
				// TODO:  This section has to be redone
				OpenGeoportal.ogp.ui.authenticationWarning(thisObj, aData, true);
			} else if (previewControl$.hasClass("goExternal")){
				OpenGeoportal.ogp.ui.authenticationWarning(thisObj, aData, false);
			} else {
				this.sendToCart(aData);
			}
		} else {
			this.removeFromCart(aData);
		}
	};

	this.sendToCart = function(aData){
		var layerState = this.layerState;
		var layerId = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
		var expandIndex = this.tableHeadingsObj.getColumnIndex("expandControls");
		var institution = aData[this.tableHeadingsObj.getColumnIndex("Institution")];
		aData = [aData];
		jQuery(document).trigger('table.addToCart', aData);

		layerState.setState(layerId, {"inCart": true});

		this.analytics.track("Layer Added to Cart", institution, layerId);
	};
	
	this.removeFromCart = function(aData){
		var layerState = this.layerState;
		var layerId = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
		var expandIndex = this.tableHeadingsObj.getColumnIndex("expandControls");
		var institution = aData[this.tableHeadingsObj.getColumnIndex("Institution")];
		aData = [aData];

		jQuery(document).trigger('table.removeFromCart', aData);
		layerState.setState(layerId, {"inCart": false});

		this.analytics.track("Layer Removed From Cart", institution, layerId);
	};
	
	/******
	 * Sorting
	 *****/
	
	/**
	 * uses styledSelect to create the menu that allows a user to sort the results table by column name; dynamically created from the table object
	 */
	//TODO: update when widget is created
	this.createSortMenu = function() {
		var fields = this.tableHeadingsObj.getTableConfig();
		
		var defaultField = "Relevancy";
		var menuHtml = "";
		for (var sortIndex in fields){
			if (fields[sortIndex].organize){
				var currentField = fields[sortIndex];
				menuHtml += '<label for="sortDropdownRadio' + currentField.columnConfig.sName + '">';
				menuHtml += currentField.displayName;
				menuHtml += '</label>';
				var checked = "";
				if (currentField.displayName.toLowerCase().trim() == defaultField.toLowerCase()){
					checked += " checked=true";
				}
				menuHtml += '<input type="radio" class="sortDropdownRadio" name="sortDropdownRadio" id="sortDropdownRadio' + currentField.columnConfig.sName + '" value="' + currentField.columnConfig.sName + '"' + checked + ' />';
			}
		}
		var params = {
				"menuHtml": menuHtml,
				"text": defaultField
		};
		new OpenGeoportal.Widget.StyledSelect("sortDropdown", params);
		jQuery('.sortDropdownRadio').hide();

		var buttonHtml = defaultField; 
		jQuery(".sortDropdownSelect > span > span").html(buttonHtml);
		var that = this;
		jQuery("#sortDropdownMenu span.ui-button-text").bind("click", function(){
			var selectedField = jQuery(this).closest("label").next().val();
			var buttonHtml = fields[selectedField].displayName;
			jQuery("#sortDropdownSelect > span > span").html(buttonHtml);
			that.sortColumns(selectedField, false);
		});
		jQuery("#sortDropdownSelect").addClass("subHeaderDropdownSelect");
	};
	

	this.createSortGraphics = function(){
		var tableId = this.getTableId();
		var that = this;
		jQuery('#' + tableId + ' > thead > tr > th').each(function(){
			var innerThis = jQuery(this);
			var organize = that.tableOrganize.getState();
			for (var heading in that.tableHeadingsObj.getTableConfig()){
				if (that.tableHeadingsObj.getValue(heading, "sTitle") == innerThis.find('div').text()){
					if (that.tableHeadingsObj.getValue(heading, "organize")){
						//now, we need to get a value for organize to determine which class is added
						innerThis.removeClass("sortGraphic_unsorted");
						innerThis.removeClass("sortGraphic_sortedAsc");
						innerThis.removeClass("sortGraphic_sortedDesc");
						if (organize.organizeBy == heading){
							if (organize.organizeDirection == "asc"){
								innerThis.addClass("sortGraphic_sortedAsc");  
							} else if (organize.organizeDirection == "desc"){
								innerThis.addClass("sortGraphic_sortedDesc");  
							}
						} else {
							innerThis.addClass("sortGraphic_unsorted");  
						}
					}
				}
			}
		});
	};
	
	this.headerSort = function(){
		//for each column header;  will have to add a similar click handler for showCol
		//the datatables object holds state info for which columns are visible
		var that = this;
		jQuery('#searchResults th').each(function(){
			jQuery(this).unbind("mouseenter.header");
			jQuery(this).bind("mouseenter.header", function(){
				jQuery(this).find('img.sortGraphic').css("display", "inline");
			});
			jQuery(this).unbind("mouseleave.header");
			jQuery(this).bind("mouseleave.header", function(){
				jQuery(this).find('img.sortGraphic').css("display", "none");
			});
			jQuery(this).unbind("click.header");
			jQuery(this).bind("click.header", function(){
				var title = jQuery(this).text();
				//translate title to tableHeading
				var headingsObj = that.tableHeadingsObj.getTableConfig();
				for (var heading in headingsObj){
					if (title == that.tableHeadingsObj.getValue(heading, "sTitle")){
						that.sortColumns(heading, true);
						return;
					}
				}
			}); 
		});
	};
	
	this.sortColumns = function(heading, toggle){
		if (heading == 'score'){
			this.tableOrganize.setState({"organizeBy": heading, "organizeDirection": "desc"});
		} else if (this.tableHeadingsObj.getValue(heading, "organize")){
			var currentSort = this.tableOrganize.getState();
			var sortDirection = "asc";
			if (currentSort.organizeBy == heading) {
				//toggle direction
				if (toggle){
					if (currentSort.organizeDirection == "asc"){
						sortDirection = "desc";
					} 
				}
			}
			this.tableOrganize.setState({"organizeBy": heading, "organizeDirection": sortDirection});
		}
	};

	/*
	 * Highlight previewed layers, add separator;  called on table draw callback
	 */
	this.markPreviewedLayers = function(){
			jQuery(".previewOn").closest('tr').addClass('previewedLayer');			 
			previewedLayer$ = jQuery(".previewedLayer");
			previewedLayer$.removeClass('previewSeparator');
			previewedLayer$.last().addClass('previewSeparator');
	};


	this.getEmptyTableMessage = function getEmptyTableMessage(){
			return "";
	};

	/**
	 * message handler for addSpatialToEmptySearchMessage
	 * tell user how many search results are available if they turn off the map constraint 
	 * @param data
	 * @return
	 */
	this.emptySearchMessageHandler = function(data){
		var numberOfResults = data.response.numFound;
		if (numberOfResults > 0){
			var result = "results lie";
			if (numberOfResults == 1)
				result = "result lies";
			var initialMessage = "<p>No results were found for the terms specified.</p><p>Search results are currently limited to the visible map area.</p>";

			jQuery('#searchResultsMessage').html(initialMessage + "  " + numberOfResults + " " + result + " outside the current map area.");
		}
	};

	//*******Search Results only

	this.getNumberOfLayers = function(){
		//we want to use the dataTables paging as a buffer, so that collapsing
		//the search box or expanding preview controls does not require a new ajax call
		//get active tab
		var divId = this.getTableDiv();
		var tableDiv$ = jQuery('#' + divId);
		var totalHeight = tableDiv$.parent().height();
		var header$ = tableDiv$.find(".tableHeader");
		if (header$.length > 0){
			totalHeight -= header$.height();
		}
		var footer$ = tableDiv$.find(".tableFooter");
		if (footer$.length > 0){
			totalHeight -= footer$.height();
		}


		var headerRowHeight = jQuery('#' + divId + ' table.display > thead > tr').outerHeight();
		totalHeight -= headerRowHeight;

		//totalHeight -= jQuery("#searchResultsNavigation").outerHeight() || 0;

		var heightObj = {};
		var searchRowHeight = jQuery('#' + divId + ' table.display > tbody > tr').outerHeight() || 23;
		var controlRowHeight = jQuery('#' + divId + ' .previewControls').closest("tr").outerHeight() || 23;
		heightObj.rows = totalHeight / searchRowHeight;
		heightObj.buffer = heightObj.rows;
		var controlAdjust = jQuery('#' + divId + ' .previewControls').length * controlRowHeight / searchRowHeight;
		heightObj.rows = Math.floor(heightObj.rows - controlAdjust);
		if(isNaN(heightObj.rows)){
			heightObj.rows = 0;
		}
		heightObj.buffer = Math.ceil(heightObj.buffer);
		if(heightObj.buffer == "Infinity"){
			heightObj.buffer = 0;
		}
		this.displayedLayers.numberOfLayers = heightObj.rows;
		//console.log(heightObj);
		return heightObj;
	};


	//TODO: where is the var totalResults?
	//**************Table Specific
	this.numberOfResults = function(){
		var tableName = this.getTableId();
		var number = totalResults;

		return number;
	};


	//*******Search Results only
	this.tableEffect = function(status){
		if (status == 'searchStart'){
			jQuery("#searchResults").animate({
				opacity: 0.5
			}, {queue: false, duration: 25});
		} else if (status == 'searchEnd'){
			jQuery("#searchResults").animate({
				opacity: 1
			}, {queue: false, duration: 25});
		}
	};

	this.setResultNumber = function(numFound){
		jQuery('.resultsNumber').text(numFound);
		
		if (parseInt(numFound) == 0){
			//set some html below the search results table
			var resultsMessage = "<p>No results were found for the terms specified.</p>";
			if (this.appState.get("spatialSearch")){
				this.addSpatialToEmptySearchMessage();
			} 
			jQuery('#searchResultsMessage').html(resultsMessage);
			jQuery('#searchResultsMessage').css("display", "block");
		} else {
			jQuery('#searchResultsMessage').css("display", "none");
		}
	};
	//*******Search Results only
	this.currentSearchRequests = 0;
	/*this.searchRequest = function(startIndex){
		//wait a moment before firing search, reset the wait if a new search is fired.
		this.currentSearchRequests++;
		this.deferredSearchSetTimeOut(startIndex);
	};*/

	this.deferredSearchSetTimeOut = function(startIndex){
		var t = setTimeout('OpenGeoportal.ogp.resultsTableObj.deferredSearchStart("' + startIndex + '")', 100);
		//console.log(t);
	};

	this.deferredSearchStart = function(startIndex){
		//console.log(this.currentSearchRequests);
		this.currentSearchRequests--;
		if (this.currentSearchRequests > 0){
			this.deferredSearchSetTimeOut(startIndex);
		} else if (this.currentSearchRequests == 0){
			this.tableEffect("searchStart");
			this.searchRequestJsonp(startIndex);
			//console.log("searchRequestedfromSolr");
		} else {
			this.currentSearchRequests = 0;
		}
	};

	//*******Search Results only
	this.setTableLength = function(){
		var rows = this.getNumberOfLayers().rows;
		var tableObj = this.getTableObj();
		tableObj.fnSettings()._iDisplayLength = rows;
		tableObj.fnDraw();
	};

	this.adjustTableLength= function(rows){
		try{	
			var tableObj = this.getTableObj();
			var currentRows = tableObj.fnSettings()._iDisplayLength;
			tableObj.fnSettings()._iDisplayLength = currentRows + rows;
			tableObj.fnDraw();
		} catch (e){
			console.log(e);
		}
	};



//	*******Search Results only
/*	this.addPagingUi = function(){
		//unfortunately, startIndex is not static...we must calculate this value each
		//time & we must know how many rows are expanded;  not a big deal for 'next', but how do
		//we handle 'previous'? note..next should be working...still need a fix for previous in the case
		//that a row is expanded
		var pagingDiv = "searchResultsNavigation";
		var prefix = 'OpenGeoportal.ogp.resultsTableObj';
		//how can we calculate this?
		var navigationString = '';
		var displayedLayers = this.displayedLayers;
		var startIndex = displayedLayers.startIndex;
		var layersDisplayed = displayedLayers.numberOfLayers;
		var resultsCount = displayedLayers.totalResults;
		var prevString = '';
		var nextString = '';
		var resultsString = '';
		var pagingText = false;

		if (startIndex > 0){
			pagingText = true;
			// here if the page does not hold the first row
			var previousIndex = startIndex - layersDisplayed;
			if (previousIndex < 0){
				previousIndex = 0;
			}
			prevString += "<a href=\'javascript:" + prefix + ".searchRequest(" + previousIndex + ")\'>&lt;&lt; Previous |</a>"; 
		} else {
			prevString += '<span style="color:#CCCCCC" >&lt;&lt; Previous |</span>'; 
		}

		if ((startIndex + layersDisplayed) < resultsCount){
			pagingText = true;
			// here if this page does not hold the last row
			var nextIndex = startIndex + layersDisplayed;
			nextString += "<a href=\'javascript:" + prefix + ".searchRequest(" + nextIndex + ")\'>| Next &gt;&gt;</a>";
		}	else {
			nextString += '<span style="color:#CCCCCC" >| Next &gt;&gt;</span>';
		}


		resultsString += " Results " + (startIndex + 1) + "-" + (startIndex + layersDisplayed) + " ";

		if (pagingText){
			navigationString = "<span>" + prevString + resultsString + nextString + "</span>";
		} else {
			navigationString = "";
		}

		jQuery("div#" + pagingDiv).html(navigationString);
	};	
*/
	this.addToPreviewedLayers = function(tableRow){
		var tableObj = this.getTableObj();
		var rowData = tableObj.fnGetData(tableRow);
		this.previewedLayers.addLayer(rowData);
		function callback() {
			//if (that.getTableId() == "searchResults"){
				tableObj.fnDeleteRow(tableRow, false);
				var tableData = tableObj.fnGetData();
				tableObj.fnClearTable();
				tableData.unshift(rowData);
				tableObj.fnAddData(tableData);
				var rowOne = tableObj.fnGetNodes(0);
				var layerState = this.layerState;
				if (typeof layerState.previewCount == "undefined"){
					jQuery(rowOne).find('.expandControl').first().trigger('click');
					layerState.previewCount = true;
				} else {
					//that.callbackExpand();
				}
				jQuery(".previewedLayer").removeClass('previewSeparator');
				jQuery(".previewedLayer").last().addClass('previewSeparator');
				tableObj.fnDraw();
			//} //else if (that.getTableId() == "savedLayers"){
				//this is a little kludgey boo
				//TODO: fix this
				//OpenGeoportal.ogp.ui.previousExtent = "";
			//}
		};
		var rowOne = tableObj.fnGetNodes(0);
		var	options = { to: rowOne, 
				className: "ui-effects-transfer"};
		jQuery(tableRow).effect( "transfer", options, 250, callback);

	};

	this.removeFromPreviewedLayers = function(matchValue, matchIndex){
		this.previewedLayers.removeLayer(matchValue, matchIndex);
	};
	
	this.updateSortMenu = function(){
		var organize = this.tableOrganize.getState();

		var fields = this.tableHeadingsObj.getTableConfig();
		var buttonHtml = fields[organize.organizeBy].displayName;
		jQuery("#sortDropdownSelect > span > span").html(buttonHtml);
		jQuery("#sortDropdownMenu").find("input:radio").each(function(){
			if (jQuery(this).val() == organize.organizeBy){
				jQuery(this).attr("checked", true);
			}
		});

	};
	
	this.updateSortMenuHandler = function(){
		var that = this;
		jQuery(document).on("view.updateSortMenu", that.updateSortMenu());
	};

	this.initSearchResultsHandlers = function(){
		this.saveHandler();
		this.saveToCartViewHandler();
		this.updateSortMenuHandler();
	};
};

OpenGeoportal.SearchResultsTable.prototype = Object.create(OpenGeoportal.LayerTable.prototype);
