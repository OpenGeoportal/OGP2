package org.opengeoportal.utilities.http;

import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;

import org.apache.http.client.HttpClient;
import org.apache.http.conn.scheme.PlainSocketFactory;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.scheme.SchemeSocketFactory;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.PoolingClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PreemptiveBasicAuthPoolingHttpClient implements OgpHttpClient {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private PoolingClientConnectionManager connectionManager;
	private CloseableHttpClient client;
	
	PreemptiveBasicAuthPoolingHttpClient(){
		//since the php script we are accessing is https, but doesn't require certs, we need to create a context that essentially 
		//ignores certs
		TrustManager[] trustAllCerts = new TrustManager[] { new AllTrustingTrustManager() };
		SSLContext sc = null;
		try {
			sc = SSLContext.getInstance("TLS");
		} catch (NoSuchAlgorithmException e1) {
			logger.error("NoSuchAlgorithm :" + e1.getMessage());
			e1.printStackTrace();
		}
		try {
			sc.init(null, trustAllCerts, new java.security.SecureRandom());
		} catch (KeyManagementException e1) {
			logger.error("KeyManagementException :" + e1.getMessage());
			e1.printStackTrace();
		}
		SchemeSocketFactory sf = (SchemeSocketFactory) new SSLSocketFactory(sc, SSLSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);
		
		SchemeRegistry schemeRegistry = new SchemeRegistry();
		schemeRegistry.register(
		         new Scheme("http", 80, PlainSocketFactory.getSocketFactory()));
		schemeRegistry.register(
				new Scheme("https", 443, sf));
		connectionManager = new PoolingClientConnectionManager(schemeRegistry);
		// Increase max total connection to 200
		//cm.setMaxTotal(200);
		// Increase default max connection per route to 20
		//cm.setDefaultMaxPerRoute(20);
		// Increase max connections for localhost:80 to 50
		//HttpHost localhost = new HttpHost("locahost", 80);
		//cm.setMaxPerRoute(new HttpRoute(localhost), 50);
		client =  new DefaultHttpClient(connectionManager);
	}
	
	@Override
	public HttpClient getHttpClient() {
		return client;
	}

	@Override
	public CloseableHttpClient getCloseableHttpClient() {
		// TODO Auto-generated method stub
		return client;
	}

}
