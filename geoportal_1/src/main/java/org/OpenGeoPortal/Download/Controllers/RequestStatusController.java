package org.OpenGeoPortal.Download.Controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.DownloadRequest;
import org.OpenGeoPortal.Download.DownloadRequest.StatusSummary;
import org.OpenGeoPortal.Download.RequestStatusManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;


@Controller
@RequestMapping("/requestStatus")
public class RequestStatusController {

	@Autowired
	private RequestStatusManager requestStatusManager;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	List<DownloadRequest> downloadRequests; 
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody RequestStatus getDownloadStatus(@RequestParam("requestIds") String requestIds)  {
		String[] requestIdsArr = requestIds.split(",");
		
		this.downloadRequests = new ArrayList<DownloadRequest>();
		for (String requestId: requestIdsArr){
			this.downloadRequests.add(requestStatusManager.getDownloadRequest(UUID.fromString(requestId)));
		}
		//really only need a subset of this and a summary of errors/successes/warnings.  
		return getRequestStatus();
	}
	
	private RequestStatus getRequestStatus(){
		logger.debug("Creating RequestStatus object");
		RequestStatus requestStatus = new RequestStatus();
		for (DownloadRequest downloadRequest: downloadRequests){
			UUID requestId = downloadRequest.getRequestId();
			logger.debug("RequestId: " + requestId.toString());
			String type = "layer";
			StatusSummary status = downloadRequest.getStatusSummary();
			logger.debug("status summary: " + status.toString());
			requestStatus.addRequestStatusElement(requestId, type, status);
		}
		return requestStatus;
	}
}
