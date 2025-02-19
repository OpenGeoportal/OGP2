package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.opengeoportal.search.exception.LayerNotFoundException;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PostFilter;
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
    public PortalSearchResponse searchPortal(SolrQuery solrQuery) throws SearchServerException {
        return searchClient.ogpRecordSearch(solrQuery);
    }

    @Override
    public List<? extends OGPRecord> findRecordsById(List<String> layerIds) throws SearchServerException {
        String queryString = searchClient.createLayerIdQueryString(layerIds);
        PortalSearchResponse psr = searchClient.ogpRecordSearch(searchClient.buildSimpleParams(queryString, OGPRecord.getFieldList()));
        return psr.getDocs();
    }

    @Override
    @PostFilter("hasPermission(filterObject, 'download')")
    public List<? extends OGPRecord> findAllowedRecordsById(List<String> layerIds) throws SearchServerException {
        String queryString = searchClient.createLayerIdQueryString(layerIds);
        PortalSearchResponse psr = searchClient.ogpRecordSearch(searchClient.buildSimpleParams(queryString, OGPRecord.getFieldList()));
        return psr.getDocs();
    }

    @Override
    public OGPRecord findRecordById(String layerId) throws LayerNotFoundException, SearchServerException {

        List<? extends OGPRecord> recordList = findRecordsById(List.of(layerId));
        if (recordList.isEmpty()){
            throw new LayerNotFoundException("Layer with id ['" + layerId.trim() + "'] not found in the search index.");
        } else {
            return recordList.get(0);
        }
    }

    @Override
    public OGPRecord findRecordByName(String name) throws LayerNotFoundException, SearchServerException {
        String queryString = searchClient.createNameQueryString(name);
        PortalSearchResponse psr = searchClient.ogpRecordSearch(searchClient.buildSimpleParams(queryString, OGPRecord.getFieldList()));
        List<? extends OGPRecord> recordList = psr.getDocs();
        if (recordList.isEmpty()){
            throw new LayerNotFoundException("Layer with name ['" + name.trim() + "'] not found in the search index.");
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

    @Override
    public List<String> findTerms(String field, String query) throws SearchServerException {
        return searchClient.termSearch(field, query.trim());
    }

}
