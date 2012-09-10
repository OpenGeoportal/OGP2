package org.OpenGeoPortal.Download.Config;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface DownloadConfigRetriever {
	String getClassKey(LayerRequest layer) throws Exception;
}
