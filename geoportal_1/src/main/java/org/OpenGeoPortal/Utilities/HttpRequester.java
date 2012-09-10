package org.OpenGeoPortal.Utilities;

import java.io.IOException;
import java.io.InputStream;

public interface HttpRequester {
	InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod) throws IOException;
	InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod, String contentType) throws IOException;
	String getContentType();
}
