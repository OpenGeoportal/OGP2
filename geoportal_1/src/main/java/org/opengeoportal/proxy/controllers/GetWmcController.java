package org.opengeoportal.proxy.controllers;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletResponse;


import org.opengeoportal.ogc.WmcCreator;
import org.opengeoportal.ogc.OwsInfo.OwsType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/wmc")
public class GetWmcController {

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private WmcCreator wmcCreator;
	
	@RequestMapping(method=RequestMethod.GET, produces="application/xml")
	public void getLayerInfo(@RequestParam("OGPIDS") Set<String> layerIds, HttpServletResponse response) throws Exception {
		Map<String,OwsType> layerMap = new LinkedHashMap<String,OwsType>();
		for (String layer: layerIds){
			String[] formatArr = layer.split("=");
			if (formatArr.length > 1){
				try {
				layerMap.put(formatArr[0], OwsType.parseOwsType(formatArr[1]));
				} catch (Exception e){
					logger.error(e.getMessage());
					layerMap.put(formatArr[0], OwsType.DISPLAY);
				}
			} else {
				//default to DISPLAY (WMS)
				layerMap.put(formatArr[0], OwsType.DISPLAY);
			} 
		}
		response.setContentType("application/xml");
		wmcCreator.getWmcResponse(layerMap, response.getOutputStream());
		
	}
	
}