package org.opengeoportal.config.proxy;

public interface ServerMapping {
    String getType();

    void setType(String type);

    String getExternalUrl();

    void setExternalUrl(String externalUrl);
}
