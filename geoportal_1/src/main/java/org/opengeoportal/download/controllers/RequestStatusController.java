package org.opengeoportal.download.controllers;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.opengeoportal.download.DownloadRequest;
import org.opengeoportal.download.MethodLevelDownloadRequest;
import org.opengeoportal.download.RequestStatusManager;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.export.geocommons.GeoCommonsExportRequest;
import org.opengeoportal.proxy.controllers.ImageRequest;
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
	private List<DownloadRequest> downloadRequests; 
	private List<ImageRequest> imageRequests;
	private List<GeoCommonsExportRequest> exportRequests;
	
	public enum StatusSummary {
		PROCESSING,
		READY_FOR_PACKAGING,
		COMPLETE_FAILED,
		COMPLETE_SUCCEEDED,
		COMPLETE_PARTIAL
	}
	
	@RequestMapping(method=RequestMethod.GET, produces="application/json")
	public @ResponseBody RequestStatus getDownloadStatus(@RequestParam("requestIds") String requestIds) throws IOException  {
		String[] requestIdsArr = requestIds.split(",");
		if (requestIdsArr.length == 0){
			throw new IOException("Request Ids required.");
		}
		this.downloadRequests = new ArrayList<DownloadRequest>();
		this.imageRequests = new ArrayList<ImageRequest>();
		this.exportRequests = new ArrayList<GeoCommonsExportRequest>();

		for (String requestId: requestIdsArr){
			try {
				DownloadRequest dlRequest = requestStatusManager.getDownloadRequest(UUID.fromString(requestId));
				if (dlRequest != null){
					this.downloadRequests.add(dlRequest);
				}
			} catch (Exception e){
				//e.printStackTrace();
			}
			try {
				ImageRequest imRequest = requestStatusManager.getImageRequest(UUID.fromString(requestId));
				if (imRequest != null){
					this.imageRequests.add(imRequest);
				}
			} catch (Exception e){
				//e.printStackTrace();
			}
			try {
				GeoCommonsExportRequest exRequest = requestStatusManager.getExportRequest(UUID.fromString(requestId));
				if (exRequest != null){
					this.exportRequests.add(exRequest);
				}
			} catch (Exception e){
				//e.printStackTrace();
			}
		}
		if ((this.downloadRequests.size() + this.imageRequests.size() + this.exportRequests.size()) > 0){
			return getRequestStatus();
		} else {
			logger.error("no requests found");
			//should this throw an exception or just return an empty response?
			throw new IOException("No requests found.");
		}
	}
	
	private RequestStatus getRequestStatus(){
		logger.debug("Creating RequestStatus object");
		RequestStatus requestStatus = new RequestStatus();
		//logger.info("download requests size: " + Integer.toString(downloadRequests.size()));
		for (DownloadRequest downloadRequest: downloadRequests){
			UUID requestId = downloadRequest.getRequestId();
			List<MethodLevelDownloadRequest> requests = downloadRequest.getRequestList();
			List<RequestedLayerStatus> layerStatuses = new ArrayList<RequestedLayerStatus>();
			for (MethodLevelDownloadRequest mldRequest: requests){
				for (LayerRequest layerRequest : mldRequest.getRequestList()){
					RequestedLayerStatus layerStatus = new RequestedLayerStatus();
					if (layerRequest.getShouldHaveFiles()){
						layerStatus.setResponseType("download");
					} else {
						layerStatus.setResponseType("email");
					}
					layerStatus.setStatus(layerRequest.getStatus());
					layerStatus.setId(layerRequest.getId());
					layerStatus.setBounds(layerRequest.getRequestedBounds().toStringLatLon());
					try {
						layerStatus.setName(layerRequest.getLayerNameNS());
					} catch (Exception e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					layerStatuses.add(layerStatus);
				}
			}
			logger.debug("RequestId: " + requestId.toString());
			String type = "layer";
			StatusSummary status = downloadRequest.getStatusSummary();
			logger.debug("Download status summary: " + status.toString());
			requestStatus.addRequestStatusElement(requestId, type, status, layerStatuses);
		}

		for (ImageRequest imageRequest: imageRequests){
			UUID requestId = imageRequest.getRequestId();
			//logger.info("RequestId: " + requestId.toString());
			String type = "image";
			StatusSummary status = imageRequest.getStatusSummary();
			//logger.info("Image status summary: " + status.toString());
			requestStatus.addRequestStatusElement(requestId, type, status);
		}
		
		for (GeoCommonsExportRequest exportRequest: exportRequests){
			UUID requestId = exportRequest.getRequestId();
			//logger.info("RequestId: " + requestId.toString());
			String type = "export";
			StatusSummary status = exportRequest.getStatusSummary();
			//logger.info("Image status summary: " + status.toString());
			requestStatus.addRequestStatusElement(requestId, type, status);
		}

		//logger.info(Integer.toString(requestStatus.getRequestStatus().size()));
		return requestStatus;
	}
	

}
