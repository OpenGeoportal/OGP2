package org.OpenGeoPortal.Utilities.Http;

import java.io.IOException;
import java.io.InputStream;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpComponentsHttpRequester implements HttpRequester {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	protected String contentType;	
	private OgpHttpClient ogpHttpClient;
	
	public OgpHttpClient getOgpHttpClient() {
		return ogpHttpClient;
	}

	public void setOgpHttpClient(OgpHttpClient ogpHttpClient) {
		this.ogpHttpClient = ogpHttpClient;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}
	
	public InputStream sendGetRequest(String url){
		HttpClient httpclient = ogpHttpClient.getHttpClient();
		InputStream replyStream = null;
		try {
			HttpGet httpget = new HttpGet(url);
			logger.debug("executing get request " + httpget.getURI());

			HttpResponse response = httpclient.execute(httpget);
			HttpEntity entity = response.getEntity();
			this.setContentType(entity.getContentType().getValue());
			if (entity != null) {
				 replyStream = entity.getContent();
			} 
		} catch (ClientProtocolException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			// When HttpClient instance is no longer needed,
			// shut down the connection manager to ensure
			// immediate deallocation of all system resources
			//httpclient.getConnectionManager().shutdown();
		}
		return replyStream;
	}
	
	@Override
	public InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod) throws IOException {
		return sendRequest(serviceURL, requestString, requestMethod, "text/xml");
	}

	protected InputStream sendPostRequest(String serviceURL,
			String requestBody, String contentType) {
		HttpClient httpclient = ogpHttpClient.getHttpClient();
		InputStream replyStream = null;
		try {
			HttpPost httppost = new HttpPost(serviceURL);
			StringEntity postEntity = new StringEntity(requestBody, ContentType.create(contentType, "UTF-8"));
			httppost.setEntity(postEntity);
			logger.info("executing POST request to " + httppost.getURI());
			HttpResponse response = httpclient.execute(httppost);
			HttpEntity entity = response.getEntity();
			this.setContentType(entity.getContentType().getValue());
			if (entity != null) {
				 replyStream = entity.getContent();
			} 
		} catch (ClientProtocolException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			// When HttpClient instance is no longer needed,
			// shut down the connection manager to ensure
			// immediate deallocation of all system resources
			//httpclient.getConnectionManager().shutdown();
		}
		return replyStream;
	}

	@Override
	public InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod, String contentType) throws IOException {
		logger.debug("URL: " + serviceURL);
		logger.debug("Query string: " + requestString);
		logger.debug("Request Method: " + requestMethod);
		if ((serviceURL.isEmpty())||(serviceURL.equals(null))){
			throw new IOException("No URL provided!");
		}
		if (requestMethod.equals("POST")){
			return sendPostRequest(serviceURL, requestString, contentType);
		} else if (requestMethod.equals("GET")){
			return sendGetRequest(serviceURL + "?" + requestString);
		} else {
			//throw new Exception("The method " + requestMethod + " is not supported.");
			return null;
		}
	}

	@Override
	public String getContentType() {
		return this.contentType;
	}

}
