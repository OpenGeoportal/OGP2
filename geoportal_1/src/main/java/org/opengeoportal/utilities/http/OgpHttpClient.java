package org.opengeoportal.utilities.http;

import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.CloseableHttpClient;

public interface OgpHttpClient {
	HttpClient getHttpClient();
	CloseableHttpClient getCloseableHttpClient();
}
