package org.opengeoportal.search;

import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.opengeoportal.config.ogp.OgpConfigRetriever;
import org.opengeoportal.config.repositories.RepositoryConfig;
import org.opengeoportal.config.repositories.RepositoryConfigRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SearchParamCreatorImpl implements SearchParamCreator {

    final Logger logger = LoggerFactory.getLogger(SearchParamCreatorImpl.class);

    @Value("${search.basic.fields}")
    List<String> basicSearchFields;

    @Value("${search.advanced.fields}")
    List<String> advancedSearchFields;

    @Value("${search.schema:OGPv2}")
    String schemaVersion;

    final RepositoryConfigRetriever repositoryConfigRetriever;

    final OgpConfigRetriever ogpConfigRetriever;

    final SpatialSearchParamCreator spatialSearchParamCreator;

    @Autowired
    public SearchParamCreatorImpl(RepositoryConfigRetriever repositoryConfigRetriever,
                                  OgpConfigRetriever ogpConfigRetriever,
                                  SpatialSearchParamCreator spatialSearchParamCreator) {
        this.repositoryConfigRetriever = repositoryConfigRetriever;
        this.ogpConfigRetriever = ogpConfigRetriever;
        this.spatialSearchParamCreator = spatialSearchParamCreator;
    }

    @Override
    public SolrQuery solrFromBasicSearchParams(BasicSearchParams searchParams) {

        String queryString = searchParams.getWhat().strip();

        SolrQuery solrQuery = initializeQuery(searchParams, queryString);

        solrQuery.set("qf", String.join(" ", basicSearchFields));

        addSpatial(solrQuery, searchParams);

        addBasicInstitutionAccessFilter(solrQuery);

        return solrQuery;
    }

    @Override
    public SolrQuery solrFromAdvancedSearchParams(AdvancedSearchParams searchParams) {

        logger.debug("keyword: " + searchParams.getKeyword());
        logger.debug("sort: " + searchParams.getColumn() + " " + searchParams.getDirection());
        logger.debug("minx: " + searchParams.getMinX());
        logger.debug("originator: " +  searchParams.getOriginator());
        logger.debug("publisher:" + searchParams.getPublisher());
        logger.debug("repositories: " + searchParams.getRepositories());
        logger.debug("datatypes: " + searchParams.getDataTypes());
        logger.debug("date: " + searchParams.getDateFrom() + " " + searchParams.getDateTo());
        logger.debug("isoTopic" + searchParams.getIsoTopic());
        logger.debug("ignorespatial: " + searchParams.isIgnoreSpatial());
        logger.debug("include restricted: " + searchParams.isIncludeRestricted());

        // keyword populates the query
        String queryString = searchParams.getKeyword().strip();

        SolrQuery solrQuery = initializeQuery(searchParams, queryString);

        solrQuery.set("qf", String.join(" ", advancedSearchFields));

        // add spatial search params, unless spatial should be ignored
        if (!searchParams.isIgnoreSpatial()) {
            addSpatial(solrQuery, searchParams);
        }

        addAdvancedInstitutionAccessFilter(solrQuery, searchParams);

        if (!searchParams.getDataTypes().isEmpty()){
            addDataTypeFilter(solrQuery, searchParams.getDataTypes());
        }

        if (searchParams.getOriginator() != null && !searchParams.getOriginator().isBlank()) {
            addSimpleFilter(solrQuery, "Originator", searchParams.getOriginator());
        }

        if (searchParams.getPublisher() != null && !searchParams.getPublisher().isBlank()){
            addSimpleFilter(solrQuery, "Publisher", searchParams.getPublisher());
        }

        if (searchParams.getIsoTopic() != null && !searchParams.getIsoTopic().isBlank()) {
            addSimpleFilter(solrQuery, "ThemeKeywordsSynonymsIso", searchParams.getIsoTopic());
        }

        addDateFilter(solrQuery, searchParams.getDateFrom(), searchParams.getDateTo());

        return solrQuery;
    }

    /***
     * Initialize the SolrQuery and add shared parameters
     * @param searchParams
     * @param queryString
     * @return
     */
    SolrQuery initializeQuery(OGPSearchParams searchParams, String queryString) {
        if (queryString.isEmpty()) {
            queryString = "*";
        }

        SolrQuery solrQuery = new SolrQuery();
        solrQuery.setQuery(queryString);

        solrQuery.set("defType", "edismax")
                .set("fl", OGPRecord.getFieldList())
                .set("sow", true)
                .set("start", searchParams.getStart())
                .set("rows", searchParams.getRows());

        addSorting(solrQuery, searchParams);
        return solrQuery;
    }

    /***
     * Add a Solr filter that shows Public and Restricted layers for the local repository and
     * only Public layers for external repositories (institutions)
     * @param solrQuery
     */
    void addBasicInstitutionAccessFilter(SolrQuery solrQuery) {
        // get list of institutions that should be selected for search
        List<RepositoryConfig> repositories = repositoryConfigRetriever.getConfig();
        ArrayList<String> institutionList = new ArrayList<>();
        for (RepositoryConfig repo : repositories) {
            if (repo.getSelected()) {
                institutionList.add(repo.getShortName());
            }
        }

        String localRepository = ogpConfigRetriever.getConfig().getBasicRestrictedRepositories().get(0);
        solrQuery.add("fq", "{!tag=insf}" + createInstitutionAccessFilter(institutionList, localRepository));
    }

    /***
     * Add a Solr filter for selected repositories. Behaves similarly to the basic institution access filter,
     * but allows finer grained control over which repositories are filtered and whether restricted layers
     * are included.
     * @param solrQuery
     * @param searchParams
     */
    void addAdvancedInstitutionAccessFilter(SolrQuery solrQuery, AdvancedSearchParams searchParams) {
        List<String> institutionList = searchParams.getRepositories();
        String institutionFilter;
        if (searchParams.isIncludeRestricted()) {
            institutionFilter = SearchClient.createFilterFromList(institutionList, "Institution", "OR");
        } else {
            String localRepository = ogpConfigRetriever.getConfig().getBasicRestrictedRepositories().get(0);
            institutionFilter = createInstitutionAccessFilter(institutionList, localRepository);
        }

        solrQuery.add("fq", "{!tag=insf}" + institutionFilter);
    }

    /***
     * Add sorting parameters
     * @param solrQuery
     * @param searchParams
     */
    void addSorting(SolrQuery solrQuery, OGPSearchParams searchParams) {
        String sortCol = searchParams.getColumn().strip();
        String sortDir = searchParams.getDirection().strip();
        if (sortCol.isEmpty()) {
            sortCol = "score";
        }
        if (sortDir.isEmpty()) {
            sortDir = "desc";
        }

        if (sortCol.equalsIgnoreCase("LayerDisplayName")){
            sortCol = "LayerDisplayNameSort";
        } else if (sortCol.equalsIgnoreCase("Publisher")){
            sortCol = "PublisherSort";
        } else if (sortCol.equalsIgnoreCase("Originator")){
            sortCol = "OriginatorSort";
        }

        if (schemaVersion.equalsIgnoreCase("OGPv3")){
            if (sortCol.equalsIgnoreCase("PublisherSort") || sortCol.equalsIgnoreCase("OriginatorSort")){
                if (sortDir.equalsIgnoreCase("asc")) {
                    sortCol = "field(" + sortCol + ", min)";
                } else if (sortDir.equalsIgnoreCase("desc")){
                    sortCol = "field(" + sortCol + ", max)";
                }
            }
        }
        solrQuery.set("sort", sortCol + " " + sortDir);
    }

    /***
     * Add spatial search parameters
     * @param solrQuery
     * @param searchParams
     */
    void addSpatial(SolrQuery solrQuery, OGPSearchParams searchParams) {
        Double minx = searchParams.getMinX();
        Double miny = searchParams.getMinY();
        Double maxx = searchParams.getMaxX();
        Double maxy = searchParams.getMaxY();

        Double centerx = searchParams.getCenterX();
        Double centery = searchParams.getCenterY();

        // add spatial search parameters
        spatialSearchParamCreator.addSpatialSearchParams(solrQuery, minx, miny, maxx, maxy, centerx, centery);
    }

    /***
     * Creates a filter that shows only public records for selected institutions and all records for the local institution.
     * @param institutions
     * @param localInstitution
     * @return
     */
    String createInstitutionAccessFilter(List<String> institutions, String localInstitution) {
        // institutions should be list of selected institutions from application.properties. localInstitution should be the login institution
        // use a set to ensure there are no duplicates
        Set<String> cleanedList = new HashSet<>(institutions);
        boolean hasLocalInstitution = false;

        localInstitution = localInstitution.trim();
        String localMatch = "";
        for (String inst: cleanedList){
            if (inst.equalsIgnoreCase(localInstitution) && !inst.isBlank()) {
                hasLocalInstitution = true;
                localMatch = inst;
                break;
            }
        }
        if (!localMatch.isBlank()) {
            cleanedList.remove(localMatch);
        }

        Set<String> filterList = new HashSet<>();

        for (String val : cleanedList) {
            filterList.add("(Institution:" + (val.trim()) + " AND Access:Public)");
        }

        // don't add the local institution back in if it wasn't in the original institution list
        if (hasLocalInstitution) {
            filterList.add("Institution:" + localMatch);
        }

        return String.join(" OR ", filterList);
    }

    /***
     * adds a datatype filter to the SolrQuery. "Paper Map" is expanded to various values used in the wild if present.
     * @param solrQuery
     * @param datatypes
     */
    void addDataTypeFilter(SolrQuery solrQuery, List<String> datatypes) {
        // expand Paper Map value if present
        if (datatypes.contains("Paper Map")){
            datatypes.add("Scanned Map");
            datatypes.add("ScannedMap");
        }
        solrQuery.add("fq", "{!tag=dt}" + SearchClient.createFilterFromList(datatypes, "DataType", "OR"));
    }

    /***
     * Add a date range filter to the SolrQuery. Uses 'ContentDate' field.
     * @param solrQuery
     * @param dateFrom
     * @param dateTo
     */
    void addDateFilter(SolrQuery solrQuery, String dateFrom, String dateTo) {
        dateFrom = filterDateValue(dateFrom);
        dateTo = filterDateValue(dateTo);

        // don't add this filter if both values are empty
        if (dateFrom.isEmpty() && dateTo.isEmpty()){
            return;
        }

        String dateSuffix = "-01-01T01:01:01Z"; // per an ISO standard solr

        if (dateFrom.isEmpty()){
            dateFrom = "-9999";
        }

        if (dateTo.isEmpty()){
            dateTo = "9999";
        }

        dateFrom += dateSuffix;
        dateTo += dateSuffix;

        String dateRangeFilter = "ContentDate:[" + dateFrom + " TO " + dateTo + "]";
        logger.debug("adding date filter: " + dateRangeFilter);
        solrQuery.add("fq", dateRangeFilter);
    }


    String filterDateValue(String dateValue) {

        try {
            Integer numDateVal = Integer.parseInt(dateValue);
            if (numDateVal < -9999 || numDateVal > 9999) {
                return "";
            }
            // only 4 digit numbers allowed, so padding is required
            if (numDateVal < 0){
                // need an extra place for the negative sign
                return String.format("%05d", numDateVal);
            } else {
                return String.format("%04d", numDateVal);
            }

        } catch (NumberFormatException e){
            if (dateValue == null){
                dateValue = "";
            }
            logger.debug("filterDateValue threw NumberFormatException for: '" + dateValue + "'");
            return "";
        }
    }

    /***
     * adds a simple filter of the form field: queryValue to a SolrQuery
     * @param solrQuery
     * @param field
     * @param queryValue
     */
    private void addSimpleFilter(SolrQuery solrQuery, String field, String queryValue) {
        if (queryValue.trim().startsWith("\"") && queryValue.trim().endsWith("\"")){
            String queryString = field + ":" + queryValue.trim();
            solrQuery.add("fq", queryString);
        } else {
            String queryString = field + ":" + ClientUtils.escapeQueryChars(queryValue.trim());
            solrQuery.add("fq", queryString);
        }

    }

    public List<String> getBasicSearchFields() {
        return basicSearchFields;
    }

    public void setBasicSearchFields(List<String> basicSearchFields) {
        this.basicSearchFields = basicSearchFields;
    }

    public List<String> getAdvancedSearchFields() {
        return advancedSearchFields;
    }

    public void setAdvancedSearchFields(List<String> advancedSearchFields) {
        this.advancedSearchFields = advancedSearchFields;
    }

    public String getSchemaVersion() {
        return schemaVersion;
    }

    public void setSchemaVersion(String schemaVersion) {
        this.schemaVersion = schemaVersion;
    }
}
