package org.OpenGeoPortal.Solr;

import org.apache.solr.client.solrj.SolrServer;

public interface SolrClient {
	public SolrServer getSolrServer();
	public Boolean commit();
	public String delete(String[] layerIds) throws Exception;
	public Boolean verifyIngest(String layerId) throws Exception;
	public int add(SolrRecord solrRecord);

}
