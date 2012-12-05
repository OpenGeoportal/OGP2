package org.OpenGeoPortal.Export.GeoCommons;

import java.util.List;
import java.util.UUID;

import org.OpenGeoPortal.Download.Controllers.RequestStatusController.StatusSummary;

public class GeoCommonsExportRequest {
	String sessionId;
	UUID requestId;
	String username;
	String password; 
	String title;
	String description;
	String basemap;
	String bbox;
	List<String> layerIds;
	
	public UUID getRequestId() {
		return requestId;
	}

	public void setRequestId(UUID requestId) {
		this.requestId = requestId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getBasemap() {
		return basemap;
	}

	public void setBasemap(String basemap) {
		this.basemap = basemap;
	}

	public String getBbox() {
		return bbox;
	}

	public void setBbox(String bbox) {
		this.bbox = bbox;
	}

	public List<String> getLayerIds() {
		return layerIds;
	}

	public void setLayerIds(List<String> layerIds) {
		this.layerIds = layerIds;
	}

	public String getSessionId() {
		return sessionId;
	}

	public StatusSummary getStatusSummary() {
		// TODO Auto-generated method stub
		return null;
	}

}
