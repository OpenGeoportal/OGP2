package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Methods.MultiLayerDownloadMethod;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerRequest.Status;
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
public class MultiLayerDownloader implements LayerDownloader {
	private MultiLayerDownloadMethod multiLayerDownloadMethod;
	private RequestStatusManager requestStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private List<Future<File>> downloadFutures = new ArrayList<Future<File>>();

	@Async
	@Override
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception {
		List<LayerRequest> layerList = request.getRequestList();
		for (LayerRequest currentLayer: layerList){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			//this should fire off a callable that asynchronously calls the download method
			try {
				Future<File> currentFile = this.multiLayerDownloadMethod.download(currentLayer);
				downloadFutures.add(currentFile);
			} catch (Exception e){
				//e.printStackTrace();
				logger.error("an error downloading this layer: " + currentLayer.getLayerInfo().getName());
				currentLayer.setStatus(Status.FAILED);
				continue;
			}
		} 
		List<File> downloadedLayers = new ArrayList<File>();
		for (Future<File> currentFuture: downloadFutures){
			downloadedLayers.add(currentFuture.get());
		}
	}



	public RequestStatusManager getRequestStatusManager() {
		return requestStatusManager;
	}

	public void setRequestStatusManager(RequestStatusManager requestStatusManager) {
		this.requestStatusManager = requestStatusManager;
	}



	public MultiLayerDownloadMethod getMultiLayerDownloadMethod() {
		return multiLayerDownloadMethod;
	}



	public void setMultiLayerDownloadMethod(
			MultiLayerDownloadMethod multiLayerDownloadMethod) {
		this.multiLayerDownloadMethod = multiLayerDownloadMethod;
	}
}
