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
				<button id="basemapSelect" class="styledButton" title="Select base map"><span>Basemap<img src="media/arrow_down.png" alt="Select base map" /></span></button>
				<div id="basemapMenu">
				</div>
			</div>
		</div>  
	</div>
	<div id="container">
		<div id="roll_right" class="arrow_buttons"><img src="media/button_arrow_right.png" class="button" /></div>
		<div id="left_col">
			<%@include file="jspf/leftPanel.jspf"%>
		</div>
		<div id="map">
			<%@include file="jspf/map.jspf"%>
		</div>
	</div>
	<%@include file="jspf/footer.jspf"%>	
</div>
<script type="text/javascript">

  var googleAnalyticsId = org.OpenGeoPortal.InstitutionInfo.getGoogleAnalyticsId();
  if (googleAnalyticsId)
  {
  	// add google analytics to page, the site's google analytics id goes in ogpConfig.js
  	var _gaq = _gaq || [];
  	_gaq.push(['_setAccount', googleAnalyticsId]);
  	_gaq.push(['_trackPageview']);

    (function() {
  	  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  	})();
  }

</script>

</body>
</html>
