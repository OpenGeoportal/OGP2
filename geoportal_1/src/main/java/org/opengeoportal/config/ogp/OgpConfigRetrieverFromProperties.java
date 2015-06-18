package org.opengeoportal.config.ogp;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Properties;

import org.apache.commons.lang.StringUtils;
import org.opengeoportal.config.PropertiesFile;
import org.opengeoportal.config.ogp.OgpConfig.LoginConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OgpConfigRetrieverFromProperties implements OgpConfigRetriever {
	
	//property keys
	private static final String ANALYTICS_KEY = "apikey.analytics";
	private static final String TITLE_PRIMARY = "ogp.pageTitle.primary";
	private static final String TITLE_OFFSET = "ogp.pageTitle.offset";
	private static final String EXTRA_JS = "ogp.jsLocalized";
	private static final String EXTRA_CSS = "ogp.cssLocalized";
	private static final String EXTERNAL_SEARCH_URL = "solr.url.external";
	private static final String LOGIN_REPOSITORY = "login.repository";
	private static final String LOGIN_TYPE = "login.type";
	private static final String LOGIN_URL = "login.url";
	private static final String SECURE_DOMAIN = "login.secureDomain";

	//default values
	private static final String TITLE_PRIMARY_DEFAULT = "";
	private static final String TITLE_OFFSET_DEFAULT = "";

	private static final String LOGIN_TYPE_DEFAULT = "form";
	private static final String LOGIN_URL_DEFAULT = "login";



	PropertiesFile propertiesFile;
	Properties props;
	OgpConfig ogpConfig;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	public PropertiesFile getPropertiesFile() {
		return propertiesFile;
	}

	public void setPropertiesFile(PropertiesFile propertiesFile) {
		this.propertiesFile = propertiesFile;
	}
	
	
	@Override
	public OgpConfig getConfig() {
		return ogpConfig;
	} 

	public void setOgpConfig(OgpConfig ogpConfig) {
		this.ogpConfig = ogpConfig;
	}
 
	@Override
	public OgpConfig load() throws Exception {
		props = propertiesFile.getProperties();
		
		ogpConfig = new OgpConfig();
		
		URL extUrl = null;
		if (props.containsKey(EXTERNAL_SEARCH_URL)){
			String extSearch = props.getProperty(EXTERNAL_SEARCH_URL);	
			//add /select, remove trailing slash		
			if (extSearch.endsWith("/")){
				extSearch = extSearch.substring(0, extSearch.lastIndexOf("/"));
			}
			if (!extSearch.endsWith("select")){
				extSearch += "/select";
			}
			
			try{
				extUrl = new URL(extSearch);
				ogpConfig.setSearchUrl(extUrl);
			} catch (MalformedURLException e){
				throw new Exception("External Search URL ['property " + EXTERNAL_SEARCH_URL + "'] is malformed!");
			}
		} else {
			throw new Exception("Must set a search URL!");
		}


		String analyticsKey = getPropertyWithDefault(ANALYTICS_KEY, "");
		ogpConfig.setAnalyticsId(analyticsKey);

		String pageTitlePrimary = getPropertyWithDefault(TITLE_PRIMARY, TITLE_PRIMARY_DEFAULT);
		ogpConfig.setPageTitlePrimary(pageTitlePrimary);
	
		String pageTitleOffset = getPropertyWithDefault(TITLE_OFFSET, TITLE_OFFSET_DEFAULT);
		ogpConfig.setPageTitleOffset(pageTitleOffset);
		
		String extraJs = getPropertyWithDefault(EXTRA_JS, "");
		ogpConfig.setJsLocalized(extraJs);
		
		String extraCss = getPropertyWithDefault(EXTRA_CSS, "");
		ogpConfig.setCssLocalized(extraCss);
		
		
		LoginConfig logConf = ogpConfig.getLoginConfig();
		
		//This should throw an error if LOGIN_REPOSITORY is not set properly
		String val = getPropertyWithDefault(LOGIN_REPOSITORY, "");
		if (StringUtils.isNotEmpty(val)){
			logConf.setRepositoryId(val);
		} else {
			throw new Exception("Must set a value for Login Repository! ['" + LOGIN_REPOSITORY + "']");
		}
		
		String typeVal = getPropertyWithDefault(LOGIN_TYPE, LOGIN_TYPE_DEFAULT);		
		logConf.setType(typeVal);
		
		String urlVal = getPropertyWithDefault(LOGIN_URL, LOGIN_URL_DEFAULT);		
		logConf.setUrl(urlVal);

		String sdVal = getPropertyWithDefault(SECURE_DOMAIN, "");        //should default to current domain with https:; for now let the client do this
		logConf.setSecureDomain(sdVal);


		return ogpConfig;
	}

	@Override
	public String getPropertyWithDefault(String propertyName, String defaultPropertyValue){
		String val = null;
		if (props.containsKey(propertyName) && StringUtils.isNotEmpty(props.getProperty(propertyName))){
			val = props.getProperty(propertyName);  //default to type form
		} else {
			
			logger.warn(propertyName + " not set.  Using default value '" + defaultPropertyValue + "'.");
			val = defaultPropertyValue;
		}
		
		return val;
	}

}
