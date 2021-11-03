package org.opengeoportal.download;

import java.util.UUID;

import org.opengeoportal.proxy.controllers.ImageRequest;

public interface RequestStatusManager {

	void addDownloadRequest(DownloadRequest downloadRequest);

	void removeRequestsBySessionId(String sessionId);

	DownloadRequest getDownloadRequest(UUID requestId);

	void addImageRequest(UUID requestId, String sessionId,
			ImageRequest imageRequest);

	ImageRequest getImageRequest(UUID fromString);

}
