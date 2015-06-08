package org.opengeoportal.featureinfo;

import org.opengeoportal.solr.SolrRecord;
import org.springframework.ui.ModelMap;

public interface FeatureInfo {

	/**
	 * Retrieve feature information from a wms source.
     *
     * @param coord
     * @param bbox
     * @param srs
     * @param pixel
     * @param size
     * @param maxFeatures
	 * @return ModelMap the ModelMap contains an object with title, layerId, and
	 *         feature info. The feature info value is an array of models. Keys
	 *         are feature attribute labels and values are the attribute values
	 * @throws Exception
     */
    ModelMap getFeatureInformation(Double[] coord,
			Double[] bbox, String srs, Integer[] pixel, Integer[] size,
			int maxFeatures) throws Exception;

    void setSolrRecord(SolrRecord solrRecord);

	boolean hasInfoUrl();
	
	String getInfoUrl() throws Exception;
	
}
