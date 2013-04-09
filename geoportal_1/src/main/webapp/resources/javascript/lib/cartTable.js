/**
 * This javascript module includes functions for dealing with the cart
 * table, which inherits from the object LayerTable.  LayerTable uses the excellent
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
 * CartTable constructor
 * this object defines the behavior of the cart table, inherits from the LayerTable
 * 
 * @param object OpenGeoportal.OgpSettings
 */
OpenGeoportal.CartTable = function CartTable(stateObj){
	OpenGeoportal.LayerTable.call(this, stateObj);
	
	//insert into table settings
	/*
	 * 	"checkBox": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		{"sName": "checkBox", "sTitle": "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />", "bVisible": false, "aTargets": [ 1 ], "sClass": "colChkBoxes", "sWidth": "21px", "bSortable": false,
									"fnRender": function(oObj){return thisObj.getDownloadControl(oObj);}}},
	 */
	
	var that = this;
	var columnLabel = "checkBox";
	var columnObj = {
			"ajax": false, 
			"resizable": false, 
			"organize": false, 
			"columnConfig": {
				"sName": "checkBox", 
				"sTitle": "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />", 
				"bVisible": true, 
				"aTargets": [ 1 ], 
				"sClass": "colChkBoxes", 
				"sWidth": "21px", 
				"bSortable": false,
				"fnRender": function(oObj){return that.getDownloadControl(oObj);}
				}
	};

	this.tableSettings.tableConfig.insertColumn(columnLabel, columnObj);
	
	
	//we must override initControlHandlers to add additional eventhandlers to the table
/*	this.initControlHandlers = function(){
		this.initControlHandlersDefault();
	};
	*/
	
	//we must override initControlHandlers to add additional eventhandlers to the table
	this.initControlHandlers = function(){
		this.initControlHandlersDefault();
		this.initCartHandlers();
	};
	
	this.initCartHandlers = function(){
		this.addToCartHandler();
	};
	
	this.downloadActionSelectRow = function(rowPosition, isSelected){
		var selectionClass;
		if (isSelected){
			selectionClass = 'downloadSelection';
		} else {
			selectionClass = 'downloadUnselection';
		}
		var tableObj = this.getTableObj();
		var rowObj = jQuery(tableObj.fnGetNodes(rowPosition));
		rowObj.addClass(selectionClass);

		if (rowObj.next().children('td').hasClass('previewTools')){
			rowObj.next().addClass(selectionClass);
		}
		//if next sibling is details row, then add class 'row_selected' to it as well
		//set first tr ancestor to class row_selected
		/*var aData = tableObj.fnGetData(rowObj[0]);
		    //console.log(aData);
		    if (aData == null){
		    	rowObj = rowObj.prev();
			    aData = tableObj.fnGetData(rowObj[0]);
		    }
		    var bbox = {};
        	bbox.south = aData[tableHeadingsObj.getColumnIndex("MinY")];
        	bbox.north = aData[tableHeadingsObj.getColumnIndex("MaxY")];
        	bbox.west = aData[tableHeadingsObj.getColumnIndex("MinX")];
        	bbox.east = aData[tableHeadingsObj.getColumnIndex("MaxX")];
	    	OpenGeoportal.map.showLayerBBox(bbox);
		 */
	};
	

	//**************Table Specific
	this.numberOfResults = function(){
		var tableName = this.getTableId();
		var number;
		number = this.getTableObj().fnSettings().fnRecordsTotal();
		return number;
	};
	
	this.removeRows = function(){
		var that = this;
		var index = this.tableHeadingsObj.getColumnIndex("LayerId");
		var inst_idx = this.tableHeadingsObj.getColumnIndex("Institution");
		jQuery('#savedLayersTable td.colChkBoxes :checked').each(function(){
			var rowObj = jQuery(this).parentsUntil('tr').last().parent();
			var layerId = jQuery('#savedLayers').dataTable().fnGetData(rowObj[0])[index];
			var institution = jQuery("#savedLayers").dataTable().fnGetData(rowObj[0])[inst_idx];
			that.layerState.setState(layerId, {"inCart": false});
			jQuery('#savedLayers').dataTable().fnDeleteRow(rowObj[0]);
			this.analytics.track("Layer Removed From Cart", institution, layerId);
		});
		jQuery(document).trigger("view.updateCartNumber");
		//update layer state, synchronize save icons
	};
	
	//*******Cart only
	this.getDownloadControl = function (rowObj){
		var value = rowObj.aData[rowObj.iDataColumn];
		if ((typeof value == "undefined")||(value === null)){
			return null;
		}
		return '<input type="checkbox" class="cartCheckBox" checked />';
	};
	
	//TODO: remove table specific code
	this.getEmptyTableMessage = function getEmptyTableMessage(){
			return "No data layers have been added to the cart.";
	};
	
	this.addToCartHandler = function(){
		var that = this;
		jQuery(document).on('table.addToCart', function(event, data){
			var savedTable = that.getTableObj();
			var currentData = savedTable.fnGetData();
			currentData.unshift(data);
			savedTable.fnClearTable();
			savedTable.fnAddData(currentData);
		});
	 };
	 
	 //TODO: rewrite
		this.initSortable = function(){
			var that = this;
			jQuery( "#savedLayers > tbody" ).sortable({helper: "original", opacity: .5, containment: "parent", 
				items: "tr", tolerance: "pointer", cursor: "move",
				start: function(event, ui){
					//this code is ugly...optimize
					jQuery("#savedLayers .resultsControls").each(function(){
						var rowObj = jQuery(this).parent()[0];
						//console.log(rowObj);
						var tableObj = jQuery("#savedLayers").dataTable();
						tableObj.fnClose(rowObj);
						//why doesn't this close the row?
						tableObj.fnDraw(false);
					});
				},
				stop: function(event, ui){
					var dataArr = [];
					var tableObj = jQuery("#savedLayers").dataTable();
					dataArr = tableObj.fnGetData();
					var newArr = [];
					var openCount = 0;
					jQuery("#savedLayers > tbody > tr").each(function(index, Element){
						var dataTableIndex = tableObj.fnGetPosition(Element);
						if (typeof dataTableIndex == 'number'){
							newArr[index - openCount] = dataArr[dataTableIndex];
						} else {
							openCount += 1;
						}
					});
					tableObj.fnClearTable(false);
					tableObj.fnAddData(newArr);
					var tableLength = newArr.length;
					for (var i in newArr){

						if (typeof that.mapObject.getLayersByName(newArr[i][0])[0] != 'undefined'){
							var layer = that.mapObject.getLayersByName(newArr[i][0])[0];
							that.mapObject.setLayerIndex(layer, tableLength - (i+1));
						}
					}

					that.cartTableObject.callbackExpand();

				}
			});
		};
};

OpenGeoportal.CartTable.prototype = Object.create( OpenGeoportal.LayerTable.prototype );
