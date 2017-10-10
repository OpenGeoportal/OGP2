package org.opengeoportal.proxy.controllers;

/**
 * Adapted from David Smiley's HTTP reverse proxy/gateway servlet
 */
/**
* Copyright MITRE
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.http.*;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.AbortableHttpRequest;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.params.ClientPNames;
import org.apache.http.client.utils.URIUtils;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.tsccm.ThreadSafeClientConnManager;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.HeaderGroup;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpParams;
import org.apache.http.util.EntityUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.opengeoportal.metadata.*;
import org.opengeoportal.solr.*;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Node;


import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.BitSet;
import java.util.Enumeration;
import java.util.Formatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/*@Controller
@RequestMapping("/dynamic")*/
public class OldDynamicOgcController {
	  /* INIT PARAMETER NAME CONSTANTS */

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	  /* MISC */
	protected URI targetUri;
	protected HttpClient proxyClient;
	
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;

	private DocumentBuilderFactory factory;
	private TransformerFactory transformerFactory;


/**
* An HTTP reverse proxy/gateway servlet. It is designed to be extended for customization
* if desired. Most of the work is handled by
* <a href="http://hc.apache.org/httpcomponents-client-ga/">Apache HttpClient</a>.
* <p>
* There are alternatives to a servlet based proxy such as Apache mod_proxy if that is available to you. However
* this servlet is easily customizable by Java, secure-able by your web application's security (e.g. spring-security),
* portable across servlet engines, and is embeddable into another web application.
* </p>
* <p>
* Inspiration: http://httpd.apache.org/docs/2.0/mod/mod_proxy.html
* </p>
*
* @author David Smiley dsmiley@mitre.org>
*/


  OldDynamicOgcController() {
    HttpParams hcParams = new BasicHttpParams();
    hcParams.setBooleanParameter(ClientPNames.HANDLE_REDIRECTS, true);
    proxyClient = createHttpClient(hcParams);
    
	// Create a factory
	factory = DocumentBuilderFactory.newInstance();
	//ignore validation, dtd
	factory.setAttribute("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
	factory.setValidating(false);
	
	transformerFactory = TransformerFactory.newInstance();
  }

  /** Called from {@link #init(javax.servlet.ServletConfig)}. HttpClient offers many opportunities for customization.
* @param hcParams*/
  @SuppressWarnings("deprecation")
protected HttpClient createHttpClient(HttpParams hcParams) {
    return new DefaultHttpClient(new ThreadSafeClientConnManager(),hcParams);
  }

  public void destroy() {
    //shutdown() must be called according to documentation.
    if (proxyClient != null)
      proxyClient.getConnectionManager().shutdown();
  }

  private class UrlToNameContainer {
	  Set<String> qualifiedNames;
	  String wfsUrl;	  
  }
  
  @RequestMapping(value="/wfs", method=RequestMethod.GET, params="request=GetCapabilities")
	public ModelAndView doWfsGetCapabilitiesCase(@RequestParam("ogpids") Set<String> layerIds, HttpServletRequest servletRequest, HttpServletResponse servletResponse) throws Exception {
	  return doWfsGetCapabilities(layerIds, servletRequest, servletResponse);
  }
  
  @RequestMapping(value="/wfs", method=RequestMethod.GET, params="REQUEST=GetCapabilities")
	public ModelAndView doWfsGetCapabilities(@RequestParam("ogpids") Set<String> layerIds, HttpServletRequest servletRequest, HttpServletResponse servletResponse) throws Exception {
	  logger.info("wfs get capabilities requested");
	  List<SolrRecord> solrRecords = null;
		try {
			solrRecords = this.layerInfoRetriever.fetchAllLayerInfo(layerIds);
		} catch (Exception e) {
			e.printStackTrace();
			throw new ServletException("Unable to retrieve layer info.");
		}	
		//need to pass a model to the caps document

		
		//parse the returned XML
		// Use document builder factory
		DocumentBuilder builder = factory.newDocumentBuilder();
		
		Map<String,UrlToNameContainer> recordMap  = new HashMap<String,UrlToNameContainer>();
		for (SolrRecord solrRecord: solrRecords){
			//we have to get all of the wfs service points for the passed layerids.  match layerids to service points, so we only have to process each caps document once
			//in the future, we should cache these caps documents
			String workspaceName = solrRecord.getWorkspaceName();
			String layerName = solrRecord.getName();
			
			String qualifiedName = OgpUtils.getLayerNameNS(workspaceName, layerName);
			String wfsUrl = LocationFieldUtils.getWfsUrl(solrRecord.getLocation());
			
			URI currentURI = new URI(wfsUrl);
			//is it ok to call these equivalent?
			String currentURIString = currentURI.getScheme() + currentURI.getHost() + currentURI.getPath();
			if (recordMap.containsKey(currentURIString)){
				UrlToNameContainer urlMap = recordMap.get(currentURIString);
				logger.info(qualifiedName);
				urlMap.qualifiedNames.add(qualifiedName);
			} else {
				UrlToNameContainer urlMap = new UrlToNameContainer();
				urlMap.wfsUrl = wfsUrl;
				Set<String> qNamesSet = new HashSet<String>();
				qNamesSet.add(qualifiedName);
				logger.info(qualifiedName);
				urlMap.qualifiedNames = qNamesSet;
			
				recordMap.put(currentURIString,urlMap);
			}
		}
		
		String version = "1.0.0";
		String currentUrl = "";
		String wfsQueryBoilerPlate = "?version=" + version + "&service=wfs";
		String capabilitiesQuery = "&request=GetCapabilities";
		String featureTypeInfo = "";
		for (UrlToNameContainer container : recordMap.values()){
			//this should happen asynchronously
			currentUrl = container.wfsUrl;
			HttpResponse response = proxyClient.execute(new HttpGet(currentUrl + wfsQueryBoilerPlate + capabilitiesQuery));
			InputStream inputStream = response.getEntity().getContent();
			//Parse the document
			Document document = builder.parse(inputStream);
			inputStream.close();

			
			NodeList layerNodeList = document.getElementsByTagName("Name");
			if (layerNodeList.getLength() == 0){
				throw new Exception("Malformed GetCapabilities Document.");
			}
			/*
			 * <FeatureType><Name>sde:GISPORTAL.GISOWNER01.AFGHANISTANRIVERREGION97</Name><Title>GISPORTAL.GISOWNER01.AFGHANISTANRIVERREGION97</Title><Abstract/><Keywords>ArcSDE, GISPORTAL.GISOWNER01.AFGHANISTANRIVERREGION97</Keywords><SRS>EPSG:100004</SRS><LatLongBoundingBox minx="60.82625305019409" miny="29.95629731861914" maxx="74.6959181471344" maxy="38.59658289704833"/></FeatureType>
			 * 
			 */
			for (int j = 0; j < layerNodeList.getLength(); j++){
				Node currentLayerNode = layerNodeList.item(j);
				String layerName = currentLayerNode.getTextContent().toLowerCase();
				if (OgpUtils.getSetAsLowerCase(container.qualifiedNames).contains(layerName)){
					featureTypeInfo += xmlToString(currentLayerNode.getParentNode());
				}
				
			}
			
		}
		
		String onlineResource = "";
		String describeFeatureUrl = "";
		String getFeatureUrl = "";

		if (recordMap.values().size() == 1){
			//this is a special case...
			//if every layer is from a single server, pass that server value into the caps doc for describelayer and getfeature.  that way, clients that do the right thing will bypass this ogp service
			//otherwise, everything must be proxied
			onlineResource = currentUrl;
			describeFeatureUrl = currentUrl + wfsQueryBoilerPlate + "&request=DescribeFeatureType";
			getFeatureUrl = currentUrl + wfsQueryBoilerPlate + "&request=GetFeature";
		} else {
			//values for describelayer and getFeature should refer back to this controller
			String thisUrl = servletRequest.getRequestURL().toString() + "?";
			onlineResource = thisUrl + "ogpids=" + servletRequest.getParameter("ogpids");
			describeFeatureUrl = thisUrl + "request=DescribeFeatureType";
			getFeatureUrl = thisUrl + "request=GetFeature";
		}
	    ModelAndView mav = new ModelAndView("wfs_caps_1_0_0"); 
	    
	    mav.addObject("onlineResource", StringEscapeUtils.escapeXml(onlineResource));
	    mav.addObject("getCapabilities", StringEscapeUtils.escapeXml(servletRequest.getRequestURL().toString() + "?" + servletRequest.getQueryString()));
	    mav.addObject("describeFeatureUrl", StringEscapeUtils.escapeXml(describeFeatureUrl)); 
	    mav.addObject("getFeatureUrl",StringEscapeUtils.escapeXml(getFeatureUrl));
	    mav.addObject("featureTypeInfo", featureTypeInfo);
	    
		servletResponse.setHeader("Content-Disposition", "inline;filename=GetCapabilities.xml");
		return mav;
		
  }

  
@RequestMapping(value="/wfs", method=RequestMethod.GET)
	public void doWfsRequest(@RequestParam("ogpids") Set<String> layerIds, HttpServletRequest servletRequest, HttpServletResponse servletResponse) throws Exception {
	Enumeration paramNames = servletRequest.getParameterNames();
	String ogcRequest = "";
	String typeName = "";
	while (paramNames.hasMoreElements()){
		String param = (String) paramNames.nextElement();
		if (param.equalsIgnoreCase("version")){
			
		} else if (param.equalsIgnoreCase("request")){
			logger.info("request: " + servletRequest.getParameter(param));
			ogcRequest = servletRequest.getParameter(param);
		} else if (param.equalsIgnoreCase("typename")){
			typeName = servletRequest.getParameter(param);
		} 
	}
	
	if (ogcRequest.equalsIgnoreCase("describefeaturetype") || ogcRequest.equalsIgnoreCase("getfeature")){
		//TODO: strip all the params and rebuild the request with only sanctioned parameters, in case of fussy servers
		String remoteUrl = getOgcUrlFromLayerName(typeName, "wfs");
		String newQuery = removeParamFromQuery(servletRequest.getQueryString(), "ogpids");
		if (ogcRequest.equalsIgnoreCase("describefeaturetype")){
			newQuery = removeParamFromQuery(newQuery, "srsname");
		}
		remoteUrl += "?" + newQuery;
		logger.info("remote url:" + remoteUrl);
		doProxy(remoteUrl, servletRequest, servletResponse);
	} 
	

  }


private String xmlToString(Node node) throws TransformerException{
	StringWriter stw = new StringWriter();
	Transformer transformer = transformerFactory.newTransformer();
	transformer.setOutputProperty(OutputKeys.INDENT, "yes");
	transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
	transformer.transform(new DOMSource(node), new StreamResult(stw));
	return stw.toString();
}

public static String removeParamFromQuery(String query, String param){
	if (query.startsWith("?")){
		query = query.substring(1);
	}
	String[] arrQuery = query.split("&");
	String newQuery = "";
	for (int i = 0; i < arrQuery.length; i++){
		String currentParam = arrQuery[i].substring(0, arrQuery[i].indexOf("="));
		if (!currentParam.equalsIgnoreCase(param)){
			newQuery += arrQuery[i] + "&";
		}
	}
	newQuery = newQuery.substring(0, newQuery.length() - 1);
	return newQuery;
}

private String getOgcUrlFromLayerName(String layerName, String ogcProtocol) throws Exception{
	SolrQuery query = new SolrQuery();
		
	if (layerName.contains(":")){
		String[] arrName = layerName.split(":");
		layerName = arrName[1];
	}
	
	String queryText = "Name:" + layerName;
	
    query.setQuery(queryText);
	QueryResponse queryResponse = this.layerInfoRetriever.getSolrServer().query(query);
	List<SolrRecord> records = queryResponse.getBeans(SolrRecord.class);
	if (records.isEmpty()){
		throw new Exception("No matching record found in Solr Index for ['" + layerName + "']");
	}
	String location = records.get(0).getLocation();
	
	if (ogcProtocol.equalsIgnoreCase("wfs")){
		return LocationFieldUtils.getWfsUrl(location);
	
	} else if (ogcProtocol.equalsIgnoreCase("wms")){
		return LocationFieldUtils.getWmsUrl(location);

	} else if (ogcProtocol.equalsIgnoreCase("wcs")){
		return LocationFieldUtils.getWcsUrl(location);
	} else {
		throw new Exception("Unsupported OGC Protocol ['" + ogcProtocol + "']");
	}
	
}

@SuppressWarnings("deprecation")
  private void doProxy(String remoteUrl, HttpServletRequest servletRequest, HttpServletResponse servletResponse) throws ServletException, IOException {
	    // Make the Request
	    //note: we won't transfer the protocol version because I'm not sure it would truly be compatible
	try {
		this.targetUri = new URI(remoteUrl);
	} catch (URISyntaxException e1) {
		// TODO Auto-generated catch block
		e1.printStackTrace();
	}
	
	//Need to handle https, but think about "restricted" layers for now.  Some institutions don't really have good protection for restricted layers.  Does this open up potential for security
	//problems for those folks?
	if (servletRequest.getScheme().equals("https")){
		//actually, what matters the most is if the remote url is https
	}
	

	    BasicHttpEntityEnclosingRequest proxyRequest =
	        new BasicHttpEntityEnclosingRequest(servletRequest.getMethod(), rewriteUrlFromRequest(servletRequest));
	    
	    copyRequestHeaders(servletRequest, proxyRequest);

	    // Add the input entity (streamed) then execute the request.
	    HttpResponse proxyResponse = null;
	    InputStream servletRequestInputStream = servletRequest.getInputStream();
	    try {
	      try {
	        proxyRequest.setEntity(new InputStreamEntity(servletRequestInputStream, servletRequest.getContentLength()));

	        // Execute the request
	        logger.debug("proxy " + servletRequest.getMethod() + " uri: " + servletRequest.getRequestURI() + " -- " + proxyRequest.getRequestLine().getUri());

	        proxyResponse = proxyClient.execute(URIUtils.extractHost(targetUri), proxyRequest);
	      } finally {
	        closeQuietly(servletRequestInputStream);
	      }

	      // Process the response
	      int statusCode = proxyResponse.getStatusLine().getStatusCode();
	      logger.info("Status from remote server: " + Integer.toString(statusCode));
	      if (doResponseRedirectOrNotModifiedLogic(servletRequest, servletResponse, proxyResponse, statusCode)) {
	        EntityUtils.consume(proxyResponse.getEntity());
	        return;
	      }

	      // Pass the response code. This method with the "reason phrase" is deprecated but it's the only way to pass the
	      // reason along too.
	      //noinspection deprecation
	      servletResponse.setStatus(statusCode, proxyResponse.getStatusLine().getReasonPhrase());

	      copyResponseHeaders(proxyResponse, servletResponse);

	      // Send the content to the client
	      copyResponseEntity(proxyResponse, servletResponse);

	    } catch (Exception e) {
	      //abort request, according to best practice with HttpClient
	      if (proxyRequest instanceof AbortableHttpRequest) {
	        AbortableHttpRequest abortableHttpRequest = (AbortableHttpRequest) proxyRequest;
	        abortableHttpRequest.abort();
	      }
	      if (e instanceof RuntimeException)
	        throw (RuntimeException)e;
	      if (e instanceof ServletException)
	        throw (ServletException)e;
	      throw new RuntimeException(e);
	    }
  }
  private boolean doResponseRedirectOrNotModifiedLogic(HttpServletRequest servletRequest, HttpServletResponse servletResponse, HttpResponse proxyResponse, int statusCode) throws ServletException, IOException {
    // Check if the proxy response is a redirect
    // The following code is adapted from org.tigris.noodle.filters.CheckForRedirect
    if (statusCode >= HttpServletResponse.SC_MULTIPLE_CHOICES /* 300 */
        && statusCode < HttpServletResponse.SC_NOT_MODIFIED /* 304 */) {
      Header locationHeader = proxyResponse.getLastHeader(HttpHeaders.LOCATION);
      if (locationHeader == null) {
        throw new ServletException("Received status code: " + statusCode
            + " but no " + HttpHeaders.LOCATION + " header was found in the response");
      }
      // Modify the redirect to go to this proxy servlet rather that the proxied host
      String locStr = rewriteUrlFromResponse(servletRequest, locationHeader.getValue());

      servletResponse.sendRedirect(locStr);
      return true;
    }
    // 304 needs special handling. See:
    // http://www.ics.uci.edu/pub/ietf/http/rfc1945.html#Code304
    // We get a 304 whenever passed an 'If-Modified-Since'
    // header and the data on disk has not changed; server
    // responds w/ a 304 saying I'm not going to send the
    // body because the file has not changed.
    if (statusCode == HttpServletResponse.SC_NOT_MODIFIED) {
      servletResponse.setIntHeader(HttpHeaders.CONTENT_LENGTH, 0);
      servletResponse.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
      return true;
    }
    return false;
  }

  protected void closeQuietly(Closeable closeable) {
    try {
      closeable.close();
    } catch (IOException e) {
      logger.error(e.getMessage(),e);
    }
  }

  /** These are the "hop-by-hop" headers that should not be copied.
* http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html
* I use an HttpClient HeaderGroup class instead of Set<String> because this
* approach does case insensitive lookup faster.
*/
  private static final HeaderGroup hopByHopHeaders;
  static {
    hopByHopHeaders = new HeaderGroup();
    String[] headers = new String[] {
        "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization",
        "TE", "Trailers", "Transfer-Encoding", "Upgrade" };
    for (String header : headers) {
      hopByHopHeaders.addHeader(new BasicHeader(header, null));
    }
  }

  /** Copy request headers from the servlet client to the proxy request. */
  protected void copyRequestHeaders(HttpServletRequest servletRequest, HttpRequest proxyRequest) {
    // Get an Enumeration of all of the header names sent by the client
    Enumeration enumerationOfHeaderNames = servletRequest.getHeaderNames();
    while (enumerationOfHeaderNames.hasMoreElements()) {
      String headerName = (String) enumerationOfHeaderNames.nextElement();
      //TODO why?
     // if (headerName.equalsIgnoreCase(HttpHeaders.CONTENT_LENGTH))
       // continue;
      if (hopByHopHeaders.containsHeader(headerName))
         continue;
      // As per the Java Servlet API 2.5 documentation:
      // Some headers, such as Accept-Language can be sent by clients
      // as several headers each with a different value rather than
      // sending the header as a comma separated list.
      // Thus, we get an Enumeration of the header values sent by the client
      Enumeration headers = servletRequest.getHeaders(headerName);
      while (headers.hasMoreElements()) {
        String headerValue = (String) headers.nextElement();
        //Don't do this unless we need to
        /*if (headerName.equalsIgnoreCase(HttpHeaders.USER_AGENT)){
        	headerValue = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0";
        }*/
        // In case the proxy host is running multiple virtual servers,
        // rewrite the Host header to ensure that we get content from
        // the correct virtual server
        if (headerName.equalsIgnoreCase(HttpHeaders.HOST)) {
          HttpHost host = URIUtils.extractHost(this.targetUri);
          headerValue = host.getHostName();
          if (host.getPort() != -1)
            headerValue += ":"+host.getPort();
        }
        proxyRequest.addHeader(headerName, headerValue);
      }
    }
  }

  /** Copy proxied response headers back to the servlet client. */
  protected void copyResponseHeaders(HttpResponse proxyResponse, HttpServletResponse servletResponse) {
    for (Header header : proxyResponse.getAllHeaders()) {
      if (hopByHopHeaders.containsHeader(header.getName()))
        continue;
      servletResponse.addHeader(header.getName(), header.getValue());
    }
  }

  /** Copy response body data (the entity) from the proxy to the servlet client. */
  private void copyResponseEntity(HttpResponse proxyResponse, HttpServletResponse servletResponse) throws IOException {
    HttpEntity entity = proxyResponse.getEntity();
    if (entity != null) {
      OutputStream servletOutputStream = servletResponse.getOutputStream();
      try {
        entity.writeTo(servletOutputStream);
      } finally {
        closeQuietly(servletOutputStream);
      }
    }
  }
  
  private String rewriteUrlFromRequest(HttpServletRequest servletRequest) {
    StringBuilder uri = new StringBuilder(500);
    uri.append(this.targetUri.toString());

    // Handle the query string
   /* String queryString = servletRequest.getQueryString();//ex:(following '?'): name=value&foo=bar#fragment
    if (queryString != null && queryString.length() > 0) {
      uri.append('?');
      int fragIdx = queryString.indexOf('#');
      String queryNoFrag = (fragIdx < 0 ? queryString : queryString.substring(0,fragIdx));
      uri.append(encodeUriQuery(queryNoFrag));
      if (fragIdx >= 0) {
        uri.append('#');
        uri.append(encodeUriQuery(queryString.substring(fragIdx + 1)));
      }
    }*/
    //skip this for now
    
  //  http://giswebservices.massgis.state.ma.us/geoserver/wfs?service=wfs&version=1.0.0&request=getFeature&typename=massgis:MORIS.RFI_AIS_GT50_POLY
    //?ogpids=MassGIS.MORIS.RFI_AIS_GT50_POLY&service=wfs&version=1.0.0&request=getFeature&typename=massgis:MORIS.RFI_AIS_GT50_POLY
    logger.info("new url string: " + uri.toString());
    return uri.toString();
  }

  private String rewriteUrlFromResponse(HttpServletRequest servletRequest, String theUrl) {
    //TODO document example paths
    if (theUrl.startsWith(this.targetUri.toString())) {
      String curUrl = servletRequest.getRequestURL().toString();//no query
      String pathInfo = servletRequest.getPathInfo();
      if (pathInfo != null) {
        assert curUrl.endsWith(pathInfo);
        curUrl = curUrl.substring(0,curUrl.length()-pathInfo.length());//take pathInfo off
      }
      theUrl = curUrl+theUrl.substring(this.targetUri.toString().length());
    }
    return theUrl;
  }

  /**
* <p>Encodes characters in the query or fragment part of the URI.
*
* <p>Unfortunately, an incoming URI sometimes has characters disallowed by the spec. HttpClient
* insists that the outgoing proxied request has a valid URI because it uses Java's {@link URI}. To be more
* forgiving, we must escape the problematic characters. See the URI class for the spec.
*
* @param in example: name=value&foo=bar#fragment
*/
  static CharSequence encodeUriQuery(CharSequence in) {
    //Note that I can't simply use URI.java to encode because it will escape pre-existing escaped things.
    StringBuilder outBuf = null;
    Formatter formatter = null;
    for(int i = 0; i < in.length(); i++) {
      char c = in.charAt(i);
      boolean escape = true;
      if (c < 128) {
        if (asciiQueryChars.get((int)c)) {
          escape = false;
        }
      } else if (!Character.isISOControl(c) && !Character.isSpaceChar(c)) {//not-ascii
        escape = false;
      }
      if (!escape) {
        if (outBuf != null)
          outBuf.append(c);
      } else {
        //escape
        if (outBuf == null) {
          outBuf = new StringBuilder(in.length() + 5*3);
          outBuf.append(in,0,i);
          formatter = new Formatter(outBuf);
        }
        //leading %, 0 padded, width 2, capital hex
        formatter.format("%%%02X",(int)c);//TODO
        formatter.close();
      }
    }
    return outBuf != null ? outBuf : in;
  }


  static final BitSet asciiQueryChars;
  static {
    char[] c_unreserved = "_-!.~'()*".toCharArray();//plus alphanum
    char[] c_punct = ",;:$&+=".toCharArray();
    char[] c_reserved = "?/[]@".toCharArray();//plus punct

    asciiQueryChars = new BitSet(128);
    for(char c = 'a'; c <= 'z'; c++) asciiQueryChars.set((int)c);
    for(char c = 'A'; c <= 'Z'; c++) asciiQueryChars.set((int)c);
    for(char c = '0'; c <= '9'; c++) asciiQueryChars.set((int)c);
    for(char c : c_unreserved) asciiQueryChars.set((int)c);
    for(char c : c_punct) asciiQueryChars.set((int)c);
    for(char c : c_reserved) asciiQueryChars.set((int)c);

    asciiQueryChars.set((int)'%');//leave existing percent escapes in place
  }
  
}