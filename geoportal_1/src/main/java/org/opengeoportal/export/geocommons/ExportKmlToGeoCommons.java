package org.opengeoportal.export.geocommons;

import java.net.URI;
import java.util.ArrayList;

public interface ExportKmlToGeoCommons {
	void initializeClient(String username, String password);
    String uploadKmlDataSet(String layerId);
	void createMap(ArrayList<String> locations, String basemap, String extent, String title, String description);
	URI getDataSetUri();
	void checkUser(String username);
	String createUser(String full_name, String login, String password, String password_confirmation, String email);
	String checkDataSetStatus(String location);

}
