package org.OpenGeoportal.Download.Methods;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.concurrent.Future;

import org.OpenGeoportal.Download.Types.LayerRequest;
import org.OpenGeoportal.Download.Types.LayerRequest.Status;
import org.OpenGeoportal.Layer.BoundingBox;
import org.OpenGeoportal.Utilities.OgpUtils;
import org.OpenGeoportal.Utilities.Http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;

import com.fasterxml.jackson.core.JsonParseException;

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
	public Future<Boolean> sendEmail(List<LayerRequest> layerList) {
		this.layerList = layerList;
		InputStream inputStream = null;
		try {
			inputStream = this.httpRequester.sendRequest(this.getUrl(layerList.get(0)), createDownloadRequest(), "GET");
			this.setAllLayerStatus(Status.SUCCESS);
			return new AsyncResult<Boolean>(true);
		} catch (Exception e){
			logger.error(e.getMessage());
			this.setAllLayerStatus(Status.FAILED);
			return new AsyncResult<Boolean>(false);
		} finally {
			try {
				inputStream.close();
			} catch (IOException e) {
				logger.error("Unable to close input stream");
				e.printStackTrace();
			}
		}
	}

	@Override
	public Boolean hasRequiredInfo(LayerRequest layerRequest){
		if (!OgpUtils.isWellFormedEmailAddress(layerRequest.getEmailAddress())){
			return false;
		}
		try {
			if (getUrl(layerRequest) != null){
				return true;
			}
		} catch (JsonParseException e) {
			logger.error(e.getMessage());
		}
		logger.info("Layer does not have required info for HGLEmailDownload");
		return false;
	};
	
	private String getUrl(LayerRequest layer) throws JsonParseException {

		logger.info("Download URL: " + layer.getDownloadUrl());
		return layer.getDownloadUrl().get(0);
	}

}
