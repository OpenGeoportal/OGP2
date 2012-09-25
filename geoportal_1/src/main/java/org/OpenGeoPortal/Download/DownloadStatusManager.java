package org.OpenGeoPortal.Download;

import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.DownloadStatusManagerImpl.DownloadRequest;
import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface DownloadStatusManager {

	void addDownloadRequest(UUID requestId, String sessionId,
			List<LayerRequest> layerRequests);

	void removeRequestBySessionId(String sessionId);

	DownloadRequest getDownloadRequest(UUID requestId);

}
