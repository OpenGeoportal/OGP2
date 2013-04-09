/**
 * This javascript module maintains state for how the table is configured
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
 * TableConfig
 * this object maintains state for the LayerTable
 * 
 */


//object defines the columns and their display properties, holds state information
OpenGeoportal.TableConfig = function TableConfig(thisObj){
								
				this.tableConfig = {
						"LayerId": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
							{"sName": "LayerId", "sTitle": "LayerId", "bVisible": false, "aTargets": [ 0 ], "bSortable": false}},
						"expandControls": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
							{"sName": "expandControls", "sTitle": "", "bVisible": true, "aTargets": [ 1 ], "sClass": "colExpand", "sWidth": "10px", "bSortable": false,
								"fnRender": function(oObj){return thisObj.getExpandControl(oObj);}}},  
						"DataType": {"ajax": true, "resizable": false, "organize": "group", "displayName": "Data Type", "columnConfig": 
									{"sName": "DataType", "sTitle": "Type", "bVisible": true, "aTargets": [ 2 ], "sClass": "colType", "sWidth": "24px", "bSortable": false, "bUseRendered": false, 
										"fnRender": function(oObj){return thisObj.getTypeIcon(oObj);}}},
						"LayerDisplayName": {"ajax": true, "resizable": true, "minWidth": 28, "currentWidth": 215, "organize": "alpha", "displayName": "Name", "columnConfig": 
										{"sName": "LayerDisplayName", "sTitle": "Name", "bVisible": true, "aTargets": [ 3 ], "sClass": "colTitle", "bSortable": false}}, 
						"Originator": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 81, "organize": "group", "displayName": "Originator", "columnConfig": 
										{"sName": "Originator", "sTitle": "Originator", "bVisible": true, "aTargets": [ 4 ], "sClass": "colOriginator", "bSortable": false}},            	
						"Publisher": {"ajax": true, "resizable": true, "minWidth": 47, "currentWidth": 80, "organize": "group", "displayName": "Publisher", "columnConfig": 
										{"sName": "Publisher", "sTitle": "Publisher", "bVisible": false, "aTargets": [ 5 ], "sClass": "colPublisher", "bSortable": false}},
						"ContentDate": {"ajax": true, "resizable": false, "organize": "numeric", "displayName": "Date", "columnConfig": 
										{"sName": "ContentDate", "sTitle": "Date", "bVisible": false, "aTargets": [ 6 ], "sClass": "colDate", "sWidth": "25px", "bSortable": false, "bUseRendered": true,
											"fnRender": function(oObj){return thisObj.renderDate(oObj);}}},
						"Institution": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Repository", "columnConfig": 
											{"sName": "Institution", "sTitle": "Rep", "bVisible": true, "aTargets": [ 7 ], "sClass": "colSource", "sWidth": "19px", "bSortable": false, "bUseRendered": false, 
												"fnRender": function(oObj){return thisObj.getSourceIcon(oObj);}}},  
						"Metadata": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
												{"sName": "Metadata", "sTitle": "Meta", "bVisible": true, "aTargets": [ 8 ], "sClass": "colMetadata", "sWidth": "23px", "bSortable": false, "bUseRendered": false, 
													"fnRender": function(oObj){return thisObj.getMetadataIcon(oObj);}}},       		
						"View": {"ajax": false, "resizable": false, "organize": false, "columnConfig": 
													{"sName": "View", "sTitle": "View", "bVisible": true, "aTargets": [ 9 ], "sClass": "colPreview", "sWidth": "39px", "bSortable": false,
														"fnRender": function(oObj){return thisObj.getPreviewControl(oObj);}}},
						"Name": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "Name", "sTitle": "LayerName", "bVisible": false, "aTargets": [ 10 ], "bSortable": false}},
						"Access": {"ajax": true, "resizable": false, "organize": "alpha", "displayName": "Access", "columnConfig": 
														{"sName": "Access", "sTitle": "Access", "bVisible": false, "aTargets": [ 11 ], "sClass": "colAccess", "sWidth": "53px", "bSortable": false}},
						"Location": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "Location", "sTitle": "WmsURL", "bVisible": false, "aTargets": [ 12 ], "bSortable": false}},
						"MinY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "MinY", "sTitle": "MinLatitude", "bVisible": false, "aTargets": [ 13 ], "bSortable": false}},
						"MaxY": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "MaxY", "sTitle": "MaxLatitude", "bVisible": false, "aTargets": [ 14 ], "bSortable": false}},
						"MinX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "MinX", "sTitle": "MinLongitude", "bVisible": false, "aTargets": [ 15 ], "bSortable": false}},
						"MaxX": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "MaxX", "sTitle": "MaxLongitude", "bVisible": false, "aTargets": [ 16 ], "bSortable": false}},
						"WorkspaceName": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "WorkspaceName", "sTitle": "Workspace Name", "bVisible": false, "aTargets": [ 17 ], "bSortable": false}},
						"GeoReferenced": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "GeoReferenced", "sTitle": "Georeferenced", "bVisible": false, "aTargets": [ 18 ], "bSortable": false}},
						"Availability": {"ajax": true, "resizable": false, "organize": false, "columnConfig": 
														{"sName": "Availability", "sTitle": "Availability", "bVisible": false, "aTargets": [ 19 ], "bSortable": false}},
						"score": {"ajax": true, "resizable": true, "minWidth": 27, "currentWidth": 27, "organize": true, "displayName": "Relevancy", "columnConfig": 
														{"sName": "score", "sTitle": "Relevancy", "bVisible": false, "aTargets": [ 20 ], "sClass": "colScore", "sWidth": "27px", "bSortable": false }}
				};

				this.getTableConfig = function(){
					return this.tableConfig;
				};

				this.insertColumn = function(columnLabel, columnConfigObj){
					var targetColumn = columnConfigObj.columnConfig.aTargets[0];
					//any aTarget value higher than targetColumn should be incremented
					for (var col in this.tableConfig){
						var currentTarget = this.tableConfig[col].columnConfig.aTargets
						if (currentTarget[0] >= targetColumn){
							currentTarget[0] = currentTarget[0] + 1;
						}
					}
					this.tableConfig[columnLabel] = columnConfigObj;
				};
				
				this.getValue = function(headingKey, headingParameter){
					if (typeof this.tableConfig[headingKey] == 'undefined'){
						throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
					}
					if (typeof this.tableConfig[headingKey][headingParameter] != 'undefined'){
						return this.tableConfig[headingKey][headingParameter];
					} else if (typeof this.tableConfig[headingKey]["columnConfig"][headingParameter] != 'undefined'){
						return this.tableConfig[headingKey]["columnConfig"][headingParameter];
					} else {
						throw new Error('The specified parameter "' + headingParameter + '" does not exist for the column heading "' + headingKey + '"');
					}
				};

				//convenience function for getting the width of a column
				this.getWidth = function(headingKey){
					if (this.tableConfig[headingKey]["resizable"]){
						return this.getValue(headingKey, "currentWidth");
					} else {
						//this may not be helpful, since sWidth is not really enforceable
						return this.getValue(headingKey, "sWidth");
					}
				};

				//only certain parameters should be changeable
				this.setWidth = function(headingKey, newWidth){
					if (typeof this.tableConfig[headingKey] == 'undefined'){
						throw new Error('The heading key: "' + headingKey + '" is not applicable to the function setWidth');
					}
					var currentHeadingObj = headings[headingKey];
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
				this.getColumnTargetIndex = function(headingKey){
					return this.getValue(headingKey, "aTargets")[0];
				};
				
				this.getColumnIndex = function(headingKey){
					var i = 0;
					for (var key in this.tableConfig){
						if (key == headingKey){
							return i;
						}
						i++;
					}
					throw new Error("The given key ['" + headingKey + "'] does not exist in the table config.");
				};
				
				this.getColumns= function(){
					var columnDefinitions = [];
					//loop through the array of table headings, create dataTables column defs.
					for (var heading in this.tableConfig){
						columnDefinitions.push(this.getValue(heading, "columnConfig"));
					}
					return columnDefinitions;
				};

};