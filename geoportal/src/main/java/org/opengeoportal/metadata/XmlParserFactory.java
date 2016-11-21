package org.opengeoportal.metadata;

import javax.annotation.PostConstruct;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

/**
 * @author cbarne02
 *         <p>
 *         Factory for XMLParserImpl objects. The Factory injects a
 *         DocumentBuilder and an XPathFactory, since these objects are
 *         expensive (and slow) to create.
 */
public class XmlParserFactory {
    //private ApplicationContext applicationContext;

    final Logger logger = LoggerFactory.getLogger(this.getClass());
    private XPathFactory xpathFactory;
    private DocumentBuilder documentBuilder = null;

    XmlParserFactory() {
        xpathFactory = XPathFactory.newInstance();
    }

    /**
     * Creates the DocumentBuilder or resets it if it has already been created.
     *
     * @throws ParserConfigurationException
     */
    @PostConstruct
    void initDocumentBuilder() throws ParserConfigurationException {
        if (documentBuilder == null) {
            DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory
                    .newInstance();

            documentBuilderFactory.setValidating(false); // dtd isn't always
            // available; would
            // be nice to
            // attempt to
            // validate
            documentBuilderFactory
                    .setFeature(
                            "http://apache.org/xml/features/nonvalidating/load-external-dtd",
                            false);
            documentBuilderFactory.setNamespaceAware(true);

            // Use document builder factory
            documentBuilder = documentBuilderFactory.newDocumentBuilder();
        } else {
            documentBuilder.reset();
        }

    }

    /**
     * creates, initializes, and returns the XmlParser
     *
     * @return XmlParser
     * @throws Exception
     */
    public XmlParser getParser() throws Exception {
        logger.debug("Getting xml parser instance...");
        XmlParser parser = new XmlParserImpl();
        parser.setXPathFactory(xpathFactory);
        initDocumentBuilder();
        parser.setDocumentBuilder(documentBuilder);
        return parser;
    }


}
