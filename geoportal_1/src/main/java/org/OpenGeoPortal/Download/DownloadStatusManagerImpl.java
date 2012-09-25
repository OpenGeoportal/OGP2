package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DownloadStatusManagerImpl implements DownloadStatusManager {
	List<DownloadRequest> globalDownloadRequestRegistry = new ArrayList<DownloadRequest>();
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public synchronized DownloadRequest getDownloadRequest(UUID requestId){
		for (DownloadRequest status: globalDownloadRequestRegistry){
			if (status.getRequestId().equals(requestId)){
				logger.debug("Status found");
				logger.info(status.getRequestList().get(0).getLayerNameNS());
				return status;
			}
		}
		logger.debug("No status found");
		return null;
	}

	private synchronized List<DownloadRequest> getRequestBySessionId(String sessionId){
		List<DownloadRequest> sessionStatus = new ArrayList<DownloadRequest>();
		for (DownloadRequest status: globalDownloadRequestRegistry){
			if (status.getSessionId().equals(sessionId)){
				sessionStatus.add(status);
			}
		}
		return sessionStatus;
	}
	
	@Override
	public synchronized void removeRequestBySessionId(String sessionId){
		List<DownloadRequest> sessionStatus = getRequestBySessionId(sessionId);
		if (!sessionStatus.isEmpty()){
			globalDownloadRequestRegistry.removeAll(sessionStatus);
		} else {
			logger.debug("No download status objects found for this session: " + sessionId);
		}
		
	}
	
	@Override
	public synchronized void addDownloadRequest(UUID requestId, String sessionId, List<LayerRequest> layerRequests){
		logger.info("adding request status object");
		DownloadRequest requestStatus = new DownloadRequest();
		requestStatus.setRequestId(requestId);
		requestStatus.setSessionId(sessionId);
		requestStatus.setRequestList(layerRequests);
		globalDownloadRequestRegistry.add(requestStatus);
	}
	
	public class DownloadRequest {
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
			logger.info("Download package: " + downloadPackage.getAbsolutePath());
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
