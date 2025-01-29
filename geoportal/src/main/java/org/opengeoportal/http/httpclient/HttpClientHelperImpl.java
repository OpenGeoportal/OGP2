package org.opengeoportal.http.httpclient;

import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.*;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

@Component
public class HttpClientHelperImpl implements HttpClientHelper {
    final Logger logger = LoggerFactory.getLogger(HttpClientHelperImpl.class);

    @Override
    public HttpClient getClient() {
        return HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build();
    }

    @Override
    public HttpClient getClient(String username, String password) {
        return HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .authenticator(new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(
                                username,
                                password.toCharArray());
                    }
                })
                .build();
    }

    @Override
    public HttpRequest buildPostRequest(String serviceURL, String requestString, String contentType) throws URISyntaxException {
        return HttpRequest.newBuilder()
                .uri(new URI(serviceURL))
                .headers("Content-Type", contentType)
                .POST(HttpRequest.BodyPublishers.ofString(requestString))
                .build();
    }

    @Override
    public HttpRequest buildGetRequest(String serviceURL, String requestString, String contentType) throws URISyntaxException, IOException {

        String url = "";
        try {
            url = OgpUtils.combinePathWithQuery(serviceURL, requestString);
        } catch (Exception e){
            throw new IOException("Problem forming URL: " + e.getMessage());
        }
        logger.debug("about to send url: " + url);

        return HttpRequest.newBuilder()
                .uri(new URI(url))
                .headers("Content-Type", contentType)
                .GET()
                .build();
    }
}
