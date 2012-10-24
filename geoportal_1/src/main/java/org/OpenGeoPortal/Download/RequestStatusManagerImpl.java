package org.OpenGeoPortal.Download;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Proxy.Controllers.ImageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RequestStatusManagerImpl implements RequestStatusManager {
	List<DownloadRequest> globalDownloadRequestRegistry = new ArrayList<DownloadRequest>();
	List<ImageRequest> globalImageRequestRegistry = new ArrayList<ImageRequest>();

	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public synchronized DownloadRequest getDownloadRequest(UUID requestId){
		for (DownloadRequest status: globalDownloadRequestRegistry){
			if (status.getRequestId().equals(requestId)){
				return status;
			}
		}
		logger.info("No status found for download request");
		return null;
	}

	private synchronized List<DownloadRequest> getDownloadRequestBySessionId(String sessionId){
		List<DownloadRequest> sessionStatus = new ArrayList<DownloadRequest>();
		for (DownloadRequest status: globalDownloadRequestRegistry){
			if (status.getSessionId().equals(sessionId)){
				sessionStatus.add(status);
			}
		}
		return sessionStatus;
	}
	
	private synchronized List<ImageRequest> getImageRequestBySessionId(String sessionId){
		List<ImageRequest> sessionStatus = new ArrayList<ImageRequest>();
		for (ImageRequest status: globalImageRequestRegistry){
			if (status.getSessionId().equals(sessionId)){
				sessionStatus.add(status);
			}
		}
		return sessionStatus;
	}
	
	@Override
	public synchronized void removeRequestsBySessionId(String sessionId){
		removeImageRequestsBySessionId(sessionId);
		removeDownloadRequestsBySessionId(sessionId);
	}
	
	private synchronized void removeImageRequestsBySessionId(String sessionId){
		List<ImageRequest> sessionStatus = getImageRequestBySessionId(sessionId);
		if (!sessionStatus.isEmpty()){
			globalImageRequestRegistry.removeAll(sessionStatus);
		} else {
			logger.debug("No download status objects found for this session: " + sessionId);
		}	
	}
	
	private synchronized void removeDownloadRequestsBySessionId(String sessionId){
		List<DownloadRequest> sessionStatus = getDownloadRequestBySessionId(sessionId);
		if (!sessionStatus.isEmpty()){
			globalDownloadRequestRegistry.removeAll(sessionStatus);
		} else {
			logger.debug("No download status objects found for this session: " + sessionId);
		}	
	}
	
	@Override
	public synchronized void addDownloadRequest(UUID requestId, String sessionId, List<MethodLevelDownloadRequest> layerRequests){
		logger.info("Adding download request status object...");
		DownloadRequest requestStatus = new DownloadRequest();
		requestStatus.setRequestId(requestId);
		requestStatus.setSessionId(sessionId);
		requestStatus.setRequestList(layerRequests);
		globalDownloadRequestRegistry.add(requestStatus);
	}

	@Override
	public synchronized void addImageRequest(UUID requestId, String sessionId,
			ImageRequest imageRequest) {
		logger.info("Adding image request status object...");
		imageRequest.setRequestId(requestId);
		imageRequest.setSessionId(sessionId);
		globalImageRequestRegistry.add(imageRequest);
		
	}

	@Override
	public synchronized ImageRequest getImageRequest(UUID requestId) {
		for (ImageRequest status: globalImageRequestRegistry){
			if (status.getRequestId().equals(requestId)){
				return status;
			}
		}
		logger.info("No status found for image request.");
		return null;
	}

}
