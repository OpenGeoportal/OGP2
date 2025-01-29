if (typeof OpenGeoportal == 'undefined') {
    OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object") {
    throw new Error("OpenGeoportal already exists and is not an object");
}

if (typeof OpenGeoportal.Views == 'undefined') {
    OpenGeoportal.Views = {};
} else if (typeof OpenGeoportal.Views != "object") {
    throw new Error("OpenGeoportal.Views already exists and is not an object");
}

/**
 * The Request view handles the rendering of the request queue
 */
OpenGeoportal.Views.DownloadRequestView = Backbone.View
    .extend({

        initialize: function (options) {
            _.extend(this, _.pick(options, "widgets"));
            this.listenTo(this.model, "change:status", this.createNotice);

        },

        createNotice: function (model) {
            var status = model.get("status");
            // ignore successful status
            if ((status !== "COMPLETE_FAILED")
                || (status !== "COMPLETE_PARTIAL")) {
                return;
            }

            var layerInfo = model.get("layerStatuses");
            // generate a notice using the info in requestedLayerStatuses
            // if all succeeded, no need to pop up a message; the user
            // should see the save file dialog
            // "requestedLayerStatuses":[{"status":"PROCESSING","id":"Tufts.WorldShorelineArea95","bounds":"-66.513260443112,-314.6484375,66.513260443112,314.6484375","name":"sde:GISPORTAL.GISOWNER01.WORLDSHORELINEAREA95"}]}]}
            //console.log(model);
            var failed = [];
            var succeeded = [];
            for (var i in layerInfo) {
                var currentLayer = layerInfo[i];
                var currentstatus = currentLayer.status.toLowerCase();
                if (currentstatus != "success") {
                    failed.push(currentLayer);
                } else {
                    succeeded.push(currentLayer);
                }

            }
            var email = "";
            if (this.has("email")) {
                email = this.get("email");
            }

            this.noticeDialog(succeeded, failed, email);

        },

        noticeDialog: function (succeeded, failed, email) {
            var text = "";
            var failedIds = [];
            if (failed.length > 0) {
                _.each(failed, function (status) {
                    failedIds.push(status.id);
                });
                text += "The following layers failed to download: " + failedIds.join(", ");
            }

            var emailedIds = [];
            if (succeeded.length > 0) {
                _.each(succeeded, function (status) {
                    if (status.responseType === "email") {
                        emailedIds.push(status.id);
                    }
                });
                if (emailedIds.length > 0) {
                    text += "The following layers have been emailed to " + email + ": " + emailedIds.join();
                }
            }

            if (text.length > 0) {
                var dialog$ = this.widgets.genericModalDialog(text, "Download Notice");
                var buttonsObj = [{
                    text: "OK", click: function () {
                        jQuery(this).dialog('close');
                    }
                }];
                dialog$.dialog("option", "buttons", buttonsObj);
            }
        }
    });
