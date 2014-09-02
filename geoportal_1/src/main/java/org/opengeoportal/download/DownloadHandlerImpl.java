package org.opengeoportal.download;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.opengeoportal.download.LayerDownloader;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.AugmentedSolrRecordRetriever;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;

/**
 * class that provides the logic to determine which concrete class 
 * should be selected to download a layer.
 * 
 * 
 * @author Chris Barnett
 *
 */

public class DownloadHandlerImpl implements DownloadHandler {

	@Autowired
	protected RequestStatusManager requestStatusManager;

	
	@Autowired
	protected LayerInfoRetriever layerInfoRetriever;

	@Autowired
	private DirectoryRetriever directoryRetriever;
	
	@Autowired
	AugmentedSolrRecordRetriever asrRetriever;

	@Autowired
	private LayerDownloaderProvider layerDownloaderProvider;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	DownloadRequest downloadRequest;
	

	
	/**
	 * the main method of the class.  Initializes layers and bounds, calls download actions in appropriate
	 * order
	 * 
	 */
	public UUID requestLayers(DownloadRequest dlRequest) throws Exception{
		
		UUID requestId = UUID.randomUUID();
		dlRequest.setRequestId(requestId);
		this.downloadRequest = dlRequest;

		requestStatusManager.addDownloadRequest(dlRequest);
		
		this.populateDownloadRequest(dlRequest);
		
		this.submitDownloadRequest();
		return requestId;
	}

	/**
	 * a method that finds the appropriate concrete LayerDownloader and makes the actual request to download layers.
	 *  
	 * @param downloadMap a map that relates a string key (that identifies the concrete LayerDownloader Class) to a List of
	 * LayerRequest objects that can be downloaded using that concrete class.
	 */
	@Async
	public void submitDownloadRequest() {
		List<MethodLevelDownloadRequest> requestList = downloadRequest.getRequestList();
		for (MethodLevelDownloadRequest request: requestList){
			try {
				request.getLayerDownloader().downloadLayers(downloadRequest.getRequestId(), request);
			} catch (Exception e) {
				logger.error("downloadLayers: " + e.getMessage());
				//should put error info in the status manager for these layers
				for (LayerRequest layer: request.getRequestList()){
					layer.setStatus(Status.FAILED);
				}
				//e.printStackTrace();
			}
		}

		
	}
	
	
	private void populateDownloadRequest (DownloadRequest dlRequest) throws Exception {
		Set<String> layerIdSet = dlRequest.getRequestedLayerIds();
		List<SolrRecord> layerInfo = layerInfoRetriever.fetchAllowedRecords(layerIdSet);
		
		for (String layerId: layerIdSet){
			
			SolrRecord record = null;
			try{
				//layerIdSet can contain layerIds for layers the user is not allowed to access
				record = OgpUtils.findRecordById(layerId, layerInfo);
			} catch (Exception e){
				//if the user is not allowed to download the layer, here's our opportunity to record that in a way that we can relay back to the user
				//create a dummy LayerRequest so we can set status failed?
				//layerRequest.setStatus(Status.FAILED);
				//subclass LayerRequest as "AbortedLayerRequest" and add?
				logger.info("User is not authorized to download: '" + layerId +"'");
				continue;	
			}
			String requestedFormat = dlRequest.getRequestedFormatForLayerId(record.getLayerId());
			LayerRequest layerRequest = this.createLayerRequest(record, requestedFormat, dlRequest.getBounds(), dlRequest.getEmail());
			
			String currentClassKey = null;
			
			try {
				currentClassKey = this.layerDownloaderProvider.getClassKey(layerRequest);
				logger.info("DownloadKey: " + currentClassKey);
			} catch(Exception e) {
				layerRequest.setStatus(Status.FAILED);
				logger.info("No download method found for: '" + record.getLayerId() +"'");
				continue;
			}

			collateRequests(dlRequest.getRequestList(), layerRequest, currentClassKey);

		}

		
	}

	
	private LayerRequest createLayerRequest(SolrRecord solrRecord, String requestedFormat, BoundingBox bounds, String emailAddress){
		LayerRequest layer = new LayerRequest(solrRecord, requestedFormat);
		layer.setRequestedBounds(bounds);
		layer.setEmailAddress(emailAddress);
		layer.setTargetDirectory(this.directoryRetriever.getDownloadDirectory());
		if (LocationFieldUtils.hasWmsUrl(solrRecord.getLocation())){
			addOwsInfo(layer);
		}
		return layer;
	}
	
	private void addOwsInfo(LayerRequest layer){
		
		try {
			AugmentedSolrRecord asr = asrRetriever.getOgcAugmentedSolrRecord(layer.getLayerInfo());
			List<OwsInfo> info = asr.getOwsInfo();
			if (!info.isEmpty()){
				layer.setOwsInfo(info);
			}
		} catch (Exception e) {
			logger.error("Problem setting info from OWS service for layer: ['" + layer.getId() + "']");
		}	
	}
	
	
	void collateRequests(List<MethodLevelDownloadRequest> mlRequestList, LayerRequest layerRequest, String classKey){
		
		//here, we're collecting layers that use the same download method
		Boolean match = false;
		for (MethodLevelDownloadRequest mlRequest: mlRequestList){
			if (mlRequest.getDownloadKey().equals(classKey)){
				mlRequest.addLayerRequest(layerRequest);
				match = true;
			}
		}
		
		if (!match){
			LayerDownloader layerDownloader = this.layerDownloaderProvider.getLayerDownloader(classKey);
			MethodLevelDownloadRequest mlRequest = new MethodLevelDownloadRequest(classKey, layerDownloader);
			mlRequest.addLayerRequest(layerRequest);
			mlRequestList.add(mlRequest);
		}
	}
	





}
