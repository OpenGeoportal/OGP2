package org.OpenGeoPortal.Download;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.Controllers.RequestStatusController.StatusSummary;
import org.OpenGeoPortal.Download.Types.LayerRequest;
import org.OpenGeoPortal.Download.Types.LayerRequest.Status;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DownloadRequest {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	private UUID requestId;
	private String sessionId;
	private File downloadPackage;
	private List<MethodLevelDownloadRequest> requestList = new ArrayList<MethodLevelDownloadRequest>();
	private Boolean downloadPackageSet = false;
	private Boolean emailSent = false;
	
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
		this.downloadPackageSet = true;
	}
	
	public List<MethodLevelDownloadRequest> getRequestList() {
		return requestList;
	}
	
	public void setRequestList(List<MethodLevelDownloadRequest> layerRequests){
		requestList = layerRequests;
	}
	
	private Boolean isPostProcessingComplete(){
		if (downloadPackageSet){
			if (this.downloadPackage.exists()){
				return true;
			} else {
				return false;
			}
		} else if (emailSent){
			return true;
		}
		return false;
	}
	
	public Boolean isReadyForPackaging(){
		StatusSummary completionStatus = getRawStatusSummary();
		if (completionStatus.equals(StatusSummary.COMPLETE_SUCCEEDED) || completionStatus.equals(StatusSummary.COMPLETE_PARTIAL)){
			if (!isPostProcessingComplete()){
				return true;
			}
		} 
		return false;
	}
	
	private StatusSummary getRawStatusSummary(){
		//Processing or Complete for the request
		logger.debug("Getting raw status summary");
		StatusSummary completionStatus = null;
		int successCount = 0;
		int failureCount = 0;
		List<LayerRequest> layerList = new ArrayList<LayerRequest>();
		for (MethodLevelDownloadRequest request: requestList){
			layerList.addAll(request.getRequestList());
		}
		for (LayerRequest request: layerList){
			logger.debug("status: " + request.getStatus().toString());
			if (request.getStatus().equals(Status.PROCESSING)){
				return StatusSummary.PROCESSING;
			} else if (request.getStatus().equals(Status.SUCCESS)) {
				successCount++;
			} else if (request.getStatus().equals(Status.FAILED)){
				failureCount++;
			}
		}
		if (layerList.size() == 0){
			completionStatus = StatusSummary.COMPLETE_FAILED;
		} else if (failureCount == 0){
			completionStatus = StatusSummary.COMPLETE_SUCCEEDED;
		} else if (successCount == 0){
			completionStatus = StatusSummary.COMPLETE_FAILED;
		} else {
			completionStatus = StatusSummary.COMPLETE_PARTIAL;
		}
		return completionStatus;
	}
	
	public StatusSummary getStatusSummary() {
		logger.debug("getting status summary");
		StatusSummary completionStatus = StatusSummary.COMPLETE_FAILED;
		try {
			completionStatus = getRawStatusSummary();
		} catch (Exception e){
			e.printStackTrace();
		}
			
		if (completionStatus.equals(StatusSummary.COMPLETE_SUCCEEDED) || completionStatus.equals(StatusSummary.COMPLETE_PARTIAL)){
			if (!isPostProcessingComplete()){
				return StatusSummary.PROCESSING;
			}
		}
		return completionStatus;
	}
	
	public Boolean getEmailSent() {
		return emailSent;
	}
	public void setEmailSent(Boolean emailSent) {
		this.emailSent = emailSent;
	}
}
