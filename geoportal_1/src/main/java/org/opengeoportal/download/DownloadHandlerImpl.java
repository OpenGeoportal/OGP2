package org.opengeoportal.download;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.LayerDownloader;
import org.opengeoportal.download.config.DownloadConfigRetriever;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.AugmentedSolrRecordRetriever;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.solr.SearchConfigRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;

import com.fasterxml.jackson.core.JsonParseException;

/**
 * class that provides the logic to determine which concrete class 
 * should be selected to download a layer.
 * 
 * 
 * @author Chris Barnett
 *
 */

public class DownloadHandlerImpl implements DownloadHandler {
	private List<SolrRecord> layerInfo;
	private Boolean locallyAuthenticated = false;
	@Autowired
	protected LayerInfoRetriever layerInfoRetriever;
	@Autowired
	protected DownloadConfigRetriever downloadConfigRetriever;
	@Autowired
	protected SearchConfigRetriever searchConfigRetriever;
	@Autowired
	private DirectoryRetriever directoryRetriever;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	protected RequestStatusManager requestStatusManager;

	@Autowired
	AugmentedSolrRecordRetriever asrRetriever;
	@Autowired
	@Qualifier("httpRequester.generic")
	HttpRequester httpRequester;
	
	@Autowired
	private LayerDownloaderProvider layerDownloaderProvider;
	
	
	
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
	 * the main method of the class.  Initializes layers and bounds, calls download actions in appropriate
	 * order
	 * 
	 * @param layerMap a hashmap that maps Solr layer IDs to requested download format
	 * @param bounds an array of geodetic bounding coordinates (eastmost, southmost, westmost, northmost)
	 * @return boolean that indicates the success of the function
	 * @throws Exception
	 */
	public UUID requestLayers(DownloadRequest dlRequest, Boolean locallyAuthenticated) throws Exception{
		this.setLocallyAuthenticated(locallyAuthenticated);
		UUID requestId = UUID.randomUUID();
		dlRequest.setRequestId(requestId);
		this.populateDownloadRequest(dlRequest);
		this.submitDownloadRequest(dlRequest);
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
	
	private void populateDownloadRequest (DownloadRequest dlRequest) throws Exception {
		
		this.layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(dlRequest.getRequestedLayerIds());

		for (SolrRecord record: this.layerInfo){
			logger.debug("Requested format: " + dlRequest.getRequestedFormatForLayerId(record.getLayerId()));
			LayerRequest layerRequest = this.createLayerRequest(record, dlRequest.getRequestedFormatForLayerId(record.getLayerId()), dlRequest.getBounds(), dlRequest.getEmail());
			if (!isAuthorizedToDownload(record)){
				layerRequest.setStatus(Status.FAILED);
				logger.info("User is not authorized to download: '" + record.getLayerId() +"'");
				continue;	
			}
			String currentClassKey = null;
			try {
				currentClassKey = this.layerDownloaderProvider.getClassKey(layerRequest);
				if (currentClassKey == null){
					throw new Exception();
				}
				logger.info("DownloadKey: " + currentClassKey);
			} catch(Exception e) {
				e.printStackTrace();
				layerRequest.setStatus(Status.FAILED);
				logger.info("No download method found for: '" + record.getLayerId() +"'");
				continue;
			}
			
			//here, we're collecting layers that use the same download method
			List<MethodLevelDownloadRequest> mlRequestList = dlRequest.getRequestList();
			Boolean match = false;
			for (MethodLevelDownloadRequest mlRequest: mlRequestList){
				if (mlRequest.getDownloadKey().equals(currentClassKey)){
					mlRequest.addLayerRequest(layerRequest);
					match = true;
				}
			}
			
			if (!match){
				LayerDownloader layerDownloader = this.layerDownloaderProvider.getLayerDownloader(currentClassKey);
				MethodLevelDownloadRequest mlRequest = new MethodLevelDownloadRequest(currentClassKey, layerDownloader);
				mlRequest.addLayerRequest(layerRequest);
				dlRequest.getRequestList().add(mlRequest);
			}
			
		}
		
	}
	
	/**
	 * a method that finds the appropriate concrete LayerDownloader and makes the actual request to download layers.
	 *  
	 * @param downloadMap a map that relates a string key (that identifies the concrete LayerDownloader Class) to a List of
	 * LayerRequest objects that can be downloaded using that concrete class.
	 */
	@Async
	public void submitDownloadRequest(DownloadRequest dlRequest) {
		requestStatusManager.addDownloadRequest(dlRequest);
		List<MethodLevelDownloadRequest> requestList = dlRequest.getRequestList();
		for (MethodLevelDownloadRequest request: requestList){
			try {
				request.getLayerDownloader().downloadLayers(dlRequest.getRequestId(), request);
			} catch (Exception e) {
				logger.error("runDownloadRequest: " + e.getMessage());
				//should put error info in the status manager for these layers
				e.printStackTrace();
			}
		}

		
	}
	
	
	private LayerRequest createLayerRequest(SolrRecord solrRecord, String requestedFormat, BoundingBox bounds, String emailAddress){
		LayerRequest layer = new LayerRequest(solrRecord, requestedFormat);
		layer.setRequestedBounds(bounds);
		layer.setEmailAddress(emailAddress);
		layer.setTargetDirectory(this.directoryRetriever.getDownloadDirectory());
		addOwsInfo(layer);
		return layer;
	}
	
	private void setOwsInfo(LayerRequest layer) throws Exception{
		AugmentedSolrRecord asr = asrRetriever.getOgcAugmentedSolrRecord(layer.getLayerInfo());
		List<OwsInfo> info = asr.getOwsInfo();
		if (!info.isEmpty()){
			layer.setOwsInfo(info);
		}
	}
	
	private void addOwsInfo(LayerRequest layer) {
		String location = layer.getLayerInfo().getLocation();
		if (LocationFieldUtils.hasWmsUrl(location)){
			//if there is a serviceStart url for the layer, try that first
			if (LocationFieldUtils.hasServiceStart(location)){
					String serviceStart = "";
					InputStream is = null;
					try {
						serviceStart = LocationFieldUtils.getServiceStartUrl(location);
						//requestObj.AddLayer = [layerModel.get("qualifiedName")];
						//requestObj.ValidationKey = "OPENGEOPORTALROCKS";
						String name = layer.getLayerInfo().getName();
						//the HGL remote service starter does not use qualified names
						name = name.substring(name.indexOf(".") + 1);
						logger.info("Attempting to Start Service for ['" + layer.getId() + "']");
						is = httpRequester.sendRequest(serviceStart, "AddLayer=" + name + "&ValidationKey=OPENGEOPORTALROCKS", "GET");
					} catch (JsonParseException e) {
						logger.error("Problem parsing ServiceStart parameter from ['" + location + "']");
					} catch (IOException e) {
						logger.error("Problem sending ServiceStart request to : ['" + serviceStart + "']");
					} finally {
						IOUtils.closeQuietly(is);
					}
			}
				
			try {
				setOwsInfo(layer);
			} catch (Exception e) {
				logger.error("Problem setting info from OWS service for layer: ['" + layer.getId() + "']");
			}	
			
		}
	}





}
