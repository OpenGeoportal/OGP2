package org.opengeoportal.config.ogp;


public interface OgpConfigRetriever {

	OgpConfig getConfig();

	OgpConfig load() throws Exception;

	String getPropertyWithDefault(String propertyName,
			String defaultPropertyValue);

}
