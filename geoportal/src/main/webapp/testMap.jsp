<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
<title>test map</title>
<link rel="stylesheet" href="resources/css/ogpLib.css" type="text/css" />
<!-- <link rel="stylesheet" type="text/css" media="print" href="resources/css/print.css" />-->
<script
	src="http://documentcloud.github.com/underscore/underscore-min.js"></script>
<script src="http://documentcloud.github.com/backbone/backbone-min.js"></script>
<script type="text/javascript"
	src="//maps.google.com/maps/api/js?v=3.10&sensor=false"></script>
<script type="text/javascript"
	src="resources/javascript/openlayers/OpenLayers-2.11/OpenLayers.js"></script>

<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>

<script
	src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
<script type="text/javascript"
	src="resources/javascript/jquery.ba-resize.js"></script>
<script type="text/javascript" src="resources/javascript/panZoom.js"></script>

<!-- ogp javascript library files -->

<script type="text/javascript"
	src="resources/javascript/lib/errorObject.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/analytics.js"></script>
<script type="text/javascript" src="resources/javascript/lib/utility.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/templates/template.js"></script>
<!-- <script type="text/javascript" src="resources/javascript/lib/widgets.js"></script>-->
<script type="text/javascript"
	src="resources/javascript/lib/institution.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/tableConfig.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/tableLayerSettings.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/tableSortSettings.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/previewedLayers.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/layerSettings.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/models/appSettings.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/views/miscViews.js"></script>
<script type="text/javascript" src="resources/javascript/lib/solr.js"></script>
<script type="text/javascript" src="resources/javascript/lib/search.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/download.js"></script>
<script type="text/javascript" src="resources/javascript/lib/login.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/geoCommonsExport.js"></script>
<script type="text/javascript" src="resources/javascript/lib/mapDiv.js"></script>
<script type="text/javascript"
	src="resources/javascript/lib/userInterface.js"></script>
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

	<div id="example"></div>

</body>
</html>
