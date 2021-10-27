package org.opengeoportal.download.methods;

import java.io.File;
import java.util.Set;
import java.util.concurrent.Future;

import org.opengeoportal.download.types.LayerRequest;

public interface MultiLayerDownloadMethod {

	Boolean includesMetadata();

	String createDownloadRequest();

	Future<Set<File>> download(LayerRequest currentLayer)
			throws Exception;

	Boolean hasRequiredInfo(LayerRequest layer);

}
