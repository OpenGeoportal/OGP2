package org.opengeoportal.ogc.wcs;

import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.OwsInfo.OwsProtocol;
import org.opengeoportal.utilities.OgpXmlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class WcsDescribeCoverage1_1_1 implements OgcInfoRequest {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	public final String VERSION = "1.1.1";

	@Override
	public String createRequest(String layerName) {
		String describeCoverageRequest = "service=WCS&version=" + VERSION + "&REQUEST=DescribeCoverage&Identifiers=" + layerName;
		return describeCoverageRequest;
	}


	
	@Override
	public OwsInfo parseResponse(InputStream inputStream) throws Exception {

		//Parse the document
		Document document = OgpXmlUtils.getDocument(inputStream);
		//initialize return variable
		Map<String, String> describeLayerInfo = new HashMap<String, String>();

		//get the needed nodes
		Node schemaNode = document.getFirstChild();
		OgpXmlUtils.handleServiceException(schemaNode);
		

		/*
		 * 
		 * <wcs:CoverageDescriptions xsi:schemaLocation="http://data.fao.org/maps/schemas/wcs/1.1.1/wcsDescribeCoverage.xsd">
		 * <wcs:CoverageDescription>
		 * <ows:Title>Croplands with high rates of human-induced erosion</ows:Title>
		 * <ows:Abstract>Generated from GeoTIFF</ows:Abstract>
		 * <ows:Keywords><ows:Keyword>WCS</ows:Keyword><ows:Keyword>GeoTIFF</ows:Keyword><ows:Keyword>j_aghwer_31153</ows:Keyword></ows:Keywords>
		 * <wcs:Identifier>GEONETWORK:j_aghwer_31153</wcs:Identifier>
		 * <wcs:Domain><wcs:SpatialDomain><
		 * ows:BoundingBox crs="urn:ogc:def:crs:OGC:1.3:CRS84" dimensions="2"><ows:LowerCorner>-180.0 -89.9999999999999</ows:LowerCorner><ows:UpperCorner>179.99999855999994 89.99999928000007</ows:UpperCorner></ows:BoundingBox>
		 * <ows:BoundingBox crs="urn:ogc:def:crs:EPSG::4326" dimensions="2"><ows:LowerCorner>-89.9999999999999 -180.0</ows:LowerCorner><ows:UpperCorner>89.99999928000007 179.99999855999994</ows:UpperCorner></ows:BoundingBox>
		 * <wcs:GridCRS><wcs:GridBaseCRS>urn:ogc:def:crs:EPSG::4326</wcs:GridBaseCRS><wcs:GridType>urn:ogc:def:method:WCS:1.1:2dGridIn2dCrs</wcs:GridType><wcs:GridOrigin>-179.9583333335 89.95833261350006</wcs:GridOrigin><wcs:GridOffsets>0.08333333299999998 0.0 0.0 -0.08333333299999998</wcs:GridOffsets><wcs:GridCS>urn:ogc:def:cs:OGC:0.0:Grid2dSquareCS</wcs:GridCS></wcs:GridCRS>
		 * </wcs:SpatialDomain></wcs:Domain>
		 * <wcs:Range><wcs:Field><wcs:Identifier>contents</wcs:Identifier><wcs:Definition><ows:AllowedValues>
		 * <ows:Range><ows:MinimumValue>255.0</ows:MinimumValue><ows:MaximumValue>255.0</ows:MaximumValue></ows:Range>
		 * </ows:AllowedValues></wcs:Definition><wcs:NullValue>255.0</wcs:NullValue>
		 * <wcs:InterpolationMethods><wcs:InterpolationMethod>nearest</wcs:InterpolationMethod><wcs:InterpolationMethod>linear</wcs:InterpolationMethod><wcs:InterpolationMethod>cubic</wcs:InterpolationMethod><wcs:Default>nearest neighbor</wcs:Default></wcs:InterpolationMethods>
		 * <wcs:Axis identifier="Bands"><wcs:AvailableKeys><wcs:Key>GRAY_INDEX</wcs:Key></wcs:AvailableKeys></wcs:Axis></wcs:Field></wcs:Range>
		 * <wcs:SupportedCRS>urn:ogc:def:crs:EPSG::4326</wcs:SupportedCRS><wcs:SupportedCRS>EPSG:4326</wcs:SupportedCRS>
		 * <wcs:SupportedFormat>application/arcgrid</wcs:SupportedFormat><wcs:SupportedFormat>image/tiff;subtype="geotiff"</wcs:SupportedFormat>
		 * <wcs:SupportedFormat>application/gtopo30</wcs:SupportedFormat><wcs:SupportedFormat>image/gif</wcs:SupportedFormat><wcs:SupportedFormat>image/png</wcs:SupportedFormat>
		 * <wcs:SupportedFormat>image/jpeg</wcs:SupportedFormat><wcs:SupportedFormat>image/tiff</wcs:SupportedFormat>
		 * </wcs:CoverageDescription></wcs:CoverageDescriptions>
		 * 
		 * <?xml version="1.0" encoding="UTF-8"?>
<GetCoverage version="1.1.1" service="WCS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wcs/1.1.1" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xsi:schemaLocation="http://www.opengis.net/wcs/1.1.1 http://schemas.opengis.net/wcs/1.1.1/wcsAll.xsd">
  <ows:Identifier>sde:GISPORTAL.GISOWNER01.LANDINFO_K01C</ows:Identifier>
  <DomainSubset>
    <ows:BoundingBox crs="urn:ogc:def:crs:EPSG::4326">
      <ows:LowerCorner>6.878935172242831 -11.12096492367308</ows:LowerCorner>
      <ows:UpperCorner>13.120805077124169 -4.879095018791742</ows:UpperCorner>
    </ows:BoundingBox>
  </DomainSubset>
  <Output store="true" format="image/tiff;subtype=&quot;geotiff&quot;">
    <GridCRS>
      <GridBaseCRS>urn:ogc:def:crs:EPSG::4326</GridBaseCRS>
      <GridType>urn:ogc:def:method:WCS:1.1:2dSimpleGrid</GridType>
      <GridOffsets>4.495405044927143E-4 -4.495405044927143E-4</GridOffsets>
      <GridCS>urn:ogc:def:cs:OGC:0.0:Grid2dSquareCS</GridCS>
    </GridCRS>
  </Output>
</GetCoverage>
		 * 
		 * 
		 */
		try{
			NodeList supportedCRSs = document.getElementsByTagName("wcs:SupportedCRS");
			//put all in a comma separated list
			describeLayerInfo.put("SRS", supportedCRSs.item(0).getTextContent().trim());
		} catch (Exception e){
			//throw new Exception("error getting SRS info: "+ e.getMessage());
			logger.error("error getting SRS info: "+ e.getMessage());

		}
		try {
			Set<String> desiredGridTags = new HashSet<String>();
			desiredGridTags.add("GridBaseCRS");
			desiredGridTags.add("GridType");
			desiredGridTags.add("GridOrigin");
			desiredGridTags.add("GridOffsets");
			desiredGridTags.add("GridCS");


			Node gridCrs = document.getElementsByTagName("wcs:GridCRS").item(0);
			describeLayerInfo.putAll(OgpXmlUtils.getDesiredChildrenValues(gridCrs, desiredGridTags));

		} catch (Exception e){
			//throw new Exception("error getting Grid Envelope info: "+ e.getMessage());
			logger.error("error getting Grid Envelope info: "+ e.getMessage());
		}
		OwsInfo owsResponse = new OwsInfo();
		owsResponse.setOwsProtocol(OwsProtocol.parseOwsProtocol(this.getOgcProtocol()));
		owsResponse.setInfoMap(describeLayerInfo);
		
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
