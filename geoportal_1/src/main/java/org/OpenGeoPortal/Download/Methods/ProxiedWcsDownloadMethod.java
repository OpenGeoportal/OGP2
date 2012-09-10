package org.OpenGeoPortal.Download.Methods;

public class ProxiedWcsDownloadMethod extends WcsDownloadMethod
		implements PerLayerDownloadMethod {
	private String proxyTo;
	@Override
	public String getUrl(){
		return this.proxyTo;
	}
	public String getProxyTo() {
		return proxyTo;
	}
	public void setProxyTo(String proxyTo) {
		this.proxyTo = proxyTo;
	};
}
