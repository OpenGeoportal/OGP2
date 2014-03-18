<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">

 <html>
    <head>

    <title>UnGeoreferenced Image Preview</title>

	<link rel="stylesheet" href="resources/css/mapDiv.css" type="text/css" />
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
	<script type="text/javascript"
		src="resources/javascript/openlayers/OpenLayers-2.11/OpenLayers.js"></script>
	<script type="text/javascript" src="resources/javascript/panZoom.js"></script>
	<script type="text/javascript" src="resources/javascript/lib/unGeoreferencedWindow.js"></script>

    </head>
    <body>

        <table>
	    <tr id="maprow"><td><div id="map"></div></td></tr>
	    <tr>
	        <td>You are previewing an ungeoreferenced image, which cannot be displayed on the map.<br /> 
		    Move the image into the center of the window before zooming.
		</td>
            </tr>
	    <tr>
	        <td>	    
		    <div id="collection"></div><span id="collURL"></span>
                </td>
	    </tr>
        </table>
        <button class="closeButton">Close</button>
    </body>
</html>


