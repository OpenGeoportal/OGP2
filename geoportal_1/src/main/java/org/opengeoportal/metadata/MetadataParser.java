package org.opengeoportal.metadata;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;

public interface MetadataParser {

	void setXPathFactory(XPathFactory xpathFactory);

	void setDocumentBuilder(DocumentBuilder documentBuilder);

	Document getDocument();

}
