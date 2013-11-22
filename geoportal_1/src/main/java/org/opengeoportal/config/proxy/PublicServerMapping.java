package org.opengeoportal.config.proxy;

public class PublicServerMapping implements ServerMapping {
	String type;//wfs,wms,wcs...could be others
	String externalUrl;

	
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}

	public String getExternalUrl() {
		return externalUrl;
	}
	public void setExternalUrl(String externalUrl) {
		this.externalUrl = externalUrl;
	}

}
