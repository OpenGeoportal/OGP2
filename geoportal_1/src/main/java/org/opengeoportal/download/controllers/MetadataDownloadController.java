package org.opengeoportal.download.controllers;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.metadata.LayerInfoRetriever;
import org.opengeoportal.utilities.OgpFileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/getMetadata")
public class MetadataDownloadController {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private MetadataRetriever metadataRetriever;
	@Autowired
	private LayerInfoRetriever layerInfoRetriever;

	@RequestMapping(value="/{download}", method=RequestMethod.GET)
	public @ResponseBody void processMetadataDownload(@PathVariable String download, @RequestParam("id") String id, HttpServletResponse response) throws Exception {
		Boolean downloadBool = false;
		if (download.equals("download")){
			downloadBool = true;
		}
		handleMetadataRequest(id, downloadBool, response);
	}
	
	
	@RequestMapping(method=RequestMethod.GET)
	public @ResponseBody void processMetadataDownload(@RequestParam("id") String id, HttpServletResponse response) throws Exception {
		 /**
		 * This controller should receive a GET request with the layerId and a boolean "inline" that tells whether the data should 
		 * appear inline or as an attachment
		 *
		 * @author Chris Barnett
		 */
		handleMetadataRequest(id, false, response);
	}
	
	private void handleMetadataRequest(String id, Boolean download, HttpServletResponse response) throws IOException{
		String disposition;
		String contentType;
		if (download){
			disposition = "attachment";
			contentType = "application/octet-stream";
		} else {
			disposition = "inline";
			contentType = "application/xml";
		}
		
		String metadataString = null;
		try {
			metadataString = this.metadataRetriever.getXMLStringFromId(id, "fgdc");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		response.setContentLength(metadataString.getBytes("UTF-8").length);
		String fileName = null;
		try {
			fileName = layerInfoRetriever.getAllLayerInfo(id).getName();
		} catch (Exception e) {
			e.printStackTrace();
			fileName = id;
		}
		response.setHeader("Content-Disposition", disposition + "; filename=\""
				+ OgpFileUtils.filterName(fileName) + ".xml" + "\"");
		response.setContentType(contentType);
		// return a link to the zip file, or info to create link
		response.getWriter().write(metadataString);
	}
}
