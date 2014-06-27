<!DOCTYPE HTML>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title>${pageTitle.primary} ${pageTitle.offset}</title>
	<!-- add analyticsId, searchUrl, login info here -->
	<script>
	
OpenGeoportal = {};
OpenGeoportal.Config = {};
OpenGeoportal.Config.analyticsId="${analyticsId}";
OpenGeoportal.Config.searchUrl="${searchUrl}";
OpenGeoportal.Config.loginRepository="${loginRepository}";
OpenGeoportal.Config.loginType="${loginType}";
OpenGeoportal.Config.loginUrl="${loginUrl}";
OpenGeoportal.Config.sd="${secureDomain}";
OpenGeoportal.Config.shareIds=${shareIds} ;
OpenGeoportal.Config.shareBbox="${shareBbox}";

	</script>
	
<%@include file="jspf/includes.jspf"%>
<!-- if there is a value for extraCss and extraJs add them here -->
<c:set var="cssLen" value="${fn:length(extraCss)}"/>
<c:if test="${cssLen > 0}" >
<link rel="stylesheet" href="${extraCss}" type="text/css" />
</c:if>

<c:set var="jsLen" value="${fn:length(extraJs)}"/>
<c:if test="${jsLen > 0}">
<script type="text/javascript" src="${extraJs}"></script>
</c:if>
</head>

<body>

	<%@include file="jspf/header.jspf"%>
	<%@include file="jspf/search.jspf"%>
	
	<div id="container">
		<div id="left_col" class="shadowRightOuter">
			<%@include file="jspf/leftPanel.jspf"%>
		</div>
		<div id="map"></div>
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
