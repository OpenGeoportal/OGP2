package org.opengeoportal.controllers;

import org.apache.solr.client.solrj.SolrQuery;
import org.opengeoportal.search.*;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.ArrayList;
import java.util.List;

@Controller
public class SearchController {
    final SearchService searchService;
    final SearchParamCreator searchParamCreator;

    final Logger logger = LoggerFactory.getLogger(SearchController.class);


    @Autowired
    public SearchController(SearchService searchService, SearchParamCreator searchParamCreator) {
        this.searchService = searchService;
        this.searchParamCreator = searchParamCreator;
    }

    @GetMapping(value="search", produces = "application/json")
    public @ResponseBody PortalSearchResponse basicSearch(BasicSearchParams searchParams) throws SearchServerException {

        SolrQuery solrQuery = searchParamCreator.solrFromBasicSearchParams(searchParams);
        return searchService.searchPortal(solrQuery);
    }

    @GetMapping(value="advancedSearch", produces = "application/json")
    public @ResponseBody PortalSearchResponse advancedSearch(AdvancedSearchParams searchParams) throws SearchServerException {

        SolrQuery solrQuery = searchParamCreator.solrFromAdvancedSearchParams(searchParams);
        return searchService.searchPortal(solrQuery);
    }

    @GetMapping(value="searchByIds", produces = "application/json")
    public @ResponseBody List<? extends OGPRecord> queryById(@RequestParam("layerIds") List<String> layerIdList) throws SearchServerException {
        return searchService.findRecordsById(layerIdList);
    }

    @GetMapping(value="terms", produces = "application/json")
    public @ResponseBody List<String> getTerms(@RequestParam("term") String term, @RequestParam("field") String field) {
        if (term != null && !term.isBlank() && term.trim().length() >= 2) {
            try {
                return searchService.findTerms(field, term);
            } catch (SearchServerException e) {
                e.printStackTrace();
                logger.error(e.getMessage());

            }
        }
        // return an empty list if there is a problem.
        return new ArrayList<>();
    }
}
