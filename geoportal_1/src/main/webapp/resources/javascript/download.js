
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
	jQuery("body").append('<div id="requestTickerContainer" class="raised"></div>');
	var that = this;
	this.requestQueue = {
			"pollId": "",
			"isPollRunning": false,
			"tickerId": "",
			"processingIndicatorId": "",
			"isTickerRunning": false,
			"requests": {
				"pending":{
					"layers":[],
					"images":[],
					"exports":[]
				},
				"complete":{
					"layers":[],
					"images":[],
					"exports":[]
				},
				"failed":{
					"layers":[],
					"images":[],
					"exports":[]
				}
			}
	};
	
	var INTERVAL_MS = 3000;

	//helper functions for working with queues
	 var removeRequest = function (requestId, srcArray){
		var requestQueueObj;
		for (var i in srcArray){
			var currentRequest = srcArray[i];
			if (currentRequest.requestId == requestId){
				return srcArray.splice(i, 1)[0];
			}
		}
		return false;
	};
	
	var getNewRequest = function(requestId, requestObj){
		var request = {};
		request.requestId = requestId;
		request.status = {};
		request.params = requestObj;
		return request;
	};
		

	//getters for queues
	this.getImageRequests = function(){
		return that.requestQueue.requests.pending.images;
	};
	
	this.getCompleteImageRequests = function(){
		return that.requestQueue.requests.complete.images;
	};
	
	this.getFailedImageRequests = function(){
		return that.requestQueue.requests.failed.images;
	};
	
	this.getExportRequests = function(){
		return that.requestQueue.requests.pending.exports;
	};
	
	this.getCompleteExportRequests = function(){
		return that.requestQueue.requests.complete.exports;
	};
	
	this.getFailedExportRequests = function(){
		return that.requestQueue.requests.failed.exports;
	};
	
	this.getLayerRequests = function(){
		return that.requestQueue.requests.pending.layers;
	};
	
	this.getCompleteLayerRequests = function(){
		return that.requestQueue.requests.complete.layers;
	};
	
	this.getFailedLayerRequests = function(){
		return that.requestQueue.requests.failed.layers;
	};
	
	//add requests to various queues
	
	var addLayerRequest = function(requestId, requestObj){
		that.requestQueue.requests.pending.layers.push(getNewRequest(requestId, requestObj));
	};
	
	var addImageRequest = function(requestId, requestObj){
		that.requestQueue.requests.pending.images.push(getNewRequest(requestId, requestObj));
	};
	
	var addExportRequest = function(requestId, requestObj){
		that.requestQueue.requests.pending.exports.push(getNewRequest(requestId, requestObj));
	};
	
	this.addLayerToComplete = function(requestObj){
		that.requestQueue.requests.complete.layers.push(requestObj);
	};
	
	this.addImageToComplete = function(requestStatus){
		that.requestQueue.requests.complete.images.push(requestStatus);
	};
	
	this.addExportToComplete = function(requestStatus){
		that.requestQueue.requests.complete.exports.push(requestStatus);
	};
	
	
	this.addLayerToFailed = function(requestObj){
		that.requestQueue.requests.failed.layers.push(requestObj);
	};
	
	this.addImageToFailed = function(requestStatus){
		that.requestQueue.requests.failed.images.push(requestStatus);
	};
	
	this.addExportToFailed = function(requestStatus){
		that.requestQueue.requests.failed.exports.push(requestStatus);
	};
	
	//remove requests from various queues
	this.removePendingLayerRequest = function(requestId){
		return removeRequest(requestId, this.getLayerRequests());
	};
	
	this.removePendingImageRequest = function(requestId){
		return removeRequest(requestId, this.getImageRequests());
	};
	
	this.removePendingExportRequest = function(requestId){
		return removeRequest(requestId, this.getExportRequests());
	};

	

	
	//register requests in the queue
	this.registerLayerRequest = function(requestId, requestObj){
		addLayerRequest(requestId, requestObj);
		if (!that.requestQueue.isPollRunning){
			this.startPoll();
		}
	};
	
	this.registerExportRequest = function(requestId, requestObj){
		addExportRequest(requestId, requestObj);
		if (!that.requestQueue.isPollRunning){
			this.startPoll();
		}
	};
	
	this.registerImageRequest = function(requestId, requestObj){
		addImageRequest(requestId, requestObj);
		if (!that.requestQueue.isPollRunning){
			this.startPoll();
		}
	};
	

	
	//transfer requests objects
	this.layerRequestToComplete = function(requestStatus){
		var requestQueueObj = this.removePendingLayerRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addLayerToComplete(newObj);
	};
	
	this.imageRequestToComplete = function(requestStatus){
		var requestQueueObj = this.removePendingImageRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addImageToComplete(newObj);
	};
	
	this.exportRequestToComplete = function(requestStatus){
		var requestQueueObj = this.removePendingExportRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addExportToComplete(newObj);
	};
	
	this.layerRequestToFailed = function(requestStatus){
		var requestQueueObj = this.removePendingLayerRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addLayerToFailed(newObj);
	};
	
	this.imageRequestToFailed = function(requestStatus){
		var requestQueueObj = this.removePendingImageRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addImageToFailed(newObj);
	};
	
	this.exportRequestToFailed = function(requestStatus){
		var requestQueueObj = this.removePendingExportRequest(requestStatus.requestId);
		var newObj = {};
		jQuery.extend(true, newObj, requestQueueObj, requestStatus);
		this.addExportToFailed(newObj);
	};
	

	
	//convenience functions
	this.getRequestById = function(id){
		var requests = this.getLayerRequests().concat(this.getImageRequests());
		requests = requests.concat(this.getExportRequests);
		for (var i in requests){
			var currentRequest = requests[i];
			if (currentRequest.requestId == id){
				currentRequest.queue = "pending";
				return currentRequest;
			}
		}
		var requests = this.getCompleteLayerRequests().concat(this.getCompleteImageRequests());
		requests = requests.concat(this.getCompleteExportRequests);
		for (var i in requests){
			var currentRequest = requests[i];
			if (currentRequest.requestId == id){
				currentRequest.queue = "complete";
				return currentRequest;
			}
		}
		var requests = this.getFailedLayerRequests().concat(this.getFailedImageRequests());
		requests = requests.concat(this.getFailedExportRequests);
		for (var i in requests){
			var currentRequest = requests[i];
			if (currentRequest.requestId == id){
				currentRequest.queue = "failed";
				return currentRequest;
			}
		}
		
	};
	
	this.requestsToFailedById = function(ids){
		for (var i in ids){
			var requestId = ids[i];
			var requestQueueObj = this.removePendingLayerRequest(requestId);
			if (requestQueueObj){
				this.addLayerToFailed(requestQueueObj);
				continue;
			} else {
				var requestQueueObj = this.removePendingImageRequest(requestId);
				if (requestQueueObj){
					this.addImageToFailed(requestQueueObj);
				} else {
					var requestQueueObj = this.removePendingExportRequest(requestId);
					if (requestQueueObj){
						this.addExportToFailed(requestQueueObj);
					} else {
						throw new Error("Downloader.requestToFailedById fall through");
					}
				}
			}
		}
	};
	
	this.requestToFailedByStatus = function(requestStatus){
		var requestId = requestStatus.requestId;
		var requestQueueObj = this.removePendingLayerRequest(requestId);
		if (requestQueueObj){
			var newObj = {};
			jQuery.extend(true, newObj, requestQueueObj, requestStatus);
			this.addLayerToFailed(newObj);
			return;
		} else {
			var requestQueueObj = this.removePendingImageRequest(requestId);
			if (requestQueueObj){
				var newObj = {};
				jQuery.extend(true, newObj, requestQueueObj, requestStatus);
				this.addImageToFailed(newObj);
			} else {
				var requestQueueObj = this.removePendingExportRequest(requestId);
				if (requestQueueObj){
					var newObj = {};
					jQuery.extend(true, newObj, requestQueueObj, requestStatus);
					this.addExportToFailed(newObj);
				} else {
					//there's a problem
					throw new Error("Downloader.requestToFailedByStatus fall through");
				}
			}
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
	
	var getExportRequestIds = function(){
		var requestIdObjs = that.getExportRequests();
		var requestIds = [];
		for (var i in requestIdObjs){
			requestIds.push(requestIdObjs[i].requestId);
		}
		return requestIds;
	};
	
	//poll handling
	this.firePoll = function(){
		var t=setTimeout('org.OpenGeoPortal.downloadQueue.pollRequestStatus()', INTERVAL_MS);
		this.requestQueue.pollId = t;
		this.requestQueue.isPollRunning = true;
		this.setTickerText();
	};
	
	this.startPoll = function(){
		if (!that.requestQueue.isPollRunning){
			that.startTicker();
			that.firePoll();
		} else {
			//poll is already running
		}
	};
	
	this.startTicker = function(){
		//show ticker (a div with transparent black background, fixed to bottom of screen, loader
		//put a counter in a closure to iterate over the array
		if (jQuery("#requestTicker").length == 0){
			jQuery("#requestTickerContainer").html('<div id="processingIndicator"></div><div id="requestTicker"></div></div>');
		} else {
		}
		
		jQuery("#requestTickerContainer").fadeIn();

		//jQuery("#requestTicker").text(this.getTickerText());

		this.requestQueue.processingIndicatorId = org.OpenGeoPortal.Utility.indicatorAnimationStart("processingIndicator");
	};
	
	this.stopTicker = function(){
		try {
			var intervalId = this.requestQueue.tickerId;
			clearInterval(intervalId);
		} catch (e) {}
		//hide ticker
		jQuery("#requestTickerContainer").fadeOut();
		clearInterval(this.requestQueue.processingIndicatorId);
	};
	
	this.setTickerText = function(){
		var pending = this.requestQueue.requests.pending;
		var imageRequests = pending.images.length; 
		var layerRequests = pending.layers.length;
		var totalRequests = imageRequests + layerRequests;
		//console.log(imageRequests + " " + layerRequests + " " + totalRequests);
		var tickerText = "Processing ";

		if (totalRequests > 1){
			tickerText += totalRequests;
			tickerText += " Requests";
			//var that = this;
			//this.requestQueue.tickerId = setInterval(function(){ that.tick () }, 3000);
		} else {
			tickerText += "Request";
		}

		jQuery("#requestTicker").text(tickerText);
		//jQuery("#requestTickerContainer").width(jQuery("#requestTicker").width());
	};
	
	/*this.tick = function(){
		jQuery('#requestTicker').slideUp( function () { jQuery('#requestTicker').slideDown(); });
	}*/

	this.stopPoll = function(){
		this.stopTicker();
		if (this.requestQueue.isPollRunning){
			var t= this.requestQueue.pollId;
			clearTimeout(t);
			this.requestQueue.isPollRunning = false;
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
			//should be a clause for each possible status message
			if ((currentStatus == "COMPLETE_SUCCEEDED")||
					(currentStatus == "COMPLETE_PARTIAL")){
				//get the download
				handleDownload(statuses[i]);
				if (currentStatus == "COMPLETE_PARTIAL"){
					//should be a note to the user for partial success
				}
			} else if (currentStatus == "PROCESSING"){
				pendingCounter++;
			} else if (currentStatus == "COMPLETE_FAILED"){
				that.requestToFailedByStatus(statuses[i]);
				//should be a note to user that the download failed
			}
		}
		
		if (pendingCounter > 0){
			//console.log("should fire poll");
			that.firePoll();
		} else {
			that.stopPoll();
		}
	};
	
	var handleDownload = function(statusObj){
		var url;
		var currentRequestId;
		if (statusObj.type == "layer"){
			currentRequestId = statusObj.requestId;
			that.layerRequestToComplete(statusObj);
			url = "getDownload?requestId=" + currentRequestId;
			jQuery('body').append('<iframe id="' + currentRequestId + '" class="download" src="' + url + '"></iframe>');

		} else if (statusObj.type == "image"){
			currentRequestId = statusObj.requestId;
			that.imageRequestToComplete(statusObj);
			url = "getImage?requestId=" + currentRequestId;
			jQuery('body').append('<iframe id="' + currentRequestId + '" class="download" src="' + url + '"></iframe>');

		} else if (statusObj.type == "export"){
			currentRequestId = statusObj.requestId;
			that.exportRequestToComplete(statusObj);
			//should open map in GeoCommons
			url = "geocommons/getExport?requestId=" + currentRequestId;
			var successFunction = function(data){
				window.open(data.location);
			};
			var params = {
					  url: url,
					  dataType: "json",
					  success: successFunction//,
					  //error: failureFunction
				};
			jQuery.ajax(params);
		}

	};
	
	this.pollRequestStatus = function(){
		var ids = getLayerRequestIds().concat(getImageRequestIds());
		ids = ids.concat(getExportRequestIds());
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
			that.requestsToFailedById(ids);
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
	};
	
	this.createErrorMessageObj = function(statusObj){
		var requestId = statusObj.requestId;
		var statusMessage = statusObj.status;
		var requestObj = this.getRequestById(requestId);
		var layers = [];
		var layerIds = [];
		var layersParam = requestObj.layers;
		for (var i in layersParam){
			var arrLayer = layersParam[i].split("=");
			var layerObj = {"layerId": arrLayer[0], "format": arrLayer[1]};
			layerIds.push(arrLayer[0]);
			layers.push(layerObj);
		}
		//get some info from solr about the layer
        var solr = new org.OpenGeoPortal.Solr();
    	var query = solr.getInfoFromLayerIdQuery(layerIds);
    	solr.sendToSolr(query, this.errorInfoSuccess, this.errorInfoError);
    	//create message box here, but keep it hidden until solr callback
	};
	
	this.errorInfoSuccess = function(data){
		
	};
};