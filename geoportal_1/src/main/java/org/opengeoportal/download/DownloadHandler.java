package org.opengeoportal.download;

import java.util.UUID;

public interface DownloadHandler {
	public UUID requestLayers(DownloadRequest dlRequest) throws Exception;
}
