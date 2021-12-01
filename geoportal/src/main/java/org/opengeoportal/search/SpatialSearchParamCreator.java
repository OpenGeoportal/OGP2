package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;

public interface SpatialSearchParamCreator {
    /***
     * Adds spatial search parameters to the SolrQuery. Used for both Basic and Advanced portal queries.
     * @param solrQuery
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @param centerX
     * @param centerY
     */
    void addSpatialSearchParams(SolrQuery solrQuery, Double minx, Double miny, Double maxx, Double maxy,
                                Double centerX, Double centerY);
}
