package org.opengeoportal.config.proxy;

public class InternalServerMapping implements ServerMapping {
	String type;//wfs,wms,wcs...could be others
	String internalUrl;
	String externalUrl;
	String username;
	String password;
	
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getInternalUrl() {
		return internalUrl;
	}
	public void setInternalUrl(String internalUrl) {
		this.internalUrl = internalUrl;
	}
	public String getExternalUrl() {
		return externalUrl;
	}
	public void setExternalUrl(String externalUrl) {
		this.externalUrl = externalUrl;
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
}
