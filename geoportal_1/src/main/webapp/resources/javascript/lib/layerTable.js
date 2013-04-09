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
OpenGeoportal.LayerTable = function LayerTable(stateObj){

	//we only want one copy of this;  we can make this a singleton or call it from main.
	this.appState = stateObj;

	//really, we're just checking to make sure something was passed in
	if (typeof this.appState === "undefined"){
		throw new Error("An appropriate state object must be passed to the constructor of LayerTable.");
	}
	this.layerState = stateObj.layerState;

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

	//are these different depending on table?
	this.tableSettings = new OpenGeoportal.TableSettings(this);
	this.tableHeadingsObj = this.tableSettings.tableConfig;
	this.tableLayerState = this.tableSettings.tableLayerState;
	this.previewedLayers = this.layerState.previewedLayers;
	this.template = this.appState.template;	//this should be app-wide
	
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
	
	//definitely table specific
	this.createDataTable = function(table$, params){
		var tableObj = table$.dataTable(params);
		return tableObj;
	};

	this.dataTableParams = {};
			
	this.getDataTableParams = function(){

		var columnDefinitions = this.tableHeadingsObj.getColumns();
		//initialize table
		var tableData = [];

		//table created
		var params = {
			"aaData": tableData,
			"bSort": false,
			"aoColumnDefs": columnDefinitions,
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
		this.initControlHandlers();
	};
	
	/*this.tableDrawCallbacks = {
			callbacks: {"wrapCells": function(){this.wrapCells();}, "tooltips": function(){this.createTooltips();}, "colResize": function(){this.addColumnResize();}}
	};*/
	
	this.tableDrawCallbacks = {
			callbacks: {"wrapCells": function(){this.wrapCells();}, "tooltips": function(){this.createTooltips();}}
	};
	
	this.addTableDrawCallback = function(label, callbackFunction){
		this.tableDrawCallbacks.callbacks[label] = callbackFunction;
	};
	
	this.runTableDrawCallbacks = function(){
		//TODO: is this working correctly?  make sure
		console.log("table draw callbacks");

		for (var i in that.tableDrawCallbacks.callbacks){
			console.log(i);
			that.tableDrawCallbacks.callbacks[i].call(that);
		}
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
		rowData.node = jQuery(thisObj).closest("tr")[0];
		rowData.index = tableObj.fnGetPosition(rowData.node);
		rowData.data = tableObj.fnGetData( rowData.index );
		return rowData;
	};
	
	/*
	 * helper function to get backing data from DataTable, expects to be passed a dom element from the table
	 * from a click event, for example
	 * returns an array of data corresponding to the row in the table
	 */
	this.getDataObjFromRowData = function(rowData){
		//Get the data array for this row 
		var dataObj = {};
		var tableConfig = this.tableHeadingsObj.getTableConfig();
		for (var heading in tableConfig){
			dataObj[heading] = rowData[tableConfig[heading].columnConfig.aTargets[0]];
		}
		return dataObj;
	};
	

	/*
	 * helper function to get backing data from DataTable, expects to be passed an array of data and 
	 * the column name
	 * returns the data value for the specified column
	 */
	this.getColumnData = function(rowData, colName){
		var columnIndex = this.tableHeadingsObj.getColumnTargetIndex(colName);
		var columnData = rowData[columnIndex];
		/*if ((typeof columnData == "undefined")||(columnData === null)){
			throw new Error("Data is undefined for ['" + colName + "'] for the table ['" + this.getTableId() + "']");
			//columnData = ""; 
		}*/
		return columnData;
	};

	this.getLayerIdFromRow = function(rowObj){
		return rowObj.aData[this.tableHeadingsObj.getColumnTargetIndex('LayerId')];
	};

	//restrict to current table
	this.findTableControl = function(layerId, columnClass, controlClass){
		var that = this;
		var control$ = [];
		jQuery("#" + this.getTableId() + " " + columnClass).each(function(){
			var aData = that.getTableObj().fnGetData(this.parentNode);
			var currentLayerId = aData[that.tableHeadingsObj.getColumnTargetIndex("LayerId")];
			if (currentLayerId == layerId){
				control$ = jQuery(this).find(controlClass).first();
				return;
			}
		}); 
		return control$;	
	};

	this.findExpandControl = function(layerId){
		return this.findTableControl(layerId, "td.colExpand", "div.expandControl");
	};

	this.findPreviewControl = function(layerId){
		return this.findTableControl(layerId, "td.colPreview", "div.previewControl");
	};
	
	this.getVisibleColumns = function(){
		//returns an array of column keys visible on the page
		var arrReturn = [];
		//should get this from dataTable object
		var visibleTable = this.getTableId();

		if (!visibleTable){
			return arrReturn;
		}
		var arrColumns = jQuery('#' + visibleTable).dataTable().fnSettings().aoColumns;
		for (var i in arrColumns){

			if (arrColumns[i].bVisible == true){
				arrReturn.push(arrColumns[i].sName);
			}
		}

		return arrReturn;
	};

	/******
	 * column sizing
	 *******/
	//wrap the content of each table cell in a div so we can control the size
	this.wrapCells = function(){
		console.log("wrapping cells");
		var tableName = that.getTableId();
		//jQuery('#' + tableName + ' th').each(function (iPosition, Element){
		jQuery('#' + tableName + ' td').add('#' + tableName + ' th').each(function (iPosition, Element){

			//reference the column, so we can set the width of each div
			var tableCell = jQuery(this);
			if (!tableCell.children().first().hasClass(tableName + "Cell")){
				tableCell.wrapInner('<div class="' + tableName + 'Cell" />');
			}
		});
		that.sizeCells();
	};

	//dynamically size the table depending on visible columns & the width of the container
	this.sizeCells = function(){
		/*determine which fields are showing, set widths from header object
		  	if they add up to the total width, we're done.  otherwise we need to adjust
			we need to maintain minimum widths
		 */
		var currentTab = OpenGeoportal.Utility.whichTab();
		var tableId = this.getTableId();
		var adjustObj;

		if (!currentTab.tableObject){
			return;
		}
		if (currentTab.tableName != tableId){
			return;
		}
		var totalWidth = jQuery('#left_col').width();

		var arrColumns = this.getVisibleColumns();
		//	totalWidth = totalWidth - (arrColumns.length * 7) + 1;//account for cell padding plus right borders of cells, leftmost border
		//var divWidth = totalWidth;
		var arrSizable = new Array();
		var sizableWidth = 0;
		var headingsObj = this.tableHeadingsObj;
		for (var i in arrColumns){
			var currentColumn = arrColumns[i];
			//var currentWidth = headingsObj.getWidth(currentColumn);
			var currentClass = headingsObj.getValue(currentColumn, "sClass");
			var columnWidth = jQuery('#' + tableId + ' .' + currentClass).outerWidth();

			if (headingsObj.getValue(currentColumn, "resizable")){
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
			var currentClass = headingsObj.getValue(arrSizable[0], "sClass");
			var currentMinWidth = headingsObj.getValue(arrSizable[0], "minWidth");
			var cell$ = jQuery('#' + tableId + ' .' + currentClass);
			var adj = cell$.outerWidth() - cell$.width();

			if (totalWidth >= currentMinWidth){
				jQuery('#' + tableId + ' .' + currentClass + ' > div').outerWidth(totalWidth - adj);
			} else {
				this.removeExtraColumn();
				/* what can we do here?  I think we have to remove columns to make things fit.
					 this will fail to adjust columns properly if the visible resizable column is not
					 removed by the above function
				 */
			}

			//should also update the currentWidth;
			headingsObj.setWidth(arrSizable[0], totalWidth);
			return;	//we're done.  exit the function
		}

		/* following is executed if numberSizable is > 1
			 determine if the total width currently set for the sizable columns is equal to the 
			 width available on the page.
		 */
		var remainingWidth = totalWidth - sizableWidth;
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
		//split the difference between columns and add to each currentWidth, taking care not to go below minWidth
		var remainder = remainingWidth % numberSizable;
		// widthDifference * numberSizable will always be <= remainingWidth
		var widthDifference = Math.floor(remainingWidth / numberSizable);
		var propagate = 0;//we need this variable outside the loop.
		var adjustArr = [];
		for (var j in arrSizable){
			var currentSizable = arrSizable[j];
			var currentMinWidth = headingsObj.getValue(currentSizable, "minWidth");
			var currentWidth = headingsObj.getValue(currentSizable, "currentWidth") + widthDifference - propagate;
			var currentClass = headingsObj.getValue(currentSizable, "sClass");

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
				/*if we set the column to the currentMinWidth, we have to propagate the difference to 
					another column.
				 */
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
	};

	//shows a column in the table, given its name, adds appropriate classes
	this.showCol = function(columnKey){
		//should update the organize dialog
		//update the tableHeadings object?
		//TODO: getColumnIndex or getColumnTargetIndex?
		var iCol = this.tableHeadingsObj.getColumnIndex(columnKey);
		var tableObj = this.getTableObj();
		tableObj.fnSetColumnVis( iCol, true);
		//the title & class
		var columnTitle = this.tableHeadingsObj.getValue(columnKey, "sTitle");
		var columnClass = this.tableHeadingsObj.getValue(columnKey, "sClass");
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
	this.hideCol = function(columnKey){
		//should update the organize dialog
		//TODO: getColumnIndex or getColumnTargetIndex?
		var iCol = this.tableHeadingsObj.getColumnIndex(columnKey);
		var tableObj = this.getTableObj();
		tableObj.fnSetColumnVis( iCol, false);
	};

	this.removeExtraColumn = function(){
		//if the width of the table is too narrow, columns may need to be removed;
		//this should only happen with all columns on and minimum width;
		var visibleColumns = this.getVisibleColumns();
		//columns that can be removed in order of least importance
		var removableColumns = ["Access", "score", "Institution", "Publisher", "ContentDate", "Originator"];
		while (removableColumns.length > 0){
			var currentRemovable = removableColumns.shift();
			for (var i in visibleColumns){
				if (currentRemovable == visibleColumns[i]){
					this.hideCol(currentRemovable);
					return;
				}	
			}
		}
	};

	this.getResizeInfoFromTitle = function(columnTitle){
		//returns needed info about resizable columns
		var headingsObj = this.tableHeadingsObj;
		var fields = headingsObj.getTableConfig();
		var heading = {};
		for (var key in fields){
			if (headingsObj.getValue(key, "resizable")){
				if (columnTitle == headingsObj.getValue(key, "sTitle")){
					heading.columnClass = headingsObj.getValue(key, "sClass");
					heading.minWidth = headingsObj.getValue(key, "minWidth");
					heading.currentWidth = headingsObj.getValue(key, "currentWidth");
					heading.key = key;
					continue;
				}
			} 
		}
		return heading;
	};

	//returns needed info about the next resizable column visible on the page
	//not currently used
	this.getNextResizable = function(thisHeadingKey){	
		var headingsObj = this.tableHeadingsObj;
		var currentIndex = headingsObj.getValue(thisHeadingKey, "aTargets")[0];
		var fields = headingsObj.getTableConfig();
		for (var indexValue = 1;indexValue <= 20;indexValue += 1){
			for (var key in fields){
				if (headingsObj.getValue(key, "aTargets")[0] == (currentIndex + indexValue)){
					if (headingsObj.getValue(key, "resizable")){
						//this is the one we want
						var heading = {};
						heading.key = key;
						heading.columnClass = headingsObj.getValue(key, "sClass");
						if (jQuery('.' + heading.columnClass).length == 0){
							return false;
						}
						heading.minWidth = headingsObj.getValue(key, "minWidth");
						return heading;
					} else {
						continue;//give control back to the outer loop
					}
				}
			} 
		} 
		return false;
	};

	//assigns ids to th elements in the search results table, uses jqueryUI resizable function
	//does this need to be called on redraw callback, or can it be called somewhere else, less often
	this.addColumnResize = function(){
		var tableId = this.getTableId();
		var that = this;
		var fieldInfo ={};

		//populate fieldInfo with needed info for currently viewable resizable th elements
		var numIndex = 0;
		jQuery('#' + tableId + ' > thead > tr > th').each(function(index, Element){
			var infoFromTitle = that.getResizeInfoFromTitle(jQuery(this).find("." + tableId + "Cell").text());
			if (typeof infoFromTitle.key != 'undefined'){
				numIndex += 1;
				fieldInfo[numIndex] = infoFromTitle;
				fieldInfo[numIndex].columnIndex = index;
			}
		});

		if (numIndex < 2){
			//if there's nothing in the object, or only one resizeable column, stop here
			return;
		}
		for (var i in fieldInfo){
			var columnClass = fieldInfo[i].columnClass;
			var resizeSelector = jQuery("th." + columnClass + " > ." + tableId + "Cell");
			if (resizeSelector.hasClass("applied")){
				try {
					resizeSelector.resizable("destroy");
				} catch (e){
					//console.log(e);
				}
			};
			//if this is the last resizable column, don't add resizable
			if (i >= numIndex){
				return;
			}
			var columnMinWidth = fieldInfo[i].minWidth;
			//next resizable element class
			//var j = parseInt(i) + 1;
			resizeSelector.addClass("applied");
			resizeSelector.resizable({ minWidth: columnMinWidth, handles: 'e',
				helper: 'ui-resizable-helper', alsoResize: "." + columnClass + " > ." + tableId + "Cell",
				start: function(event, ui){
					var thisColumn = that.getResizeInfoFromTitle(jQuery(event.target).text());
					var thisColumnIndex = that.tableHeadingsObj.getValue(thisColumn.key, "aTargets")[0];
					var tableId = that.getTableId();
					var resizeSelector = jQuery("th." + thisColumn.columnClass + " > ." + tableId + "Cell");

					//write width to currentWidth in tableHeadings
					var visibleColumns = that.getVisibleColumns();
					var resizablesWidth = 0;
					for (var index in visibleColumns){
						var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
						var colIndex = that.tableHeadingsObj.getValue(visibleColumns[index], "aTargets")[0];
						var col$ = jQuery('#' + tableId + ' .' + colClass);
						var colWidthOuter = col$.outerWidth();
						var colWidthInner = col$.width();
						var colDiff = colWidthOuter - colWidthInner;
						var isResizable = that.tableHeadingsObj.getValue(visibleColumns[index], "resizable");
						//once we know how many resizable columns are on-screen, we know how much width we have to adjust
						//it's a little more complex than this...count only columns that appear after the target column
						if ((isResizable)&&(colIndex >= thisColumnIndex)){
							resizablesWidth += colWidthInner;
							if (colClass != thisColumn.columnClass){
								resizablesWidth -= that.tableHeadingsObj.getValue(visibleColumns[index], "minWidth");
							}
						}
						//width is set for each visible resizable column so that we have a reliable number to calculate with
						that.tableHeadingsObj.setWidth(visibleColumns[index], colWidthOuter);
					}
					resizeSelector.resizable( "option", "maxWidth", resizablesWidth);


				},
				stop: function(event, ui){
					//a correction, in case things go awry
					//write width to currentWidth in tableHeadings
					var visibleColumns = that.getVisibleColumns();
					for (var index in visibleColumns){
						var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
						that.tableHeadingsObj.setWidth(visibleColumns[index], jQuery('#' + tableId + ' .' + colClass).outerWidth());
					}
					that.sizeCells();
					for (var index in visibleColumns){
						var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
						that.tableHeadingsObj.setWidth(visibleColumns[index], jQuery('#' + tableId + ' .' + colClass).outerWidth());
					}
				},
				resize: function(event, ui){
					//add the widths of the resized column plus the next resizable. max width for the current
					//resizable is this total width - the minimum width of the next resizable.  If there is
					//another resizable, then the process can continue.  else it is done
					var thisColumn = that.getResizeInfoFromTitle(jQuery(event.target).text());
					var originalWidth = that.tableHeadingsObj.getWidth(thisColumn.key);
					var currentWidth = jQuery(event.target).outerWidth();
					var currentWidthAdj = currentWidth - jQuery(event.target).width();

					var widthDelta = originalWidth - currentWidth;
					var thisColumnIndex = that.tableHeadingsObj.getValue(thisColumn.key, "aTargets")[0];
					var carryOver = 0;
					var visibleColumns = that.getVisibleColumns();
					for (var index in visibleColumns){
						var colIndex = that.tableHeadingsObj.getValue(visibleColumns[index], "aTargets")[0];
						var isResizable = that.tableHeadingsObj.getValue(visibleColumns[index], "resizable");
						//we can only adjust columns that are resizable, visible, and after the target column
						if ((isResizable)&&(colIndex > thisColumnIndex)){
							var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
							var currentMinWidth = that.tableHeadingsObj.getValue(visibleColumns[index], "minWidth");
							var currentColumnObj = jQuery('#' + tableId + ' .' + colClass);
							var currentColumnInnerDiv = currentColumnObj.find("div." + tableId + "Cell");
							var currentColumnWidth = that.tableHeadingsObj.getWidth(visibleColumns[index]);
							var currentWidthAdj = currentColumnObj.outerWidth() - currentColumnObj.width();
							var newWidth = currentColumnWidth + widthDelta + carryOver - currentWidthAdj - 3;

							if (newWidth <= currentMinWidth){
								//console.log("less");
								currentColumnObj.width(currentMinWidth);
								currentColumnInnerDiv.width(currentMinWidth);
								carryOver += that.tableHeadingsObj.getWidth(visibleColumns[index]) - (currentMinWidth + currentWidthAdj) ;

							} else {
								//console.log("more");
								currentColumnObj.width(newWidth);
								currentColumnInnerDiv.width(newWidth);
								break;
							}
						}
					}			
				}
			});		
		}
	};

	
	
	/**
	 * uses styledSelect to create the menu above the results table that allows the user to select which columns to display; dynamically created
	 * from the table object
	 */
	//TODO: fix this, once the styled select widget is created
	this.createColumnsMenu = function() {
		var menuHtml = "";
		var tableObj = this.utility.whichTab().tableObject();
		var fields = tableObj.tableHeadingsObj.getTableConfig();			
		for (var i in fields){
			if (fields[i].organize){
				if(i == "score"){
					continue;
				}
				menuHtml += '<div>';
				menuHtml += '<label for="columnCheck' + i + '">';
				menuHtml += fields[i].displayName + '</label>';
				var checked = "";
				if (fields[i].columnConfig.bVisible){
					checked = ' checked="checked"';
				}
				menuHtml += '<input type="checkbox" class="columnCheck columnVisibility" id="columnCheck' + i + '" value="' + i + '"' + checked + ' />';
				menuHtml += '</div>';
			}
		}
		var params = {
				"menuHtml": menuHtml,
				"text": "Columns"
		};
		this.styledSelect("columnDropdown", params);
		var that = this;
		jQuery("#columnDropdownMenu input.columnCheck").bind("change", function(){
			//alert("changed");
			that.toggleColumn(this);
		});
		/*jQuery("#columnDropdownMenu").bind("mousedown", function(event){
		//IE workaround
		//make the checked attribute match the highlight state
		//if (typeof event.target == 'undefined'){
			var highlightedLabel = jQuery(event.srcElement).parent();
			//var labelId = highlightedLabel.length;
			//jQuery(event.srcElement);
			var thisCheckBox = highlightedLabel.next();
			alert("before:  " + thisCheckBox.attr("checked"));
			//if (highlightedLabel.hasClass("ui-state-active")){
				if (typeof thisCheckBox.attr("checked") != "undefined"){
					thisCheckBox.filter("input").attr("checked", false);
					alert(thisCheckBox.filter("input").attr("checked"));
				//} else {}
			} else {
				//if (typeof thisCheckBox.attr("checked") == "undefined"){
					thisCheckBox.attr("checked", "checked");
				}
				//thisCheckBox.trigger("change");

			//}
		//}
	});*/
		//this.updateOrganize();
		jQuery("#columnDropdownSelect").addClass("subHeaderDropdownSelect");
	};
	
	this.toggleColumn = function(thisObj){
		var action,
		checked = jQuery(thisObj).is(":checked"),
		column = jQuery(thisObj).val();

		if (checked) {
			this.utility.whichTab().tableObject().showCol(column);
		} else {
			this.utility.whichTab().tableObject().hideCol(column);
		}

		action = checked ? "Column Added" : "Column Removed";

		analytics.track("Change Results Columns Displayed", action, column);
	};
	/***************
	 * Preview Tools
	 **************/
	//html content/formatting for expanded row
	this.getPreviewToolHTML = function(rowNode){
		var tableId = this.getTableId();
		var tableObj = this.getTableObj();
		var rowData = tableObj.fnGetData(rowNode);
		//layerIds returned from the search are used as OpenLayers layer names
		var layerId = this.getColumnData(rowData, "LayerId");
		var dataType = this.getColumnData(rowData, "DataType");
		var displayName = OpenGeoportal.Utility.escapeQuotes(this.getColumnData(rowData, "LayerDisplayName"));

		var sOut = '<div class="previewControls">';
		//read state
		if (!this.layerState.layerStateDefined(layerId)){
			this.layerState.addNewLayer(layerId, {"dataType": dataType});
		}
		var opacityVal = this.layerState.getState(layerId, "opacity") + '%';
		sOut += this.getOpacityControl(opacityVal);

		if ((dataType == "Raster")||(dataType == "Paper Map")||(dataType == "PaperMap")||(dataType == "LibraryRecord")){
			sOut += this.getZoomToLayerControl();
		} else {
			var sizeVal = this.layerState.getState(layerId, "graphicWidth") + 'px';
			sOut += this.getSizeControl(dataType, sizeVal);
			var colorVal = this.layerState.getState(layerId, "color");
			sOut += this.getColorControl(colorVal);
			sOut += this.getZoomToLayerControl();
			sOut += this.getAttributeInfoControl(layerId);
		}

		sOut += '</div>';
		return sOut;
	};

	this.getOpacityControl = function(opacityVal){		    
		var sOut = '<div class="opacityControlCell">';
		sOut += '<div class="opacityControl">opacity: ';
		sOut += '<div class="controlText opacityText">' + opacityVal + '</div>';
		sOut += '<img src="' + this.getImage("arrow_down.png") + '" class="controlExpand button" />';
		sOut += '</div>';
		sOut += '<div class="controlContainer"><div class="opacitySlider" title="Adjust layer transparency">';
		sOut += '<img src="' + this.getImage("opacity_bg.png") + '" /></div></div>';
		sOut += '</div>';
		return sOut;
	};

	this.getSizeControl = function(dataType, sizeVal){
		var sOut = '<div class="sizeControlCell">';
		sOut += '<div class="sizeControl" >';
		switch (dataType){
		case "Polygon":
			sOut += "border: ";
			break;
		case "Point":
			sOut += "pt size: ";
			break;
		case "Line":
			sOut += "ln width: ";
			break;
		}
		sOut += '<div class="controlText sizeText">' + sizeVal + '</div>';
		sOut += '<img src="' + this.getImage("arrow_down.png") + '" class="controlExpand button" />';
		sOut += '</div>';
		sOut += '<div class="controlContainer"><div class="sizeSlider" title="Adjust size">';
		sOut += '<img src="' + this.getImage("opacity_bg.png") + '" /></div></div>';
		sOut += '</div>';
		return sOut;
	};

	this.getColorControl = function(colorVal){
		var colorControl = '<div class="colorControlCell"><div class="colorControl button" title="Change the layer color" style="background-color:' + colorVal + '"></div></div>';
		return colorControl;
	};

	this.getZoomToLayerControl = function(){
		var zoomToLayerControl = '<div class="button zoomToLayerControl" title="Zoom to geographic extent of layer"></div>';
		return zoomToLayerControl;
	};

	this.getAttributeInfoControl = function(layerId) {
		var attributeToolClass;
		if (this.layerState.getState(layerId, "getFeature")){
			attributeToolClass = "attributeInfoControlOn";
		} else {
			attributeToolClass = "attributeInfoControlOff";
		}
		var attrInfoControl = '<div class="button attributeInfoControl ' + attributeToolClass + '" title="Click a previewed feature on the map to view its attributes"></div>';
		return attrInfoControl;
	};

	//toggle the attribute info button & functionality
	this.toggleFeatureInfo = function(rowData){
		var layerStateObject = this.layerState;
		var layerId = this.getColumnData(rowData, "LayerId");
		var displayName = this.getColumnData(rowData, "LayerDisplayName");

		if (!layerStateObject.getState(layerId, "getFeature")){
			//update layer state
			layerStateObject.setState(layerId, {"getFeature": true});
			layerStateObject.getFeatureTitle = displayName;
		} else {
			//update layer state, turn off get feature 
			layerStateObject.setState(layerId, {"getFeature": false});
		}

	};
	
	this.changeLoginButtonsToControls = function(){
		//change login button to checkbox for institution logged in
		var that = this;
		//loginButton login
		//previewControl previewOff
		jQuery(".colPreview .loginButton").each(function(){
			var node = jQuery(this).closest("tr");
			var tableObject = node.closest("table");
			var tableName = tableObject.attr("id");
			tableObject = that.getTableObj();
			var pos = tableObject.fnGetPosition(node[0]);
			var row = tableObject.fnGetData(pos);
			var rowObj = {};
			rowObj.aData = row;
			jQuery(this).parent().html(tableObject.getActivePreviewControl(rowObj));
		});
	};

	this.changeControlsToLoginButtons = function(logoutInstitution){
		//change checkbox to login button for institution logged out
		var that = this;
		jQuery(".colPreview .previewControl").each(function(){
			var node = jQuery(this).closest("tr");
			var tableObject = node.closest("table");
			var tableName = tableObject.attr("id");
			tableObject = that.getTableObj();
			var pos = tableObject.fnGetPosition(node[0]);
			var row = tableObject.fnGetData(pos);
			var rowObj = {};
			rowObj.aData = row;

			jQuery(this).parent().html(tableObject.getPreviewControl(rowObj));
		});
	};

	//click-handler to expand row, expose preview controls
	this.expandRow = function(thisObj){
		//set the previewCount variable, so we know that a layer has been expanded before
		if (typeof this.layerState.previewCount == "undefined"){
			this.layerState.previewCount = true;
		}

		var rowData = this.getRowData(thisObj);
		var layerId = this.getColumnData(rowData.data, "LayerId");
		if (this.tableLayerState.getState(layerId, "expanded")){
			this.tableLayerState.setState(layerId, {"expanded": false});
		} else {
			this.tableLayerState.setState(layerId, {"expanded": true});
		}
	};

	this.smallSliderHandler = function(){
		var that = this;
		jQuery(document).on("view.openSlider", function(event){
			that.openControl(event.target);
		});
		jQuery(document).on("view.closeSlider", function(event){
			that.closeControl(event.target);
		});
	};

	this.openControl = function(thisObj){
		var control = jQuery(thisObj).find("div.controlContainer");
		if (control.css("display") == "none"){
			var offsetRight = control.prev().position().left - (control.width() - control.prev().width()) - 12;
			control.css("left", offsetRight);
			control.css("display", "block");
		}
	};

	this.closeControl = function(thisObj){
		var control = jQuery(thisObj).find("div.controlContainer");
		control.css("display", "none");
	};

	this.closePreviewTools = function(expandControl$){
		console.log("trying to close");

		expandControl$.removeClass("expanded").addClass("notExpanded");
		var tableObj = this.getTableObj();
		var tableId = this.getTableId();
		var rowNode = expandControl$.closest("tr")[0];
		tableObj.fnClose(rowNode);

		jQuery(".previewedLayer").removeClass('previewSeparator');
		jQuery(".previewedLayer").last().addClass('previewSeparator');
	};

	this.createOpacitySlider = function(opacitySlider$, layerId){
		var that = this;
		//retrieve opacity if it has been defined
		var opacityVal = this.layerState.getState(layerId, "opacity");
		//class = opacitySlider
		opacitySlider$.slider({
			min: 0,
			max: 100,
			step: 5,
			value: opacityVal, //get value from Layer State object 
			slide: function(event, ui) {
				that.layerState.setState(layerId, {"opacity": ui.value});
				var text$ = jQuery(this).parent().parent().find(".opacityText");
				text$.text(ui.value + '%');
			},
			stop: function(event, ui){                  				
				that.layerState.setState(layerId, {"opacity": ui.value});
			}
		});
	};

	this.sliderHoverHandler = function(){
		var sliderControl = [".opacityControlCell", ".sizeControlCell"];
		jQuery(document).on("mouseenter", sliderControl.join(), function(){
			jQuery(this).trigger("view.openSlider"); 
		});
		jQuery(document).on("mouseleave", sliderControl.join(), function(){
			jQuery(this).trigger("view.closeSlider"); 
		});
	};

	this.createSizeSlider = function(sizeSlider$, layerId, dataType){
		var minSize = 1;
		var maxSize = 6;
		if (dataType == "Polygon"){
			minSize = 0;
			maxSize = 5;
		}
		var that = this;
		var widthVal = this.layerState.getState(layerId, "graphicWidth");
		sizeSlider$.slider({
			min: minSize,
			max: maxSize,
			step: 1,
			value: widthVal, //get value from Layer State object 
			slide: function(event, ui) {
				var text$ = jQuery(this).parent().parent().find(".sizeText");
				text$.text(ui.value + 'px');
			},
			stop: function(event, ui){                  				
				that.layerState.setState(layerId, {"graphicWidth": ui.value});
			}
		});
	};

	this.openPreviewTools = function(expandControl$){
		/* Open this row */
		console.log("trying to open");
		expandControl$.removeClass("notExpanded").addClass("expanded");
		var tableObj = this.getTableObj();
		var tableId = this.getTableId();
		var rowData = this.getRowData(expandControl$[0]);
		var rowNode = rowData.node;
		var layerId = this.getColumnData(rowData.data, "LayerId");
		var escapedLayerId = OpenGeoportal.Utility.idEscape(layerId);
		tableObj.fnOpen(rowNode, this.getPreviewToolHTML(rowNode), 'previewTools'); 

		var dataType = this.getColumnData(rowData.data, "DataType");
		if (!this.layerState.layerStateDefined(layerId)){
			this.layerState.addNewLayer(layerId, {"dataType": dataType});
		}

		var controlRow$ = jQuery(rowNode).next();
		this.createOpacitySlider(controlRow$.find(".opacitySlider"), layerId);
		this.createSizeSlider(controlRow$.find(".sizeSlider"), layerId, dataType);

		if (jQuery(rowNode).hasClass("previewedLayer")){
			jQuery(rowNode).next().addClass("previewedLayer");
		}
		if (jQuery(rowNode).hasClass("row_selected")){
			jQuery(rowNode).next().addClass("row_selected");
		}

		jQuery(".previewedLayer").removeClass('previewSeparator');
		jQuery(".previewedLayer").last().addClass('previewSeparator');
	};

	/*this.selectPreviewedRow = function(){
		  var tableName = this.getTableId();	  		
	      jQuery(document).on("click", '#' + tableName + ' td.colPreview > div > input:checkbox', function(event) {
	          var rowObj = jQuery(event.target).closest("tr");
	          if (jQuery(event.target).is(":checked")){
	        	  rowObj.addClass('previewedLayer');
	        	  if (rowObj.next().children('td').hasClass('resultsControls')){
	        		  rowObj.next().addClass('previewedLayer');
	        	  }
	          } else {
	        	  rowObj.removeClass('previewedLayer');
	        	  if (rowObj.next().children('td').hasClass('resultsControls')){
	        		  rowObj.next().removeClass('previewedLayer');
	        	  }
	          }

	      });
	  };*/

	//adds class to row for highlighting current row
	this.highlightRow = function(){
		var tableName = this.getTableId();
		jQuery(document).on("mouseout", '#' + tableName + ' > tbody', function(event) {
			var currentNode = jQuery(event.target).parentsUntil('#' + tableName).last();
			jQuery(currentNode).children().removeClass('row_selected');
			jQuery(document).trigger("map.hideBBox");
		});

		var tableObj = this.getTableObj();
		var tableHeadingsObj = this.tableHeadingsObj;
		var that = this;
		jQuery(document).on("mouseover", '#' + tableName + ' > tbody', function(event) {
			var rowObj = jQuery(event.target).parentsUntil('#' + tableName + ' > tbody').last();
			rowObj.addClass('row_selected');
			if (rowObj.children('td').hasClass('previewTools')){
				rowObj.prev().addClass('row_selected');
			}
			if (rowObj.next().children('td').hasClass('previewTools')){
				rowObj.next().addClass('row_selected');
			}
			//if next sibling is details row, then add class 'row_selected' to it as well
			//set first tr ancestor to class row_selected
			var aData = tableObj.fnGetData(rowObj[0]);
			//console.log(aData);
			if (aData == null){
				rowObj = rowObj.prev();
				aData = tableObj.fnGetData(rowObj[0]);
			}
			var bbox = {};
			bbox.south = that.getColumnData(aData, "MinY");
			bbox.north = that.getColumnData(aData, "MaxY");
			bbox.west = that.getColumnData(aData, "MinX");
			bbox.east = that.getColumnData(aData, "MaxX");
			jQuery(document).trigger("map.showBBox", bbox);
		});
	};

	/*
	 * Metadata control
	 * 
	 */
	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpSuccess = function(data){
		var solrResponse = data["response"];
		var totalResults = solrResponse["numFound"];
		if (totalResults != 1)
		{
			throw new Error("Request for Metadata returned " + totalResults +".  Exactly 1 was expected.");
			return;
		}
		var doc = solrResponse["docs"][0];  // get the first layer object
		var metadataRawText = doc["FgdcText"];
		var layerId = doc["LayerId"];//[0];
		var metadataDocument = jQuery.parseXML(metadataRawText);

		var xsl = null;
		var xslUrl = null;

		if (metadataDocument.firstChild.localName == "MD_Metadata"){
			xslUrl = "isoBasic.xsl";
		} else {
			xslUrl = "FGDC_V2_a.xsl";
		}
		xslUrl = "resources/xml/" + xslUrl;
		var params = {
				url: xslUrl,
				async: false,
				dataType: 'xml',
				success: function(data){xsl = data;}
		};
		jQuery.ajax(params);
		var resultDocument = "";
		if (xsl != null){
			if (window.ActiveXObject){
				resultDocument = metadataDocument.transformNode(xsl);
			} else {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet(xsl);
				resultDocument = xsltProcessor.transformToFragment(metadataDocument, window.document);
			}
		}
		if (typeof jQuery('#metadataDialog')[0] == 'undefined'){
			var dialogDiv = '<div id="metadataDialog" class="dialog"> \n';
			dialogDiv += '</div> \n';
			jQuery('body').append(dialogDiv);
		}
		var dialogHeight = 400;
		var metadataTemplate = '<div id="toMetadataTop"></div><div id="metadataContent"></div><div id="metadataFooter" title="LayerId: ' + layerId + '">' + layerId + '</div>';
		var metadataDialog = jQuery("#metadataDialog");
		metadataDialog.html(metadataTemplate)
		jQuery("#metadataContent").html(resultDocument);

		metadataDialog.dialog({ zIndex: 9999, width: 630, height: dialogHeight, title: "METADATA" });  
		if (jQuery("#metadataDownloadButton").length == 0){
			var downloadButton = '<span class="styledButtonSmall" id="metadataDownloadButton">Download Metadata (XML)</span>';
			metadataDialog.parent().find(".ui-dialog-titlebar").first().prepend(downloadButton);
		}
		var metadataContent = jQuery("#metadataContent");
		metadataContent[0].scrollTop = 0;
		metadataDialog.dialog("open");
		metadataContent.find("a").click(function(event){
			var toId = jQuery(this).attr("href");
			if (toId.indexOf("#") == 0){
				event.preventDefault();
				//parse the hrefs for the anchors in this DOM element into toId
				//current xsl uses names instead of ids; yuck
				toId = toId.substring(1);
				metadataContent.scrollTo(jQuery('[name="' + toId + '"]'));
			}
		});
		jQuery("#metadataDownloadButton").unbind();
		var iframeSource = "getMetadata/download?id=" + layerId;
		var downloadFunction = function(){
			if (typeof jQuery('#metadataDownloadIframe')[0] == 'undefined'){
				var downloadIframe = '<iframe id="metadataDownloadIframe" src="' + iframeSource + '"> \n';
				jQuery("#metadataDialog").append(downloadIframe);
			} else {
				jQuery("#metadataDownloadIframe").attr("src", iframeSource); 
			}
			this.analytics.track("Metadata", "Download Metadata", layerId);
		};
		jQuery("#metadataDownloadButton").on("click", downloadFunction);
		jQuery("#toMetadataTop").off();
		jQuery("#toMetadataTop").on("click", function(){jQuery("#metadataContent")[0].scrollTop = 0;});
	};

	this.downloadMetadata = function downloadMetadata(event){
		var layerId = event.data.layerId;
		var params = {
				url: "getMetadata/download?id=" + layerId,
				dataType: 'xml',
				success: function(data){
					jQuery(document).append(data);
				}
		};
		jQuery.ajax(params);
	};

	// handles jsonp response from request for metadata call
	this.viewMetadataJsonpError = function(){
		throw new Error("The attempt to retrieve FGDC layer information failed.");
	};

	// obtain layer's metadata via jsonp call
	this.viewMetadata = function(thisObj){
		var tableElement = jQuery(thisObj).parents('tr').last();
		var tableObj = tableElement.parent().parent().dataTable();	
		//Get the position of the current data from the node 
		var aPos = tableObj.fnGetPosition( tableElement[0] );
		//Get the data array for this row
		var aData = tableObj.fnGetData(aPos);
		//make an ajax call to retrieve metadata
		var layerId = this.getColumnData(aData, "LayerId");
		var solr = new OpenGeoportal.Solr();
		var query = solr.getMetadataQuery(layerId);
		solr.sendToSolr(query, this.viewMetadataJsonpSuccess, this.viewMetadataJsonpError, this);

		this.analytics.track("Metadata", "Display Metdata", layerId);
	};	

	this.showLibraryRecord = function(thisObj){
		var tableElement = jQuery(thisObj).parents('tr').last();
		var tableObj = tableElement.parent().parent().dataTable();	
		//Get the position of the current data from the node 
		var aPos = tableObj.fnGetPosition( tableElement[0] );
		//Get the data array for this row
		var aData = tableObj.fnGetData(aPos);
		//make an ajax call to retrieve metadata
		var location = jQuery.parseJSON(this.getColumnData(aData, "Location"));
		//open info in location
		var that = this;
		for (var urlType in location){
			if (urlType.toLowerCase() == "maprecord"){
				var params = {
						url: location[urlType],
						dataType: 'jsonp',
						success: that.openMapRecordSuccess
				};
				jQuery.ajax(params);
			} else if (urlType.toLowerCase() == "librecord"){
				window.open(location[urlType]);
			}
		}
	};	

	this.openMapRecordSuccess = function(data){
		if (data.sys_id.length > 0){
			window.open("http://library.mit.edu/item/" + data.sys_id);
			return;
		} 

		if (data.row_id.length > 0) {
			var lookupHTML = "<div><span>Title: </span>";
			if (data.title.length > 0){
				lookupHTML += data.title;
			} else {
				lookupHTML += 'Unknown';
			}
			lookupHTML += '</div>';

			lookupHTML += '<div><span>Publisher: </span>';
			if (data.publisher.length > 0){
				lookupHTML += data.publisher;}
			else {
				lookupHTML += 'Unknown';}
			lookupHTML += '</div>';

			if (data.cartographer.length > 0){
				lookupHTML += '<div><span>Cartographer: </span>';
				lookupHTML += data.cartographer;
				lookupHTML += '</div>';
			}
			lookupHTML += '<div><span>Geographic Area: </span>' + data.geoarea + '</div>';
			var arrYears = [];
			if (data.cont_year.length > 0){
				arrYears.push({"label": "Content Date", "value": data.cont_year});
			}
			if (data.pub_year.length > 0){
				arrYears.push({"label": "Publication Date", "value": data.pub_year});
			}
			if (data.mit_year.length > 0){
				arrYears.push({"label": "Date Acquired", "value": data.mit_year});
			}
			if (data.est_year.length > 0){
				arrYears.push({"label": "Estimated Content Date", "value": data.est_year});
			}
			if (arrYears.length > 0){
				var yearObj = arrYears.shift();
				lookupHTML += '<div><span>' + yearObj.label + ': </span>' + yearObj.value + '</div>' 
			}
			if (arrYears.length > 0){
				var yearObj = arrYears.shift();
				lookupHTML += '<div<span>>' + yearObj.label + ': </span>' + yearObj.value + '</div>' 
			}
			if (data.notes.length > 0){
				lookupHTML += '<div><span>Notes: </span>' + data.notes + '</div>';
			}

			if (data.library == 'Rotch'){
				lookupHTML += '<div><span>Location: </span>Rotch Library - Map Room, Building 7-238</div>';}
			else{
				lookupHTML += '<div><span>Location: </span>' + data.library + '</div>';}

			lookupHTML += '<div><span>Drawer: </span>' + data.drawer + '</div>';
			lookupHTML += '<div><span>Folder: </span>' + data.folder + '</div>';

		} else {
			lookupHTML = 'Error: Please contact GIS Help.';;
		}

		if (typeof jQuery('#mapRecordDialog')[0] == 'undefined'){
			var dialogDiv = '<div id="mapRecordDialog" class="dialog"> \n';
			dialogDiv += '</div> \n';
			jQuery('body').append(dialogDiv);
		}
		var libRecordDialog = jQuery("#mapRecordDialog");
		libRecordDialog.dialog({ zIndex: 9999, width: 572, height: 266, title: "<div>MAP RECORD</div>" });  
		libRecordDialog[0].scrollTop = 0;
		jQuery("#mapRecordDialog").html(lookupHTML);
		libRecordDialog.dialog("open");
	};

	/*  var cartDataTable = jQuery('#savedLayers').dataTable();
		  jQuery('#savedLayers > tbody > tr').each(function(){
			  try{
				var currentLayerId = cartDataTable.fnGetData(this)[index];
				var institution = cartDataTable.fnGetData(this)[inst_idx];
			  } 
			  catch(err) {return true;}

				if (currentLayerId == layerId){
					//close tool row if open
					OpenGeoportal.cartTableObj.closeToolBar(this);
					cartDataTable.fnDeleteRow(this);
					OpenGeoportal.ui.updateSavedLayersNumber();
					return true;
				}
			});
	  };*/


	
	this.previewLayer = function(thisObj){
		//set the previewCount variable, so we know that a layer has been expanded before
		if (typeof this.layerState.previewCount == "undefined"){
			this.layerState.previewCount = true;
		}

		var rowData = this.getRowData(thisObj);
		var layerId = this.getColumnData(rowData.data, "LayerId");
		if (!this.layerState.layerStateDefined(layerId)){
			var dataType = this.getColumnData(rowData.data, "DataType");
			this.layerState.addNewLayer(layerId, {"dataType": dataType});
		}
		if (this.layerState.getState(layerId, "preview") == "on"){
			this.layerState.setState(layerId, {"preview": "off"});
		} else {
			this.layerState.setState(layerId, {"preview": "on"});
		}
	};
	


	/*********
	 *  Render table columns
	 *********/

	//maps returned data type to appropriate image
	this.getTypeIcon = function (rowObj){
		var typeIcon = OpenGeoportal.InstitutionInfo.getIcons().dataTypes;

		var dataType = this.getColumnData(rowObj.aData, "DataType");
		if ((typeof dataType == "undefined")||(dataType === null)){
			return "";
		}
		if (dataType == "Paper Map"){
			dataType = "PaperMap";
		}
		if (typeof typeIcon[dataType] == 'undefined'){
			return '<div class="typeIcon">?</div>';

		} else {
			var iconInfo = typeIcon[dataType];
			var typeHtml = '<div class="typeIcon ' + iconInfo.uiClass + '" title="' + iconInfo.displayName + '"></div>';
			return typeHtml;
		}
	};

	this.getExpandControl = function (rowObj){
		var layerId = this.getLayerIdFromRow(rowObj);
		if ((typeof layerId == "undefined")||(layerId === null)){
			return "";
		}
		var layerExpanded = this.tableLayerState.getState(layerId, "expanded");
		if (layerExpanded){
			return '<div class="expandControl expanded button" title="Hide preview controls"/>';
		} else {
			return '<div class="expandControl notExpanded button" title="Show preview controls"/>';
		}
	};
	
	  //the layer table should handle creating the control;  the preview obj should handle the logic to determine which
	  this.getPreviewControl = function(rowObj){
		  var dataObj = this.getDataObjFromRowData(rowObj.aData);
		  return this.getActivePreviewControl(dataObj);
	  };
		//TODO: fix this
	/*	this.getExternalPreviewControl = function(rowObj){
			//what defines external?
			var imgSource = this.getImage("view_external.png");
			var layerSource = this.getColumnData(rowObj.aData, "Institution");
			var imgText = "Click to go to " + layerSource;
			// previewControl = '<img class="button" onclick="' + context + '.previewLayer(this)" src="' + imgSource + '" title="' + imgText + '" />';
			var previewControl = '<img class="button goExternalButton" src="' + imgSource + '" title="' + imgText + '" ';//open sharecart link in new tab
			//temporary...
			var path = "";
			if (layerSource == "Harvard"){
				path = "http://calvert.hul.harvard.edu:8080/opengeoportal";
				var shareLink = path + "/openGeoPortalHome.jsp";
				var layerId = this.getLayerIdFromRow(rowObj);
				var geodeticBbox = OpenGeoportal.ogp.map.getGeodeticExtent();
				var queryString = '?' + jQuery.param({ layer: layerId, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
				shareLink += queryString;
				previewControl += 'onclick="window.open(\'' + shareLink + '\');return false;"';
			} else if (layerSource == "MIT"){
				path = "http://arrowsmith.mit.edu/mitogp";
				var shareLink = path + "/openGeoPortalHome.jsp";
				var layerId = this.getLayerIdFromRow(rowObj);
				var geodeticBbox = OpenGeoportal.ogp.map.getGeodeticExtent();
				var queryString = '?' + jQuery.param({ layer: layerId, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
				shareLink += queryString;
				previewControl += 'onclick="window.open(\'' + shareLink + '\');return false;"';
			}
			previewControl += '/>';
			return previewControl;
		};
*/
		this.getLoginPreviewControl = function(dataObj){
			var layerSource = dataObj["Institution"];
			var tooltipText = "Login to " + layerSource + " to access this layer";
			var previewControl = '<div class="button loginButton login" title="' + tooltipText + '" ></div>';
			return previewControl;
		};

		this.getActivePreviewControl = function(dataObj){
			var layerId = dataObj["LayerId"];
			var stateVal = this.layerState.getState(layerId, "preview");
			var controlText = "";
			var previewClass = "";
			switch (stateVal){
			case "off":
				controlText = "Preview layer on the map";
				previewClass = "previewOff"; 
				break;
			case "on":
				controlText = "Turn off layer preview on the map";
				previewClass = "previewOn";
				break;
			default:
				break;
			}
			var previewControl = '<div class="previewControl ' + previewClass + '" title="' + controlText + '"></div>';

			return previewControl;
		};

	this.renderDate = function(rowObj){
		var year = rowObj.aData[rowObj.iDataColumn];
		if (typeof year == "undefined"){
			return "";
		}
		if (year.length > 4){
			year = year.substr(0, 4);
		}
		if (year == "0001"){
			year = "?";
		}
		return year
	};

	//maps returned source type to appropriate image
	this.getSourceIcon = function(rowObj){

		var institution = this.getColumnData(rowObj.aData, "Institution");
		var institutionInfo = OpenGeoportal.InstitutionInfo.getInstitutionInfo();

		if ((typeof institution == "undefined")||(institution === null)){
			return "";
		}
		if (institution.length == 0){
			return "";
		}
		var unknownSource = '<div class="repositoryIcon">?</div>';
		if (typeof institutionInfo[institution] == 'undefined'){
			return unknownSource;
		} else if (typeof institutionInfo[institution].graphics == 'undefined'){
			return unknownSource;
		} else if (typeof institutionInfo[institution].graphics.sourceIcon == 'undefined'){
			return unknownSource;
		} else {
			var iconInfo = institutionInfo[institution].graphics.sourceIcon;
			return '<div class="repositoryIcon ' + iconInfo.uiClass + '" title="' + iconInfo.tooltipText + '" ></div>';
		}
	};

	this.getMetadataIcon = function(rowObj){
		var dataType = this.getColumnData(rowObj.aData, "DataType");
		if ((typeof dataType == "undefined")||(dataType === null)){
			return "";
		}
		if (dataType.toLowerCase() == "libraryrecord"){
			return '<div title="show record" class="button viewLibraryRecordControl"></div>';
		} else {
			return '<div title="show metadata" class="button viewMetadataControl"></div>';
		}
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
		this.expandViewHandler();
		this.attributeInfoHandler();
		this.zoomToLayerExtentHandler();
		this.smallSliderHandler();
		this.sliderHoverHandler();
		this.titleClickHandler();
		this.colorControlClickHandler();
	};
	
	this.colorControlClickHandler = function(){
		var that = this;
		jQuery("#" + that.getTableId()).on('click', ".colorControl", function(){
			var node$ = jQuery(this).closest("tr").prev();
			var layerId = that.getColumnData(that.getRowData(node$).data, "LayerId");
			//console.log("triggering view.openColorChooser, layerId: " +layerId);
			jQuery(document).trigger("view.openColorChooser", {"layerId": layerId});
		});
	};

	this.expandHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.expand", "div.expandControl", function(event){
			//console.log("layer saved");
			that.expandRow(this);
		});
	};

	this.expandViewHandler = function(){
		var that = this;
		jQuery("#" + that.getTableId()).on("view.expandRow", function(event, data){
			var control$ = that.findExpandControl(data.layerId);
			that.openPreviewTools(control$);
		});
		jQuery("#" + that.getTableId()).on("view.closeRow", function(event, data){
			var control$ = that.findExpandControl(data.layerId);
			that.closePreviewTools(control$);
		});
	};


	this.attributeInfoHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.attributeInfo", "div.attributeInfoControl", function(event){
			var tableObj = that.getTableObj();	         
			//Get the data array for this row 
			var node = jQuery(this).closest("tr").prev();
			var rowData = tableObj.fnGetData(tableObj.fnGetPosition( node[0] ));
			that.toggleFeatureInfo(rowData);
		});
	};

	this.zoomToLayerExtentHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.zoomToLayerExtent", "div.zoomToLayerControl", function(event){
			var tableObj = that.getTableObj();	         
			//Get the data array for this row 
			var node = jQuery(this).closest("tr").prev();
			var rowData = tableObj.fnGetData(tableObj.fnGetPosition( node[0] ));

			var extent = [];
			extent.push(that.getColumnData(rowData, "MinX"));
			extent.push(that.getColumnData(rowData, "MinY"));
			extent.push(that.getColumnData(rowData, "MaxX"));
			extent.push(that.getColumnData(rowData, "MaxY"));

			var bbox = extent.join();
			jQuery(document).trigger("map.zoomToLayerExtent", {"bbox": bbox});
		});
	};

	this.previewHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.preview", "div.previewControl", function(event){
			//console.log("layer saved");
			that.previewLayer(this);
		});
	};
	
	this.previewControlShowOn = function(thisObj){
		var previewControl$ = jQuery(thisObj);
		previewControl$.removeClass("previewOff").addClass("previewOn");
		var hideLayerText = "Turn off layer preview on the map";
		previewControl$.attr("title", hideLayerText);
		//console.log("at previewControlShowOn in table: " + this.getTableId());
		var dataRow = this.getRowData(thisObj).data;
		var dataObj = this.getDataObjFromRowData(dataRow);
		jQuery(document).trigger("previewLayerOn", {"layerObj": dataObj});
	};

	this.previewControlShowOff = function(thisObj){
		var previewControl$ = jQuery(thisObj);
		previewControl$.removeClass("previewOn").addClass("previewOff");
		var showLayerText = "Preview layer on the map";
		previewControl$.attr("title", showLayerText);
		var dataRow = this.getRowData(thisObj).data;
		var dataObj = this.getDataObjFromRowData(dataRow);
		jQuery(document).trigger("previewLayerOff", {"layerObj": dataObj});
	};
	
	this.previewViewHandler = function(){
		var that = this;
		//we actually want this to fire for each table instance
		jQuery(document).on("view.previewOn", function(event, data){
			//console.log("view.previewOn fired by: " + that.getTableId());
			var control$ = that.findPreviewControl(data.layerId);
			if (control$.length > 0){
				that.previewControlShowOn(control$);
			}
		});
		jQuery(document).on("view.previewOff", function(event, data){
			var control$ = that.findPreviewControl(data.layerId);
			if (control$.length > 0){
				that.previewControlShowOff(control$);
			}
		});
	};

	this.viewMetadataHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.viewMetadata", "div.viewMetadataControl", function(event){
			that.viewMetadata(this);
		});
	};

	this.viewLibraryRecordHandler = function(){
		jQuery("#" + that.getTableId() + " tbody").on("click.viewLibraryRecord", "div.viewLibraryRecordControl", function(event){
			that.showLibraryRecord(this);
		});
	};

	this.titleClickHandler = function(){
		var tableId = this.getTableId();
		var that = this;
		jQuery('#' + tableId).on('click', '.colTitle', function(){
			var rowData = that.getRowData(jQuery(this).closest("tr")).data;
			var layerId = that.getColumnData(rowData, "LayerId");
			var stateVal = that.tableLayerState.getState(layerId, "expanded");
			that.tableLayerState.setState(layerId, {"expanded": !stateVal});
		});
	};

	//callback to keep 'expanded' state on table reloads
	//this can't be done with a draw table callback, because the open row function redraws
	this.callbackExpand = function(){
		var that = this;
		var targetTableId = this.getTableId();
		jQuery('#' + targetTableId + ' .expandControl').each(function(){
			if (jQuery(this).hasClass("expanded"))
				var imgVal = jQuery(this).attr('src');
			var imgOpened = that.getImage("arrow_down.png");
			var imgClosed = that.getImage("arrow_right.png");
			if (imgVal == imgOpened){
				var tableObj = that.getTableObj();
				//var aPos = tableObj.fnGetPosition(jQuery(this).closest("tr")[0]);
				var aData = tableObj.fnGetData(jQuery(this).closest("tr")[0]);
				var layerId = this.getColumnData(aData, "LayerId");
				if (layerId.length == 0){
					return true;
				}
				var stateVal = that.tableLayerState.getState(layerId, "expanded");
				if (stateVal === true){
					that.expandRow(this);
				} else {
					jQuery(this).attr('src', imgClosed);
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
			var currentHeading = this.tableHeadingsObj.getTableConfig()[arrColumns[i]];
			if (currentHeading.resizable){
				this.createSimpleTooltip(currentHeading.columnConfig.sClass);
			}
		}
		this.createHeaderTooltips();
	};
};