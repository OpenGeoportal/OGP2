package org.opengeoportal.export.arcgisonline;

/**
 * Created by cbarne02 on 6/29/15.
 */
public class TokenRequest {
    private String username;
    private String password;
    private String referer;

    public TokenRequest(String username, String password, String referer) {
        this.username = username;
        this.password = password;
        this.referer = referer;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getReferer() {
        return referer;
    }

    public void setReferer(String referer) {
        this.referer = referer;
    }
}
