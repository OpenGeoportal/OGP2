package org.opengeoportal.http.httpclient;

import org.opengeoportal.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;


public class HttpClientHttpRequester implements HttpRequester {
    final Logger logger = LoggerFactory.getLogger(HttpClientHttpRequester.class);

    private int status = -1;
    private HttpHeaders headers;

    final HttpClientHelper httpClientHelper;

    public HttpClientHttpRequester(HttpClientHelper httpClientHelper) {
        this.httpClientHelper = httpClientHelper;
    }


    @Override
    public InputStream sendRequest(String serviceURL,
                                   String requestString,
                                   String requestMethod,
                                   String contentType,
                                   String username,
                                   String password) throws IOException {
        logger.debug("URL: " + serviceURL);
        logger.debug("Query string: " + requestString);
        logger.debug("Request Method: " + requestMethod);
        if (serviceURL.isEmpty()){
            logger.error("No service URL!");
            throw new IOException("No URL provided!");
        }

        if (!checkUrl(serviceURL)){
            logger.error("Malformed URL: " + serviceURL);
            throw new MalformedURLException();
        }

        HttpClient httpClient;
        if (username.isBlank() || password.isBlank()) {
            httpClient = httpClientHelper.getClient();
        } else {
            httpClient = httpClientHelper.getClient(username, password);
        }

        if (requestMethod.equals("POST")){
            try {
                return getResponse(httpClient, httpClientHelper.buildPostRequest(serviceURL, requestString, contentType));
            } catch (InterruptedException | URISyntaxException e) {
                e.printStackTrace();
                throw new IOException(e.getMessage());
            }
        } else if (requestMethod.equals("GET")){

            try {
                return getResponse(httpClient, httpClientHelper.buildGetRequest(serviceURL, requestString, contentType));
            } catch (InterruptedException | URISyntaxException e) {
                e.printStackTrace();
                throw new IOException(e.getMessage());
            }
        } else {
            throw new IOException("The method " + requestMethod + " is not supported.");
        }
    }

    @Override
    public InputStream sendRequest(String serviceURL, String requestString, String requestMethod, String contentType) throws IOException {
        return sendRequest(serviceURL, requestString, requestMethod, contentType, "", "");
    }


    private InputStream getResponse(HttpClient httpClient, HttpRequest request) throws IOException, InterruptedException {
        HttpResponse<InputStream> response = httpClient
                .send(request, HttpResponse.BodyHandlers.ofInputStream());

        int statusCode = response.statusCode();

        setStatus(response.statusCode());

        if (statusCode != 200){
            logger.warn("Server responded with: " + Integer.toString(statusCode));
        }

        setHeaders(response.headers());
        return response.body();
    }



    @Override
    public String getContentType() {
        try {
            return getHeaderValue("Content-Type");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

    @Override
    public String getHeaderValue(String headerName) throws Exception {
        if (headers == null) {
            return "";
        }
        return headers.firstValue(headerName).orElse("");
    }

    @Override
    public int getStatus() {
        return status;
    }

    public void setStatus(int status){
        this.status = status;
    }

    public HttpHeaders getHeaders() {
        return headers;
    }

    public void setHeaders(HttpHeaders headers) {
        this.headers = headers;
    }

    private Boolean checkUrl(String url) {
        try{
            new URL(url);
            return true;
        } catch (Exception e){
            logger.error("URL is somehow invalid: " + url);
            return false;
        }
    }
}
