package org.opengeoportal.controllers;

import org.apache.solr.client.solrj.SolrQuery;
import org.opengeoportal.search.AdvancedSearchParams;
import org.opengeoportal.search.BasicSearchParams;
import org.opengeoportal.search.PortalSearchResponse;
import org.opengeoportal.search.SearchParamCreator;
import org.opengeoportal.search.exception.SearchServerException;
import org.opengeoportal.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

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

    @GetMapping(value="advanced-search", produces = "application/json")
    public @ResponseBody PortalSearchResponse advancedSearch(AdvancedSearchParams searchParams) throws SearchServerException {

        SolrQuery solrQuery = searchParamCreator.solrFromAdvancedSearchParams(searchParams);
        return searchService.searchPortal(solrQuery);
    }
}
