package org.OpenGeoPortal.Download.Methods;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class Wcs1_1_1DownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Boolean INCLUDES_METADATA = false;

	public String createDownloadRequest() throws Exception {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
    	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user 

		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		String layerName = this.currentLayer.getLayerNameNS();

		Map<String, String> describeLayerInfo = getWcsDescribeLayerInfo();
		String epsgCode = describeLayerInfo.get("SRS");
		String domainSubset = "";

		//wcs requires this info, even for full extent
			String gmlLow = describeLayerInfo.get("gridEnvelopeLow");
			String gmlHigh = describeLayerInfo.get("gridEnvelopeHigh");
			String axes = "";
			if (describeLayerInfo.containsKey("axis1")){
				axes += "<gml:axisName>";
				axes += describeLayerInfo.get("axis1");
				axes += "</gml:axisName>";
				if (describeLayerInfo.containsKey("axis2")){
					axes += "<gml:axisName>";
					axes += describeLayerInfo.get("axis2");
					axes += "</gml:axisName>";
				}
			}
			domainSubset = "<domainSubset>"
				+				"<spatialSubset>"
				+					bounds.generateGMLEnvelope(4326)
				+					"<gml:Grid dimension=\"2\">"
				+						"<gml:limits>"
				+							"<gml:GridEnvelope>"
				+								"<gml:low>" + gmlLow + "</gml:low>"
				+                				"<gml:high>" + gmlHigh + "</gml:high>"
				+							"</gml:GridEnvelope>"
				+						"</gml:limits>"
				+						axes
				+					"</gml:Grid>"
				+				"</spatialSubset>"
				+			"</domainSubset>";
		
		String format = "GeoTIFF";

		String getCoverageRequest = "<GetCoverage service=\"WCS\" version=\"1.0.0\" "
			+  "xmlns=\"http://www.opengis.net/wcs\" "
	  		+  "xmlns:ogc=\"http://www.opengis.net/ogc\" "
	  		+  "xmlns:gml=\"http://www.opengis.net/gml\" " 
	  		+  "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " 
	  		+  "xsi:schemaLocation=\"http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/getCoverage.xsd\">"
			+		"<sourceCoverage>" + layerName + "</sourceCoverage>"
			+ 		domainSubset
			+		"<output>"
		    +			"<crs>" + epsgCode + "</crs>"
			+			"<format>" + format + "</format>"
			+		"</output>"
			+	"</GetCoverage>";
			
		
		
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
    	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
		//in order to return the file in original projection to the user 

		/* get coverage 1.1.1 request example
		 * <?xml version="1.0" encoding="UTF-8"?>*/
		/*String getCoverageRequest = "<GetCoverage version=\"1.1.1\" service=\"WCS\" " +
				"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
				"xmlns=\"http://www.opengis.net/wcs/1.1.1\" " +
				"xmlns:ows=\"http://www.opengis.net/ows/1.1\" " +
				"xmlns:gml=\"http://www.opengis.net/gml\" " +
				"xmlns:ogc=\"http://www.opengis.net/ogc\" " +
				"xsi:schemaLocation=\"http://www.opengis.net/wcs/1.1.1 http://schemas.opengis.net/wcs/1.1.1/wcsAll.xsd\">" +
				"<ows:Identifier>sde:GISPORTAL.GISOWNER01.LANDINFO_K01C</ows:Identifier>" +
				"<DomainSubset>" +
					"<ows:BoundingBox crs=\"urn:ogc:def:crs:EPSG::4326\">" +
						"<ows:LowerCorner>8.0 -11.0</ows:LowerCorner>" +
						"<ows:UpperCorner>12.0 -5.0</ows:UpperCorner>" +
					"</ows:BoundingBox>" +
				"</DomainSubset>" +
				"<Output store=\"true\" format=\"image/tiff\">" +
					"<GridCRS>" +
						"<GridBaseCRS>urn:ogc:def:crs:EPSG::4326</GridBaseCRS>" +
						"<GridType>urn:ogc:def:method:WCS:1.1:2dSimpleGrid</GridType>" +
						"<GridOffsets>4.495392222971454E-4 -4.495392222971454E-4</GridOffsets>" +
						"<GridCS>urn:ogc:def:cs:OGC:0.0:Grid2dSquareCS</GridCS>" +
					"</GridCRS>" +
				"</Output>" +
			"</GetCoverage>";
		 */


		return getCoverageRequest;	 
	}
	
	@Override
	public String getUrl(){
		return this.currentLayer.getWcsUrl();
	};
	
	private Map<String, String> getWcsDescribeLayerInfo()
		 	throws Exception
		 {
			//should be xml
			//do this later....
			/*DocumentFragment requestXML = createDocumentFragment();
			// Insert the root element node
			Element rootElement = requestXML.createElement("DescribeFeatureType");
			requestXML.appendChild(rootElement);*/
			/*returned xml for 1.1.1 request
			 * 
	      <wcs:CoverageDescriptions xsi:schemaLocation="http://geoserver-dev.atech.tufts.edu:80/schemas/wcs/1.1.1/wcsDescribeCoverage.xsd">
	      <wcs:CoverageDescription><ows:Title>GISPORTAL.GISOWNER01.LANDINFO_K01C</ows:Title><ows:Abstract>Generated from ArcSDE Raster</ows:Abstract>
	      <ows:Keywords><ows:Keyword>WCS</ows:Keyword><ows:Keyword>ArcSDE Raster</ows:Keyword><ows:Keyword>GISPORTAL.GISOWNER01.LANDINFO_K01C</ows:Keyword>
	      </ows:Keywords><wcs:Identifier>sde:GISPORTAL.GISOWNER01.LANDINFO_K01C</wcs:Identifier><wcs:Domain><wcs:SpatialDomain>
	      <ows:BoundingBox crs="urn:ogc:def:crs:OGC:1.3:CRS84" dimensions="2">
	      <ows:LowerCorner>-11.0 8.0</ows:LowerCorner><ows:UpperCorner>-5.0 12.0</ows:UpperCorner></ows:BoundingBox>
	      <ows:BoundingBox crs="urn:ogc:def:crs:EPSG::4326" dimensions="2">
	      <ows:LowerCorner>8.0 -11.0</ows:LowerCorner><ows:UpperCorner>12.0 -5.0</ows:UpperCorner></ows:BoundingBox>
	      <wcs:GridCRS><wcs:GridBaseCRS>urn:ogc:def:crs:EPSG::4326</wcs:GridBaseCRS>
	      <wcs:GridType>urn:ogc:def:method:WCS:1.1:2dGridIn2dCrs</wcs:GridType><wcs:GridOrigin>-10.999550448428494 11.999550456848008</wcs:GridOrigin>
	      <wcs:GridOffsets>4.4953472869180695E-4 0.0 0.0 -4.4951788966269695E-4</wcs:GridOffsets><wcs:GridCS>urn:ogc:def:cs:OGC:0.0:Grid2dSquareCS</wcs:GridCS></wcs:GridCRS>
	      </wcs:SpatialDomain></wcs:Domain><wcs:Range><wcs:Field><wcs:Identifier>contents</wcs:Identifier><wcs:Definition><ows:AllowedValues>
	      <ows:Range><ows:MinimumValue>0.0</ows:MinimumValue><ows:MaximumValue>254.0</ows:MaximumValue></ows:Range></ows:AllowedValues>
	      </wcs:Definition><wcs:InterpolationMethods><wcs:InterpolationMethod>nearest</wcs:InterpolationMethod><wcs:InterpolationMethod>linear</wcs:InterpolationMethod>
	      <wcs:InterpolationMethod>cubic</wcs:InterpolationMethod><wcs:Default>nearest neighbor</wcs:Default></wcs:InterpolationMethods>
	      <wcs:Axis identifier="Bands"><wcs:AvailableKeys><wcs:Key>Band_1</wcs:Key></wcs:AvailableKeys></wcs:Axis></wcs:Field></wcs:Range>
		  <wcs:SupportedCRS>urn:ogc:def:crs:EPSG::4326</wcs:SupportedCRS><wcs:SupportedCRS>EPSG:4326</wcs:SupportedCRS>
		  <wcs:SupportedFormat>application/gtopo30</wcs:SupportedFormat><wcs:SupportedFormat>application/arcgrid</wcs:SupportedFormat>
		  <wcs:SupportedFormat>image/gif</wcs:SupportedFormat><wcs:SupportedFormat>image/png</wcs:SupportedFormat><wcs:SupportedFormat>image/jpeg</wcs:SupportedFormat>
		  <wcs:SupportedFormat>image/tiff</wcs:SupportedFormat><wcs:SupportedFormat>image/tiff;subtype="geotiff"</wcs:SupportedFormat></wcs:CoverageDescription>
		  </wcs:CoverageDescriptions>
			 */
			String layerName = this.currentLayer.getLayerNameNS();
			 String describeCoverageRequest = "SERVICE=WCS&VERSION=1.1.1&REQUEST=DescribeCoverage&IDENTIFIERS=" + layerName;

			 InputStream inputStream = this.httpRequester.sendRequest(this.currentLayer.getWcsUrl(), describeCoverageRequest, "GET");
			//parse the returned XML and return needed info as a map
			// Create a factory
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			// Use document builder factory
			DocumentBuilder builder = factory.newDocumentBuilder();
			//Parse the document
			Document document = builder.parse(inputStream);
			//initialize return variable
			Map<String, String> describeLayerInfo = new HashMap<String, String>();

			//get the needed nodes
			Node schemaNode = document.getFirstChild();
			if (schemaNode.getNodeName().equals("ServiceExceptionReport")){
				String errorMessage = "";
				for (int i = 0; i < schemaNode.getChildNodes().getLength(); i++){
					String nodeName = schemaNode.getChildNodes().item(i).getNodeName();
					if (nodeName.equals("ServiceException")){
						errorMessage += schemaNode.getChildNodes().item(i).getTextContent().trim();
					}
				}
				throw new Exception("ServiceException: " + errorMessage);
			}

			try{
				NodeList supportedCRSs = document.getElementsByTagName("wcs:supportedCRS");
				//NodeList supportedCRSs = document.getElementsByTagName("wcs:requestResponseCRSs");
				describeLayerInfo.put("SRS", supportedCRSs.item(0).getTextContent().trim());
				NodeList gridEnvelopeLow = document.getElementsByTagName("gml:low");
				describeLayerInfo.put("gridEnvelopeLow", gridEnvelopeLow.item(0).getTextContent().trim());
				NodeList gridEnvelopeHigh = document.getElementsByTagName("gml:high");
				describeLayerInfo.put("gridEnvelopeHigh", gridEnvelopeHigh.item(0).getTextContent().trim());
				NodeList axes = document.getElementsByTagName("gml:axisName");
				axes.getLength();
				for (int i = 0; i < axes.getLength(); i++){
					describeLayerInfo.put("axis" + i, axes.item(i).getTextContent().trim());
				}
				//NodeList supportedFormats = document.getElementsByTagName("wcs:supportedFormats");
				//NodeList supportedFormats = document.getElementsByTagName("wcs:supportedCRS");
				//describeLayerInfo.put("nativeFormat", supportedFormats.item(0).getTextContent().trim());
			} catch (Exception e){
				throw new Exception("error getting layer info: "+ e.getMessage());
			}
			return describeLayerInfo;
			 
		 }

	 void handleServiceException(Node schemaNode) throws Exception{
			String errorMessage = "";
			for (int i = 0; i < schemaNode.getChildNodes().getLength(); i++){
				String nodeName = schemaNode.getChildNodes().item(i).getNodeName();
				if (nodeName.equals("ServiceException")){
					errorMessage += schemaNode.getChildNodes().item(i).getTextContent().trim();
				}
			}
			throw new Exception(errorMessage);
	 }
	 
		@Override
		public Boolean includesMetadata() {
			return INCLUDES_METADATA;
		}


}
