package org.OpenGeoportal.Download;

import java.util.Map;
import java.util.UUID;

public interface DownloadHandler {
	public UUID requestLayers(String sessionId, Map<String,String> layerMap, String[] requestedBounds, String emailAddress, Boolean locallyAuthenticated) throws Exception;
}
