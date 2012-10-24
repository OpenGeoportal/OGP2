<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>GeoData@Tufts</title>
<%@include file="jspf/includes.jspf"%>
</head>
<body>
<div id="main">
	<%@include file="jspf/header.jspf"%>
	<div id="menu"> 
		<div id="map_tabs"> 
			<span class="styledButton" title="Save map image" onclick="org.OpenGeoPortal.ui.saveImage();">Save Image</span>
			<span class="styledButton" title="Print map" onclick="org.OpenGeoPortal.ui.printImage();">Print</span>
			<div id="basemapDropdown">
				<button id="basemapSelect" class="styledButton" title="Select base map"><span>Basemap<img src="resources/media/arrow_down.png" alt="Select base map" /></span></button>
				<div id="basemapMenu">
				</div>
			</div>
		</div>  
	</div>
	<div id="container">
		<div id="roll_right" class="arrow_buttons"><img src="resources/media/button_arrow_right.png" class="button" /></div>
		<div id="left_col">
			<%@include file="jspf/leftPanel.jspf"%>
		</div>
		<div id="map">
			<%@include file="jspf/map.jspf"%>
		</div>
	</div>
	<%@include file="jspf/footer.jspf"%>	
</div>
</body>
</html>
