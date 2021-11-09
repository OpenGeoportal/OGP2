package org.opengeoportal.ogc;

import org.opengeoportal.search.OGPRecord;

public interface OgcInfoRequester {

	AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord) throws Exception;

    AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord, String owsUrl)
			throws Exception;

}
