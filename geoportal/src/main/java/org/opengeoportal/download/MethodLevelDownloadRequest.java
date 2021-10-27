package org.opengeoportal.download;

import java.util.ArrayList;
import java.util.List;

import org.opengeoportal.download.types.LayerRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MethodLevelDownloadRequest {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private String downloadKey;
	private LayerDownloader layerDownloader;
	private List<LayerRequest> requestList = new ArrayList<LayerRequest>();	

	MethodLevelDownloadRequest(String downloadKey, LayerDownloader layerDownloader){
		this.downloadKey = downloadKey;
		this.layerDownloader = layerDownloader;
		setRequestList(new ArrayList<LayerRequest>());
	}
	
	public List<LayerRequest> getRequestList() {
		return requestList;
	}
	
	public void setRequestList(List<LayerRequest> layerRequests){
		requestList = layerRequests;
	}
	public void addLayerRequest(LayerRequest layerRequest) {
		this.requestList.add(layerRequest);
	}

	public LayerDownloader getLayerDownloader() {
		return layerDownloader;
	}

	public void setLayerDownloader(LayerDownloader layerDownloader) {
		this.layerDownloader = layerDownloader;
	}

	public String getDownloadKey() {
		return downloadKey;
	}

	public void setDownloadKey(String downloadKey) {
		this.downloadKey = downloadKey;
	}

}
