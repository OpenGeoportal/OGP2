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

OpenGeoportal.Views.GeoCommonsRequestView = Backbone.View
    .extend({

        initialize: function (options) {
            _.extend(this, _.pick(options, "widgets"));
            this.listenTo(this.model, "change:location", this.openLocation);
            this.listenTo(this.model, "change:failureReason", this.failureNotice);

        },

        openLocation: function (model) {
            window.open(model.get("location"));
        },

        failureNotice: function (model) {
            var text = "OGP failed to export your layers.  Reason: " + model.get("failureReason");
            var dialog$ = this.widgets.genericModalDialog(text, "Request Failed");
            var buttonsObj = [{
                text: "OK", click: function () {
                    jQuery(this).dialog('close');
                }
            }];
            dialog$.dialog("option", "buttons", buttonsObj);
        }
    });