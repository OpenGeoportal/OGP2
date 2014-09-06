package org.opengeoportal.config.topics;

public class TopicsConfig {
/*			<topic>
			<value>
				farming
			</value>
			<displayName>
				Agriculture and Farming
			</displayName>
		</topic>*/
	String value;
	String displayName;


	public String getValue() {
		return value;
	}
	public void setValue(String value) {
		this.value = value;
	}
	public String getDisplayName() {
		return displayName;
	}
	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}


}
