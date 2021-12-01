package org.opengeoportal.search;

import java.util.ArrayList;
import java.util.List;

public class AdvancedSearchParams extends BaseSearchParams {
    boolean ignoreSpatial = false;
    boolean includeRestricted = false;
    String keyword = "";
    String dateFrom = "";
    String dateTo = "";
    List<String> dataTypes = new ArrayList<>();
    List<String> repositories = new ArrayList<>();
    String originator = "";
    String publisher = "";

    public boolean isIgnoreSpatial() {
        return ignoreSpatial;
    }

    public void setIgnoreSpatial(boolean ignoreSpatial) {
        this.ignoreSpatial = ignoreSpatial;
    }

    public boolean isIncludeRestricted() {
        return includeRestricted;
    }

    public void setIncludeRestricted(boolean includeRestricted) {
        this.includeRestricted = includeRestricted;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public String getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(String dateFrom) {
        this.dateFrom = dateFrom;
    }

    public String getDateTo() {
        return dateTo;
    }

    public void setDateTo(String dateTo) {
        this.dateTo = dateTo;
    }

    public List<String> getDataTypes() {
        return dataTypes;
    }

    public void setDataTypes(List<String> dataTypes) {
        this.dataTypes = dataTypes;
    }

    public List<String> getRepositories() {
        return repositories;
    }

    public void setRepositories(List<String> repositories) {
        this.repositories = repositories;
    }

    public String getOriginator() {
        return originator;
    }

    public void setOriginator(String originator) {
        this.originator = originator;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    public String getIsoTopic() {
        return isoTopic;
    }

    public void setIsoTopic(String isoTopic) {
        this.isoTopic = isoTopic;
    }

    String isoTopic;
}
