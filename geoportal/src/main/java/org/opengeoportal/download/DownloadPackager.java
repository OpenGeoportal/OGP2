package org.opengeoportal.download;

import org.opengeoportal.download.exception.DownloadPackagingException;

import java.util.UUID;
import java.util.concurrent.Future;

public interface DownloadPackager {
	Future<Boolean> packageFiles(UUID requestId) throws DownloadPackagingException;
}
