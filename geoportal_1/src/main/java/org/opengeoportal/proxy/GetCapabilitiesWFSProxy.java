package org.opengeoportal.proxy;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.net.URL;
import java.net.URLDecoder;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
//import java.util.Map;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.springframework.web.HttpRequestHandler;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class GetCapabilitiesWFSProxy implements HttpRequestHandler {
	private GenericProxy genericProxy;
	//private OgpAuthenticator ogpAuthenticator;
	//private final String restrictedWMSServerUrl = "http://127.0.0.1:8580/wms";
	//private final String restrictedWMSServerUsername = "";
	//private final String restrictedWMSServerPassword = "";
	private LayerInfoRetriever layerInfoRetriever;
	private Document featureNodesDocument;
	String serverName = "http://geoserver01.uit.tufts.edu";
	String servicePoint = serverName + "/wfs";

	//this needs to handle authentication if supplied a username and password

	public void setGenericProxy(GenericProxy genericProxy) {
		this.genericProxy = genericProxy;
	}

	public LayerInfoRetriever getLayerInfoRetriever() {
		return layerInfoRetriever;
	}

	public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
		this.layerInfoRetriever = layerInfoRetriever;
	}

	public GenericProxy getGenericProxy() {
		return this.genericProxy;
	}

/*	public void setOgpAuthenticator(OgpAuthenticator ogpAuthenticator) {
		this.ogpAuthenticator = ogpAuthenticator;
	}

	public OgpAuthenticator getOgpAuthenticator() {
		return this.ogpAuthenticator;
	}
*/
	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		
		String version = null;
		String ogcRequest = null;
		//String service = null;
       	String layers = request.getParameter("OGPIDS");

		/* 
		 REQUEST
			GetCapabilities
			OGPIDS
		Tufts.SomervilleZoning10	
		VERSION
		1.0.0
		SERVICE
		WFS
		 */
		Enumeration<?> sentParams = request.getParameterNames();
       	while (sentParams.hasMoreElements()){
    		String currentParam = (String) sentParams.nextElement();
    		System.out.println(currentParam);
    		System.out.println(request.getParameter(currentParam));
    		if (currentParam.equalsIgnoreCase("version")){
    			version = request.getParameter(currentParam);
    		} else if (currentParam.equalsIgnoreCase("request")){
    			ogcRequest = request.getParameter(currentParam);
    		} else if (currentParam.equalsIgnoreCase("service")){
    			//service = request.getParameter(currentParam);
    		}	
    	}
       	
		Enumeration<?> requestHeaders = request.getHeaderNames();
       	while (requestHeaders.hasMoreElements()){
    		String currentHeader = (String) requestHeaders.nextElement();
    		System.out.println(currentHeader);
    		System.out.println(request.getHeader(currentHeader));
       	}
       	//if (true){
       	if ((ogcRequest.equalsIgnoreCase("DescribeFeatureType"))||(ogcRequest.equalsIgnoreCase("getfeature"))){
       		System.out.println("Redirecting to: http://geoserver01.uit.tufts.edu/wfs?" + request.getQueryString());
       		//doesn't work for qgis
       		response.setStatus(301);
       		String redirectUrl = "http://geoserver01.uit.tufts.edu/wfs?" + request.getQueryString();
       		response.setHeader( "Location", response.encodeURL(redirectUrl));
       		response.setHeader( "Connection", "close" );
       	} else {
       	//do I need this?
    	while (layers.indexOf("%") > -1){
    		layers = URLDecoder.decode(layers, "UTF-8");
    	}

    	String[] layerIds = layers.split(",");
   		Set<String> layerIdSet = new HashSet<String>();
   		
		for (int i = 0; i < layerIds.length; i++){
			layerIdSet.add(layerIds[i]); 
   		}

   		List<SolrRecord> layerInfoList = null;
		try {
			layerInfoList = this.layerInfoRetriever.fetchAllLayerInfo(layerIdSet);
		} catch (Exception e2) {
			// TODO Auto-generated catch block
			e2.printStackTrace();
		}
   		
   		//There is some info that requires the getCapabilities doc (native epsg code),
   		//so we must request it and parse it.  The benefit is that we can just grab the appropriate FeatureType node and
   		//insert it into this response.  Eventually, if we can get the epsg code from solr reliably, solr might be the
   		//faster method, since we are parsing a potentially large xml document.
		//alternatively, for now, we're going to use the geoserver rest interface to get the necessary info, but abstract it to an interface,
		//so that we can use a different method in the future
		/*
		http://geoserver-dev.atech.tufts.edu/rest/workspaces/sde/featuretypes/GISPORTAL.GISOWNER01.SOMERVILLE_CITYBOUNDARY.xml
		//this should be much faster
		 * 
		 */
   		//String institution = layerInfoList.get(0).getInstitution();
		//String servicePoint = layerInfoMap.get(layerIds[0]).get("Location");
		//servicePoint = ParseJSONSolrLocationField.getWmsUrl(servicePoint);
   		//String serverName = servicePoint.substring(0, servicePoint.indexOf("/wms"));
   		//String serverName = "http://geoserver-dev.atech.tufts.edu:80";
   		//System.out.println(serverName);

   		if (version == null){
   			//if no version is passed, lets assume 1.0.0
   			version = "1.0.0";
   		}
   		this.featureNodesDocument = this.createXMLDocument();
		for (SolrRecord layer: layerInfoList){
   			String workspace = layer.getWorkspaceName();
   			String layerName = layer.getName();
   			//System.out.println(serverName + "/" + workspace + "/" + layerName + "/wfs?request=GetCapabilities&version=" + version);
   			URL getCapabilitiesUrl = new URL(serverName + "/" + workspace + "/" + layerName + "/wfs?request=GetCapabilities&version=" + version);
   			
   			
   			Document document = this.buildXMLDocumentFromStream(getCapabilitiesUrl.openStream());	
   			NodeList layerNodeList = document.getElementsByTagName("FeatureType");
   			Element featureTypeNode = (Element) layerNodeList.item(0);
   			//System.out.println(layerNodeList.item(0).getNodeName());
   			//new org.w3c.dom.DocumentFragment();
   			try {	
   				Element featureTypeNodeCopy = (Element) this.featureNodesDocument.importNode(featureTypeNode, true);
   				this.featureNodesDocument.getDocumentElement().appendChild(featureTypeNodeCopy);
   			} catch (Exception e){
   				//System.out.println("fails here");
   			}
		}
   		

   		if (version.equals("1.1.1")){
   			//do some stuff
   		} else if (version.equals("1.0.0")){
   			response.setContentType("application/xml");
   	    	response.setHeader("Content-disposition","inline; filename=\"wfs.xml\"");
   			response.getWriter().write(this.writeXMLDocumentToString(this.createWFS_1_0_0CapabilitiesDoc()));
   		} else {
   			response.sendError(500, "WFS Version not supported.");
   		}
   		
       	}//describe feature else block
  
	}
		  
	Document createXMLDocument(){
		//parse the returned XML
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		//ignore validation, dtd
        //factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        //factory.setValidating(false);
		// Use document builder factory
		DocumentBuilder builder = null;
		try {
			builder = factory.newDocumentBuilder();
		} catch (ParserConfigurationException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
			System.out.println("parser error");
		}
		Document document = builder.newDocument();
	    Element root = (Element) document.createElement("rootElement"); 
	    document.appendChild(root);
	    return document;
	}
	
	Document buildXMLDocumentFromStream(InputStream xmlStream){
		//parse the returned XML
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		//ignore validation, dtd
        factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        factory.setValidating(false);
		// Use document builder factory
		DocumentBuilder builder = null;
		try {
			builder = factory.newDocumentBuilder();
		} catch (ParserConfigurationException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
			System.out.println("parser error");
		}
		//Parse the document
		Document document = null;
		try {
			document = builder.parse(xmlStream);
		} catch (IOException e) {
				// TODO Auto-generated catch block
			e.printStackTrace();
			//System.out.println("maybe here");
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			//System.out.println("or here");
		}
		return document;
	}

	
	Document createWFS_1_0_0CapabilitiesDoc(){
			InputStream template = this.getClass().getResourceAsStream("/resources/WfsGetCapabilitiesTemplate-1_0_0.xml");
					//String servicePoint = "http://geoserver01.uit.tufts.edu/wfs";
			Document document = this.buildXMLDocumentFromStream(template);
			//System.out.println("built doc");

			Node rootNode = document.getDocumentElement();
			Node schemaLocationAttribute = rootNode.getAttributes().getNamedItem("xsi:schemaLocation");
			String schemaLocationAttributeValue = schemaLocationAttribute.getNodeValue();

			schemaLocationAttribute.setNodeValue(schemaLocationAttributeValue + " " + this.serverName + "/schemas/wfs/1.0.0/WFS-capabilities.xsd");
			//We need to insert several pieces into the template
			/*
			 * 
			 * <WFS_Capabilities version="1.0.0" xmlns="http://www.opengis.net/wfs"
	xmlns:sde="http://geoserver.sf.net" xmlns:ogc="http://www.opengis.net/ogc"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.opengis.net/wfs">
	xsi:schemaLocation attribute needs a second entry with the xsl url
			 * 
			 */
			
			/*Service/OnlineResource
			<!--<OnlineResource>http://geoserver01.uit.tufts.edu:80/sde/GISPORTAL.GISOWNER01.SOMERVILLECITYBOUNDARY05/wfs
				</OnlineResource>-->
			*/
			
			NodeList onlineResourceNodes = document.getElementsByTagName("OnlineResource");
			//System.out.println(servicePoint);
			//System.out.println(onlineResourceNodes.item(0).getNodeName());
			onlineResourceNodes.item(0).getFirstChild().setTextContent(servicePoint);

			//http://geoserver01.uit.tufts.edu:80/sde/GISPORTAL.GISOWNER01.SOMERVILLECITYBOUNDARY05/wfs?request=GetCapabilities
			
			NodeList httpNodeList = document.getElementsByTagName("HTTP");
			for (int i = 0; i < httpNodeList.getLength(); i++){
				Node addressNode = httpNodeList.item(i).getChildNodes().item(1).getAttributes().item(0);
				String currentValue = addressNode.getNodeValue();
				addressNode.setNodeValue(servicePoint + currentValue);
			}

			Node featureTypeListNode = document.getElementsByTagName("FeatureTypeList").item(0);
			//System.out.println("test" + this.featureNodesDocument.getDocumentElement());
			Node importedNode = document.importNode(this.featureNodesDocument.getDocumentElement(), true);
			NodeList importedFeatureTypeNodes = importedNode.getChildNodes();
			for (int i = 0; i < importedFeatureTypeNodes.getLength(); i++){
				featureTypeListNode.appendChild(importedFeatureTypeNodes.item(i));
			}
			
			return document;

	}
	
	String writeXMLDocumentToString(Document document){

	    StringWriter stringWriter = new StringWriter();
       	Transformer serializer = null;
		try {
			serializer = TransformerFactory.newInstance().newTransformer();
		} catch (TransformerConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (TransformerFactoryConfigurationError e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        serializer.setOutputProperty(OutputKeys.INDENT, "yes");
       	try {
       	
			serializer.transform(new DOMSource(document), new StreamResult(stringWriter));
		} catch (TransformerException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
       	//do I want to write this to a string?
       	return stringWriter.toString().trim();  
			
	}

	String getDescribeFeature(){
		String featureDescription = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" 
				+ "<xsd:schema xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:sde=\"http://geoserver.sf.net\" elementFormDefault=\"qualified\" targetNamespace=\"http://geoserver.sf.net\">"
				+ "<xsd:import namespace=\"http://www.opengis.net/gml\" schemaLocation=\"http://geoserver01.uit.tufts.edu:80/schemas/gml/3.1.1/base/gml.xsd\"/>"
				+ "<xsd:complexType name=\"GISPORTAL.GISOWNER01.SOMERVILLEZONING10Type\">"
				+ "<xsd:complexContent>"
				+ "<xsd:extension base=\"gml:AbstractFeatureType\">"
				+ "<xsd:sequence>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"AREA_\" nillable=\"true\" type=\"xsd:double\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"PERIMETER\" nillable=\"true\" type=\"xsd:double\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"ZONES_\" nillable=\"true\" type=\"xsd:double\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"ZONES_ID\" nillable=\"true\" type=\"xsd:double\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"ZONECODE\" nillable=\"true\" type=\"xsd:string\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"TYPE\" nillable=\"true\" type=\"xsd:string\"/>"
				+ "<xsd:element maxOccurs=\"1\" minOccurs=\"0\" name=\"Shape\" nillable=\"true\" type=\"gml:MultiSurfacePropertyType\"/>"
				+ "</xsd:sequence>"
				+ "</xsd:extension>"
				+ "</xsd:complexContent>"
				+ "</xsd:complexType>"
				+ "<xsd:element name=\"GISPORTAL.GISOWNER01.SOMERVILLEZONING10\" substitutionGroup=\"gml:_Feature\" type=\"sde:GISPORTAL.GISOWNER01.SOMERVILLEZONING10Type\"/>"
				+ "</xsd:schema>";
		return featureDescription;

	}
	 
	
}
