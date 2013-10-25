package org.opengeoportal.download.types;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

//put this on the backburner, and go with a simpler status indicator for now.  we can add complexity later if needed.
public class LayerStatus {
	public enum LayerStage {
    	LAYER_OBJECT_CREATION,//The layer object has been created.
    	METHOD_LOOKUP, //The download method has been identified
    	LAYER_REQUEST, //A request has been made for the layer.")
    	LAYER_DOWNLOAD, //The layer has been downloaded
    	PROCESSING_COMPLETE //Processing is complete for this layer.
	}
	
	 public enum StageProgress {
		 STARTED,
		 FAILED,
		 SUCCEEDED
	 }
	 
	private Map<LayerStage, StageDetails> status  = Collections.synchronizedMap(new EnumMap<LayerStage, StageDetails>(LayerStage.class));
	 
	public Map<LayerStage, StageDetails> getStatus(){
		return status;
	}
	
	public LayerStage getCurrentStage(){
		LayerStage[] arrLayerStage = (LayerStage[]) status.keySet().toArray();
		return arrLayerStage[arrLayerStage.length -1];
	}
	
	public StageDetails getCurrentDetails(){
		return status.get(getCurrentStage());
	}
	
	public void setStatus(LayerStage layerStage, StageProgress stageProgress){
		
	}

	 
	 public class StageDetails {

			List<Map<String,String>> successMessage = new ArrayList<Map<String,String>>();
			List<Map<String,String>> errorMessage = new ArrayList<Map<String,String>>();
			List<Map<String,String>> warningMessage = new ArrayList<Map<String,String>>();
			
			public void addError(String name, String message){
				errorMessage.add(statusMessage(name, message));
			}
			
			public void addSuccess(String name, String message){
				successMessage.add(statusMessage(name, message));
			}
			
			public void addWarning(String name, String message){
				warningMessage.add(statusMessage(name, message));
			}
			
			public List<Map<String,String>> getSuccesses(){
				return successMessage;
			}
			
			public List<Map<String,String>> getWarnings(){
				return warningMessage;
			}
			
			public List<Map<String,String>> getErrors(){
				return errorMessage;
			}
			
			private Map<String,String> statusMessage(String layerName, String status){
				Map<String, String> statusMap = new HashMap<String, String>();
				statusMap.put("layer", layerName);
				statusMap.put("status", status);
				return statusMap;
			}
	 }
	


}    
	   /* public enum Disposition {
		    DOWNLOAD_SUCCESS ("The layer was successfully downloaded."),
		    DOWNLOAD_FAILED ("The layer download failed."),
		    LAYER_NOT_FOUND ("The layer was not found."),
		    LAYER_MISSING_INFO ("Information needed to access this layer is missing."),
		    NO_DOWNLOAD_METHOD ("No download method was found for this layer."),
		    PERMISSION_DENIED ("You do not have permission to download this layer."),
	    	AWAITING_DOWNLOAD ("The layer is waiting to be downloaded."),
	        
	        LINK_EMAILED ("A link to the layer(s) was sent to the user via email."),
	        LAYERS_PACKAGED ("The layer(s) have been packaged."),
	        REQUEST_ABORTED ("The request for the layer(s) was aborted.");
	    	private final String message;
	    	Disposition(String message){
	    		this.message = message;
	    	}
	    
	    public String message()   { return message; }
	    }*/


