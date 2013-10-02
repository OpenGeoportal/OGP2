if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined'){
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object"){
    throw new Error("OpenGeoportal.Models already exists and is not an object");
}


OpenGeoportal.Models.QueueItem = Backbone.Model.extend({
    defaults: {
    	requestId: "",
    	layers: [],
    	clipBounds: "",
    	emailAddress: "",
    	status: "waiting",//waiting, pending, succeeded, failed
    	type: "" //layer, image, export
    }
	
/*
 * attributes: 
 * type: download, image, export, etc.
 * clipBounds: (if no clipping requested, set this to full extent; we want to keep track of if a user
 * 	has requested this data before)
 * jobId:
 * emailAddress: (opt.)
 *  
 */
});


OpenGeoportal.QueueCollection = Backbone.Collection.extend({
	model: OpenGeoportal.Models.QueueItem
    
});


OpenGeoportal.Models.RequestPoller = Backbone.Model.extend({
	defaults: {
		//pollId: "",//TODO: do I need all of these Id values? can I get rid of some?
		//tickerId: "",
		processingIndicatorId: "",
		isPollRunning: false,
		pollInterval: 3000
	}
});

OpenGeoportal.RequestResponseCollection = Backbone.Collection.extend({
});

OpenGeoportal.Models.RequestQueue = Backbone.Model.extend({
	defaults: {
		poller: new OpenGeoportal.Models.RequestPoller(),
		queue: new OpenGeoportal.QueueCollection(),
		responses: new OpenGeoportal.RequestResponseCollection()
	},
	initialize: function(){
		this.listenTo(this, "add", this.checkPoll);
		this.listenTo(this, "change:status", this.checkPoll);
		this.listenTo(this, "change:isPollRunning", this.pollStatus);

	},
	
	checkPoll: function(model){
		var pending = model.get("queue").where({status: "pending"});
		if (typeof pending == "undefined"){
			model.set({isPollRunning: false});
		} else {
			var requestIds = [];
			for (var i in pending){
				requestIds.push(pending[i].get("requestId"));
			}
			model.get("responses").url = "requestStatus?requestIds=" +  requestIds.join();
			model.set({isPollRunning: true});
		}
	},

	pollStatus: function(model){
		var that = this;
		if (model.get("isPollRunning")){
			var options = {
				success: function(){
					//first, roll the response model updates into the queue
					model.get("responses").each(function(responseModel){

						var rId = responseModel.get("requestId");
						var lId = responseModel.get("layerId");
						var status = responseModel.get("status");
						var queueItem = model.get("queue").findWhere({requestId: rId, layerId: lId});
						queueItem.set({status: status});
						
					});
					
					if (model.get("queue").where({status: "pending"}).length > 0){
						//if pending statuses, keep polling
						that.pollStatus(model);//better to trigger an event?
					} else {
						model.set({isPollRunning: false});
					}

				},
				failure: function(){
					model.set({isPollRunning: false});
					//if failure statuses, notify the user
					jQuery(document).trigger("requestStatus.failure", ids);
					}
			};
			setTimeout(function(){model.get("responses").fetch(options);}, model.get("poller").get("pollInterval"));
		} 
	},
    createRequest: function(requestObj){
		var that = this;
		var params = {
				url: "requestDownload",
				data: requestObj,
				dataType: "json",
				type: "POST",
				success: function(data){that.get("queue").add(jQuery.merge(data, requestObj));}
		};
		jQuery.ajax(params);
	}
	
});


/*

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
		
	};
	
	var failureFunction = function(){
		that.requestQueue.isPollRunning = false;
		//fire a LayerDownload request failed event
		that.requestsToFailedById(ids);
		
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

//poll handling
this.firePoll = function(){
	var t=setTimeout('OpenGeoportal.ogp.downloadQueue.pollRequestStatus()', INTERVAL_MS);
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
	if (jQuery("#requestTickerContainer").length == 0){
		jQuery("body").append('<div id="requestTickerContainer" class="raised"></div>');
	}

	//show ticker (a div with transparent black background, fixed to bottom of screen, loader
	//put a counter in a closure to iterate over the array
	if (jQuery("#requestTicker").length == 0){
		jQuery("#requestTickerContainer").html('<div id="processingIndicator"></div><div id="requestTicker"></div></div>');
	} 
	
	jQuery("#requestTickerContainer").fadeIn();

	this.requestQueue.processingIndicatorId = OpenGeoportal.Utility.indicatorAnimationStart("processingIndicator");
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
        var solr = new OpenGeoportal.Solr();
    	var query = solr.getInfoFromLayerIdQuery(layerIds);
    	solr.sendToSolr(query, this.errorInfoSuccess, this.errorInfoError);
    	//create message box here, but keep it hidden until solr callback
	};
	
	this.errorInfoSuccess = function(data){
		
	};
};*/