package org.OpenGeoportal.Ogc;

import org.OpenGeoportal.Solr.SolrRecord;

public interface AugmentedSolrRecordRetriever {

	OwsInfo getWmsInfo(String layerId) throws Exception;

	AugmentedSolrRecord getWmsPlusSolrInfo(String layerId) throws Exception;

	OwsInfo getOgcDataInfo(String layerId) throws Exception;

	AugmentedSolrRecord getOgcAugmentedSolrRecord(String layerId)
			throws Exception;

	AugmentedSolrRecord getOgcAugmentedSolrRecord(SolrRecord solrRecord)
			throws Exception;

}
