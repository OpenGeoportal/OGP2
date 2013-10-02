package org.OpenGeoportal.Download;

import java.util.ArrayList;
import java.util.List;

import org.OpenGeoportal.Download.Types.LayerRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MethodLevelDownloadRequest {
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	private List<LayerRequest> requestList = new ArrayList<LayerRequest>();	

	MethodLevelDownloadRequest(List<LayerRequest> request){
		setRequestList(request);
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

}
