package org.OpenGeoPortal.Proxy;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.util.HashSet;
import java.util.Map;
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

import org.OpenGeoPortal.Authentication.OgpAuthenticator;
import org.OpenGeoPortal.Download.LayerInfoRetriever;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;

import org.springframework.web.HttpRequestHandler;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class GetCapabilitiesWMSProxy implements HttpRequestHandler {
	private GenericProxy genericProxy;
	private OgpAuthenticator ogpAuthenticator;
	private final String restrictedWMSServerUrl = "http://127.0.0.1:8580/wms";
	private final String restrictedWMSServerUsername = "";
	private final String restrictedWMSServerPassword = "";
	private LayerInfoRetriever layerInfoRetriever;

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

	public void setOgpAuthenticator(OgpAuthenticator ogpAuthenticator) {
		this.ogpAuthenticator = ogpAuthenticator;
	}

	public OgpAuthenticator getOgpAuthenticator() {
		return this.ogpAuthenticator;
	}

	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
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

   		Map<String, Map<String, String>> layerInfoMap = null;
		try {
			layerInfoMap = this.layerInfoRetriever.getAllLayerInfo(layerIdSet);
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
   		String institution = layerInfoMap.get(layerIds[0]).get("Institution");
		String servicePoint = layerInfoMap.get(layerIds[0]).get("Location");
		servicePoint = ParseJSONSolrLocationField.getWmsUrl(servicePoint);
   		String serverName = servicePoint.substring(0, servicePoint.indexOf("/wms"));
   		//String serverName = "http://geoserver-dev.atech.tufts.edu:80";
   		System.out.println(serverName);
   		genericProxy.proxyRequest(request, response, servicePoint + "request=getCapabilities&version=1.1.1");

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
		}
		//Parse the document
		Document document = null;
		try {
			document = builder.parse(request.getInputStream());
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		/*
		http://geoserver-dev.atech.tufts.edu/rest/workspaces/sde/featuretypes/GISPORTAL.GISOWNER01.SOMERVILLE_CITYBOUNDARY.xml
		//this should be much faster
		 * 
		 */
		String featureTypeInfo = "";
		NodeList elementNodes = document.getElementsByTagName("Name");
		for (int i = 0; i < elementNodes.getLength(); i++){
			Node featureTypeNameElement = elementNodes.item(i);
			String featureTypeName = featureTypeNameElement.getTextContent().trim();
   			for (String layer : layerIds){
   				String currentLayerName = layerInfoMap.get(layer).get("WorkspaceName") + ":" + layerInfoMap.get(layer).get("Name");
   				System.out.println(currentLayerName);
   				if (currentLayerName.equals(featureTypeName)){
   					Node featureTypeElement = featureTypeNameElement.getParentNode();
   			      	StringWriter stw = new StringWriter();
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
					serializer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
   	            	try {
						serializer.transform(new DOMSource(featureTypeElement), new StreamResult(stw));
					} catch (TransformerException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
   	            	featureTypeInfo += stw.toString();  
   					break;
   				}
   			}
		}
		System.out.println(featureTypeInfo);
		if (featureTypeInfo.length() == 0){
			//throw new Exception("No features found.");
		}
	}
}
