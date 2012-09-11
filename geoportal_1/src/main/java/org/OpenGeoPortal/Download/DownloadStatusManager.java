package org.OpenGeoPortal.Download;

import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.DownloadStatusManagerImpl.DownloadRequestStatus;
import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface DownloadStatusManager {

	void addDownloadRequestStatus(UUID requestId, String sessionId,
			List<LayerRequest> layerRequests);

	void removeStatusBySessionId(String sessionId);

	DownloadRequestStatus getDownloadRequestStatus(UUID requestId);

}
