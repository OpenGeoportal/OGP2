package org.OpenGeoPortal.Download;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.OpenGeoPortal.Download.LayerDownloader;
import org.OpenGeoPortal.Download.Config.DownloadConfigRetriever;
import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerRequest.Status;
import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Solr.SearchConfigRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.DirectoryRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;

/**
 * This is an abstract class that provides the logic to determine which concrete class 
 * should be selected to download a layer.
 * 
 * 
 * @author Chris Barnett
 *
 */
public class DownloadHandlerImpl implements DownloadHandler, BeanFactoryAware {
	private List<SolrRecord> layerInfo;
	private Boolean locallyAuthenticated = false;
	@Autowired
	protected LayerInfoRetriever layerInfoRetriever;
	@Autowired
	protected DownloadConfigRetriever downloadConfigRetriever;
	@Autowired
	protected SearchConfigRetriever searchConfigRetriever;
	private String emailAddress = "";
	@Autowired
	private DirectoryRetriever directoryRetriever;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	protected RequestStatusManager requestStatusManager;

	protected BeanFactory beanFactory;
	
	/**
	 * a method to set the locallyAuthenticated property.  
	 * 
	 * This is a way to pass information about the user's session into the java class.  If the user has 
	 * authenticated locally, a session variable is set.  The calling code should set this value.
	 * 
	 * @param authenticated  true if the user has authenticated locally, otherwise false
	 */
	public void setLocallyAuthenticated(Boolean authenticated){
		this.locallyAuthenticated = authenticated;
	}
	
	/**
	 * a method to get the locallyAuthenticated property.  
	 * 
	 * @return true if the user has authenticated locally, otherwise false
	 */
	public Boolean getLocallyAuthenticated(){
		return this.locallyAuthenticated;
	}

	
	/**
	 * a method that sets an email address.  Only used for certain download types
	 * 
	 * @param a string containing the user's email address passed from the client
	*/
	public void setReplyEmail(String emailAddress){
		this.emailAddress = emailAddress;
	}
	
	

	/**
	 * the main method of the class.  Initializes layers and bounds, calls download actions in appropriate
	 * order
	 * 
	 * @param layerMap a hashmap that maps Solr layer IDs to requested download format
	 * @param bounds an array of geodetic bounding coordinates (eastmost, southmost, westmost, northmost)
	 * @return boolean that indicates the success of the function
	 * @throws Exception
	 */
	public UUID requestLayers(String sessionId, Map<String,String> layerMap, String[] bounds, String emailAddress, Boolean locallyAuthenticated) throws Exception{
		this.setReplyEmail(emailAddress);
		this.setLocallyAuthenticated(locallyAuthenticated);
		Map <String, List<LayerRequest>> downloadRequestMap = null;
		UUID requestId = UUID.randomUUID();
		downloadRequestMap = this.createDownloadRequestMap(layerMap, bounds);
		this.submitDownloadRequest(sessionId, requestId, downloadRequestMap);
		return requestId;
	}

	private Boolean isAuthorizedToDownload(SolrRecord solrRecord){
		if (solrRecord.getAccess().equalsIgnoreCase("public")){
			return true;
		} else {
			try {
				if (solrRecord.getInstitution().equalsIgnoreCase(searchConfigRetriever.getHome())){
					//check if the user is locally authenticated
					if (this.getLocallyAuthenticated()){
						return true;
					} else {
						return false;
					}
				} else {
					return false;
				}
			} catch (Exception e) {
				logger.error(e.getMessage());
				return false;
			}
		}
	}
	
	private Map <String, List<LayerRequest>> createDownloadRequestMap (Map<String, String> layerMap, String[] bounds) throws Exception {
		this.layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(layerMap.keySet());
		Map <String, List<LayerRequest>> downloadMap = new HashMap<String, List<LayerRequest>>(); 
		for (SolrRecord record: this.layerInfo){
			logger.debug("Requested format: " + layerMap.get(record.getLayerId()));
			LayerRequest layerRequest = this.createLayerRequest(record, layerMap.get(record.getLayerId()), bounds);
			String currentClassKey = null;
			if (!isAuthorizedToDownload(record)){
				layerRequest.setStatus(Status.FAILED);
				logger.info("User is not authorized to download: '" + record.getLayerId() +"'");
				continue;	
			}
			try {
				currentClassKey = this.downloadConfigRetriever.getClassKey(layerRequest);
				logger.info("DownloadKey: " + currentClassKey);
			} catch(Exception e) {
				layerRequest.setStatus(Status.FAILED);
				logger.info("No download method found for: '" + record.getLayerId() +"'");
				continue;
			}
			if (downloadMap.containsKey(currentClassKey)){
				List<LayerRequest> currentLayerList = downloadMap.get(currentClassKey);
				currentLayerList.add(layerRequest);
			} else {
				List<LayerRequest> newLayerList = new ArrayList<LayerRequest>();
				newLayerList.add(layerRequest);
				downloadMap.put(currentClassKey, newLayerList);
			}
		}
		return downloadMap;
		
	}

	private LayerRequest createLayerRequest(SolrRecord solrRecord, String requestedFormat, String[] bounds){
		LayerRequest layer = new LayerRequest(solrRecord, requestedFormat);
		layer.setRequestedBounds(new BoundingBox(bounds[0], bounds[1], bounds[2], bounds[3]));
		layer.setEmailAddress(this.emailAddress);
		layer.setTargetDirectory(this.directoryRetriever.getDownloadDirectory());
		return layer;
	}


	public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
		this.beanFactory = beanFactory;
	}

	/**
	 * a method to get a concrete class of type LayerDownloader given a string key defined in WEB-INF/download.xml
	 * 
	 * 
	 * @param downloaderKey a string key that identifies a concrete class of LayerDownloader
	 * @return the concrete LayerDownloader object
	 */
	public LayerDownloader getLayerDownloader(String downloaderKey){
		LayerDownloader layerDownloader = (LayerDownloader) beanFactory.getBean(downloaderKey);
		return layerDownloader;
	}

	/**
	 * a method that finds the appropriate concrete LayerDownloader and makes the actual request to download layers.
	 *  
	 * @param downloadMap a map that relates a string key (that identifies the concrete LayerDownloader Class) to a List of
	 * LayerRequest objects that can be downloaded using that concrete class.
	 */
	@Async
	public void submitDownloadRequest(String sessionId, UUID requestId, Map <String, List<LayerRequest>> downloadMap) {
		List<MethodLevelDownloadRequest> requestList = new ArrayList<MethodLevelDownloadRequest>();
		for (String currentDownloader: downloadMap.keySet()){
			//get concrete class key from config
			List<LayerRequest> layerRequests = downloadMap.get(currentDownloader);
			MethodLevelDownloadRequest request = new MethodLevelDownloadRequest(layerRequests);

			try{
				LayerDownloader layerDownloader = this.getLayerDownloader(currentDownloader);
				layerDownloader.downloadLayers(requestId, request);
				requestList.add(request);

			} catch (Exception e) {
				e.printStackTrace();
				logger.error("runDownloadRequest: " + e.getMessage());
				//should put error info in the status manager for these layers
			}
		}
		requestStatusManager.addDownloadRequest(requestId, sessionId, requestList);
	}


}
