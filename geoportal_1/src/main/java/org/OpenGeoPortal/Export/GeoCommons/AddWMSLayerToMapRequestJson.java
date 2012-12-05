package org.OpenGeoPortal.Export.GeoCommons;

import org.codehaus.jackson.annotate.JsonProperty;

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
