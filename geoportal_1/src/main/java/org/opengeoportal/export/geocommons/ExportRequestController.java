package org.opengeoportal.export.geocommons;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.IOUtils;
import org.opengeoportal.export.geocommons.GeoCommonsExportRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Controller
@RequestMapping("/geocommons/requestExport")
public class ExportRequestController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private GeoCommonsExportHandlerFactory geoCommonsExportHandlerFactory;
	

	@RequestMapping(method=RequestMethod.POST, produces="application/json")
	public @ResponseBody Map<String,String> handleExportRequest(HttpServletRequest request)
			throws Exception {
		//given a list of ogpids, export them to geocommons
		//read the POST'ed JSON object
		ServletInputStream inputStream = null;

		try{
			inputStream = request.getInputStream();

			ObjectMapper mapper = new ObjectMapper();

			JsonNode rootNode = mapper.readTree(inputStream);
			String basemap = rootNode.path("basemap").textValue();
			String bbox = rootNode.path("extent").textValue();
			String username = rootNode.path("username").textValue();
			String password = rootNode.path("password").textValue();

			ObjectNode responseJson = mapper.createObjectNode();
			//response json format
			//{"status": "", "message": "", mapUrl: "", "layers": []}
			//status  where in the process 
			//statusMessage text
			//mapUrl:
			//layers
			//layerId:
			//progress: dataset, map
			//format: shp, wms, etc.
			//url:

			/*if ((username.isEmpty())||(password.isEmpty())){
			response.sendError(500, "This request requires a valid GeoCommons username and password.");
			return;
		}*/
			String title = rootNode.path("title").textValue();
			String description = rootNode.path("description").textValue();
			JsonNode idArray = rootNode.path("OGPIDS");
			ArrayList<String> layers = new ArrayList<String>();
			for (JsonNode idNode : idArray){
				layers.add(idNode.textValue());
			}

			/*if (layers.isEmpty()) {
			//response.sendError(400, "No layers specified in request.");
			ArrayNode arrayNode = mapper.createArrayNode();
			responseJson.put("status", "");
			responseJson.put("statusMessage", "No layers specified in request");
			response.getOutputStream().print(responseJson.asText());
			return;
		}*/

			String sessionId = RequestContextHolder.currentRequestAttributes().getSessionId();
			GeoCommonsExportRequest exportRequest = new GeoCommonsExportRequest();
			exportRequest.setSessionId(sessionId);
			exportRequest.setUsername(username);
			exportRequest.setPassword(password);
			exportRequest.setBasemap(basemap);
			exportRequest.setTitle(title);
			exportRequest.setDescription(description);
			exportRequest.setBbox(bbox);
			exportRequest.setLayerIds(layers); 

			GeoCommonsExportHandler gcHandler = geoCommonsExportHandlerFactory.getObject();
			UUID requestId = gcHandler.requestExport(exportRequest);
			Map<String,String> map = new HashMap<String,String>();
			map.put("requestId", requestId.toString());
			return map;

		} finally {
			IOUtils.closeQuietly(inputStream);
		}
	}
}
