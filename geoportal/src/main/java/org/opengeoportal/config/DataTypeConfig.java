package org.opengeoportal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "datatypes")
public class DataTypeConfig {
    private List<DatatypeItem> items;

    public List<DatatypeItem> getItems() {
        return items;
    }

    public void setItems(List<DatatypeItem> items) {
        this.items = items;
    }

    public static class DatatypeItem {

        String value;
        String displayName;
        String iconClass;
        Boolean selected;


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

        public String getIconClass() {
            return iconClass;
        }

        public void setIconClass(String iconClass) {
            this.iconClass = iconClass;
        }

        public Boolean getSelected() {
            return selected;
        }

        public void setSelected(Boolean selected) {
            this.selected = selected;
        }


    }
}
