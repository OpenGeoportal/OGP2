package org.opengeoportal.search;

import org.apache.solr.client.solrj.beans.Field;

import java.util.HashMap;
import java.util.Map;

public class MetadataRecord {
	@Field("LayerId")
	String layerId;
	@Field("Name")
	String name;
	@Field("WorkspaceName")
	String workspaceName;
	@Field("FgdcText")
	String fgdcText;

	public String getLayerId() {
		return layerId;
	}
	public void setLayerId(String layerId) {
		this.layerId = layerId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	public String getWorkspaceName() {
		return workspaceName;
	}
	public void setWorkspaceName(String workspaceName) {
		this.workspaceName = workspaceName;
	}

	public String getFgdcText() {
		return fgdcText;
	}
	public void setFgdcText(String fgdcText) {
		this.fgdcText = fgdcText;
	}
	
	public Map<String,String> toMap(){
		Map<String,String> map = new HashMap<String,String>();
		map.put("LayerId", this.layerId);
		map.put("LayerName", this.name);
		map.put("WorkspaceName", this.workspaceName);
		map.put("FgdcText", this.fgdcText);
		return map;
	}

	public static String getFieldList() {
		return "LayerId, Name, WorkspaceName, FgdcText";
	}

	public String toString(){
		Map<String, String> map = this.toMap();
		StringBuilder s = new StringBuilder();
		for (String key: map.keySet()){
			s.append(key);
			s.append(": ");
			s.append(map.get(key));
			s.append(",");
		}
		return s.toString();
	}
}
