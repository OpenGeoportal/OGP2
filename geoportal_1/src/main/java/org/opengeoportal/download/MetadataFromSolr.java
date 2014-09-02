package org.opengeoportal.download;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.IOUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.common.SolrDocumentList;
import org.opengeoportal.metadata.CachingTransformerProvider;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.metadata.XmlParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * retrieves a layer's XML metadata from an OGP solr instance
 * @author chris
 *
 */

public class MetadataFromSolr implements MetadataRetriever {
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	
	@Autowired
	private XmlParser xmlParser;
	
	@Autowired
	private CachingTransformerProvider cachingTransformerProvider;
	
	private Document xmlDocument;
	private Resource fgdcStyleSheet;
	private Resource iso19139StyleSheet;
	
	public enum MetadataType {
		ISO_19139, FGDC;
	}
	
	
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
	 throws IOException, TransformerException, SAXException {
		Document document = xmlParser.parse(rawXMLString);

		Source xmlSource = new DOMSource(document);
		StringWriter stringWriter = new StringWriter();
		StreamResult streamResult = new StreamResult(stringWriter);
		
		Transformer transformer = cachingTransformerProvider.getTransformer("generic");

		transformer.transform(xmlSource, streamResult);
		
		String outputString = stringWriter.toString();

		return outputString;
	 }
	
	/**
	 * takes the XML metadata string from the Solr instance, does some filtering, returns an xml document
	 * 
	 * @param rawXMLString
	 * @return the XML String as a Document
	 * @throws ParserConfigurationException
	 * @throws IOException
	 * @throws SAXException
	 */
	Document buildXMLDocFromString(String rawXMLString)
			throws SAXException, IOException {

		// parse the returned XML to make sure it is well-formed & formatted
		// Parse the document
		Document document = xmlParser.parse(rawXMLString);
		this.xmlDocument = document;

		return this.xmlDocument;
	}
	
	/**
	 * given a layer name, retrieves the XML metadata string from the OGP Solr instance
	 * @param layerName
	 * @return the XML metadata as a string
	 * @throws Exception 
	 */
	private String getXMLStringFromSolr(String identifier, String descriptor) throws Exception{
		Map<String,String> conditionsMap = new HashMap<String, String>();
		if (descriptor.equalsIgnoreCase("name")){
			int i = identifier.indexOf(":");
			if (i > 0){
				//String workSpace = layerName.substring(0, i);
				//conditionsMap.put("WorkspaceName", workSpace);
				identifier = identifier.substring(i + 1);
			}
			conditionsMap.put("Name", identifier);
		} else if(descriptor.equalsIgnoreCase("layerid")){
			conditionsMap.put("LayerId", identifier);
		} else {
			return null;
		}

		SolrQuery query = new SolrQuery();
		query.setQuery( descriptor + ":" + identifier );
		query.addField("FgdcText");
		query.setRows(1);
		
		 SolrDocumentList docs = this.layerInfoRetriever.getSolrServer().query(query).getResults();
		 return (String) docs.get(0).getFieldValue("FgdcText");
	}
	
	/**
	 * Gets the XML metadata as a string, then outputs it to a file.
	 * 
	 * @param metadataLayerName  the name of the layer you want XML metadata for
	 * @param xmlFile  the name of the file the metadata will be written to
	 * return a File object pointing to the XML metadata file for the layer
	 * @throws Exception 
	 */
	public File getXMLFile(String metadataLayerName, File xmlFile) throws Exception{
		OutputStream xmlFileOutputStream = null;
		try{
			String xmlString = this.getXMLStringFromSolr(metadataLayerName, "Name");
			xmlString = this.filterXMLString(xmlString);
			//write this string to a file
			xmlFileOutputStream = new FileOutputStream (xmlFile);
			new PrintStream(xmlFileOutputStream).print(xmlString);

			return xmlFile;

		} finally {
			IOUtils.closeQuietly(xmlFileOutputStream);
		}
	}

	@Override
	public String getXMLStringFromId(String layerID) throws Exception {
		String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
		xmlString = this.filterXMLString(xmlString);

		return xmlString;
	}
	
	@Override
	public String getMetadataAsHtml(String layerID) throws Exception {
		String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
		
		Document document = null;
		try {
			document = buildXMLDocFromString(xmlString);
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		//get the metadata type and correct xslt document
		
		Source xmlSource = new DOMSource(document);
		
		StringWriter stringWriter = new StringWriter();
		StreamResult streamResult = new StreamResult(stringWriter);
		
		MetadataType metadataType = getMetadataType(document);
		
		File styleSheet = null;
		if (metadataType.equals(MetadataType.FGDC)){
			styleSheet = this.getFgdcStyleSheet().getFile();
		} else {
			styleSheet = this.getIso19139StyleSheet().getFile();
		}
		
        Source xslt = new StreamSource(styleSheet);
        
		Transformer transformer = cachingTransformerProvider.getTransformer(xslt, metadataType.toString());

		transformer.transform(xmlSource, streamResult);
		String outputString = stringWriter.toString();

		return outputString;

	}
	
	File getStyleSheet(Document document) throws Exception{
		MetadataType metadataType = getMetadataType(document);
		//getMetadataType throws an exception if not fgdc or iso19139
		if (metadataType.equals(MetadataType.FGDC)){
			return this.getFgdcStyleSheet().getFile();
		} else {
			return this.getIso19139StyleSheet().getFile();
		}
	}
	
    public static MetadataType getMetadataType(Document document) throws Exception {
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
            throw new Exception("Metadata Type is not supported.");
        }
        return metadataType;
    }


	public Resource getFgdcStyleSheet() {
		return fgdcStyleSheet;
	}

	public void setFgdcStyleSheet(Resource fgdcStyleSheet) {
		this.fgdcStyleSheet = fgdcStyleSheet;
	}

	public Resource getIso19139StyleSheet() {
		return iso19139StyleSheet;
	}

	public void setIso19139StyleSheet(Resource iso19139StyleSheet) {
		this.iso19139StyleSheet = iso19139StyleSheet;
	}
}
