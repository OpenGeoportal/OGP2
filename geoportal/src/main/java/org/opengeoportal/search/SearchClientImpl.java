package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.SolrDocumentList;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.net.URL;
import java.util.*;

@Component
class SearchClientImpl implements SearchClient {

    private final SearchConfigRetriever searchConfigRetriever;
    private SolrClient solrClient;

    final Logger logger = LoggerFactory.getLogger(this.getClass());

    SearchClientImpl(SearchConfigRetriever searchConfigRetriever) {
        this.searchConfigRetriever = searchConfigRetriever;
    }

    @PostConstruct
    void buildSolrClient() throws SolrServerException {
        // get the url for the solr collection from the searchconfig object
        URL url = searchConfigRetriever.getSearchUrl();
        String solrUrl = url.toString();

        // remove /select from the end of the url
        if (solrUrl.contains("/select")){
            solrUrl = solrUrl.substring(0, solrUrl.indexOf("/select"));
        }

        logger.debug("creating Solr Server at " + solrUrl);

        if (solrUrl.length() == 0){
            // throw an error
            throw new SolrServerException("No solr url specified");
        } else {
            solrClient = new HttpSolrClient.Builder(solrUrl)
                    .withConnectionTimeout(10000)
                    .withSocketTimeout(60000)
                    .build();
        }
    }

    @Override
    public PortalSearchResponse ogpRecordSearch(SolrQuery solrQuery) throws SearchServerException {
        String attemptedParams = solrQuery.toQueryString();

        logger.debug("solr query: " + attemptedParams);

        QueryResponse response;
        try {
            response = this.solrClient.query(solrQuery);
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
            throw new SearchServerException("The search failed.");
        }
        assert response != null;
        SolrDocumentList results = response.getResults();
        int numFound = (int) results.getNumFound();
        int start = (int) results.getStart();
        List<OGPRecord> records = response.getBeans(OGPRecord.class);
        return new PortalSearchResponse(records, start, records.size(), numFound);
    }

    @Override
    public MetadataRecord metadataRecordSearch(String queryString) throws LayerNotFoundException, SearchServerException {

        SolrQuery solrQuery = new SolrQuery();
        solrQuery.set("q", queryString);
        solrQuery.set("fl", MetadataRecord.getFieldList());
        QueryResponse response;
        try {
            response = this.solrClient.query(solrQuery);
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
            throw new SearchServerException("The search failed.");
        }
        assert response != null;
        final List<MetadataRecord> recordList = response.getBeans(MetadataRecord.class);

        if (recordList.isEmpty()){
            throw new LayerNotFoundException("Layer with query ['" + queryString + "'] not found in the search index.");
        } else {
            return recordList.get(0);
        }
    }

    @Override
    public String createLayerIdQueryString(List<String> layerIds) {
        return SearchClient.createFilterFromList(layerIds, "LayerId", "OR");
    }


    @Override
    public SolrQuery buildSimpleParams(String queryString, String fieldList){
        SolrQuery solrQuery = new SolrQuery();
        solrQuery.set("q", queryString);
        solrQuery.set("fl", fieldList);
        return solrQuery;
    }

    @Override
    public String createNameQueryString(String name) {
        return "Name: " + ClientUtils.escapeQueryChars(name.trim());
    }
}
