package org.opengeoportal.config.ogp;


public interface OgpConfigRetriever {

	OgpConfig getConfig();

	String getPropertyWithDefault(String propertyName,
			String defaultPropertyValue);

}
