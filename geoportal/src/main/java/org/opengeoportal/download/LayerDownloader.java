package org.opengeoportal.download;

import java.util.UUID;

import org.opengeoportal.download.types.LayerRequest;

public interface LayerDownloader {
    void downloadLayers(UUID requestId, MethodLevelDownloadRequest request) throws Exception;

    Boolean hasRequiredInfo(LayerRequest layer);
}
