package org.opengeoportal.config.ogp;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.opengeoportal.config.ogp.OgpConfig.LoginConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class OgpConfigRetrieverImpl implements OgpConfigRetriever {
	
	//properties
	@Value("${apikey.analytics:}")
	private String analyticsKey;

	@Value("${apikey.gmaps:}")
	private String googleMapsApiKey;

	@Value("${ogp.pageTitle.primary:}")
	private String titlePrimary;

	@Value("${ogp.pageTitle.offset:}")
	private String titleOffset;

	@Value("${ogp.jsLocalized:}")
	private String extraJs;

	@Value("${ogp.cssLocalized:}")
	private String extraCss;

	@Value("${search.url:}")
	private String searchUrl;  // todo: where does this get used? if just in search client, then remove from here

	@Value("${login.repository}")
	private String loginRepository;

	@Value("${login.type}")
	private String loginType;

	@Value("${login.url:login}")
	private String loginUrl;

	@Value("${search.basic.showRestricted}")
	private String[] basicRestrictedRepositories;

	private OgpConfig ogpConfig;
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	
	@Override
	public OgpConfig getConfig() {
		return ogpConfig;
	} 

	@PostConstruct
	public OgpConfig load() throws Exception {
		ogpConfig = new OgpConfig();
		
		URL extUrl = null;
		//add /select, remove trailing slash
		if (searchUrl.endsWith("/")){
			searchUrl = searchUrl.substring(0, searchUrl.lastIndexOf("/"));
		}
		if (!searchUrl.endsWith("select")){
			searchUrl += "/select";
		}

		try{
			extUrl = new URL(searchUrl);
			ogpConfig.setSearchUrl(extUrl);
		} catch (MalformedURLException e){
			throw new Exception("Search URL is malformed!");
		}

		ogpConfig.setAnalyticsId(analyticsKey);

		ogpConfig.setGmapsAPIKey(googleMapsApiKey);

		ogpConfig.setPageTitlePrimary(titlePrimary);
	
		ogpConfig.setPageTitleOffset(titleOffset);
		
		ogpConfig.setJsLocalized(extraJs);
		
		ogpConfig.setCssLocalized(extraCss);

		ogpConfig.setBasicRestrictedRepositories(List.of(basicRestrictedRepositories));

		LoginConfig logConf = ogpConfig.getLoginConfig();
		
		//This should throw an error if LOGIN_REPOSITORY is not set properly
		if (StringUtils.isNotEmpty(loginRepository)){
			logConf.setRepositoryId(loginRepository);
		} else {
			throw new Exception("Must set a value for Login Repository!");
		}
		
		logConf.setType(loginType);
		
		logConf.setUrl(loginUrl);

		return ogpConfig;
	}

}
