package org.OpenGeoportal.Proxy;

import java.util.UUID;

import org.OpenGeoportal.Proxy.Controllers.ImageRequest;

public interface ImageHandler {

	UUID requestImage(String sessionId, ImageRequest imageRequest);

}
