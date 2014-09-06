package org.opengeoportal.config.ogp;

import java.net.URL;

/**
 * really a catch-all container for the other stuff the web app needs from config
 * @author cbarne02
 *
 */
public class OgpConfig {


	String pageTitlePrimary;
	String pageTitleOffset;
	String jsLocalized;
	String cssLocalized;
	URL searchUrl;
	String analyticsId;
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

	public class LoginConfig {
		String repositoryId;
		String type;
		String url;
		String secureDomain;
		
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
		public String getSecureDomain() {
			return secureDomain;
		}
		public void setSecureDomain(String secureDomain) {
			this.secureDomain = secureDomain;
		}
	}

}
