package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

interface SearchClient {
    /***
     * Method used to search the index. Used for portal search.
     * @param solrQuery
     * @return
     * @throws SearchServerException
     */
    PortalSearchResponse ogpRecordSearch(SolrQuery solrQuery) throws SearchServerException;

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
     * Utility function to generate a simple solr filter from a List of strings
     * @param valueList
     * @param column
     * @param joiner
     * @return
     */
    static String createFilterFromList(List<String> valueList, String column, String joiner){
        // use a set to ensure there are no duplicates
        Set<String> cleanedList = new HashSet<>();
        for (String val: valueList) {
            cleanedList.add(column + ":" + ClientUtils.escapeQueryChars(val.trim()));
        }
        if (joiner.isEmpty()){
            joiner = "OR";
        }
        return String.join(" " + joiner + " ", cleanedList);
    }

    /***
     * Given a query string and field list string, builds a simple parameter map for a query
     * @param queryString
     * @param fieldList
     * @return
     */
    SolrQuery buildSimpleParams(String queryString, String fieldList);

    /***
     * Generates a query string to search for layers by Name
     * @param name
     * @return
     */
    String createNameQueryString(String name);
}
