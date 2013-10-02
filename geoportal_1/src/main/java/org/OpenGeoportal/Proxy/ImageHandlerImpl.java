package org.OpenGeoportal.Proxy;

import java.util.UUID;

import org.OpenGeoportal.Download.RequestStatusManager;
import org.OpenGeoportal.Proxy.Controllers.ImageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class ImageHandlerImpl implements ImageHandler {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private RequestStatusManager requestStatusManager;
	@Autowired
	private ImageCompositor imageCompositor;
	
	@Override
	public UUID requestImage(String sessionId, ImageRequest imageRequest){
		UUID requestId = registerRequest(sessionId, imageRequest);
		logger.debug("Image Request registered: " + requestId.toString());
		imageCompositor.createComposite(imageRequest);
		return requestId;
	}
	
	private UUID registerRequest(String sessionId, ImageRequest imageRequest) {
		UUID requestId = UUID.randomUUID();
		requestStatusManager.addImageRequest(requestId, sessionId, imageRequest);
		return requestId;
	}
}
