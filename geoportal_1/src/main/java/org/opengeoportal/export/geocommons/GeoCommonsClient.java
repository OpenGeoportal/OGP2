package org.opengeoportal.export.geocommons;

import org.opengeoportal.layer.BoundingBox;

public interface GeoCommonsClient {
	void initializeClient(String username, String password);
    String uploadWmsDataSet(String layerId) throws Exception;
	String createMap(String basemap, String extent, String title, String description) throws Exception;
	void checkUser(String username);
	String createUser(String full_name, String login, String password, String password_confirmation, String email);
	DataSetStatus checkDataSetStatus(String location) throws Exception;
    void addLayerToMap(String mapId, DataSetStatus dataSetStatus) throws Exception;
	String uploadShapeFile(String layerId, BoundingBox bounds) throws Exception;


}
