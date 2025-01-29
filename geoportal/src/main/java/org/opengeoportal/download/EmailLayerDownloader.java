package org.opengeoportal.download;

import java.util.List;
import java.util.UUID;

import org.opengeoportal.download.methods.EmailDownloadMethod;
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
public class EmailLayerDownloader implements LayerDownloader {
	private EmailDownloadMethod emailDownloadMethod;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public EmailLayerDownloader(EmailDownloadMethod emailDownloadMethod) {
		this.emailDownloadMethod = emailDownloadMethod;
	}

	@Async
	@Override
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) {
		List<LayerRequest> layerList = request.getRequestList();
		for (LayerRequest layer: layerList){
			layer.setShouldHaveFiles(false);

			logger.debug("Trying to send email...");
			boolean emailSent = this.emailDownloadMethod.sendEmail(layer);

			if (emailSent){
				layer.setStatus(Status.SUCCESS);
				logger.debug("Email requested.");
			} else {
				layer.setStatus(Status.FAILED);
				logger.error("Error requesting Email for layer [" + layer.getLayerInfo().getLayerId() + "]");
			}

		}
	}


	@Override
	public Boolean hasRequiredInfo(LayerRequest layer) {
		return this.emailDownloadMethod.hasRequiredInfo(layer);
	}

}
