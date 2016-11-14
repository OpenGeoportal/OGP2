package org.opengeoportal.ogc.wfs;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.OwsInfo.OwsProtocol;
import org.opengeoportal.utilities.OgpXmlUtils;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class WfsDescribeFeature implements OgcInfoRequest{
	public final String VERSION = "1.0.0";
	@Override
	public String createRequest(String qualifiedLayerName){
	 	/*String describeFeatureRequest = "<DescribeFeatureType"
	            + " version=\"" + VERSION + "\""
	            + " service=\"WFS\""
	            + " xmlns=\"http://www.opengis.net/wfs\""
	            + " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
	            + " xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/wfs.xsd\">"
	            + 	"<TypeName>" + qualifiedLayerName + "</TypeName>"
	            + "</DescribeFeatureType>";*/
	 	String describeFeatureQuery = "SERVICE=WFS&VERSION=" + VERSION + "&REQUEST=DescribeFeatureType&TYPENAME=" + qualifiedLayerName;
	 	
	 	return describeFeatureQuery;
	}
	
	
	@Override
	public OwsInfo parseResponse(InputStream inputStream) throws Exception {

		/*
		 * 
		 * <xsd:schema elementFormDefault="qualified" targetNamespace="http://geoserver.sf.net">
		 * <xsd:import namespace="http://www.opengis.net/gml" schemaLocation="http://geoserver01.uit.tufts.edu/schemas/gml/3.1.1/base/gml.xsd"/>
		 * <xsd:complexType name="GISPORTAL.GISOWNER01.CHELSEAWALLS05Type">
		 * <xsd:complexContent>
		 * <xsd:extension base="gml:AbstractFeatureType">
		 * <xsd:sequence>
		 * <xsd:element maxOccurs="1" minOccurs="0" name="DXF_LAYER" nillable="true" type="xsd:string"/>
		 * <xsd:element maxOccurs="1" minOccurs="0" name="TYPE" nillable="true" type="xsd:string"/
		 * ><xsd:element maxOccurs="1" minOccurs="0" name="Shape_Leng" nillable="true" type="xsd:double"/>
		 * <xsd:element maxOccurs="1" minOccurs="0" name="Shape" nillable="true" type="gml:MultiLineStringPropertyType"/>
		 * </xsd:sequence>
		 * </xsd:extension>
		 * </xsd:complexContent></xsd:complexType><xsd:element name="GISPORTAL.GISOWNER01.CHELSEAWALLS05" substitutionGroup="gml:_Feature" type="sde:GISPORTAL.GISOWNER01.CHELSEAWALLS05Type"/></xsd:schema>
		 * 
		 * 
		 */
		//Parse the document
		Document document = OgpXmlUtils.getDocument(inputStream);
			//initialize return variablec
			Map<String, String> describeLayerInfo = new HashMap<String, String>();

			//get the namespace info
			Node schemaNode = document.getFirstChild();
			OgpXmlUtils.handleServiceException(schemaNode);
			
			try {
				NamedNodeMap schemaAttributes = schemaNode.getAttributes();
				describeLayerInfo.put("nameSpace", schemaAttributes.getNamedItem("targetNamespace").getNodeValue());

				//we can get the geometry column name from here
				NodeList elementNodes;
				
				if(document.getElementsByTagName("xsd:element").getLength()!=0){
					elementNodes = document.getElementsByTagName("xsd:element");
				} else {
					//ArcGIS uses prefix "xs" but xs and xsd are essentially same if they refer to the same schema.
					//See reference http://stackoverflow.com/questions/1193563/difference-between-xs-and-xsd-in-xml-schema-file
					elementNodes = document.getElementsByTagName("xs:element");
				}
				
				for (int i = 0; i < elementNodes.getLength(); i++){
					Node currentNode = elementNodes.item(i);
					NamedNodeMap currentAttributeMap = currentNode.getAttributes();
					String attributeValue = null;
					for (int j = 0; j < currentAttributeMap.getLength(); j++){
						Node currentAttribute = currentAttributeMap.item(j);
						String currentAttributeName = currentAttribute.getNodeName();
						if (currentAttributeName.equals("name")){
							attributeValue = currentAttribute.getNodeValue();
						} else if (currentAttributeName.equals("type")){
							describeLayerInfo.put("attr" + (i+1), attributeValue + "," + currentAttribute.getNodeValue());
							if (currentAttribute.getNodeValue().startsWith("gml:")){
								describeLayerInfo.put("geometryColumn", attributeValue);
							}
						}
					}
				}
				
			} catch (Exception e){
				throw new Exception("Error getting layer info from DescribeFeatureType: "+ e.getMessage());
			}
			OwsInfo owsResponse = new OwsInfo();
			owsResponse.setOwsProtocol(OwsProtocol.parseOwsProtocol(this.getOgcProtocol()));
			owsResponse.setInfoMap(describeLayerInfo);
			
			return owsResponse;
		 }
	



	@Override
	public String getMethod() {
		return "GET";
	}

	@Override
	public String getOgcProtocol() {
		return "wfs";
	}
	
	@Override
	public String getVersion() {
		return VERSION;
	}
	
}




