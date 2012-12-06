package org.OpenGeoPortal.Download.Methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.DirectoryRetriever;
import org.OpenGeoPortal.Utilities.OgpFileUtils;
import org.OpenGeoPortal.Utilities.Http.HttpRequester;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
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
	
	@Async
	public Future<File> download(LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		currentLayer.setMetadata(this.includesMetadata());
		InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(), createDownloadRequest(), getMethod());
		File directory = getDirectory();
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
		File outputFile = OgpFileUtils.createNewFileFromDownload(currentLayer.getLayerInfo().getName(), contentType, directory);
		//OutputStream outputStream = new FileOutputStream(outputFile);
		//FileUtils with a BufferedInputStream seems to be the fastest method with a small sample size.  requires more testing
		InputStream bufferedIn = new BufferedInputStream(inputStream);
		FileUtils.copyInputStreamToFile(bufferedIn, outputFile);
		/*try {
			int currentBytes;
			while ((currentBytes = bufferedIn.read()) != -1) {
				outputStream.write(currentBytes);
			} 
		} finally {
			try {
				bufferedIn.close();
			} finally {
				outputStream.close();
			}
		}*/

		return new AsyncResult<File>(outputFile);
	}
	
	protected abstract Boolean includesMetadata();

	private File getDirectory() throws IOException{
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
	
	public abstract String getUrl();
	
	public abstract String getMethod();
	
	public BoundingBox getClipBounds(){
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		return bounds;
	}
}
