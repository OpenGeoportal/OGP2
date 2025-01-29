package org.opengeoportal.ogc;

import org.opengeoportal.config.exception.ConfigException;
import org.opengeoportal.search.OGPRecord;

public interface OgcInfoRequester {

	AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord) throws Exception, ConfigException;

    AugmentedSolrRecord getOgcAugment(OGPRecord ogpRecord, String owsUrl)
			throws Exception;

}
