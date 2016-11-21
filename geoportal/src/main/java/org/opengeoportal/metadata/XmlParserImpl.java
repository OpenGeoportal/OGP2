package org.opengeoportal.metadata;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

public class XmlParserImpl implements XmlParser {
    XPathFactory xpathFactory;
    protected XPath xPath;
    protected Document document;
    protected DocumentBuilder documentBuilder;

    final Logger logger = LoggerFactory.getLogger(this.getClass());


    void initializeXPath() {
        xPath = xpathFactory.newXPath();

        //will need this for ISO support
        /*HashMap<String, String> prefMap = getNamespaces();
		SimpleNamespaceContext namespaces = new SimpleNamespaceContext(prefMap);
		xPath.setNamespaceContext(namespaces);*/
    }

    @Override
    public Document parse(InputStream inputStream) throws SAXException, IOException {
        try {
            initializeXPath();
            //Parse the document
            document = documentBuilder.parse(inputStream);
            return document;
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    @Override
    public Document parse(String rawXMLString) throws SAXException, IOException {
        //parse the returned XML to make sure it is well-formed & to format
        //filter extra spaces from xmlString
        rawXMLString = rawXMLString.replaceAll(">[ \t\n\r\f]+<", "><").replaceAll("[\t\n\r\f]+", "");
        InputStream xmlInputStream = new ByteArrayInputStream(rawXMLString.getBytes("UTF-8"));
        return parse(xmlInputStream);
    }

    @Override
    public void setXPathFactory(XPathFactory xpathFactory) {
        this.xpathFactory = xpathFactory;
    }

    @Override
    public void setDocumentBuilder(DocumentBuilder documentBuilder) {
        this.documentBuilder = documentBuilder;
    }

    @Override
    public Document getDocument() {
        return document;
    }

    @Override
    public XPath getXPath() {
        return xPath;
    }


}
