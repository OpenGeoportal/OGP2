package org.opengeoportal.download;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.download.types.MethodLevelDownloadRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.AugmentedSolrRecord;
import org.opengeoportal.ogc.AugmentedSolrRecordRetriever;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.service.SearchService;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * class that provides the logic to determine which concrete class 
 * should be selected to download a layer.
 * 
 * 
 * @author Chris Barnett
 *
 */
@Component
@Scope("prototype")
public class DownloadHandlerImpl implements DownloadHandler {

	protected final RequestStatusManager requestStatusManager;
	
	protected final SearchService searchService;

	private final DirectoryRetriever directoryRetriever;
	
	final AugmentedSolrRecordRetriever asrRetriever;

	private final LayerDownloaderProvider layerDownloaderProvider;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	DownloadRequest downloadRequest;

	@Autowired
	public DownloadHandlerImpl(RequestStatusManager requestStatusManager, SearchService searchService,
							   DirectoryRetriever directoryRetriever, AugmentedSolrRecordRetriever asrRetriever,
							   LayerDownloaderProvider layerDownloaderProvider) {
		this.requestStatusManager = requestStatusManager;
		this.searchService = searchService;
		this.directoryRetriever = directoryRetriever;
		this.asrRetriever = asrRetriever;
		this.layerDownloaderProvider = layerDownloaderProvider;
	}


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
		List<String> layerIds = new ArrayList<>(layerIdSet);
		List<OGPRecord> layerInfo = searchService.findAllowedRecordsById(layerIds);

		for (String layerId: layerIdSet){
			
			OGPRecord record = null;
			try{
				//layerIdSet can contain layerIds for layers the user is not allowed to access
				record = OgpUtils.findRecordById(layerId, layerInfo);
			} catch (Exception e){
				//if the user is not allowed to download the layer, here's our opportunity to record that in a way that we can relay back to the user
				//create a dummy LayerRequest so we can set status failed?
				//layerRequest.setStatus(Status.FAILED);
				//subclass LayerRequest as "AbortedLayerRequest" and add?
				logger.warn("User is not authorized to download: '" + layerId +"'");
				continue;	
			}
			String requestedFormat = dlRequest.getRequestedFormatForLayerId(record.getLayerId());
			LayerRequest layerRequest = this.createLayerRequest(record, requestedFormat, dlRequest.getBounds(), dlRequest.getEmail());
			
			String currentClassKey = null;
			
			try {
				currentClassKey = this.layerDownloaderProvider.getClassKey(layerRequest);
				logger.debug("DownloadKey: " + currentClassKey);
			} catch(Exception e) {
				layerRequest.setStatus(Status.FAILED);
				logger.error("No download method found for: '" + record.getLayerId() +"'");
				continue;
			}

			collateRequests(dlRequest.getRequestList(), layerRequest, currentClassKey);

		}

		
	}

	
	private LayerRequest createLayerRequest(OGPRecord ogpRecord, String requestedFormat, BoundingBox bounds, String emailAddress){
		LayerRequest layer = new LayerRequest(ogpRecord, requestedFormat);
		layer.setRequestedBounds(bounds);
		layer.setEmailAddress(emailAddress);
		layer.setTargetDirectory(this.directoryRetriever.getDownloadDirectory());
		if (LocationFieldUtils.hasWmsUrl(ogpRecord.getLocation())){
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
