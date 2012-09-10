package org.OpenGeoPortal.Download.Methods;

import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.LayerRequest;

public interface EmailDownloadMethod {

	Boolean includesMetadata();

	String createDownloadRequest();

	Future<Boolean> sendEmail(UUID requestId, LayerRequest currentLayer)
			throws Exception;

}
