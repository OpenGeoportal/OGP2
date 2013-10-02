package org.OpenGeoportal.Download.Config;

import org.OpenGeoportal.Download.Types.LayerRequest;

public interface DownloadConfigRetriever {
	String getClassKey(LayerRequest layer) throws Exception;
}
