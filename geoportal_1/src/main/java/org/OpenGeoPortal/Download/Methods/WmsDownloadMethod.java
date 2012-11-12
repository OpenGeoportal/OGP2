package org.OpenGeoPortal.Download.Methods;

import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Layer.GeometryType;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class WmsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {	
	private static final Double MAX_AREA =  1800.0 * 1800.0;  //should be within recommended geoserver memory settings.
	private static final Boolean INCLUDES_METADATA = false;

	private static final String METHOD = "GET";

	@Override
	public String getMethod(){
		return METHOD;
	}
	
	@Override
	public Set<String> getExpectedContentType(){
		Set<String> expectedContentType = new HashSet<String>();
		expectedContentType.add("application/zip");
		return expectedContentType;
	}
	
	public String createDownloadRequest() throws Exception {
		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
	 	//all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
	 	//in order to return the file in original projection to the user (will also need to transform the bbox)
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		String layerName = this.currentLayer.getLayerNameNS();
		//for now we'll force wgs84.  we'll revisit if we need something different
		int epsgCode = 4326;
		/*
geoserver/wms?VERSION=1.3.0&REQUEST=GetMap&CRS=epsg:4326&BBOX=-90,-180,90,180&...

The format_options is a container for parameters that are format specific. The options in it are expressed as:

param1:value1;param2:value2;...

The currently recognized format options are:

    antialiasing (on, off, text): allows to control the use of antialiased rendering in raster outputs.
    dpi: sets the rendering dpi in raster outputs. The OGC standard dpi is 90, but if you need to perform 
    high resolution printouts it is advised to grab a larger image and set a higher dpi. For example, to 
    print at 300dpi a 100x100 image it is advised to ask for a 333x333 image setting the dpi value at 300. 
    In general the image size should be increased by a factor equal to targetDpi/90 and the target dpi set 
    in the format options.
			*/
		//height and width should be calculated based on the bounds
		Map<String,String> requestDimensions = this.calculateDimensions(bounds.getAspectRatio());
		
		String format = this.currentLayer.getRequestedFormat();
		if (format.toLowerCase().equals("geotiff")){
			format = "image/geotiff";
		}
		String getFeatureRequest = "VERSION=1.1.1&REQUEST=GetMap&SRS=epsg:" +
				epsgCode + "&BBOX=" + bounds.toString() + "&LAYERS=" + layerName +
				"&HEIGHT=" + requestDimensions.get("height") + "&WIDTH=" + requestDimensions.get("width") +
				"&FORMAT=" + format;
		if (!format.equals("kmz")){
			getFeatureRequest += "&TILED=no";
		} else {
			if (GeometryType.isVector(GeometryType.parseGeometryType(layerInfo.getDataType()))){
				getFeatureRequest += "&format_options=kmattr:true;kmscore:100;";
			} else {
				getFeatureRequest += "&format_options=kmattr:true;kmscore:0;";
			}
		}
    	return getFeatureRequest;
	}
	
	@Override
	public String getUrl(){
		return this.currentLayer.getWfsUrl();
	};
	
	 Map<String, String> getWfsDescribeLayerInfo()
	 	throws Exception
	 {
		// TODO should be xml
		/*DocumentFragment requestXML = createDocumentFragment();
		// Insert the root element node
		Element rootElement = requestXML.createElement("DescribeFeatureType");
		requestXML.appendChild(rootElement);*/
		String layerName = this.currentLayer.getLayerNameNS();
	 	String describeFeatureRequest = "<DescribeFeatureType"
	            + " version=\"1.0.0\""
	            + " service=\"WFS\""
	            + " xmlns=\"http://www.opengis.net/wfs\""
	            + " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
	            + " xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/wfs.xsd\">"
	            + 	"<TypeName>" + layerName + "</TypeName>"
	            + "</DescribeFeatureType>";

		InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(), describeFeatureRequest, "POST");
		System.out.println(this.httpRequester.getContentType());//check content type before doing any parsing of xml?

		//parse the returned XML and return needed info as a map
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		// Use document builder factory
		DocumentBuilder builder = factory.newDocumentBuilder();
		//Parse the document
		Document document = builder.parse(inputStream);
		//initialize return variable
		Map<String, String> describeLayerInfo = new HashMap<String, String>();

		//get the namespace info
		Node schemaNode = document.getFirstChild();
		if (schemaNode.getNodeName().equals("ServiceExceptionReport")){
			this.handleServiceException(schemaNode);
		}
		try {
			NamedNodeMap schemaAttributes = schemaNode.getAttributes();
			describeLayerInfo.put("nameSpace", schemaAttributes.getNamedItem("targetNamespace").getNodeValue());

			//we can get the geometry column name from here
			NodeList elementNodes = document.getElementsByTagName("xsd:element");
			for (int i = 0; i < elementNodes.getLength(); i++){
				Node currentNode = elementNodes.item(i);
				NamedNodeMap currentAttributeMap = currentNode.getAttributes();
				String attributeValue = null;
				for (int j = 0; j < currentAttributeMap.getLength(); j++){
					Node currentAttribute = currentAttributeMap.item(j);
					String currentAttributeName = currentAttribute.getNodeName();
					if (currentAttributeName.equals("name")){
						attributeValue = currentAttribute.getNodeValue();
					} else if (currentAttributeName.equals("type")){
						if (currentAttribute.getNodeValue().startsWith("gml:")){
							describeLayerInfo.put("geometryColumn", attributeValue);
							break;
						}
					}
				}
			}
			
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
	 
		private Map<String, String> calculateDimensions(Double aspectRatio){
			String requestWidth;
			String requestHeight;
			Double heightNumber = Math.sqrt(MAX_AREA / aspectRatio);
			requestHeight = Integer.toString((int) Math.round(heightNumber));
			requestWidth = Integer.toString((int) Math.round(MAX_AREA/heightNumber));
			Map<String,String>requestDimensions = new HashMap<String,String>();
			requestDimensions.put("height", requestHeight);
			requestDimensions.put("width", requestWidth);
			return requestDimensions;
		};
		
		@Override
		public Boolean includesMetadata() {
			return INCLUDES_METADATA;
		}

}
