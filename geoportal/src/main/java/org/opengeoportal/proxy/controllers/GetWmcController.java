package org.opengeoportal.proxy.controllers;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletResponse;

import org.opengeoportal.layer.BoundingBox;
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
	public void getLayerInfo(@RequestParam("ogpids") Set<String> layerIds, @RequestParam("type") String ogcType, @RequestParam("minx") Double minx, @RequestParam("miny") Double miny,
			@RequestParam("maxx") Double maxx, @RequestParam("maxy") Double maxy, HttpServletResponse response) throws Exception {
		
		OwsType requestedType = OwsType.parseOwsType(ogcType);
		BoundingBox bounds = new BoundingBox(minx,miny,maxx,maxy);
		Map<String,OwsType> layerMap = new LinkedHashMap<String,OwsType>();
		for (String layer: layerIds){					
				layerMap.put(layer, requestedType);
		}
		
		
		String disposition = "attachment";
		String contentType = "application/xml;charset=UTF-8";
			
		response.setHeader("Content-Disposition", disposition + "; filename=\"wmc.xml\"");
		response.setContentType(contentType);
		wmcCreator.getWmcResponse(layerMap, bounds, response.getOutputStream());
		
	}
	
}