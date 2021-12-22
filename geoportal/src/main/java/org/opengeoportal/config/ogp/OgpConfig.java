package org.opengeoportal.config.ogp;

import java.net.URL;
import java.util.List;

public class OgpConfig {
/*
 * really a catch-all for the other stuff the web app needs.
 * 
 * 
 */

	String pageTitlePrimary;
	String pageTitleOffset;
	String jsLocalized;
	String cssLocalized;
	URL searchUrl;
	List<String> basicRestrictedRepositories;
	String analyticsId;
	String gmapsAPIKey;
	LoginConfig loginConfig = new LoginConfig();
	
	public String getPageTitlePrimary() {
		return pageTitlePrimary;
	}

	public void setPageTitlePrimary(String pageTitle) {
		this.pageTitlePrimary = pageTitle;
	}
	
	public String getPageTitleOffset() {
		return pageTitleOffset;
	}

	public void setPageTitleOffset(String pageTitleOffset) {
		this.pageTitleOffset = pageTitleOffset;
	}

	public String getJsLocalized() {
		return jsLocalized;
	}

	public void setJsLocalized(String jsLocalized) {
		this.jsLocalized = jsLocalized;
	}

	public String getCssLocalized() {
		return cssLocalized;
	}

	public void setCssLocalized(String cssLocalized) {
		this.cssLocalized = cssLocalized;
	}

	public URL getSearchUrl() {
		return searchUrl;
	}

	public void setSearchUrl(URL searchUrl) {
		this.searchUrl = searchUrl;
	}

	public String getAnalyticsId() {
		return analyticsId;
	}

	public void setAnalyticsId(String analyticsId) {
		this.analyticsId = analyticsId;
	}

	public LoginConfig getLoginConfig() {
		return loginConfig;
	}

	public void setLoginConfig(LoginConfig loginConfig) {
		this.loginConfig = loginConfig;
	}

	public String getGmapsAPIKey() {
		return gmapsAPIKey;
	}

	public void setGmapsAPIKey(String gmapsAPIKey) {
		this.gmapsAPIKey = gmapsAPIKey;
	}

	public List<String> getBasicRestrictedRepositories() {
		return basicRestrictedRepositories;
	}

	public void setBasicRestrictedRepositories(List<String> basicRestrictedRepositories) {
		this.basicRestrictedRepositories = basicRestrictedRepositories;
	}

	public class LoginConfig {
		String repositoryId;
		String type;
		String url;

		public String getRepositoryId() {
			return repositoryId;
		}
		public void setRepositoryId(String repositoryId) {
			this.repositoryId = repositoryId;
		}
		public String getType() {
			return type;
		}
		public void setType(String type) {
			this.type = type;
		}
		public String getUrl() {
			return url;
		}
		public void setUrl(String url) {
			this.url = url;
		}
	}

}
