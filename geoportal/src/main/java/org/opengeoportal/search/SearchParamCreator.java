package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;

public interface SearchParamCreator {
    /***
     * Takes values from BasicSearchParams and converts them into a SolrQuery
     * @param searchParams
     * @return
     */
    SolrQuery solrFromBasicSearchParams(BasicSearchParams searchParams);

    /***
     * Takes values from AdvancedSearchParams and converts them into a SolrQuery
     * @param searchParams
     * @return
     */
    SolrQuery solrFromAdvancedSearchParams(AdvancedSearchParams searchParams);
}
