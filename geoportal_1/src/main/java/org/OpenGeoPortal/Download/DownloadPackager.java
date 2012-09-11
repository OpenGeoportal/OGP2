package org.OpenGeoPortal.Download;

import java.util.UUID;

public interface DownloadPackager {
	void packageFiles(UUID requestId) throws Exception;
}
