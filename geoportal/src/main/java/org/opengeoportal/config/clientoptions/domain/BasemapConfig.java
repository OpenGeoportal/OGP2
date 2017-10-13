package org.opengeoportal.config.clientoptions.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(value= JsonInclude.Include.NON_ABSENT)
public class BasemapConfig {

    String id;
    String displayName;
    String attribution;
    Integer maxZoom;
    String url;
    @JsonProperty("default")
    Boolean defaultBasemap = false;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAttribution() {
        return attribution;
    }

    public void setAttribution(String attribution) {
        this.attribution = attribution;
    }

    public Integer getMaxZoom() {
        return maxZoom;
    }

    public void setMaxZoom(Integer maxZoom) {
        this.maxZoom = maxZoom;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Boolean getDefaultBasemap() {
        return defaultBasemap;
    }

    public void setDefaultBasemap(Boolean defaultBasemap) {
        this.defaultBasemap = defaultBasemap;
    }
}
