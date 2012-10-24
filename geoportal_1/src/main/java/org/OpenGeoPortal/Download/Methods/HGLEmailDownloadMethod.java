package org.OpenGeoPortal.Download.Methods;

import java.util.List;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerRequest.Status;
import org.OpenGeoPortal.Utilities.Http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;

/**
 * a class that implements PackagedDownloadMethod to request raster layers from HGL.  They are not downloaded locally.
 * Rather, an email is sent to the user containing a link to the requested layers.
 * 
 * @author chris
 *
 */
public class HGLEmailDownloadMethod implements EmailDownloadMethod {
	private static final Boolean INCLUDES_METADATA = true;
	private HttpRequester httpRequester;
	private List<LayerRequest> layerList;
	private LayerRequest currentLayer;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public void setLayerList(List<LayerRequest> layerList){
		this.layerList = layerList;
	}
	
	/**
	 * an HttpRequester is injected
	 * @param httpRequester
	 */
	public void setHttpRequester(HttpRequester httpRequester){
		this.httpRequester = httpRequester;
	}
	
	@Override
	public Boolean includesMetadata() {
		return INCLUDES_METADATA;
	}
	
	
	public void validate(LayerRequest currentLayer) throws Exception {
		if (currentLayer.getEmailAddress().isEmpty()){
			throw new Exception("A valid email address must be supplied.");
		}
	}
	
	public void setAllLayerStatus(Status status){
		for (LayerRequest currentLayer: this.layerList){
			currentLayer.setStatus(status);
		}
	}
	
	@Override
	public String createDownloadRequest() {
		LayerRequest representativeLayer = this.layerList.get(0);
		try {
			this.validate(representativeLayer);
		} catch (Exception e){
			//die gracefully
			this.setAllLayerStatus(Status.FAILED);
			return null;
		}
		BoundingBox bounds = representativeLayer.getRequestedBounds();
		String userEmail = representativeLayer.getEmailAddress();

		String layerQuery = "";
		for (LayerRequest currentLayer: this.layerList){
			layerQuery += "LayerName=" + currentLayer.getLayerInfo().getName() + "&";
		}

		String getFeatureRequest = layerQuery 
		 + "UserEmail=" + userEmail + "&Clip=true&EmailAdmin=true&AppID=55&EncryptionKey=OPENGEOPORTALROCKS"
		 + "&XMin=" + bounds.getMinX() + "&YMin=" + bounds.getMinY() + "&XMax=" + bounds.getMaxX() + "&YMax=" + bounds.getMaxY();
		return getFeatureRequest;
	}
	
	@Override
	@Async
	public Future<Boolean> sendEmail(LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		try {
			this.httpRequester.sendRequest(this.getUrl(), createDownloadRequest(), "GET");
			logger.info("Email request sent.");
			return new AsyncResult<Boolean>(true);
		} catch (Exception e){
			logger.error("Attempt to send email failed.");
			return new AsyncResult<Boolean>(false);
		}
	}

	private String getUrl() {
		logger.info("Download URL: " + currentLayer.getDownloadUrl());
		return currentLayer.getDownloadUrl();
	}

}
