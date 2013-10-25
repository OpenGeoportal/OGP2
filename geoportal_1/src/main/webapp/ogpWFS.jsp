<%@page import="org.opengeoportal.utilities.LocationFieldUtils"%>
<%@ page language="java" contentType="application/xml; charset=UTF-8"
	pageEncoding="UTF-8"
	import="java.util.*, javax.xml.transform.*, org.apache.commons.compress.utils.IOUtils, java.net.URLDecoder, java.net.URL, javax.xml.transform.dom.*, javax.xml.transform.stream.*,org.opengeoportal.utilities.http.HttpRequester,org.opengeoportal.metadata.LayerInfoRetriever,org.opengeoportal.solr.*, java.io.*, javax.xml.parsers.DocumentBuilderFactory, 
    javax.xml.parsers.DocumentBuilder, org.w3c.dom.NodeList, org.w3c.dom.Node, org.w3c.dom.Document, java.net.URLConnection, java.util.Set, java.util.HashSet, java.util.Map, 
    org.springframework.context.*, org.springframework.web.context.support.*, org.springframework.beans.factory.* "%>
<%
    	response.setHeader("Content-disposition","inline; filename=\"getCapabilities.xml\"");

    	Enumeration<String> sentParams = request.getParameterNames();
    	StringBuffer requestURL = request.getRequestURL();
   		System.out.println(requestURL.toString());
   		System.out.println(request.getQueryString());
   		System.out.println(request.getMethod());

    	String version = "1.0.0";
    	String requestType = "GetCapabilities";
       	while (sentParams.hasMoreElements()){
    		String currentParam = sentParams.nextElement();
    		String currentValue = request.getParameter(currentParam);
    		if (currentParam.equalsIgnoreCase("version")){
    			//version = currentValue;	
    		} else if (currentParam.equalsIgnoreCase("request")){
    			requestType = currentValue;
    		}
    		//other params to pass along?
    	}
       	String layers = request.getParameter("OGPIDS");
       	
    	while (layers.indexOf("%") > -1){
    		layers = URLDecoder.decode(layers, "UTF-8");
    	}
    	System.out.println(layers);
    	String[] layerIds = layers.split(",");
    	//String[] layerIds = request.getParameterValues("layerId");
   		Set<String> layerIdSet = new HashSet<String>();
   		
		for (int i = 0; i < layerIds.length; i++){
			layerIdSet.add(layerIds[i]);
   		}
		
		ApplicationContext injector = WebApplicationContextUtils.getWebApplicationContext(request.getSession().getServletContext());

		LayerInfoRetriever layerInfoRetriever = (LayerInfoRetriever) injector.getBean("layerInfoRetriever.solr");
   		List<SolrRecord> solrRecords = layerInfoRetriever.fetchAllLayerInfo(layerIdSet);
   		HttpRequester httpRequester = (HttpRequester) injector.getBean("httpRequester.generic");
   		
   		//There is some info that requires the getCapabilities doc (native epsg code),
   		//so we must request it and parse it.  The benefit is that we can just grab the appropriate FeatureType node and
   		//insert it into this response.  Eventually, if we can get the epsg code from solr reliably, solr might be the
   		//faster method, since we are parsing a potentially large xml document.
   		//String institution = solrRecords.get(0).getInstitution();
   		String servicePoint = LocationFieldUtils.getWfsUrl(solrRecords.get(0).getLocation());
		URL serverUrl = new URL(servicePoint);
		String serverName = serverUrl.getProtocol() +"://" + serverUrl.getHost();
		System.out.println(serverName);
		System.out.println(servicePoint);
		String featureTypeInfo = "";

		if (!requestType.equalsIgnoreCase("GetCapabilities")){
			//if we wanted to support any client and arbitrary servers, we could always refer clients to this page, then dispatch requests to terminal wfs servers
			//we could default the current model if only one wfs server appears in the layer list
			System.out.println("The client is ignoring the URL in the getCapabilities document.  Trying request type: " + requestType);
   			InputStream inputStream = httpRequester.sendRequest(servicePoint, request.getQueryString(), "GET");
			IOUtils.copy(inputStream, response.getOutputStream());
			inputStream.close();
		} else {
		
		
		//parse the returned XML
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		//ignore validation, dtd
    	factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
    	factory.setValidating(false);
		// Use document builder factory
		DocumentBuilder builder = factory.newDocumentBuilder();
		
    	Transformer serializer = TransformerFactory.newInstance().newTransformer();
    	serializer.setOutputProperty(OutputKeys.INDENT, "yes");
		serializer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
		
		for (int i = 0; i < layerIds.length; i++){
			SolrRecord record = solrRecords.get(0);
   			String workspace = record.getWorkspaceName();
   			String layerName = record.getName();
//http://geoserver01.uit.tufts.edu/sde/GISPORTAL.GISOWNER01.AFGHANISTANAIRPORTSFIELDS00/wfs?service=wfs&version=1.0.0&request=GetCapabilities
   			InputStream inputStream = httpRequester.sendRequest(serverName + "/" + workspace + "/" + layerName + "/wfs", "version=" + version + "&service=wfs&request=GetCapabilities", "GET");

			//Parse the document
			Document document = builder.parse(inputStream);
			inputStream.close();

			NodeList layerNodeList = document.getElementsByTagName("FeatureType");
			Node layerNode = layerNodeList.item(0);
			if (layerNode.hasAttributes()){
				layerNode.getAttributes().removeNamedItem("xmlns:sde");
			}
			
	    	StringWriter stw = new StringWriter();

	    	serializer.transform(new DOMSource(layerNode), new StreamResult(stw));
       		featureTypeInfo += stw.toString();
       		System.out.println(featureTypeInfo);
		}


	    System.out.println("Layers found...");
	    %><?xml version="1.0" encoding="UTF-8"?>
<WFS_Capabilities version="1.0.0" xmlns="http://www.opengis.net/wfs"
	xmlns:sde="http://geoserver.sf.net"
	xmlns:ogc="http://www.opengis.net/ogc"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.opengis.net/wfs http://geoserver01.uit.tufts.edu/schemas/wfs/1.0.0/WFS-capabilities.xsd">
<Service> <Name>WFS</Name> <Title>OpenGeoportal Web
Feature Service</Title> <Abstract>A dynamically created capabilites
document including only certain layers. For use in a mapping client that
supports WFS services.</Abstract> <Keywords>WFS, WMS, GEOSERVER</Keywords> <OnlineResource>
<%out.write(servicePoint);%>
</OnlineResource>
<Fees>NONE</Fees>
<AccessConstraints>NONE</AccessConstraints>
</Service>
<Capability>
<Request>
<GetCapabilities>
<DCPType>
<HTTP>
<Get
	onlineResource="<%out.write(requestURL.toString() + "?OGPIDS=" + layers);%>" />
</HTTP>
</DCPType>
</GetCapabilities>
<DescribeFeatureType>
<SchemaDescriptionLanguage>
<XMLSCHEMA />
</SchemaDescriptionLanguage>
<DCPType>
<HTTP>
<Get
	onlineResource="<%out.write(servicePoint);%>?request=DescribeFeatureType" />
</HTTP>
</DCPType>
</DescribeFeatureType>
<GetFeature>
<ResultFormat>
<GML2 />
<GML3 />
<SHAPE-ZIP />
<GEOJSON />
</ResultFormat>
<DCPType>
<HTTP>
<Get onlineResource="<%out.write(servicePoint);%>?request=GetFeature" />
</HTTP>
</DCPType>
</GetFeature>
</Request>
</Capability>
<FeatureTypeList>
<Operations>
<Query />
</Operations>
<%
		out.write(featureTypeInfo);
   %>
</FeatureTypeList>
<ogc:Filter_Capabilities>
	<ogc:Spatial_Capabilities>
		<ogc:Spatial_Operators>
			<ogc:Disjoint />
			<ogc:Equals />
			<ogc:DWithin />
			<ogc:Beyond />
			<ogc:Intersect />
			<ogc:Touches />
			<ogc:Crosses />
			<ogc:Within />
			<ogc:Contains />
			<ogc:Overlaps />
			<ogc:BBOX />
		</ogc:Spatial_Operators>
	</ogc:Spatial_Capabilities>
	<ogc:Scalar_Capabilities>
		<ogc:Logical_Operators />
		<ogc:Comparison_Operators>
			<ogc:Simple_Comparisons />
			<ogc:Between />
			<ogc:Like />
			<ogc:NullCheck />
		</ogc:Comparison_Operators>
		<ogc:Arithmetic_Operators>
			<ogc:Simple_Arithmetic />
			<ogc:Functions>
				<ogc:Function_Names>
					<ogc:Function_Name nArgs="1">abs</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">abs_2</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">abs_3</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">abs_4</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">acos</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">area</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">asin</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">atan</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">atan2</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">between</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">boundary</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">boundaryDimension</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">buffer</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">bufferWithSegments</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">Categorize</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">ceil</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">centroid</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">classify</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Average</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Bounds</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Count</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Max</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Median</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Min</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Sum</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">Collection_Unique</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">Concatenate</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">contains</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">convert</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">convexHull</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">cos</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">crosses</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">dateFormat</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">dateParse</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">difference</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">dimension</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">disjoint</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">distance</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">double2bool</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">endAngle</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">endPoint</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">env</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">envelope</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">EqualInterval</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">equalsExact</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">equalsExactTolerance</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">equalTo</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">exp</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">exteriorRing</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">floor</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">geometryType</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">geomFromWKT</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">geomLength</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">getGeometryN</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">getX</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">getY</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">getZ</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">greaterEqualThan</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">greaterThan</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">id</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">IEEEremainder</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">if_then_else</ogc:Function_Name>
					<ogc:Function_Name nArgs="11">in10</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">in2</ogc:Function_Name>
					<ogc:Function_Name nArgs="4">in3</ogc:Function_Name>
					<ogc:Function_Name nArgs="5">in4</ogc:Function_Name>
					<ogc:Function_Name nArgs="6">in5</ogc:Function_Name>
					<ogc:Function_Name nArgs="7">in6</ogc:Function_Name>
					<ogc:Function_Name nArgs="8">in7</ogc:Function_Name>
					<ogc:Function_Name nArgs="9">in8</ogc:Function_Name>
					<ogc:Function_Name nArgs="10">in9</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">int2bbool</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">int2ddouble</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">interiorPoint</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">interiorRingN</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">Interpolate</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">intersection</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">intersects</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isClosed</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isEmpty</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">isLike</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isNull</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">isometric</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isRing</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isSimple</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">isValid</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">isWithinDistance</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">Jenks</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">length</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">lessEqualThan</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">lessThan</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">log</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">max</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">max_2</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">max_3</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">max_4</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">min</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">min_2</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">min_3</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">min_4</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">not</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">notEqualTo</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">numberFormat</ogc:Function_Name>
					<ogc:Function_Name nArgs="5">numberFormat2</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">numGeometries</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">numInteriorRing</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">numPoints</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">offset</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">overlaps</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">parseBoolean</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">parseDouble</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">parseInt</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">parseLong</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">pi</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">pointN</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">pow</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">PropertyExists</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">Quantile</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">random</ogc:Function_Name>
					<ogc:Function_Name nArgs="0">Recode</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">relate</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">relatePattern</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">rint</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">round</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">round_2</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">roundDouble</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">sin</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">sqrt</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">StandardDeviation</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">startAngle</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">startPoint</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">strCapitalize</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strConcat</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strEndsWith</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strEqualsIgnoreCase</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strIndexOf</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strLastIndexOf</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">strLength</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strMatches</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">strPosition</ogc:Function_Name>
					<ogc:Function_Name nArgs="4">strReplace</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strStartsWith</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">strSubstring</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">strSubstringStart</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">strToLowerCase</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">strToUpperCase</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">strTrim</ogc:Function_Name>
					<ogc:Function_Name nArgs="3">strTrim2</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">symDifference</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">tan</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">toDegrees</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">toRadians</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">touches</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">toWKT</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">union</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">UniqueInterval</ogc:Function_Name>
					<ogc:Function_Name nArgs="1">vertices</ogc:Function_Name>
					<ogc:Function_Name nArgs="2">within</ogc:Function_Name>
				</ogc:Function_Names>
			</ogc:Functions>
		</ogc:Arithmetic_Operators>
	</ogc:Scalar_Capabilities>
</ogc:Filter_Capabilities>
</WFS_Capabilities>
<%} %>