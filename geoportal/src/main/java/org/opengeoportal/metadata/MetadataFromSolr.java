package org.opengeoportal.metadata;

import java.util.*;
import java.io.*;

import javax.annotation.PostConstruct;
import javax.xml.transform.*;
import javax.xml.transform.dom.*;
import javax.xml.transform.stream.*;

import org.apache.solr.client.solrj.util.ClientUtils;
import org.springframework.beans.factory.annotation.Value;
import org.xml.sax.*;
import org.apache.commons.io.IOUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.common.SolrDocumentList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.w3c.dom.*;

/**
 * retrieves a layer's XML metadata from an OGP solr instance
 *
 * @author chris
 */

public class MetadataFromSolr implements MetadataRetriever {
    @Autowired
    private LayerInfoRetriever layerInfoRetriever;

    @Autowired
    private XmlParser xmlParser;

    @Autowired
    private CachingTransformerProvider cachingTransformerProvider;

    @Value("${metadata.css}")
    private Resource cssFile;

    private Document xmlDocument;
    private Resource fgdcStyleSheet;
    private Resource iso19139StyleSheet;

    public enum MetadataType {
        ISO_19139, FGDC

    }

    @PostConstruct
    public void primeTransformerCache() {
        //prime the cache
        try {
            cachingTransformerProvider.getTransformer("generic");
        } catch (TransformerConfigurationException e) {
            e.printStackTrace();

        }
        try {
            this.getTransformer(MetadataType.FGDC);
            this.getTransformer(MetadataType.ISO_19139);

        } catch (TransformerConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
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

        return documentToString(document);
    }

    String documentToString(Document document) throws TransformerException {
        Source xmlSource = new DOMSource(document);
        StringWriter stringWriter = new StringWriter();
        StreamResult streamResult = new StreamResult(stringWriter);

        Transformer transformer = cachingTransformerProvider.getTransformer("generic");

        transformer.transform(xmlSource, streamResult);

        return stringWriter.toString();
    }

    /**
     * takes the XML metadata string from the Solr instance, does some filtering, returns an xml document
     *
     * @param rawXMLString
     * @return the XML String as a Document
     * @throws IOException
     * @throws SAXException
     */
    Document buildXMLDocFromString(String rawXMLString)
            throws SAXException, IOException {

        // parse the returned XML to make sure it is well-formed & formatted
        // Parse the document
        this.xmlDocument = xmlParser.parse(rawXMLString);

        return this.xmlDocument;
    }

    /**
     * given a layer name, retrieves the XML metadata string from the OGP Solr instance
     *
     * @param identifier
     * @param descriptor
     * @return the XML metadata as a string
     * @throws Exception
     */
    private String getXMLStringFromSolr(String identifier, String descriptor) throws Exception {
        Map<String, String> conditionsMap = new HashMap<String, String>();
        if (descriptor.equalsIgnoreCase("name")) {
            int i = identifier.indexOf(":");
            if (i > 0) {
                //String workSpace = layerName.substring(0, i);
                //conditionsMap.put("WorkspaceName", workSpace);
                identifier = identifier.substring(i + 1);
            }
            conditionsMap.put("Name", identifier);
        } else if (descriptor.equalsIgnoreCase("layerid")) {
            conditionsMap.put("LayerId", identifier);
        } else {
            return null;
        }

        SolrQuery query = new SolrQuery();
        String query$ = descriptor + ":" + ClientUtils.escapeQueryChars(identifier);
        query.setQuery(query$);
        query.addField("FgdcText");
        query.setRows(1);

        SolrDocumentList docs = this.layerInfoRetriever.getSolrClient().query(query).getResults();
        return (String) docs.get(0).getFieldValue("FgdcText");
    }

    /**
     * Gets the XML metadata as a string, then outputs it to a file.
     *
     * @param metadataLayerName the name of the layer you want XML metadata for
     * @param xmlFile           the name of the file the metadata will be written to
     *                          return a File object pointing to the XML metadata file for the layer
     * @throws Exception
     */
    public File getXMLFile(String metadataLayerName, File xmlFile) throws Exception {
        OutputStream xmlFileOutputStream = null;
        try {
            String xmlString = this.getXMLStringFromSolr(metadataLayerName, "Name");
            if (xmlString.isEmpty()) {
                return null;
            }
            xmlString = this.filterXMLString(xmlString);
            //write this string to a file
            xmlFileOutputStream = new FileOutputStream(xmlFile);
            new PrintStream(xmlFileOutputStream).print(xmlString);

            return xmlFile;

        } finally {
            IOUtils.closeQuietly(xmlFileOutputStream);
        }
    }

    @Override
    public String getXMLStringFromId(String layerID) throws Exception {
        String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
        if (xmlString.isEmpty()) {
            return "";
        }
        xmlString = this.filterXMLString(xmlString);

        return xmlString;
    }

    @Override
    public String getMetadataAsHtml(String layerID) throws Exception {
        String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
        if (xmlString.isEmpty()) {
            return "";
        }
        Document document = null;
        try {
            document = buildXMLDocFromString(xmlString);
        } catch (SAXException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            return "";
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            return "";
        }

        //get the metadata type and correct xslt document

        Source xmlSource = new DOMSource(document);

        MetadataType metadataType = getMetadataType(document);

        Transformer transformer = getTransformer(metadataType);

        StringWriter stringWriter = new StringWriter();
        StreamResult streamResult = new StreamResult(stringWriter);
        transformer.transform(xmlSource, streamResult);

        return stringWriter.toString();
    }

    @Override
    public String getMetadataAsHtml(String layerID, boolean embedded) throws Exception {
        String xmlString = this.getXMLStringFromSolr(layerID, "LayerId");
        if (xmlString.isEmpty()) {
            return "";
        }

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

        MetadataType metadataType = getMetadataType(document);

        Transformer transformer = getTransformer(metadataType);

        if (embedded) {
            StringWriter stringWriter = null;
            try {
                stringWriter = new StringWriter();
                StreamResult streamResult = new StreamResult(stringWriter);
                transformer.transform(xmlSource, streamResult);

                return stringWriter.toString();
            } finally {
                stringWriter.close();
            }
        } else {

            DOMResult domResult = new DOMResult();
            transformer.transform(xmlSource, domResult);
            Document result = (Document) domResult.getNode();
            result = insertCss(result);

            return documentToString(result);
        }
    }

    public String getCssString() throws IOException {
        try (InputStream is = cssFile.getInputStream()) {
            return IOUtils.toString(is);
        }
    }

    Document insertCss(Document htmlDocument) throws IOException {
        Element style = htmlDocument.createElement("style");
        String cssString = getCssString();
        style.setTextContent(cssString);

        Node head = htmlDocument.getElementsByTagName("head").item(0);
        head.appendChild(style);

        return htmlDocument;
    }

    Transformer getTransformer(MetadataType metadataType) throws TransformerConfigurationException, IOException {
        File styleSheet = null;
        if (metadataType.equals(MetadataType.FGDC)) {
            styleSheet = this.getFgdcStyleSheet().getFile();
        } else {
            styleSheet = this.getIso19139StyleSheet().getFile();
        }

        Source xslt = new StreamSource(styleSheet);

        return cachingTransformerProvider.getTransformer(xslt, metadataType.toString());

    }

    File getStyleSheet(Document document) throws Exception {
        MetadataType metadataType = getMetadataType(document);
        //getMetadataType throws an exception if not fgdc or iso19139
        if (metadataType.equals(MetadataType.FGDC)) {
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
            if (rootNodes.getLength() > 0) {
                //if (document.getElementsByTagName("metstdn").item(0).getTextContent().toLowerCase().contains("fgdc")){
                metadataType = MetadataType.FGDC;
                //}
            }
        } catch (Exception e) {/*ignore*/
            //document.getElementsByTagName("metstdn").item(0).getTextContent().toLowerCase();
        }

        try {

            NodeList rootNodes = document.getElementsByTagNameNS("*", "MD_Metadata");
            NodeList altRootNodes = document.getElementsByTagNameNS("*", "MI_Metadata");
            int totalNodes = rootNodes.getLength() + altRootNodes.getLength();
            if (totalNodes > 0) {
                metadataType = MetadataType.ISO_19139;

            }
        } catch (Exception e) {/*ignore*/}

        if (metadataType == null) {
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
