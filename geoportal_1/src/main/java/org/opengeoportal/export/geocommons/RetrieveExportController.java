package org.opengeoportal.export.geocommons;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.ServletException;

import org.opengeoportal.download.RequestStatusManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/geocommons/getExport")
public class RetrieveExportController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private RequestStatusManager requestStatusManager;
	

	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody Map<String,String> retrieveExport(@RequestParam("requestId") String requestId)
			throws ServletException {
		GeoCommonsExportRequest exportRequest = requestStatusManager.getExportRequest(UUID.fromString(requestId));
		String location = exportRequest.getLocation();
		if (location.length() >0){
		Map<String,String> map = new HashMap<String,String>();
		map.put("requestId", requestId.toString());
		map.put("location", location);
		return map;
		} else {
			throw new ServletException("Invalid location value.");
		}
	}
}
