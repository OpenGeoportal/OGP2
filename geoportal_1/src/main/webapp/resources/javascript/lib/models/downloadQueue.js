if (typeof OpenGeoportal === 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal !== "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models === 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models !== "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

OpenGeoportal.Models.AbstractQueueItem = Backbone.Model.extend({
	initialize : function() {
		this.listenTo(this, "change:status",
				this.handleStatusChange);
		this.listenTo(this, "add", this.submitRequest);
		this.widgets = OpenGeoportal.ogp.widgets;

		this.subClassInit();
	},

	/*
	 * attributes: type: layer, image, export, etc. bbox: (if no clipping requested,
	 * set this to full extent; we want to keep track of if a user has requested
	 * this data before) requestId: email: (opt.) status: "PROCESSING",
	 * "COMPLETE_SUCCEEDED", "COMPLETE_PARTIAL", "COMPLETE_FAILED"
	 */

	subClassInit: function(){
		//nop
	},
	
	getRequestParams : function() {
		throw new Error("Implement me!");
	},

	submitRequest : function() {
		var that = this;
		var params = {
				url : this.get("requestUrl"),
				data : this.getRequestParams(),
				dataType : "json",
				type : "POST",
				success : function(data) {
					that.set({
						requestId : data.requestId,
						status: "PROCESSING"
					});
				},
				error : function() {
					that.set({
						status: "COMPLETE_FAILED"
					});
				}
			};

			jQuery.ajax(params);

	},

	handleStatusChange : function() {
		var status = this.get("status");
		// do some stuff depending on the item's status
		if ((status == "COMPLETE_SUCCEEDED")
				|| (status == "COMPLETE_PARTIAL")) {
			// get the download
			try {
				this.handleDownload();
			} catch (e) {
				console.log(e);
				console.log("Download handler failed.");
			}
			try {
				this.createNotice();
			} catch (e) {
				console.log("Download notice creation failed.");
			}
		} else if (status == "COMPLETE_FAILED") {
			// should be a note to user that the download failed
			this.createNotice();
		}

		this.collection.checkPoll();
	},

	handleDownload : function() {
		var statuses = this.get("layerStatuses");
		var doDownload = false;
		var i = null;

		if (typeof statuses !== "undefined") {
			for (i in statuses) {
				var responseType = statuses[i].responseType;
				if (responseType === "download") {
					doDownload = true;
					break;
				}
			}
		} else {
			doDownload = true;
		}

		if (doDownload) {
			this.retrieve();
		}
	},

	retrieve : function() {
		//default action
		var url = this.get("retrieveUrl");

		url += "?requestId=" + this.get("requestId");
		jQuery('body').append(
				'<iframe class="download" src="' + url + '"></iframe>');
	},

	createNotice : function() {
		throw new Error("Implement me!");

	}


});

OpenGeoportal.Models.DownloadRequest = OpenGeoportal.Models.AbstractQueueItem.extend({

	defaults : {
		requestId : "",
		layers : [],
		bbox : new L.latLngBounds([-90,-180],[90,180]),
		email : "",
		status : "REQUESTING",
		requestUrl: "requestDownload",
		retrieveUrl : "getDownload"
	},
	
	subClassInit: function(){
		this.listenTo(this, "invalid", function(model, error) {

			if (error === "email") {
				var errMessage = "You must provide a valid email address.";
				jQuery("#emailValidationError").html(errMessage);
			} else {
				console.log("validation error for property: " + error);
			}
		});
	},

	getRequestParams : function() {
		// we'll have to truncate some of these attributes for the
		// request,
		try {
			var requestObj = this.attributes;
			var layerModels = this.get("layers");

			var layerRequests = [];
			_.each(layerModels, function(model) {
				layerRequests.push({
					layerId : model.get("LayerId"),
					format : model.get("requestedFormat")
				});
			});

			requestObj.layers = layerRequests;

			requestObj.bbox = requestObj.bbox.toBBoxString();
			
			return JSON.stringify(requestObj);

		} catch (e){
			console.log(e);
			throw new Error("Error creating params for request.");
		}
	},



	createNotice : function() {
		var layerInfo = this.get("layerStatuses");
		// generate a notice using the info in requestedLayerStatuses
		// if all succeeded, no need to pop up a message; the user
		// should see the save file dialog
		// "requestedLayerStatuses":[{"status":"PROCESSING","id":"Tufts.WorldShorelineArea95","bounds":"-66.513260443112,-314.6484375,66.513260443112,314.6484375","name":"sde:GISPORTAL.GISOWNER01.WORLDSHORELINEAREA95"}]}]}
		//console.log(model);
		var failed = [];
		var succeeded = [];
		var i = null;
		for (i in layerInfo) {
			var currentLayer = layerInfo[i];
			var status = currentLayer.status.toLowerCase();
			var layerName = currentLayer.id;
			if (status != "success") {
				failed.push(currentLayer);
			} else {
				succeeded.push(currentLayer);
			}

		}

		var email = "";
		if (this.has("email")){
			email = this.get("email");
		}

		this.noticeDialog(succeeded, failed, email);

	},

	noticeDialog: function(succeeded, failed, email){
		var text = "";
		var failedIds = [];
		if (failed.length > 0) {
			_.each(failed, function(status){
				failedIds.push(status.id);
			});
			text += "The following layers failed to download: " + failedIds.join(", ");
		}

		var emailedIds = [];
		if (succeeded.length > 0) {
			_.each(succeeded, function(status){
				if (status.responseType === "email"){
					emailedIds.push(status.id);
				}
			});
			if (emailedIds.length > 0){
				text += "The following layers have been emailed to " + email + ": " + emailedIds.join();
			}
		}

		if (text.length > 0){
			var dialog$ = this.widgets.genericModalDialog(text, "Download Notice");
			var buttonsObj = [{text: "OK", click: function(){jQuery(this).dialog('close');}}];
			dialog$.dialog("option", "buttons", buttonsObj);
		}
	},
	


validate : function(attrs, options) {
	var emailAddressProperty = "email";
	var emailAddress = attrs[emailAddressProperty];

	if (emailAddress !== null
			&& !OpenGeoportal.Utility.checkAddress(emailAddress)) {
		return emailAddressProperty;
	}

}

});

OpenGeoportal.Models.GeoCommonsRequest = OpenGeoportal.Models.AbstractQueueItem.extend({

	defaults : {
		requestId : "",
		layerIds : [],
		basemap: null,
		username: null,
		password: null,
		title: null,
		description: null,
		bbox : "",
		status : "REQUESTING",
		requestUrl : "geocommons/requestExport",
		retrieveUrl : "geocommons/getExport"
	},

	retrieve: function() {
		// should open map in GeoCommons
		var url = this.get("retrieveUrl");
		url += "?requestId=" + this.get("requestId");

		var params = {
				url : url,
				dataType : "json",
				success : this.retrievalSuccess,
				error: this.retrievalFailure
		};

		jQuery.ajax(params);
	},
	
	retrievalSuccess: function(data, textStatus, jqXHR){
		if (textStatus === 200){
			window.open(data.location);
		} else {
			var errorThrown = "unknown";
			//check textStatus to give us a clue.
			this.retrievalFailure(jqXHR, textStatus, errorThrown);
		}

	},

	retrievalFailure: function(jqXHR, textStatus, errorThrown){
		var text = "OGP failed to export your layers.  Reason: " + errorThrown;
		var dialog$ = this.widgets.genericModalDialog(text, "Request Failed");
		var buttonsObj = [{text: "OK", click: function(){jQuery(this).dialog('close');}}];
		dialog$.dialog("option", "buttons", buttonsObj);
	},
	
	getRequestParams: function() {
		// we'll have to truncate some of these attributes for the
		// request,
		try {
			var requestObj = {};
			requestObj.basemap = this.get("basemap");
			requestObj.username = this.get("username");
			requestObj.password = this.get("password");
			requestObj.extent = this.get("bbox");
			requestObj.title = this.get("title");
			requestObj.description = this.get("description");
			requestObj.OGPIDS = this.get("layerIds").join();

			return JSON.stringify(requestObj);

		} catch (e){
			console.log(e);
			throw new Error("Error creating params");
		}
	},

	createNotice : function() {
		//nop
		alert("failed to export layers to GeoCommons!");
	}
});

OpenGeoportal.Models.ImageRequest = OpenGeoportal.Models.AbstractQueueItem.extend({
/*
 * layers: [name, opacity, zIndex, sld, layerId]
 * width
 * height
 * srs
 * format
 * bbox 
 */
	defaults : {
		requestId : "",
		layers : [],
		bbox : "",
		format: "image/png",
		width: null,
		height: null,
		srs: null,
		status : "REQUESTING",
		requestUrl : "requestImage",
		retrieveUrl : "getImage"
	},

	getRequestParams : function() {
		// we'll have to truncate some of these attributes for the
		// request,
		try {
			var requestObj = {};
			
			requestObj.format = this.get("format");
			requestObj.width = this.get("width");
			requestObj.height = this.get("height");
			requestObj.bbox = this.get("bbox");
			requestObj.srs = this.get("srs");
			
			var layerRequests = this.get("layers");

			requestObj.layers = layerRequests;

			return JSON.stringify(requestObj);

		} catch (e){
			console.log(e);
			throw new Error("Error creating params");
		}
	},
	
	createNotice : function() {
		//nop

	}

});



OpenGeoportal.RequestQueue = Backbone.Collection
.extend({
	model : OpenGeoportal.Models.QueueItem,

	poll: {
		id : "",
		isRunning : false,
		interval : 3000
	},

	checkPoll : function() {
		var pending = this.where({
			status : "PROCESSING"
		});
		if (typeof pending == "undefined" || pending.length === 0) {
			// if nothing in the queue has a status "PROCESSING", then
			// stop the poll
			this.stopPoll();
		} else {

			this.startPoll();
		}
	},

	stopPoll : function() {
		if (this.poll.isRunning) {
			clearInterval(this.poll.id);
			this.poll.isRunning = false;
		}
	},

	startPoll : function() {
		// called when a queue item is added
		var that = this;
		if (!this.poll.isRunning) {
			// instead of fetch, use plain old ajax request
			this.poll.id = setInterval(function() {
				var pending = that.where({
					status : "PROCESSING"
				});

				that.checkStatus(pending);
			}, that.poll.interval);

			this.poll.isRunning = true;

		}

		var layerCount = this.getLayerCount();


	},

	getLayerCount : function() {
		var processing = this.where({
			status : "PROCESSING"
		});
		var count = 0;
		var i = null;
		for (i in processing) {
			count += processing[i].get("layers").length;
		}
		return count;
	},
	// {"requestStatus":[
	// {"requestId":"26fe6ae7-274b-4b2d-aa58-9da1ee438dac","type":"layer","status":"PROCESSING",
	// "requestedLayerStatuses":[{"status":"PROCESSING","id":"Tufts.WorldShorelineArea95","bounds":"-66.513260443112,-314.6484375,66.513260443112,314.6484375","name":"sde:GISPORTAL.GISOWNER01.WORLDSHORELINEAREA95"}]}]}

	checkStatus : function(arrPending) {
		var requestIds = [];
		_.each(arrPending, function(pending){
			requestIds.push(pending.get("requestId"));
		});

		var arrIds = {
				requestIds : requestIds.join()
		};
		var that = this;
		var params = {
				url : "requestStatus",
				data : arrIds,
				success : function(data) {
					that.updateRequestQueue(data.requestStatus);
				},
				error : function() {
					// if failure statuses, notify the user
					// also stop the poll. change to failed?
					console.log("error callback called");
					console.log(arrPending);
					_.each(arrPending, function(pending){
						console.log(pending.get("status"));
						pending.set({
							status: "FAILED"
						});
					});

					//jQuery(document).trigger("requestStatus.failure");
				}
		};
		jQuery.ajax(params);
	},

	updateRequestQueue : function(requestStatus) {
		// console.log("updateRequestQueue");
		var i = null;
		for (i in requestStatus) {
			var rId = requestStatus[i].requestId;
			var newStatus = requestStatus[i].status;
			var layerInfo = requestStatus[i].requestedLayerStatuses;
			var requestModel = this.findWhere({
				requestId : rId
			});
			requestModel.set({
				status : newStatus,
				layerStatuses : layerInfo
			});
		}
	}

});
