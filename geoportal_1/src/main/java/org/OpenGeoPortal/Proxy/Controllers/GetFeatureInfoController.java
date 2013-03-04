package org.OpenGeoPortal.Proxy.Controllers;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.Http.HttpRequester;
import org.apache.commons.compress.utils.IOUtils;
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
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired @Qualifier("httpRequester.generic")
	private HttpRequester httpRequester;
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;

	@RequestMapping(method=RequestMethod.GET)
	public void getFeatureInfo(@RequestParam("OGPID") String layerId, @RequestParam("bbox") String bbox, 
			@RequestParam("x") String xCoord,@RequestParam("y") String yCoord,
			@RequestParam("width") String width,@RequestParam("height") String height,
			HttpServletRequest request, HttpServletResponse response) throws Exception {

	    String format = "application/vnd.ogc.gml";

	    Set<String> layerIds = new HashSet<String>();
	    layerIds.add(layerId);
	    SolrRecord layerInfo = null;
	    try {
			layerInfo = this.layerInfoRetriever.fetchAllLayerInfo(layerIds).get(0);
		} catch (Exception e) {
			e.printStackTrace();
			//response.sendError(500);
		}
	    String previewUrl = null;
	    try {
	    	//is there a proxy?
			previewUrl = this.layerInfoRetriever.getWMSUrl(layerInfo);
		} catch (Exception e) {
			e.printStackTrace();
			//response.sendError(500);
		}
	    
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
	    String query = "service=wms&version=1.1.1&request=GetFeatureInfo&info_format=" + format 
				+ "&SRS=EPSG:900913&feature_count=" + NUMBER_OF_FEATURES + "&styles=&height=" + height + "&width=" + width +"&bbox=" + bbox 
				+ "&x=" + xCoord + "&y=" + yCoord +"&query_layers=" + layerName + "&layers=" + layerName;
	    
	    /*String query = "service=wfs&version=1.1.0&request=GetFeature&typeName=" + layerName + "&maxFeatures=" + NUMBER_OF_FEATURES 
	    		+ "&srsName=EPSG:900913&bbox=" + bbox;*/
	    if (previewUrl.contains("?")){
	    	previewUrl = previewUrl.substring(0, previewUrl.indexOf("?"));
	    }
		logger.info("executing WMS getFeatureRequest: " + previewUrl + "?" + query);
		if (!previewUrl.contains("http")){
			
			request.getRequestDispatcher(previewUrl + "?" + query).forward(request, response);
			
		} else {
			InputStream input = httpRequester.sendRequest(previewUrl, query, "GET");
			logger.debug(httpRequester.getContentType());
			response.setContentType(httpRequester.getContentType());
			IOUtils.copy(input, response.getOutputStream());
		}
	}
	
	public LayerInfoRetriever getLayerInfoRetriever() {
		return layerInfoRetriever;
	}
	
	public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
		this.layerInfoRetriever = layerInfoRetriever;
	}
}
