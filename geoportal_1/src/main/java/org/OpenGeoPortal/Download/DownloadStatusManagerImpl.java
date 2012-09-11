package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DownloadStatusManagerImpl implements DownloadStatusManager {
	List<DownloadRequestStatus> globalDownloadRequestStatus = new ArrayList<DownloadRequestStatus>();
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public synchronized DownloadRequestStatus getDownloadRequestStatus(UUID requestId){
		for (DownloadRequestStatus status: globalDownloadRequestStatus){
			if (status.getRequestId().equals(requestId)){
				return status;
			}
		}
		return null;
	}

	private synchronized List<DownloadRequestStatus> getStatusBySessionId(String sessionId){
		List<DownloadRequestStatus> sessionStatus = new ArrayList<DownloadRequestStatus>();
		for (DownloadRequestStatus status: globalDownloadRequestStatus){
			if (status.getSessionId().equals(sessionId)){
				sessionStatus.add(status);
			}
		}
		return sessionStatus;
	}
	
	@Override
	public synchronized void removeStatusBySessionId(String sessionId){
		List<DownloadRequestStatus> sessionStatus = getStatusBySessionId(sessionId);
		if (!sessionStatus.isEmpty()){
			globalDownloadRequestStatus.removeAll(sessionStatus);
		} else {
			logger.debug("No download status objects found for this session: " + sessionId);
		}
		
	}
	
	@Override
	public synchronized void addDownloadRequestStatus(UUID requestId, String sessionId, List<LayerRequest> layerRequests){
		DownloadRequestStatus requestStatus = new DownloadRequestStatus();
		requestStatus.setRequestId(requestId);
		requestStatus.setSessionId(sessionId);
		requestStatus.setRequestList(layerRequests);
		globalDownloadRequestStatus.add(requestStatus);
	}
	
	public class DownloadRequestStatus {
		private UUID requestId;
		private String sessionId;
		private File downloadPackage;
		private List<LayerRequest> requestList = new ArrayList<LayerRequest>();
		
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
		
		public File getDownloadPackage() {
			return downloadPackage;
		}
		public void setDownloadPackage(File downloadPackage) {
			this.downloadPackage = downloadPackage;
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
}
