package org.opengeoportal.download;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.apache.commons.io.FileUtils;
import org.opengeoportal.http.HttpRequester;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.service.SearchService;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpFileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;


/**
 * A convenience class to download a zipped shapefile via WFS (endpoint must support outputFormat=shape-zip)
 * 
 * @author cbarne02
 *
 */
@Component
@Scope("prototype")
public class QuickWfsDownload implements QuickDownload {
	/*http://geoserver01.uit.tufts.edu:80/wfs?request=GetFeature&version=1.1.0&typeName=topp:states&BBOX=-75.102613,40.212597,-72.361859,41.512517,EPSG:4326
	*/
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	final DirectoryRetriever directoryRetriever;
	final SearchService searchService;
	final HttpRequester httpRequester;

	@Autowired
	public QuickWfsDownload(DirectoryRetriever directoryRetriever, SearchService searchService, HttpRequester httpRequester) {
		this.directoryRetriever = directoryRetriever;
		this.searchService = searchService;
		this.httpRequester = httpRequester;
	}

	/**
	 * Method retreives a zipped Shapefile via WFS and places it in the "download" directory
	 * 
	 * @param layerId	a String containing the OGP layer id for the desired layer
	 * @param bounds	a BoundingBox with the desired selection bounds for the layer in EPSG:4326
	 * @return a zip File containing the shape file
	 * @throws Exception if the remote server does not response with status code 200 or returns an XML response (assumed to be an error)
	 */
	@Override
	public File downloadZipFile(String layerId, BoundingBox bounds) throws Exception{

		OGPRecord layerInfo = searchService.findRecordById(layerId);
		
		//requests too near the poles are problematic
		BoundingBox requestBounds = null;
		Double requestMinY = bounds.getMinY();
		if (requestMinY < -85.0){
			 requestMinY = -85.0;
		}
		Double requestMaxY = bounds.getMaxY();
		if (requestMaxY > 85.0){
			 requestMaxY = 85.0;
		}
		requestBounds = new BoundingBox(bounds.getMinX(), requestMinY, bounds.getMaxX(), requestMaxY);
		String workspace = layerInfo.getWorkspaceName();
		String layerName = layerInfo.getName();
		String requestString = "request=GetFeature&version=1.1.0&outputFormat=shape-zip";
		requestString += "&typeName=" + workspace + ":" + layerName;
		requestString += "&srsName=EPSG:4326";
		requestString += "&BBOX=" + requestBounds.toString() + ",EPSG:4326";
		File outputFile = null;
    
    	String wfsLocation = LocationFieldUtils.getWfsUrl(layerInfo.getLocation());
		String url = wfsLocation + "?" + requestString;

		try (InputStream inputStream = httpRequester.sendRequest(url, "", "GET", "*/*")){
			logger.info("Response code: " + Integer.toString(httpRequester.getStatus()));
			if (httpRequester.getStatus() != 200){
				throw new Exception("Attempt to download " + layerName + " failed.");
			}
			
			String contentType = httpRequester.getContentType();
			logger.info("returned content type:" + contentType);
			if (contentType.toLowerCase().contains("xml")){
				String responseContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
				logger.error(responseContent);
				throw new Exception("Remote server reported an error");
			}
			File directory = directoryRetriever.getDirectory("download");
			outputFile = new File(directory, OgpFileUtils.filterName(layerName) + ".zip");
			
			try (BufferedInputStream bufferedIn = new BufferedInputStream(inputStream)) {
				FileUtils.copyInputStreamToFile(bufferedIn, outputFile);
			} catch (Exception e){
				logger.error(e.getMessage());
			}
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return outputFile;
}

}
