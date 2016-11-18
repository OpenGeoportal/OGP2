package org.opengeoportal.utilities.http;

import org.apache.http.impl.client.CloseableHttpClient;

public interface OgpHttpClient {
	CloseableHttpClient getCloseableHttpClient();
}
