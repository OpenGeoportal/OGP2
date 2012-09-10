package org.OpenGeoPortal.Download.Methods;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface DownloadMethod {

	void validate(LayerRequest currentLayer) throws Exception;

	String createDownloadRequest() throws Exception;

	Boolean includesMetadata();
}
