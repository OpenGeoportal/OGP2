package org.opengeoportal.search;

import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;

import java.util.List;
import java.util.Map;

interface SearchClient {
    /***
     * Method used to search the index. Used for portal search.
     * @param queryParams
     * @return
     * @throws SearchServerException
     */
    List<OGPRecord> ogpRecordSearch(Map<String, String> queryParams) throws SearchServerException;

    /***
     * Method for retrieving a MetadataRecord from the search index. Used to get the metadata document for the record.
     * @param queryString
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    MetadataRecord metadataRecordSearch(String queryString) throws LayerNotFoundException, SearchServerException;

    /***
     * Generates a query string to search for layers by LayerId
     * @param layerIds  List of LayerIds to retrieve
     * @return
     */
    String createLayerIdQueryString(List<String> layerIds);

    /***
     * Generates a Map of parameters for a LayerId search to be used by ogpRecordSearch
     * @param layerIds
     * @return
     */
    Map<String,String> createOGPLayerIdParams(List<String> layerIds);

    /***
     * Generates a query string to search for layers by Name
     * @param name
     * @return
     */
    String createNameQueryString(String name);
}
