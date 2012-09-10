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

public class WcsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
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
			
		return getCoverageRequest;	 
	}
	
	@Override
	public String getUrl(){
		return this.currentLayer.getWcsUrl();
	};
	
	 Map<String, String> getWcsDescribeLayerInfo()
	 	throws Exception
	 {
			//should be xml
			//do this later....
			/*DocumentFragment requestXML = createDocumentFragment();
			// Insert the root element node
			Element rootElement = requestXML.createElement("DescribeFeatureType");
			requestXML.appendChild(rootElement);*/
			String layerName = this.currentLayer.getLayerNameNS();
			 String describeCoverageRequest = "<DescribeCoverage"
				 + " version=\"1.0.0\""
				 + " service=\"WCS\""
				 + " xmlns=\"http://www.opengis.net/wcs\""
				 + " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
				 + " xsi:schemaLocation=\"http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/describeCoverage.xsd\">"
				 +   "<Coverage>" + layerName + "</Coverage>"  
				 + "</DescribeCoverage>";

			InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(), describeCoverageRequest, "POST");
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
				//NodeList supportedCRSs = document.getElementsByTagName("wcs:supportedCRS");
				NodeList supportedCRSs = document.getElementsByTagName("wcs:requestResponseCRSs");
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
