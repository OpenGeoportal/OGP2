package org.opengeoportal.config.clientoptions.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

public class RepositoryConfig {

	String id;
	String shortName;
	String fullName;
	String iconClass;
	String nodeType;
	String url;
	Boolean selected;

	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getShortName() {
		return shortName;
	}
	public void setShortName(String shortName) {
		this.shortName = shortName;
	}
	public String getFullName() {
		return fullName;
	}
	public void setFullName(String fullName) {
		this.fullName = fullName;
	}
	public String getIconClass() {
		return iconClass;
	}
	public void setIconClass(String iconClass) {
		this.iconClass = iconClass;
	}
	public Boolean getSelected() {
		return selected;
	}
	public void setSelected(Boolean selected) {
		this.selected = selected;
	}
	
	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	public String getNodeType() {
		return nodeType;
	}
	
	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	public void setNodeType(String nodeType) {
		this.nodeType = nodeType;
	}
	
	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	public String getUrl() {
		return url;
	}
	
	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	public void setUrl(String url) {
		this.url = url;
	}


}
