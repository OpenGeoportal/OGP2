package org.OpenGeoPortal.Authentication;

public enum OgpRoles {
	ANONYMOUS_USER ("Unauthenticated user"),
    LOCALLY_AUTHENTICATED_USER ("Locally authenticated user"),
    ADMINISTRATOR ("OGP Administrator");

    private final String description;
    OgpRoles(String description) {
        this.description = description;
    }
    public String description()   { return description; }
}
