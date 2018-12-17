package org.opengeoportal.config.clientoptions.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(value= JsonInclude.Include.NON_ABSENT)
public class BasemapConfig {

    String basemapId;
    String displayName;
    String attribution;
    Integer maxZoom;
    String url;
    @JsonProperty("default")
    Boolean defaultBasemap = false;

    // TODO: add bean validation to require this field
    @JsonProperty("type")
    String mapType;

    String subtype;

    String apikey;

    public String getBasemapId() {
        return basemapId;
    }

    public void setBasemapId(String id) {
        this.basemapId = id;
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

    public String getMapType() {
        return mapType;
    }

    public void setMapType(String mapType) {
        this.mapType = mapType;
    }

    public String getSubtype() {
        return subtype;
    }

    public void setSubtype(String subtype) {
        this.subtype = subtype;
    }

    public String getApikey() {
        return apikey;
    }

    public void setApikey(String apikey) {
        this.apikey = apikey;
    }
}
