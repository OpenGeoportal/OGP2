package org.opengeoportal.proxy;

import java.io.IOException;
import java.io.StringWriter;
import java.net.URLDecoder;
import java.util.HashSet;
import java.util.List;
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
import org.opengeoportal.utilities.LocationFieldUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.HttpRequestHandler;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class GetCapabilitiesWMSProxy implements HttpRequestHandler {
	private GenericProxy genericProxy;
	private LayerInfoRetriever layerInfoRetriever;
	private DocumentBuilder builder;
	private Transformer serializer;
	final Logger logger = LoggerFactory.getLogger(this.getClass());


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

	GetCapabilitiesWMSProxy(){
		//parse the returned XML
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		//ignore validation, dtd
        factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        factory.setValidating(false);
		// Use document builder factory
		this.builder = null;
		try {
			builder = factory.newDocumentBuilder();
		} catch (ParserConfigurationException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
       	serializer = null;
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

   		List<SolrRecord> layerRecords = null;
		try {
			layerRecords = this.layerInfoRetriever.fetchAllLayerInfo(layerIdSet);
		} catch (Exception e2) {
			// TODO Auto-generated catch block
			e2.printStackTrace();
		}
   		
		SolrRecord firstRecord = layerRecords.get(0);
   		//String institution = firstRecord.getInstitution();
		String location = firstRecord.getLocation();
		String servicePoint = LocationFieldUtils.getWmsUrl(location);
   		String serverName = servicePoint.substring(0, servicePoint.indexOf("/wms"));
   		logger.debug(serverName);
   		genericProxy.proxyRequest(request, response, servicePoint + "request=getCapabilities&version=1.1.1");

   		Set<String> layerNames = new HashSet<String>();
   		for (SolrRecord layer: layerRecords){
				String currentLayerName = layer.getWorkspaceName() + ":" + layer.getName();
				layerNames.add(currentLayerName);
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
			if (!layerNames.contains(featureTypeName)){
				Node featureTypeElement = featureTypeNameElement.getParentNode();
				featureTypeElement.getParentNode().removeChild(featureTypeElement);
			}
		}
		
	      	StringWriter stw = new StringWriter();
           	try {
				serializer.transform(new DOMSource(document), new StreamResult(stw));
			} catch (TransformerException e) {
				logger.error(e.getMessage());
			}
           	featureTypeInfo += stw.toString(); 
           	response.getWriter().print(featureTypeInfo);
	}
}
