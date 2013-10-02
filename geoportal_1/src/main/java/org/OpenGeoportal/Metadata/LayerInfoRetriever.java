package org.OpenGeoportal.Metadata;

import java.util.List;
import java.util.Set;

import org.OpenGeoportal.Solr.SolrRecord;
import org.apache.solr.client.solrj.SolrServer;

public interface LayerInfoRetriever {
	public List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws Exception;
	SolrRecord getAllLayerInfo(String layerId) throws Exception;
	SolrServer getSolrServer();

}
