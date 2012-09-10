<%@ page language="java" contentType="application/xml; charset=UTF-8"
    pageEncoding="UTF-8" import="java.util.*, javax.xml.transform.*, java.net.URLDecoder, javax.xml.transform.dom.*, javax.xml.transform.stream.*, org.OpenGeoPortal.Utilities.*, org.OpenGeoPortal.Download.*, java.io.*, javax.xml.parsers.DocumentBuilderFactory, javax.xml.parsers.DocumentBuilder, org.w3c.dom.NodeList, org.w3c.dom.Node,org.w3c.dom.Document, java.net.URLConnection, java.util.Set, java.util.HashSet, java.util.Map, org.springframework.context.*, org.springframework.web.context.support.*, org.springframework.beans.factory.* "%><%
    	response.setHeader("Content-disposition","attachment; filename=\"wfs.xml\"");

    	Enumeration<String> sentParams = request.getParameterNames();
       	while (sentParams.hasMoreElements()){
    		String blah = sentParams.nextElement();
    		System.out.println(blah);
    		System.out.println(request.getParameter(blah));
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
   		Map<String, Map<String,String>> layerInfoMap = layerInfoRetriever.getAllLayerInfo(layerIdSet);
   		HttpRequester httpRequester = (HttpRequester) injector.getBean("httpRequester.generic");
   		
   		//There is some info that requires the getCapabilities doc (native epsg code),
   		//so we must request it and parse it.  The benefit is that we can just grab the appropriate FeatureType node and
   		//insert it into this response.  Eventually, if we can get the epsg code from solr reliably, solr might be the
   		//faster method, since we are parsing a potentially large xml document.
   		String institution = layerInfoMap.get(layerIds[0]).get("Institution");
   		//String serverName = ParseJSONSolrLocationField.getWfsUrl(layerInfoMap.get(layerIds[0]).get("Location"));

   		String serverName = "http://geoserver01.uit.tufts.edu";
   		String servicePoint = serverName + "/wfs";
		String featureTypeInfo = "";

		for (int i = 0; i < layerIds.length; i++){
			String workspace = "sde";
   			//String workspace = layerInfoMap.get(layerIds[i]).get("WorkspaceName");
   			String layerName = layerInfoMap.get(layerIds[i]).get("Name");

   			URLConnection getCapabilitiesResponse = httpRequester.sendRequest(serverName + "/" + workspace + "/" + layerName + "/wfs", "request=getCapabilities&version=1.1.0", "GET");
			InputStream inputStream = getCapabilitiesResponse.getInputStream();

			//parse the returned XML
			// Create a factory
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			//ignore validation, dtd
        	factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        	factory.setValidating(false);
			// Use document builder factory
			DocumentBuilder builder = factory.newDocumentBuilder();
			//Parse the document
			Document document = builder.parse(inputStream);
		
			NodeList layerNodeList = document.getElementsByTagName("FeatureType");
			Node layerNode = layerNodeList.item(0);
			
	    	StringWriter stw = new StringWriter();
        	Transformer serializer = TransformerFactory.newInstance().newTransformer();
        	serializer.setOutputProperty(OutputKeys.INDENT, "yes");
			serializer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        	serializer.transform(new DOMSource(layerNode), new StreamResult(stw));
       		featureTypeInfo += stw.toString();
       		System.out.println(featureTypeInfo);
		}
		
		
		/*
		//parse the returned XML
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		//ignore validation, dtd
        factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        factory.setValidating(false);
		// Use document builder factory
		DocumentBuilder builder = factory.newDocumentBuilder();
		//Parse the document
		Document document = builder.parse(inputStream);
		
		NodeList elementNodes = document.getElementsByTagName("Name");
		for (int i = 0; i < elementNodes.getLength(); i++){
			Node featureTypeNameElement = elementNodes.item(i);
			String featureTypeName = featureTypeNameElement.getTextContent().trim();
   			for (String layer : layerIds){
   				String currentLayerName = layerInfoMap.get(layer).get("WorkspaceName") + ":" + layerInfoMap.get(layer).get("Name");
   				if (currentLayerName.equals(featureTypeName)){
   					Node featureTypeElement = featureTypeNameElement.getParentNode();
   			      	StringWriter stw = new StringWriter();
   	            	Transformer serializer = TransformerFactory.newInstance().newTransformer();
   	             	serializer.setOutputProperty(OutputKeys.INDENT, "yes");
					serializer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
   	            	serializer.transform(new DOMSource(featureTypeElement), new StreamResult(stw));
   	            	featureTypeInfo += stw.toString();  
   					break;
   				}
   			}
		}
		*/
		//can I get this info from getCapabilites (WFS 1.0) with this syntax request=getCapabilities#sde:featureTypeName
		//The piece we're grabbing from the getCapabilities doc looks like this:
    	/*	String featureType = "<FeatureType xmlns:" + currentMap.get("WorkspaceName") + "=\"" + namespaceURI + "\">"
    		+ 		"<Name>" + currentMap.get("Name") + "</Name>"
    		+ 		"<Title>" + currentMap.get("DisplayName") + "</Title>"
    		+ 		"<Abstract/>"
    		+ 		"<DefaultSRS>urn:x-ogc:def:crs:EPSG:" + epsgCode + "</DefaultSRS>"
    		+ 		"<ows:WGS84BoundingBox>"
    		+ 				"<ows:LowerCorner>" + currentMap.get("MinX") + " " + currentMap.get("MinY") + "</ows:LowerCorner>"
    		+				"<ows:UpperCorner>" + currentMap.get("MaxX") + " " + currentMap.get("MaxY") + "</ows:UpperCorner>"
    		+		"</ows:WGS84BoundingBox>"
    		+ "</FeatureType>";
    		out.write(featureType);
   			}
		}*/
	    System.out.println("Layers found...");%><?xml version="1.0" encoding="UTF-8"?>
    <wfs:WFS_Capabilities version="1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wfs" xmlns:wfs="http://www.opengis.net/wfs" xmlns:ows="http://www.opengis.net/ows" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://geoserver-dev.atech.tufts.edu:80/schemas/wfs/1.1.0/wfs.xsd" xmlns:sde="http://geoserver.sf.net" updateSequence="201">
    <ows:ServiceIdentification><ows:Title>OpenGeoportal Web Feature Service</ows:Title>
    <ows:Abstract>A dynamically created capabilites document including only certain layers.  For use in a mapping client that supports WFS services.</ows:Abstract>
    <ows:Keywords><ows:Keyword>WFS</ows:Keyword><ows:Keyword>OpenGeoportal</ows:Keyword></ows:Keywords><ows:ServiceType>WFS</ows:ServiceType><ows:ServiceTypeVersion>1.1.0</ows:ServiceTypeVersion><ows:Fees>NONE</ows:Fees>
    <ows:AccessConstraints>NONE</ows:AccessConstraints></ows:ServiceIdentification>
    
    <ows:ServiceProvider>
    <ows:ProviderName>Tufts University</ows:ProviderName>
    <ows:ServiceContact>
    <ows:IndividualName>OpenGeoportal Development Team</ows:IndividualName>
    <ows:PositionName/>
    <ows:ContactInfo>
    <ows:Phone><ows:Voice/><ows:Facsimile/></ows:Phone>
    <ows:Address><ows:City>Somerville, MA</ows:City><ows:AdministrativeArea/><ows:PostalCode/><ows:Country>US</ows:Country></ows:Address>
    </ows:ContactInfo></ows:ServiceContact></ows:ServiceProvider>
    <ows:OperationsMetadata>
    <ows:Operation name="GetCapabilities">
    	<ows:DCP>
    		<ows:HTTP>
    			<ows:Get xlink:href="<%out.write(servicePoint);%>"/>
    			<ows:Post xlink:href="<%out.write(servicePoint);%>"/>
    		</ows:HTTP>
    	</ows:DCP>
    	<ows:Parameter name="AcceptVersions">
    		<ows:Value>1.0.0</ows:Value>
    		<ows:Value>1.1.0</ows:Value>
    	</ows:Parameter>
    	<ows:Parameter name="AcceptFormats">
    		<ows:Value>text/xml</ows:Value>
    	</ows:Parameter>
    </ows:Operation>
    <ows:Operation name="DescribeFeatureType">
    	<ows:DCP>
    		<ows:HTTP>
    			<ows:Get xlink:href="<%out.write(servicePoint);%>"/>
    			<ows:Post xlink:href="<%out.write(servicePoint);%>"/>
    		</ows:HTTP>
    	</ows:DCP>
    	<ows:Parameter name="outputFormat">
    		<ows:Value>text/xml; subtype=gml/3.1.1</ows:Value>
    	</ows:Parameter>
    </ows:Operation>
    <ows:Operation name="GetFeature">
    	<ows:DCP>
    	<ows:HTTP>
    		<ows:Get xlink:href="<%out.write(servicePoint);%>"/>
    		<ows:Post xlink:href="<%out.write(servicePoint);%>"/>
    	</ows:HTTP>
    	</ows:DCP>
    	<ows:Parameter name="resultType">
    		<ows:Value>results</ows:Value>
    		<ows:Value>hits</ows:Value>
    	</ows:Parameter>
    	<ows:Parameter name="outputFormat">
    		<ows:Value>text/xml; subtype=gml/3.1.1</ows:Value>
    		<ows:Value>GML2</ows:Value>
    		<ows:Value>GML2-GZIP</ows:Value>
    		<ows:Value>SHAPE-ZIP</ows:Value>
    		<ows:Value>csv</ows:Value>
    		<ows:Value>gml3</ows:Value>
    		<ows:Value>gml32</ows:Value>
    		<ows:Value>json</ows:Value>
    		<ows:Value>text/xml; subtype=gml/2.1.2</ows:Value>
    		<ows:Value>text/xml; subtype=gml/3.2</ows:Value>
    	</ows:Parameter>
    	<ows:Constraint name="LocalTraverseXLinkScope">
    		<ows:Value>2</ows:Value>
    	</ows:Constraint>
    </ows:Operation>
    <ows:Operation name="GetGmlObject">
    	<ows:DCP>
    	<ows:HTTP>
    		<ows:Get xlink:href="<%out.write(servicePoint);%>"/>
    		<ows:Post xlink:href="<%out.write(servicePoint);%>"/>
    	</ows:HTTP>
    	</ows:DCP>
    </ows:Operation>
	</ows:OperationsMetadata>
    <FeatureTypeList>
    <Operations>
    	<Operation>Query</Operation>
    </Operations><%
		out.write(featureTypeInfo);
   %> 
    </FeatureTypeList>
    <ogc:Filter_Capabilities>
    <ogc:Spatial_Capabilities>
    <ogc:GeometryOperands>
    	<ogc:GeometryOperand>gml:Envelope</ogc:GeometryOperand>
    	<ogc:GeometryOperand>gml:Point</ogc:GeometryOperand>
    	<ogc:GeometryOperand>gml:LineString</ogc:GeometryOperand>
    	<ogc:GeometryOperand>gml:Polygon</ogc:GeometryOperand>
    </ogc:GeometryOperands>
    <ogc:SpatialOperators>
    	<ogc:SpatialOperator name="Disjoint"/>
    	<ogc:SpatialOperator name="Equals"/>
    	<ogc:SpatialOperator name="DWithin"/>
    	<ogc:SpatialOperator name="Beyond"/>
    	<ogc:SpatialOperator name="Intersects"/>
    	<ogc:SpatialOperator name="Touches"/>
    	<ogc:SpatialOperator name="Crosses"/>
    	<ogc:SpatialOperator name="Contains"/>
    	<ogc:SpatialOperator name="Overlaps"/>
    	<ogc:SpatialOperator name="BBOX"/>
    </ogc:SpatialOperators>
    </ogc:Spatial_Capabilities>
    <ogc:Scalar_Capabilities>
    <ogc:LogicalOperators/>
    <ogc:ComparisonOperators>
    	<ogc:ComparisonOperator>LessThan</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>GreaterThan</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>LessThanEqualTo</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>GreaterThanEqualTo</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>EqualTo</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>NotEqualTo</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>Like</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>Between</ogc:ComparisonOperator>
    	<ogc:ComparisonOperator>NullCheck</ogc:ComparisonOperator>
    </ogc:ComparisonOperators>
    <ogc:ArithmeticOperators>
    	<ogc:SimpleArithmetic/>
    	<ogc:Functions>
    	<ogc:FunctionNames>
    		<ogc:FunctionName nArgs="1">abs</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">abs_2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">abs_3</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">abs_4</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">acos</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">area</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">asin</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">atan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">atan2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">between</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">boundary</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">boundaryDimension</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">buffer</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">bufferWithSegments</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">Categorize</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">ceil</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">centroid</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">classify</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Average</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Bounds</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Count</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Max</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Median</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Min</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Sum</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">Collection_Unique</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">Concatenate</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">contains</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">convert</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">convexHull</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">cos</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">crosses</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">dateFormat</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">dateParse</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">difference</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">dimension</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">disjoint</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">distance</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">double2bool</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">endAngle</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">endPoint</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">env</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">envelope</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">EqualInterval</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">equalsExact</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">equalsExactTolerance</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">equalTo</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">exp</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">exteriorRing</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">floor</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">geometryType</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">geomFromWKT</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">geomLength</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">getGeometryN</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">getX</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">getY</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">getZ</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">greaterEqualThan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">greaterThan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">id</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">IEEEremainder</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">if_then_else</ogc:FunctionName>
    		<ogc:FunctionName nArgs="11">in10</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">in2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="4">in3</ogc:FunctionName>
    		<ogc:FunctionName nArgs="5">in4</ogc:FunctionName>
    		<ogc:FunctionName nArgs="6">in5</ogc:FunctionName>
    		<ogc:FunctionName nArgs="7">in6</ogc:FunctionName>
    		<ogc:FunctionName nArgs="8">in7</ogc:FunctionName>
    		<ogc:FunctionName nArgs="9">in8</ogc:FunctionName>
    		<ogc:FunctionName nArgs="10">in9</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">int2bbool</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">int2ddouble</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">interiorPoint</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">interiorRingN</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">Interpolate</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">intersection</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">intersects</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isClosed</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isEmpty</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">isLike</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isNull</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">isometric</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isRing</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isSimple</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">isValid</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">isWithinDistance</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">Jenks</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">length</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">lessEqualThan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">lessThan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">log</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">max</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">max_2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">max_3</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">max_4</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">min</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">min_2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">min_3</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">min_4</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">not</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">notEqualTo</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">numberFormat</ogc:FunctionName>
    		<ogc:FunctionName nArgs="5">numberFormat2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">numGeometries</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">numInteriorRing</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">numPoints</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">offset</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">overlaps</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">parseBoolean</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">parseDouble</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">parseInt</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">parseLong</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">pi</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">pointN</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">pow</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">PropertyExists</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">Quantile</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">random</ogc:FunctionName>
    		<ogc:FunctionName nArgs="0">Recode</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">relate</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">relatePattern</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">rint</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">round</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">round_2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">roundDouble</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">sin</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">sqrt</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">StandardDeviation</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">startAngle</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">startPoint</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">strCapitalize</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strConcat</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strEndsWith</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strEqualsIgnoreCase</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strIndexOf</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strLastIndexOf</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">strLength</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strMatches</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">strPosition</ogc:FunctionName>
    		<ogc:FunctionName nArgs="4">strReplace</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strStartsWith</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">strSubstring</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">strSubstringStart</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">strToLowerCase</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">strToUpperCase</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">strTrim</ogc:FunctionName>
    		<ogc:FunctionName nArgs="3">strTrim2</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">symDifference</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">tan</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">toDegrees</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">toRadians</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">touches</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">toWKT</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">union</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">UniqueInterval</ogc:FunctionName>
    		<ogc:FunctionName nArgs="1">vertices</ogc:FunctionName>
    		<ogc:FunctionName nArgs="2">within</ogc:FunctionName>
    	</ogc:FunctionNames>
    </ogc:Functions>
    </ogc:ArithmeticOperators>
    </ogc:Scalar_Capabilities>
    <ogc:Id_Capabilities>
    	<ogc:FID/>
    	<ogc:EID/>
    </ogc:Id_Capabilities>
    </ogc:Filter_Capabilities>
  </wfs:WFS_Capabilities>