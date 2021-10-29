package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.impl.LBHttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.params.MapSolrParams;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
class SearchClientImpl implements SearchClient {
    @Value("${solrUrl}")
    private final List<String> solrUrl;

    private SolrClient solrClient;

    SearchClientImpl(List<String> solrUrl) {
        this.solrUrl = solrUrl;
    }

    @PostConstruct
    void buildSolrClient() throws SolrServerException {
        if (solrUrl.size() == 0){
            // throw an error
            throw new SolrServerException("No solr url specified");
        } else if (solrUrl.size() == 1) {
            solrClient = new HttpSolrClient.Builder(solrUrl.get(0))
                    .withConnectionTimeout(10000)
                    .withSocketTimeout(60000)
                    .build();
        } else {
            LBHttpSolrClient.Builder builder = new LBHttpSolrClient.Builder();
            for (String url: solrUrl){
                builder.withBaseSolrUrl(url);
            }
            solrClient = builder
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
        List<String> cleanedList = new ArrayList<>();
        for (String layerId: layerIds) {
            cleanedList.add(ClientUtils.escapeQueryChars(layerId.trim()));
        }
        return "LayerId:" + String.join(" OR ", cleanedList);
    }

    @Override
    public Map<String,String> createOGPLayerIdParams(List<String> layerIds){
        String queryString = this.createLayerIdQueryString(layerIds);
        final Map<String, String> queryParamMap = new HashMap<>();
        queryParamMap.put("q", queryString);
        queryParamMap.put("fl", OGPRecord.getFieldList());
        return queryParamMap;
    }

    @Override
    public String createNameQueryString(String name) {
        return "Name: " + ClientUtils.escapeQueryChars(name.trim());
    }
}
