package org.OpenGeoPortal.Download.Methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
import java.util.concurrent.Future;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Solr.SolrRecord;
import org.OpenGeoPortal.Utilities.DirectoryRetriever;
import org.OpenGeoPortal.Utilities.HttpRequester;
import org.OpenGeoPortal.Utilities.OgpFileUtils;
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
	protected UUID requestId;
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	
	public HttpRequester getHttpRequester() {
		return httpRequester;
	}

	public void setHttpRequester(HttpRequester httpRequester) {
		this.httpRequester = httpRequester;
	}

	@Async
	public Future<File> download(UUID requestId, LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		this.requestId = requestId;
		currentLayer.setMetadata(this.includesMetadata());
		InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(), createDownloadRequest(), "POST");
		File directory = getDirectory();
		String contentType = httpRequester.getContentType();
		File outputFile = OgpFileUtils.createNewFileFromDownload(currentLayer.getLayerInfo().getName(), contentType, directory);
		OutputStream outputStream = new FileOutputStream(outputFile);
		InputStream bufferedIn = new BufferedInputStream(inputStream);
		try {
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
		}

		return new AsyncResult<File>(outputFile);
	}
	
	protected abstract Boolean includesMetadata();

	private File getDirectory() throws IOException{
		File downloadDirectory = this.directoryRetriever.getDownloadDirectory();
		File newDir = File.createTempFile("OGP", "", downloadDirectory);
		newDir.delete();
		Boolean success= newDir.mkdir();
		newDir.setReadable(true);
		newDir.setWritable(true);
		return newDir;
	}
	
	public abstract String createDownloadRequest() throws Exception;
	
	public abstract String getUrl();
	
	public BoundingBox getClipBounds(){
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		return bounds;
	}
}
