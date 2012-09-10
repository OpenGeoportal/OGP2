package org.OpenGeoPortal.Download.Types;

public enum LayerStatus {
    	AWAITING_REQUEST ("The layer is waiting to be requested."),
	    DOWNLOAD_SUCCESS ("The layer was successfully downloaded."),
	    DOWNLOAD_FAILED ("The layer download failed."),
	    LAYER_NOT_FOUND ("The layer was not found."),
	    LAYER_MISSING_INFO ("Information needed to access this layer is missing."),
	    NO_DOWNLOAD_METHOD ("No download method was found for this layer."),
	    PERMISSION_DENIED ("You do not have permission to download this layer.");

	    private final String message;
	    LayerStatus(String message) {
	        this.message = message;
	    }
	    public String message()   { return message; }
}
