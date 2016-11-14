package org.opengeoportal.metadata;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Set;

import org.apache.http.client.HttpClient;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.impl.XMLResponseParser;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.solr.SolrRecord;
import org.opengeoportal.utilities.http.OgpHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.prepost.PostFilter;

public class SolrLayerInfoRetriever implements LayerInfoRetriever{
	private SolrClient solrClient = null;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;

	@Autowired
	@Qualifier("httpClient.pooling")
	OgpHttpClient ogpHttpClient;
	
	private void init() throws Exception {
		HttpClient httpClient = ogpHttpClient.getCloseableHttpClient();
		URL url = searchConfigRetriever.getInternalSearchUrl();
		String url$ = url.toString();
		
		if (url$.contains("select")){
			url$ = url$.substring(0, url$.indexOf("/select"));
		}
		logger.debug("creating SolrClient at " + url$);
		HttpSolrClient httpSolrClient = new HttpSolrClient.Builder(url$)
				.withHttpClient(httpClient).withResponseParser(new XMLResponseParser()).build();

		this.solrClient = httpSolrClient;
	}
	
	@Override
	public SolrClient getSolrClient() {
		if (solrClient == null) {
			try {
				init();
			} catch (Exception e) {
				logger.error("problem creating solr server");
			}
		}


		return solrClient;
	}
	
	//use Spring Security hasPermission expression 
	//use a filter to get a collection containing only layers the
	//user is authorized to download.
	@Override
	@PostFilter("hasPermission(filterObject, 'download')")
	public List<SolrRecord> fetchAllowedRecords(Set<String> layerIdSet) throws Exception{
		List<SolrRecord> allRecords = fetchAllLayerInfo(layerIdSet);
		return allRecords;
	}
	
	public List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws SolrServerException {
		SolrClient solrClient = getSolrClient();
		String query = "";
		for (String layerId : layerIds){
			logger.debug(layerId);
			query += "LayerId:" + ClientUtils.escapeQueryChars(layerId.trim());
			query += " OR ";
		}
		if (query.length() > 0){
			query = query.substring(0, query.lastIndexOf(" OR "));
		}
        /*ModifiableSolrParams params = new ModifiableSolrParams();
        params.set("q", query);

            QueryResponse response = server.query(params);*/
		logger.debug("Solr query terms: " + query);
	    SolrQuery queryObj = new SolrQuery();
	    queryObj.setQuery(query);
	    QueryResponse response = null;
	    try {
			response = solrClient.query(queryObj);
		} catch (Exception e){
	    	logger.error(e.getMessage());
	    }
	    //logger.info(response.getResults().get(0).getFieldValue("Name").toString());
	    List<SolrRecord> results = response.getBeans(SolrRecord.class);

		return results;
	}

	@Override
	public SolrRecord getAllLayerInfo(String layerId) throws SolrServerException, IOException {
		String query = "LayerId:" + ClientUtils.escapeQueryChars(layerId.trim());
	    SolrQuery queryObj = new SolrQuery();
	    queryObj.setQuery( query );
		List<SolrRecord> results = getSolrClient().query(queryObj).getBeans(SolrRecord.class);
		if(results.isEmpty()){
			throw new SolrServerException("Layer with id ['" + layerId.trim() + "'] not found in the Solr index.");
		} else {
			return results.get(0);
		}
	}

}
