package org.OpenGeoPortal.Proxy;

import java.util.UUID;

public interface ImageStatusManager {

	void addImageStatus(UUID requestId, String sessionId,
			ImageStatus imageStatus);

}
