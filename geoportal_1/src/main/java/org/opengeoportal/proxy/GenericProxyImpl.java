package org.opengeoportal.proxy;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.util.EntityUtils;
import org.opengeoportal.utilities.http.OgpHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class GenericProxyImpl implements GenericProxy {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private HttpEntity responseEntity;
	
	@Autowired 
	@Qualifier("httpClient.pooling")
	protected OgpHttpClient ogpHttpClient;
	
	public void proxyRequest(HttpServletRequest request,
			HttpServletResponse response, String remoteUrl){
		this.abstractRequest(request, response, remoteUrl, "copy");
	}
	
	public void abstractRequest(HttpServletRequest request, HttpServletResponse response, String remoteUrl, String action){
		HttpClient httpclient = ogpHttpClient.getHttpClient();
		try {

			HttpGet internalRequest = new HttpGet(remoteUrl);
			HttpResponse internalResponse = httpclient.execute(internalRequest);

			this.checkStatus(internalResponse, response);

			if (action.equalsIgnoreCase("copy")){
				this.copyResponse(internalResponse, response);
			} else if (action.equalsIgnoreCase("stream")){
				responseEntity = internalResponse.getEntity();
			}
		
			
		} catch (Exception e){
			logger.error("generic proxy failed");
			logger.error(e.getMessage());
			try {
				ServletOutputStream sos = response.getOutputStream();
				sos.print(e.getMessage());
				sos.close();
			} catch (IOException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			e.getStackTrace();
		} finally {

		}
	}
	
	public InputStream getContentStream(HttpServletRequest request, HttpServletResponse response, String remoteUrl){
		this.abstractRequest(request, response, remoteUrl, "stream");
		try {
			return this.responseEntity.getContent();
		} catch (IllegalStateException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}
	
	public void checkStatus (HttpResponse internalResponse, HttpServletResponse externalResponse) throws IOException{
		if (internalResponse.getStatusLine().getStatusCode() != 200){
			externalResponse.sendError(internalResponse.getStatusLine().getStatusCode());
			logger.error("Status returned: " + internalResponse.getStatusLine());
		}
	}
	
	public void copyHeaders (HttpResponse internalResponse, HttpServletResponse externalResponse){
		Header[] headers = internalResponse.getAllHeaders();
		for (int i = 0; i < headers.length; i++) {
			 //System.out.println(headers[i]);
			if (!headers[i].getName().equals("Content-Disposition")){
				externalResponse.setHeader(headers[i].getName(), headers[i].getValue());
			}
		}
	}
	
	public void copyResponse(HttpResponse internalResponse, HttpServletResponse externalResponse) throws IOException{
		HttpEntity entity = internalResponse.getEntity();
		//System.out.println(entity.getContentType());
		
		OutputStream outputStream = externalResponse.getOutputStream();
		BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(outputStream);
		BufferedInputStream bufferedInputStream = new BufferedInputStream(entity.getContent());

		try {
			IOUtils.copy(bufferedInputStream, bufferedOutputStream);

		} catch (Exception e){
			e.getStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);
			IOUtils.closeQuietly(bufferedInputStream);
			IOUtils.closeQuietly(bufferedOutputStream);
		}

		EntityUtils.consume(entity);
	}
}
