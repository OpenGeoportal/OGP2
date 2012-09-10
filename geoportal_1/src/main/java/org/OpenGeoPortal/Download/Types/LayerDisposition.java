package org.OpenGeoPortal.Download.Types;

public enum LayerDisposition {
	AWAITING_REQUEST ("The layer is waiting to be requested."),
	AWAITING_DOWNLOAD ("The layer is waiting to be downloaded."),
    DOWNLOADED_LOCALLY ("The layer was downloaded locally."),
    LINK_EMAILED ("A link to the layer(s) was sent to the user via email."),
    LAYERS_PACKAGED ("The layer(s) have been packaged."),
    REQUEST_ABORTED ("The request for the layer(s) was aborted.");

    private final String message;
    LayerDisposition(String message) {
        this.message = message;
    }
    public String message()   { return message; }
}
