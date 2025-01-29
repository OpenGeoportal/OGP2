package org.opengeoportal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;


@Configuration
@ConfigurationProperties(prefix = "topics")
public class TopicConfig {
    private List<TopicItem> items;

    public List<TopicItem> getItems() {
        return items;
    }

    public void setItems(List<TopicItem> items) {
        this.items = items;
    }

    public static class TopicItem {

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

}
