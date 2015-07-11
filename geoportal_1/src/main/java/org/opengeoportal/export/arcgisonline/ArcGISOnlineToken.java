package org.opengeoportal.export.arcgisonline;

import java.util.Date;

/**
 * Created by cbarne02 on 6/29/15.
 */
public class ArcGISOnlineToken {
    private String token;
    private String expires;
    private boolean ssl;
    private Date expiry;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getExpires() {
        return expires;
    }

    public void setExpires(String expires) {
        this.expires = expires;
        expiry = new Date(Long.parseLong(expires) * 1000);
    }

    public Date getExpiry() {
        return expiry;
    }

    public boolean isSsl() {
        return ssl;
    }

    public void setSsl(boolean ssl) {
        this.ssl = ssl;
    }
}
