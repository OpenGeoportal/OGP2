package org.opengeoportal.download.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.opengeoportal.download.controllers.RequestStatusController.StatusSummary;

public class RequestStatus {
	private List<RequestStatusElement> requestStatus = new ArrayList<RequestStatusElement>();
	
	public List<RequestStatusElement> getRequestStatus(){
		return requestStatus;
	}
	public void addRequestStatusElement(UUID requestId, String type, StatusSummary status){
		requestStatus.add(new RequestStatusElement(requestId, type, status));
	}
	
	public void addRequestStatusElement(UUID requestId, String type, StatusSummary status, List<RequestedLayerStatus> requestedLayerStatuses){
		requestStatus.add(new ExtendedRequestStatusElement(requestId, type, status, requestedLayerStatuses));
	}
	
	public class RequestStatusElement {
		private UUID requestId;
		private String type;
		private StatusSummary status;
		
		RequestStatusElement(UUID requestId, String type, StatusSummary status){
			this.requestId = requestId;
			this.setType(type);
			this.status = status;
		}
		
		public UUID getRequestId() {
			return requestId;
		}
		public void setRequestId(UUID requestId) {
			this.requestId = requestId;
		}

		public StatusSummary getStatus() {
			return status;
		}
		public void setStatus(StatusSummary status) {
			this.status = status;
		}


		public String getType() {
			return type;
		}


		public void setType(String type) {
			this.type = type;
		}
		
	}
	
	public class ExtendedRequestStatusElement extends RequestStatusElement {

		private List<RequestedLayerStatus> requestedLayerStatuses;

		ExtendedRequestStatusElement(UUID requestId, String type, StatusSummary status, List<RequestedLayerStatus> requestedLayerStatuses){
			super(requestId, type, status);
			this.setRequestedLayerStatuses(requestedLayerStatuses);
		}
		
		public List<RequestedLayerStatus> getRequestedLayerStatuses() {
			return requestedLayerStatuses;
		}

		public void setRequestedLayerStatuses(List<RequestedLayerStatus> requestedLayerStatuses) {
			this.requestedLayerStatuses = requestedLayerStatuses;
		}
	}
	
}
