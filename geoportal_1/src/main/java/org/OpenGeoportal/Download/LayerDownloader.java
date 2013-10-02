package org.OpenGeoportal.Download;

import java.util.UUID;

import org.OpenGeoportal.Download.Types.LayerRequest;

public interface LayerDownloader {
	public void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception;

	public Boolean hasRequiredInfo(LayerRequest layer);
}
