package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

class SpatialSearchParamCreatorImplTest {

    SpatialSearchParamCreatorImpl paramCreator;

    @BeforeEach
    public void setupSpatialSearchParamCreator() {
        paramCreator = new SpatialSearchParamCreatorImpl();
        paramCreator.setLayerMatchesScaleBoost(20.0);
        paramCreator.setLayerAreaIntersectionBoost(21.0);
        paramCreator.setLayerMatchesCenterBoost(22.0);
        paramCreator.setLayerWithinMapBoost(23.0);
    }

    /***
     * Test that proper boost functions are added
     */
    @Test
    void addSpatialSearchParamsBfTest() {
        SolrQuery solrQuery = new SolrQuery();
        Double minx = -180.0;
        Double miny = -90.0;
        Double maxx = 180.0;
        Double maxy = 90.0;
        Double centerx = 0.0;
        Double centery = 0.0;
        paramCreator.addSpatialSearchParams(solrQuery, minx, miny,
                maxx, maxy, centerx, centery);

        String[] boostFunctions = solrQuery.getParams("bf");

        assertThat(boostFunctions).containsAll(Stream.of(
                "recip(sum(abs(sub(Area,64800.0)),.01),1,1000,1000)^20.0",
                "sum(recip(abs(sub(product(sum(MinX,MaxX),.5),0.0)),1,1000,1000),recip(abs(sub(product(sum(MinY,MaxY),.5),0.0)),1,1000,1000))^22.0",
                "product(sum(map(sum(map(sub(-90.0,MinX),0,400,1,0),map(sub(-90.0,MaxX),-400,0,1,0),map(sub(-45.0,MinY),0,400,1,0),map(sub(-45.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(-90.0,MinX),0,400,1,0),map(sub(-90.0,MaxX),-400,0,1,0),map(sub(0.0,MinY),0,400,1,0),map(sub(0.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(-90.0,MinX),0,400,1,0),map(sub(-90.0,MaxX),-400,0,1,0),map(sub(45.0,MinY),0,400,1,0),map(sub(45.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(0.0,MinX),0,400,1,0),map(sub(0.0,MaxX),-400,0,1,0),map(sub(-45.0,MinY),0,400,1,0),map(sub(-45.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(0.0,MinX),0,400,1,0),map(sub(0.0,MaxX),-400,0,1,0),map(sub(0.0,MinY),0,400,1,0),map(sub(0.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(0.0,MinX),0,400,1,0),map(sub(0.0,MaxX),-400,0,1,0),map(sub(45.0,MinY),0,400,1,0),map(sub(45.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(90.0,MinX),0,400,1,0),map(sub(90.0,MaxX),-400,0,1,0),map(sub(-45.0,MinY),0,400,1,0),map(sub(-45.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(90.0,MinX),0,400,1,0),map(sub(90.0,MaxX),-400,0,1,0),map(sub(0.0,MinY),0,400,1,0),map(sub(0.0,MaxY),-400,0,1,0)),4,4,1,0),map(sum(map(sub(90.0,MinX),0,400,1,0),map(sub(90.0,MaxX),-400,0,1,0),map(sub(45.0,MinY),0,400,1,0),map(sub(45.0,MaxY),-400,0,1,0)),4,4,1,0)),0.1111111111111111)^21.0",
                "if(and(exists(MinX),exists(MaxX),exists(MinY),exists(MaxY)),map(sum(map(MinX,-180.0,180.0,1,0),map(MaxX,-180.0,180.0,1,0),map(MinY,-90.0,90.0,1,0),map(MaxY,-90.0,90.0,1,0)),4,4,1,0),0)^23.0")
                .collect(Collectors.toCollection(ArrayList::new)));

    }

    /***
     * Test that added boost functions don't overwrite existing one
     */
    @Test
    void addSpatialSearchParamsBfNoOverwriteTest() {
        SolrQuery solrQuery = new SolrQuery();

        String existingBf = "recip(ms(NOW,ContentDate),3.16e-11,1,1)";
        solrQuery.set("bf", existingBf);

        Double minx = -180.0;
        Double miny = -90.0;
        Double maxx = 180.0;
        Double maxy = 90.0;
        Double centerx = 0.0;
        Double centery = 0.0;
        paramCreator.addSpatialSearchParams(solrQuery, minx, miny,
                maxx, maxy, centerx, centery);

        String[] boostFunctions = solrQuery.getParams("bf");

        assertThat(boostFunctions).contains(existingBf);

    }

    /**
     * Test that intersection filter is added
     */
    @Test
    void addSpatialSearchParamsFqTest() {
        SolrQuery solrQuery = new SolrQuery();
        Double minx = -180.0;
        Double miny = -90.0;
        Double maxx = 180.0;
        Double maxy = 90.0;
        Double centerx = 0.0;
        Double centery = 0.0;
        paramCreator.addSpatialSearchParams(solrQuery, minx, miny,
                maxx, maxy, centerx, centery);

        String[] filterQueries = solrQuery.getParams("fq");

        assertThat(filterQueries).contains("{!frange l=0 incl=false cache=false}$intx");

    }

    /**
     * Test that intersection filter is added
     */
    @Test
    void addSpatialSearchParamsFqNoOverwriteTest() {
        SolrQuery solrQuery = new SolrQuery();

        String existingFilter = "Institution:Tufts";
        solrQuery.set("fq", existingFilter);

        Double minx = -180.0;
        Double miny = -90.0;
        Double maxx = 180.0;
        Double maxy = 90.0;
        Double centerx = 0.0;
        Double centery = 0.0;
        paramCreator.addSpatialSearchParams(solrQuery, minx, miny,
                maxx, maxy, centerx, centery);

        String[] filterQueries = solrQuery.getParams("fq");

        assertThat(filterQueries).contains(existingFilter);

    }

    /**
     * Test that intersection function is added
     */
    @Test
    void addSpatialSearchParamsIntxTest() {
        SolrQuery solrQuery = new SolrQuery();

        Double minx = -180.0;
        Double miny = -90.0;
        Double maxx = 180.0;
        Double maxy = 90.0;
        Double centerx = 0.0;
        Double centery = 0.0;
        paramCreator.addSpatialSearchParams(solrQuery, minx, miny,
                maxx, maxy, centerx, centery);

        String[] intxFunction = solrQuery.getParams("intx");

        // should only be one intx function
        assertThat(intxFunction.length).isEqualTo(1);
        assertThat(intxFunction[0]).isEqualTo("product(max(0,sub(min(180.0,MaxX),max(-180.0,MinX))),max(0,sub(min(90.0,MaxY),max(-90.0,MinY))))");

    }
}