package org.opengeoportal.proxy;

import java.util.UUID;

public interface ImageHandler {

	UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception;

}
