package org.opengeoportal.ogc.wfs;

import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WfsGetFeature {
	final static Logger logger = LoggerFactory.getLogger(WfsGetFeature.class.getName());

	public static String createWfsGetFeatureRequest(String layerName, String workSpace, String nameSpace, String outputFormat, String filter) throws Exception {
		return createWfsGetFeatureRequest(layerName, workSpace, nameSpace, -1, "", outputFormat, filter);
		 
	}
	
	private static String getAttributeString(String attrName, int value){
		String attrString = "";
		if(value > 0){
			attrString = " " + attrName + "=\"" + Integer.toString(value) + "\""; 
		}
		return attrString;
	}
	
	private static String getAttributeString(String attrName, String value){
		String attrString = "";
		if(!value.trim().isEmpty()){
			attrString = " " + attrName + "=\"" + value.trim() + "\""; 
		}
		return attrString;
	}
	
	public static String createWfsGetFeatureRequest(String layerName, String workSpace, String nameSpace, int maxFeatures, String epsgCode, String outputFormat, String filter) throws Exception {

		//--generate POST message
		//info needed: geometry column, bbox coords, epsg code, workspace & layername
		layerName = OgpUtils.getLayerNameNS(workSpace, layerName);

		String getFeatureRequest = "<wfs:GetFeature service=\"WFS\" version=\"1.0.0\""
			+ " outputFormat=\"" + outputFormat + "\""
			+ getAttributeString("maxfeatures", maxFeatures)
			+ getAttributeString("srsName", epsgCode)	
			+ getNameSpaceString(workSpace, nameSpace)
  			+ " xmlns:wfs=\"http://www.opengis.net/wfs\""
  			+ " xmlns:ogc=\"http://www.opengis.net/ogc\""
  			+ " xmlns:gml=\"http://www.opengis.net/gml\""
  			+ " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
  			+ " xsi:schemaLocation=\"http://www.opengis.net/wfs"
            + " http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd\">"
  			+ "<wfs:Query typeName=\"" + layerName + "\">"
  			+ filter
  			+ "</wfs:Query>"
			+ "</wfs:GetFeature>";
		logger.info(getFeatureRequest);
    	return getFeatureRequest;
	}
	
	public static String getMethod(){
		return "POST";
	}
	
	private static String getNameSpaceString(String workSpace, String nameSpace){
		//if either is missing, skip the whole thing
		String nsString = "";
		if (!workSpace.trim().isEmpty() && !nameSpace.trim().isEmpty()){
			nsString = " xmlns:" + workSpace + "=\"" + nameSpace + "\"";
		}
		return nsString;
	}
	
	public static String getBboxFilter(BoundingBox bounds, String geometryColumn, int epsgCode){

		String bboxFilter = "<ogc:Filter>"
  		+		"<ogc:BBOX>"
    	+			"<ogc:PropertyName>" + geometryColumn + "</ogc:PropertyName>"
    	+			bounds.generateGMLBox()
    	+		"</ogc:BBOX>"
  		+	"</ogc:Filter>";
			
		return bboxFilter;
	}
	

}
