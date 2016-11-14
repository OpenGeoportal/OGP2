package org.opengeoportal.download;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.opengeoportal.download.MethodLevelDownloadRequest;
import org.opengeoportal.download.controllers.RequestStatusController.StatusSummary;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.download.types.LayerRequest.Status;
import org.opengeoportal.layer.BoundingBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown=true)
public class DownloadRequest {
	@JsonIgnore
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@JsonProperty("bbox")
	private BoundingBox bounds;
	@JsonProperty("email")
	private String email;
	@JsonProperty("layers")
	private List<RequestedLayerFormat> requestedLayerFormat; 
	
	public BoundingBox getBounds() {
		return bounds;
	}

	public void setBounds(String bounds) {
		String[] arrBounds = bounds.split(",");
		this.bounds = new BoundingBox(arrBounds[0], arrBounds[1], arrBounds[2], arrBounds[3]);
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public List<RequestedLayerFormat> getRequestedLayerFormat() {
		return requestedLayerFormat;
	}
	public void setRequestedLayerFormat(
			List<RequestedLayerFormat> requestedLayerFormat) {
		this.requestedLayerFormat = requestedLayerFormat;
	}
	public static class RequestedLayerFormat {
		@JsonProperty("format")
		private String format;
		@JsonProperty("layerId")
		private String layerId;
		
		public String getFormat() {
			return format;
		}
		public void setFormat(String format) {
			this.format = format;
		}
		public String getLayerId() {
			return layerId;
		}
		public void setLayerId(String layerId) {
			this.layerId = layerId;
		}

	}
	
	public Set<String> getRequestedLayerIds(){
		Set<String> layerIds = new HashSet<String>();
		for (RequestedLayerFormat layer: requestedLayerFormat){
			layerIds.add(layer.getLayerId());
		}
		return layerIds;
	}
	
	public String getRequestedFormatForLayerId(String layerId) throws Exception{
		for (RequestedLayerFormat layer: requestedLayerFormat){
			if (layer.getLayerId().equalsIgnoreCase(layerId)){
				return layer.getFormat();
			}
		}
		throw new Exception("No format found for the specified layer.");
	}
	
	
	@JsonIgnore
	private UUID requestId;
	@JsonIgnore
	private String sessionId;
	@JsonIgnore
	private File downloadPackage;
	@JsonIgnore
	private List<MethodLevelDownloadRequest> requestList = new ArrayList<MethodLevelDownloadRequest>();
	@JsonIgnore
	private Boolean downloadPackageSet = false;
	@JsonIgnore
	private Boolean emailSent = false;
	@JsonIgnore
	private Integer dlpackageSetCounter = 0;
	
	
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
		dlpackageSetCounter++;
		this.downloadPackageSet = true;
		if (dlpackageSetCounter > 1){
			logger.error("something squirrely: the download package has been set more than once for this request.");
		}
	}
	
	public List<MethodLevelDownloadRequest> getRequestList() {
		return requestList;
	}
	
	public void setRequestList(List<MethodLevelDownloadRequest> layerRequests){
		requestList = layerRequests;
	}
	
	private Boolean isPostProcessingComplete(){
		for (MethodLevelDownloadRequest mldlRequest: requestList){
			for (LayerRequest layerRequest: mldlRequest.getRequestList()){
				if(layerRequest.getShouldHaveFiles()){
					if (downloadPackageSet){
						if (!this.downloadPackage.exists()){
							return false;
						} 
					} else {
						return false;
					}
				} 
			}
		}

		return true;
	}
	
	public Boolean isReadyForPackaging(){
		List<LayerRequest> layerList = new ArrayList<LayerRequest>();
		for (MethodLevelDownloadRequest request: requestList){
			for (LayerRequest layer: request.getRequestList()){
				if (layer.getShouldHaveFiles()){
					layerList.add(layer);
				}
			}		
		}
		
		StatusSummary completionStatus = getStatusSummaryForList(layerList);
		
		if (completionStatus.equals(StatusSummary.COMPLETE_SUCCEEDED) || completionStatus.equals(StatusSummary.COMPLETE_PARTIAL)){
			return true;
		} else {
			return false;
		}
	}
	
	private StatusSummary getStatusSummaryForList(List<LayerRequest> layerList){
		//Processing or Complete for the request
		logger.debug("Getting raw status summary");
		StatusSummary completionStatus = null;
		int successCount = 0;
		int failureCount = 0;

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
	
	private StatusSummary getRawStatusSummary(){
		//Processing or Complete for the request
		logger.debug("Getting raw status summary");

		List<LayerRequest> layerList = new ArrayList<LayerRequest>();
		for (MethodLevelDownloadRequest request: requestList){
			layerList.addAll(request.getRequestList());
		}
		
		return getStatusSummaryForList(layerList);

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
