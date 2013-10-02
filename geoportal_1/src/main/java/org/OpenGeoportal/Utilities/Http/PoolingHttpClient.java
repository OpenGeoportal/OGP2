package org.OpenGeoportal.Utilities.Http;

import org.apache.http.client.HttpClient;
import org.apache.http.conn.scheme.PlainSocketFactory;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.client.cache.CachingHttpClient;
import org.apache.http.impl.conn.PoolingClientConnectionManager;
import org.apache.http.params.CoreConnectionPNames;
import org.apache.http.params.CoreProtocolPNames;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PoolingHttpClient implements OgpHttpClient {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private PoolingClientConnectionManager connectionManager;
	private HttpClient client;
	
	PoolingHttpClient(){
		SchemeRegistry schemeRegistry = new SchemeRegistry();
		schemeRegistry.register(
		         new Scheme("http", 80, PlainSocketFactory.getSocketFactory()));
		schemeRegistry.register(
		         new Scheme("https", 443, SSLSocketFactory.getSocketFactory()));
		connectionManager = new PoolingClientConnectionManager(schemeRegistry);
		/*
		 * 
		 * 

CoreConnectionPNames.TCP_NODELAY='http.tcp.nodelay':  determines whether Nagle's algorithm is to be used. Nagle's algorithm tries to conserve bandwidth by minimizing the number of segments that are sent. When applications wish to decrease network latency and increase performance, they can disable Nagle's algorithm (that is enable TCP_NODELAY. Data will be sent earlier, at the cost of an increase in bandwidth consumption. This parameter expects a value of type java.lang.Boolean. If this parameter is not set, TCP_NODELAY will be enabled (no delay).

CoreConnectionPNames.SOCKET_BUFFER_SIZE='http.socket.buffer-size':  determines the size of the internal socket buffer used to buffer data while receiving / transmitting HTTP messages. This parameter expects a value of type java.lang.Integer. If this parameter is not set, HttpClient will allocate 8192 byte socket buffers.


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
		client =  new CachingHttpClient(new DefaultHttpClient(connectionManager));
		client.getParams().setParameter(CoreProtocolPNames.HTTP_CONTENT_CHARSET, "UTF-8");
		client.getParams().setParameter(CoreConnectionPNames.SOCKET_BUFFER_SIZE, 16384);
	}
	
	@Override
	public HttpClient getHttpClient() {
		return client;
	}

}
