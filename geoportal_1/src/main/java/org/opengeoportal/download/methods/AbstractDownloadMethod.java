package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Future;

import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;

public abstract class AbstractDownloadMethod {
	protected LayerRequest currentLayer;
	
	@Autowired
	protected DirectoryRetriever directoryRetriever;
	final Logger logger = LoggerFactory.getLogger(this.getClass());


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
	
	public abstract File getFileFromUrl(String link, String query) throws Exception;
			
	
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

		Set<File> fileSet = new HashSet<File>();
		List<String> urls = this.getUrls(currentLayer);
		for (String link: urls){
			File outputFile = this.getFileFromUrl(link, requestString);			
			fileSet.add(outputFile);

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
	
	
	public abstract String checkUrl(String url) throws MalformedURLException;
	
	
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
