package org.opengeoportal.metadata;

import java.util.List;
import java.util.Set;

import org.apache.solr.client.solrj.SolrClient;
import org.opengeoportal.solr.SolrRecord;

public interface LayerInfoRetriever {

	List<SolrRecord> fetchAllLayerInfo(Set<String> layerIds) throws Exception;

	SolrRecord getAllLayerInfo(String layerId) throws Exception;

	SolrClient getSolrClient();

	List<SolrRecord> fetchAllowedRecords(Set<String> layerIdSet) throws Exception;

}
