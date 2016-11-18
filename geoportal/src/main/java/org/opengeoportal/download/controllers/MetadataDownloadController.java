package org.opengeoportal.download.controllers;

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

	 /**
	 * This controller should receive a GET request with the layerId and a boolean "inline" that tells whether the data should 
	 * appear inline or as an attachment
	 *
	 * @author Chris Barnett
	 */
	@RequestMapping(value="/{format}", method=RequestMethod.GET)
	public @ResponseBody void processMetadataDownload(@PathVariable String format, @RequestParam("download") Boolean download, @RequestParam("id") String id, HttpServletResponse response) throws Exception {
		handleMetadataRequest(id, download, format, response);
	}
	
	
	@RequestMapping(method=RequestMethod.GET)
	public @ResponseBody void processMetadataDownload(@RequestParam("id") String id, HttpServletResponse response) throws Exception {
		handleMetadataRequest(id, false, "html", response);
	}
	
	private void handleMetadataRequest(String id, Boolean download, String format, HttpServletResponse response) throws Exception{


		String metadataString = getMetadataString(id, format);

		response.setContentLength(metadataString.getBytes("UTF-8").length);

        String disposition = getContentDisposition(download);
        if (disposition.equalsIgnoreCase("attachment")) {
            logger.info("Metadata downloaded for layer [" + id + "]");

        } else {
            logger.info("Metadata viewed for layer [" + id + "]");

        }
        response.setHeader("Content-Disposition", disposition + "; filename=\""
                + getFileName(id) + "." + format.toLowerCase().trim() + "\"");
		response.setContentType(getContentType(format));
		// return a link to the zip file, or info to create link
		response.getWriter().write(metadataString);
	}
	
	private String getMetadataString(String layerId, String format) throws Exception{
		String metadataString = "";
		if (format.equalsIgnoreCase("xml")){
			metadataString = this.metadataRetriever.getXMLStringFromId(layerId, "fgdc");

		} else if (format.equalsIgnoreCase("html")){
			metadataString = this.metadataRetriever.getMetadataAsHtml(layerId);
		} else {
			throw new Exception("Unrecognized format: " + format);
		}
		
		return metadataString;
	}
	
	private String getContentDisposition(Boolean attachment){
		String disposition;

		if (attachment){
			disposition = "attachment";
		} else {
			disposition = "inline";
		}
		
		return disposition;
	}
	
	private String getFileName(String id){
		String fileName = null;
		try {
			fileName = layerInfoRetriever.getAllLayerInfo(id).getName();
		} catch (Exception e) {
			e.printStackTrace();
			fileName = id;
		}
		
		return OgpFileUtils.filterName(fileName);
	}
	
	private String getContentType(String format) throws Exception{
		String mimeType;
		if (format.equalsIgnoreCase("html")){
			mimeType = "application/html;charset=UTF-8";
		} else if (format.equalsIgnoreCase("xml")){
			mimeType = "application/xml;charset=UTF-8";
			
		} else {
			throw new Exception("Unrecognized mime-type.");
		}
		return mimeType;
	}
}
