package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Methods.PerLayerDownloadMethod;
import org.OpenGeoPortal.Download.Types.LayerDisposition;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
	@Autowired
	private DownloadStatusManager downloadStatusManager;
	@Autowired
	private DownloadPackager downloadPackager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private Map<LayerRequest, Future<File>> downloadFutures = new HashMap<LayerRequest,Future<File>>();

	@Async
	@Override
	public void downloadLayers(UUID requestId, List<LayerRequest> layerRequests) throws Exception {
		//downloadStatusManager.addDownloadRequestStatus(requestId, sessionId, layerRequests);
		for (LayerRequest currentLayer: layerRequests){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			try {
				logger.info("Requesting download for: " + currentLayer.getLayerNameNS());
				Future<File> currentFile = this.perLayerDownloadMethod.download(requestId, currentLayer);
				downloadFutures.put(currentLayer, currentFile);
			} catch (Exception e){
				e.printStackTrace();
				logger.error("An error occurred downloading this layer: " + currentLayer.getLayerNameNS());
				currentLayer.setStatus(LayerStatus.DOWNLOAD_FAILED);
				continue;
			}
		} 
		for (LayerRequest currentLayer: layerRequests){
			try{
				currentLayer.getDownloadedFiles().add(downloadFutures.get(currentLayer).get());
				currentLayer.setStatus(LayerStatus.DOWNLOAD_SUCCESS);
				currentLayer.setDisposition(LayerDisposition.DOWNLOADED_LOCALLY);
				logger.info("finished download for: " + currentLayer.getLayerNameNS());
			} catch (Exception e){
				currentLayer.setStatus(LayerStatus.DOWNLOAD_FAILED);	
			}
		
		}
		downloadPackager.packageFiles(requestId);
	}

	public PerLayerDownloadMethod getPerLayerDownloadMethod() {
		return perLayerDownloadMethod;
	}

	public void setPerLayerDownloadMethod(PerLayerDownloadMethod perLayerDownloadMethod) {
		this.perLayerDownloadMethod = perLayerDownloadMethod;
	}


}
