/**
 * This javascript module includes functions for dealing with the search 
 * results table under the object LayerTable.  LayerTable uses the excellent
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
 * LayerTable constructor
 * this object defines the behavior of the search results table, as well as the saved layers table
 * 
 * @param object OpenGeoportal.OgpSettings
 */
OpenGeoportal.LayerTable = function LayerTable(){

	this.appState = OpenGeoportal.ogp.appState;

	this.previewed = this.appState.get("previewed");
	this.template = this.appState.get("template");	
	this.controls = this.appState.get("controls");	
	
	this.tableLayerState = new OpenGeoportal.TableRowSettings();
	this.analytics = new OpenGeoportal.Analytics();
	
	var that = this;
	var userDiv;
	this.setTableDiv = function(div){
		userDiv = div;
	};
	this.getTableDiv = function(){
		return userDiv;
	};
	this.getTableId = function(){
		return userDiv + "Table";
	};

	this.getTableObj = function(){
		return jQuery('#' + this.getTableId()).dataTable();
	};
	
	this.backingData;
	this.addControlColumns = function(tableConfigCollection){
		var that = this;
		tableConfigCollection.add([
		                           {
		                        	   order: 0,
		                        	   columnName: "expandControls",
		                        	   solr: false, 
		                        	   resizable: false, 
		                        	   organize: false, 
		                        	   visible: true,
		                        	   hidable: false,
		                        	   header: "",
		                        	   columnClass: "colExpand",
		                        	   width: 10,
		                        	   renderFunction: function(data, type, full){
		                        			   var layerId = full.LayerId; 
		                        				if ((typeof layerId == "undefined")||(layerId === null)){
		                        					return "";
		                        				}
		                        				var layerExpanded = that.tableLayerState.isExpanded(layerId);
		                        				return that.controls.renderExpandControl(layerExpanded);
		                        		   }
		                           },
		                           {
		                        	   order: 13,
		                        	   columnName: "Metadata",
		                        	   solr: false, 
		                        	   resizable: false,
		                        	   organize: false,
		                        	   visible: true,
		                        	   hidable: false,
		                        	   header: "Meta",
		                        	   columnClass: "colMetadata",
		                        	   width: 30,
		                        	   renderFunction: function(data, type, full){var dataType = that.getColumnData(full, "DataType"); return that.controls.renderMetadataControl(dataType);}
		                        
		                           },
		                           {
		                        	   order: 14,
		                        	   columnName: "View",
		                        	   solr: false, 
		                        	   resizable: false, 
		                        	   organize: false,
		                        	   visible: true,
		                        	   hidable: false,
		                        	   header: "View",
		                        	   columnClass: "colPreview",
		                        	   width: 39,
		                        	   renderFunction: function(data, type, full){	
		                        			   var layerId = full.LayerId;
		                        			   var access = full.Access.toLowerCase();
		                        			   var institution = full.Institution;
		                        			   return that.controls.renderPreviewControl(layerId, access, institution);
		                        		   }		                        	   
		                           }
		                           ]);
	};
	
	this.addDataColumns = function(tableConfigCollection){
		tableConfigCollection.add([

		                           {
		                        	   order: 2,
		                        	   columnName: "DataType",
		                        	   solr: true, 
		                        	   resizable: false, 
		                        	   organize: "group",
		                        	   visible: true,
		                        	   hidable: true,
		                        	   displayName: "Data Type",
		                        	   header: "Type",
		                        	   columnClass: "colType",
		                        	   width: 29,
		                        	   renderFunction: function(data, type, full){return that.controls.renderTypeIcon(data);}
		                        		   
		                           },
		                           {
		                        	   order: 3,
		                        	   columnName: "score", 
		                        	   solr: true, 
		                        	   resizable: true, 
		                        	   minWidth: 27, 
		                        	   width: 27, 
		                        	   organize: "numeric", 
		                        	   visible: false,
		                        	   hidable: false,
		                        	   displayName: "Relevancy", 
		                        	   header: "Relev",
		                        	   columnClass: "colScore"
		                           },
		                           {
		                        	   order: 4,
		                        	   columnName: "LayerId",
		                        	   solr: true, 
		                        	   resizable: false, 
		                        	   organize: false, 
		                        	   visible: false,
		                        	   hidable: false
		                           },
		                       		{
		                        	   	order: 6,
		                       			columnName: "Name",
		                       			solr: true, 
		                       			resizable: false, 
		                       			organize: false, 
		                       			visible: false,
		                       			hidable: false
									},
			                           {
										order: 5,
		                       			columnName: "WorkspaceName",
		                       			solr: true, 
		                       			resizable: false, 
		                       			organize: false, 
		                       			visible: false,
		                       			hidable: false
		                       		},
		                           {
		                       		   order: 7,
		                        	   columnName: "LayerDisplayName",
		                        	   solr: true, 
		                        	   resizable: true,
		                        	   minWidth: 35,
		                        	   organize: "alpha",
		                        	   visible: true,
		                        	   hidable: true,
		                        	   displayName: "Name",
		                        	   header: "Name",
		                        	   columnClass: "colTitle"
		                           },
		                           {
		                        	   order: 8,
		                        	   columnName: "Originator",
		                        	   solr: true, 
		                        	   resizable: true, 
		                        	   minWidth: 59,
		                        	   width: 86,
		                        	   organize: "group",
		                        	   visible: true,
		                        	   hidable: true,
		                        	   displayName: "Originator",
		                        	   header: "Originator",
		                        	   columnClass: "colOriginator"

		                           },
		                           {
		                        	   order: 9,
		                        	   columnName: "Publisher",
		                        	   solr: true, 
		                        	   resizable: true, 
		                        	   minWidth: 55,
		                        	   width: 80,
		                        	   organize: "group",
		                        	   visible: false,
		                        	   hidable: true,
		                        	   displayName: "Publisher",
		                        	   header: "Publisher",
		                        	   columnClass: "colPublisher"

		                           },
		                           {
		                        	   order: 10,
		                        	   columnName: "ContentDate",
		                        	   solr: true, 
		                        	   organize: "numeric",
		                        	   visible: false,
		                        	   displayName: "Date",
		                        	   resizable: true,
		                        	   minWidth: 30,
		                        	   width: 30,
		                        	   hidable: true,
		                        	   header: "Date",
		                        	   columnClass: "colDate",
		                        	   renderFunction: function(data, type, full){return that.controls.renderDate(data);}
		                        		   
		                           },
		                           {
		                        	   order: 11,
		                        	   columnName: "Institution",
		                        	   solr: true, 
		                        	   organize: "alpha",
		                        	   visible: true,
		                        	   hidable: true,
		                        	   resizable: false,
		                        	   displayName: "Repository",
		                        	   header: "Rep",
		                        	   columnClass: "colSource",
		                        	   width: 24,
		                        	   renderFunction: function(data, type, full){return that.controls.renderRepositoryIcon(data);}
		                        		   
		                           },
		                           {
		                        	    order: 12,
		                       			columnName: "Access",
		                       			solr: true, 
		                       			resizable: false, 
		                       			organize: false, 
		                       			visible: false,
		                       			hidable: false,
		                       			header: "Access"
		                       		}

		                           
		         ]);
	};
	
	this.createTableHeadings = function(){
		var that = this;
		var tableConfigCollection = new OpenGeoportal.TableConfig();
		this.addControlColumns(tableConfigCollection);
		this.addDataColumns(tableConfigCollection);
		tableConfigCollection.listenTo(tableConfigCollection, "change:visible", function(){that.toggleColumn.apply(that, arguments);});
		tableConfigCollection.listenTo(tableConfigCollection, "change:width", function(){that.changeColumnWidth.apply(that, arguments);});
		return tableConfigCollection;
	};
	
	
	this.tableHeadingsObj = this.createTableHeadings();

	this.getImage = function(imageName){
		return OpenGeoportal.Utility.getImage(imageName);
	};

	this.getInnerClassHtml = function(div, cssClass){
		var selector$ = jQuery("#" + div + " > ." + cssClass);
		if (selector$.length > 0){
			return selector$.html();
		} else {
			return "";
		}
	};

	this.createTableHtml = function(div){
		//test for uniqueness
		var div$ = jQuery("#" + div);
		if (div$.length == 0){
			throw new Error("The DIV [" + div + "] does not exist!");
		}
		this.setTableDiv(div);
		var tableName = this.getTableId();
		if (jQuery("#" + tableName).length > 0){
			throw new Error("An element with id[" + tableName + "] already exists!");
		}

		var resultsHTML = this.template.dataTable({tableId: tableName});
		div$.html(this.getInnerClassHtml(div, "tableHeader") + resultsHTML + this.getInnerClassHtml(div, "tableFooter"));
		return jQuery("#" + tableName);
	};
	
	this.createDataTable = function(table$, params){
		var tableObj = table$.dataTable(params);
		return tableObj;
	};

	this.dataTableParams = {};
			
	this.getColumnDefinitions = function(){
		var columnDefinitions = [];
		this.tableHeadingsObj.each(function(model){
			var config = {};
			if (model.has("columnConfig")){
				config = model.get("columnConfig");
			}
			if (model.has("header")){
				config.sTitle = model.get("header");
			}
			if (model.has("columnClass")){
				config.sClass = model.get("columnClass");
			}
			if (model.has("width")){
				config.sWidth = model.get("width") + "px";
			}
			if (model.has("visible")){
				config.bVisible = model.get("visible");
			}
			if (model.has("columnName")){
				config.mData = model.get("columnName");
			}
			if (model.has("organize")){
				config.bSortable = model.get("organize") == true;
			}
			if (model.has("order")){
				config.aTargets = [model.get("order")];
			}
			if (model.has("renderFunction")){
				config.mRender = model.get("renderFunction");
			}
			columnDefinitions.push(config);
		});
		return columnDefinitions;
	};
	
	this.getDataTableParams = function(){
		var that = this;

		//initialize table
		var tableData = [];

		//table created
		var params = {
			"aaData": tableData,
			"bSort": false,
			"aoColumnDefs": that.getColumnDefinitions(),
			"fnDrawCallback": that.runTableDrawCallbacks,
			"bAutoWidth": false,
			"sDom": 'rt',
			"oLanguage": {
				"sEmptyTable": that.getEmptyTableMessage()//initialize the empty table message
			}
		};
		
		for (var param in params){
			this.dataTableParams[param] = params[param];
		}
		return this.dataTableParams;
	};
	
	this.createTable = function(div, params){
		console.log("creating table in div..<" + div +">");
		var table$ = null;
		try{
			table$ = this.createTableHtml(div);	 
		} catch(e){
			console.log("createTableHtml error");
			console.log(e);
		}
		
		var newParams = null;
		try {
			newParams = this.getDataTableParams(params);

		} catch (e) {
			console.log("getParams error");
			console.log(e);
		}
		
		var tableObj = null;

		try {
			tableObj= this.createDataTable(table$, newParams);
		} catch (e) {
			console.log("createDataTable error");
			console.log(e);
		}
		return tableObj;
	};

	this.initTable = function(div){
		var params = arguments[1];
		try {
			var tableObj = this.createTable(div, params);
		} catch (e){
			console.log("createTable Error");
			console.log(e);
		}
		try{
			this.initControlHandlers();
		} catch (e){
			console.log("initControlHandlers Error");
			console.log(e);
		}

	};
	
	this.tableDrawCallbacks = {
			callbacks: {
				wrapCells: function(){this.wrapCells();}, 
				tooltips: function(){this.createTooltips();},
				expandRows: function(){this.callbackExpand();},
				colResize: function(){this.resizeColumnsCallback();}
			}
	};
	
	this.addTableDrawCallback = function(label, callbackFunction){
		this.tableDrawCallbacks.callbacks[label] = callbackFunction;
		
	};
	
	this.runTableDrawCallbacks = function(){
		console.log("table draw callbacks");
		var callbacks = that.tableDrawCallbacks.callbacks;
		for (var i in callbacks){
			if (callbacks.hasOwnProperty(i)){
				callbacks[i].call(that);
			}
		}
		console.log("finished table draw callbacks");
	};

	/************
	 * Helper functions
	 ***********/

	/*
	 * helper function to get backing data from DataTable, expects to be passed a dom element from the table
	 * from a click event, for example
	 * returns an array of data corresponding to the row in the table
	 */
	this.getRowData = function(thisObj){
		var tableObj = this.getTableObj();	         
		//Get the data array for this row 
		var rowData = {};
		if (jQuery(thisObj).is("tr")){
			rowData.node = jQuery(thisObj)[0];
		} else {
			rowData.node = jQuery(thisObj).closest("tr")[0];
		}
		rowData.index = tableObj.fnGetPosition(rowData.node);
		if (rowData.index === null){
			throw new Error("RowData not found.  Bad element passed to function['getRowData'].");
		} else {
			rowData.data = tableObj.fnGetData( rowData.index );	
		}
		return rowData;
	};
	
	this.getColumnsIndex = function(){
			var tableObj = this.getTableObj();
			var colSettingsArr = tableObj.fnSettings().aoColumns;
			var columnsIndex = {};
			for (var i in colSettingsArr){
				columnsIndex[colSettingsArr[i].mData] = i;
			}
		
		return columnsIndex;
	};

	/*
	 * helper function to get backing data from DataTable, expects to be passed an array of data and 
	 * the column name
	 * returns the data value for the specified column
	 */
	this.getColumnData = function(rowData, colName){
		//probably don't need this anymore
		var columnData = rowData[colName];
		return columnData;
	};

	this.getLayerIdFromTableCell = function(td){

		var td$ = jQuery(td);
		var dataRow = td$.closest("tr");
		return this.getLayerIdFromTableRow(dataRow[0]);
		
	};
	
	this.getLayerIdFromTableRow = function(tr){
		var tr$ = jQuery(tr);		

		if (tr$.children().first().hasClass("previewTools")){
			//this is a preview tools row, not a data row
			tr$ = tr$.prev();
		}
		var rowData = this.getRowData(tr$[0]).data;

		var layerId = rowData.LayerId;
		return layerId;
	};
	
	this.findTableRow = function(layerId){
		var that = this;
		var row$ = "";
		jQuery("#" + this.getTableId() + " tr").each(function(){
			if (jQuery(this).children("th").length === 0){//skip header rows
				var currentLayerId = that.getLayerIdFromTableRow(this);
				if (currentLayerId == layerId){
					row$ = jQuery(this);
					return; //this exits the each loop
				}
			}
		}); 
		if (row$.length === 0){
			console.log(layerId);
			console.log("table row not found for ['" + this.getTableId() + "']!");
		}
		return row$;
		
	};
	
	this.findTableControl = function(layerId, columnClass, controlClass){
		var that = this;
		var control$ = "";
		jQuery("#" + this.getTableId() + " " + columnClass).each(function(){
			var currentLayerId = that.getLayerIdFromTableCell(this);
			if (currentLayerId == layerId){
				control$ = jQuery(this).find(controlClass).first();
				return; //this just exits the each function
			}
		}); 
		if (control$.length === 0){
			console.log("table control not found for ['" + this.getTableId() + "']!");
		}
		return control$;	
	};

	this.findExpandControl = function(layerId){
		return this.findTableControl(layerId, "td.colExpand", "div.expandControl");
	};

	this.findPreviewControl = function(layerId){
		return this.findTableControl(layerId, "td.colPreview", "div.previewControl");
	};

	/******
	 * column sizing
	 *******/
	
	

	this.wrapCell = function(td){
		var tableCell$ = jQuery(td);
		tableCell$.wrapInner('<div class="cellWrapper" />');
	};
	//wrap the content of each table cell in a div so we can control the size
	this.wrapCells = function(){
		console.log("wrapping cells");
		var tableName = this.getTableId();
		//jQuery('#' + tableName + ' th').each(function (iPosition, Element){
		jQuery('#' + tableName + ' td').add('#' + tableName + ' th').each(function (iPosition, Element){

			//reference the column, so we can set the width of each div
			var tableCell = jQuery(this);
			if (!tableCell.children().first().hasClass("cellWrapper")){
				tableCell.wrapInner('<div class="cellWrapper" />');
			}
		});
		//this.sizeCells();
	};

	this.resizeColumnsCallback = function(){
		this.markResizableColumns();
		this.resizeColumns();
	};
	
	this.markResizableColumns = function(){
		var matches = this.tableHeadingsObj.where({resizable: true});
		for (var i in matches){
			var sel$ = jQuery("#"+ this.getTableId() + "_wrapper th." + matches[i].get("columnClass"));
			if (sel$.length !== 0){
				if (!sel$.hasClass("resizableCol")){
					sel$.addClass("resizableCol");
					matches[i].set({headerSelector: sel$});
				}
			}
		}
	};
	
	this.getResizableColumns = function(){
		var resizables = jQuery("#searchResultsTable_wrapper .dataTables_scrollHead .resizableCol");
		var columns = [];
		var that = this;
		resizables.each(function(){
			var possibleMatches = that.tableHeadingsObj.filter(
					function(model){
						return model.has("headerSelector");
					}
			);
			for (var i in possibleMatches){
				var sel = possibleMatches[i].get("headerSelector");
				if (sel[0] === this){
					columns.push(possibleMatches[i]);
				}
			}
		});
		//return models for resizable columns
		return columns;
	};
	
	  
	  this.getVisibleColumns = function(){
		//returns an array of column keys visible on the page
		var arrReturn = [];

		var arrColumns = this.getTableObj().fnSettings().aoColumns;
		for (var i in arrColumns){
			if (arrColumns[i].bVisible == true){
				arrReturn.push(arrColumns[i].mData);
			}
		}
		return arrReturn;
	  };
	  
	  this.getFixedColumnsWidth = function(){
		  	var visibleColumns = this.getVisibleColumns();
		  	var fixedWidth = 0;
		  	for (var i in visibleColumns){
		  		var currentModel = this.tableHeadingsObj.get(visibleColumns[i]);
		  		if (!currentModel.get("resizable")){
		  			var currentClass = currentModel.get("columnClass");
		  			var sel$ = jQuery("#"+ this.getTableId() + "_wrapper th." + currentClass);
		  			fixedWidth += sel$.outerWidth();
		  		}
		  	}
		  	//TODO: store this value, since it should be the same each time
		  	return fixedWidth;

		  };
		  
		
		this.removeExtraColumn = function(arrColumns){
				//if the width of the table is too narrow, columns may need to be removed;
				//this should only happen with all columns on and minimum width;
				//columns that can be removed in order of least importance
				var removableColumns = ["Access", "Publisher", "ContentDate", "Originator"];
				
				while (removableColumns.length > 0){
					var currentRemovable = removableColumns.shift();
					for (var i in arrColumns){
						if (arrColumns[i].get("columnName") == currentRemovable){
							this.hideCol(arrColumns.splice(i,1)[0]);
							return arrColumns;
						}	
					}
				}
			};
			
		this.getTotalMinWidths = function(arrColumns){
			var totalMinWidth = 0;
			var offset = 7;//padding plus border...should get this value dynamically
			for (var j in arrColumns){
				totalMinWidth += arrColumns[j].get("minWidth") + offset;
			}
			
			return totalMinWidth;
		};
		
		this.changeColumnWidth = function(model){
			var width = model.get("width");
			this.setDataTableColWidth(model.get("columnName"), width);
			//get the selector and resize the column with jQuery.width
			var colClass = model.get("columnClass");
			//".dataTables_scrollBody th." + model.get("columnClass")
			var sel$ = jQuery("#"+ this.getTableId() + "_wrapper th." + colClass).add(".dataTables_scrollBody th." + colClass);
			sel$.width(width);
		};
	//dynamically size the table depending on visible columns & the width of the container
	this.adjustColumnSizes = function(){
		/*determine which fields are showing, set widths from header object
		  	if they add up to the total width, we're done.  otherwise we need to adjust
			we need to maintain minimum widths
		 */
		var resizables = this.getResizableColumns();
	
		var numColumns = resizables.length;
		if (numColumns == 0){
			return;	//we're done.  exit the function 
		}
		
		//remaining width must be distributed among visible resizable columns
		//outerWidth of visible resizable columns must total remaining width
		var remainingWidth = jQuery('#left_col').width() - this.getFixedColumnsWidth();
		//at this point, remainingWidth must be a positive value.  make sure minWidth of the panel is set to ensure this.
		if (remainingWidth < 0){
			throw new Error("Minimum column width is less than panel width.  Adjust minWidth for the panel to ensure this does not happen.");
		}
		
		var totalMinWidth = this.getTotalMinWidths(resizables);
		
		while ((remainingWidth - totalMinWidth) < 0){
			//we need to remove columns until remainingWidth is a positive value
			resizables = this.removeExtraColumn(resizables);
			totalMinWidth = this.getTotalMinWidths(resizables);
		}
			
		console.log(totalMinWidth);
		console.log(remainingWidth);
		
		numColumns = resizables.length;
		if (numColumns == 0){
			return;	//we're done.  exit the function 
		}
		
		remainingWidth -= totalMinWidth;
		var colOffset = Math.floor(remainingWidth / numColumns);
		var colRemainder = remainingWidth % numColumns;
	
		for (var i in resizables){
			var newWidth = resizables[i].get("minWidth") + colOffset + colRemainder - 7;
			console.log(newWidth);
			colRemainder = 0;
			resizables[i].set({width: newWidth});
		}
		 
		
		
		
	/*	
		var arrColumns = this.getVisibleColumns();
		//	totalWidth = totalWidth - (arrColumns.length * 7) + 1;//account for cell padding plus right borders of cells, leftmost border
		//var divWidth = totalWidth;
		var arrSizable = new Array();
		var sizableWidth = 0;
		var headingsObj = this.tableHeadingsObj;
		for (var i in arrColumns){
			var currentColumn = arrColumns[i];
			//var currentWidth = headingsObj.getWidth(currentColumn);
			var currentClass = headingsObj.getDataTablesValue(currentColumn, "sClass");
			var columnWidth = jQuery('#' + tableId + ' .' + currentClass).outerWidth();

			if (headingsObj.findWhere({columnName: currentColumn}).get("resizable")){
				sizableWidth += columnWidth;
				arrSizable.push(currentColumn);
			} else {
				totalWidth = totalWidth - columnWidth;
			}
		}

		var numberSizable = arrSizable.length;
		if (numberSizable == 0){
			return;	//we're done.  exit the function 
		}

		//at this point, totalWidth should be the width we have to work with for sizable columns

		if (numberSizable == 1){
			var currentClass = headingsObj.getDataTablesValue(arrSizable[0], "sClass");
			var currentMinWidth = headingsObj.getValueByColumn(arrSizable[0], "minWidth");
			var cell$ = jQuery('#' + tableId + ' .' + currentClass);
			var adj = cell$.outerWidth() - cell$.width();

			if (totalWidth >= currentMinWidth){
				jQuery('#' + tableId + ' .' + currentClass + ' > div').outerWidth(totalWidth - adj);
			} else {
				this.removeExtraColumn();
				// what can we do here?  I think we have to remove columns to make things fit.
				//	 this will fail to adjust columns properly if the visible resizable column is not
				//	 removed by the above function
				 
			}

			//should also update the currentWidth;
			headingsObj.setWidth(arrSizable[0], totalWidth);
			return;	//we're done.  exit the function
		}

		// following is executed if numberSizable is > 1
		//	 determine if the total width currently set for the sizable columns is equal to the 
		//	 width available on the page.
		 
		var remainingWidth = totalWidth - sizableWidth;
		*/
		/* if (remainingWidth == 0){
				  //set columns to currentWidth values
				  console.log("remaining width = 0");
				  for (var j in arrSizable){
					  var currentSizable = arrSizable[j];
					  //var currentMinWidth = headingsObj.getValue(currentSizable, "minWidth");
					  var currentWidth = headingsObj.getValue(currentSizable, "currentWidth");
					  var currentClass = headingsObj.getValue(currentSizable, "sClass");
					  jQuery('#' + tableId + ' .' + currentClass + ' > div').outerWidth(currentWidth);
					  //since setWidth cannot set a 'currentWidth' smaller than 'minWidth', we
					  //should be ok not comparing with 'minWidth' here
					  headingsObj.setWidth(currentSizable, currentWidth);
				  }
			  } else {*/
		/*
		//split the difference between columns and add to each currentWidth, taking care not to go below minWidth
		var remainder = remainingWidth % numberSizable;
		// widthDifference * numberSizable will always be <= remainingWidth
		var widthDifference = Math.floor(remainingWidth / numberSizable);
		var propagate = 0;//we need this variable outside the loop.
		var adjustArr = [];
		for (var j in arrSizable){
			var currentSizable = arrSizable[j];
			var currentMinWidth = headingsObj.getValueByColumn(currentSizable, "minWidth");
			var currentWidth = headingsObj.getValueByColumn(currentSizable, "currentWidth") + widthDifference - propagate;
			var currentClass = headingsObj.getDataTablesValue(currentSizable, "sClass");

			//we only want to apply the remainder to the first field if possible
			if (remainder > 0){
				currentWidth++;
				remainder--;
			}
			var cell$ = jQuery('#' + tableId + ' .' + currentClass);
			var adj = cell$.outerWidth() - cell$.width();

			if (currentWidth >= currentMinWidth){ 
				adjustObj = {};
				adjustObj.sClass = currentClass;
				adjustObj.availableWidth = currentWidth - currentMinWidth;
				adjustObj.currentWidth = currentWidth;
				adjustObj.currentSizable = currentSizable;
				adjustArr.push(adjustObj);

				jQuery('#' + tableId + ' .' + currentClass + ' > div').outerWidth(currentWidth - adj);
				headingsObj.setWidth(currentSizable, currentWidth);
				propagate = 0;
			} else {	  
				//if we set the column to the currentMinWidth, we have to propagate the difference to 
				//	another column.
				 //
				propagate = currentMinWidth - currentWidth;
				jQuery('#' + tableId + ' .' + currentClass + ' > div').outerWidth(currentMinWidth - adj);
				headingsObj.setWidth(currentSizable, currentMinWidth);  
			}
		}

		while (propagate > 0){
			//in this case, we need to start taking width from earlier columns
			if (adjustArr.length > 0){

				for (var k in adjustArr){
					var currentAdjust = adjustArr[k]; 
					//compare the value of propagate with the value of currentAdjust.availableWidth
					var adjustDelta = propagate - currentAdjust.availableWidth;
					var cell$ = jQuery('#' + tableId + ' .' + currentAdjust.sClass);
					var adj = cell$.outerWidth() - cell$.width();

					if (adjustDelta <= 0){
						jQuery('#' + tableId + ' .' + currentAdjust.sClass + ' > div').outerWidth(currentAdjust.currentWidth - adj - propagate);
						headingsObj.setWidth(adjustObj.currentSizable, currentAdjust.currentWidth - propagate);
						return;  //we're done
					} else {
						jQuery('#' + tableId + ' .' + currentAdjust.sClass + ' > div').outerWidth(currentAdjust.currentWidth - adj - currentAdjust.availableWidth);
						headingsObj.setWidth(adjustObj.currentSizable, currentAdjust.currentWidth - currentAdjust.availableWidth);
						propagate = adjustDelta;
					}
				}
			} else {
				//if propagate is still > 0 when all columns are at minWidth, we have to remove a column from display
				this.removeExtraColumn();
				return;	//avoid possible infinite loop
			}
		}
		//}
		//totalWidth must be shared between all visible columns
		*/
	};

	
	this.setDataTableColWidth = function(colName, width){
		var columns = this.getTableObj().fnSettings().aoColumns;
		for (var i in columns){
			if (columns[i].mData == colName){
				console.log("width set!");
				columns[i].sWidth = width;
			}
		}
	};
	
	this.resizeColumns = function(){
		console.log("resizeColumns called");
		var columns = this.getResizableColumns();
		
		//we need at least 2 columns for resizing to work
		if (columns.length < 2){
			return;
		}
				
		for (var i = 0; i < (columns.length - 1); i++){
			var currentModel = columns[i];
			var remainingColumns = columns.slice(i);

			//reset column resizable state
			try{
				var sel$ = currentModel.get("headerSelector")
				if (sel$.hasClass("resizable-applied")){
					sel$.resizable("destroy");
				}
			} catch (e){
				//ignore.  I'm not sure how to detect which elements have "resizable" initialized
				//console.log(e);
			}

			this.addResizableColumn(currentModel, remainingColumns);
		}
	};

	this.addResizableColumn = function(model, remainingColumns){
		var that = this;
		model.get("headerSelector").addClass("resizable-applied").resizable({
  			alsoResize: ".dataTables_scrollBody th." + model.get("columnClass"),
  			handles: "e",
  			minWidth: model.get("minWidth"),
  			start: function(event, ui){
  				var remainingWidth = 0;
  				var remainingMinWidth = 0;
  				for (var j in remainingColumns){
  					var currentCol = remainingColumns[j];
  					var measuredWidth = currentCol.get("headerSelector").width();
  					//that.setDataTableColWidth(currentCol.get("columnName"), measuredWidth);
  					currentCol.set({width: measuredWidth});
  					remainingWidth += measuredWidth;
  					remainingMinWidth += currentCol.get("minWidth");
  				}
  				var maxWidth = remainingWidth - (remainingMinWidth - model.get("minWidth"));
  				model.get("headerSelector").resizable("option", "maxWidth", maxWidth);
  			},

  			resize: function(event, ui){
  				var totalPlay = ui.size.width - ui.originalSize.width;

  				for (var k in remainingColumns){
  					if (remainingColumns[k] === model){
  						continue;
  					}
  					//no room to adjust
  					if (totalPlay === 0){
  						break;
  					}
  					var colModel = remainingColumns[k];
  					var currentWidth = colModel.get("width");

  					var header$ = colModel.get("headerSelector");
  					/*var measuredWidth = header$.width();
  					//offset is the number of extra pixels for padding, borders
  					var offset = header$.outerWidth() - measuredWidth; //offset should only come into play when we add/remove columns*/
  					var currentMinWidth = colModel.get("minWidth");		
  					var newWidth = 0;
  					var proposedNewWidth = currentWidth - totalPlay;

  					if (proposedNewWidth <= currentMinWidth){
  						totalPlay -= (currentWidth - currentMinWidth);
  						newWidth = currentMinWidth;
  					} else {
  						newWidth = proposedNewWidth;
  						totalPlay = 0;
  					}

  					colModel.get("headerSelector").add(".dataTables_scrollBody th." + colModel.get("columnClass")).width(newWidth);
  				}
  				//adjust all remaining resizables a little (difference/num remaining resizables).  apply any remainder to the next resizable
  				//we also have to keep track of deltas that don't get applied since we hit minWidth
  			}, 
  			
  			stop: function(event, ui){
  				
  				for (var j in remainingColumns){
  					var currentCol = remainingColumns[j];
  					var measuredWidth = currentCol.get("headerSelector").width();
  					//that.setDataTableColWidth(currentCol.get("columnName"), measuredWidth);
  					currentCol.set({width: measuredWidth});
  				}
  				
  			}
  			
  });
	};
	
	//shows a column in the table, given its name, adds appropriate classes
	this.showCol = function(model){
		var iCol = this.getColumnsIndex()[model.get("columnName")];
		var tableObj = this.getTableObj();
		tableObj.fnSetColumnVis( iCol, true);
		//the title & class
		var columnTitle = model.get("header");
		var columnClass = model.get("columnClass");
		//add class from tableHeadings to th element (dataTables won't do it)
		var tableId = this.getTableId();
		jQuery('#' + tableId + ' > thead > tr > th').each(function(){
			if (jQuery(this).text() == columnTitle){
				jQuery(this).addClass(columnClass);
				return;
			}
		});
	};

	//hides a column in the table, given its name
	this.hideCol = function(model){
		var iCol = this.getColumnsIndex()[model.get("columnName")];
		var tableObj = this.getTableObj();
		tableObj.fnSetColumnVis( iCol, false);
	};
	
	this.toggleColumn = function(model){
		console.log(arguments);
		var action;
		var visible = model.get("visible");
		var column = model.get("columnName");

		if (visible) {
			this.showCol(model);
		} else {
			this.hideCol(model);
		}
		
		this.resizeColumnsCallback();
		
		action = visible ? "Column Added" : "Column Removed";

		//analytics.track("Change Results Columns Displayed", action, column);
	};

	

	//should be part of a view on a user model
	this.changeLoginButtonsToControls = function(){
		//change login button to checkbox for institution logged in
		var that = this;
		//loginButton login
		//previewControl previewOff
		jQuery(".colPreview .loginButton").each(function(){
			var node = jQuery(this).closest("tr");
			var layerId = that.getRowData(node).LayerId;
			jQuery(this).parent().html(tableObject.controls.renderActivePreviewControl(layerId));
		});
	};

	this.changeControlsToLoginButtons = function(logoutInstitution){
		//change checkbox to login button for institution logged out
		var that = this;
		jQuery(".colPreview .previewControl").each(function(){
			var node = jQuery(this).closest("tr");
			var layerId = that.getRowData(node).LayerId;

			jQuery(this).parent().html(tableObject.controls.renderPreviewControl(layerId));
		});
	};

	//function to expand row, expose preview controls
	this.expandRow = function(thisObj){
		var layerId = this.getRowData(thisObj).LayerId;
		this.tableLayerState.setExpandState(layerId, true);
	};


	//adds class to row for highlighting current row
	this.highlightRow = function(){
		var tableName = this.getTableId();
		jQuery(document).on("mouseout", '#' + tableName + ' > tbody', function(event) {
			var currentNode = jQuery(event.target).parentsUntil('#' + tableName).last();
			jQuery(currentNode).children().removeClass('row_selected').removeClass('row_selected_top').removeClass('row_selected_bottom');
			jQuery(document).trigger("map.hideBBox");
		});

		var tableObj = this.getTableObj();
		var that = this;
		jQuery(document).on("mouseover", '#' + tableName + ' > tbody', function(event) {
			var row$ = jQuery(event.target).parentsUntil('#' + tableName + ' > tbody').last();
			
			if (row$.children('td').hasClass('previewTools')){
				//moused over previewTools row
				var prevRow$ = row$.prev();
				prevRow$.addClass('row_selected');
				//since borders are collapsed, we have to set the bottom border of the previous row
				prevRow$.prev().addClass('row_selected_top');
				row$.addClass('row_selected').addClass('row_selected_bottom');
				row$ = prevRow$;//we need to get the layerId from the previous row
			} else if (row$.next().children('td').hasClass('previewTools')){
				//moused over regular row, but previewTools are open
				row$.addClass('row_selected');
				row$.prev().addClass('row_selected_top');
				row$.next().addClass('row_selected').addClass('row_selected_bottom');
			} else {
				//moused over regular row, preview tools closed
				row$.addClass('row_selected').addClass('row_selected_bottom');
				row$.prev().addClass('row_selected_top');
			}
			//if next sibling is details row, then add class 'row_selected' to it as well
			//set first tr ancestor to class row_selected
			var aData = tableObj.fnGetData(row$[0]);
			//in case the table is empty
			if ((aData === null) || (typeof aData.LayerId == "undefined")){
				return;
			}
			var bbox = {};
			var currModel = that.backingData.get(aData.LayerId);
			if (typeof currModel != "undefined"){
				bbox.south = currModel.get("MinY");
				bbox.north = currModel.get("MaxY");
				bbox.west = currModel.get("MinX");
				bbox.east = currModel.get("MaxX");
				jQuery(document).trigger("map.showBBox", bbox);
			}
		});
	};


	/*********
	 * Table callbacks and event handlers
	 *********/
	
	this.initControlHandlers = function(){
		this.initControlHandlersDefault();
	};

	this.initControlHandlersDefault = function(){
		this.highlightRow();
		this.previewHandler();
		this.previewViewHandler();
		this.viewLibraryRecordHandler();
		this.viewMetadataHandler();
		this.expandHandler();	
		this.titleClickHandler();
		this.expandViewHandler();
		this.expandView = new OpenGeoportal.Views.TableRowSettings({collection: this.tableLayerState, el: $("#" +this.getTableId())});

	};
	
	this.expandViewHandler = function(){
		var that = this;
		jQuery("#" + that.getTableId()).on("view.openRow", function(event, data){
			var control$ = that.findExpandControl(data.LayerId);
			control$.removeClass("notExpanded").addClass("expanded");

			//a view that watches expand state
			// Open this row 
			var rowNode = control$.closest("tr")[0];
			that.getTableObj().fnOpen(rowNode, "<div></div>", 'previewTools');
			var layerModel = that.previewed.getLayerModel(that.backingData.get(data.LayerId));//at this point, we need to have a model for the layer in "previewed", or we can't render the tools properly
			var tools$ = jQuery(rowNode).next().find(".previewTools");
			var view = new OpenGeoportal.Views.PreviewTools({model: layerModel, el: tools$});//render to the container created by fnOpen
			//add highlight to newly opened row if original row is highlighted
			if (jQuery(rowNode).hasClass("row_selected")){
				jQuery(rowNode).removeClass("row_selected_bottom");
				tools$.parent().addClass("row_selected").addClass("row_selected_bottom");
			}
		});

		jQuery("#" + that.getTableId()).on("view.closeRow", function(event, data){
			console.log("received view.closeRow");
			var control$ = that.findExpandControl(data.LayerId);
			control$.removeClass("expanded").addClass("notExpanded");
			var rowNode = control$.closest("tr")[0];
			if (jQuery(rowNode).hasClass("row_selected")){
				jQuery(rowNode).addClass("row_selected_bottom");
				//tools$.parent().addClass("row_selected").addClass("row_selected_bottom");
			}
			that.getTableObj().fnClose(rowNode);
			
		});
	};


	/*
	 * Preview control.  Interacts with LayerSettings Collection and MapController
	 */
	
	/*
	 * Updates the appropriate layer model based on clicking the preview control on the table
	 */
	this.previewHandler = function(){
		var that = this;
		jQuery("#" + that.getTableId() + " tbody").on("click.preview", "div.previewControl", function(event){
			//this should update the preview model
			var layerId = that.getLayerIdFromTableCell(this);

			var model = that.previewed.get(layerId);
			if (typeof model == "undefined"){
				//get the attributes for the layer retrieved from solr
				var layerAttr = that.backingData.get(layerId).attributes;
				//add them to the previewed collection.  Add them as attributes since we 
				//are using different models in the previewed collection, and we want
				//"model" to be called
				that.previewed.add(layerAttr);
				model = that.previewed.get(layerId);

			}				
			if (model.get("preview") == "on"){
				model.set({preview: "off"});
			} else {
				model.set({preview: "on"});
			}
		});
	};
	
	/*
	 * Retrive the needed information from the data table and pass in an event.  The map listens for this event.
	 */
	this.previewControlShowOn = function(previewControl$){
		previewControl$.removeClass("checkOff").addClass("checkOn");
		var hideLayerText = "Turn off layer preview on the map";
		previewControl$.attr("title", hideLayerText);
	};

	this.previewControlShowOff = function(previewControl$){
		previewControl$.removeClass("checkOn").addClass("checkOff");
		var showLayerText = "Preview layer on the map";
		previewControl$.attr("title", showLayerText);
	};
	
	this.previewViewHandler = function(){
		//this.listenTo(this.model, "change", this.render);
		//change this to a backbone view
		var that = this;
		jQuery(document).on("view.previewOn", function(event, data){
			console.log("view.previewOn fired by: " + that.getTableId());
			var control$ = that.findPreviewControl(data.LayerId);
			if (control$.length > 0){
				that.previewControlShowOn(control$);
			}
		});
		jQuery(document).on("view.previewOff", function(event, data){
			console.log("view.previewOff fired by:" + that.getTableId());
			var control$ = that.findPreviewControl(data.LayerId);
			if (control$.length > 0){
				that.previewControlShowOff(control$);
			}
		});
	};

	
	
	this.viewMetadataHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.viewMetadata", "div.viewMetadataControl", function(event){
			var layerId = that.getLayerIdFromTableCell(this);;
			that.controls.viewMetadata(layerId);
		});
	};

	this.viewLibraryRecordHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.viewLibraryRecord", "div.viewLibraryRecordControl", function(event){
			var layerId = that.getLayerIdFromTableCell(this);;
			that.contols.showLibraryRecord(layerId);
		});
	};

	this.titleClickHandler = function(){
		var tableId = this.getTableId();
		var that = this;
		jQuery('#' + tableId).on('click', '.colTitle', function(){
			var layerId = that.getLayerIdFromTableCell(this);
			var stateVal = that.tableLayerState.isExpanded(layerId);
			that.tableLayerState.setExpandState(layerId, !stateVal);
		});
	};
	
	this.expandHandler = function(){
		var tableId = this.getTableId();
		var that = this;
		jQuery('#' + tableId).on('click', '.colExpand', function(){
			console.log("expand click");
			var layerId = that.getLayerIdFromTableCell(this);
			console.log(layerId);
			var stateVal = that.tableLayerState.isExpanded(layerId);
			console.log(stateVal);
			that.tableLayerState.setExpandState(layerId, !stateVal);
		});
	};

	
	//callback to keep 'expanded' state on table reloads
	//this can't be done with a draw table callback, because the open row function redraws
	this.callbackExpand = function(){
		console.log("calling calbackExpand");
		var that = this;
		var targetTableId = this.getTableId();
		jQuery('#' + targetTableId + ' .expandControl').each(function(){
			if (jQuery(this).hasClass("expanded")){
				var layerId = that.getLayerIdFromTableCell(this);
				var stateVal = that.tableLayerState.isExpanded(layerId);
				
				if (stateVal === true){
					//that.expandView.trigger("syncUI.openRow");
					that.tableLayerState.trigger("syncUI.openRow", {LayerId: layerId});
				} 
			}
		});
	};

	this.createSimpleTooltip = function(columnClass){
		//adds a tool tip to each class passed to the function
		//also adds a click handler for the title column...probably should end up somewhere else
		var that = this;
		var tableId = this.getTableId();
		jQuery('#' + tableId + ' .' + columnClass).each(function(){
			var currentNode = jQuery(this);
			if (this.tagName == 'TD'){
				currentNode.attr('title', currentNode.text());
			} 
		});  
	};

	this.createHeaderTooltips = function(){
		jQuery("th.colType").attr('title', "point, line, polygon, raster");
		jQuery("th.colSource").attr('title', "Source repository");
	};

	this.createTooltips = function(){
		console.log("creating tooltips");
		var arrColumns = this.getVisibleColumns();
		for (var i in arrColumns){
			//var currentHeading = this.tableHeadingsObj.getTableConfig()[arrColumns[i]];
			var currentModel = this.tableHeadingsObj.where({columnName: arrColumns[i]})[0];
			
			if (currentModel.get("resizable")){
				this.createSimpleTooltip(currentModel.get("columnClass"));
			}
		}
		this.createHeaderTooltips();
		console.log("finished tooltips");
	};
};