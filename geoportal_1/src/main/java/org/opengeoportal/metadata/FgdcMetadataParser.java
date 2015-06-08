package org.opengeoportal.metadata;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import org.springframework.beans.factory.annotation.Autowired;
import org.xml.sax.SAXException;

/**
 * @author cbarne02
 * 
 *         Provides some utilities for retrieving additional information from an
 *         FGDC XML document.
 * 
 *         Currently retrieves:
 *         <ul>
 *         <li>A map of attribute labels and descriptions</li>
 *         <li>contact info</li>
 *         </ul>
 */
public class FgdcMetadataParser implements MetadataParser {

    @Autowired
    private XmlParser xmlParser;

    private NodeList contactNodes;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private final static String ATTRIBUTE_NODES = "/metadata/eainfo/detailed/attr";
	private final static String CONTACT_NODES = "/metadata/idinfo/ptcontac/cntinfo";

    @Override
    public Document parse(String xmlString) throws SAXException, IOException {
        logger.info(Boolean.toString(xmlParser == null));

        return xmlParser.parse(xmlString);
    }

    @Override
    public Map<String, String> getAttributeMap()
			throws XPathExpressionException {
        logger.debug("XmlParser is null: " + Boolean.toString(xmlParser.getXPath() == null));

        NodeList attributeNodes = (NodeList) xmlParser.getXPath().evaluate(
                ATTRIBUTE_NODES, xmlParser.getDocument(), XPathConstants.NODESET);
        Map<String, String> attrMap = new HashMap<String, String>();

		for (int i = 0; i < attributeNodes.getLength(); i++) {
			Node current = attributeNodes.item(i);
			NodeList children = current.getChildNodes();
			String label = "";
			String description = "";
			for (int j = 0; j < children.getLength(); j++) {
				Node child = children.item(j);
				String name = child.getNodeName();
				String value = child.getTextContent();
				if (name == null) {
					continue;
				}
				if (name.equalsIgnoreCase("attrlabl")) {
					label = value.trim();
				}

				if (name.equalsIgnoreCase("attrdef")) {
					description = value.trim();
				}
				// attrlabl
				// attrdef
			}

			if (!label.isEmpty()) {
				attrMap.put(label, description);
			}

		}
		return attrMap;
	}

	/*
	 * <ptcontac> <cntinfo> <cntorgp> <cntorg>Harvard Map Collection, Harvard
	 * College Library</cntorg> </cntorgp> <cntpos>Harvard Geospatial
	 * Library</cntpos> <cntaddr> <addrtype>mailing and physical
	 * address</addrtype> <address>Harvard Map Collection</address>
	 * <address>Pusey Library</address> <address>Harvard University</address>
	 * <city>Cambridge</city> <state>MA</state> <postal>02138</postal>
	 * <country>USA</country> </cntaddr> <cntvoice>617-495-2417</cntvoice>
	 * <cntfax>617-496-0440</cntfax>
	 * <cntemail>hgl_ref@hulmail.harvard.edu</cntemail> <hours>Monday - Friday,
	 * 9:00 am - 4:00 pm EST-USA</hours> </cntinfo> </ptcontac>
	 */


	public NodeList getContactNodeList() throws XPathExpressionException {
		if (contactNodes == null) {
            contactNodes = (NodeList) xmlParser.getXPath().evaluate(CONTACT_NODES,
                    xmlParser.getDocument(), XPathConstants.NODESET);
        }
		return contactNodes;

	}

	public Node getContactNode(String nodeName) {
		NodeList contactInfo = null;
		try {
			contactInfo = this.getContactNodeList();
		} catch (Exception e) {
            logger.warn("No contact info found.");
            e.printStackTrace();
		}
		for (int i = 0; i < contactInfo.getLength(); i++) {
			Node currentNode = contactInfo.item(i);
			if (currentNode.getNodeName().equalsIgnoreCase(nodeName)) {
				return currentNode;
			}
		}
		return null;
	}

    @Override
    public String getContactPhoneNumber() {
		return this.getContactNode("cntvoice").getNodeValue().trim();
	}

    @Override
    public String getContactName() {
		String contactName = this.getContactNode("cntpos").getNodeValue()
				.trim();
		return contactName;
	}

    @Override
    public String getContactAddress() {
		Node addressNode = this.getContactNode("cntaddr");
		NodeList addressNodeList = addressNode.getChildNodes();

		String address = "";
		String city = "";
		String state = "";
		String postal = "";
		String country = "";
		for (int i = 0; i < addressNodeList.getLength(); i++) {
			Node currentAddressLine = addressNodeList.item(i);
			if (currentAddressLine.getNodeName().equalsIgnoreCase("address")) {
				address += currentAddressLine.getNodeValue().trim() + ", ";
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase(
					"state")) {
				state = "";
				state += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase(
					"postal")) {
				postal = "";
				postal += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName().equalsIgnoreCase(
					"country")) {
				country = "";
				country += currentAddressLine.getNodeValue().trim();
			} else if (currentAddressLine.getNodeName()
					.equalsIgnoreCase("city")) {
				city = "";
				city += currentAddressLine.getNodeValue().trim();
			}
		}
		String fullAddress = "";
		if (!address.isEmpty()) {
			fullAddress += address;
		}
		if (!city.isEmpty()) {
			fullAddress += city + ",";
		}
		if (!state.isEmpty()) {
			fullAddress += state + " ";
		}
		if (!postal.isEmpty()) {
			fullAddress += postal;
		}
		if (!country.isEmpty()) {
			fullAddress += ", " + country;
		}
		return fullAddress;
	}
}
