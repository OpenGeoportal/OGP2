package org.opengeoportal.service;

import org.apache.solr.client.solrj.SolrQuery;
import org.opengeoportal.search.MetadataRecord;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.search.PortalSearchResponse;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;

import java.util.List;

public interface SearchService {
    /***
     * method for searching index for OGP layer records
     * @param solrQuery Map of search parameters
     * @return
     * @throws SearchServerException
     */
    PortalSearchResponse searchPortal(SolrQuery solrQuery) throws SearchServerException;

    /***
     * method for finding OGP records by LayerIds
     * @param layerIds list of LayerId's
     * @return
     * @throws SearchServerException
     */
    List<? extends OGPRecord> findRecordsById(List<String> layerIds) throws SearchServerException;

    /***
     * Returns a list of OGPRecords by LayerIds. Records that the user is not allowed to download are filtered out.
     * @param layerIds list of LayerId's
     * @return
     * @throws SearchServerException
     */
    List<? extends OGPRecord> findAllowedRecordsById(List<String> layerIds) throws SearchServerException;

    /***
     * find an OGP record by LayerId. throws an exception if a layer is not found.
     * @param layerId OGP LayerId
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    OGPRecord findRecordById(String layerId) throws LayerNotFoundException, SearchServerException;

    /***
     * find an OGP record by Name. throws an exception if a record is not found
     * @param name OGP Name
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    OGPRecord findRecordByName(String name) throws LayerNotFoundException, SearchServerException;

    /***
     * find a MetadataRecord by LayerId. Used to generate XML metadata documents.
     * @param layerId OGP LayerId
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    MetadataRecord findMetadataRecordById(String layerId) throws LayerNotFoundException, SearchServerException;

    /***
     * find a MetadataRecord by Name. Used to generate XML metadata documents.
     * @param name OGP Name
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    MetadataRecord findMetadataRecordByName(String name) throws LayerNotFoundException, SearchServerException;

    /***
     * Do a terms search. Used to support autocomplete functions.
     * @param field
     * @param query
     * @return
     * @throws SearchServerException
     */
    List<String> findTerms(String field, String query) throws SearchServerException;
}
