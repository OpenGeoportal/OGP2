package org.OpenGeoPortal.Download;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.OpenGeoPortal.Metadata.LayerInfoRetriever;
import org.OpenGeoPortal.Utilities.OgpFileUtils;
import org.springframework.web.HttpRequestHandler;

public class GetMetadataServlet implements HttpRequestHandler {
	private MetadataRetriever metadataRetriever;
	private LayerInfoRetriever layerInfoRetriever;
	
	public MetadataRetriever getMetadataRetriever() {
		return metadataRetriever;
	}

	public void setMetadataRetriever(MetadataRetriever metadataRetriever) {
		this.metadataRetriever = metadataRetriever;
	}
	
	public LayerInfoRetriever getLayerInfoRetriever() {
		return layerInfoRetriever;
	}

	public void setLayerInfoRetriever(LayerInfoRetriever layerInfoRetriever) {
		this.layerInfoRetriever = layerInfoRetriever;
	}

	@Override
	public void handleRequest(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// do data validation here
		/**
		 * This servlet should receive a POST request with an object containing
		 * all the info needed for each layer to be downloaded. The servlet
		 * calls a class that handles all of the download logic. Additionally,
		 * it checks the session variable "username" to see if the user has
		 * authenticated. A boolean is passed to the download code. If one has
		 * been provided, an email address is passed to the download code to
		 * accomodate systems that email a link to the user for their layers
		 * 
		 * @author Chris Barnett
		 */
		String layerId = request.getParameter("id");
		String download = request.getParameter("download");

		String disposition;
		if ((download == null) || (download.equals(false))) {
			disposition = "inline";
		} else {
			disposition = "attachment";
		}
		
		String metadataString = null;
		try {
			metadataString = this.metadataRetriever.getXMLStringFromId(layerId, "fgdc");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		response.setContentLength(metadataString.getBytes("UTF-8").length);
		String fileName = null;
		try {
			fileName = layerInfoRetriever.getAllLayerInfo(layerId).getName();
		} catch (Exception e) {
			e.printStackTrace();
			fileName = layerId;
		}
		response.setHeader("Content-Disposition", disposition + "; filename=\""
				+ OgpFileUtils.filterName(fileName) + ".xml" + "\"");
		response.setContentType("application/xml");
		// return a link to the zip file, or info to create link
		response.getWriter().write(metadataString);
	}
}
