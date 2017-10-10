package org.opengeoportal.download.methods;

import java.util.List;
import java.util.concurrent.Future;

import org.opengeoportal.download.types.LayerRequest;

public interface EmailDownloadMethod {

	Boolean includesMetadata();

	String createDownloadRequest();

	Future<Boolean> sendEmail(List<LayerRequest> layerList);

	Boolean hasRequiredInfo(LayerRequest layer);

}
