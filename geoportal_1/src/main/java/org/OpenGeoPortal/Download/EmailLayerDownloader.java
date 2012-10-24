package org.OpenGeoPortal.Download;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Methods.EmailDownloadMethod;
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
public class EmailLayerDownloader implements LayerDownloader {
	private EmailDownloadMethod emailDownloadMethod;
	private RequestStatusManager requestStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public EmailDownloadMethod getEmailDownloadMethod() {
		return emailDownloadMethod;
	}


	public void setEmailDownloadMethod(EmailDownloadMethod emailDownloadMethod) {
		this.emailDownloadMethod = emailDownloadMethod;
	}


	@Async
	@Override
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception {
		List<LayerRequest> layerList = request.getRequestList();
		for (LayerRequest currentLayer: layerList){
			//this.downloadMethod.validate(currentLayer);
				//check to see if the filename exists
			//this should fire off a callable that asynchronously calls the download method
			try {
				logger.info("Trying to send email...");
				currentLayer.setFutureValue(this.emailDownloadMethod.sendEmail(currentLayer));
			} catch (Exception e){
				//e.printStackTrace();
				logger.error("an error downloading this layer: " + currentLayer.getLayerInfo().getName());
				currentLayer.setStatus(Status.FAILED);
				continue;
			}
		} 
		for (LayerRequest currentLayer: layerList){
			Future<?> currentFuture = currentLayer.getFutureValue();
			if ((Boolean) currentFuture.get()){
				currentLayer.setStatus(Status.SUCCESS);
			} else {
				currentLayer.setStatus(Status.FAILED);
			}
		}
	}


	public RequestStatusManager getRequestStatusManager() {
		return requestStatusManager;
	}

	public void setRequestStatusManager(RequestStatusManager requestStatusManager) {
		this.requestStatusManager = requestStatusManager;
	}
}
