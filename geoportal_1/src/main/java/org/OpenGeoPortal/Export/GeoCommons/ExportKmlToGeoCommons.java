package org.OpenGeoPortal.Export.GeoCommons;

import org.OpenGeoPortal.Download.MetadataRetriever;
import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

public class ExportKmlToGeoCommons {
	    private final RestTemplate restTemplate;
	    private final Credentials credentials;
	    private final String serverName = "http://geocommons.com";
	    String workspace;
	    String layerId;
	    CreateDataSetRequestJson createDataSetRequestJson;
		private String dataSetUri;
		LayerInfoRetriever layerInfoRetriever;
		private SolrRecord layerInfo;
		MetadataRetriever metadataRetriever;
		private final String localUrl = "http://geodata.tufts.edu";
		
	    public LayerInfoRetriever getLayerInfoRetriever() {
			return layerInfoRetriever;
		}

		public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
			this.layerInfoRetriever = layerInfoRetriever;
		}

		public MetadataRetriever getMetadataRetriever() {
			return metadataRetriever;
		}

		public void setMetadataRetriever(MetadataRetriever metadataRetriever) {
			this.metadataRetriever = metadataRetriever;
		}

		public ExportKmlToGeoCommons(String layerId, String username, String password) {
	    	this.layerId = layerId;
	    	
	    	DefaultHttpClient httpclient = new DefaultHttpClient();
	    	HttpHost targetHost = new HttpHost(this.serverName, 80, "http");
	        this.credentials = new UsernamePasswordCredentials(username, password);

			httpclient.getCredentialsProvider().setCredentials(
	    	        new AuthScope(targetHost.getHostName(), targetHost.getPort()), 
	    	        this.credentials);
	    	
			// Create AuthCache instance
			AuthCache authCache = new BasicAuthCache();
			// Generate BASIC scheme object and add it to the local auth cache
			BasicScheme basicAuth = new BasicScheme();
			authCache.put(targetHost, basicAuth);

			// Add AuthCache to the execution context
			BasicHttpContext localcontext = new BasicHttpContext();
			localcontext.setAttribute(ClientContext.AUTH_CACHE, authCache);

			HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpclient);
			
	        this.restTemplate = new RestTemplate(factory);
	    }
		/*
		 * curl -i -X POST -u "user:password" -d
		 * "url=http://api.flickr.com/services/feedsgeo/?tags=glitter&lang=en-us&format=kml_nl"
		 * http://geocommons.com/datasets.json
		 */
		/*
		 * type type of file being uploaded csv,kml,rss,wms,tile title name of
		 * dataset Unemployment in the USA 2010 description description of what the
		 * dataset is This dataset shows the increase in unemployment in the USA
		 * between 2009-2010 author who created the dataset Bureau of Labor
		 * Statistics tags words that describe the dataset and relate it to others
		 * unemployment,labor,workforce metadata_url link to url containing metadata
		 * http://www.example.com citation_url link to the organization the data is
		 * from http://www.exampleorg.com contact_name person to contact about the
		 * data John Doe contact_address address of the organization the data is
		 * from 123 Main Street, Somewhere VA contact_phone phone number of
		 * organization creating the data 555-555-5555 process_notes additional
		 * notes about how you created the dataset Ran data through Google Refine to
		 * remove duplicates before uploading
		 */
	    
	    public void uploadKmlDataSet(){
	    	String url = this.serverName + "/datasets.json";
	    	this.createDataSetRequestObject();
	    	CreateDataSetResponseJson result = restTemplate.postForObject(url, this.createDataSetRequestJson, CreateDataSetResponseJson.class);
	    	this.dataSetUri = result.getLocation();
	    }
	    
	    private void setLayerInfo() throws Exception{
	    	SolrRecord allLayers = layerInfoRetriever.getAllLayerInfo(this.layerId);
	    	this.layerInfo = allLayers;
	    }
	    
	    private SolrRecord getLayerInfo(){
	    	if (this.layerInfo == null){
	    		try {
					this.setLayerInfo();
				} catch (Exception e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	    	}
	    	return this.layerInfo;
	    }
	    
	    public void createMap(){
	    	//POST /maps.json
	    	/*
	    	 * curl -i -u “user:password” -d “basemap=118254” -d “title=Sample Custom Icon Map” -d “layers[][source]=finder:160474” -d “layers[][styles][icon][symbol]=http://farm5.static.flickr.com/4125/5219379732_e7251b5a47_o_d.png” -X POST http://geocommons.com/maps.json
	    	 * 
	    	 * Authentication

Required Parameters
Parameter 	Description 	Example
title 	the title of the map 	title=World%20Population
basemap 	the basemap provider 	basemap=“Acetate”
Optional Parameters
Parameter 	Description 	Example
description 	text description of a map 	description=This%20map%20shows
tags 	tags categorizing you map 	tags=economy
extent 	array of the area covered by the map order is west,south,east,north 	extent=-180,-90,180,90
//extent of exported layers
layers 	array of layers to add to the map 	layers[][source]=finder:98696
permissions 	{"permissions": [{"group_id": “everyone”, “permissions” : {"view":true,download,edit

Returns
*Type 	Description 	Example*
file 	returns a file of the type requested 	http://geocommons.com/maps/51541.json
	    	 */
	    }
	    
		private void createDataSetRequestObject() {
	    	CreateDataSetRequestJson createDataSetRequestJson = new CreateDataSetRequestJson();
	    	createDataSetRequestJson.setType("kml");
	    	SolrRecord requestedLayerInfo = getLayerInfo();
	    	if (!requestedLayerInfo.getAccess().equalsIgnoreCase("public")){
	    		//throw new SecurityException();
	    	}
	    	//needs to be changed to kml service point, format
	    	String bounds = requestedLayerInfo.getMinX() + "," + requestedLayerInfo.getMinY() + ",";
	    	bounds += requestedLayerInfo.getMaxX() + "," + requestedLayerInfo.getMaxY();
	    	String workspaceName = requestedLayerInfo.getWorkspaceName();
	    	String layerName = requestedLayerInfo.getName();
	    	String SRS = "EPSG:4326";
	    	//http://geoserver01.uit.tufts.edu/wms?LAYERS=sde:GISPORTAL.GISOWNER01.CHELSEACULVERTSDITCHES05&request=getmap&format=kml&bbox=-71.052205,42.385485,-71.0138,42.41027&srs=EPSG:4326&width=1&height=1
	    	String kmlUrl = ParseJSONSolrLocationField.getWmsUrl(requestedLayerInfo.getLocation())
	    		+ "layers=" + workspaceName + ":" + layerName + "&request=getMap&format=kml&bbox="
	    		+ bounds + "&srs=" + SRS + "&width=1&height=1";
	    	//height and width don't seem to matter; should test with a raster layer
	    	createDataSetRequestJson.setUrl(kmlUrl);
	    	createDataSetRequestJson.setTitle(requestedLayerInfo.getLayerDisplayName());
	    	createDataSetRequestJson.setAuthor(requestedLayerInfo.getOriginator());
	    	createDataSetRequestJson.setDescription(requestedLayerInfo.getDescription());
	    	String keywords = requestedLayerInfo.getThemeKeywords().trim() + " " + requestedLayerInfo.getPlaceKeywords().trim();
	    	createDataSetRequestJson.setTags(keywords);
	    	//where can I get this url from?
	    	createDataSetRequestJson.setMetadata_url(this.localUrl + "/getMetadata?id=" + this.layerId);
	    	createDataSetRequestJson.setContact_name(this.metadataRetriever.getContactName(this.layerId));
	    	createDataSetRequestJson.setContact_address(this.metadataRetriever.getContactAddress(this.layerId));
	    	createDataSetRequestJson.setContact_phone(this.metadataRetriever.getContactPhoneNumber(this.layerId));
	    	this.createDataSetRequestJson = createDataSetRequestJson;
		}
		
		public String getDataSetUri(){
			return this.dataSetUri;
		}
	    
	
	    /*public FeatureTypeInfoFromRESTJson getFeatureTypeInfoFromREST() {    
	    	Map<String, String> vars = new HashMap<String, String>();
	    	vars.put("serverName", serverName);
	    	vars.put("workspace", workspace);
	    	vars.put("featuretype", layerName);
	    	FeatureTypeInfoFromRESTJson result = restTemplate.getForObject("http://{serverName}/rest/workspaces/{workspace}/featuretypes/{featuretype}.json", FeatureTypeInfoFromRESTJson.class, vars);
			return result;
	    }
	    */
}
