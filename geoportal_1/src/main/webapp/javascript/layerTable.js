/**
 * This javascript module includes functions for dealing with the search 
 * results table under the object LayerTable.  LayerTable uses the excellent
 * jQuery-based dataTables as the basis for the table.
 * 
 * @author Chris Barnett
 * 
 */
if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}

/**
 * LayerTable constructor
 * this object defines the behavior of the search results table, as well as the saved layers table
 * 
 *  @param userDiv  the id of the div element to place the table in
 *  @param tableName the id of the actual table element
 */
org.OpenGeoPortal.LayerTable = function(userDiv, tableName){
	//set default for the name of the table div...these defaults should not be in the generic layertable code
	//but in the extensions of the object
	if ((typeof userDiv == 'undefined')||(userDiv.length === 0)){
		userDiv = 'resultsTable';
	}
	
	if ((typeof tableName == 'undefined')||(tableName.length === 0)){
		tableName = 'searchResults';
	}
	var that = this;

	this.getTableDiv = function(){
		return userDiv;
	};
    //this.tableDiv = userDiv;
	this.getTableID = function(){
		return tableName;
	};
	
	this.getTableObj = function(){
		return jQuery('#' + tableName).dataTable();
	};
	
	this.tableHeadingsObj = new org.OpenGeoPortal.LayerTable.TableHeadings(this);
	//temporary?
	tableHeadings = this.tableHeadingsObj.getTableHeadings();
	
	this.tableLayerState = new org.OpenGeoPortal.LayerTable.TableLayerState();
	  /*private methods
	   * 
	   */
	//maintains state for how the table is sorted
	//*******Search Results only
	this.tableOrganize = {
	    //set some defaults
		settings: {"organizeBy": "score", "organizeType": "numeric", "organizeDirection": "desc"},
		//we only need organizetype if there is more than one possibility per column
		//get the current sort state
		getState: function(){
			return this.settings;
		},
		
		//set the state
		setState: function(updateObj){//can't directly set organizeType; this will be looked up in tableHeading
			//test to see if the state is changed; if so, fire new solr search
			var innerThat = this;
			compareState = function(key){
				if (updateObj[key] == innerThat.settings[key]){
					return true;
				} else {
					return false;
				}
			};
			setSortColumn = function(){
				//test for rank first
				var newColumn = updateObj.organizeBy;
				if (newColumn == 'score'){
					innerThat.settings.organizeBy = newColumn;
					innerThat.settings.organizeType = "numeric";
				} else {
					for (var columnName in tableHeadings){
						if (newColumn == columnName){
							var newOrganize = columnName.organize;
							if (newOrganize){
								throw new Error("This column cannot be organized."); //you can't organize this column
							} else {
								innerThat.settings.organizeBy = newColumn;
								innerThat.settings.organizeType = newOrganize;
								return;
							}
						}
					}
					throw new Error("The specified column name does not exist."); //if it gets here, this means that there was no matching column name in tableHeadings
				}
			};
			
			setSortDirection = function(){
				if (typeof updateObj.organizeDirection == 'undefined'){
					updateObj.organizeDirection = innerThat.settings.organizeDirection;
				}
				if ((updateObj.organizeDirection == 'asc')||(updateObj.organizeDirection == 'desc')){
					innerThat.settings.organizeDirection = updateObj.organizeDirection;
				} else {
					throw new Error("The specified sort direction is invalid for this column."); //invalid organize direction type
				}
			};
			
			if (typeof updateObj.organizeBy == 'undefined'){
				if (typeof updateObj.organizeDirection == 'undefined'){
					//these values can't both be unspecified
					throw new Error("Must specify a column and/or direction.");
				} else {
					//set organizeBy to current value, continue processing
					updateObj.organizeBy = innerThat.settings.organizeBy;
					setSortColumn();
					setSortDirection();
					that.searchRequest(0);
					org.OpenGeoPortal.ui.updateSortMenu();
				}
			} else if (compareState('organizeBy')){
				if (compareState('organizeDirection')){
					//don't do anything...the object hasn't changed exit function
					return;
				} else {
					setSortDirection();
					that.searchRequest(0);
					org.OpenGeoPortal.ui.updateSortMenu();
				}
			} else {
				setSortColumn();
				setSortDirection();
				that.searchRequest(0);
				org.OpenGeoPortal.ui.updateSortMenu();
			}
		}
	};
	  //wrap the content of each table cell in a div so we can control the size
	  this.wrapCells = function(){
		var tableName = that.getTableID();
	  	jQuery('#' + tableName + ' td').add('#' + tableName + ' th').each(function (iPosition, Element){
	  		//reference the column, so we can set the width of each div
	  		var tableCell = jQuery(this);
	  		if (!tableCell.children().first().is("div")){
	  			tableCell.wrapInner('<div class="' + tableName + 'Cell" />');
	  		}
	  	});
	  	that.sizeCells();
	  };
	  	  //dynamically size the table depending on visible columns & the width of the container
		  this.sizeCells = function(){
			  //determine which fields are showing, set widths from header object
			  //if they add up to the total width, we're done.  otherwise we need to adjust
			  //we need to maintain minimum widths
			  var currentTab = org.OpenGeoPortal.Utility.whichTab();
			  var tableID = this.getTableID();
			  var adjustObj;

			  if (!currentTab.tableObject){
				  return;
			  }
			  if (currentTab.tableName != tableID){
				  return;
			  }
			  var totalWidth = jQuery('#left_col').width();
			  var arrColumns = this.getVisibleColumns();
			  totalWidth = totalWidth - (arrColumns.length * 7) + 1;//account for cell padding plus right borders of cells, leftmost border
			  //var divWidth = totalWidth;
			  var arrSizable = new Array();
			  var sizableWidth = 0;
			  var headingsObj = this.tableHeadingsObj;
			  for (var i in arrColumns){
				  var currentColumn = arrColumns[i];
				  var currentWidth = headingsObj.getWidth(currentColumn);
				  if (headingsObj.getValue(currentColumn, "resizable")){
					  sizableWidth += currentWidth;
					  arrSizable.push(currentColumn);
				  } else {
					  var fixedColumnWidth = parseFloat(currentWidth);
					  totalWidth = totalWidth - fixedColumnWidth;
				  }
			  }
			  var numberSizable = arrSizable.length;
			  if (numberSizable == 0){
				  return;//we're done.  exit the function 
			  }
			  //working here....
			  if (numberSizable == 1){
				  var currentClass = headingsObj.getValue(arrSizable[0], "sClass");
				  var currentMinWidth = headingsObj.getValue(arrSizable[0], "minWidth");
				  if (totalWidth >= currentMinWidth){
					  jQuery('#' + tableID + ' .' + currentClass + ' > div').width(totalWidth);
				  } else {
					  //debugging
					  this.removeExtraColumn();
					  //alert('remaining width is less than the minWidth for the column (sizable = 1)');
					  //what can we do here?  I think we have to remove columns to make things fit.
					  //this will fail to adjust columns properly if the visible resizable column is not
					  //removed by the above function
				  }
				  //should also update the currentWidth;
				  headingsObj.setWidth(arrSizable[0], totalWidth);
				  return;//we're done.  exit the function
			  }
			  
			  //following is executed if numberSizable is > 1
			  //determine if the total width currently set for the sizable columns is equal to the 
			  //width available on the page.
			  var remainingWidth = totalWidth - sizableWidth;
			  if (remainingWidth == 0){
				  //set columns to currentWidth values
				  for (var j in arrSizable){
					  var currentSizable = arrSizable[j];
					  //var currentMinWidth = headingsObj.getValue(currentSizable, "minWidth");
					  var currentWidth = headingsObj.getValue(currentSizable, "currentWidth");
					  var currentClass = headingsObj.getValue(currentSizable, "sClass");
					  jQuery('#' + tableID + ' .' + currentClass + ' > div').width(currentWidth);
					  //since setWidth cannot set a 'currentWidth' smaller than 'minWidth', we
					  //should be ok not comparing with 'minWidth' here
					  headingsObj.setWidth(currentSizable, currentWidth);
				  };
			  } else {
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
					  if (currentWidth >= currentMinWidth){ 
						  adjustObj = {};
						  adjustObj.sClass = currentClass;
						  adjustObj.availableWidth = currentWidth - currentMinWidth;
						  adjustObj.currentWidth = currentWidth;
						  adjustObj.currentSizable = currentSizable;
						  adjustArr.push(adjustObj);
						  jQuery('#' + tableID + ' .' + currentClass + ' > div').width(currentWidth);
						  headingsObj.setWidth(currentSizable, currentWidth);
						  propagate = 0;
					  } else {
						  //if we set the column to the currentMinWidth, we have to propagate the difference to 
						  //another column.
						  propagate = currentMinWidth - currentWidth;
						  jQuery('#' + tableID + ' .' + currentClass + ' > div').width(currentMinWidth);
						  headingsObj.setWidth(currentSizable, currentMinWidth);  
					  }
				  };
				  while (propagate > 0){
					  //in this case, we need to start taking width from earlier columns
					  if (adjustArr.length > 0){
						  for (var k in adjustArr){
							  var currentAdjust = adjustArr[k]; 
							  //compare the value of propagate with the value of currentAdjust.availableWidth
							  var adjustDelta = propagate - currentAdjust.availableWidth;
							  if (adjustDelta <= 0){
								  jQuery('#' + tableID + ' .' + currentAdjust.sClass + ' > div').width(currentAdjust.currentWidth - propagate);
								  headingsObj.setWidth(adjustObj.currentSizable, currentAdjust.currentWidth - propagate);
								  return;  //we're done
							  } else {
								  jQuery('#' + tableID + ' .' + currentAdjust.sClass + ' > div').width(currentAdjust.currentWidth - currentAdjust.availableWidth);
								  headingsObj.setWidth(adjustObj.currentSizable, currentAdjust.currentWidth - currentAdjust.availableWidth);
								  propagate = adjustDelta;
							  }
						  }
					  } else {
					  //if propagate is still > 0 when all columns are at minWidth, we have to remove a column from display
						  this.removeExtraColumn();
						  return; //avoid possible infinite loop
					  }
				  }
			  }
			  //totalWidth must be shared between all visible columns
		  };
	  
	  //html content/formatting for expanded row
	  this.formatDetails = function(rowNode){
		var tableID = this.getTableID();
        var tableObj = this.getTableObj();
	  	var rowData = tableObj.fnGetData(rowNode);
	      //layerIDs returned from the search are used as OpenLayers layer names
	  	var layerID = rowData[this.tableHeadingsObj.getColumnIndex("LayerId")];
	  	var dataType = rowData[this.tableHeadingsObj.getColumnIndex("DataType")];
	  	var displayName = rowData[this.tableHeadingsObj.getColumnIndex("LayerDisplayName")];
	  	var extent = [];
	  	extent.push(rowData[this.tableHeadingsObj.getColumnIndex("MinX")]);
	  	extent.push(rowData[this.tableHeadingsObj.getColumnIndex("MinY")]);
	  	extent.push(rowData[this.tableHeadingsObj.getColumnIndex("MaxX")]);
	  	extent.push(rowData[this.tableHeadingsObj.getColumnIndex("MaxY")]);
	    var sOut = '<div class="previewControls">';
	    //read state
	    if (!org.OpenGeoPortal.layerState.layerStateDefined(layerID)){
	    	org.OpenGeoPortal.layerState.addNewLayer(layerID, {"dataType": dataType});
	    }

	    var opacityVal = org.OpenGeoPortal.layerState.getState(layerID, "opacity") + '%';

	    sOut += '<div class="opacityControlCell">';
	    sOut += '<div class="opacityControl">opacity: ';
	    sOut += '<div class="controlText opacityText" id="opacityText' +  tableID + layerID + '">' + opacityVal + '</div>';
	    sOut += '<img src="media/arrow_down.png" class="controlExpand button" />';
	    sOut += '</div>';
	    sOut += '<div class="controlContainer"><div class="opacitySlider" title="Adjust layer transparency" id="opacity' +  tableID + layerID + '">';
	    sOut += '<img src="media/opacity_bg.png" /></div></div>';
	    sOut += '</div>';
	    if ((dataType == "Raster")||(dataType == "Paper Map")){
	    	sOut += '<div class="sizeControlCell">';
		    sOut += '</div>';
	    	sOut += '<div class="colorControlCell">';
		    sOut += '</div>';
	    	sOut += '<div class="zoomToLayerControlCell"><img src="media/zoomextent.gif" class="button" alt="Zoom to geographic extent of layer" title="Zoom to geographic extent of layer" onclick="org.OpenGeoPortal.map.zoomToLayerExtent(\'' + extent.join() + '\')" /></div>';
	    	sOut += '<div class="attributeInfoControlCell">';
		    sOut += '</div>';
	    } else {
	    	var attributeToolImg;
		    if (org.OpenGeoPortal.layerState.getState(layerID, "getFeature")){
		    	attributeToolImg = "media/preview_down.gif";
		    } else {
		    	attributeToolImg = "media/preview.gif";
		    }
	    	var sizeVal = org.OpenGeoPortal.layerState.getState(layerID, "graphicWidth") + 'px';
	    	
	    	sOut += '<div class="sizeControlCell">';
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
	    	sOut += '<div class="controlText sizeText" id="sizeText' +  tableID + layerID + '">' + sizeVal + '</div>';
		    sOut += '<img src="media/arrow_down.png" class="controlExpand button" />';
	    	sOut += '</div>';
		    sOut += '<div class="controlContainer"><div class="sizeSlider" title="Adjust size" id="size' +  tableID + layerID + '">';
		    sOut += '<img src="media/opacity_bg.png" /></div></div>';
		    //sOut += '<input type="checkbox" class="outlineControl" title="Add an outline to polygon layer" id="outlineCheckBox' + tableID + layerID;
		    //sOut += '" onclick="org.OpenGeoPortal.ui.toggleOutline(this, \'' + layerID + '\', \'' + dataType + '\')"/><label for="outlineCheckBox' + tableID + layerID + '" title="Add an outline to polygon layer">outline</label>';
	    	sOut += '</div>';
	    	sOut += '<div class="colorControlCell"><div class="colorPalette button" title="Change the layer color" id="colorPalette' + tableID + layerID + '" onclick="org.OpenGeoPortal.ui.colorDialog(\'' + layerID + '\', \'' + dataType + '\')"></div></div>';
	    	sOut += '<div class="zoomToLayerControlCell"><img src="media/zoomextent.gif" class="button zoomToLayerControl" alt="Zoom to geographic extent of layer" title="Zoom to geographic extent of layer" onclick="org.OpenGeoPortal.map.zoomToLayerExtent(\'' + extent.join() + '\')" /></div>';
	    	sOut += '<div class="attributeInfoControlCell">';
	    	sOut +=	'<img src="' + attributeToolImg + '" id="attributeInfoControl' + tableID + layerID + '"class="button attributeInfoControl" alt="Show Attributes" title="Click a previewed feature on the map to view its attributes" onclick="org.OpenGeoPortal.ui.toggleFeatureInfo(this, \'' + layerID + '\', \'' + displayName + '\')" /></div>';
	    }

	    sOut += '</div>';
	    return sOut;
	  };
	  
	  this.selectPreviewedRow = function(){
		  var tableName = this.getTableID();	  		
	      jQuery('#' + tableName + ' td.colPreview > div > input:checkbox').live("click", function(event) {
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
	  };
	  
	  //adds class to row for highlighting current row
	  this.highlightRow = function(){
		  var tableName = this.getTableID();
	      jQuery('#' + tableName + ' > tbody').live("mouseout", function(event) {
	    	  var currentNode = jQuery(event.target).parentsUntil('#' + tableName).last();
	    	  jQuery(currentNode).children().removeClass('row_selected');
	    	  org.OpenGeoPortal.map.hideLayerBBox();
	      });
	  		
	      var tableObj = this.getTableObj();
	      var tableHeadingsObj = this.tableHeadingsObj;
	      jQuery('#' + tableName + ' > tbody').live("mouseover", function(event) {
	          var rowObj = jQuery(event.target).parentsUntil('#' + tableName + ' > tbody').last();
	          rowObj.addClass('row_selected');
	          if (rowObj.children('td').hasClass('resultsControls')){
	        	  rowObj.prev().addClass('row_selected');
	          }
	          if (rowObj.next().children('td').hasClass('resultsControls')){
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
        	bbox.south = aData[tableHeadingsObj.getColumnIndex("MinY")];
        	bbox.north = aData[tableHeadingsObj.getColumnIndex("MaxY")];
        	bbox.west = aData[tableHeadingsObj.getColumnIndex("MinX")];
        	bbox.east = aData[tableHeadingsObj.getColumnIndex("MaxX")];
	    	org.OpenGeoPortal.map.showLayerBBox(bbox);
	      });
	  };
	  
	  this.downloadActionSelectRow = function(rowPosition, isSelected){
		  if (isSelected){
			  selectionClass = 'downloadSelection';
		  } else {
			  selectionClass = 'downloadUnselection';
		  }
	      var tableObj = this.getTableObj();
	      //var tableHeadingsObj = this.tableHeadingsObj;
	      var rowObj = jQuery(tableObj.fnGetNodes(rowPosition));
	      rowObj.addClass(selectionClass);

	      if (rowObj.next().children('td').hasClass('resultsControls')){
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
	    	org.OpenGeoPortal.map.showLayerBBox(bbox);
	       */
	  };

	  this.getLayerIdFromRow = function(rowObj){
		  return rowObj.aData[that.tableHeadingsObj.getColumnIndex('LayerId')];
	  };
	  
	  this.toolBarState = function(rowNode){
          if (rowNode.next().children('td').hasClass('resultsControls')){
        	  return true;
          } else {
        	  return false;
          }
	  };
	  //click-handler to expand row, expose preview controls
	  this.expandableRow = function(thisObj){
		  //debug
		try{
			//set the previewCount variable, so we know that a layer has been expanded before
      	if (typeof org.OpenGeoPortal.layerState.previewCount == "undefined"){
        	org.OpenGeoPortal.layerState.previewCount = true;
       	}
		var rowNode = jQuery(thisObj).closest('tr');

	      //test here to see if the next row is a tools row....then we can deal 
	      //with this properly

        var isOpen = this.toolBarState(rowNode);
	    var detailsOpen = "media/arrow_down.png";
	    var detailsClosed = "media/arrow_right.png";
	      //this should do the right thing if the layerState for 'expanded' and the row icon
	      //don't match
	    var graphicsState = jQuery(thisObj).attr('src');
	    if (graphicsState == detailsClosed){
	          /* Open this row */
	          this.openRow(rowNode[0]);
	    } else if (graphicsState == detailsOpen){
			  //if layerExpanded is true and tools are open
	    	if (isOpen){
			  /* This row is already open - close it */
	    		this.closeToolBar(rowNode[0]);
	    	} else {
		          /* Open this row */
	    		this.openRow(rowNode[0]);
			}

	    } 
	    //debug
		} catch(err){alert(err + " expandableRow");};
	  };

	  this.closeToolBar = function(rowNode){
		  try{
	      var detailsClosed = "media/arrow_right.png";
	      jQuery(rowNode).find(".colExpand img").attr('src', detailsClosed);
		  var tableObj = this.getTableObj();
          var tableID = this.getTableID();
		  tableObj.fnClose(rowNode);
	      var layerID = tableObj.fnGetData(rowNode)[this.tableHeadingsObj.getColumnIndex("LayerId")];

          if (this.tableLayerState.getState(layerID, "expanded")){
        	  this.tableLayerState.setState(layerID, {"expanded": false});
          }
          
          if (tableID != 'savedLayers'){
        	  this.setTableLength();
          }
			jQuery(".previewedLayer").removeClass('previewSeparator');
			jQuery(".previewedLayer").last().addClass('previewSeparator');
		  tableObj.fnDraw(false);
		} catch(err){alert(err + " closeToolBar");};
	  };
	  
	  this.openRow = function(rowNode){
		  try{
          /* Open this row */
	      var detailsOpen = "media/arrow_down.png";
          jQuery(rowNode).find(".colExpand img").attr('src', detailsOpen);

		  var tableObj = this.getTableObj();
          var tableID = this.getTableID();
	      var layerID = tableObj.fnGetData(rowNode)[this.tableHeadingsObj.getColumnIndex("LayerId")];
		  var escapedLayerID = org.OpenGeoPortal.Utility.idEscape(layerID);

	      tableObj.fnOpen(rowNode, this.formatDetails(rowNode), 'resultsControls'); 

    	  var dataType = tableObj.fnGetData(rowNode)[this.tableHeadingsObj.getColumnIndex("DataType")];
    	  //console.log(dataType);
		  if (!org.OpenGeoPortal.layerState.layerStateDefined(layerID)){
			  org.OpenGeoPortal.layerState.addNewLayer(layerID, {"dataType": dataType});
		  }

		  if (!this.tableLayerState.getState(layerID, "expanded")){
			  this.tableLayerState.setState(layerID, {"expanded": true});
		  }
      
		  if (tableID != 'savedLayers'){
			  this.setTableLength();
		  }
    	  if ((dataType == "Raster")||(dataType =="Paper Map")){
    		  //return;
    	  } else {
    		  var minSize = 1;
    		  var maxSize = 6;
    		  if (dataType == "Polygon"){
    			  minSize = 0;
    			  maxSize = 5;
    		  }
    	  
    		  //trigger an event?
    		  if (jQuery(".colorPalette").length == 0){
    			  setTimeout("org.OpenGeoPortal.ui.setPaletteColor(" + layerID + ")",250);
    		  }
    		  org.OpenGeoPortal.ui.setPaletteColor(layerID);
          
    		  //

    		  var sizeControl = jQuery("div.sizeControl");
    		  sizeControl.each(function(){
    			  jQuery(this).parent().hover(function(){org.OpenGeoPortal.ui.openControl(this);}, function(){org.OpenGeoPortal.ui.closeControl(this);});
    		  });

    		  var widthVal = org.OpenGeoPortal.layerState.getState(layerID, "graphicWidth");
    		  jQuery("#size" + tableID + escapedLayerID).slider({
    			  min: minSize,
    			  max: maxSize,
    			  step: 1,
    			  value: widthVal, //get value from Layer State object 
    			  slide: function(event, ui) {
    			  		jQuery('#sizeText' + tableID + escapedLayerID).text(ui.value + 'px');
              		},
              		stop: function(event, ui){                  				
              			org.OpenGeoPortal.layerState.setState(layerID, {"graphicWidth": ui.value});
              			for (var i in org.OpenGeoPortal.map.getLayersByName(layerID)){
              				org.OpenGeoPortal.map.changeStyle(layerID, dataType);
              			}
              		}
    		  });
    	  	}
		  var opacityControl = jQuery("div.opacityControl");
		  opacityControl.each(function(){
			  jQuery(this).parent().hover(function(){org.OpenGeoPortal.ui.openControl(this);}, function(){org.OpenGeoPortal.ui.closeControl(this);});
		  });
		  //retrieve opacity if it has been defined
		  //opacity control ID must also reference the tablename
		  var opacityVal = org.OpenGeoPortal.layerState.getState(layerID, "opacity");
		  jQuery("#opacity" + tableID + escapedLayerID).slider({
              min: 0,
              max: 100,
              step: 5,
              value: opacityVal, //get value from Layer State object 
              slide: function(event, ui) {
    	  			jQuery('#opacityText' + tableID + escapedLayerID).text(ui.value + '%');
              		for (var i in org.OpenGeoPortal.map.getLayersByName(layerID)){
              			org.OpenGeoPortal.map.getLayersByName(layerID)[0].setOpacity(ui.value * .01);
              		}},
              stop: function(event, ui){                  				
              		org.OpenGeoPortal.layerState.setState(layerID, {"opacity": ui.value});
              		}
		  });
		  if (jQuery(rowNode).hasClass("previewedLayer")){
			  jQuery(rowNode).next().addClass("previewedLayer");
		  }
		  if (jQuery(rowNode).hasClass("row_selected")){
			  jQuery(rowNode).next().addClass("row_selected");
		  }
		  
		jQuery(".previewedLayer").removeClass('previewSeparator');
		jQuery(".previewedLayer").last().addClass('previewSeparator');
        tableObj.fnDraw(false);

		} catch(err){alert(err + " openRow");};
	  };
	  
	  // handles jsonp response from request for metadata call
	  this.showMetadataJsonpSuccess = function(data, contextObj)
	  {
		  var solrResponse = data["response"];
    	  var totalResults = solrResponse["numFound"];
    	  if (totalResults != 1)
    	  {
    		  throw new Error("Request for FGDC returned " + totalResults +".  Exactly 1 was expected.");
    		  return;
    	  }
    	  var doc = solrResponse["docs"][0];  // get the first layer object
    	  var fgdcRawText = doc["FgdcText"];
    	  var layerId = doc["LayerId"][0];
    	  var fgdcText = unescape(fgdcRawText);  // text was escaped on ingest into Solr
    	  var fgdcDocument = jQuery.parseXML(fgdcText);
    	  var xsl = null;
    	  var params = {
    			  url: "FGDC_Classic_for_Web_body.xsl",
    			  async: false,
    			  context: contextObj,
    			  dataType: 'xml',
    			  success: function(data){xsl = data;}
    	  };
    	  jQuery.ajax(params);
    	  var resultDocument = "";
    	  if (xsl != null){
    		  if (jQuery.browser.msie){
    			  resultDocument=fgdcDocument.transformNode(xsl);
    		  } else {
    			  var xsltProcessor = new XSLTProcessor();
    			  xsltProcessor.importStylesheet(xsl);
    			  resultDocument = xsltProcessor.transformToFragment(fgdcDocument, document);
    		  }
    	  }
    	  if (typeof jQuery('#metadataDialog')[0] == 'undefined'){
    		  var dialogDiv = '<div id="metadataDialog" class="dialog"> \n';
    		  dialogDiv += '</div> \n';
    		  jQuery('body').append(dialogDiv);
    	  }
    	  var downloadButton = '<span class="styledButton" id="metadataDownloadButton">Download Metadata (XML)</span>';
    	  //jQuery('#metadataDialog').width("550");
    	  var metadataDialog = jQuery("#metadataDialog");
    	  metadataDialog.html(resultDocument);
    	  metadataDialog.prepend(downloadButton);
    	  metadataDialog.dialog({ zIndex: 9999, width: 560, height: 400, title: "<div title='Layer ID: " + layerId + "'>FGDC METADATA</div>" });  
    	  metadataDialog[0].scrollTop = 0;
    	  metadataDialog.dialog("open");
    	  metadataDialog.find("a").click(function(event){
  			var toID = jQuery(this).attr("href");
  			if (toID.indexOf("#") == 0){
  				event.preventDefault();
    			//parse the hrefs for the anchors in this DOM element into toID
  				//xsl uses names instead of ids; yuck
  				toID = toID.substring(1);
    			metadataDialog.scrollTo(jQuery('[name="' + toID + '"]'));
  			}
    		});
    	  jQuery("#metadataDownloadButton").unbind();
    	  var iframeSource = "getMetadata?download=true&id=" + layerId;
    	  var downloadFunction = function(){
        	  if (typeof jQuery('#metadataDownloadIframe')[0] == 'undefined'){
        		  var downloadIframe = '<iframe id="metadataDownloadIframe" src="' + iframeSource + '"> \n';
        		  jQuery("#metadataDialog").append(downloadIframe);
        	  } else {
        		  jQuery("#metadataDownloadIframe").attr("src", iframeSource); 
        	  }
    	  };
    	  jQuery("#metadataDownloadButton").bind("click", downloadFunction);
	  };
	  
	  this.downloadMetadata = function downloadMetadata(event){
		  var layerId = event.data.layerId;
			var params = {
					url: "getMetadata?download=true&id=" + layerId,
					dataType: 'xml',
					success: function(data){
						jQuery(document).append(data);
					}
				  };
				jQuery.ajax(params);
		};
	  // handles jsonp response from request for metadata call
	  this.showMetadataJsonpError = function()
	  {
		  throw new Error("The attempt to retrieve FGDC layer information failed.");
	  };
	  
	  
	  // obtain layer's metadata via jsonp call
	  this.showMetadataJsonp = function(thisObj)
	  {
		  var tableElement = jQuery(thisObj).parents('tr').last();
          var tableObj = tableElement.parent().parent().dataTable();	
		  //Get the position of the current data from the node 
          var aPos = tableObj.fnGetPosition( tableElement[0] );
          //Get the data array for this row
          var aData = tableObj.fnGetData(aPos);
          //make an ajax call to retrieve metadata
          var layerId = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
          var solr = new org.OpenGeoPortal.Solr();
      	  var query = solr.getMetadataQuery(layerId);
      	  solr.sendToSolr(query, this.showMetadataJsonpSuccess, this.showMetadataJsonpError, this);
	  };	
	  
	  
		//*******Search Results only
	  //saveLayer or previewLayer add a layer to the layerState obj, if it is not there.
	  //click-handler for save column
	  this.saveLayer = function(thisObj, row){
		  	var tableObj = this.getTableObj();	         
	        //Get the data array for this row 
	      	var aData = tableObj.fnGetData( row );
	      	var layerID = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
	      	var layerState = org.OpenGeoPortal.layerState;
      	    if (!layerState.layerStateDefined(layerID)){
      	    	var dataType = aData[this.tableHeadingsObj.getColumnIndex("DataType")];
	    	    layerState.addNewLayer(layerID, {"dataType": dataType});
	      	}
	      	if (jQuery(thisObj).is(":checked")){
	      		var previewControl = jQuery(aData[this.tableHeadingsObj.getColumnIndex("View")]);
	      		if (previewControl.is("img")){
	      			if (previewControl.hasClass("loginButton")){
		      			org.OpenGeoPortal.ui.authenticationWarning(thisObj, aData, true);
	      			} else {
		      			org.OpenGeoPortal.ui.authenticationWarning(thisObj, aData, false);
	      			}
	      		} else {
	      			this.addToCart(thisObj, aData);
	      		}
	      	} else {
	      		this.removeFromCart(layerID);
	      		org.OpenGeoPortal.ui.initSortable();
	   		}
	  };

	  this.addToCart = function(thisObj, aData){
	      	var layerState = org.OpenGeoPortal.layerState;
	      	var layerID = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
    		var options = { to: "#savedLayersNumberTab", className: "ui-effects-transfer"};
      		var savedTable = org.OpenGeoPortal.cartTableObj.getTableObj();
     		var currentData = savedTable.fnGetData();
      		var expandIndex = this.tableHeadingsObj.getColumnIndex("expandControls");
      		aData[expandIndex] = aData[expandIndex].replace("org.OpenGeoPortal.resultsTableObj", "org.OpenGeoPortal.cartTableObj");
      		aData = [aData];
      		var newData = aData.concat(currentData);
      		savedTable.fnClearTable();
      		savedTable.fnAddData(newData);
      		layerState.setState(layerID, {"inCart": true});
			jQuery(thisObj).closest('tr').effect( "transfer", options, 500, function(){
				org.OpenGeoPortal.ui.updateSavedLayersNumber();
			});
      		org.OpenGeoPortal.ui.initSortable();
      		if (typeof _gaq != "undefined")
      			_gaq.push(["_trackEvent", "cartOperation", "add"]);
	  };
	  
	  this.previewedLayers = org.OpenGeoPortal.PreviewedLayers;
	 
	  this.addToPreviewedLayers = function(tableRow){
		  var tableObj = this.getTableObj();
          var rowData = tableObj.fnGetData(tableRow[0]);
		this.previewedLayers.addLayer(rowData);
		function callback() {
			if (that.getTableID() == "searchResults"){
			tableObj.fnDeleteRow(tableRow[0], false);
			var tableData = tableObj.fnGetData();
			tableObj.fnClearTable();
			tableData.unshift(rowData);
			tableObj.fnAddData(tableData);
			var rowOne = tableObj.fnGetNodes(0);
	        var layerState = org.OpenGeoPortal.layerState;
        	if (typeof layerState.previewCount == "undefined"){
        		jQuery(rowOne).find('img').first().trigger('click');
        		layerState.previewCount = true;
       		} else {
       			that.callbackExpand();
       		}
			jQuery(".previewedLayer").removeClass('previewSeparator');
			jQuery(".previewedLayer").last().addClass('previewSeparator');
			tableObj.fnDraw();
			} else if (that.getTableID() == "savedLayers"){
				//this is a little kludgey
				org.OpenGeoPortal.ui.previousExtent = "";
			}
		};
		var rowOne = tableObj.fnGetNodes(0);
		var	options = { to: rowOne, 
				className: "ui-effects-transfer"};
		jQuery(tableRow[0]).effect( "transfer", options, 250, callback);

	  };
	  
	  this.removeFromPreviewedLayers = function(matchValue, matchIndex){
		 this.previewedLayers.removeLayer(matchValue, matchIndex);
	  };
	  //click-handler for preview column
	  this.previewLayer = function(thisObj){
		  //debug
		  //try{
		  	var tableElement = jQuery(thisObj).closest('tr');
	        var tableObj = this.getTableObj();	 
	        var showLayerText = "Preview layer on the map";
	        var hideLayerText = "Turn off layer preview on the map";
	        var layerState = org.OpenGeoPortal.layerState;
	        if (jQuery(thisObj).is(':checked')){
	            //check the state obj to see if we need to do anything to the layer
	            //Get the data array for this row
	            var aData = tableObj.fnGetData(tableElement[0]);
	            //our layer id is being used as the openlayers layer name
	            var layerID = aData[this.tableHeadingsObj.getColumnIndex("LayerId")];
      	    	var dataType = aData[this.tableHeadingsObj.getColumnIndex("DataType")];
            	var access = aData[this.tableHeadingsObj.getColumnIndex("Access")];
            	var institution = aData[this.tableHeadingsObj.getColumnIndex("Institution")];
            	var location = jQuery.parseJSON(aData[this.tableHeadingsObj.getColumnIndex("Location")]);
            	var georeferenced = aData[this.tableHeadingsObj.getColumnIndex("GeoReferenced")];

            	//check for a proxy here
            	var proxy = org.OpenGeoPortal.InstitutionInfo.getWMSProxy(institution, access);
            	if (proxy){
            		location.wmsProxy = proxy;
            	}
	      	    if (!layerState.layerStateDefined(layerID)){
	    	        layerState.addNewLayer(layerID, {"dataType": dataType});
	    	        layerState.setState(layerID, {"location": location});
	      	    }
	            //check to see if layer is on openlayers map, if so, show layer
	            var opacitySetting = layerState.getState(layerID, "opacity");
	            if (org.OpenGeoPortal.map.getLayersByName(layerID)[0]){
	            	org.OpenGeoPortal.map.showLayer(layerID);
	            	org.OpenGeoPortal.map.getLayersByName(layerID)[0].setOpacity(opacitySetting * .01);
		            jQuery(thisObj).attr('title', hideLayerText);
		            layerState.setState(layerID, {"preview": "on"});
	            } else{
	            	//use switching logic here to allow other types of layer preview besides wms

	            	var minLatitude = aData[this.tableHeadingsObj.getColumnIndex("MinY")];
	            	var maxLatitude = aData[this.tableHeadingsObj.getColumnIndex("MaxY")];
	            	var minLongitude = aData[this.tableHeadingsObj.getColumnIndex("MinX")];
	            	var maxLongitude = aData[this.tableHeadingsObj.getColumnIndex("MaxX")];
	            	var layerName = aData[this.tableHeadingsObj.getColumnIndex("Name")];
	            	var wmsNamespace = aData[this.tableHeadingsObj.getColumnIndex("WorkspaceName")];
	            	/*if (!georeferenced){
	            		//code to handle ungeoreferenced layers
	            	}*/
	            	
	            	if (typeof location.wms != "undefined"){
	            		if ((wmsNamespace.length > 0)
	            				&&(layerName.indexOf(":") == -1)){
	            			layerName = wmsNamespace + ":" + layerName;
	            		};
	            		org.OpenGeoPortal.map.addWMSLayer({"institution": institution, "layerName": layerName, "title": layerID, 
	            			"west": minLongitude, "south": minLatitude, "east": maxLongitude, "north": maxLatitude, 
	            			"dataType": dataType, "opacity": opacitySetting *.01, "access": access, "location": location});
	            		//this should be triggered when layer load is complete
	            		jQuery(thisObj).attr('title', hideLayerText);
	            		layerState.setState(layerID, {"preview": "on", "dataType": dataType, "wmsName": layerName});
	            	} else {
	            		throw new Exception("This layer is currently not previewable.");
	            	}
	            }
	            this.addToPreviewedLayers(tableElement);
	            //console.log(this);
	        } else {
	        	try {
	        		//Get the data array for this row
	        		var aData = tableObj.fnGetData(tableElement[0]);
	        		var index = this.tableHeadingsObj.getColumnIndex("LayerId");
	        		var layerID = aData[index];
	        		//layer id is being used as the openlayers layer name
	        		org.OpenGeoPortal.map.hideLayer(layerID);
	        		jQuery(thisObj).attr('title', showLayerText);
	        		layerState.setState(layerID, {"preview": "off"});
	       		 	this.previewedLayers.removeLayer(layerID, index);
	        	} catch (err) {new org.OpenGeoPortal.ErrorObject(err, "Error turning off preview.");};

	        }
      	//} catch (err) {new org.OpenGeoPortal.ErrorObject(err, "");};
	  };
	  
	  this.removeFromCart = function(layerID){
		  var index = this.tableHeadingsObj.getColumnIndex("LayerId");
		  var cartDataTable = jQuery('#savedLayers').dataTable();
		  jQuery('#savedLayers > tbody > tr').each(function(){
			  try{
				var currentLayerID = cartDataTable.fnGetData(this)[index];
			  } 
			  catch(err) {return true;}
			  
				if (currentLayerID == layerID){
					//close tool row if open
					org.OpenGeoPortal.cartTableObj.closeToolBar(this);
					org.OpenGeoPortal.layerState.setState(layerID, {"inCart": false});
					cartDataTable.fnDeleteRow(this);
					org.OpenGeoPortal.ui.updateSavedLayersNumber();
					return true;
				}
			});
    		if (typeof _gaq != "undefined")
      			_gaq.push(["_trackEvent", "cartOperation", "remove"]);
	  };
	  
	  this.removeRows = function(){
		  var index = this.tableHeadingsObj.getColumnIndex("LayerId");
		  jQuery('#savedLayersTable td.colChkBoxes :checked').each(function(){
				var rowObj = jQuery(this).parentsUntil('tr').last().parent();
				var layerID = jQuery('#savedLayers').dataTable().fnGetData(rowObj[0])[index];
				org.OpenGeoPortal.layerState.setState(layerID, {"inCart": false});
				jQuery('#savedLayers').dataTable().fnDeleteRow(rowObj[0]);
			});
			org.OpenGeoPortal.ui.updateSavedLayersNumber();
			//update layer state, synchronize save icons
		};
	  
	//maps returned data type to appropriate image
	  this.getTypeIcon = function (rowObj){
		  var typeIcon = {
				  "Point": '<img class="typeIcon" src="media/type_dot.png" alt="Point" title="point"/>',
				  "Line": '<img class="typeIcon" src="media/type_arc.png" alt="Line" title="line" />',
				  "Polygon": '<img class="typeIcon" src="media/type_polygon.png" alt="Polygon" title="polygon" />',
				  "Raster": '<img class="typeIcon" src="media/type_raster.png" alt="Raster" title="raster" />',
				  "Paper Map": '<img class="typeIcon" src="media/type_map.png" alt="Scanned Map" title="scanned map" />'
		  };
		  if (typeof typeIcon[rowObj.aData[that.tableHeadingsObj.getColumnIndex("DataType")]] == 'undefined'){
			  return '?';
		  } else {
			  return typeIcon[rowObj.aData[that.tableHeadingsObj.getColumnIndex("DataType")]];
		  }
	  };
	  
	  this.getExpandIcon = function (rowObj){
		  var context = this.getContextAsString();
		  var layerID = this.getLayerIdFromRow(rowObj);
	      var layerExpanded = this.tableLayerState.getState(layerID, "expanded");
	      if (layerExpanded){
	    	  return '<img class="expandIcon button" src="media/arrow_down.png" onclick="' + context + '.expandableRow(this)" class="button" title="Hide preview controls" alt="Hide preview controls" />';
	      } else {
	    	  return '<img class="expandIcon button" src="media/arrow_right.png" onclick="' + context + '.expandableRow(this)" class="button" title="Show preview controls" alt="Show preview controls" />';
	      }
	  };
	  
	  //*******Cart only
	  this.getDownloadControl = function (rowObj){
		  return '<input type="checkbox" class="cartCheckBox" checked />';
	  };

	  //*******Search Results only
	  this.getSaveControl = function (rowObj){
		  var context = this.getContextAsString();
		  var layerID = this.getLayerIdFromRow(rowObj);
		  var stateVal = org.OpenGeoPortal.layerState.getState(layerID, "inCart");
		  if (typeof stateVal == 'undefined'){
			  stateVal = false;
		  }
		  var rowNum = rowObj.iDataRow;
		  if (stateVal == true){
			  return '<input type="checkbox" onclick="' + context + '.saveLayer(this, ' + rowNum + ')" alt="Save" class="tableCheckBox saveControl" title="Remove this layer from your cart." checked=true />';
		  } else {
			  return '<input type="checkbox" onclick="' + context + '.saveLayer(this, ' + rowNum + ')" alt="Save" class="tableCheckBox saveControl" title="Add this layer to your cart for download." />';
		  }  
	  };
	  
	  this.getContextAsString = function(){
		  var tableID = this.getTableID();
		  var context;
		  if (tableID == 'searchResults'){
			  context = 'org.OpenGeoPortal.resultsTableObj';
		  } else if (tableID ='savedLayers'){
			  context = 'org.OpenGeoPortal.cartTableObj';
		  } else {
			  throw new Error("Could not set context.");
		  }
		  return context;
	  };
	  
	  this.getPreviewControl = function (rowObj){
		  //must maintain state, calculate icon based on access & source
		  //needs to poll the layer state object
      	//our layer id is being used as the openlayers layer name
		  var layerAccess = rowObj.aData[this.tableHeadingsObj.getColumnIndex("Access")];
		  if (layerAccess == "Public"){
			  return this.getActivePreviewControl(rowObj);			  
		  } else {
			  var homeInstitution = org.OpenGeoPortal.InstitutionInfo.getHomeInstitution();
			  var layerSource = rowObj.aData[this.tableHeadingsObj.getColumnIndex("Institution")];
			  if (layerSource == homeInstitution){
				  var locallyAuthenticated = false;
				  if (org.OpenGeoPortal.ui.userId !== null){
					  locallyAuthenticated = true;
				  }
				  if (locallyAuthenticated){
					  return this.getActivePreviewControl(rowObj);
				  } else {
					  return this.getLoginPreviewControl(rowObj);
				  }
			  } else {
				  return this.getExternalPreviewControl(rowObj);
			  }
		  }
	  };
	  
	  this.getExternalPreviewControl = function(rowObj){
		  //what defines external?
		  var imgSource = "media/view_external.png";
		  var layerSource = rowObj.aData[this.tableHeadingsObj.getColumnIndex("Institution")];
		  var imgText = "Click to go to " + layerSource;
		 // previewControl = '<img class="button" onclick="' + context + '.previewLayer(this)" src="' + imgSource + '" title="' + imgText + '" />';
		  var previewControl = '<img class="button goExternalButton" src="' + imgSource + '" title="' + imgText + '" ';//open sharecart link in new tab
		  //temporary...
		  var path = "";
		  if (layerSource == "Harvard"){
			  path = "http://hgl.hul.harvard.edu/opengeoportal";
			  var shareLink = path + "/openGeoPortalHome.jsp";
			  var layerID = this.getLayerIdFromRow(rowObj);
			  var geodeticBbox = org.OpenGeoPortal.map.getGeodeticExtent();
			  var queryString = '?' + jQuery.param({ layer: layerID, minX: geodeticBbox.left, minY: geodeticBbox.bottom, maxX: geodeticBbox.right, maxY: geodeticBbox.top });
			  shareLink += queryString;
			  previewControl += 'onclick="window.open(\'' + shareLink + '\');return false;"';
		  }
		  previewControl += '/>';
		  return previewControl;
	  };
	  
	  this.getLoginPreviewControl = function(rowObj){
		  var imgSource = "media/view_login.png";
		  //var homeInstitution = org.OpenGeoPortal.InstitutionInfo.getHomeInstitution();
		  var layerSource = rowObj.aData[this.tableHeadingsObj.getColumnIndex("Institution")];
		  var imgText = "Login to " + layerSource + " to access this layer";
		  //var previewControl = '<img class="button loginButton" onclick="org.OpenGeoPortal.ui.loginDialog()" src="' + imgSource + '" title="' + imgText + '" />';
		  var previewControl = '<img class="button loginButton login" src="' + imgSource + '" title="' + imgText + '" />';
		  return previewControl;
	  };
	  
	  this.loginHandler = function(){
		  jQuery(document).undelegate(".login");
		  
		  jQuery(document).delegate(".loginButton", "click.login",function(e){org.OpenGeoPortal.ui.promptLogin(e);}); 
			  //$(elements).delegate(selector, events, data, handler);  // jQuery 1.4.3+
	  };
	  
	  this.getActivePreviewControl = function(rowObj){
		  var layerID = this.getLayerIdFromRow(rowObj);
		  var context = this.getContextAsString();
		  var stateVal = org.OpenGeoPortal.layerState.getState(layerID, "preview");
		  var previewControl = "";

		  switch (stateVal){
		  	case "off":
		  		var controlText = "Preview layer on the map";
				previewControl = '<input type="checkbox" onclick="' + context + '.previewLayer(this)"';
				previewControl += ' alt="' + controlText + '" class="tableCheckBox previewControl" title="' + controlText + '" />';
		  		break;
		  	case "on":
		  		var controlText = "Turn off layer preview on the map";
				previewControl = '<input type="checkbox" onclick="' + context + '.previewLayer(this)"';
				previewControl += ' alt="' + controlText + '" class="tableCheckBox previewControl" title="' + controlText + '" checked=true />';
		  		break;
		  	default:
		  		break;
		  }
		  return previewControl;
	  };
	  
	  //maps returned source type to appropriate image
	  this.getSourceIcon = function(rowObj){
		  var institution = rowObj.aData[that.tableHeadingsObj.getColumnIndex("Institution")];
		  var institutionInfo = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
		  if (institution.length == 0){
			  return;
		  }
		  if (typeof institutionInfo[institution] == 'undefined'){
			  return '?';
		  } else if (typeof institutionInfo[institution].graphics == 'undefined'){
			  return '?';
		  } else if (typeof institutionInfo[institution].graphics.sourceIcon == 'undefined'){
			  return '?';
		  } else {
			  var iconInfo = institutionInfo[institution].graphics.sourceIcon;
			  return '<img alt="' + iconInfo.altDisplay + '" src="' + iconInfo.resourceLocation + '" title="' + iconInfo.tooltipText + '" />';
		  }
	  };
	  
	  this.getMetadataIcon = function(rowObj){
		  var context = this.getContextAsString();
		  return '<img src="media/icon_meta.png" title="show metadata" class="button metadataButton" onclick="' + context + '.showMetadataJsonp(this)" />';
	  };
	  
	  //callback to keep 'expanded' state on table reloads
	  //this can't be done with a draw table callback, because the open row function redraws
	  this.callbackExpand = function(){
		  var that = this;
		  var targetTableID = this.getTableID();
		  jQuery('#' + targetTableID + ' .colExpand').find('img').each(function(){
			  var imgVal = jQuery(this).attr('src');
			  var imgOpened = "media/arrow_down.png";
			  var imgClosed = "media/arrow_right.png";
			  if (imgVal == imgOpened){
				  var tableObj = that.getTableObj();
				  //var aPos = tableObj.fnGetPosition(jQuery(this).closest("tr")[0]);
				  var aData = tableObj.fnGetData(jQuery(this).closest("tr")[0]);
				  var layerID = aData[that.tableHeadingsObj.getColumnIndex("LayerId")];
				  if (layerID.length == 0){
					  return true;
				  }
				  var stateVal = that.tableLayerState.getState(layerID, "expanded");
				  if (stateVal === true){
					  that.expandableRow(this);
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
		  var tableID = this.getTableID();
		  jQuery('#' + tableID + ' .' + columnClass).each(function(){
			var currentNode = jQuery(this);
			if (this.tagName == 'TD'){
				currentNode.attr('title', currentNode.text());
				if (columnClass == 'colTitle'){
					var expandNode = currentNode.siblings('.colExpand').find("img");
					currentNode.unbind('click');
					currentNode.bind('click', function(){
						that.expandableRow(expandNode[0]);
					});
				}
			} 
		  });  
	  };
	  
	  this.createHeaderTooltips = function(){
		  jQuery("th.colType").attr('title', "point, line, polygon, raster");
		  jQuery("th.colSource").attr('title', "Source repository");
	  };
	  
	  this.createSortGraphics = function(){
		  var tableID = this.getTableID();
		  var that = this;
		  jQuery('#' + tableID + ' > thead > tr > th').each(function(){
			  var innerThis = jQuery(this);
			  var organize = that.tableOrganize.getState();
			  for (var heading in that.tableHeadingsObj.getTableHeadings()){
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
	  
	  this.getVisibleColumns = function(){
		//returns an array of column keys visible on the page
		var arrReturn = new Array;
		//should get this from dataTable object
		var visibleTable = this.getTableID();
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
	  
	  this.createTooltips = function(){
		  var arrColumns = this.getVisibleColumns();
		  for (var i in arrColumns){
			  var currentHeading = this.tableHeadingsObj.getTableHeadings()[arrColumns[i]];
			  if (currentHeading.resizable){
				  this.createSimpleTooltip(currentHeading.columnConfig.sClass);
			  }
		  }
		  this.createHeaderTooltips();
	  };
	  
		//*******Search Results only
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
	  
	  this.markPreviewedLayers = function(){
		  var tableID = this.getTableID();
		  if (tableID = "searchResults"){
			  var checked = jQuery('#' + tableID + ' .colPreview input:checked');
			  //console.log(checked);
			  checked.closest('tr').addClass('previewedLayer'); 
			  jQuery(".previewedLayer").removeClass('previewSeparator');
			  jQuery(".previewedLayer").last().addClass('previewSeparator');
		  }
	  };
		//*******Search Results only
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
				  var headingsObj = that.tableHeadingsObj.getTableHeadings();
				  for (var heading in headingsObj){
					  if (title == that.tableHeadingsObj.getValue(heading, "sTitle")){
						  that.sortColumns(heading, true);
						  return;
					  }
				  }
			  }); 
		  });
	  };

    
    this.getEmptyTableMessage = function getEmptyTableMessage(){
    	var tableID = this.getTableID();
    	if (tableID == "savedLayers"){
    		return "No data layers have been added to the cart.";
    	} else  {
    		return "";
    	}
    };
	//*******Search Results only

    this.displayedLayers = {"startIndex": 0, "numberOfLayers": 0, "totalResults": 0};
	this.getNumberOfLayers = function(){
		//we want to use the dataTables paging as a buffer, so that collapsing
		//the search box or expanding preview controls does not require a new ajax call
		//get active tab
		var divID = this.getTableDiv();
		var totalHeight = jQuery('#container').height();
		var searchHeight = 0;
		jQuery('#basicSearchDiv > div').each(function(){
			var currentDiv = jQuery(this);
			if (currentDiv.attr('id') != divID){
				if (currentDiv.hasClass('searchBox')){
					if (currentDiv.css('display') == 'none'){
						searchHeight = 0;
					} else {
						searchHeight = currentDiv.height() + parseFloat(currentDiv.css("padding-top")) + parseFloat(currentDiv.css("padding-bottom"));
					}
					totalHeight -= searchHeight;
				} else {
					if ((currentDiv.css('display') != 'none')&&(currentDiv.attr('id') != 'searchResultsMessage')){
						totalHeight -= currentDiv.height();
					}
				}
			}
		});
		var headerRowHeight = jQuery('#' + divID + ' table.display > thead > tr').height();
		totalHeight -= headerRowHeight;

		totalHeight -= jQuery("#searchResultsNavigation").height() || 0;

		var heightObj = {};
		var searchRowHeight = jQuery('#' + divID + ' table.display > tbody > tr').height() || 23;
		var controlRowHeight = jQuery('#' + divID + ' .previewControls').closest("tr").height() || 23;
		heightObj.rows = totalHeight / searchRowHeight;
		heightObj.buffer = searchHeight / searchRowHeight + heightObj.rows;
		var controlAdjust = jQuery('#' + divID + ' .previewControls').length * controlRowHeight / searchRowHeight;
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
    
    this.layersToDisplay;
    this.processData = function(dataObj){
    	// dataObj is a Javascript object (usually) returned by Solr
    	var solrResponse = dataObj["response"];
    	var totalResults = solrResponse["numFound"];
    	var startIndex = solrResponse["start"];
    	this.layersToDisplay = this.getNumberOfLayers();
    	this.displayedLayers.startIndex = parseInt(startIndex);
    	this.displayedLayers.totalResults = parseInt(totalResults);
    	// solr docs holds an array of hashtables, each hashtable contains a layer
    	var solrLayers = solrResponse["docs"];
    	var arrData = [];

    	// loop over all the returned layers
    	var tableHeadings = this.tableHeadingsObj.getTableHeadings();
    	var previewedRows = this.previewedLayers.getLayers();
    	var layerIDIndex = this.tableHeadingsObj.getColumnIndex("LayerId");
    	rowloop:
    	for (var j in solrLayers){
    		var arrRow = [];
    			for (var k in tableHeadings){
    				//skip over layers that are currently previewed, so that they don't appear multiple times
    				if (k == "LayerId"){
    					for (var rowIndex in previewedRows){
    						if (solrLayers[j][k] == previewedRows[rowIndex][layerIDIndex]){
    							continue rowloop;
    						}
    					}
    				}
    				//columns w/ ajax == true should be populated with the returned solr data
    				if (tableHeadings[k].ajax) {
    					//if the tableheading can't be found in the solr object put in an empty string as a placeholder
    					if (typeof solrLayers[j][k] == 'undefined'){
    						arrRow.push("");
    					} else {
    						if (solrLayers[j][k].constructor !== Array){
    							arrRow.push(solrLayers[j][k]);
    						} else {
    							arrRow.push(solrLayers[j][k][0]);//in case we want to pass an array in the results
    						}
    					}
    				} else {
    					//columns w/ ajax == false are placeholders and are populated by javascript
    					arrRow.push('');
    				}
    			}
    			arrData.push(arrRow); 
    	}
    	return arrData;
    };

	
	//**************Table Specific
	this.numberOfResults = function(){
		var tableName = this.getTableID();
		var number;
		if (tableName == 'savedLayers'){
			number = this.getTableObj().fnSettings().fnRecordsTotal();
		} else {
			number = totalResults;
		}

		return number;
	};
	
	//this function should fill the table w/ data and do some other housekeeping
	this.populate = function(dataObj){
		// dataObj is a Javascript object expected by dataTables
		this.getTableObj().fnClearTable();
		//console.log(arrData);
		//prepend the data array going to the table with previewed layers
		var previewedItems = this.previewedLayers.getLayers();
		for (var layerIndex in previewedItems){
			dataObj.splice(layerIndex, 0, previewedItems[layerIndex]);
		}
		this.getTableObj().fnAddData(dataObj);
		this.setTableLength();
		this.headerSort();
		this.callbackExpand();
	};
	
	//*******Search Results only
	this.searchRequestJsonpSuccess = function(data)
	{
		//console.log(data);
		org.OpenGeoPortal.ui.showSearchResults();
		that.populate(that.processData(data));	
	    that.tableEffect("searchEnd");
	    that.setResultNumber(data.response.numFound);
	};
	//*******Search Results only
	this.searchRequestJsonpError = function()
	{
	    that.tableEffect("searchEnd");
		//throw new Error("The search for relevant layers failed");
	};
	//*******Search Results only
	
	//this.currentSolrObjects = [];
	/**
	 * this function returns a solr object with the many standard options set
	 * it provides a base solr object for both basic and advanced searching
	 * @param startIndex
	 * @return
	 */
	this.getBaseSearchRequestJsonp = function(startIndex)
	{
		var rows = this.getNumberOfLayers().buffer;
		/*while (this.currentSolrObjects.length > 0){
			var currentObject = this.currentSolrObjects.pop();
			console.log(currentObject);
		}*/
		var solr = new org.OpenGeoPortal.Solr();
		//this.currentSolrObjects.push(solr);
		solr.RowCount = rows;
		solr.setResultStartRow(startIndex);
		var sortObj = this.tableOrganize.getState();
		var sortColumn = sortObj.organizeBy;
		if ((sortColumn == null) || (sortColumn == "score"))
			sortColumn = "score";
	    else if ((sortColumn == "ContentDate") || (sortColumn == "Access"))
	           sortColumn == sortColumn;  // nothing to do, sortColumn doesn't need adjustment
		else
			sortColumn = sortColumn + "Sort";  // use solr sort column that haven't been tokenized
		solr.setSort(sortColumn, sortObj.organizeDirection);
		if (org.OpenGeoPortal.ui.filterState())
		{
			//make sure we're getting the right values for the extent
			org.OpenGeoPortal.map.updateSize();
			var extent = org.OpenGeoPortal.map.returnExtent();
			var minX = extent.left;
			var maxX = extent.right;
			var minY = extent.bottom;
			var maxY = extent.top;
			solr.setBoundingBox(minX, maxX, minY, maxY);
		}
		return solr;
	};
	//*******Search Results only
	/**
	 * this is the top level solr search function in layertable
	 * it creates a Solr object and initialize it with values from UI elements
	 * then, executes query
	 * @param startIndex
	 * @return
	 */
	this.searchRequestJsonp = function(startIndex)
	{
		var solr = this.getBaseSearchRequestJsonp(startIndex);
		var searchType = org.OpenGeoPortal.Utility.whichSearch().type;
		if (searchType == 'basicSearch')
		{
			this.searchRequestBasicJsonp(solr);
			if (typeof _gaq != 'undefined')
				_gaq.push(["_trackEvent", "search", "basic"]);
		}
		else if (searchType =='advancedSearch')
		{
			this.searchRequestAdvancedJsonp(solr);
			if (typeof _gaq != 'undefined')
				_gaq.push(["_trackEvent", "search", "advanced"]);
		}
		//tempSolr = solr;  // for debugging
		this.setLastSolrSearch(solr);
		solr.executeSearchQuery(this.searchRequestJsonpSuccess, this.searchRequestJsonpError);
	};
	
	// keeping track of the last solr search is useful in multiple cases
	// if a search that filter based on the map returned no results we want to 
	//   re-run the search without the map filter and let user know fi there are results
	// after use login we re-run the test to update "login" buttons on layers
	this.lastSolrSearch = null;
	
	this.setLastSolrSearch = function(solr)
	{
		this.lastSolrSearch = solr;
	};
	
	this.getLastSolrSearch = function()
	{
		return this.lastSolrSearch;
	};
	
	this.rerunLastSearch = function()
	{
		var solr = this.getLastSolrSearch();
		if (solr != null)
			solr.executeSearchQuery(this.searchRequestJsonpSuccess, this.searchRequestJsonpError);
	};
	
	/**
	 * called when the last search returned no results
	 *  we rerun the last search without a spatial constraint
	 *  if this search returns hits, we let the user know there is data outside the map
	 * note that this function changes the value returned by "getLastSolrSearch()"
	 * @return
	 */
	this.addSpatialToEmptySearchMessage = function()
	{
		var solr = this.getLastSolrSearch();
		if (solr != null)
		{
			solr.clearBoundingBox();
			solr.executeSearchQuery(this.emptySearchMessageHandler, this.searchRequestJsonpError);
		}
		
	};
	
	/**
	 * message handler for addSpatialToEmptySearchMessage
	 * tell user how many search results are available if they turn off the map constraint 
	 * @param data
	 * @return
	 */
	this.emptySearchMessageHandler = function(data)
	{
		var numberOfResults = data.response.numFound;
		if (numberOfResults > 0)
		{
			var result = "results lie";
			if (numberOfResults == 1)
				result = "result lies";
			var initialMessage = "<p>No results were found for the terms specified.</p><p>Search results are currently limited to the visible map area.</p>";
			//  Zoom or pan the map to find data layers. </p>";
			//var initialMessage = ""; //jQuery('#searchResultsMessage').html(); //(resultsMessage);
			jQuery('#searchResultsMessage').html(initialMessage + "  " + numberOfResults + " " + result + " outside the current map area.");
		}
	};
	
	
	//*******Search Results only
	/**
	 * add elements specific to basic search
	 */
	this.searchRequestBasicJsonp = function(solr)
	{
		var keywords = jQuery('#basicSearchTextField').val().trim();
		
		if ((keywords != null) && (keywords != ""))
			solr.setBasicKeywords(keywords);
    	solr.setLocalRestricted(org.OpenGeoPortal.InstitutionInfo.getHomeInstitution());
    	var institutionConfig = org.OpenGeoPortal.InstitutionInfo.getInstitutionInfo();
    	for (var institution in institutionConfig){
			solr.addInstitution(institution);
    	}
    	
	};
	//*******Search Results only
	/**
	 * add elements specific to advanced
	 */
	this.searchRequestAdvancedJsonp = function(solr)
	{
		var keywords = jQuery('#advancedKeywordText').val().trim();
		if ((keywords != null) && (keywords != ""))
			solr.setAdvancedKeywords(keywords);
		var fromDate = jQuery('#advancedDateFromText').val().trim();
		var toDate = jQuery('#advancedDateToText').val().trim();
		solr.setDates(fromDate, toDate);
		jQuery(".dataTypeCheck").each(function(){
			if(jQuery(this).is(":checked")){
				solr.addDataType(jQuery(this).val());
			}
		});
		jQuery(".sourceCheck").each(function(){
					if(jQuery(this).is(":checked")){
						solr.addInstitution(jQuery(this).val());
					}
				});
		//var showRestricted = jQuery("#restrictedCheck").is(":checked");
		//if (!showRestricted){
		//	solr.setAccessDisplay("Public");
		//}
	    var allRestricted = jQuery("#restrictedCheck").is(":checked");
	    if (allRestricted)
	    	solr.setAllRestricted();
	    else
	    	solr.setLocalRestricted(org.OpenGeoPortal.InstitutionInfo.getHomeInstitution());
	    
		var publisher = jQuery('#advancedOriginatorText').val().trim();
	    solr.setPublisher(publisher);

	    var topicsElement = jQuery("input[type=radio][name=topicRadio]");
	    var selectedTopic = topicsElement.filter(":checked").val();
	    // first topic says "Select a topic" 
	    var titleTopic = topicsElement.first().val();
	    if (selectedTopic != titleTopic)
	    {
	    	// here if the user has actually selected a topic from the list
	    	// clean-up UI string and use it for search
	    	selectedTopic = selectedTopic.replace(/,/g, " ");
	    	selectedTopic = selectedTopic.replace(/ and /g, " ");
	    	solr.setTopic(selectedTopic);
	    }

	};
		
	//*******Search Results only
	this.tableEffect = function(status){
		if (status == 'searchStart'){
			jQuery("#searchResults").animate({
				opacity: 0.5
			}, 50);
		} else if (status == 'searchEnd'){
		    jQuery("#searchResults").animate({
    		    opacity: 1
    		  }, 25);
		}
	};
	
	this.setResultNumber = function(numFound){
        jQuery('#' + this.getTableDiv()).parents('.ui-tabs-panel').last().find('.resultsNumber')
		   .text(numFound);
		if (parseInt(numFound) == 0){
			//set some html below the search results table
			var resultsMessage = "<p>No results were found for the terms specified.</p>";
			if (org.OpenGeoPortal.ui.filterState()){
				//resultsMessage += "<p>Search results are currently limited to the visible map area.</p>"; //  Zoom or pan the map to find data layers. </p>";
				this.addSpatialToEmptySearchMessage();
			} else {
				//var resultsMessage = "<p>No results were found for the terms specified.</p>";
			}
			jQuery('#searchResultsMessage').html(resultsMessage);
			jQuery('#searchResultsMessage').css("display", "block");
		} else {
			jQuery('#searchResultsMessage').css("display", "none");
		}
	};
	//*******Search Results only
	this.currentSearchRequests = 0;
	this.searchRequest = function(startIndex){
		//wait a moment before firing search, reset the wait if a new search is fired.
		this.currentSearchRequests++;
		this.deferredSearchSetTimeOut(startIndex);
	};
	
	this.deferredSearchSetTimeOut = function(startIndex){
		var t = setTimeout('org.OpenGeoPortal.resultsTableObj.deferredSearchStart("' + startIndex + '")', 100);
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
		var tableObj = this.getTableObj();
		var currentRows = tableObj.fnSettings()._iDisplayLength;
		tableObj.fnSettings()._iDisplayLength = currentRows + rows;
		tableObj.fnDraw();
	};
	
	this.init = function(){
	    var that = this;
	    //initialize the table
		//test for uniqueness
	   
	    var resultsHTML = '<table id="' + tableName + '" class="display">';
	    resultsHTML += '</table>';
	    jQuery('#' + userDiv).html(resultsHTML);
	    
		var columnDefinitions = [];
		
	    //loop through the array of table headings, create dataTables column defs.
		for (var heading in tableHeadings){
			columnDefinitions.push(this.tableHeadingsObj.getValue(heading, "columnConfig"));
		}
		
		//******************TableSpecific
		//initialize table
		var initData = {"response": {"docs": [{"LayerId": ["0"], "Name":["null"], "Location":[""], "LayerDisplayName":[""], "DataType":[""], 
			"Publisher":[""], "MinY":[1], "MaxY":[1], "MinX":[1], "MaxX":[1], "Access":[""], "Institution":[""], "Availability":[""]}]}};
		var tableData = this.processData(initData);
		
	    //try-catch here...failure to create the table should be a fatal error
	  //table created
		var tableObj = jQuery('#' + tableName).dataTable( {
			"iDisplayLength": that.layersToDisplay.buffer, 	//*******Search Results only
			"fnDrawCallback": function(){
					that.wrapCells();
					that.createTooltips();
					that.addColumnResize();
					that.markPreviewedLayers();
					that.loginHandler();
					if (that.getTableID() == "searchResults"){
						that.createSortGraphics();
						that.addPagingUi();  	//*******Search Results only
					}
				},//apply widths in callback?
			"bAutoWidth": false,
			"sDom": 'rt',
			"aaData": tableData,
			"bSort": false,
			"aoColumnDefs": columnDefinitions,
			"oLanguage": {
					"sEmptyTable": that.getEmptyTableMessage()//initialize the empty table message
				}
		});
		tableObj.fnClearTable();
		this.highlightRow();
		//this.selectPreviewedRow();
	};
	
	this.init();

};		



//public
/*
org.OpenGeoPortal.LayerTable.prototype.tableHeadingsObj.getColumnIndex = function(dataKey){
	return this.tableHeadings[dataKey]["columnConfig"]["aTargets"][0];
};
*/

//shows a column in the table, given its name, adds appropriate classes
org.OpenGeoPortal.LayerTable.prototype.showCol = function(columnKey){
	//should update the organize dialog
	//update the tableHeadings object?
	var iCol = this.tableHeadingsObj.getColumnIndex(columnKey);
	var tableObj = this.getTableObj();
	tableObj.fnSetColumnVis( iCol, true);
	//the title & class
	var columnTitle = this.tableHeadingsObj.getValue(columnKey, "sTitle");
	var columnClass = this.tableHeadingsObj.getValue(columnKey, "sClass");
	//add class from tableHeadings to th element (dataTables won't do it)
	var tableID = this.getTableID();
	jQuery('#' + tableID + ' > thead > tr > th').each(function(){
		if (jQuery(this).text() == columnTitle){
			jQuery(this).addClass(columnClass);
			return;
		}
	});
};

//hides a column in the table, given its name
org.OpenGeoPortal.LayerTable.prototype.hideCol = function(columnKey){
	//should update the organize dialog
	var iCol = this.tableHeadingsObj.getColumnIndex(columnKey);
	var tableObj = this.getTableObj();
	tableObj.fnSetColumnVis( iCol, false);
};

org.OpenGeoPortal.LayerTable.prototype.removeExtraColumn = function(){
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

org.OpenGeoPortal.LayerTable.prototype.getResizeInfoFromTitle = function(columnTitle){
	//returns needed info about resizable columns
	var headingsObj = this.tableHeadingsObj;
	var fields = headingsObj.getTableHeadings();
	heading = {};
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
org.OpenGeoPortal.LayerTable.prototype.getNextResizable = function(thisHeadingKey){	
	var headingsObj = this.tableHeadingsObj;
	var currentIndex = headingsObj.getValue(thisHeadingKey, "aTargets")[0];
	var fields = headingsObj.getTableHeadings();
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
org.OpenGeoPortal.LayerTable.prototype.addColumnResize = function(){
	var tableID = this.getTableID();
	var that = this;
	var fieldInfo ={};
	
	//populate fieldInfo with needed info for currently viewable resizable th elements
	var numIndex = 0;
	jQuery('#' + tableID + ' > thead > tr > th').each(function(index, Element){
		var infoFromTitle = that.getResizeInfoFromTitle(jQuery(this).find("." + tableID + "Cell").text());
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
		var resizeSelector = jQuery("th." + columnClass + " > ." + tableID + "Cell");
		resizeSelector.resizable("destroy");
		//if this is the last resizable column, don't add resizable
		if (i >= numIndex){
			return;
		}
		var columnMinWidth = fieldInfo[i].minWidth;
		//next resizable element class
        //var j = parseInt(i) + 1;
        
		resizeSelector.resizable({ minWidth: columnMinWidth, handles: 'e',
			helper: 'ui-resizable-helper', alsoResize: "." + columnClass + " > ." + tableID + "Cell",
			start: function(event, ui){
				var thisColumn = that.getResizeInfoFromTitle(jQuery(event.target).text());
				var thisColumnIndex = that.tableHeadingsObj.getValue(thisColumn.key, "aTargets")[0];
				var tableID = that.getTableID();
				var resizeSelector = jQuery("th." + thisColumn.columnClass + " > ." + tableID + "Cell");
				//that.totalWidth = jQuery(event.target).width() + jQuery('.' + nextColumn.columnClass).width();

			//write width to currentWidth in tableHeadings
				var visibleColumns = that.getVisibleColumns();
				var resizablesWidth = 0;
				for (var index in visibleColumns){
					var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
					var colIndex = that.tableHeadingsObj.getValue(visibleColumns[index], "aTargets")[0];
					var colWidth = jQuery('#' + tableID + ' .' + colClass).width();
					var isResizable = that.tableHeadingsObj.getValue(visibleColumns[index], "resizable");
					//once we know how many resizable columns are on-screen, we know how much width we have to adjust
					//it's a little more complex than this...count only columns that appear after the target column
					if ((isResizable)&&(colIndex >= thisColumnIndex)){
						resizablesWidth += colWidth;
						if (colClass != thisColumn.columnClass){
							resizablesWidth -= that.tableHeadingsObj.getValue(visibleColumns[index], "minWidth");
						}
					}
					//width is set for each visible resizable column so that we have a reliable number to calculate with
					that.tableHeadingsObj.setWidth(visibleColumns[index], colWidth);
				}
				resizeSelector.resizable( "option", "maxWidth", resizablesWidth);

				
			},
			stop: function(event, ui){
				//a correction, in case things go awry
				//write width to currentWidth in tableHeadings
				var visibleColumns = that.getVisibleColumns();
				for (var index in visibleColumns){
					var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
					that.tableHeadingsObj.setWidth(visibleColumns[index], jQuery('#' + tableID + ' .' + colClass).width());
				}
			  	that.sizeCells();
				for (var index in visibleColumns){
					var colClass = that.tableHeadingsObj.getValue(visibleColumns[index], "sClass");
					that.tableHeadingsObj.setWidth(visibleColumns[index], jQuery('#' + tableID + ' .' + colClass).width());
				}
				},
			resize: function(event, ui){
				//add the widths of the resized column plus the next resizable. max width for the current
				//resizable is this total width - the minimum width of the next resizable.  If there is
				//another resizable, then the process can continue.  else it is done
				var thisColumn = that.getResizeInfoFromTitle(jQuery(event.target).text());
				var originalWidth = that.tableHeadingsObj.getWidth(thisColumn.key);
				var currentWidth = jQuery(event.target).width();
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
						var currentColumnObj = jQuery('#' + tableID + ' .' + colClass);
						var currentColumnInnerDiv = currentColumnObj.find("div." + tableID + "Cell");
						var currentColumnWidth = that.tableHeadingsObj.getWidth(visibleColumns[index]);
						var newWidth = currentColumnWidth + widthDelta + carryOver;

						if (newWidth <= currentMinWidth){
							currentColumnObj.width(currentMinWidth);
							currentColumnInnerDiv.width(currentMinWidth);
							carryOver += that.tableHeadingsObj.getWidth(visibleColumns[index]) - currentMinWidth;

						} else {
							//if (colClass == 'colPublisher'){
							//	console.log([currentColumnWidth, widthDelta, carryOver, newWidth]);
							//}
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

//*******Search Results only
org.OpenGeoPortal.LayerTable.prototype.addPagingUi = function()
{
	//unfortunately, startIndex is not static...we must calculate this value each
	//time & we must know how many rows are expanded;  not a big deal for 'next', but how do
	//we handle 'previous'? note..next should be working...still need a fix for previous in the case
	//that a row is expanded
	var pagingDiv = "searchResultsNavigation";
	var prefix = 'org.OpenGeoPortal.resultsTableObj';
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
	
	if (startIndex > 0)
	{
		pagingText = true;
		// here if the page does not hold the first row
		var previousIndex = startIndex - layersDisplayed;
		if (previousIndex < 0){
			previousIndex = 0;
		}
		prevString += "<a href='javascript:" + prefix + ".searchRequest(" + previousIndex + ")'><< Previous |</a>"; 
	} else {
		prevString += '<span style="color:#CCCCCC" ><< Previous |</span>'; 
	}
	
	if ((startIndex + layersDisplayed) < resultsCount)
	{
		pagingText = true;
		// here if this page does not hold the last row
		var nextIndex = startIndex + layersDisplayed;
		nextString += "<a href='javascript:" + prefix + ".searchRequest(" + nextIndex + ")'>| Next >></a>";
	}	else {
		nextString += '<span style="color:#CCCCCC" >| Next >></span>';
	}
	

	resultsString += " Results " + (startIndex + 1) + "-" + (startIndex + layersDisplayed) + " ";

	if (pagingText){
		navigationString = "<span>" + prevString + resultsString + nextString + "</span>";
	} else {
		navigationString = "";
	}

	jQuery("div#" + pagingDiv).html(navigationString);
};


//maintains state for layers, where the state can differ with table instances
//******Table Specific
org.OpenGeoPortal.LayerTable.TableLayerState = function(){
	//{layerID: {key: value}}; currently "expanded" is the only key, value is boolean
	var layersExpandedState = {};
	var tableDefaults = {"expanded": false};
	this.getFeatureTitle = "";
	this.setState = function(layerID, updateObj){

		if (typeof layersExpandedState[layerID] == 'undefined'){
			layersExpandedState[layerID] = {};
			for (var key in tableDefaults){
				layersExpandedState[layerID][key] = tableDefaults[key];
			}
		}
		for (var key in updateObj){ 
			if (typeof tableDefaults[key] == 'undefined'){
				throw new Error('The parameter "' + key + '" cannot be set for tableLayerState.');
			} else {
				layersExpandedState[layerID][key] = updateObj[key];
			}
		}
	};
	
	this.getState = function(layerID, key){
		if (typeof layersExpandedState[layerID] == 'undefined'){
			if (typeof tableDefaults[key] == 'undefined'){
				throw new Error('The parameter "' + key + '" is not applicable to tableLayerState.');
			} else {
				var stateValue = tableDefaults[key];
				return stateValue;
			}
		} else {
			var stateValue = layersExpandedState[layerID][key];
			return stateValue;
		}
	};
};

//object defines the columns and their display properties, holds state information
//write a getter and a setter for this object?
//******Table Specific
org.OpenGeoPortal.LayerTable.TableHeadings = function(thisObj){
	var defaultHeadings = {
			"LayerId": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
				{"sName": "LayerId", "sTitle": "LayerId", "bVisible": false, "aTargets": [ 0 ], "bSortable": false}},
			"checkBox": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "checkBox", "sTitle": "<input type=\"checkbox\" id=\"downloadHeaderCheck\" checked />", "bVisible": false, "aTargets": [ 1 ], "sClass": "colChkBoxes", "sWidth": "21px", "bSortable": false,
							"fnRender": function(oObj){return thisObj.getDownloadControl(oObj);}}},
			"expandControls": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
			            {"sName": "expandControls", "sTitle": "", "bVisible": true, "aTargets": [ 2 ], "sClass": "colExpand", "sWidth": "8px", "bSortable": false,
							"fnRender": function(oObj){return thisObj.getExpandIcon(oObj);}}},  
			"Save": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		                {"sName": "Save", "sTitle": "<img src=\"media/shoppingcart.png\" alt=\"Add to cart\" title=\"Add layers to your cart for download.\" />", "bVisible": true, "aTargets": [ 3 ], "sClass": "colSave", "sWidth": "19px", "bSortable": false,
		              		"fnRender": function(oObj){return thisObj.getSaveControl(oObj);}}},
		    "score": {"ajax": true, "resizable": true, "minWidth": 27, "currentWidth": 27, "organize": true, "displayName": "Relevancy", "columnConfig": 
		                    {"sName": "score", "sTitle": "Relevancy", "bVisible": false, "aTargets": [ 4 ], "sClass": "colScore", "sWidth": "27px", "bSortable": false }},
		     "DataType": {"ajax": true, "resizable": false, "organize": "group", "displayName": "Data Type", "columnConfig": 
		            	{"sName": "DataType", "sTitle": "Type", "bVisible": true, "aTargets": [ 5 ], "sClass": "colType", "sWidth": "24px", "bSortable": false, "bUseRendered": false, 
		            		"fnRender": function(oObj){return thisObj.getTypeIcon(oObj);}}},
		     "Name": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "Name", "sTitle": "LayerName", "bVisible": false, "aTargets": [ 6 ], "bSortable": false}},
		     "LayerDisplayName": {"ajax": true, "resizable": true, "minWidth": 28, "currentWidth": 215, "organize": "alpha", "displayName": "Name", "columnConfig": 
		            	{"sName": "LayerDisplayName", "sTitle": "Name", "bVisible": true, "aTargets": [ 7 ], "sClass": "colTitle", "bSortable": false}}, 
		     "Originator": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 81, "organize": "group", "displayName": "Originator", "columnConfig": 
		            	{"sName": "Originator", "sTitle": "Originator", "bVisible": true, "aTargets": [ 8 ], "sClass": "colOriginator", "bSortable": false}},            	
		     "Publisher": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 80, "organize": "group", "displayName": "Publisher", "columnConfig": 
		            	{"sName": "Publisher", "sTitle": "Publisher", "bVisible": false, "aTargets": [ 9 ], "sClass": "colPublisher", "bSortable": false}},
		     "ContentDate": {"ajax": true, "resizable": false, "organize": "numeric", "displayName": "Date", "columnConfig": 
		            	{"sName": "ContentDate", "sTitle": "Date", "bVisible": false, "aTargets": [ 10 ], "sClass": "colDate", "sWidth": "25px", "bSortable": false, "bUseRendered": true,
		            		"fnRender": function(oObj){return oObj.aData[oObj.iDataColumn].substr(0, 4);}}},
		     "Institution": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Repository", "columnConfig": 
		            	{"sName": "Institution", "sTitle": "Rep", "bVisible": true, "aTargets": [ 11 ], "sClass": "colSource", "sWidth": "19px", "bSortable": false, "bUseRendered": false, 
		            		"fnRender": function(oObj){return thisObj.getSourceIcon(oObj);}}},  
		     "Metadata": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		                {"sName": "Metadata", "sTitle": "<img src=\"media/icon_meta.png\" alt=\"Metadata\" title=\"show metadata\" />", "bVisible": true, "aTargets": [ 12 ], "sClass": "colMetadata", "sWidth": "17px", "bSortable": false, "bUseRendered": false, 
		                 	"fnRender": function(oObj){return thisObj.getMetadataIcon(oObj);}}},       		
		     "Access": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Access", "columnConfig": 
		                 {"sName": "Access", "sTitle": "Access", "bVisible": false, "aTargets": [ 13 ], "sClass": "colAccess", "sWidth": "53px", "bSortable": false}},
		     "View": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "View", "sTitle": "Preview", "bVisible": true, "aTargets": [ 14 ], "sClass": "colPreview", "sWidth": "39px", "bSortable": false,
		            			"fnRender": function(oObj){return thisObj.getPreviewControl(oObj);}}},
		     "Location": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "Location", "sTitle": "WmsURL", "bVisible": false, "aTargets": [ 15 ], "bSortable": false}},
		     "MinY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MinY", "sTitle": "MinLatitude", "bVisible": false, "aTargets": [ 16 ], "bSortable": false}},
		     "MaxY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MaxY", "sTitle": "MaxLatitude", "bVisible": false, "aTargets": [ 17 ], "bSortable": false}},
		     "MinX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MinX", "sTitle": "MinLongitude", "bVisible": false, "aTargets": [ 18 ], "bSortable": false}},
		     "MaxX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "MaxX", "sTitle": "MaxLongitude", "bVisible": false, "aTargets": [ 19 ], "bSortable": false}},
		     "WorkspaceName": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "WorkspaceName", "sTitle": "Workspace Name", "bVisible": false, "aTargets": [ 20 ], "bSortable": false}},
		     "GeoReferenced": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "GeoReferenced", "sTitle": "Georeferenced", "bVisible": false, "aTargets": [ 21 ], "bSortable": false}},
		   	 "SrsProjectionCode": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
		            	{"sName": "SrsProjectionCode", "sTitle": "EPSG Code", "bVisible": false, "aTargets": [ 22 ], "bSortable": false}}
			};
	//this should be a function, so some params can be set on init
	//fnRender functions and targets should be generated on init
	//also currentwidth? or sometime after init
	var headings = defaultHeadings;

	this.getTableHeadings = function(){
		return headings;
	};
	
	this.getValue = function(headingKey, headingParameter){
		if (typeof headings[headingKey] == 'undefined'){
			throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
		}
		if (typeof headings[headingKey][headingParameter] != 'undefined'){
			return headings[headingKey][headingParameter];
		} else if (typeof headings[headingKey]["columnConfig"][headingParameter] != 'undefined'){
			return headings[headingKey]["columnConfig"][headingParameter];
		} else {
			throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
		}
	};
	
	//convenience function for getting the width of a column
	this.getWidth = function(headingKey){
		if (headings[headingKey]["resizable"]){
			return this.getValue(headingKey, "currentWidth");
		} else {
			//this may not be helpful, since sWidth is not really enforceable
			return this.getValue(headingKey, "sWidth");
		}
	};
	
	//only certain parameters should be changeable
	this.setWidth = function(headingKey, newWidth){
		if (typeof headings[headingKey] == 'undefined'){
			throw new Error('The heading key: "' + headingKey + '" is not applicable to the function setWidth');
		}
		currentHeadingObj = headings[headingKey];
		if (currentHeadingObj["resizable"]){
			//should validate newWidth to make sure that it is an appropriate integer
			if (newWidth >= currentHeadingObj["minWidth"]){
				currentHeadingObj["currentWidth"] = newWidth;
			} else {
				currentHeadingObj["currentWidth"] = currentHeadingObj["minWidth"];
			}
			return currentHeadingObj["currentWidth"];
		} else {
			return currentHeadingObj["columnConfig"]["sWidth"];
			//throw new Error('The column "' + headingKey + '" cannot be resized.');
		}
	};
	
	//convenience function
	this.getColumnIndex = function(headingKey){
		return this.getValue(headingKey, "aTargets")[0];
	};
};



org.OpenGeoPortal.PreviewedLayers = {
		layers: [],
		getLayers: function(){
			return this.layers;
		},
		addLayer: function(layer){
			this.layers.unshift(layer);
			return this.layers;
		},
		removeLayer: function(columnValue, columnIndex){
			for (var layerIndex in this.layers){
				if (this.layers[layerIndex][columnIndex] == columnValue){
					this.layers.splice(layerIndex, 1);
	            }
			}
		},
		clearLayers: function(){
			this.layers = [];
		}
};

/*org.OpenGeoPortal.LayerSettings
*	object to hold display setting info, where it exists (opacity, etc.)
*/
org.OpenGeoPortal.LayerSettings = function(){
	var settings = {};
	var that = this;
	this.getGenericDefaults = function(){
		return {"preview": "off", "inCart": false, "dataType": "", "wmsName": ""};
	};
	this.getPointDefaults = function(){
		return {"getFeature": false, "color": "#ff0000", "opacity": 100, "graphicWidth": 2, "sld": ""};
	};
	this.getLineDefaults = function(){
		return {"getFeature": false, "color": "#0000ff", "opacity": 100, "graphicWidth": 1, "sld": ""};
	};
	this.getPolygonDefaults = function(){
		return {"getFeature": false, "color": "#aaaaaa", "opacity": 80, "graphicWidth": 1, "sld": ""};
	};
	this.getRasterDefaults = function(){
		return {"opacity": 100};
	};
	
	this.layerStateDefined = function(layerID){
		if (typeof settings[layerID] == 'undefined'){
			return false;
		} else {
			return true;
		}
	};
	
	this.addNewLayer = function(layerID, params){
		var dataType = params.dataType;

		if ((typeof dataType == 'undefined')||(dataType == '')){
			throw new Error("dataType (Point, Line, Polygon, or Raster) must be specified to create a new layer.");
		}
		if (this.layerStateDefined(layerID)){
			throw new Error("org.OpenGeoPortal.LayerState.addNewLayer: This layer already exists.");
		}
		settings[layerID] = this.getGenericDefaults();
		settings[layerID].dataType = dataType;
		var typeSpecificDefaults = {};
		switch(dataType){
		case "Point":
			typeSpecificDefaults = this.getPointDefaults();
			break;
		case "Line":
			typeSpecificDefaults = this.getLineDefaults();
			break;
		case "Polygon":
			typeSpecificDefaults = this.getPolygonDefaults();
			break;
		case "Raster":
		case "Paper Map":
			typeSpecificDefaults = this.getRasterDefaults();
			break;
		};
		for (var key in typeSpecificDefaults){
			settings[layerID][key] = typeSpecificDefaults[key];
		}
		for (var key in params){
			settings[layerID][key] = params[key];
		}
	};
	
	this.allLayersByParam = function(key, value){
		var layers = new Array();
		for (var layer in settings){
			if (settings[layer][key] == value){
				layers.push(layer);
			}
		}
		return layers;
	};
	
	this.getState = function(layerID, key){
		//this checks to see if a layer has a particular value for a particular parameter, returns true or false
		//if state info exists for the layer, key & value are matched against that value
		//otherwise, it is matched against defaults...
		for (var layer in settings){
			if (layer == layerID){
				if (typeof settings[layer][key] == 'undefined'){
					return null;
					//throw new Error("The given parameter\"" + key + "\" is not valid for the layer \"" + layer + "\".");
				} else {
					return settings[layer][key];
				}
			}
		}
		//no layer info set....check defaults
		if (typeof this.getGenericDefaults()[key] == 'undefined'){
			//what can we do in this case, w/out dataType info?
			throw new Error("org.OpenGeoPortal.LayerSettings.getState(): Requested Parameter\"" + key +"\":State information for the layer has not been set and the default cannot be determined without a Data Type (Point, Line, Polygon, Raster, Paper Map)");
		} else {
			return this.getGenericDefaults()[key];
		}
		
	};
	
	this.setState = function(layerID, updateObj){
		var sync = false;
		//if the layer has no state info, try to add it (dataType must be in updateObj to succeed)
		if (typeof settings[layerID] == 'undefined'){
			this.addNewLayer(layerID, updateObj);
		}
		for (var key in updateObj){
			var currentValue = settings[layerID][key];
			if (updateObj[key] != currentValue){
				//state has changed
				settings[layerID][key] = updateObj[key];
				sync = true;
			};
		}
		updateObj.layerID = layerID;
		//if state has changed, propogate the change
		if (sync){
			syncUi(updateObj);
		}
	};
	
	this.resetState = function(columnName){
		if (columnName == 'all'){
			settings = {};
		} else {
			for (var layer in settings){
				if (typeof this.getGenericDefaults()[columnName] != 'undefined'){
					settings[layer][columnName] = this.getGenericDefaults()[columnName];
				} else {
					var dataType = settings[layer]["dataType"];
					switch(dataType){
					case "Point":
						settings[layer][columnName] = this.getPointDefaults()[columnName];
						break;
					case "Line":
						settings[layer][columnName] = this.getLineDefaults()[columnName];
						break;
					case "Polygon":
						settings[layer][columnName] = this.getPolygonDefaults()[columnName];
						break;
					case "Raster":
					case "Paper Map":
						settings[layer][columnName] = this.getRasterDefaults()[columnName];
						break;
					};
				}
			}
		}
	};
	
	syncUi = function (updateObj){
		//console.log('syncUi');
		//return true;
		for (var key in updateObj){
			switch(key){
			case "preview":
			//this needs to check or uncheck a checkbox in another table
			//the checkbox itself will hold state in the current table
				jQuery('.colPreview').each(function(){
					if (this.tagName == 'TD'){
						var tableObj = jQuery(this).closest('table.display');
						var dataTableObj = tableObj.dataTable();
						var aData = dataTableObj.fnGetData(this.parentNode);
						var layerID = aData[org.OpenGeoPortal.resultsTableObj.tableHeadingsObj.getColumnIndex("LayerId")];
						if (layerID == updateObj.layerID){
							if (updateObj.preview == 'on'){
								jQuery(this).find("input").attr("checked", true);
							} else if (updateObj.preview == 'off'){
								jQuery(this).find("input").attr("checked", false);
							}
							//clauses for login and external needed
						}
					}
				}); 
				break;
				case "opacity":
					var stateVal = that.getState(updateObj.layerID, "opacity");
		    		var escapedLayerID = org.OpenGeoPortal.Utility.idEscape(updateObj.layerID);

					jQuery('#opacitysearchResults' + escapedLayerID).slider("value", stateVal);
					jQuery('#opacitysavedLayers' + escapedLayerID).slider("value", stateVal);
					break;
				case "color":
					break;
					//since we are wiping state when we click getFeature, I think
					//we only need to sync icons for expanded rows. register events?
				case "getFeature":
				    if (org.OpenGeoPortal.map.currentAttributeRequest){
				    	org.OpenGeoPortal.map.currentAttributeRequest.abort();
				    }
					var stateVal = that.getState(updateObj.layerID, "getFeature");
					var layer = org.OpenGeoPortal.map.getLayersByName(updateObj.layerID)[0];
		    		var escapedLayerID = org.OpenGeoPortal.Utility.idEscape(updateObj.layerID);
					if (stateVal === true){
						var mapLayers = org.OpenGeoPortal.map.layers;
						for (var i in mapLayers){
							var currentLayer = mapLayers[i];
							if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
									(currentLayer.name != 'OpenStreetMap')&&
									(currentLayer.CLASS_NAME != 'OpenLayers.Layer.Vector')&&
									(currentLayer.name != updateObj.layerID)){
								that.setState(currentLayer.name, {"getFeature": false});
							} else {
								continue;
							}
						}
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerID + '"]').attr("src", "media/preview_down.gif");
						org.OpenGeoPortal.map.events.register("click", layer, org.OpenGeoPortal.map.wmsGetFeature);
						//console.log(["register layer:", layer]);
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].activate();
					  jQuery('.olMap').css('cursor', "crosshair");
					} else {
						jQuery('.attributeInfoControl').filter('[id$="' + escapedLayerID + '"]').attr("src", "media/preview.gif");
						org.OpenGeoPortal.map.events.unregister("click", layer, org.OpenGeoPortal.map.wmsGetFeature);
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.ZoomBox")[0].deactivate();
						org.OpenGeoPortal.map.getControlsByClass("OpenLayers.Control.Navigation")[0].activate();
						jQuery('.olMap').css('cursor', "-moz-grab");
						/*var mapLayers = org.OpenGeoPortal.map.layers;
						for (var i in mapLayers){
							var currentLayer = mapLayers[i];
							if ((currentLayer.CLASS_NAME != 'OpenLayers.Layer.Google')&&
									(currentLayer.name != updateObj.layerID)){
									that.setState(currentLayer.name, {"getFeature": false});
									//jQuery('.attributeInfoControl').filter('[id$="' + updateObj.layerID + '"]').attr('src', "media/icon_crosshair_off.png");
							} else {
								continue;
							}
						}*/
				  }
				  break;
			  default:
				  break;				  
			  }
		}
	};
};
         