package org.opengeoportal.utilities.http;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpComponentsHttpRequester implements HttpRequester {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	protected String contentType;	
	private OgpHttpClient ogpHttpClient;
	private int status;
	protected Header[] headers;
	
	public OgpHttpClient getOgpHttpClient() {
		return ogpHttpClient;
	}

	public void setOgpHttpClient(OgpHttpClient ogpHttpClient) {
		this.ogpHttpClient = ogpHttpClient;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}
	
	public Header[] getHeaders(){
		return headers;
	}
	
	public void setStatus(int status){
		this.status = status;
	}
	
	@Override
	public int getStatus(){
		return status;
	}
	
	@Override
	public String getHeaderValue(String headerName) throws Exception{
		for (Header header: getHeaders()){
			if(header.getName().equalsIgnoreCase(headerName)){
				return header.getValue();
			}
		}
		throw new Exception("Header ['" + headerName + "'] not found.");
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
	
	public InputStream sendGetRequest(String url) throws MalformedURLException, IOException{
		logger.debug("about to send url: " + url);
		HttpClient httpclient = ogpHttpClient.getHttpClient();
		InputStream replyStream = null;
		HttpResponse response = null;
		try {
			HttpGet httpget = new HttpGet(url);

			logger.info("executing get request " + httpget.getURI());

			response = httpclient.execute(httpget);
			this.setStatus(response.getStatusLine().getStatusCode());
			this.setHeaders(response.getAllHeaders());
			HttpEntity entity = response.getEntity();
			this.setContentType(entity.getContentType().getValue());

			if (entity != null) {
				replyStream = entity.getContent();
			} 
		} catch (ClientProtocolException e) {

			e.printStackTrace();
		} catch (IOException e) {

			e.printStackTrace();
		} 
		//make sure you close the input stream at the other end

		return replyStream;
	}
	
	@Override
	public InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod) throws IOException {
		return sendRequest(serviceURL, requestString, requestMethod, "text/xml");
	}

	protected InputStream sendPostRequest(String serviceURL,
			String requestBody, String contentType) throws IOException{
		HttpClient httpclient = ogpHttpClient.getHttpClient();
		InputStream replyStream = null;
		try{
			HttpPost httppost = new HttpPost(serviceURL);
			logger.info(requestBody);
			StringEntity postEntity = new StringEntity(requestBody, ContentType.create(contentType, "UTF-8"));
			httppost.setEntity(postEntity);
			logger.info("executing POST request to " + httppost.getURI());
			HttpResponse response = httpclient.execute(httppost);

			StatusLine status = response.getStatusLine();
			int statusCode = status.getStatusCode();
			this.setStatus(statusCode);
			if (status.getStatusCode() != 200){
				logger.error("Server responded with: " + Integer.toString(statusCode) + status.getReasonPhrase());
			}
			this.setHeaders(response.getAllHeaders());
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
		} 
		//make sure you close the input stream at the other end
		return replyStream;
	}

	private void setHeaders(Header[] allHeaders) {
		headers = allHeaders;
	}
	
	@Override
	public InputStream sendRequest(String serviceURL, String requestString,
			String requestMethod, String contentType) throws IOException {
		logger.debug("URL: " + serviceURL);
		logger.debug("Query string: " + requestString);
		logger.debug("Request Method: " + requestMethod);
		if ((serviceURL.isEmpty())||(serviceURL.equals(null))){
			logger.error("No service URL!");
			throw new IOException("No URL provided!");
		}
		
		if (!checkUrl(serviceURL)){
			logger.error("Malformed URL: " + serviceURL);
			throw new MalformedURLException();
		}
		if (requestMethod.equals("POST")){
			return sendPostRequest(serviceURL, requestString, contentType);
		} else if (requestMethod.equals("GET")){
			String url = "";
			try {
				url = OgpUtils.combinePathWithQuery(serviceURL, requestString);
			} catch (Exception e){
				throw new IOException("Problem forming URL: " + e.getMessage());
			}
			return sendGetRequest(url);
		} else {
			throw new IOException("The method " + requestMethod + " is not supported.");
		}
	}

	@Override
	public String getContentType() {
		return this.contentType;
	}

}
