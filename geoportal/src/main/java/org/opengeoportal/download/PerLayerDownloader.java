package org.opengeoportal.download;

import java.io.File;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import org.opengeoportal.download.exception.DownloadPackagingException;
import org.opengeoportal.download.methods.PerLayerDownloadMethod;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.download.types.MethodLevelDownloadRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;

/**
 * Class to download layers that must be downloaded one at a time.
 * 
 * The actual method for downloading is injected by Spring
 * @author chris
 *
 */
//the layer downloader should handle all the errors thrown by the download method,
//and take care of layer status as much as possible

public class PerLayerDownloader implements LayerDownloader {

	private final PerLayerDownloadMethod perLayerDownloadMethod;

	private final DownloadPackager downloadPackager;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public PerLayerDownloader(PerLayerDownloadMethod perLayerDownloadMethod, DownloadPackager downloadPackager) {
		this.perLayerDownloadMethod = perLayerDownloadMethod;
		this.downloadPackager = downloadPackager;
	}

	@Async
	@Override
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest downloadRequest) throws DownloadPackagingException {
		//downloadStatusManager.addDownloadRequestStatus(requestId, sessionId, layerRequests);
		List<LayerRequest> layerList = downloadRequest.getRequestList();
		for (LayerRequest currentLayer: layerList){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			try {
				logger.info("Requesting download for: " + currentLayer.getLayerNameNS());
				currentLayer.setFutureValue(this.perLayerDownloadMethod.download(currentLayer));
			} catch (Exception e){
				//e.printStackTrace();
				logger.error("An error occurred downloading this layer: " + currentLayer.getLayerInfo().getLayerId());
				logger.error(e.getMessage());
				currentLayer.setStatus(Status.FAILED);
			}
		} 
		int successCount = 0;
		for (LayerRequest currentLayer: layerList){
			try{
				currentLayer.getDownloadedFiles().addAll((Set<File>) currentLayer.getFutureValue().get());
				currentLayer.setStatus(Status.SUCCESS);
				successCount++;
				logger.info("finished download for: " + currentLayer.getLayerNameNS());
			} catch (Exception e){
				logger.error("An error occurred downloading this layer: " + currentLayer.getLayerInfo().getLayerId());
				logger.error(e.getMessage());
				currentLayer.setStatus(Status.FAILED);	
			}
		
		}
		
		if (successCount > 0){
			Future<Boolean> ready = downloadPackager.packageFiles(requestId); //this is going to try to package files each time a download method is complete.
			Boolean response = null;
			try {
				response = ready.get();
			} catch (InterruptedException | ExecutionException e) {
				e.printStackTrace();
				throw new DownloadPackagingException("Error retrieving download package.");
			}
			logger.info("Packager response: " + Boolean.toString(response));
		} else {
			logger.error("No Files to package.  Download failed.");
		}
		
	}

	@Override
	public Boolean hasRequiredInfo(LayerRequest layer) {
		return perLayerDownloadMethod.hasRequiredInfo(layer);
	}


}
