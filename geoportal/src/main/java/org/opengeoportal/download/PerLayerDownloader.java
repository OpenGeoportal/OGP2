package org.opengeoportal.download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Future;

import org.apache.commons.lang3.StringUtils;
import org.opengeoportal.download.methods.PerLayerDownloadMethod;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
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
	private DownloadPackager downloadPackager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@SuppressWarnings("unchecked") 
	@Async
	@Override
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest downloadRequest) throws Exception {
		List<LayerRequest> layerList = downloadRequest.getRequestList();
		List<String> layerReport = new ArrayList<>();
		for (LayerRequest currentLayer: layerList){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			try {
				logger.debug("Requesting download for: " + currentLayer.getLayerNameNS());
				currentLayer.setFutureValue(this.perLayerDownloadMethod.download(currentLayer));
				layerReport.add(currentLayer.getId());
			} catch (Exception e){
				e.printStackTrace();
				logger.error("An error occurred downloading this layer: " + currentLayer.getLayerNameNS());
				currentLayer.setStatus(Status.FAILED);
				continue;
			}
		}

		logger.debug("Requested layers: " + StringUtils.join(layerReport));
		int successCount = 0;
		for (LayerRequest currentLayer: layerList){
			try{
				currentLayer.getDownloadedFiles().addAll((Set<File>) currentLayer.getFutureValue().get());
				currentLayer.setStatus(Status.SUCCESS);
				successCount++;
				logger.debug("Finished download for: " + currentLayer.getLayerNameNS());
			} catch (Exception e){
				logger.error("An error occurred downloading this layer: " + currentLayer.getLayerNameNS());
				currentLayer.setStatus(Status.FAILED);	
			}
		
		}
		
		if (successCount > 0){
			Future<Boolean> ready = downloadPackager.packageFiles(requestId); //this is going to try to package files each time a download method is complete.
			Boolean response = ready.get();
			logger.debug("Packager response: " + Boolean.toString(response));
		} else {
			logger.error("No Files to package.  Download failed.");
		}
		
	}

	public PerLayerDownloadMethod getPerLayerDownloadMethod() {
		return perLayerDownloadMethod;
	}

	public void setPerLayerDownloadMethod(PerLayerDownloadMethod perLayerDownloadMethod) {
		this.perLayerDownloadMethod = perLayerDownloadMethod;
	}

	@Override
	public Boolean hasRequiredInfo(LayerRequest layer) {
		return perLayerDownloadMethod.hasRequiredInfo(layer);
	}


}
