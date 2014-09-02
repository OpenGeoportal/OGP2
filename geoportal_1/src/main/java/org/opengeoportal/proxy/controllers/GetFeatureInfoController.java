package org.opengeoportal.proxy.controllers;

import org.opengeoportal.ogc.wms.WmsGetFeatureInfo;
import org.opengeoportal.ogc.wms.WmsGetFeatureInfoFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author cbarne02
 * 
 *         Controller retrieves and returns feature attributes of the form:
 * 
 *         <pre>
 *         {layerId: xxx, title: xxx, features: [{xxx: xxx} ...],
 *            attrDictionary: [{xxx: xxx} ...] }
 * </pre>
 */
@Controller
@RequestMapping("/featureInfo")
public class GetFeatureInfoController {

	@Autowired
	private WmsGetFeatureInfoFactory wmsGetFeatureInfoFactory;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(method = RequestMethod.GET)
	@ResponseBody
	public ModelMap getFeatureInfo(@RequestParam("ogpid") String layerId,
			@RequestParam("bbox") String bbox,
			@RequestParam("x") String xCoord, @RequestParam("y") String yCoord,
			@RequestParam("width") String width,
			@RequestParam("height") String height) throws Exception {

		WmsGetFeatureInfo gfi = wmsGetFeatureInfoFactory.getObject();
		int maxFeatures = 20;
		return gfi.getFeatureInformation(layerId, xCoord, yCoord, bbox, height,
				width, maxFeatures);

	}

}
