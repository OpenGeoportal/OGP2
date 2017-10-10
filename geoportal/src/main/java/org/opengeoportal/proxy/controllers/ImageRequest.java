package org.opengeoportal.proxy.controllers;

import java.io.File;
import java.net.URL;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Future;

import org.opengeoportal.download.controllers.RequestStatusController.StatusSummary;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.solr.SolrRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown=true)
public class ImageRequest {
	@JsonIgnore
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@JsonIgnore
	private UUID requestId;
	@JsonIgnore
	private String sessionId;
	@JsonProperty("srs")
	String srs;
	@JsonProperty("bbox")
	String bbox;
	@JsonIgnore
	BoundingBox bounds;
	@JsonProperty("format")
	String format;
	@JsonProperty("height")
	int height;
	@JsonProperty("width")
	int width;
	@JsonProperty("layers")
	List<LayerImage> layerImage; 
	@JsonIgnore
	File downloadFile;
	@JsonIgnore
	Boolean downloadFileSet = false;

	public enum ImageStatus {
		PROCESSING,
		FAILED,
		SUCCESS
	}
	
	public File getDownloadFile() {
		return downloadFile;
	}

	public void setDownloadFile(File downloadFile) {
		this.downloadFile = downloadFile;
		this.downloadFileSet = true;
	}

	public String getBbox() {
		return bbox;
	}

	public void setBbox(String bbox) {
		this.bbox = bbox;
	}
	
	public String getSrs() {
		return srs;
	}

	public void setSrs(String srs) {
		this.srs = srs;
	}

	public BoundingBox getBounds() {
		return bounds;
	}

	public void setBounds(BoundingBox bounds) {
		this.bounds = bounds;
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
	}

	public int getHeight() {
		return height;
	}

	public void setHeight(int height) {
		this.height = height;
	}

	public int getWidth() {
		return width;
	}

	public void setWidth(int width) {
		this.width = width;
	}

	public void setLayers(List<LayerImage> layers){
		this.layerImage = layers;
	}
	

	public List<LayerImage> getLayers(){
		return this.layerImage;
	}
	
	public Set<String> getLayerIds(){
		Set<String> layerIds = new HashSet<String>();
		for (LayerImage layerImage: this.layerImage){
			layerIds.add(layerImage.getLayerId());
		}
		return layerIds;
	}
	
	public UUID getRequestId() {
		return requestId;
	}

	public void setRequestId(UUID requestId) {
		this.requestId = requestId;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public static class LayerImage implements Comparable<LayerImage> {
		@JsonIgnore
		String name;
		@JsonProperty("opacity")
		int opacity;
		@JsonProperty("zIndex")
		int zIndex;
		@JsonProperty("layerId")
		String layerId;
		String sld;
		@JsonIgnore
		SolrRecord solrRecord;
		@JsonIgnore
		File imageFile;
		@JsonIgnore
		Future<File> imageFileFuture;
		@JsonIgnore
		ImageStatus imageStatus = ImageStatus.PROCESSING;
		private URL url;

		public String getName() {
			return name;
		}
		public void setName(String name) {
			this.name = name;
		}
		
		public String getLayerId() {
			return layerId;
		}
		public void setLayerId(String layerId) {
			this.layerId = layerId;
		}
		public String getSld() {
			return sld;
		}
		public void setSld(String sld) {
			this.sld = sld;
		}
		public int getOpacity() {
			return opacity;
		}
		public void setOpacity(int opacity) {
			this.opacity = opacity;
		}
		public int getzIndex() {
			return zIndex;
		}
		public void setzIndex(int zIndex) {
			this.zIndex = zIndex;
		}

		public SolrRecord getSolrRecord() {
			return solrRecord;
		}
		public void setSolrRecord(SolrRecord solrRecord) {
			this.solrRecord = solrRecord;
		}
		
		public File getImageFile() {
			return imageFile;
		}

		public void setImageFile(File imageFile) {
			this.imageFile = imageFile;
		}
		
		public Future<File> getImageFileFuture() {
			return imageFileFuture;
		}

		public void setImageFileFuture(Future<File> imageFileFuture) {
			this.imageFileFuture = imageFileFuture;
		}
		
		public ImageStatus getImageStatus() {
			return imageStatus;
		}

		public void setImageStatus(ImageStatus imageStatus) {
			this.imageStatus = imageStatus;
		}
		
		@Override
		@JsonIgnore
		public int compareTo(LayerImage n) {
	        return (zIndex < n.zIndex ? -1 :
	               (zIndex == n.zIndex ? 0 : 1));
		}
		
		@JsonIgnore
	    public boolean equals(Object o) {
	        if (!(o instanceof LayerImage))
	            return false;
	        LayerImage n = (LayerImage) o;
	        return n.layerId.equals(layerId);
	    }
		public void setUrl(URL url) {
			this.url = url;
		}
		public URL getUrl(){
			return url;
		}
	}
	
	private StatusSummary getRawStatusSummary(){
		//Processing or Complete for the request
		StatusSummary completionStatus = null;
		int successCount = 0;
		int failureCount = 0;
		
		List<LayerImage> layerList = getLayers();
		for (LayerImage request: layerList){
			logger.info(request.getImageStatus().toString());
			if (request.getImageStatus().equals(ImageStatus.PROCESSING)){
				return StatusSummary.PROCESSING;
			} else if (request.getImageStatus().equals(ImageStatus.SUCCESS)) {
				successCount++;
			} else if (request.getImageStatus().equals(ImageStatus.FAILED)){
				failureCount++;
			}
		}
		if (failureCount == 0){
			if (!downloadFileSet){
				completionStatus = StatusSummary.PROCESSING;
			} else if (getDownloadFile().exists()){
				completionStatus = StatusSummary.COMPLETE_SUCCEEDED;
			} else {
				completionStatus = StatusSummary.PROCESSING;
			}
		} else if (successCount == 0){
			completionStatus = StatusSummary.COMPLETE_FAILED;
		} else {
			if (!downloadFileSet){
				completionStatus = StatusSummary.PROCESSING;
			} else if (getDownloadFile().exists()){
				completionStatus = StatusSummary.COMPLETE_PARTIAL;
			} else {
				completionStatus = StatusSummary.PROCESSING;
			}
		}
		return completionStatus;
	}
	
	public StatusSummary getStatusSummary() {
		return getRawStatusSummary();
	}
}
