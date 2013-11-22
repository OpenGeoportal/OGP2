package org.opengeoportal.utilities.http;

import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;

import javax.annotation.PreDestroy;
import javax.net.ssl.SSLContext;

import org.apache.http.client.HttpClient;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContexts;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PoolingHttpClient implements OgpHttpClient {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private PoolingHttpClientConnectionManager connectionManager;
	private CloseableHttpClient client;
	private Boolean initCalled = false;
	int maxConnections;
	int maxConnectionsRt;
	
	public int getMaxConnections() {
		return maxConnections;
	}

	public void setMaxConnections(int maxConnections) {
		this.maxConnections = maxConnections;
	}

	public int getMaxConnectionsRt() {
		return maxConnectionsRt;
	}

	public void setMaxConnectionsRt(int maxConnectionsRt) {
		this.maxConnectionsRt = maxConnectionsRt;
	}

	private void init(){
		
		ConnectionSocketFactory plainsf = PlainConnectionSocketFactory.getSocketFactory();

		SSLContext sc = null;
		try {
			sc = SSLContexts.custom()
			        .useTLS()
			        .setSecureRandom(new java.security.SecureRandom())
			        .build();
		} catch (KeyManagementException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
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

		
		/*
		 * 
		 * 
		 * 
		 * MultiThreadedHttpConnectionManager connectionManager =  new MultiThreadedHttpConnectionManager();
HttpConnectionManagerParams params = connectionManager.getParams();

params.setConnectionTimeout(connectiontimeout); //set connection timeout (how long it takes to connect to remote host)
params.setSoTimeout(sotimeout); //set socket timeout (how long it takes to retrieve data from remote host)

HttpMethodBase baseMethod = null;

try {
  HttpClient httpClient = new HttpClient(connectionManager);
  httpClient.getParams().setParameter("http.connection-manager.timeout", poolTimeout); //set timeout on how long we’ll wait for a connection from the pool

  baseMethod = new GetMethod(…);
  int statusCode = httpClient.executeMethod(…);

  …
}
catch (ConnectTimeoutException cte ){
  //Took too long to connect to remote host
}
catch (SocketTimeoutException ste){
  //Remote host didn’t respond in time
}
catch (Exception se){
  //Some other error occurred
}
finally {
  if (baseMethod != null)
    baseMethod.releaseConnection();
}

CoreConnectionPNames.TCP_NODELAY='http.tcp.nodelay':  determines whether Nagle's algorithm is to be used. Nagle's algorithm tries to conserve bandwidth by minimizing the number of segments that are sent. When applications wish to decrease network latency and increase performance, they can disable Nagle's algorithm (that is enable TCP_NODELAY. Data will be sent earlier, at the cost of an increase in bandwidth consumption. This parameter expects a value of type java.lang.Boolean. If this parameter is not set, TCP_NODELAY will be enabled (no delay).

CoreConnectionPNames.SOCKET_BUFFER_SIZE='http.socket.buffer-size':  determines the size of the internal socket buffer used to buffer data while receiving / transmitting HTTP messages. This parameter expects a value of type java.lang.Integer. If this parameter is not set, HttpClient will allocate 8192 byte socket buffers.

HttpClientContext context = HttpClientContext.create();
HttpClientConnectionManager connMrg = new BasicHttpClientConnectionManager();

HttpRoute route = new HttpRoute(new HttpHost("localhost", 80));
// Request new connection. This can be a long process
ConnectionRequest connRequest = connMrg.requestConnection(route, null);
// Wait for connection up to 10 sec
HttpClientConnection conn = connRequest.get(10, TimeUnit.SECONDS);
try {
    // If not open
    if (!conn.isOpen()) {
        // establish connection based on its route info
        connMrg.connect(conn, route, 1000, context);
        // and mark it as route complete
        connMrg.routeComplete(conn, route, context);
    }
    // Do useful things with the connection.
} finally {
    connMrg.releaseConnection(conn, null, 1, TimeUnit.MINUTES);
}

package org.apache.http.examples.client;

import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.util.EntityUtils;

/**
 * An example of HttpClient can be customized to authenticate
 * preemptively using BASIC scheme.
 * <b/>
 * Generally, preemptive authentication can be considered less
 * secure than a response to an authentication challenge
 * and therefore discouraged.
 */

		// Increase max total connection to 200
		//cm.setMaxTotal(200);
		// Increase default max connection per route to 20
		//cm.setDefaultMaxPerRoute(20);
		// Increase max connections for localhost:80 to 50
		//HttpHost localhost = new HttpHost("locahost", 80);
		//cm.setMaxPerRoute(new HttpRoute(localhost), 50);
		client = HttpClients.custom()
				.setConnectionManager(connectionManager)
				.build();
		
		initCalled = true;
		//client.getParams().setParameter(CoreProtocolPNames.HTTP_CONTENT_CHARSET, "UTF-8");
		//client.getParams().setParameter(CoreConnectionPNames.SOCKET_BUFFER_SIZE, 16384);
		//client.getParams().setParameter("http.connection-manager.timeout", 10);
	}
	
	@Override
	public HttpClient getHttpClient() {
		if (!initCalled){
			init();
		}
		return client;
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
