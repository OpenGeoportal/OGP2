package org.OpenGeoportal.Download;

import java.util.UUID;

public interface DownloadHandler {
	public UUID requestLayers(DownloadRequest dlRequest, Boolean locallyAuthenticated) throws Exception;
}
