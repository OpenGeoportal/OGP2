package org.opengeoportal.export.arcgisonline;

import java.util.List;

/**
 * Created by cbarne02 on 6/29/15.
 */

/*

{"username" : "csbarnett","total" : 10,"start" : 1,"num" : 10,"nextStart" : -1,
"currentFolder" :null,
"items" : [
 */
public class Content {
    private String username;
    private List<Item> items;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public class Item {
        String id;
        String owner;
        String created;
        String modified;
        String name;
        String title;
        String type;
        Long[][] extent; //extent":[[-71.19083588620636,42.2278898364225],[-70.87486336648546,42.393413691090814]]

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getOwner() {
            return owner;
        }

        public void setOwner(String owner) {
            this.owner = owner;
        }

        public String getCreated() {
            return created;
        }

        public void setCreated(String created) {
            this.created = created;
        }

        public String getModified() {
            return modified;
        }

        public void setModified(String modified) {
            this.modified = modified;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Long[][] getExtent() {
            return extent;
        }

        public void setExtent(Long[][] extent) {
            this.extent = extent;
        }
    }

}
