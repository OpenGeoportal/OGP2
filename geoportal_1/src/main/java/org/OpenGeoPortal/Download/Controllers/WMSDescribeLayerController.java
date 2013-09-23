package org.OpenGeoPortal.Download.Controllers;

import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.ParseJSONSolrLocationField;
import org.OpenGeoPortal.Download.Methods.WmsDescribeLayer;
import org.OpenGeoPortal.Download.Types.Generated.Ogc.WMSDescribeLayer.WMSDescribeLayerResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/describeLayer")
public class WMSDescribeLayerController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private LayerInfoRetriever layerInfoRetriever;
	@Autowired
	private WmsDescribeLayer wmsDescribeLayer;
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody WMSDescribeLayerResponse wmsDescribeLayerProxy(@RequestParam("layerId") String layerId) throws Exception {
		 /**
		 * This controller should receive a GET request with the layerId and a boolean "inline" that tells whether the data should 
		 * appear inline or as an attachment
		 *
		 * @author Chris Barnett
		 */
		SolrRecord layerInfo = layerInfoRetriever.getAllLayerInfo(layerId);
		String workspaceName = layerInfo.getWorkspaceName().trim();
		String name = layerInfo.getName().trim();
		if (!name.contains(":")){
			//double-check that the namespace is not already included
			if (!workspaceName.isEmpty()){
				//there is a workspace name, so the name is qualified
				name = workspaceName + ":" + name;
			}
		}
		String location = layerInfo.getLocation();
		String baseUrl = ParseJSONSolrLocationField.getWmsUrl(location);
		WMSDescribeLayerResponse response = new WMSDescribeLayerResponse();
		try {
			response = wmsDescribeLayer.describeLayer(baseUrl, name);
			//logger.info("version:" + response.getVersion());
		
		} catch (Exception e){
			logger.error(e.getMessage());
		}
		
		return response;
	}
	

}
