package org.opengeoportal.proxy.controllers;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.solr.SearchConfigRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/featureInfo")
public class GetFeatureInfoController {
	private static final int NUMBER_OF_FEATURES = 1;
	//private static final int BUFFER_MULTIPLIER = 5;

	//unfortunately, not every source supports gml response
	private static final String RESPONSE_FORMAT = "text/html";
	private static final String EXCEPTION_FORMAT = "application/vnd.ogc.se_xml";
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired @Qualifier("httpRequester.generic")
	private HttpRequester httpRequester;
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;
	
	@RequestMapping(method=RequestMethod.GET)
	public void getFeatureInfo(@RequestParam("OGPID") String layerId, @RequestParam("bbox") String bbox, 
			@RequestParam("x") String xCoord,@RequestParam("y") String yCoord,
			@RequestParam("width") String width,@RequestParam("height") String height,
			HttpServletRequest request, HttpServletResponse response) throws Exception {


	    
	    Set<String> layerIds = new HashSet<String>();
	    layerIds.add(layerId);
	    SolrRecord layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(layerIds).get(0);
	    
	    //remove any query string
	    String previewUrl = searchConfigRetriever.getWmsUrl(layerInfo);
	    
	    /*
	     * http://www.example.com/wfs?
   service=wfs&
   version=1.1.0&
   request=GetFeature&
   typeName=layerName&
   maxFeatures=NUMBER_OF_FEATURES&srsName=EPSG:900913
   bbox=a1,b1,a2,b2
   bbox should be determined by the client.  the size of a pixel?
	     */
	    
	    String workspaceName = layerInfo.getWorkspaceName();
	    if (!workspaceName.trim().isEmpty()){
	    	workspaceName = workspaceName + ":";
	    }
	    String layerName = workspaceName + layerInfo.getName();
	    
	    //in caps to support ogc services through arcgis server 9.x
	    String query = "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&INFO_FORMAT=" + RESPONSE_FORMAT  
				+ "&SRS=EPSG:900913&FEATURE_COUNT=" + NUMBER_OF_FEATURES + "&STYLES=&HEIGHT=" + height + "&WIDTH=" + width +"&BBOX=" + bbox 
				+ "&X=" + xCoord + "&Y=" + yCoord +"&QUERY_LAYERS=" + layerName + "&LAYERS=" + layerName + "&EXCEPTIONS=" + EXCEPTION_FORMAT;
	   
	    String method = "GET";

	    if (previewUrl.contains("?")){
	    	previewUrl = previewUrl.substring(0, previewUrl.indexOf("?"));
	    }
		logger.info("executing WMS getFeatureRequest: " + previewUrl + "?" + query);

		
		if (!previewUrl.contains("http")){
			//this is a relative path
			request.getRequestDispatcher(previewUrl + "?" + query).forward(request, response);

		} else {
			InputStream input = null;
			try{
				input = httpRequester.sendRequest(previewUrl, query, method);
				logger.debug(httpRequester.getContentType());
				response.setContentType(httpRequester.getContentType());
				IOUtils.copy(input, response.getOutputStream());
			} finally {
				IOUtils.closeQuietly(input);
			}
		}
	
	}
}
