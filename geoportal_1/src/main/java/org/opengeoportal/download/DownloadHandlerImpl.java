package org.opengeoportal.download;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.apache.commons.io.IOUtils;
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
	
	@Autowired
	protected LayerInfoRetriever layerInfoRetriever;

	@Autowired
	private DirectoryRetriever directoryRetriever;
	@Autowired
	protected RequestStatusManager requestStatusManager;

	@Autowired
	AugmentedSolrRecordRetriever asrRetriever;
	
	@Autowired
	@Qualifier("httpRequester.generic")
	HttpRequester httpRequester;

	@Autowired
	private LayerDownloaderProvider layerDownloaderProvider;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	

	/**
	 * the main method of the class.  Initializes layers and bounds, calls download actions in appropriate
	 * order
	 * 
	 * @param layerMap a hashmap that maps Solr layer IDs to requested download format
	 * @param bounds an array of geodetic bounding coordinates (eastmost, southmost, westmost, northmost)
	 * @return boolean that indicates the success of the function
	 * @throws Exception
	 */
	public UUID requestLayers(DownloadRequest dlRequest) throws Exception{
		UUID requestId = UUID.randomUUID();
		dlRequest.setRequestId(requestId);

		requestStatusManager.addDownloadRequest(dlRequest);
		this.populateDownloadRequest(dlRequest);
		this.submitDownloadRequest(dlRequest);
		return requestId;
	}


	
	SolrRecord findRecord(String layerId, List<SolrRecord> recordList) throws Exception{
		for (SolrRecord sr: recordList){
			if (sr.getLayerId().equals(layerId)){
				return sr;
			}
		}
		
		throw new Exception("Record not found.");
	};
	
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
	
	private void populateDownloadRequest (DownloadRequest dlRequest) throws Exception {
		Set<String> layerIdSet = dlRequest.getRequestedLayerIds();
		List<SolrRecord> layerInfo = layerInfoRetriever.fetchAllowedRecords(layerIdSet);
		
		for (String layerId: layerIdSet){
			
			SolrRecord record = null;
			try{
				record = findRecord(layerId, layerInfo);
			} catch (Exception e){
				//do some stuff....
				//create a dummy LayerRequest so we can set status failed?
				//layerRequest.setStatus(Status.FAILED);
				logger.info("User is not authorized to download: '" + layerId +"'");
				continue;	
			}
			
			LayerRequest layerRequest = this.createLayerRequest(record, dlRequest.getRequestedFormatForLayerId(record.getLayerId()), dlRequest.getBounds(), dlRequest.getEmail());
			
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
	
	/**
	 * a method that finds the appropriate concrete LayerDownloader and makes the actual request to download layers.
	 *  
	 * @param downloadMap a map that relates a string key (that identifies the concrete LayerDownloader Class) to a List of
	 * LayerRequest objects that can be downloaded using that concrete class.
	 */
	@Async
	public void submitDownloadRequest(DownloadRequest dlRequest) {
		List<MethodLevelDownloadRequest> requestList = dlRequest.getRequestList();
		for (MethodLevelDownloadRequest request: requestList){
			try {
				request.getLayerDownloader().downloadLayers(dlRequest.getRequestId(), request);
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




}
