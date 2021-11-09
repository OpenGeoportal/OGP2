package org.opengeoportal.download;

import java.util.UUID;

import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.MethodLevelDownloadRequest;

public interface LayerDownloader {
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception;

	public Boolean hasRequiredInfo(LayerRequest layer);
}
