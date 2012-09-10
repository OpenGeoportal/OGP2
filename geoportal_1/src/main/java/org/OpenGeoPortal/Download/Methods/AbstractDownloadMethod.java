package org.OpenGeoPortal.Download.Methods;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;


public abstract class AbstractDownloadMethod {
	protected LayerRequest currentLayer;
	protected HttpRequester httpRequester;
	protected DirectoryRetriever directoryRetriever;
	protected UUID requestId;
	
	@Async
	public Future<File> download(UUID requestId, LayerRequest currentLayer) throws Exception {
		this.currentLayer = currentLayer;
		this.requestId = requestId;
		InputStream inputStream = this.httpRequester.sendRequest(this.getUrl(), createDownloadRequest(), "POST");
		File directory = directoryRetriever.getDirectory("download");
		String contentType = httpRequester.getContentType();
		File outputFile = OgpFileUtils.createNewFileFromDownload(currentLayer.getLayerInfo().getName(), contentType, directory);
		OutputStream outputStream = new FileOutputStream(outputFile);
		InputStream bufferedIn = new BufferedInputStream(inputStream);
		try {
			int currentBytes;
			while ((currentBytes = bufferedIn.read()) != -1) {
				//System.out.println("Receiving " + currentBytes + " bytes");
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
	
	public abstract String createDownloadRequest() throws Exception;
	
	public abstract String getUrl();
	
	public BoundingBox getClipBounds(){
		SolrRecord layerInfo = this.currentLayer.getLayerInfo();
		BoundingBox nativeBounds = new BoundingBox(layerInfo.getMinX(), layerInfo.getMinY(), layerInfo.getMaxX(), layerInfo.getMaxY());
		BoundingBox bounds = nativeBounds.getIntersection(this.currentLayer.getRequestedBounds());
		return bounds;
	}
}
