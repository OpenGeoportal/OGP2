package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonProperty;


public class AddWMSLayerToMapRequestJson extends AddLayerToMapRequestJson{
	 //"visibleLayers": ["sde:GISPORTAL.GISOWNER01.CACENSUSTRACTS10"]
	@JsonProperty("visibleLayers")
	String[] visibleLayers;

	public String[] getVisibleLayers() {
		return visibleLayers;
	}

	public void setVisibleLayers(String[] visibleLayers) {
		this.visibleLayers = visibleLayers;
	}
}
