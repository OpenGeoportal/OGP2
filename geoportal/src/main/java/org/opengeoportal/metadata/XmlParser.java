package org.opengeoportal.metadata;

import java.io.IOException;
import java.io.InputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;

/**
 * @author cbarne02
 *         <p>
 *         An interface for a generic XML parser. Essentially just handles the
 *         boilerplate code for parsing an InputStream or XML string into a W3C
 *         document for further processing or parsing. An XPath factory and
 *         DocumentBuilder must be set for the parser to work.
 */

public interface XmlParser {

    /**
     * @param xpathFactory
     */
    void setXPathFactory(XPathFactory xpathFactory);

    /**
     * @param documentBuilder
     */
    void setDocumentBuilder(DocumentBuilder documentBuilder);

    /**
     * @return
     */
    XPath getXPath();

    /**
     * @return
     */
    Document getDocument();

    /**
     * Tries to parse an InputStream into a W3C XML Document
     *
     * @param inputStream
     * @return
     * @throws SAXException
     * @throws IOException
     */
    Document parse(InputStream inputStream) throws SAXException, IOException;

    /**
     * Tries to parse a String into a W3C XML Document
     *
     * @param rawXMLString
     * @return
     * @throws SAXException
     * @throws IOException
     */
    Document parse(String rawXMLString) throws SAXException, IOException;

}
