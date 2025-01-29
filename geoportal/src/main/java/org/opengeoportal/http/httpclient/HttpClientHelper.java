package org.opengeoportal.http.httpclient;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

public interface HttpClientHelper {
    HttpClient getClient();

    HttpClient getClient(String username, String password);

    HttpRequest buildPostRequest(String serviceURL, String requestString, String contentType) throws URISyntaxException;

    HttpRequest buildGetRequest(String serviceURL, String requestString, String contentType) throws URISyntaxException, IOException;
}
