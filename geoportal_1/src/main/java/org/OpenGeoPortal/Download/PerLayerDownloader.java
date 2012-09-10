package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Methods.PerLayerDownloadMethod;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerStatus;
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
	private PerLayerDownloadMethod perLayerDownloadMethod;
	private DownloadStatusManager downloadStatusManager;
	private UUID requestId;
	private List<LayerRequest> layerRequests;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private List<Future<File>> downloadFutures = new ArrayList<Future<File>>();

	@Async
	@Override
	public void downloadLayers(String sessionId, UUID requestId,
			List<LayerRequest> list) throws Exception {
		for (LayerRequest currentLayer: layerRequests){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			//this should fire off a callable that asynchronously calls the download method
			try {
				Future<File> currentFile = this.perLayerDownloadMethod.download(requestId, currentLayer);
				downloadFutures.add(currentFile);
			} catch (Exception e){
				//e.printStackTrace();
				System.out.println("an error downloading this layer: " + currentLayer.getLayerInfo().getName());
				currentLayer.setStatus(LayerStatus.DOWNLOAD_FAILED);
				continue;
			}
		} 
		List<File> downloadedLayers = new ArrayList<File>();
		for (Future<File> currentFuture: downloadFutures){
			downloadedLayers.add(currentFuture.get());
		}
	}

	public PerLayerDownloadMethod getPerLayerDownloadMethod() {
		return perLayerDownloadMethod;
	}

	public void setPerLayerDownloadMethod(PerLayerDownloadMethod perLayerDownloadMethod) {
		this.perLayerDownloadMethod = perLayerDownloadMethod;
	}

	public DownloadStatusManager getDownloadStatusManager() {
		return downloadStatusManager;
	}

	public void setDownloadStatusManager(DownloadStatusManager downloadStatusManager) {
		this.downloadStatusManager = downloadStatusManager;
	}
}
