package org.opengeoportal.metadata;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.xml.parsers.*;
import javax.xml.transform.*;
import javax.xml.transform.dom.*;
import javax.xml.transform.stream.*;

import org.apache.solr.client.solrj.cloud.autoscaling.Variable;
import org.opengeoportal.metadata.exception.MetadataParsingException;
import org.opengeoportal.metadata.exception.MetadataRetrievalException;
import org.opengeoportal.search.MetadataRecord;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.FileCopyUtils;
import org.xml.sax.*;
import org.apache.commons.io.IOUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.w3c.dom.*;

/**
 * retrieves a layer's XML metadata from an OGP solr instance
 * @author chris
 *
 */

@Component
public class MetadataFromSolr implements MetadataRetriever {
	final Logger logger = LoggerFactory.getLogger(MetadataFromSolr.class);

	private final SearchService searchService;
	private final CachingTransformerProvider cachingTransformerProvider;
	private final XmlParserFactory xmlParserFactory;


	private DocumentBuilder builder;

	@Value("${stylesheet.fgdc}")
	private Resource fgdcStyleSheet;

	@Value("${stylesheet.iso19139}")
	private Resource iso19139StyleSheet;

	@Value("${stylesheet.css}")
	private Resource metadataCss;

	public enum MetadataType {
		ISO_19139, FGDC;
	}



	@Autowired
	public MetadataFromSolr(SearchService searchService,
							CachingTransformerProvider cachingTransformerProvider,
							XmlParserFactory xmlParserFactory) {

		this.searchService = searchService;
		this.cachingTransformerProvider = cachingTransformerProvider;
		this.xmlParserFactory = xmlParserFactory;
	}

	@PostConstruct
	public void init() throws ParserConfigurationException, TransformerConfigurationException, IOException {
		// Create a factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setValidating(false);  // dtd isn't always available; would be nice to attempt to validate
		factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
		builder = factory.newDocumentBuilder();
	}

	/**
	 * takes the XML metadata string from the Solr instance, does some filtering, parses it as XML
	 * as a form of simplistic validation
	 * 
	 * @param rawXMLString
	 * @return the processed XML String
	 * @throws TransformerException
	 */
	/**
	 * takes the XML metadata string from the Solr instance, does some filtering, parses it as XML
	 * as a form of simplistic validation
	 *
	 * @param rawXMLString
	 * @return the processed XML String
	 * @throws TransformerException
	 * @throws IOException
	 * @throws SAXException
	 */
	String filterXMLString(String rawXMLString)
			throws IOException, TransformerException, SAXException, ParserConfigurationException {
		Document document = xmlParserFactory.getParser().parse(rawXMLString);

		return documentToString(document);
	}

	/**
	 * takes the XML metadata string from the Solr instance, does some filtering, returns an xml document
	 *
	 * @param rawXMLString
	 * @return the XML String as a Document
	 * @throws IOException
	 * @throws SAXException
	 */
	Document buildXMLDocFromString(String rawXMLString) throws ParserConfigurationException, IOException, SAXException {

		// parse the returned XML to make sure it is well-formed & formatted
		// Parse the document
		Document xmlDocument = xmlParserFactory.getParser().parse(rawXMLString);

		return xmlDocument;
	}
	
	/**
	 * given a layer name, retrieves the XML metadata string from the OGP Solr instance
	 * @param identifier
	 * @param descriptor
	 * @return the XML metadata as a string
	 * @throws Exception 
	 */
	private String getXMLStringFromSolr(String identifier, String descriptor) throws LayerNotFoundException, SearchServerException {

		MetadataRecord record;

		if (descriptor.equalsIgnoreCase("name")){
			record = this.searchService.findMetadataRecordByName(identifier);
		} else if(descriptor.equalsIgnoreCase("layerid")){
			record = this.searchService.findMetadataRecordById(identifier);
		} else {
			throw new LayerNotFoundException("Unable to form search query for metadata.");
		}
		return record.getFgdcText();
	}

	/**
	 * Gets the XML metadata as a string, then outputs it to a file.
	 *
	 * @param metadataLayerName the name of the layer you want XML metadata for
	 * @param xmlFile           the name of the file the metadata will be written to
	 *                          return a File object pointing to the XML metadata file for the layer
	 * @throws Exception
	 */
	@Override
	public File getXMLFile(String metadataLayerName, File xmlFile) throws LayerNotFoundException, MetadataParsingException {

		try (OutputStream xmlFileOutputStream = new FileOutputStream(xmlFile)){
			String xmlString = this.getXMLStringFromSolr(metadataLayerName, "Name");
			if (xmlString.isEmpty()) {
				return null;
			}
			xmlString = this.filterXMLString(xmlString);

			//write this string to a file
			new PrintStream(xmlFileOutputStream).print(xmlString);
			return xmlFile;
		} catch (ParserConfigurationException | TransformerException | SAXException e) {
			e.printStackTrace();
			throw new MetadataParsingException("Unable to parse metadata");
		} catch (IOException e) {
			e.printStackTrace();
			throw new MetadataParsingException("Unable to write metadata file");
		} catch (SearchServerException e) {
			e.printStackTrace();
			throw new LayerNotFoundException("Unable to find metadata layer: search server error");
		}
	}

	@Override
	public String getXMLStringFromId(String layerID) throws LayerNotFoundException, MetadataParsingException {
		String xmlString = null;
		try {
			xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
		} catch (SearchServerException e) {
			e.printStackTrace();
		}
		if (xmlString.isEmpty()) {
			return "";
		}
		try {
			xmlString = this.filterXMLString(xmlString);
		} catch (IOException | TransformerException | SAXException | ParserConfigurationException e) {
			e.printStackTrace();
			throw new MetadataParsingException(e.getMessage());
		}

		return xmlString;
	}

	private Document getXmlDocumentFromLayerId(String layerId) throws LayerNotFoundException, SearchServerException,
			ParserConfigurationException, IOException, SAXException, MetadataParsingException {
		String xmlString = this.getXMLStringFromSolr(layerId, "LayerId");

		if (xmlString.isEmpty()) {
			throw new MetadataParsingException("xml string is empty for: " + layerId);
		}
		return buildXMLDocFromString(xmlString);

	}

	@Override
	public String getMetadataAsHtml(String layerID, boolean withCss) throws MetadataRetrievalException {

		try {
			//get the metadata type and correct xslt document
			Document document = getXmlDocumentFromLayerId(layerID);
			MetadataType metadataType = getMetadataType(document);

			Resource styleSheetResource = getStyleSheet(document);
			Transformer transformer = cachingTransformerProvider.getTransformer(styleSheetResource, metadataType.toString());
			Source xmlSource = new DOMSource(document);

			if (withCss) {
				return getMetadataStringWithCss(xmlSource, transformer);
			} else {
				return getMetadataString(xmlSource, transformer);
			}
		} catch (Exception e) {
			e.printStackTrace();
			throw new MetadataRetrievalException("Unable to parse metadata.");
		}

	}

	String getMetadataString(Source xmlSource, Transformer transformer) throws IOException, TransformerException {
		try (StringWriter stringWriter = new StringWriter()) {
			StreamResult streamResult = new StreamResult(stringWriter);
			transformer.transform(xmlSource, streamResult);

			return stringWriter.toString();
		}
	}

	String getMetadataStringWithCss(Source xmlSource, Transformer transformer) throws TransformerException, IOException {
		DOMResult domResult = new DOMResult();
		transformer.transform(xmlSource, domResult);
		Document result = (Document) domResult.getNode();
		result = insertCss(result);

		return documentToString(result);
	}

	String documentToString(Document document) throws TransformerException, IOException {
		Source xmlSource = new DOMSource(document);
		StringWriter stringWriter = new StringWriter();
		StreamResult streamResult = new StreamResult(stringWriter);

		Transformer transformer = cachingTransformerProvider.getIdentityTransformer("noop_to_string");

		transformer.transform(xmlSource, streamResult);

		return stringWriter.toString();
	}

	Document insertCss(Document htmlDocument) {
		Element style = htmlDocument.createElement("style");

		try (Reader reader = new InputStreamReader(metadataCss.getInputStream(), StandardCharsets.UTF_8)) {
			String css = FileCopyUtils.copyToString(reader);
			logger.debug("css: " + css);
			style.setTextContent(css);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}

		Node head = htmlDocument.getElementsByTagName("head").item(0);
		head.appendChild(style);

		return htmlDocument;
	}


	@Override
	public Map<String, String> getAttributeDescriptions(String layerId) throws MetadataParsingException {
		Map<String,String> attrInfoMap = new HashMap<>();

		Document doc = null;
		try {
			doc = getXmlDocumentFromLayerId(layerId);
		} catch (LayerNotFoundException | SAXException | IOException | ParserConfigurationException | SearchServerException e) {
			e.printStackTrace();
			throw new MetadataParsingException("Unable to parse metadata for: " + layerId);
		}

		MetadataType metadataType = getMetadataType(doc);

		if (!metadataType.equals(MetadataType.FGDC)){
			// currently unable to parse non fgdc metadata
			return attrInfoMap;
		}

		NodeList attributeInfo = doc.getElementsByTagName("attr");

		if (attributeInfo == null || attributeInfo.getLength() == 0){
			return attrInfoMap;
		}

		logger.debug("found attr nodes: " + attributeInfo.getLength());
		/*
			<attrlabl>OBJECTID_1</attrlabl>
			<attrdef>Unique identifier</attrdef>
		 */

		for (int i = 0; i < attributeInfo.getLength(); i++){
			Node currentNode = attributeInfo.item(i);
			NodeList currentChildNodes = currentNode.getChildNodes();
			String attrLabel = "";
			String attrDef = "No description available";
			if (currentChildNodes == null){
				continue;
			}
			for (int j = 0; j < currentChildNodes.getLength(); j++) {
				Node currentChild = currentChildNodes.item(j);
				if (currentChild.getNodeName().equalsIgnoreCase("attrlabl")) {
					attrLabel = currentChild.getTextContent().trim().toLowerCase();
					logger.debug("attr label: " + attrLabel);
				} else if (currentChild.getNodeName().equalsIgnoreCase("attrdef")){
					attrDef = currentChild.getTextContent().trim();
					logger.debug("attr definition: " + attrDef);
				}
			}
			if (!attrLabel.isBlank()){
				attrInfoMap.put(attrLabel, attrDef);
			}

		}

		return attrInfoMap;
	}

	Resource getStyleSheet(Document document) throws Exception{
		MetadataType metadataType = getMetadataType(document);
		//getMetadataType throws an exception if not fgdc or iso19139
		if (metadataType.equals(MetadataType.FGDC)){
			return fgdcStyleSheet;
		} else {
			return iso19139StyleSheet;
		}
	}
	
    public static MetadataType getMetadataType(Document document) throws MetadataParsingException {

        MetadataType metadataType = null;
        try {
            //<metstdn>FGDC Content Standards for Digital Geospatial Metadata
            //<metstdv>FGDC-STD-001-1998
        	NodeList rootNodes = document.getElementsByTagName("metadata");
        	if (rootNodes.getLength() > 0){ 
        		//if (document.getElementsByTagName("metstdn").item(0).getTextContent().toLowerCase().contains("fgdc")){
        			metadataType = MetadataType.FGDC;
        		//}
        	}
        } catch (Exception e){/*ignore*/
            //document.getElementsByTagName("metstdn").item(0).getTextContent().toLowerCase();
        }

        try {

            NodeList rootNodes = document.getElementsByTagNameNS("*", "MD_Metadata");
            NodeList altRootNodes = document.getElementsByTagNameNS("*", "MI_Metadata");
            int totalNodes = rootNodes.getLength() + altRootNodes.getLength();
            if (totalNodes > 0){
                    metadataType = MetadataType.ISO_19139;
                
            }
        } catch (Exception e){/*ignore*/}

        if (metadataType == null){
            //throw an exception...metadata type is not supported
            throw new MetadataParsingException("Metadata Type is not supported.");
        }
        return metadataType;
    }
/*
 * <ptcontac>
<cntinfo>
<cntorgp>
<cntorg>Harvard Map Collection, Harvard College Library</cntorg>
</cntorgp>
<cntpos>Harvard Geospatial Library</cntpos>
<cntaddr>
<addrtype>mailing and physical address</addrtype>
<address>Harvard Map Collection</address>
<address>Pusey Library</address>
<address>Harvard University</address>
<city>Cambridge</city>
<state>MA</state>
<postal>02138</postal>
<country>USA</country>
</cntaddr>
<cntvoice>617-495-2417</cntvoice>
<cntfax>617-496-0440</cntfax>
<cntemail>hgl_ref@hulmail.harvard.edu</cntemail>
<hours>Monday - Friday, 9:00 am - 4:00 pm EST-USA</hours>
</cntinfo>
</ptcontac>
 * 
 */
	public NodeList getContactNodeList(String layerID) throws Exception{
		String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
		Document document = buildXMLDocFromString(xmlString);
		NodeList contactInfo = document.getElementsByTagName("ptcontac");
		for (int i = 0; i < contactInfo.getLength(); i++){
			Node currentNode = contactInfo.item(i);
			if (currentNode.getNodeName().equalsIgnoreCase("cntinfo")){
				return currentNode.getChildNodes();
			}
		}
		return null;
	}
	
	public Node getContactInfo(String layerID, String nodeName){
		NodeList contactInfo = null;
		try {
			contactInfo = this.getContactNodeList(layerID);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		for (int i = 0; i < contactInfo.getLength(); i++){
			Node currentNode = contactInfo.item(i);
			if (currentNode.getNodeName().equalsIgnoreCase(nodeName)){
				return currentNode;
			}
		}
		return null;
	}
	
	public String getContactPhoneNumber(String layerID){
		return this.getContactInfo(layerID, "cntvoice").getNodeValue().trim();
	}
	
	public String getContactName(String layerID){
		String contactName =  this.getContactInfo(layerID, "cntpos").getNodeValue().trim();
		return contactName;
	}
	
	public String getContactAddress(String layerID){
		Node addressNode = this.getContactInfo(layerID, "cntaddr");
		NodeList addressNodeList = addressNode.getChildNodes();
		
		String address = "";
		String city = "";
		String state = "";
		String postal = "";
		String country = "";
		for (int i = 0; i < addressNodeList.getLength(); i++){
			Node currentAddressLine = addressNodeList.item(i);
			if (currentAddressLine.getNodeName().equalsIgnoreCase("address")){
				address += currentAddressLine.getNodeValue().trim() + ", ";
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase("state")){
				state = "";
				state += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase("postal")){
				postal = "";
				postal += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase("country")){
				country = "";
				country += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase("city")){
				city = "";
				city += currentAddressLine.getNodeValue().trim();
			}
		}
		String fullAddress = "";
		if (!address.isEmpty()){
			fullAddress += address;
		}
		if (!city.isEmpty()){
			fullAddress += city + ",";
		}
		if (!state.isEmpty()){
			fullAddress += state + " ";
		}
		if (!postal.isEmpty()){
			fullAddress += postal;
		}
		if (!country.isEmpty()){
			fullAddress += ", " + country;
		}
		return fullAddress;
	}

}
