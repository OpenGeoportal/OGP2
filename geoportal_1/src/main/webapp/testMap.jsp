<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>test map</title>
<link rel="stylesheet" href="resources/css/ogpLib.css" type="text/css" />
<!-- <link rel="stylesheet" type="text/css" media="print" href="resources/css/print.css" />-->
<script type="text/javascript" src="//maps.google.com/maps/api/js?v=3.10&amp;sensor=false"></script>
<script type="text/javascript" src="resources/javascript/openlayers/OpenLayers-2.11/OpenLayers.js"></script>
<script type="text/javascript" src="resources/javascript/panZoom.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js"></script>
<script type="text/javascript" src="resources/javascript/jquery.scrollTo-min.js"></script>
<script type="text/javascript" src="resources/javascript/jquery.ba-resize.js"></script>
<!-- ogp javascript library files -->
<script type="text/javascript" src="resources/javascript/lib/errorObject.js"></script>
<script type="text/javascript" src="resources/javascript/lib/analytics.js"></script>
<script type="text/javascript" src="resources/javascript/lib/utility.js"></script>
<script type="text/javascript" src="resources/javascript/lib/template.js"></script>
<script type="text/javascript" src="resources/javascript/lib/institution.js"></script>
<script type="text/javascript" src="resources/javascript/lib/tableConfig.js"></script>
<script type="text/javascript" src="resources/javascript/lib/tableLayerSettings.js"></script>
<script type="text/javascript" src="resources/javascript/lib/tableSortSettings.js"></script>
<script type="text/javascript" src="resources/javascript/lib/tableSettings.js"></script>
<script type="text/javascript" src="resources/javascript/lib/previewedLayers.js"></script>
<script type="text/javascript" src="resources/javascript/lib/layerSettings.js"></script>
<script type="text/javascript" src="resources/javascript/lib/appSettings.js"></script>
<!-- <script type="text/javascript" src="resources/javascript/lib/layerTable.js"></script>-->
<script type="text/javascript" src="resources/javascript/lib/solr.js"></script>
<script type="text/javascript" src="resources/javascript/lib/search.js"></script>
<!-- <script type="text/javascript" src="resources/javascript/lib/searchResultsTable.js"></script>-->
<!-- <script type="text/javascript" src="resources/javascript/lib/cartTable.js"></script>-->
<script type="text/javascript" src="resources/javascript/lib/download.js"></script>
<script type="text/javascript" src="resources/javascript/lib/login.js"></script>
<script type="text/javascript" src="resources/javascript/lib/geoCommonsExport.js"></script>
<script type="text/javascript" src="resources/javascript/lib/mapDiv.js"></script>
<script type="text/javascript" src="resources/javascript/lib/userInterface.js"></script>
<!--<script type="text/javascript" src="resources/javascript/ogpLib.js"></script>-->
<style>
#example {
    height: 100%;
    margin: 0;
    width: 100%;
}
</style>
<script>
$(document).ready(function() {
	OpenGeoportal.ogp = {};
	OpenGeoportal.ogp.appState = new OpenGeoportal.OgpSettings();
	OpenGeoportal.ogp.ui = new OpenGeoportal.UserInterface(OpenGeoportal.ogp.appState);
   
	OpenGeoportal.ogp.testMap = new OpenGeoportal.MapController(OpenGeoportal.ogp.appState);
	try{
		OpenGeoportal.ogp.testMap.createMap("example");
	} catch (e){
		console.log("problem with createMap");
		console.log(e);
	}
} );
</script>	
</head>
<body>

		<div id="example">
		</div>

</body>
</html>
