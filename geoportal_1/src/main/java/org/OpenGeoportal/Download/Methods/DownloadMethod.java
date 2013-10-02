package org.OpenGeoportal.Download.Methods;

import org.OpenGeoportal.Download.Types.LayerRequest;

public interface DownloadMethod {

	void validate(LayerRequest currentLayer) throws Exception;

	String createDownloadRequest() throws Exception;

	Boolean includesMetadata();
}
