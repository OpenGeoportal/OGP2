package org.opengeoportal.config.wro;

import java.util.List;

public class WroConfig {

	List<String> css;
	List<String> js;

	public List<String> getCss() {
		return css;
	}

	public void setCss(List<String> css) {
		this.css = css;
	}

	public List<String> getJs() {
		return js;
	}

	public void setJs(List<String> js) {
		this.js = js;
	}
}