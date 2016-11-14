package org.opengeoportal.proxy;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.BitSet;
import java.util.Enumeration;
import java.util.Formatter;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIUtils;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.HeaderGroup;
import org.apache.http.util.EntityUtils;
import org.opengeoportal.utilities.http.OgpHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class GenericProxyImpl implements GenericProxy {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired 
	@Qualifier("httpClient.pooling")
	protected OgpHttpClient ogpHttpClient;
	
	@Override
	public void proxyRequest(HttpServletRequest request,
			HttpServletResponse response, String remoteUrl){

			try {
				this.doProxy(request, response, remoteUrl);
			} catch (IOException e) {
				logger.error(e.getLocalizedMessage());
				
			}


	}
	
	protected void doProxy(HttpServletRequest request,
			HttpServletResponse response, String remoteUrl) throws IOException{
            
            CloseableHttpClient httpClient = ogpHttpClient.getCloseableHttpClient();
            
            
            HttpGet proxyRequest = new HttpGet(remoteUrl);


            CloseableHttpResponse proxyResponse = null;
			try {
				proxyResponse = httpClient.execute(proxyRequest);
			} catch (ClientProtocolException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
            try {
                logger.info(proxyResponse.getStatusLine().getReasonPhrase());
                IOUtils.copy(proxyResponse.getEntity().getContent(), response.getOutputStream());
            } finally {
                proxyResponse.close();
            }

    }

}
