<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>GeoData@Tufts</title>
<%@include file="jspf/devincludes.jspf"%>
</head>
<body>

	<%@include file="jspf/header.jspf"%>
	<%@include file="jspf/search.jspf"%>
	<div id="container" class="shadowDown">
		<div id="roll_right" class="shadowDown"><div class="arrow_right button" ></div></div>
		<div id="left_col">
			<%@include file="jspf/leftPanel.jspf"%>
		</div>
		<div id="map">
		</div>
	</div>
	<%@include file="jspf/footer.jspf"%>	

<div id="dialogs" class="hiddenElements">
	<%@include file="jspf/about.jspf"%> 
	<%@include file="jspf/contact.jspf"%> 
</div>
<div id="iframes" class="hiddenElements"></div>
<div id="infoBubbles"></div>
</body>
</html>
