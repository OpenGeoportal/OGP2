package org.opengeoportal.export.arcgisonline;

/**
 * Created by cbarne02 on 6/29/15.
 */
public class ItemStatus {
    private boolean success;
    private String id;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
