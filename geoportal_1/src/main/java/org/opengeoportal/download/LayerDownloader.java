package org.opengeoportal.download;

import java.util.UUID;

import org.opengeoportal.download.types.LayerRequest;

public interface LayerDownloader {
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception;

	public Boolean hasRequiredInfo(LayerRequest layer);
}
