package org.opengeoportal.metadata;

import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.util.Map;

public interface MetadataParser {

    Document parse(String xmlString) throws SAXException, IOException;

    Map<String, String> getAttributeMap() throws XPathExpressionException;

    String getContactPhoneNumber();

    String getContactName();

    String getContactAddress();
}
