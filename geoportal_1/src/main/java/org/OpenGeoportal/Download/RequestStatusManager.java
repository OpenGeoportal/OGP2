package org.OpenGeoportal.Download;

import java.util.UUID;

import org.OpenGeoportal.Export.GeoCommons.GeoCommonsExportRequest;
import org.OpenGeoportal.Proxy.Controllers.ImageRequest;

public interface RequestStatusManager {

	void addDownloadRequest(DownloadRequest downloadRequest);

	void removeRequestsBySessionId(String sessionId);

	DownloadRequest getDownloadRequest(UUID requestId);

	void addImageRequest(UUID requestId, String sessionId,
			ImageRequest imageRequest);

	ImageRequest getImageRequest(UUID fromString);

	void addExportRequest(UUID requestId, String sessionId,
			GeoCommonsExportRequest exportRequest);

	GeoCommonsExportRequest getExportRequest(UUID requestId);

}
