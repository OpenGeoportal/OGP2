package org.OpenGeoPortal.Download.Methods;

import java.io.File;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface PerLayerDownloadMethod {

	Future<File> download(LayerRequest currentLayer) throws Exception;
	Boolean includesMetadata();

}
