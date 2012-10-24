package org.OpenGeoPortal.Proxy;

import java.util.UUID;

import org.OpenGeoPortal.Proxy.Controllers.ImageRequest;

public interface ImageHandler {

	UUID requestImage(String sessionId, ImageRequest imageRequest);

}
