package org.OpenGeoportal.Ogc;

import org.OpenGeoportal.Solr.SolrRecord;

public interface OgcInfoRequester {

	AugmentedSolrRecord getOgcAugment(String layerId) throws Exception;

	AugmentedSolrRecord getOgcAugment(String layerId, String owsUrl)
			throws Exception;

	AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord) throws Exception;

	AugmentedSolrRecord getOgcAugment(SolrRecord solrRecord, String owsUrl)
			throws Exception;

}
