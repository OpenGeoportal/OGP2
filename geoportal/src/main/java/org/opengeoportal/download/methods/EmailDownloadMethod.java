package org.opengeoportal.download.methods;

import org.opengeoportal.download.exception.RequestCreationException;
import org.opengeoportal.download.types.LayerRequest;

public interface EmailDownloadMethod {

	Boolean includesMetadata();

	String createQueryString(LayerRequest layerRequest) throws RequestCreationException;
	boolean sendEmail(LayerRequest layerRequest);

	Boolean hasRequiredInfo(LayerRequest layer);

	String getUrl(LayerRequest layer) throws RequestCreationException;
}
