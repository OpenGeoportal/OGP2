package org.opengeoportal.config.clientoptions.domain;

import java.util.List;

public class OgpClientConfig {
    List<RepositoryConfig> repositories;
    List<BasemapConfig> basemaps;
    List<DatatypeConfig> datatypes;
    List<TopicsConfig> topics;

    public List<RepositoryConfig> getRepositories() {
        return repositories;
    }

    public void setRepositories(List<RepositoryConfig> repositories) {
        this.repositories = repositories;
    }

    public List<BasemapConfig> getBasemaps() {
        return basemaps;
    }

    public void setBasemaps(List<BasemapConfig> basemaps) {
        this.basemaps = basemaps;
    }

    public List<DatatypeConfig> getDatatypes() {
        return datatypes;
    }

    public void setDatatypes(List<DatatypeConfig> datatypes) {
        this.datatypes = datatypes;
    }

    public List<TopicsConfig> getTopics() {
        return topics;
    }

    public void setTopics(List<TopicsConfig> topics) {
        this.topics = topics;
    }


}
