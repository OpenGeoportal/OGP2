package org.OpenGeoportal.Metadata;

import java.util.List;
import java.util.Set;

import org.OpenGeoportal.Solr.SearchConfigRetriever;
import org.OpenGeoportal.Solr.SolrRecord;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrServer;
import org.apache.solr.client.solrj.impl.XMLResponseParser;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class SolrLayerInfoRetriever implements LayerInfoRetriever{
	private SolrServer solrServer;
	final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Autowired
	private SearchConfigRetriever searchConfigRetriever;

	@Override
	public SolrServer getSolrServer(){
		try {
			String url = searchConfigRetriever.getSearchUrl();
			url = url.substring(0, url.indexOf("/select"));
			//logger.info(url);
			HttpSolrServer httpServer = new HttpSolrServer(url);
			
			httpServer.setParser(new XMLResponseParser());
			this.solrServer = (SolrServer) httpServer;
			
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			logger.error("problem creating solr server");
		}
		return solrServer;
	}
	
	public List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws SolrServerException {
		SolrServer server = getSolrServer();
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
	    	response = server.query(queryObj);
	    } catch (Exception e){
	    	logger.error(e.getMessage());
	    }
	    //logger.info(response.getResults().get(0).getFieldValue("Name").toString());
	    List<SolrRecord> results = response.getBeans(SolrRecord.class);

		return results;
	}

	@Override
	public SolrRecord getAllLayerInfo(String layerId) throws SolrServerException {
		String query = "LayerId:" + layerId.trim();
	    SolrQuery queryObj = new SolrQuery();
	    queryObj.setQuery( query );
		List<SolrRecord> results = getSolrServer().query(queryObj).getBeans(SolrRecord.class);
		if(results.isEmpty()){
			throw new SolrServerException("Layer with id ['" + layerId.trim() + "'] not found in the Solr index.");
		} else {
			return results.get(0);
		}
	}

}
