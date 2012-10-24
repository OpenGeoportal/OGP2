package org.OpenGeoPortal.Download.Controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.Controllers.RequestStatusController.StatusSummary;

public class RequestStatus {
	private List<RequestStatusElement> requestStatus = new ArrayList<RequestStatusElement>();
	
	public List<RequestStatusElement> getRequestStatus(){
		return requestStatus;
	}
	public void addRequestStatusElement(UUID requestId, String type, StatusSummary status){
		requestStatus.add(new RequestStatusElement(requestId, type, status));
	}
	
	/*public enum ElementType {
		Layer, Image
	}
	
	public enum DeliveryMethod {
		Direct, Email
	}*/
	
	public class RequestStatusElement {
		private UUID requestId;
		//private ElementType type;//layer, image, etc.
		//private DeliveryMethod delivery;//direct, email, etc.
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


		/*public DeliveryMethod getDelivery() {
			return delivery;
		}


		public void setDelivery(DeliveryMethod delivery) {
			this.delivery = delivery;
		}*/
		
		
	}
	
}
