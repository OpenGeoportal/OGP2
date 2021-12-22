package org.opengeoportal.download.methods;

import java.io.InputStream;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.validator.routines.EmailValidator;

import com.fasterxml.jackson.core.JsonParseException;

/**
 * a class to request layer downloads from HGL.  They are not downloaded locally.
 * Rather, an email is sent to the user containing a link to the requested layer.
 * 
 * @author chris
 *
 */
public class HGLEmailDownloadMethod implements EmailDownloadMethod {

	private final HttpRequester httpRequester;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	public HGLEmailDownloadMethod(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}
	
	@Override
	public Boolean includesMetadata() {
		return true;
	}

	/***
	 * creates request string for email. Current version doesn't support clipping.
	 * @param layerRequest
	 * @return
	 * @throws RequestCreationException
	 */
	public String createQueryString(LayerRequest layerRequest) throws RequestCreationException {

		/*
		old request:
		for (LayerRequest currentLayer: this.layerList){
			layerQuery += "LayerName=" + currentLayer.getLayerInfo().getName() + "&";
		}
		layerQuery + "UserEmail=" + userEmail + "&Clip=true&EmailAdmin=true&AppID=55&EncryptionKey=OPENGEOPORTALROCKS"
		 + "&XMin=" + bounds.getMinX() + "&YMin=" + bounds.getMinY() + "&XMax=" + bounds.getMaxX() + "&YMax=" + bounds.getMaxY()
		 */
		String userEmail = layerRequest.getEmailAddress();
		boolean validEmail = EmailValidator.getInstance().isValid(userEmail);

		if (!validEmail) {
			throw new RequestCreationException("email address is invalid");
		}
		String emailRequestQuery = null;
		try {
			emailRequestQuery = "LayerName=" + layerRequest.getLayerNameNS() + "UserEmail=" + userEmail;
		} catch (Exception e) {
			e.printStackTrace();
			throw new RequestCreationException("Unable to get layer name with namespace.");
		}

		return emailRequestQuery;
	}
	
	@Override
	public boolean sendEmail(LayerRequest layerRequest) {

		try {
			try (InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(layerRequest), createQueryString(layerRequest), "GET", "text/xml") ) {
				return true;
			}

		} catch (Exception e){
			logger.error(e.getMessage());
			return false;
		}
	}

	@Override
	public Boolean hasRequiredInfo(LayerRequest layerRequest){

		try {
			createQueryString(layerRequest);
		} catch (RequestCreationException e) {
			logger.error(e.getMessage());
			e.printStackTrace();
			return false;
		}

		try {
			getUrl(layerRequest);
		} catch (RequestCreationException e) {
			logger.error(e.getMessage());
			return false;
		}

		logger.info("Layer [" + layerRequest.getLayerInfo().getLayerId() + "] does not have required info for HGLEmailDownload");
		return true;
	};

	@Override
	public String getUrl(LayerRequest layer) throws RequestCreationException {
		try {
			logger.info("Download URL: " + layer.getDownloadUrl());
			return layer.getDownloadUrl().get(0);
		} catch (JsonParseException e) {
			e.printStackTrace();
			throw new RequestCreationException("Unable to parse email request url from download url");
		}
	}

}
