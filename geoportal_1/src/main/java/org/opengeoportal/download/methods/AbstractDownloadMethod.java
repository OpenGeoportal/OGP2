package org.opengeoportal.download.methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.OgpFileUtils;
import org.opengeoportal.utilities.http.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;

public abstract class AbstractDownloadMethod {
	protected LayerRequest currentLayer;
	protected HttpRequester httpRequester;
	@Autowired
	protected DirectoryRetriever directoryRetriever;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	
	public HttpRequester getHttpRequester() {
		return httpRequester;
	}

	public void setHttpRequester(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}

	public abstract Set<String> getExpectedContentType();
	
	public Boolean expectedContentTypeMatched(String foundContentType){
		if (getExpectedContentType().contains(foundContentType)){
			return true;
		} else {
			return false;
		}
	}
	
	public Boolean hasMultiple(){
		//default is false;  if a download method might return more than one file, return true (mulitple urls for zip file download, for example)
		return false;
	}
	
	@Async
	public Future<Set<File>> download(LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		currentLayer.setMetadata(this.includesMetadata());
		String requestString = "";
		try {
			requestString = createDownloadRequest();
		} catch (Exception e){
			e.printStackTrace();
			logger.error("problem creating download request");
			throw new Exception("Problem creating download request");
		}

		File directory = getDirectory();
		Set<File> fileSet = new HashSet<File>();
		List<String> urls = this.getUrls(currentLayer);
		for (String url: urls){
			InputStream inputStream = null;
			
			try{
				inputStream = this.httpRequester.sendRequest(url, requestString, getMethod());	
				int status = httpRequester.getStatus();
				if (status != 200){
					throw new Exception("Request Failed! Server responded with: " + Integer.toString(status));
				}
				String contentType = httpRequester.getContentType().toLowerCase();
				Boolean contentMatch = expectedContentTypeMatched(contentType);
				if (!contentMatch){
					logger.error("Unexpected content type: " + contentType);
					//If their is a mismatch with the expected content, but the response is text, we want to at least log the response
					if (contentType.toLowerCase().contains("text")||contentType.toLowerCase().contains("html")||contentType.toLowerCase().contains("xml")){
						logger.error("Returned text: " + IOUtils.toString(inputStream));
					} 
					
					throw new Exception("Unexpected content type");

				}
				//Content-Disposition	attachment;filename="middle_east_dams.xls"
				String fileName = null;

				String contentDisp = ""; 
				try{		
					contentDisp = httpRequester.getHeaderValue("Content-Disposition");
				} catch (Exception e){
					//ignore
				}
				if (contentDisp.toLowerCase().contains("filename")){
					contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("filename="));
					contentDisp = contentDisp.substring(contentDisp.toLowerCase().indexOf("=") + 1);
					fileName = contentDisp.replaceAll("\"", "");
				} else {
					fileName = currentLayer.getLayerInfo().getName();
				}


				File outputFile = OgpFileUtils.createNewFileFromDownload(fileName, contentType, directory);
				//FileUtils with a BufferedInputStream seems to be the fastest method with a small sample size.  requires more testing
				BufferedInputStream bufferedIn = null;
				try {
					bufferedIn = new BufferedInputStream(inputStream);
					FileUtils.copyInputStreamToFile(bufferedIn, outputFile);
					fileSet.add(outputFile);
				} finally {
					IOUtils.closeQuietly(bufferedIn);
				}
			} finally {
				IOUtils.closeQuietly(inputStream);
				
			}
		}
		return new AsyncResult<Set<File>>(fileSet);
	}
	
	protected abstract Boolean includesMetadata();

	protected List<String> urlToUrls(String url){
		List<String> urls = new ArrayList<String>();
		urls.add(url);
		return urls;
	}
	
	protected String getUrl(LayerRequest layer) throws Exception{
		return this.getUrls(layer).get(0);
	}


	protected File getDirectory() throws IOException{
		File downloadDirectory = this.directoryRetriever.getDownloadDirectory();
		File newDir = File.createTempFile("OGP", "", downloadDirectory);
		newDir.delete();
		//Boolean success= 
		newDir.mkdir();
		newDir.setReadable(true);
		newDir.setWritable(true);
		return newDir;
	}
	
	public abstract String createDownloadRequest() throws Exception;
	
	
	public String checkUrl(String url) throws MalformedURLException{
		try{
			new URL(url);
		} catch (MalformedURLException e){
			logger.error("URL is malformed: '" + url + "'");
			throw new MalformedURLException();
		}
	
		return url;
	}
	
	public abstract String getMethod();
	
	public BoundingBox getClipBounds() throws Exception{
		SolrRecord layerInfo = this.currentLayer.getLayerInfo(); 
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		return bounds;
	}
	
	
	public Boolean hasRequiredInfo(LayerRequest layerRequest){
		try {
			if (getUrls(layerRequest) != null && !getUrls(layerRequest).isEmpty()){
				return true;
			}

		} catch (Exception e){
			logger.debug(e.getMessage());	
		}
		logger.debug("Layer does not have required info for DownloadMethod");
		return false;
	}

	public abstract List<String> getUrls(LayerRequest layer) throws Exception;
}
