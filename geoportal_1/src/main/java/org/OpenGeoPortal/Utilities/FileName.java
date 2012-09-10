package org.OpenGeoPortal.Utilities;

public class FileName {
	/**
	 * Processes the layer's Name so that it can be used as a file name
	 * @param layerName
	 * @return filtered name
	 */
	public static String filter(String layerName){
		layerName = layerName.trim();
		//remove the workspace name prefix if it exists
		if (layerName.contains(":")){
			layerName = layerName.substring(layerName.indexOf(":") + 1);
		}
		//replace periods with underscores
		layerName = layerName.replace(".", "_");
		return layerName;
	}
}
