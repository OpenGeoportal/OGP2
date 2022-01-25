package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.request.QueryRequest;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.response.TermsResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.SolrDocumentList;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.net.URL;
import java.util.*;

@Component
class SearchClientImpl implements SearchClient {

    private final SearchConfigRetriever searchConfigRetriever;
    private SolrClient solrClient;

    @Value("${search.schema:OGPv2}")
    String schemaVersion;

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

        if (schemaVersion.equalsIgnoreCase("OGPv2")) {
            List<OGPRecordV2> records = response.getBeans(OGPRecordV2.class);
            return new PortalSearchResponse(records, start, records.size(), numFound);
        } else if (schemaVersion.equalsIgnoreCase("OGPv3")){
            List<OGPRecordV3> records = response.getBeans(OGPRecordV3.class);
            return new PortalSearchResponse(records, start, records.size(), numFound);
        } else {
            throw new SearchServerException("unsupported OGP schema version: " + schemaVersion);
        }
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
    public List<String> termSearch(String field, String queryString) throws SearchServerException {

        SolrQuery query = new SolrQuery();
        query.setRequestHandler("/terms");
        query.setTerms(true);
        query.addTermsField(field);
        query.setTermsRegex(".*" + queryString+ ".*");
        query.setTermsRegexFlag("case_insensitive");
        query.setTermsLimit(10);
        query.setTermsMinCount(1);
        query.setTermsSortString("count");

        logger.debug(query.toQueryString());

        QueryRequest request = new QueryRequest(query);
        List<TermsResponse.Term> terms;

        try {
            terms = request.process(solrClient).getTermsResponse().getTerms(field);
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
            throw new SearchServerException("The term search failed.");
        }

        List<String> termList = new ArrayList<>();
        terms.forEach(term -> {
            String matchedTerm = term.getTerm();
            int termCount = Math.toIntExact(term.getFrequency());
            logger.debug("matched term: " + matchedTerm + "[" + termCount + "]");
            termList.add(matchedTerm);
        });

        return termList;
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
