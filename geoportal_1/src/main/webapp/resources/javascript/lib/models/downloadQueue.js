if (typeof OpenGeoportal == 'undefined') {
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
	throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Models == 'undefined') {
	OpenGeoportal.Models = {};
} else if (typeof OpenGeoportal.Models != "object") {
	throw new Error("OpenGeoportal.Models already exists and is not an object");
}

OpenGeoportal.Models.QueueItem = Backbone.Model.extend({
	idAttribute : "requestId",
	defaults : {
		requestId : "",
		layers : [],
		bbox : "",
		email : "",
		status : "PROCESSING",
		type : ""
	}

/*
 * attributes: type: layer, image, export, etc. bbox: (if no clipping requested,
 * set this to full extent; we want to keep track of if a user has requested
 * this data before) requestId: email: (opt.) status: "PROCESSING",
 * "COMPLETE_SUCCEEDED", "COMPLETE_PARTIAL", "COMPLETE_FAILED"
 */
});

OpenGeoportal.RequestQueue = Backbone.Collection
		.extend({
			model : OpenGeoportal.Models.QueueItem,

			// processingIndicatorId: "",
			pollId : "",
			pollRunning : false,
			pollInterval : 3000,

			initialize : function() {
				this.listenTo(this, "add change:status",
						this.handleStatusChange);
			},

			handleStatusChange : function(model) {
				var status = model.get("status");
				// do some stuff depending on the item's status
				if ((status == "COMPLETE_SUCCEEDED")
						|| (status == "COMPLETE_PARTIAL")) {
					// get the download
					try {
						this.handleDownload(model);
					} catch (e) {
						console.log("Download handler failed.");
					}
					try {
						this.createNotice(model);
					} catch (e) {
						console.log("Download notice creation failed.");
					}
				} else if (status == "COMPLETE_FAILED") {
					// should be a note to user that the download failed
					this.createNotice(model);
				}

				this.checkPoll();
			},

			handleDownload : function(model) {
				var statuses = model.get("layerStatuses");
				var doDownload = false;
				var i = null;

				if (typeof statuses != "undefined") {
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
					var type = model.get("type");
					this.requestTypes[type].successCallback.call(this, model);
				}
			},

			openGeoCommons : function(model) {
				// should open map in GeoCommons
				var url = this.requestTypes[model.get("type")].retrieveUrl;
				url += "?requestId=" + model.get("requestId");

				var successFunction = function(data) {
					window.open(data.location);
				};

				var params = {
					url : url,
					dataType : "json",
					success : successFunction
				};

				jQuery.ajax(params);
			},

			iframeDownload : function(model) {
				var url = this.requestTypes[model.get("type")].retrieveUrl;
				url += "?requestId=" + model.get("requestId");
				jQuery('body').append(
						'<iframe class="download" src="' + url + '"></iframe>');
			},

			createNotice : function(model) {
				var layerInfo = model.get("layerStatuses");
				// generate a notice using the info in requestedLayerStatuses
				// if all succeeded, no need to pop up a message; the user
				// should see the save file dialog
				// "requestedLayerStatuses":[{"status":"PROCESSING","id":"Tufts.WorldShorelineArea95","bounds":"-66.513260443112,-314.6484375,66.513260443112,314.6484375","name":"sde:GISPORTAL.GISOWNER01.WORLDSHORELINEAREA95"}]}]}
				var failed = [];
				var succeeded = [];
				var i = null;
				for (i in layerInfo) {
					var currentLayer = layerInfo[i];
					var status = currentLayer.status.toLowerCase();
					var layerName = currentLayer.id;
					if (status != "success") {
						failed.push(layerName);
					} else {
						succeeded.push(layerName);
					}

				}

				if (failed.length > 0) {
					alert("These layers failed: " + failed.join());
				}

				if (succeeded.length > 0) {
					// alert("These layers succeeded!: " + succeeded.join());
				}

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
				if (this.pollRunning) {
					clearInterval(this.pollId);
					this.pollRunning = false;
					jQuery(document).trigger("hideRequestSpinner");
				}
			},

			startPoll : function() {
				// called when a queue item is added
				var that = this;
				if (!this.pollRunning) {
					// instead of fetch, use plain old ajax request
					this.pollId = setInterval(function() {
						var pending = that.where({
							status : "PROCESSING"
						});
						var requestIds = [];
						var i = null;
						for (i in pending) {
							requestIds.push(pending[i].get("requestId"));
						}
						that.checkStatus(requestIds);
					}, that.pollInterval);

					this.pollRunning = true;

				}

				var layerCount = this.getLayerCount();
				jQuery(document).trigger("showRequestSpinner", {
					layers : layerCount
				});

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

			checkStatus : function(arrIds) {
				var requestIds = {
					requestIds : arrIds.join()
				};
				var that = this;
				var params = {
					url : "requestStatus",
					data : requestIds,
					success : function(data) {
						that.updateRequestQueue(data.requestStatus);
					},
					error : function() {
						// if failure statuses, notify the user
						// also stop the poll. change to failed?
						that.stopPoll();
						jQuery(document).trigger("requestStatus.failure");
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
			},
			// Each of these should move to the code that generates the request.
			requestTypes : {
				layer : {
					requestUrl : "requestDownload",
					retrieveUrl : "getDownload",
					successCallback : function() {
						this.iframeDownload.apply(this, arguments);
					}
				},
				image : {
					requestUrl : "requestImage",
					retrieveUrl : "getImage",
					successCallback : function() {
						this.iframeDownload.apply(this, arguments);
					}
				},
				exportTo : {
					requestUrl : "geocommons/requestExport",
					retrieveUrl : "geocommons/getExport",
					successCallback : function() {
						this.openGeoCommons.apply(this, arguments);
					}
				}
			},

			createRequest : function(requestObj) {
				var that = this;

				var requestInfo = this.requestTypes[requestObj.type];

				var params = {
					url : requestInfo.requestUrl,
					data : JSON.stringify(requestObj),
					dataType : "json",
					type : "POST",
					success : function(data) {
						requestObj.requestId = data.requestId;
						that.add(requestObj);
					},
					error : function() {
						jQuery(document).trigger("hideRequestSpinner");
					}
				};
				jQuery.ajax(params);
				jQuery(document).trigger("showRequestSpinner");

			}

		});
