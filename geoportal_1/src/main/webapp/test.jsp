<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>test table</title>
<!--<script type="text/javascript" src="https://getfirebug.com/firebug-lite.js"></script>-->
<!-- <link rel="stylesheet" href="resources/css/google.css" type="text/css" />-->
<link rel="stylesheet" href="resources/css/jquery-ui.custom.css" type="text/css" />
<link rel="stylesheet" href="resources/css/structure.css" type="text/css" />
<!-- <link rel="stylesheet" href="resources/css/mapDiv.css" type="text/css" />-->
<link rel="stylesheet" href="resources/css/dataTable.css" type="text/css" />
<!-- <link rel="stylesheet" type="text/css" media="print" href="resources/css/print.css" />-->
<!-- <script type="text/javascript" src="//maps.google.com/maps/api/js?v=3.10&amp;sensor=false"></script>
<script type="text/javascript" src="resources/javascript/openlayers/OpenLayers-2.11/OpenLayers.js"></script>-->
<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="//ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/jquery.dataTables.min.js"></script>
<script type="text/javascript" src="resources/javascript/dataTables.scroller.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js"></script>
<script type="text/javascript" src="resources/javascript/jquery.scrollTo-min.js"></script>
<script type="text/javascript" src="resources/javascript/jquery.ba-resize.js"></script>
<script type="text/javascript" src="resources/javascript/template.js"></script>
<script type="text/javascript" src="resources/javascript/analytics.js"></script>
<script type="text/javascript" src="resources/javascript/institution.js"></script>
<script type="text/javascript" src="resources/javascript/utility.js"></script>
<script type="text/javascript" src="resources/javascript/layerSettings.js"></script>
<script type="text/javascript" src="resources/javascript/layerTable.js"></script>
<script type="text/javascript" src="resources/javascript/login.js"></script>
<script type="text/javascript" src="resources/javascript/userInterface.js"></script>
<script type="text/javascript" src="resources/javascript/solr.js"></script>
<script>

$(document).ready(function() {
	OpenGeoportal.ogp = {};
	OpenGeoportal.ogp.layerState = new OpenGeoportal.LayerSettings();
	OpenGeoportal.ogp.testui = new OpenGeoportal.UserInterface();
	var getSolr = function(startIndex)
	{
		var solr = new OpenGeoportal.Solr();
		solr.setBoundingBox(-180.0, 180.0, -90.0, 90.0);
		return solr;
	};
	var processData = function(dataObj){
    	// dataObj is a Javascript object (usually) returned by Solr
    	var solrResponse = dataObj["response"];
    	var totalResults = solrResponse["numFound"];
    	// solr docs holds an array of hashtables, each hashtable contains a layer
    	var solrLayers = solrResponse["docs"];
    	var arrData = [];

    	// loop over all the returned layers
    	var tableHeadings = resultTable.tableHeadingsObj.getTableHeadings();
    	var layerIDIndex = resultTable.tableHeadingsObj.getColumnIndex("LayerId");
    	rowloop:
    	for (var j in solrLayers){
    		var arrRow = [];
    			for (var k in tableHeadings){

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
	var resultTable = new OpenGeoportal.LayerTable(OpenGeoportal.ogp.layerState); 

	//override createDataTable
	resultTable.createDataTable = function(table$, tableData, columnDefs){
		   var tableObj = table$.dataTable( {
		        "bProcessing": true,
		        "bServerSide": true,
				"sScrollY": "680px",
				"oScroller": {
					"loadingIndicator": false
				},
		        "sDom": "rtS",
		        "bDeferRender": true,
		        "sAjaxSource": getSolr().getURL(),
		        "aoColumnDefs": columnDefs,
				"fnDrawCallback": resultTable.tableDrawCallbacks,
				"bAutoWidth": false,
		        "fnServerData": function ( sSource, aoData, fnCallback, oSettings ) {
		        	var getData = function(){
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
		        	//console.log(oSettings);
		            oSettings.jqXHR = $.ajax( {
		    			"jsonp": 'json.wrf',
		              "type": "GET",
		              "url": sSource,
		              "data": getData(),
		              "success": function(data){
		            	  var response = {};
		            	  data = jQuery.parseJSON(data);
		            	  var solrdocs = data.response.docs;
		            	  var totalRecords = parseInt(data.response.numFound);
		            	  response.iTotalRecords = totalRecords;
		            	  response.iTotalDisplayRecords = totalRecords;
		            	  response.sEcho = echo;
		            	  response.aaData = processData(data);
		            	  //console.log(response);
		            	  fnCallback(response);}
		            } );
		        }
		    } );
		   return tableObj;
	};
	resultTable.initTable("example");
} );
</script>	
</head>
<body>
<div id="example">
</div>
</body>
</html>
