package org.opengeoportal.metadata;

import java.util.List;
import java.util.Set;

import org.apache.solr.client.solrj.SolrServer;
import org.opengeoportal.solr.SolrRecord;

public interface LayerInfoRetriever {
	public List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws Exception;
	SolrRecord getAllLayerInfo(String layerId) throws Exception;
	SolrServer getSolrServer();
	List<SolrRecord> fetchAllowedRecords(Set<String> layerIdSet) throws Exception;

}
