package org.opengeoportal.proxy;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.opengeoportal.http.OgpHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class GenericProxyImpl implements GenericProxy {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	protected final OgpHttpClient ogpHttpClient;

	@Autowired
	public GenericProxyImpl(OgpHttpClient ogpHttpClient) {
		this.ogpHttpClient = ogpHttpClient;
	}

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

	};
	
}
