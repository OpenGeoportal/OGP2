package org.opengeoportal.ogc;

import org.opengeoportal.search.OGPRecord;

public interface AugmentedSolrRecordRetriever {

	OwsInfo getWmsInfo(String layerId) throws Exception;

	AugmentedSolrRecord getWmsPlusSolrInfo(String layerId) throws Exception;

	OwsInfo getOgcDataInfo(String layerId) throws Exception;

	AugmentedSolrRecord getOgcAugmentedSolrRecord(String layerId)
			throws Exception;

	AugmentedSolrRecord getOgcAugmentedSolrRecord(OGPRecord ogpRecord)
			throws Exception;

}
