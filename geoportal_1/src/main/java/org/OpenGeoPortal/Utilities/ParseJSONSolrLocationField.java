package org.OpenGeoPortal.Utilities;

import java.io.IOException;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;

public final class ParseJSONSolrLocationField {

	public static String getWmsUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		ArrayNode urls = (ArrayNode) rootNode.path("wms");
		return urls.get(0).asText();
	}
	
	public static String getTilecacheUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		ArrayNode urls = (ArrayNode) rootNode.path("tilecache");
		return urls.get(0).asText();
	}
	
	public static String getWfsUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		String wfsURL = rootNode.path("wfs").getTextValue();
		return wfsURL;
	}
	
	public static String getWcsUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		String wfsURL = rootNode.path("wcs").getTextValue();
		return wfsURL;
	}
	
	public static String getServiceStartUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		String wfsURL = rootNode.path("serviceStart").getTextValue();
		return wfsURL;
	}
	
	public static String getDownloadUrl(String locationField){
		JsonNode rootNode = parseLocationField(locationField);
		String wfsURL = rootNode.path("download").getTextValue();
		return wfsURL;
	}
	
	private static JsonNode parseLocationField(String locationField){
		ObjectMapper mapper = new ObjectMapper();
		JsonNode rootNode = null;
		try {
			rootNode = mapper.readTree(locationField);
		} catch (JsonProcessingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return rootNode;
		
	}
}
