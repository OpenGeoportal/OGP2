package org.opengeoportal.config.repositories;

public class RepositoryConfig {
	/*{"id": "harvard",
		"shortName": "Harvard",
		"fullName": "Harvard Geospatial Library",
		"sourceIconClass": "harvardIcon",
		"selected": true
		},*/
	String id;
	String shortName;
	String fullName;
	String iconClass;
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

}
