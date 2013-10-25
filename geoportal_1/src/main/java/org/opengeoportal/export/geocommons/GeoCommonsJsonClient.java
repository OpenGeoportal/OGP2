package org.opengeoportal.export.geocommons;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthSchemeProvider;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.impl.auth.BasicSchemeFactory;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;

import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.layer.AccessLevel;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.layer.Metadata;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

public class GeoCommonsJsonClient implements GeoCommonsClient {
	    private RestTemplate restTemplate;
	    private Credentials credentials;
	    private final String serverName = "http://geocommons.com";
	    //String workspace;
	    //private String layerName;
		//private URI dataSetUri;
	    @Autowired
		LayerInfoRetriever layerInfoRetriever;
	    @Autowired
		MetadataRetriever metadataRetriever;
		private Set<String> allTags;
		@Autowired
		QuickDownload quickDownload;
		
		final Logger logger = LoggerFactory.getLogger(this.getClass());

		private boolean anonymous = false;
		
	    public QuickDownload getQuickDownload() {
			return quickDownload;
		}

		public void setQuickDownload(QuickDownload quickDownload) {
			this.quickDownload = quickDownload;
		}

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

		public void initializeClient(String username, String password) {
	    	CloseableHttpClient httpclient = null;
	    	
	    	HttpHost targetHost = new HttpHost(this.serverName, 80, "http");
	    	
	    	if (!(username.isEmpty() && password.isEmpty())){
	    		CredentialsProvider credsProvider = new BasicCredentialsProvider();
	    		credsProvider.setCredentials(new AuthScope(AuthScope.ANY), new UsernamePasswordCredentials(username, password));	    		
	    		
	    		HttpClientBuilder builder = HttpClients.custom();
	    		builder.setDefaultCredentialsProvider(credsProvider);
	    		final Registry<AuthSchemeProvider> authSchemeRegistry = RegistryBuilder.<AuthSchemeProvider>create()
	    		            .register("basic", new BasicSchemeFactory())
	    		            .build();
				builder.setDefaultAuthSchemeRegistry(authSchemeRegistry);
	    		httpclient = builder.build();

	    	} else {
	    		this.anonymous = true;
	    		httpclient = HttpClients.createDefault();
	    	}
			HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpclient);
			
	        this.restTemplate = new RestTemplate(factory);
	        
	        this.allTags = new HashSet<String>();
	        logger.info("client initialized");
	    }
	    
		public String getExistingLayer(String layerName){
			SearchResponseJson searchResponse = this.searchForLayer(layerName);
			if (searchResponse.getTotalResults() > 0){
				return searchResponse.getEntries().get(0).getLink();
			} else {
				logger.info("No matching layers found in GeoCommons.");
				return "";
			}
		}
		
	    public String uploadWmsDataSet(String layerId) throws Exception{
	    	//requires auth
	    	if (this.anonymous){
	    		throw new Exception("This function requires authentication.");
	    	}
	    	String resultString = null;
	    	String url = this.serverName + "/datasets.json";
	    	CreateStreamDataSetRequestJson createDataSetRequestJson = this.createStreamDataSetRequestObject(layerId);
			createDataSetRequestJson.setType("wms");
			
	    	//String existingLayer = this.getExistingLayer(layerId);
	    	
	    	logger.info("Attempting to add wms data stream to GeoCommons");
	    	try {
	    	    URI result = restTemplate.postForLocation(url, createDataSetRequestJson);
	    	    resultString = result.toString();
	    	} catch (HttpClientErrorException e1){
	    	    //String result = restTemplate.postForObject(url, addLayerToMapRequestJson, String.class);
	    	    //["Your file size has exceeded the KML file size limit. Please keep your file size under twenty (20) megabytes.", "RecordInvalid"]
	    	    e1.getMessage();
	    	    System.out.println(e1.getResponseBodyAsString());
	    	    throw new Exception(e1.getResponseBodyAsString());
	    	} catch (ResourceAccessException e1){    		
	    		logger.error("GeoCommons server is not responding.");
	    		throw new Exception("GeoCommons server is not responding.");
	    	} catch (Exception e1){
	    	  	e1.getMessage();
	    	   	e1.getStackTrace();
	    	}

	    	return resultString;
	    }

	    @Override
	    public String createMap(String basemap, String extent, String title, String description) throws Exception{
	    	//requires auth
	    	if (this.anonymous){
	    		throw new Exception("This function requires authentication.");
	    	}
	    	String url = this.serverName + "/maps.json";
	    	CreateMapRequestJson createMapRequestJson = this.createMapRequestObject(basemap, extent, title, description);
	    	try {
	    		CreateMapResponseJson result = restTemplate.postForObject(url, createMapRequestJson, CreateMapResponseJson.class);

	    		return result.getId();

	    	} catch (HttpClientErrorException e){
	    		//{"error": "an unknown error occurred"}
	    		throw new Exception (e.getResponseBodyAsString());
	    	}
	    }

	    public SearchResponseJson searchForLayer(String layerName){
	    	String url = this.serverName + "/search.json?query=" + layerName;
	    	SearchResponseJson result = restTemplate.getForObject(url, SearchResponseJson.class);
	    	System.out.println(result.getTotalResults());
	    	return result;
	    }
	    
	    public String searchForLayerAsString(String layerName){
	    	String url = this.serverName + "/search.json?query=" + layerName;
	    	String result = restTemplate.getForObject(url, String.class);
	    	return result;
	    }
	    
	    public void addLayerToMap(String mapId, DataSetStatus dataSetStatus) throws Exception{
	    	//requires auth
	    	if (this.anonymous){
	    		throw new Exception("This function requires authentication.");
	    	}
	    	String url = this.serverName + "/maps/" 
	    			+ mapId +"/layers.json";
	    	
	    	AddWMSLayerToMapRequestJson addLayerToMapRequestJson = new AddWMSLayerToMapRequestJson();

	    	addLayerToMapRequestJson.setSource("finder:" + dataSetStatus.getId());
	    	addLayerToMapRequestJson.setVisible(true);
	    	
			SolrRecord layerInfoMap = layerInfoRetriever.getAllLayerInfo(dataSetStatus.getOgpLayerId());
			String ogpLayerName = /*layerInfoMap.getWorkspaceName().trim() + ":" +*/ layerInfoMap.getName().trim();
			//addLayerToMapRequestJson.setStyles(addLayerToMapRequestJson.new Styles());
			//addLayerToMapRequestJson.getStyles().setType("primitives");
	    	//System.out.println(layerId);
	    	addLayerToMapRequestJson.setTitle(dataSetStatus.getTitle());
	    	//System.out.println(url);
    		//logger.info("DataType = " + dataType);
	    	if (dataSetStatus.getData_type().equalsIgnoreCase("wms")){
	    		String[] visibleLayers = new String[]{ogpLayerName};
	    		addLayerToMapRequestJson.setVisibleLayers(visibleLayers);
	    	} 
	    	try {
	    		ResponseEntity<String> result = restTemplate.postForEntity(url, addLayerToMapRequestJson, String.class);
	    		logger.info(result.getStatusCode().getReasonPhrase());
	    		logger.info(result.getHeaders().getLocation().toString());

	    	} catch (HttpClientErrorException e){
	    		e.getMessage();
	    		System.out.println(e.getResponseBodyAsString());
	    		throw new Exception(e.getResponseBodyAsString());
	    	}
	    }
	    
	    private CreateMapRequestJson createMapRequestObject(String basemap, String extent, String title, String description) {
	    	CreateMapRequestJson createMapRequestJson = new CreateMapRequestJson();

	    	createMapRequestJson.setBasemap(cleanString(basemap));
	    	String[] extentArray = extent.split(",");
	    	createMapRequestJson.setExtent(extentArray);
	    	//extent should be calculated based on layers in map
	    	createMapRequestJson.setTags(cleanString(this.getTagString(), 500));//tags should be collated from layers in map
	    	//System.out.println(this.getTagString());
	    	createMapRequestJson.setTitle(cleanString(title));
	    	createMapRequestJson.setDescription(cleanString(description));//aggregate layer titles

	    	return createMapRequestJson;
	    }

		private String getTagString() {
			String tagString = "";
			for (String tag : this.allTags){
				tagString += tag + " ";
			}
			return tagString.trim();
		}

		private String cleanString(String inputString, int maxLength){
			//System.out.println(inputString);
			inputString = inputString.trim();
			//inputString = inputString.replace("\"", "\\\"");
			if (inputString.length() > maxLength){
				inputString = inputString.substring(0, maxLength);
			}
			//System.out.println(inputString);

			return inputString;
		}
		
		private String cleanString(String inputString){
			//System.out.println(inputString);

			inputString = inputString.trim();
			//inputString = inputString.replace("\"", "\\\"");
			//System.out.println(inputString);

			return inputString;
		}
		
		private Metadata createLayerInfoObject(String layerId) throws Exception{
			Metadata layerInfo = new Metadata(layerId);

			SolrRecord layerInfoMap = layerInfoRetriever.getAllLayerInfo(layerId);

			layerInfo.setGeometryType(layerInfoMap.getDataType());
			layerInfo.setAccessLevel(layerInfoMap.getAccess());
			layerInfo.setTitle(layerInfoMap.getLayerDisplayName().trim());
			layerInfo.setOwsName(layerInfoMap.getName().trim());
			layerInfo.setLocation(layerInfoMap.getLocation().trim());
			layerInfo.setDescription(layerInfoMap.getDescription().trim());
			layerInfo.setOriginator(layerInfoMap.getOriginator().trim());
			layerInfo.setWorkspaceName(layerInfoMap.getWorkspaceName().trim());
			layerInfo.setBounds(Double.toString(layerInfoMap.getMinX()), Double.toString(layerInfoMap.getMinY()),
					Double.toString(layerInfoMap.getMaxX()), Double.toString(layerInfoMap.getMaxY()));
			layerInfo.setThemeKeywords(layerInfoMap.getThemeKeywords().trim().split(" "));
			layerInfo.setPlaceKeywords(layerInfoMap.getPlaceKeywords().trim().split(" "));
			return layerInfo;
		}
		
		public static String[] concat(String[] first, String[] second) {
			String[] result = Arrays.copyOf(first, first.length + second.length);
			System.arraycopy(second, 0, result, first.length, second.length);
			return result;
		}

		static String combine(String[] s, String glue){
			int k=s.length;
			if (k==0)
				return null;
			StringBuilder out=new StringBuilder();
			out.append(s[0]);
			for (int x=1;x<k;++x){
				out.append(glue).append(s[x]);
			}
			return out.toString();
		}

		private CreateStreamDataSetRequestJson createStreamDataSetRequestObject(String layerId) {
	    	CreateStreamDataSetRequestJson createDataSetRequestJson = new CreateStreamDataSetRequestJson();
	    	Metadata layerInfo = null;
	    	String wmsUrl = null;
			try {
				layerInfo = createLayerInfoObject(layerId);
				wmsUrl = LocationFieldUtils.getWmsUrl(layerInfo.getLocation());

			} catch (Exception e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
				return null;
			}
				if (!layerInfo.getAccess().equals(AccessLevel.Public)){
					//throw new SecurityException();
				}
				//needs to be changed to kml service point, format
					BoundingBox bounds = layerInfo.getBounds();
					Double minX = bounds.getMinX();
					Double maxX = bounds.getMaxX();
					Double minY = bounds.getMinY();
					Double maxY = bounds.getMaxY();

				if (minX > maxX){
					//this is supposed to mean that the layer crosses the dateline.  this causes problems with kml & geoserver,
					//so we give the full extent
					minX = -180.0;
					maxX = 180.0;		
				} 
				
				if (minY > maxY){
					Double temp = minY;
					minY = maxY;
					maxY = temp;
				}

				String bbox = Double.toString(minX) + "," + Double.toString(minY) + ",";
				bbox += Double.toString(maxX) + "," + Double.toString(maxY);
				String workspaceName = layerInfo.getWorkspaceName();
				String layerName = layerInfo.getOwsName();
				String SRS = "EPSG:4326";
	    	//http://geoserver01.uit.tufts.edu/wms?LAYERS=sde:GISPORTAL.GISOWNER01.CHELSEACULVERTSDITCHES05&request=getmap&format=kml&bbox=-71.052205,42.385485,-71.0138,42.41027&srs=EPSG:4326&width=1&height=1
				//Note; this only works for GeoServer
				wmsUrl = wmsUrl.replace("/wms", "/" + workspaceName + "/" + layerName + "/wms");
				wmsUrl += "?request=getCapabilities";
	    		//+ "?layers=" + workspaceName + ":" + layerName + "&request=getMap&format=kml&bbox="
	    		//+ bbox + "&srs=" + SRS + "&width=1&height=1";
				//this.layerName = workspaceName + ":" + layerName;
				//height and width don't seem to matter; should test with a raster layer
				logger.info("WMS Url: " + wmsUrl);
				createDataSetRequestJson.setUrl(wmsUrl);
				String layerTitle = layerInfo.getTitle();
				createDataSetRequestJson.setTitle(layerTitle);
				
				String layerOriginator = layerInfo.getOriginator();
				createDataSetRequestJson.setAuthor(layerOriginator);
				
				String layerAbstract = layerInfo.getDescription();
				//layerAbstract = "test data";
				if (layerAbstract.length() > 1951){
					layerAbstract = layerAbstract.substring(0, 1950);
				}
				createDataSetRequestJson.setDescription(layerAbstract);

				//String keywords = cleanString(requestedLayerInfo.get("ThemeKeywords")) + " " + cleanString(requestedLayerInfo.get("PlaceKeywords"));
				//String[] keywordArray = keywords.split(" ");
				String[] placeKeywords = layerInfo.getPlaceKeywords();
				String[] themeKeywords = layerInfo.getThemeKeywords();
				String[] keywordArray = concat(placeKeywords, themeKeywords);
				for (String keywordElement : keywordArray){
					//System.out.println(keywordElement);
					try {
						this.allTags.add(keywordElement);
					} catch (Exception e){
					}
				}
				
				createDataSetRequestJson.setTags(combine(keywordArray, " "));
				//where can I get this url from?
				createDataSetRequestJson.setMetadata_url("http://geodata.tufts.edu/getMetadata?id=" + layerId);
				try {
					createDataSetRequestJson.setContact_name(cleanString(this.metadataRetriever.getContactName(layerId)));
				} catch (Exception e){
					createDataSetRequestJson.setContact_name("open geo portal");
				}
				try {
					createDataSetRequestJson.setContact_address(cleanString(this.metadataRetriever.getContactAddress(layerId)));
				} catch (Exception e) {
					createDataSetRequestJson.setContact_address("replace with generic address");
				}
				try {
					createDataSetRequestJson.setContact_phone(cleanString(this.metadataRetriever.getContactPhoneNumber(layerId)));
				} catch (Exception e){
					createDataSetRequestJson.setContact_phone("replace with generic phone num");
				}
	    	return createDataSetRequestJson;
		}
		
		/*public URI getDataSetUri(){
			return this.dataSetUri;
		}*/
		
		//see if a user exists
		public void checkUser(String username){
	    	String url = this.serverName + "/users/" + username + ".json";
	    	String result = restTemplate.getForObject(url, String.class);
	    	logger.info("checking user" + result);
		}
		
		public String createUser(String full_name, String login, String password, String password_confirmation, String email){
	    	String url = this.serverName + "/users.json";
	    	CreateUserRequestJson createUserRequestJson = this.createUserRequestObject(full_name, login, password, password_confirmation, email);
	    	try {
	    		String result = restTemplate.postForObject(url, createUserRequestJson, String.class);
	    		
	    		return "User created";
	    	} catch (Exception e){
	    		return e.getMessage();
	    	}
		}
		/*
		 * 400 Bad Request – If it was unable to create the user. Should also provide a message in the body of the response for example "{"password"=>[“doesn’t match confirmation”]}"
401 Unauthorized – Usually seen if user signups have been disabled.
		 */
		//create user
		/*
		 * curl -i -X POST -H "Content-Type: application/json"
--data-binary  ' "user": { "full_name": "TheWizard", "login": "wizard", "password": "secretpassword", "password_confirmation": "secretpassword","email": "wizard@geoiq.com" } '
  http://geocommons.com/users.json
		 */

		private CreateUserRequestJson createUserRequestObject(String full_name, String login, String password, String password_confirmation, String email) {
			CreateUserRequestJson createUserRequestJson = new CreateUserRequestJson();
			createUserRequestJson.user.setFull_name(full_name);
			createUserRequestJson.user.setLogin(login);
			createUserRequestJson.user.setPassword(password);
			createUserRequestJson.user.setPassword_confirmation(password_confirmation);
			createUserRequestJson.user.setEmail(email);
			return createUserRequestJson;
		}
		
/*		Location 	returns the URI of the file requested 	http://geocommons.com/overlays/7294.json

		Note that it possible that for a large dataset, the upload operation may actually be executed asynchronously. Before you can do anything with your data, you need to ensure that it has completed uploading successfully. You can do a GET to download a JSON copy of your dataset, then check the “state” attribute, which will have one of the following values:

		    processing – the system is still processing your dataset
		    errored – an error occurred
		    complete – the dataset is ready to use
		    parsed, geocoded, verified, etc – the dataset requires additional information to complete processing
*/
		public DataSetStatus checkDataSetStatus(String location) throws Exception {
			try {
				DataSetStatus result = restTemplate.getForObject(location, DataSetStatus.class);
				return result;
			} catch (Exception e){
				e.printStackTrace();
				logger.error("Problem checking DataSet status for: " + location);
				return null;
			}
		}

		@Override
		public String uploadShapeFile(String layerId, BoundingBox bounds) throws Exception {
	    	//requires auth
	    	if (this.anonymous){
	    		throw new Exception("This function requires authentication.");
	    	}
			String resultString = null;
			String url = this.serverName + "/datasets.json";
			CreateFileDataSetRequestJson createDataSetRequestJson = this.createFileDataSetRequestObject(layerId);

			logger.info(this.searchForLayerAsString(createDataSetRequestJson.getTitle()));

				Set<File> returnedFiles = null;
				File zipFile = null;
				try {
					zipFile = quickDownload.downloadZipFile(layerId, bounds);
				} catch (Exception e){
					logger.warn("Error Downloading zip File");
					zipFile.delete();
					throw new Exception("Error Downloading zip File");
				}
				try {
					returnedFiles = ZipFilePackager.unarchiveFiles(zipFile);
				} catch (Exception e){
					logger.warn("Error unarchiving zip File");
					throw new Exception("Error unarchiving zip File");
				} finally {
					zipFile.delete();
				}
				Set<Resource> fileResources = new HashSet<Resource>();
				double totalSize = 0.0;

				for (File file : returnedFiles){
					if (file.isDirectory()){
						continue;
					}
					if (file.getName().toLowerCase().endsWith(".shp")){
						fileResources.add(new FileSystemResource(file.getAbsolutePath()));
						totalSize += file.length();
					} else if (file.getName().toLowerCase().endsWith(".shx")){
						fileResources.add(new FileSystemResource(file.getAbsolutePath()));
						totalSize += file.length();
					} else if (file.getName().toLowerCase().endsWith(".dbf")){
						fileResources.add(new FileSystemResource(file.getAbsolutePath()));
						totalSize += file.length();
					} 
				}
				logger.info("Total file size (in MB) equals: " + Double.toString(totalSize/1048576.0));

				if (totalSize/1048576.0 >= 20.0){
					//add as wms
					logger.warn("Total file size is too big to upload to GeoCommons.  Trying as WMS...");
					resultString = this.uploadWmsDataSet(layerId);
				} else {

					MultiValueMap<String, Object> map = new LinkedMultiValueMap<String, Object>();
	
					/*map.add("title", testUtf8(createDataSetRequestJson.getTitle()));
					map.add("author", testUtf8(createDataSetRequestJson.getAuthor()));
					map.add("description", testUtf8(createDataSetRequestJson.getDescription()));
					map.add("metadata_url", testUtf8(createDataSetRequestJson.getMetadata_url()));
					map.add("tags", testUtf8(createDataSetRequestJson.getTags()));
					map.add("contact_name", testUtf8(createDataSetRequestJson.getContact_name()));
					map.add("contact_address", testUtf8(createDataSetRequestJson.getContact_address()));
					map.add("contact_phone", testUtf8(createDataSetRequestJson.getContact_phone()));
*/
					map.add("title", isoToUtf8(createDataSetRequestJson.getTitle()));
					map.add("author", isoToUtf8(createDataSetRequestJson.getAuthor()));
					map.add("description", isoToUtf8(createDataSetRequestJson.getDescription()));
					map.add("metadata_url", isoToUtf8(createDataSetRequestJson.getMetadata_url()));
					map.add("tags", isoToUtf8(createDataSetRequestJson.getTags()));
					map.add("contact_name", isoToUtf8(createDataSetRequestJson.getContact_name()));
					map.add("contact_address", isoToUtf8(createDataSetRequestJson.getContact_address()));
					map.add("contact_phone", isoToUtf8(createDataSetRequestJson.getContact_phone()));
					
					Boolean shpFile = false;
					Boolean shxFile = false;
					Boolean dbfFile = false;

					for (Resource resource: fileResources){
						if (resource.getFilename().toLowerCase().endsWith(".shp")){
							map.add("dataset[shp]", resource);
							shpFile = true;
						} else if (resource.getFilename().toLowerCase().endsWith(".shx")){
							map.add("dataset[shx]", resource);
							shxFile = true;
						} else if (resource.getFilename().toLowerCase().endsWith(".dbf")){
							map.add("dataset[dbf]", resource);
							dbfFile = true;
						}
					}
					
					if (!(shpFile && shxFile && dbfFile)){
						logger.error("Not all necessary files are present.");
						throw new Exception("Not all necesary files are present.");
					}
					HttpHeaders headers = new HttpHeaders();
					headers.setContentType(MediaType.MULTIPART_FORM_DATA);
					//headers.setContentType(MediaType.parseMediaType("multipart/form-data;charset=utf-8"));
					
					
					List<Charset> charSets = new ArrayList<Charset>();
					charSets.add(Charset.forName("UTF-8"));
					headers.setAcceptCharset(charSets);
					HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<MultiValueMap<String, Object>>(map, headers);

					/*try {
	    			while(true){
	    				Thread.sleep(500);
	    			}
	    		} catch (InterruptedException e){
	    			//do stuff
					 */
					try {
						logger.info("Uploading shapefile to GeoCommons.");
						URI result = restTemplate.postForLocation(url, request);
						//this.dataSetUri = result;
						resultString = result.toString();
					} catch (HttpClientErrorException e1){
						//String result = restTemplate.postForObject(url, addLayerToMapRequestJson, String.class);
						//["Your file size has exceeded the KML file size limit. Please keep your file size under twenty (20) megabytes.", "RecordInvalid"]
						e1.getMessage();
						System.out.println(e1.getResponseBodyAsString());
						throw new Exception(e1.getResponseBodyAsString());
					} catch (ResourceAccessException e1){

						logger.error("GeoCommons server is not responding.");
						throw new Exception("GeoCommons server is not responding.");
					} catch (HttpMessageNotReadableException e1){
						//try as ISO latin characters
						map.add("title", isoToUtf8(createDataSetRequestJson.getTitle()));
						map.add("author", isoToUtf8(createDataSetRequestJson.getAuthor()));
						map.add("description", isoToUtf8(createDataSetRequestJson.getDescription()));
						map.add("metadata_url", isoToUtf8(createDataSetRequestJson.getMetadata_url()));
						map.add("tags", isoToUtf8(createDataSetRequestJson.getTags()));
						map.add("contact_name", isoToUtf8(createDataSetRequestJson.getContact_name()));
						map.add("contact_address", isoToUtf8(createDataSetRequestJson.getContact_address()));
						map.add("contact_phone", isoToUtf8(createDataSetRequestJson.getContact_phone()));
						
						HttpEntity<MultiValueMap<String, Object>> requestLatin = new HttpEntity<MultiValueMap<String, Object>>(map, headers);
						try {
							logger.info("Uploading shapefile to GeoCommons; trying Metadata as ISO-Latin characters.");
							URI result = restTemplate.postForLocation(url, requestLatin);
							//this.dataSetUri = result;
							resultString = result.toString();
						} catch (Exception e2){
							e1.getMessage();
							e1.getStackTrace();
						}
					} catch (Exception e1){
						e1.getMessage();
						e1.getStackTrace();
					}

				}
				
				logger.info("Cleaning up files...");
				for (File file : returnedFiles){
					file.delete();
				}
			//}

			return resultString;
		}
		//iso to utf-8 conversion
		//new String (s.getBytes ("iso-8859-1"), "UTF-8");

		public static String isoToUtf8(String s) throws UnsupportedEncodingException{
			return new String (s.getBytes ("iso-8859-1"), "UTF-8");
		}
		
		public static String testUtf8(String s) throws Exception {
			try {
				return new String (s.getBytes ("UTF-8"), "UTF-8");	
			} catch (UnsupportedEncodingException e){
				System.out.println("trying iso-8859-1");
				return isoToUtf8(s);
			}
		}
		
		private CreateFileDataSetRequestJson createFileDataSetRequestObject(String layerId) {
	    	CreateFileDataSetRequestJson createDataSetRequestJson = new CreateFileDataSetRequestJson();
	    	Metadata layerInfo;
			try {
				layerInfo = createLayerInfoObject(layerId);
			} catch (Exception e1) {
				logger.error("Problem creating layer info object.");
				e1.printStackTrace();
				return null;
			}
				if (!layerInfo.getAccess().equals(AccessLevel.Public)){
					//throw new SecurityException();
				}

				String layerTitle = layerInfo.getTitle();
				createDataSetRequestJson.setTitle(layerTitle);
				
				String layerOriginator = layerInfo.getOriginator();
				createDataSetRequestJson.setAuthor(layerOriginator);
				
				String layerAbstract = layerInfo.getDescription();
				if (layerAbstract.length() > 1951){
					layerAbstract = layerAbstract.substring(0, 1950);
				}
				createDataSetRequestJson.setDescription(layerAbstract);
				String[] placeKeywords = layerInfo.getPlaceKeywords();
				String[] themeKeywords = layerInfo.getThemeKeywords();
				String[] keywordArray = concat(placeKeywords, themeKeywords);
				for (String keywordElement : keywordArray){
					//System.out.println(keywordElement);
					try {
						this.allTags.add(keywordElement);
					} catch (Exception e){
					}
				}
				
				createDataSetRequestJson.setTags(combine(keywordArray, " "));
				//where can I get this url from?
				createDataSetRequestJson.setMetadata_url("http://geodata.tufts.edu/getMetadata?id=" + layerId);
				try {
					createDataSetRequestJson.setContact_name(cleanString(this.metadataRetriever.getContactName(layerId)));
				} catch (Exception e){
					createDataSetRequestJson.setContact_name("open geoportal");
				}
				try {
					createDataSetRequestJson.setContact_address(cleanString(this.metadataRetriever.getContactAddress(layerId)));
				} catch (Exception e) {
					createDataSetRequestJson.setContact_address("replace with generic address");
				}
				try {
					createDataSetRequestJson.setContact_phone(cleanString(this.metadataRetriever.getContactPhoneNumber(layerId)));
				} catch (Exception e){
					createDataSetRequestJson.setContact_phone("replace with generic phone num");
				}
	    	return createDataSetRequestJson;
		}
	
}
