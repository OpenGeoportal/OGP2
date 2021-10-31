package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.params.MapSolrParams;
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
        URL url = searchConfigRetriever.getInternalSearchUrl();
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
    public List<OGPRecord> ogpRecordSearch(Map<String, String> queryParams) throws SearchServerException {
        MapSolrParams solrParams = new MapSolrParams(queryParams);

        QueryResponse response;
        try {
            response = this.solrClient.query(solrParams);
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
            String attemptedParams = solrParams.toQueryString();
            throw new SearchServerException("The search failed.");
        }
        assert response != null;
        return response.getBeans(OGPRecord.class);
    }

    @Override
    public MetadataRecord metadataRecordSearch(String queryString) throws LayerNotFoundException, SearchServerException {
        final Map<String, String> queryParamMap = new HashMap<>();
        queryParamMap.put("q", queryString);
        queryParamMap.put("fl", MetadataRecord.getFieldList());
        MapSolrParams queryParams = new MapSolrParams(queryParamMap);

        QueryResponse response;
        try {
            response = this.solrClient.query(queryParams);
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
        // use a set to ensure there are no duplicates
        Set<String> cleanedList = new HashSet<>();
        for (String layerId: layerIds) {
            cleanedList.add(ClientUtils.escapeQueryChars(layerId.trim()));
        }
        return "LayerId:" + String.join(" OR ", cleanedList);
    }

    @Override
    public Map<String,String> buildSimpleParams(String queryString, String fieldList){
        final Map<String, String> queryParamMap = new HashMap<>();
        queryParamMap.put("q", queryString);
        queryParamMap.put("fl", fieldList);
        return queryParamMap;
    }

    @Override
    public String createNameQueryString(String name) {
        return "Name: " + ClientUtils.escapeQueryChars(name.trim());
    }
}
