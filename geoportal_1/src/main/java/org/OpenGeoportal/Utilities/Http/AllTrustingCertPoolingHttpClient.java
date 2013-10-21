package org.OpenGeoportal.Utilities.Http;

import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;

import javax.net.ssl.SSLContext;

import org.OpenGeoportal.Utilities.Http.AllTrustingTrustStrategy;
import org.OpenGeoportal.Utilities.Http.OgpHttpClient;
import org.apache.http.client.HttpClient;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;

import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContexts;

import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AllTrustingCertPoolingHttpClient implements OgpHttpClient {
	//Not sure if this does what it's supposed to..however it's not currently being used
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private PoolingHttpClientConnectionManager connectionManager;
	private HttpClient client;
	private boolean initCalled = false;
	
	private void init() throws KeyManagementException, NoSuchAlgorithmException, KeyStoreException{
		//since the php script we are accessing is https, (self-signed cert) but doesn't require certs, we need to create a context that essentially 
		//ignores certs
		
		ConnectionSocketFactory plainsf = PlainConnectionSocketFactory.getSocketFactory();
        KeyStore trustStore  = KeyStore.getInstance(KeyStore.getDefaultType());

		SSLContext sc = SSLContexts.custom()
		        .useTLS()
		        .loadTrustMaterial(trustStore, new AllTrustingTrustStrategy())
		        .setSecureRandom(new java.security.SecureRandom())
		        .build();
		
		SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(sc);
		Registry<ConnectionSocketFactory> r = RegistryBuilder.<ConnectionSocketFactory>create()
		        .register("http", plainsf)
		        .register("https", sslsf)
		        .build();

		connectionManager = new PoolingHttpClientConnectionManager(r);

		client = HttpClients.custom()
				.setConnectionManager(connectionManager)
				.build();
		initCalled = true;
	}
	
	@Override
	public HttpClient getHttpClient(){
		if (!initCalled){
			try {
				init();
			} catch (KeyManagementException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (NoSuchAlgorithmException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (KeyStoreException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		return client;
	}

}
