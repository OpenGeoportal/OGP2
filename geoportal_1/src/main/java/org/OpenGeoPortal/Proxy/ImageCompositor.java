package org.OpenGeoPortal.Proxy;

import java.util.UUID;

import org.OpenGeoPortal.Proxy.Controllers.ImageRequest;

public interface ImageCompositor {

	UUID requestImage(String sessionId, ImageRequest imageRequest);

}
