package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.ogp.OgpConfigRetrieverImpl;
import org.opengeoportal.config.search.SearchConfigRetriever;
import org.opengeoportal.config.search.SearchConfigRetrieverImpl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;

public class SearchParamCreatorImplTest {

    SearchParamCreatorImpl searchParamCreator;

    @BeforeEach
    void doSetup() {
        SearchConfigRetriever searchConfigRetriever = new SearchConfigRetrieverImpl();
        OgpConfigRetriever ogpConfigRetriever = new OgpConfigRetrieverImpl();
        SpatialSearchParamCreator spatialSearchParamCreator = new SpatialSearchParamCreatorImpl();
        searchParamCreator = new SearchParamCreatorImpl(searchConfigRetriever,
                ogpConfigRetriever, spatialSearchParamCreator);
    }

    @Test
    void addDateFilterBasicTest() {
        SolrQuery solrQuery = new SolrQuery();
        searchParamCreator.addDateFilter(solrQuery, "1990", "2013");

        String[] filters = solrQuery.getParams("fq");

        assertThat(filters).contains("ContentDate:[1990-01-01T01:01:01Z TO 2013-01-01T01:01:01Z]");
    }

    @Test
    void addDateFilterMissingToTest() {
        SolrQuery solrQuery = new SolrQuery();
        searchParamCreator.addDateFilter(solrQuery, "1990", "");

        String[] filters = solrQuery.getParams("fq");

        assertThat(filters).contains("ContentDate:[1990-01-01T01:01:01Z TO 9999-01-01T01:01:01Z]");
    }

    @Test
    void addDateFilterMissingFromTest() {
        SolrQuery solrQuery = new SolrQuery();
        searchParamCreator.addDateFilter(solrQuery, "", "2013");

        String[] filters = solrQuery.getParams("fq");

        assertThat(filters).contains("ContentDate:[-9999-01-01T01:01:01Z TO 2013-01-01T01:01:01Z]");
    }

    /***
     * ensure that date filter is not added if both date parameters are blank.
     */
    @Test
    void addDateFilterMissingBothTest() {
        SolrQuery solrQuery = new SolrQuery();
        String testFilter = "Institution:Tufts";
        solrQuery.set("fq", testFilter);
        searchParamCreator.addDateFilter(solrQuery, "", "");

        String[] filters = solrQuery.getParams("fq");

        assertThat(filters).containsOnly(testFilter);
    }

    @Test
    void addDateFilterNullDateTest() {
        SolrQuery solrQuery = new SolrQuery();
        String testFilter = "Institution:Tufts";
        solrQuery.set("fq", testFilter);
        searchParamCreator.addDateFilter(solrQuery, null, null);

        String[] filters = solrQuery.getParams("fq");

        assertThat(filters).containsOnly(testFilter);
    }

    @Test
    void parseDatesAndAddFilter() {
        SolrQuery solrQuery = new SolrQuery();

    }

    @Test
    void filterDateValueNullTest() {
        String filtered = searchParamCreator.filterDateValue(null);
        assertThat(filtered).isEqualTo("");
    }

    @Test
    void filterDateValueAlphaTest() {
        String filtered = searchParamCreator.filterDateValue("ABC");
        assertThat(filtered).isEqualTo("");
    }

    @Test
    void filterDateValueAlphaNumTest() {
        String filtered = searchParamCreator.filterDateValue("ABC123");
        assertThat(filtered).isEqualTo("");
    }

    @Test
    void filterDateValueNegativeTest() {
        String filtered = searchParamCreator.filterDateValue("-19");
        assertThat(filtered).isEqualTo("-0019");
    }

    @Test
    void createInstitutionAccessFilterLocalInstitutionNotAddedTest() {
        List<String> institutionList = List.of("Harvard", "GMU", "MassGIS");
        String localInstitution = "Tufts";
        String institutionFilter = searchParamCreator.createInstitutionAccessFilter(institutionList, localInstitution);
        for (String institution: institutionList) {
            assertThat(institutionFilter).contains(institution.toLowerCase());
        }
        assertThat(institutionFilter).doesNotContain(localInstitution.toLowerCase());
    }

    @Test
    void createInstitutionAccessFilterBasicFilterTest() {
        List<String> institutionList = Arrays.asList("Tufts", "GMU", "Harvard", "MassGIS");
        String localInstitution = "Tufts";
        String institutionFilter = searchParamCreator.createInstitutionAccessFilter(institutionList, localInstitution);

        // Not sure that we can guarantee order, so just inspect the pieces
        assertThat(institutionFilter).contains("(Institution:massgis AND Access:Public)");
        assertThat(institutionFilter).contains("(Institution:harvard AND Access:Public)");
        assertThat(institutionFilter).contains("Institution:tufts");
        assertThat(institutionFilter).contains("(Institution:gmu AND Access:Public)");
        assertThat(institutionFilter).doesNotContain("(Institution:tufts AND Access:Public)");

    }
}