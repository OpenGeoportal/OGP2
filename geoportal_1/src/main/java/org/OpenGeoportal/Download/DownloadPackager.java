package org.OpenGeoportal.Download;

import java.util.UUID;
import java.util.concurrent.Future;

public interface DownloadPackager {
	Future<Boolean> packageFiles(UUID requestId) throws Exception;
}
