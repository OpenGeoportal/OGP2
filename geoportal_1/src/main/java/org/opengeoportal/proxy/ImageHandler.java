package org.opengeoportal.proxy;

import java.util.UUID;

import org.opengeoportal.proxy.controllers.ImageRequest;

public interface ImageHandler {

	UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception;

}
