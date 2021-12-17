package org.opengeoportal.featureinfo;

import org.opengeoportal.search.OGPRecord;
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
     * feature info. The feature info value is an array of models. Keys
     * are feature attribute labels and values are the attribute values
     * @throws Exception
     */
    ModelMap getFeatureInformation(Double[] coord,
                                   Double[] bbox, String srs, Integer[] pixel, Integer[] size,
                                   int maxFeatures) throws Exception;

    void setOGPRecord(OGPRecord ogpRecord);

    boolean hasInfoUrl();

    String getInfoUrl() throws Exception;

}
