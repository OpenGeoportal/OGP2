package org.opengeoportal.ogc.wms;

import org.springframework.ui.ModelMap;

public interface WmsGetFeatureInfo {

	/**
	 * Retrieve feature information from a wms source.
	 * 
	 * @param layerId
	 * @param xCoord
	 * @param yCoord
	 * @param bbox
	 * @param height
	 * @param width
	 * @param maxFeatures
	 * @return ModelMap the ModelMap contains an object with title, layerId, and
	 *         feature info. The feature info value is an array of models. Keys
	 *         are feature attribute labels and values are the attribute values
	 * @throws Exception
	 */
	ModelMap getFeatureInformation(String layerId, String xCoord,
			String yCoord, String bbox, String height, String width,
			int maxFeatures) throws Exception;

}
