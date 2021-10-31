package org.opengeoportal.service;

import org.opengeoportal.search.MetadataRecord;
import org.opengeoportal.search.OGPRecord;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.springframework.security.access.prepost.PostFilter;

import java.util.List;
import java.util.Map;

public interface SearchService {
    /***
     * method for searching index for OGP layer records
     * @param queryParams
     * @return
     * @throws SearchServerException
     */
    List<OGPRecord> searchPortal(Map<String, String> queryParams) throws SearchServerException;

    /***
     * method for finding OGP records by LayerIds
     * @param layerIds
     * @return
     * @throws SearchServerException
     */
    List<OGPRecord> findRecordsById(List<String> layerIds) throws SearchServerException;

    @PostFilter("hasPermission(filterObject, 'download')")
    List<OGPRecord> findAllowedRecordsById(List<String> layerIds) throws SearchServerException;

    /***
     * find an OGP record by LayerId. throws an exception if a layer is not found.
     * @param layerId
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    OGPRecord findRecordById(String layerId) throws LayerNotFoundException, SearchServerException;

    /***
     * find an OGP record by Name. throws an exception if a record is not found
     * @param name
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    OGPRecord findRecordByName(String name) throws LayerNotFoundException, SearchServerException;

    /***
     * find a MetadataRecord by LayerId. Used to generate XML metadata documents.
     * @param layerId
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    MetadataRecord findMetadataRecordById(String layerId) throws LayerNotFoundException, SearchServerException;

    /***
     * find a MetadataRecord by Name. Used to generate XML metadata documents.
     * @param name
     * @return
     * @throws LayerNotFoundException
     * @throws SearchServerException
     */
    MetadataRecord findMetadataRecordByName(String name) throws LayerNotFoundException, SearchServerException;
}
