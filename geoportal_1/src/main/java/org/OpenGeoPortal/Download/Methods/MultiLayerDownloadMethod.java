package org.OpenGeoPortal.Download.Methods;

import java.io.File;
import java.util.Set;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface MultiLayerDownloadMethod {

	Boolean includesMetadata();

	String createDownloadRequest();

	Future<Set<File>> download(LayerRequest currentLayer)
			throws Exception;

	Boolean hasRequiredInfo(LayerRequest layer);

}
