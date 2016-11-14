package org.opengeoportal.ogc;

import org.opengeoportal.solr.SolrRecord;

public interface OgcInfoRequester {

	AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord) throws Exception;

	AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord, String owsUrl)
			throws Exception;

}
