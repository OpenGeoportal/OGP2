package org.opengeoportal.featureinfo;

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
 * 				var params = {
						ogpid: layerId,
						coord: latLon.lon + "," + latLon.lat,
						bbox: mapExtent.toBBOX(),
						srs: "EPSG:3857",
						pixel: Math.round(pixel.x) + "," + Math.round(pixel.y),
						size: mapObject.size.w + "," + mapObject.size.h,
				};
 */
@Controller
@RequestMapping("/featureInfo")
public class GetFeatureInfoController {

	@Autowired
	private FeatureInfoFactory featureInfoFactory;

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@RequestMapping(method = RequestMethod.GET)
	@ResponseBody
	public ModelMap getFeatureInfo(@RequestParam("ogpid") String layerId,
			@RequestParam("coord") Double[] coord, 
			@RequestParam("bbox") Double[] bbox,
			@RequestParam("srs") String srs,
			@RequestParam("pixel") Integer[] pixel,
			@RequestParam("size") Integer[] size) throws Exception {

		FeatureInfo gfi = featureInfoFactory.getObject(layerId);
		int maxFeatures = 50;

		return gfi.getFeatureInformation(coord, bbox, srs, pixel,
				size, maxFeatures);

	}

}
