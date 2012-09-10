package org.OpenGeoPortal.Proxy.Controllers;

import java.util.HashSet;
import java.util.Set;

import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/getFeatureInfo")
public class GetFeatureInfoController {
	private static final int NUMBER_OF_FEATURES = 1;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;

	@RequestMapping(method=RequestMethod.GET)
	public @ResponseBody String getFeatureInfo(@RequestParam("OGPID") String layerId, 
			@RequestParam("x") String xCoord, @RequestParam("y") String yCoord, 
			@RequestParam("bbox") String bbox, @RequestParam("height") String height,
			@RequestParam("width") String width, Model model) throws Exception {

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
	    String layerName = layerInfo.getWorkspaceName() + ":" + layerInfo.getName();
	    String remoteUrl = previewUrl + "?service=wms&version=1.1.1&request=GetFeatureInfo&info_format=" + format 
				+ "&SRS=EPSG:900913&feature_count=" + NUMBER_OF_FEATURES + "&styles=&height=" + height + "&width=" + width +"&bbox=" + bbox 
				+ "&x=" + xCoord + "&y=" + yCoord +"&query_layers=" + layerName + "&layers=" + layerName;
		logger.debug("executing WMS getFeatureRequest: " + remoteUrl);

		return "redirect:" + remoteUrl;
	}
	
	public LayerInfoRetriever getLayerInfoRetriever() {
		return layerInfoRetriever;
	}
	
	public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
		this.layerInfoRetriever = layerInfoRetriever;
	}
}
