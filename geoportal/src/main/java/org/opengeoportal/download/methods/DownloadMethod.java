package org.opengeoportal.download.methods;

import org.opengeoportal.download.types.LayerRequest;

public interface DownloadMethod {

	void validate(LayerRequest currentLayer) throws Exception;

	String createDownloadRequest() throws Exception;

	Boolean includesMetadata();
}
