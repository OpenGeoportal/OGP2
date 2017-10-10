package org.opengeoportal.utilities;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * This class contains utilities and convenience methods for dealing with XML
 * 
 * @author cbarne02
 *
 */
public class OgpXmlUtils {
	final static Logger logger = LoggerFactory.getLogger(OgpXmlUtils.class.getName());

	/**
	 * some boilerplate code to get a w3c.dom Document instance (namespace aware) from an InputStream
	 * 
	 * @param inputStream 	an InputStream of XML
	 * @return a w3c.dom Document instance
	 * @throws SAXException
	 * @throws IOException
	 * @throws ParserConfigurationException
	 */
	public static Document getDocument(InputStream inputStream) throws SAXException, IOException, ParserConfigurationException{
		try{
			// Create a factory
			DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();

			documentBuilderFactory.setValidating(false);  // dtd isn't always available; would be nice to attempt to validate
			documentBuilderFactory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
			documentBuilderFactory.setNamespaceAware(true);

			// Use document builder factory
			DocumentBuilder builder = documentBuilderFactory.newDocumentBuilder();
			//Parse the document
			Document document = builder.parse(inputStream);
			return document;
		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}


	/**
	 * A method to return a Node name, whether or not the parent Document is namespaced 
	 * 
	 * @param node	
	 * @return	a String with the node name
	 * @throws Exception
	 */
	public static String alwaysGetName(Node node) throws Exception{
		if (node.equals(null)){
			throw new Exception("This node is null.");
		}
		String localName = "";
		try{
			if (!node.getLocalName().equals(null)){
				localName = node.getLocalName();
			}
		} catch (NullPointerException e){
			localName = node.getNodeName();
		}
		return localName;
	}
	
	 /**
	  * method determines if XML Document is an ows service exception report and if so,
	  * tries to convert it into an Exception
	  * 
	  * @param baseNode	the root node of the document
	  * @throws Exception	if the parent Document is an ows service exception report; 
	  * 					message contains the exception code returned
	 */
	 public static void handleServiceException(Node baseNode) throws Exception{
		 /*
		  * 
		  * <ows:ExceptionReport version="1.0.0"
  				xsi:schemaLocation="http://www.opengis.net/ows http://data.fao.org/maps/schemas/ows/1.0.0/owsExceptionReport.xsd"
  				xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ows="http://www.opengis.net/ows">
  				<ows:Exception exceptionCode="NoApplicableCode">
    				<ows:ExceptionText>java.lang.NullPointerException null</ows:ExceptionText>
  				</ows:Exception>
			</ows:ExceptionReport>
		  */

		 logger.debug("Full response: " + baseNode.getTextContent());
			String errorMessage = "";
			
			if (alwaysGetName(baseNode).toLowerCase().contains("serviceexception")){
				if (baseNode.hasChildNodes()){
					for (int i = 0; i < baseNode.getChildNodes().getLength(); i++){
						String nodeName = alwaysGetName(baseNode.getChildNodes().item(i));
						if (nodeName.equals("ServiceException")){
							logger.error("Service Exception:");
							errorMessage += baseNode.getChildNodes().item(i).getTextContent().trim();
						} 
					}
				} else {
					errorMessage += "poorly formed service exception";
				}
			} else if (alwaysGetName(baseNode).toLowerCase().contains("exception")){
				try{
					errorMessage += baseNode.getFirstChild().getAttributes().getNamedItem("exceptionCode").getTextContent();
				} catch (Exception e){
					errorMessage += "Abridged response: " + baseNode.getTextContent().trim();
				}
			} else {
				return;
			}
			if (errorMessage.length() > 1024){
				errorMessage = errorMessage.substring(0, 1023);
			}
			throw new Exception(errorMessage);
	 }
	 
	/**
	 * This method looks at the children of a given node, matches the ones in the passed Set,
	 * then returns a map of the matches with their values
	 * 
	 * @param parent		parent node
	 * @param childTags		Set of desired tag names
	 * @return Map of desired tag names to their values
	 */
	public static Map<String,String> getDesiredChildrenValues (Node parent, Set<String> childTags){
			Map<String,String> responseMap = new HashMap<String,String>();
			NodeList children = parent.getChildNodes();
			for (int i=0; i < children.getLength(); i++){
				Node child = children.item(i);
				responseMap.putAll(getSiblingValues(child, childTags));					
			}
			return responseMap;
		}
		
	/**
	 * This method gets a List of values for all child nodes with the specified tag name
	 * 
	 * @param parentNode
	 * @param tagName	the name of the desired node type
	 * @return a List of values for child nodes with the given tag name
	 */
	public static List<String> getChildValuesList(Node parentNode, String tagName){
		List<String> values = new ArrayList<String>();
		NodeList children = parentNode.getChildNodes();
		for (int i = 0 ; i < children.getLength(); i++){
			Node currentNode = children.item(i);
			if (currentNode.getLocalName().equalsIgnoreCase(tagName)){
				values.add(currentNode.getTextContent().trim());
			}
		}
		return values;
	}
	
	/**
	 * Gets the attribute value for a Node given the attribute name
	 * 
	 * @param currentNode
	 * @param attributeName
	 * @return the attribute value
	 */
	public static String getAttribute(Node currentNode, String attributeName){
		NamedNodeMap attrs = currentNode.getAttributes();
		return attrs.getNamedItem(attributeName).getNodeValue().trim();
	}
	
	/**
	 * This method looks at the siblings of a given node, matches the ones in the passed Set,
	 * then returns a map of the matches with their values
	 * 
	 * @param currentNode
	 * @param siblingTags	a Set of Strings containing the tagnames to look for
	 * @return Map of desired tag names to their values
	 */
	public static Map<String,String> getSiblingValues(Node currentNode, Set<String> siblingTags){
			Map<String,String> responseMap = new HashMap<String,String>();
			String testString = currentNode.getLocalName().toLowerCase();
			for (String tagName: siblingTags){
				if (testString.contains(tagName.toLowerCase())){
					responseMap.put(tagName, currentNode.getTextContent().trim());
					return responseMap;
				} 
			}
			
			return responseMap;
		}
	
	/**
	 * Get the first child with a certain tag name
	 * 
	 * @param parent
	 * @param tagName
	 * @return child Node with the given tag name
	 * @throws Exception	if no child with the given tag name is found
	 */
	public static Node getChildNode(Node parent, String tagName) throws Exception{
		NodeList children = parent.getChildNodes();
		
		for (int i = 0 ; i < children.getLength(); i++){
			Node currentNode = children.item(i);
			if (currentNode.getLocalName().equalsIgnoreCase(tagName)){
				return currentNode;
			}
		}
		
		throw new Exception("Child Node ['" + tagName + "'] not found." );
		
	}
}
