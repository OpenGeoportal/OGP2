package org.opengeoportal.http;

import java.net.MalformedURLException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.net.ssl.SSLContext;

import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContexts;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.opengeoportal.config.proxy.InternalServerMapping;
import org.opengeoportal.config.proxy.ProxyConfig;
import org.opengeoportal.config.proxy.ProxyConfigRetriever;
import org.opengeoportal.config.proxy.ServerMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PoolingHttpClient implements OgpHttpClient {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private PoolingHttpClientConnectionManager connectionManager;
	private CloseableHttpClient client;
	private Boolean initCalled = false;

	@Value("${connectionPool.maxTotal:50}")
	int maxConnections;

	@Value("${connectionPool.maxPerRoute:10}")
	int maxConnectionsRt;
	
	private final ProxyConfigRetriever proxyConfigRetriever;

	@Autowired
	public PoolingHttpClient(ProxyConfigRetriever proxyConfigRetriever) {
		this.proxyConfigRetriever = proxyConfigRetriever;
	}

	@PostConstruct
	void init(){
		
		ConnectionSocketFactory plainsf = PlainConnectionSocketFactory.getSocketFactory();

		SSLContext sc = null;
		try {
			sc = SSLContexts.custom()
			        .useTLS()
			        .setSecureRandom(new java.security.SecureRandom())
			        .build();
		} catch (KeyManagementException | NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		assert sc != null;
		SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(sc);
		Registry<ConnectionSocketFactory> r = RegistryBuilder.<ConnectionSocketFactory>create()
		        .register("http", plainsf)
		        .register("https", sslsf)
		        .build();
		
		connectionManager = new PoolingHttpClientConnectionManager(r);
		// Increase max total connection
		connectionManager.setMaxTotal(maxConnections);
		// Increase default max connection per route 
		connectionManager.setDefaultMaxPerRoute(maxConnectionsRt);

        client = HttpClients.custom()
				.setConnectionManager(connectionManager)
                .setDefaultCredentialsProvider(getCredentialsProvider())
                .build();
        
		
		initCalled = true;

	}
	
	private CredentialsProvider getCredentialsProvider(){
        CredentialsProvider credsProvider = new BasicCredentialsProvider();

        List<ProxyConfig> proxyList = proxyConfigRetriever.getConfig();
        //get info from properties
        for (ProxyConfig config: proxyList){
        	List<ServerMapping> serverList = config.getServerMapping();
        	for (ServerMapping server: serverList){
        		InternalServerMapping intServer = (InternalServerMapping) server;
        		String username = intServer.getUsername();
        		String password = intServer.getPassword();
				try {
					URL url = new URL(intServer.getInternalUrl());
	        		String domain = url.getHost();
	        		int port = url.getPort();
	        		if (port == -1){
	        			String protocol = url.getProtocol();
	        			if (protocol.equalsIgnoreCase("http")){
	        				port = 80;
	        			} else if (protocol.equalsIgnoreCase("https")){
	        				port = 443;
	        			}
	        		}
	        		logger.info("credential info");
	        		//logger.info(username);
	        		//logger.info(password);
	        		//logger.info(domain);
	        		//logger.info(Integer.toString(port));
	        		
	        		credsProvider.setCredentials(
	        				new AuthScope(domain, port),
	        				new UsernamePasswordCredentials(username, password));
				} catch (MalformedURLException e) {
					logger.error(e.getLocalizedMessage());
				}
        		

        	}
        }
        
        return credsProvider;
	}
	
	@Override
	public CloseableHttpClient getCloseableHttpClient() {
		if (!initCalled){
			init();
		}
		return client;
	}
	
	  @PreDestroy
		public void cleanUp() throws Exception {
			if (initCalled){
				  connectionManager.shutdown();
			}
		 }

}
