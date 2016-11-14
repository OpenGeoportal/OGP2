package org.opengeoportal.config.proxy;

public interface ServerMapping {
	public String getType();
	public void setType(String type);

	public String getExternalUrl();
	public void setExternalUrl(String externalUrl);
}
