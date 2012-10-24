package org.OpenGeoPortal.Download;

import java.util.UUID;

public interface LayerDownloader {
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception;
}
