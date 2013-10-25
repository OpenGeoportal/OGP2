package org.opengeoportal.ogc;

import java.io.InputStream;

public interface OgcInfoRequest {

	String createRequest(String layerName);

	OwsInfo parseResponse(InputStream inputStream) throws Exception;

	String getMethod();

	String getOgcProtocol();

	String getVersion();

}
