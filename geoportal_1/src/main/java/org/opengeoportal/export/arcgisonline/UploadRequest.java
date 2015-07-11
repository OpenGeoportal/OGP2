package org.opengeoportal.export.arcgisonline;

import java.io.File;

/**
 * Created by cbarne02 on 6/29/15.
 */
public class UploadRequest {
    private String title;
    private String type;
    private String extent;
    private String description;
    private String tags;
    private File data;
    //private String url;


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

    public String getExtent() {
        return extent;
    }

    public void setExtent(String extent) {
        this.extent = extent;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public File getData() {
        return data;
    }

    public void setData(File data) {
        this.data = data;
    }
}
