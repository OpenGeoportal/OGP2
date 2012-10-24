
if (typeof org == 'undefined'){ 
	org = {};
} else if (typeof org != "object"){
	throw new Error("org already exists and is not an object");
}

// Repeat the creation and type-checking code for the next level
if (typeof org.OpenGeoPortal == 'undefined'){
	org.OpenGeoPortal = {};
} else if (typeof org.OpenGeoPortal != "object"){
    throw new Error("org.OpenGeoPortal already exists and is not an object");
}


org.OpenGeoPortal.Downloader = function(){
	var that = this;
	this.requestQueue = {
			"pollId": "",
			"isPollRunning": false,
			"requests": {
				"pending":{
					"layers":[],
					"images":[]
				},
				"complete":{
					"layers":[],
					"images":[]
				}
			}
	};
	
	var INTERVAL_MS = 3000;

	 var removeRequest = function (requestId, requestArray){
			for (var i in requestArray){
				var currentRequest = requestArray[i];
				if (currentRequest.requestId == requestId){
					requestArray.splice(i, 1);
					return;
				}
			}
		};
		
	this.getLayerRequests = function(){
		return that.requestQueue.requests.pending.layers;
	};
	
	var getNewRequest = function(requestId){
		var request = {};
		request.requestId = requestId;
		request.status = {};
		return request;
	};
	
	var addLayerRequest = function(requestId){
		that.requestQueue.requests.pending.layers.push(getNewRequest(requestId));
	};
	
	var addImageRequest = function(requestId){
		that.requestQueue.requests.pending.images.push(getNewRequest(requestId));
	};
	
	this.registerLayerRequest = function(requestId){
		addLayerRequest(requestId);
		if (!that.requestQueue.isPollRunning){
			this.startPoll();
		}
	};
	
	
	
	this.removeLayerRequest = function(requestId){
		removeRequest(requestId, that.requestQueue.requests.pending.layers);
	};
	
	this.addLayerToComplete = function(requestStatus){
		that.requestQueue.requests.complete.layers.push(requestStatus);
	};
	
	this.addImageToComplete = function(requestStatus){
		that.requestQueue.requests.complete.images.push(requestStatus);
	};
	
	this.promoteLayerRequest = function(requestStatus){
		this.removeLayerRequest(requestStatus.requestId);
		this.addLayerToComplete(requestStatus);
	};
	
	this.promoteImageRequest = function(requestStatus){
		this.removeImageRequest(requestStatus.requestId);
		this.addImageToComplete(requestStatus);
	};
	
	this.getImageRequests = function(){
		return that.requestQueue.requests.pending.images;
	};
	
	this.registerImageRequest = function(requestId){
		addImageRequest(requestId);
		if (!that.requestQueue.isPollRunning){
			this.startPoll();
		}
	};
	
	this.removeImageRequest = function(requestId){
		removeRequest(requestId, that.requestQueue.requests.pending.images);
	};
	

	this.firePoll = function(){
		var t=setTimeout('org.OpenGeoPortal.downloadQueue.pollRequestStatus()', INTERVAL_MS);
		that.requestQueue.pollId = t;
		that.requestQueue.isPollRunning = true;
	};
	
	this.startPoll = function(){
		if (!that.requestQueue.isPollRunning){
			that.firePoll();
		} else {
			//poll is already running
		}
	};
	
	this.stopPoll = function(){
		if (that.requestQueue.isPollRunning){
			var t= that.requestQueue.pollId;
			clearTimeout(t);
			that.requestQueue.isPollRunning = false;
		} else {
			//poll is not running
		}
	};
	
	var handleStatusResponse = function(data){
		var statuses = data.requestStatus;
		//console.log(statuses);
		var pendingCounter = 0;
		for (var i in statuses){
			var currentStatus = statuses[i].status;
			//console.log(currentStatus);
			if (currentStatus == "COMPLETE_SUCCEEDED"){
				//get the download
				handleDownload(statuses[i]);
			} else if (currentStatus == "PROCESSING"){
				pendingCounter++;
			}
			//should be a clause for each possible status message
		}
		
		if (pendingCounter > 0){
			//console.log("should fire poll");
			that.firePoll();
		} else {
			that.stopPoll();
		}
	};
	
	var handleDownload = function(statusObj){
		if (statusObj.type == "layer"){
			var currentRequestId = statusObj.requestId;
			that.promoteLayerRequest(statusObj);
			var url = "getDownload?requestId=" + currentRequestId;
			location.href = url;
		} else if (statusObj.type == "image"){
			var currentRequestId = statusObj.requestId;
			that.promoteImageRequest(statusObj);
			var url = "getImage?requestId=" + currentRequestId;
			location.href = url;
		}
	};
	
	var getLayerRequestIds = function(){
		var requestIdObjs = that.getLayerRequests();
		var requestIds = [];
		for (var i in requestIdObjs){
			requestIds.push(requestIdObjs[i].requestId);
		}
		return requestIds;
	};
	
	var getImageRequestIds = function(){
		var requestIdObjs = that.getImageRequests();
		var requestIds = [];
		for (var i in requestIdObjs){
			requestIds.push(requestIdObjs[i].requestId);
		}
		return requestIds;
	};
	
	this.pollRequestStatus = function(){
		var ids = getLayerRequestIds().concat(getImageRequestIds());
		var that = this;
		//console.log(getLayerRequestIds());
		//console.log(getImageRequestIds());
		var successFunction = function(data){
			that.requestQueue.isPollRunning = false;
			//parse this data, update request queue
			handleStatusResponse(data);
			//fire a LayerDownload completion event
			jQuery(document).trigger("requestStatus.success", data);
		};
		
		var failureFunction = function(){
			that.requestQueue.isPollRunning = false;
			//fire a LayerDownload request failed event
			jQuery(document).trigger("requestStatus.failure", ids);
		};
		var path = "requestStatus";
		if (ids.length == 0){
			failureFunction();
			return;
		}
		var params = {
				  url: path + "?requestIds=" + ids.join(","),
				  dataType: "json",
				  success: successFunction,
				  error: failureFunction
			};
		
			jQuery.ajax(params);
	}
};