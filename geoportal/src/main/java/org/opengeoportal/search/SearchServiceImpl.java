package org.opengeoportal.search;

import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SearchServiceImpl implements SearchService {
    private static final Logger logger = LoggerFactory.getLogger(SearchServiceImpl.class);

    private final SearchClient searchClient;

    @Autowired
    SearchServiceImpl(SearchClient searchClient){
        this.searchClient = searchClient;
    }

    @Override
    public List<OGPRecord> searchPortal(Map<String, String> queryParams) throws SearchServerException {
        return searchClient.ogpRecordSearch(queryParams);
    }

    @Override
    public List<OGPRecord> findRecordsById(List<String> layerIds) throws SearchServerException {
        return searchClient.ogpRecordSearch(searchClient.createOGPLayerIdParams(layerIds));
    }

    @Override
    public OGPRecord findRecordById(String layerId) throws LayerNotFoundException, SearchServerException {

        List<OGPRecord> recordList = findRecordsById(List.of(layerId));
        if (recordList.isEmpty()){
            throw new LayerNotFoundException("Layer with id ['" + layerId.trim() + "'] not found in the search index.");
        } else {
            return recordList.get(0);
        }
    }

    @Override
    public MetadataRecord findMetadataRecordById(String layerId) throws LayerNotFoundException, SearchServerException {
        String queryString = this.searchClient.createLayerIdQueryString(List.of(layerId));
        return this.searchClient.metadataRecordSearch(queryString);
    }

    @Override
    public MetadataRecord findMetadataRecordByName(String name) throws LayerNotFoundException, SearchServerException {
        String queryString = this.searchClient.createNameQueryString(name);
        return this.searchClient.metadataRecordSearch(queryString);
    }



}
