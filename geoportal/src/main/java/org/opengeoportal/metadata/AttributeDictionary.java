package org.opengeoportal.metadata;

import java.util.Map;

/**
 * Created by cbarne02 on 6/5/15.
 */
public class AttributeDictionary {
    private String layerId;
    private String title;
    private Map<String, String> attributeTable;

    public String getLayerId() {
        return layerId;
    }

    public void setLayerId(String layerId) {
        this.layerId = layerId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Map<String, String> getAttributeTable() {
        return attributeTable;
    }

    public void setAttributeTable(Map<String, String> attributeTable) {
        this.attributeTable = attributeTable;
    }
}
