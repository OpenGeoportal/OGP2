package org.opengeoportal.utilities;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

/**
 * A set of methods for parsing and dealing with the Location field in an OGP SolrRecord
 * 
 * The Location field is stored as a String, but should be a JSON object with key-value pairs
 * that describe how to access the layer over the web
 * 
 * @author cbarne02
 *
 */
public final class LocationFieldUtils {
	final static Logger logger = LoggerFactory.getLogger(LocationFieldUtils.class.getName());

	/**
	 * Get the first value of type "type" from the Location field
	 * 
	 * @param type	The field key
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getUrl(String type, String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, type).get(0);

	}
	
	/**
	 * Get the first value in the "wms" array from the Location field
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the wms server for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getWmsUrl(String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, "wms").get(0);

	}
	
	/**
	 * determines if the SolrRecord Location field contains a value for the key "wms"
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return true if the SolrRecord Location field contains a key for "wms"
	 */
	public static Boolean hasWmsUrl(String locationField){
		try {
			return hasKey(locationField, "wms");
		} catch (JsonParseException e) {

		}
		return false;
	}
	
	/**
	 * determines if the SolrRecord Location field contains a value for the key "serviceStart"
	 * 
	 * the service start url refers to a custom servlet at Harvard that configures a layer in GeoServer so
	 * that it can be accessed via OGC web protocols
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return true if the SolrRecord Location field contains a key for "serviceStart"
	 */
	public static Boolean hasServiceStart(String locationField){
		try {
			return hasKey(locationField, "serviceStart");
		} catch (JsonParseException e) {

		}
		return false;
	}
	
	/**
	 * Get the value for the "tilecache" key from the Location field
	 * 
	 * some layers have a tile cache url that differs from the wms url.  if the tile cache acts as
	 * a full wms server, the value should be in "wms" rather than "tilecache"
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the tilecache service point for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getTilecacheUrl(String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, "tilecache").get(0);

	}
	
	/**
	 * Get the value for the "wfs" key from the Location field. 
	 * 
	 * Only vector layers with a wfs service should have
	 * a value here.
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the wfs server for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getWfsUrl(String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, "wfs").get(0);

	}
	
 	/**
	 * determines if the SolrRecord Location field contains a value for the key "wfs"
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return true if the SolrRecord Location field contains a key for "wms"
	 */

	// Added by Allen Lin on Jan, 24, 2014

	public static Boolean hasWfsUrl(String locationField){

		try {

			return hasKey(locationField, "wfs");

		} catch (JsonParseException e) {

		}

		return false;

	}
	
	/**
	 * determines if the SolrRecord Location field contains a value for the passed key
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @param key				The key in the Location Json object
	 * @return true if the key exists at the root of the Location Json object
	 * @throws JsonParseException
	 */
	private static Boolean hasKey(String locationField, String key) throws JsonParseException{
		JsonNode rootNode = parseLocationField(locationField);
		JsonNode pathNode = rootNode.path(key);
		if (pathNode.isMissingNode()){
			return false;
			
		} else {
			return true;
		}
	}
	
	/**
	 * @param locationField		The Solr record Location field as a String
	 * @param key				The key in the Location Json object
	 * @return a list of values with the given key
	 * @throws JsonParseException
	 */
	private static List<String> parseLocationFromKey(String locationField, String key) throws JsonParseException{
		JsonNode rootNode = parseLocationField(locationField);
		JsonNode pathNode = rootNode.path(key);
		Set<String> url = new HashSet<String>();
		if (pathNode.isMissingNode()){
			
			throw new JsonParseException("The Object '" + key + "' could not be found.", null);
			
		} else if (pathNode.isArray()){
			
			ArrayNode urls = (ArrayNode) rootNode.path(key);
			for(JsonNode currentUrl: urls){
				if (currentUrl.isTextual()){
					url.add(currentUrl.asText());
				} else {
					throw new JsonParseException("Invalid url value in Location field", null);
				}
			}
			
		} else if (pathNode.isTextual()){
			url.add(pathNode.asText());
		}

		if (url == null || url.isEmpty()){
			
			throw new JsonParseException("The Object '" + key + "' is empty.", null);

		}
		List<String> urlList = new ArrayList<String>();
		urlList.addAll(url);
		return urlList;
	}
	
	/**
	 * Get the value for the "wcs" key from the Location field
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the wcs server for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getWcsUrl(String locationField) throws JsonParseException{

		return parseLocationFromKey(locationField, "wcs").get(0);
	}
	
	/**
	 * Get the value for the "serviceStart" key from the Location field
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the "serviceStart" service point for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static String getServiceStartUrl(String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, "serviceStart").get(0);

	}
	
	/**
	 * Get the values for the "fileDownload" key from the Location field
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	a List of urls for download for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */
	public static List<String> getDownloadUrl(String locationField) throws JsonParseException{
			return parseLocationFromKey(locationField, "fileDownload");

	}
	
		/**
		 * determines if the SolrRecord Location field contains a value for the key "wfs"
		 * 
		 * @param locationField		The Solr record Location field as a String
		 * @return true if the SolrRecord Location field contains a key for "wms"
		 */

		// Added by Allen Lin on Jan, 24, 2014

		public static Boolean hasArcGISRestUrl(String locationField){

			try {

				return hasKey(locationField, "ArcGISRest");

			} catch (JsonParseException e) {

	

			}

			return false;

		}
		
 	/**
	 * Get the value in the "ArcGISRest" field from the Location field
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return	the url for the wms server for the layer, if the record has been populated correctly
	 * @throws JsonParseException
	 */

	//Added by Allen Lin on Jan, 24, 2014

	public static String getArcGISRestUrl(String locationField) throws JsonParseException{
		return parseLocationFromKey(locationField, "ArcGISRest").get(0);
	}
	
	/**
	 * parses the SolrRecord Location Field into a JsonNode object for further processing.
	 * 
	 * Additionally, attempts to normalize key names before parsing
	 * 
	 * @param locationField		The Solr record Location field as a String
	 * @return a JsonNode parsed from the locationField String
	 */
	private static JsonNode parseLocationField(String locationField){
		//normalize key names
		locationField = locationField.replaceAll("(?i)\"wms\"", "\"wms\"");
		locationField = locationField.replaceAll("(?i)\"wcs\"", "\"wcs\"");
		locationField = locationField.replaceAll("(?i)\"wfs\"", "\"wfs\"");
		locationField = locationField.replaceAll("(?i)\"serviceStart\"", "\"serviceStart\"");
		locationField = locationField.replaceAll("(?i)\"download\"", "\"fileDownload\"");
		locationField = locationField.replaceAll("(?i)\"fileDownload\"", "\"fileDownload\"");
		locationField = locationField.replaceAll("(?i)\"tilecache\"", "\"tilecache\"");
		locationField = locationField.replaceAll("(?i)\"arcgisrest\"", "\"ArcGISRest\"");


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
