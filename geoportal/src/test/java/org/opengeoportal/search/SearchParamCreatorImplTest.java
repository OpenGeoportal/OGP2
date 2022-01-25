package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.opengeoportal.config.PropertiesFile;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.ogp.OgpConfigRetrieverImpl;
import org.opengeoportal.config.repositories.RepositoryConfigRetriever;
import org.opengeoportal.config.repositories.RepositoryConfigRetrieverFromProperties;
import org.opengeoportal.config.search.SearchConfigRetrieverImpl;
import org.springframework.core.io.ClassPathResource;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

public class SearchParamCreatorImplTest {

    SearchParamCreatorImpl searchParamCreator;

    @BeforeEach
    void doSetup() {
        RepositoryConfigRetriever repositoryConfigRetriever = new RepositoryConfigRetrieverFromProperties(
                new SearchConfigRetrieverImpl(),
                new PropertiesFile(new ClassPathResource("repositories.properties")));
        OgpConfigRetriever ogpConfigRetriever = new OgpConfigRetrieverImpl();
        SpatialSearchParamCreator spatialSearchParamCreator = new SpatialSearchParamCreatorImpl();
        searchParamCreator = new SearchParamCreatorImpl(repositoryConfigRetriever,
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
            assertThat(institutionFilter).contains(institution);
        }
        assertThat(institutionFilter).doesNotContain(localInstitution);
    }

    @Test
    void createInstitutionAccessFilterBasicFilterTest() {
        List<String> institutionList = Arrays.asList("Tufts", "GMU", "Harvard", "MassGIS");
        String localInstitution = "Tufts";
        String institutionFilter = searchParamCreator.createInstitutionAccessFilter(institutionList, localInstitution);

        // Not sure that we can guarantee order, so just inspect the pieces
        assertThat(institutionFilter).contains("(Institution:MassGIS AND Access:Public)");
        assertThat(institutionFilter).contains("(Institution:Harvard AND Access:Public)");
        assertThat(institutionFilter).contains("Institution:Tufts");
        assertThat(institutionFilter).contains("(Institution:GMU AND Access:Public)");
        assertThat(institutionFilter).doesNotContain("(Institution:Tufts AND Access:Public)");

    }

    @Test
    void createSortingClauseDefaultBasicV2() {
        searchParamCreator.setSchemaVersion("OGPv2");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("score desc");
    }

    @Test
    void createSortingClauseDefaultAdvancedV2() {
        searchParamCreator.setSchemaVersion("OGPv2");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new AdvancedSearchParams();
        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("score desc");
    }

    @Test
    void createSortingClauseDefaultBasicV3() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("score desc");
    }

    @Test
    void createSortingClauseDefaultAdvancedV3() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new AdvancedSearchParams();
        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("score desc");
    }

    @Test
    void createSortingClauseNoSchemaVersion() {

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();

        Assertions.assertThrows(NullPointerException.class, () -> searchParamCreator.addSorting(solrQuery, searchParams));
    }

    @Test
    void createSortingClauseLayerDisplayName() {
        searchParamCreator.setSchemaVersion("OGPv2");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("LayerDisplayName");
        searchParams.setDirection("asc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("LayerDisplayNameSort asc");
    }

    @Test
    void createSortingClauseOriginatorV2() {
        searchParamCreator.setSchemaVersion("OGPv2");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Originator");
        searchParams.setDirection("asc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("OriginatorSort asc");
    }

    @Test
    void createSortingClausePublisherV2() {
        searchParamCreator.setSchemaVersion("OGPv2");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Publisher");
        searchParams.setDirection("asc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("PublisherSort asc");
    }

    @Test
    void createSortingClauseOriginatorV3Asc() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Originator");
        searchParams.setDirection("asc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("field(OriginatorSort, min) asc");
    }

    @Test
    void createSortingClausePublisherAscV3() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Publisher");
        searchParams.setDirection("asc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("field(PublisherSort, min) asc");
    }

    @Test
    void createSortingClauseOriginatorDescV3() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Originator");
        searchParams.setDirection("desc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("field(OriginatorSort, max) desc");
    }

    @Test
    void createSortingClausePublisherDescV3() {
        searchParamCreator.setSchemaVersion("OGPv3");

        SolrQuery solrQuery = new SolrQuery();
        OGPSearchParams searchParams = new BasicSearchParams();
        searchParams.setColumn("Publisher");
        searchParams.setDirection("desc");

        searchParamCreator.addSorting(solrQuery, searchParams);

        assertThat(solrQuery.getSortField()).isEqualTo("field(PublisherSort, max) desc");
    }
}