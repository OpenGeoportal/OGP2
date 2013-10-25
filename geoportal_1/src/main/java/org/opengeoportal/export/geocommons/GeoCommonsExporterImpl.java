package org.opengeoportal.export.geocommons;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.opengeoportal.export.geocommons.GeoCommonsExportRequest.ExportStatus;
import org.opengeoportal.layer.BoundingBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.client.HttpClientErrorException;

public class GeoCommonsExporterImpl implements GeoCommonsExporter {
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private GeoCommonsClient geoCommonsClient;
	
	@Async
	@Override
	public void submitExportRequest(GeoCommonsExportRequest geoCommonsExportRequest) {
		geoCommonsExportRequest.setExportStatus(ExportStatus.PROCESSING);
		String username = geoCommonsExportRequest.getUsername();
    	geoCommonsClient.initializeClient(username, geoCommonsExportRequest.getPassword());
    	
    	try {
    		geoCommonsClient.checkUser(username);
    	} catch (HttpClientErrorException e){
			//response.sendError(500, "This request requires a valid GeoCommons username and password.");
    		//return;
    		//
    		geoCommonsExportRequest.setExportStatus(ExportStatus.FAILED);
    	}
    	Map<String, String> dataSetLocations = new HashMap<String, String>();
    	
    	for (String layer : geoCommonsExportRequest.getLayerIds()){
    		//System.out.println(layer);
    		logger.info("Attempting to add layer: " + layer);
    		try {
	    		BoundingBox bounds = new BoundingBox(-180.0, -90.0, 180.0, 90.0);
        		dataSetLocations.put(layer, this.geoCommonsClient.uploadWmsDataSet(layer));
    		} catch (Exception e){
    			logger.error("There was an error adding this data set to GeoCommons."); 
    		}
    	}
    	
    	//before we create a map, we need to check the status of the added data sets
    	List<DataSetStatus> dataSetStatusArray = new ArrayList<DataSetStatus>();
    		for (String layerId : dataSetLocations.keySet()){
    			DataSetStatus status = null;
    			String location = dataSetLocations.get(layerId);
    			try{
    				status = this.geoCommonsClient.checkDataSetStatus(location);
    			} catch (Exception e){
    				logger.warn("This layer is being skipped, as there is an error in checking the dataset status.");
    				
    				continue;
    			}
				long startTime = System.currentTimeMillis();
				long timeInterval = 3 * 60 * 1000; //3 minutes
    			while (status.getState().equalsIgnoreCase("processing")||status.getState().equalsIgnoreCase("parsed")){
    				long currentTime = System.currentTimeMillis();
    				//logger.info(Long.toString(currentTime - startTime));
    				if ((currentTime - startTime) > timeInterval){
    		    		logger.error("The layer[" + location + "] processing timed out with status: " + status.getState());
    					break;
    				}

    				try {
    					Thread.sleep(5000);
    				} catch (InterruptedException e) {
    					// TODO Auto-generated catch block
    					e.printStackTrace();
    				}
    				try {
						status = this.geoCommonsClient.checkDataSetStatus(location);
					} catch (Exception e) {
	    				logger.warn("This layer is being skipped, as there is an error in checking the dataset status.");

						e.printStackTrace();
						break;
					}

    			}
				logger.info("Final dataset status: " + status.getState());
				if(status.getState().equalsIgnoreCase("complete")||status.getState().equalsIgnoreCase("verified")){
					status.setOgpLayerId(layerId);
					dataSetStatusArray.add(status);
				} else {
					//notify the user via json response
				}
    		}

    	if (dataSetStatusArray.isEmpty()){
    		logger.warn("No info returned by dataset upload request.");
    		geoCommonsExportRequest.setExportStatus(ExportStatus.FAILED);
    		return;
    	} else {
    		
    		String mapId = null;
    		String basemap = geoCommonsExportRequest.getBasemap();
    		String bbox = geoCommonsExportRequest.getBbox();
    		String title = geoCommonsExportRequest.getTitle();
    		String description = geoCommonsExportRequest.getDescription();
    		try {
    			logger.info("attempting to create Map...");
    			
    			mapId = this.geoCommonsClient.createMap(basemap, bbox, title, description);
    		} catch (Exception e){
    			logger.error("Failed to create map with basemap: " + basemap + ",bbox: " + bbox + ",title:" + title + ",description: " + description);
        		geoCommonsExportRequest.setExportStatus(ExportStatus.FAILED);
    			return;
    		}

		
    		for (DataSetStatus successfulLayer : dataSetStatusArray){
    			logger.debug("attempting to add Layer: " + successfulLayer.getId());
    			try {
    				this.geoCommonsClient.addLayerToMap(mapId, successfulLayer);
    			} catch (Exception e){
    				logger.warn("Failed to add layer to map.");
    	    		geoCommonsExportRequest.setExportStatus(ExportStatus.FAILED);
    			}
    		}
    		
    		if (!geoCommonsExportRequest.getExportStatus().equals(ExportStatus.FAILED)){
    			geoCommonsExportRequest.setLocation("http://geocommons.com/maps/" + mapId);
    			geoCommonsExportRequest.setExportStatus(ExportStatus.SUCCESS);
    		}

    	}	
		
	}

}
