package org.opengeoportal.image;

import java.util.UUID;

public interface ImageHandler {

	UUID requestImage(String sessionId, ImageRequest imageRequest) throws Exception;

}
