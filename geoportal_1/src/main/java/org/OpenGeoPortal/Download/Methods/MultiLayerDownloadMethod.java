package org.OpenGeoPortal.Download.Methods;

import java.io.File;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface MultiLayerDownloadMethod {

	Boolean includesMetadata();

	String createDownloadRequest();

	Future<File> download(UUID requestId, LayerRequest currentLayer)
			throws Exception;

}
