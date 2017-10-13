package org.opengeoportal.config.clientoptions.domain;

/**
 * object to contain info about iso topics needed by the client
 *
 * @author cbarne02
 */
public class TopicsConfig {

    String value;
    String displayName;


    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }


}
