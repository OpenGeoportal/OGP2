package org.opengeoportal.download;

import java.util.UUID;

public interface DownloadHandler {
    UUID requestLayers(DownloadRequest dlRequest) throws Exception;
}
