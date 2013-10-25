package org.opengeoportal.ogc.wcs.wcs1_0_0;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.opengeoportal.layer.Envelope;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.OwsInfo.OwsProtocol;
import org.opengeoportal.utilities.OgpXmlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class WcsDescribeCoverage1_0_0 implements OgcInfoRequest {
	final static Logger logger = LoggerFactory.getLogger(WcsDescribeCoverage1_0_0.class.getName());

	String layerName;
	public final String VERSION = "1.0.0";
	
	@Override
	public String createRequest(String layerName) {
		String describeCoverageRequest = "service=WCS&version=" + VERSION + "&REQUEST=DescribeCoverage&Coverage=" + layerName;
		this.layerName = layerName;
		return describeCoverageRequest;
	}


	public static Envelope parseLonLatEnvelope(Node lonLatEnvelopeNode){
		/* <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
		 * <gml:pos>-180.00000000000003 -89.99999999999996</gml:pos><gml:pos>180.00072000000003 90.00036000000007</gml:pos></wcs:lonLatEnvelope>
		 */
		Node srsAttribute = lonLatEnvelopeNode.getAttributes().getNamedItem("srsName");
		String srsName = srsAttribute.getNodeValue();
		logger.info("srs: " + srsName);
		NodeList gmlNodes = lonLatEnvelopeNode.getChildNodes();
		List<String> x = new ArrayList<String>();
		List<String> y = new ArrayList<String>();

		for (int i = 0 ; i < gmlNodes.getLength(); i++){
			Node currentNode = gmlNodes.item(i);
			if (currentNode.getLocalName().equalsIgnoreCase("pos")){
				String points = currentNode.getTextContent().trim();
				logger.info("points: " + points);
				String[] pointArr = points.split(" ");
				logger.info("x" + pointArr[0]);
				logger.info("y" + pointArr[1]);

				x.add(pointArr[0]); 
				y.add(pointArr[1]);
			}
		}
		Double minX = Math.min(Double.parseDouble(x.get(0)), Double.parseDouble(x.get(1)));
		Double minY = Math.min(Double.parseDouble(y.get(0)), Double.parseDouble(y.get(1)));

		Double maxX = Math.max(Double.parseDouble(x.get(0)), Double.parseDouble(x.get(1)));
		Double maxY = Math.max(Double.parseDouble(y.get(0)), Double.parseDouble(y.get(1)));

		return new Envelope(minX, minY, maxX, maxY, srsName);

	}
	
	public static List<String> parseKeywords(Node keywordsNode){

		NodeList keywordNodes = keywordsNode.getChildNodes();
		List<String> keywords = new ArrayList<String>();
		
		for (int i = 0 ; i < keywordNodes.getLength(); i++){
			Node currentNode = keywordNodes.item(i);
			if (currentNode.getLocalName().equalsIgnoreCase("keyword")){
				keywords.add(currentNode.getTextContent().trim());
			}
		}
		
		return keywords;
	}
	
	public static RectifiedGrid parseRectifiedGrid(Node rgNode){
		 /* 			<gml:origin><gml:pos>-179.75 89.75</gml:pos></gml:origin>
		 * 			<gml:offsetVector>0.5 0.0</gml:offsetVector><gml:offsetVector>0.0 -0.5</gml:offsetVector>
		 */
		RectifiedGrid rectGrid = new RectifiedGrid();
		
		NamedNodeMap attributes = rgNode.getAttributes();
		rectGrid.setDimension(Integer.parseInt(attributes.getNamedItem("dimension").getNodeValue()));
		rectGrid.setSrsName(attributes.getNamedItem("srsName").getNodeValue());
		
		
		NodeList rgNodes = rgNode.getChildNodes();
		List<String> axes = new ArrayList<String>();
		List<String> offsetVectors = new ArrayList<String>();

		for (int i = 0 ; i < rgNodes.getLength(); i++){
			Node currentNode = rgNodes.item(i);
			String currentTag = currentNode.getLocalName();
			if (currentTag.equalsIgnoreCase("axisName")){
				axes.add(currentNode.getTextContent().trim());
			} else if (currentTag.equalsIgnoreCase("limits")){
				Set<String> envTags = new HashSet<String>();
				envTags.add("low");
				envTags.add("high");
				Map<String, String> limits = OgpXmlUtils.getDesiredChildrenValues(currentNode.getFirstChild(), envTags);
				String[] lowArr = limits.get("low").split(" ");
				String[] highArr = limits.get("high").split(" ");
				int width = Math.abs(Integer.parseInt(lowArr[0]) - Integer.parseInt(highArr[0]));
				int height = Math.abs(Integer.parseInt(lowArr[1]) - Integer.parseInt(highArr[1]));
				logger.info(Integer.toString(height) + " " + Integer.toString(width));
				rectGrid.setHeight(height);
				rectGrid.setWidth(width);
			} else if (currentTag.equalsIgnoreCase("offsetVector")){
				offsetVectors.add(currentNode.getTextContent().trim());
			} else if (currentTag.equals("origin")){
				//nothing for now
			} 
		}
		String osVector1 =offsetVectors.get(0);
		String[] values1 = osVector1.split(" ");
		
		String osVector2 =offsetVectors.get(1);
		String[] values2 = osVector2.split(" ");
		
		Double resx = Math.abs(Double.parseDouble(values1[0]) - Double.parseDouble(values2[0]));
		Double resy = Math.abs(Double.parseDouble(values1[1]) - Double.parseDouble(values2[1]));
		rectGrid.setResx(resx);
		rectGrid.setResy(resy);
		
		rectGrid.setAxisName(axes);
		return rectGrid;
	} 
	
	public static List<String> parseSupportedCrs(Node crsNode){
		return OgpXmlUtils.getChildValuesList(crsNode, "requestResponseCRSs");
	}
	
	public static List<String> parseSupportedFormats(Node formatNode){
		return OgpXmlUtils.getChildValuesList(formatNode, "formats");
	}
	
	public static List<String> parseSupportedInterpolations(Node interpNode){
		return OgpXmlUtils.getChildValuesList(interpNode, "interpolationMethod");
	}
	
	@Override
	public OwsInfo parseResponse(InputStream inputStream) throws Exception {

		//Parse the document
		Document document = OgpXmlUtils.getDocument(inputStream);
		//initialize return variable
		//Map<String, String> describeLayerInfo = new HashMap<String, String>();
		//get the needed nodes
		Node schemaNode = document.getFirstChild();
		OgpXmlUtils.handleServiceException(schemaNode);
		

		/*
		 * <wcs:CoverageOffering>
		 * <wcs:description>Generated from GeoTIFF</wcs:description>
		 * <wcs:name>AQUASTAT:aridity_37040</wcs:name>
		 * <wcs:label>Global map of aridity - 10 arc minutes</wcs:label>
		 * <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
		 * <gml:pos>-180.00000000000003 -89.99999999999996</gml:pos><gml:pos>180.00072000000003 90.00036000000007</gml:pos></wcs:lonLatEnvelope>
		 * <wcs:keywords><wcs:keyword>WCS</wcs:keyword><wcs:keyword>GeoTIFF</wcs:keyword><wcs:keyword>aridity_37040</wcs:keyword></wcs:keywords>
		 * <wcs:domainSet><wcs:spatialDomain><gml:Envelope srsName="EPSG:4326"><gml:pos>-180.00000000000003 -89.99999999999996</gml:pos><gml:pos>180.00072000000003 90.00036000000007</gml:pos></gml:Envelope>
		 * 	<gml:RectifiedGrid dimension="2" srsName="EPSG:4326"><gml:limits><gml:GridEnvelope><gml:low>0 0</gml:low><gml:high>2159 1079</gml:high></gml:GridEnvelope></gml:limits><gml:axisName>x</gml:axisName><gml:axisName>y</gml:axisName>
		 * <gml:origin><gml:pos>-179.91666650000002 89.91702650000008</gml:pos></gml:origin><gml:offsetVector>0.16666700000000004 0.0</gml:offsetVector><gml:offsetVector>0.0 -0.16666700000000004</gml:offsetVector></gml:RectifiedGrid>
		 * </wcs:spatialDomain></wcs:domainSet>
		 * <wcs:rangeSet><wcs:RangeSet><wcs:name>aridity_37040</wcs:name><wcs:label>Global map of aridity - 10 arc minutes</wcs:label>
		 * <wcs:axisDescription><wcs:AxisDescription><wcs:name>Band</wcs:name><wcs:label>Band</wcs:label><wcs:values><wcs:singleValue>1</wcs:singleValue></wcs:values></wcs:AxisDescription></wcs:axisDescription></wcs:RangeSet></wcs:rangeSet>
		 * <wcs:supportedCRSs><wcs:requestResponseCRSs>EPSG:4326</wcs:requestResponseCRSs></wcs:supportedCRSs>
		 * <wcs:supportedFormats nativeFormat="GeoTIFF"><wcs:formats>GeoTIFF</wcs:formats><wcs:formats>GIF</wcs:formats><wcs:formats>JPEG</wcs:formats><wcs:formats>PNG</wcs:formats><wcs:formats>TIFF</wcs:formats></wcs:supportedFormats>
		 * <wcs:supportedInterpolations><wcs:interpolationMethod>bilinear</wcs:interpolationMethod><wcs:interpolationMethod>bicubic</wcs:interpolationMethod></wcs:supportedInterpolations></wcs:CoverageOffering>
		 * 
		 * 
		 * 
		 * 
		 */
		NodeList coverageOfferings = document.getElementsByTagName("wcs:CoverageOffering");
		Node desiredNode = null;
		if (coverageOfferings.getLength() > 1){
			for (int i = 0 ; i < coverageOfferings.getLength(); i++){
				Node currentCoverage = coverageOfferings.item(i);
				NodeList currentChildren = currentCoverage.getChildNodes();
				for (int j = 0; j < currentChildren.getLength(); j++){
					Node currentChild = currentChildren.item(j);
					if (currentChild.getNodeName().equalsIgnoreCase("wcs:name")){
						if (currentChild.getTextContent().contains(layerName)){
							desiredNode = currentCoverage;
							break;
						}
					}
				}
				if (desiredNode != null){
					break;
				}
			}
		} else {
			desiredNode = coverageOfferings.item(0);
		}
		
		NodeList layerDetails = desiredNode.getChildNodes();
		
		CoverageOffering1_0_0 coverageOffering = new CoverageOffering1_0_0();
		for (int k = 0; k < layerDetails.getLength(); k++){
			Node currentDetail = layerDetails.item(k);
			String nodeName = currentDetail.getLocalName();
			logger.info("localName: " + nodeName);
			if (nodeName.equalsIgnoreCase("name")){
				String name = currentDetail.getTextContent().trim();
				logger.info(name);
				coverageOffering.setName(name);
			} else if (nodeName.equalsIgnoreCase("description")){
				String description = currentDetail.getTextContent().trim();
				logger.info(description);
				coverageOffering.setDescription(description);
			} else if (nodeName.equalsIgnoreCase("label")){
				String label = currentDetail.getTextContent().trim();
				logger.info(label);
				coverageOffering.setLabel(label);
			} else if (nodeName.equalsIgnoreCase("lonLatEnvelope")){
				coverageOffering.setLonLatEnvelope(parseLonLatEnvelope(currentDetail));
			} else if (nodeName.equalsIgnoreCase("keywords")){
				coverageOffering.setKeywords(parseKeywords(currentDetail));
			} else if (nodeName.equalsIgnoreCase("domainSet")){
				Node sdNode = OgpXmlUtils.getChildNode(currentDetail, "spatialDomain");
				Node rgNode = OgpXmlUtils.getChildNode(sdNode, "RectifiedGrid");
				coverageOffering.setRectifiedGrid(parseRectifiedGrid(rgNode));
			} else if (nodeName.equalsIgnoreCase("rangeSet")){
				// 
			} else if (nodeName.equalsIgnoreCase("supportedCRSs")){
				coverageOffering.setSupportedCRSs(parseSupportedCrs(currentDetail));
			} else if (nodeName.equalsIgnoreCase("supportedFormats")){
				coverageOffering.setNativeFormat(OgpXmlUtils.getAttribute(currentDetail, "nativeFormat"));
				coverageOffering.setSupportedFormats(parseSupportedFormats(currentDetail));
			} else if (nodeName.equalsIgnoreCase("supportedInterpolations")){				
				coverageOffering.setDefaultInterpolation(OgpXmlUtils.getAttribute(currentDetail, "default"));
				coverageOffering.setSupportedInterpolations(parseSupportedInterpolations(currentDetail));
			}
			
		}
		//needed to form WCS getCoverage request
		// wcs:domainSet/wcs:spatialDomain/gml:RectifiedGrid/gml:limits/gml:GridEnvelope/gml:low & gml:high
		// wcs:domainSet/wcs:spatialDomain/gml:RectifiedGrid/gml:axisName (multiple)
		// wcs:supportedCRSs/wcs:requestResponseCRSs
		/*
		 * 
		 * <wcs:CoverageOffering>
		 * <wcs:description>Generated from GeoTIFF</wcs:description>
		 * <wcs:name>GEONETWORK:etref_may_5017</wcs:name>
		 * <wcs:label>Global map of montly reference evapotranspiration - 30 arc-min</wcs:label>
		 * <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84"><gml:pos>-180.0 -90.0</gml:pos><gml:pos>180.0 90.0</gml:pos></wcs:lonLatEnvelope>
		 * <wcs:keywords><wcs:keyword>WCS</wcs:keyword><wcs:keyword>GeoTIFF</wcs:keyword><wcs:keyword>etref_may_5017</wcs:keyword></wcs:keywords>
		 * ***location and time info
		 * <wcs:domainSet>
		 * 	<wcs:spatialDomain><gml:Envelope srsName="EPSG:4326"><gml:pos>-180.0 -90.0</gml:pos><gml:pos>180.0 90.0</gml:pos></gml:Envelope>
		 * 		<gml:RectifiedGrid dimension="2" srsName="EPSG:4326"><gml:limits><gml:GridEnvelope><gml:low>0 0</gml:low><gml:high>719 359</gml:high></gml:GridEnvelope></gml:limits><gml:axisName>x</gml:axisName><gml:axisName>y</gml:axisName>
		 * 			<gml:origin><gml:pos>-179.75 89.75</gml:pos></gml:origin>
		 * 			<gml:offsetVector>0.5 0.0</gml:offsetVector><gml:offsetVector>0.0 -0.5</gml:offsetVector>
		 * 		</gml:RectifiedGrid>
		 * 	</wcs:spatialDomain>
		 * </wcs:domainSet>
		 * "band" info
		 * <wcs:rangeSet><wcs:RangeSet><wcs:name>etref_may_5017</wcs:name><wcs:label>Global map of montly reference evapotranspiration - 30 arc-min</wcs:label>
		 * <wcs:axisDescription><wcs:AxisDescription><wcs:name>Band</wcs:name><wcs:label>Band</wcs:label><wcs:values><wcs:singleValue>1</wcs:singleValue></wcs:values></wcs:AxisDescription></wcs:axisDescription></wcs:RangeSet>
		 * </wcs:rangeSet>
		 * 
		 * supported crss
		 * <wcs:supportedCRSs><wcs:requestResponseCRSs>EPSG:4326</wcs:requestResponseCRSs></wcs:supportedCRSs>
		 * 
		 * supported formats
		 * <wcs:supportedFormats nativeFormat="GeoTIFF">
		 * 	<wcs:formats>ArcGrid</wcs:formats>
		 * 	<wcs:formats>GeoTIFF</wcs:formats>
		 * 	<wcs:formats>GIF</wcs:formats>
		 * 	<wcs:formats>Gtopo30</wcs:formats>
		 * 	<wcs:formats>ImageMosaic</wcs:formats>
		 * 	<wcs:formats>JPEG</wcs:formats>
		 * 	<wcs:formats>PNG</wcs:formats>
		 * 	<wcs:formats>TIFF</wcs:formats>
		 * </wcs:supportedFormats>
		 * 
		 * interpolations
		 * <wcs:supportedInterpolations default="nearest neighbor"><wcs:interpolationMethod>nearest neighbor</wcs:interpolationMethod><wcs:interpolationMethod>bilinear</wcs:interpolationMethod><wcs:interpolationMethod>bicubic</wcs:interpolationMethod></wcs:supportedInterpolations>
		 * 
		 * </wcs:CoverageOffering>
		 * 
		 * 
		 * 
		 * 
		 */

		OwsInfo owsResponse = new OwsInfo();
		owsResponse.setOwsProtocol(OwsProtocol.parseOwsProtocol(this.getOgcProtocol()));
		owsResponse.setOwsDescribeInfo(coverageOffering);
		
		return owsResponse;
	}

	@Override
	public String getMethod() {
		return "GET";
	}

	@Override
	public String getOgcProtocol() {
		return "wcs";
	}



	@Override
	public String getVersion() {
		return VERSION;
	}

}
