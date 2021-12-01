package org.opengeoportal.search;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.apache.solr.client.solrj.beans.Field;

import java.util.*;

public class OGPRecord {
	@Field("LayerId")
	@JsonProperty("LayerId")
	String layerId;

	@Field("Name")
	@JsonProperty("Name")
	String name;

	@Field("CollectionId")
	@JsonProperty("CollectionId")
	String collectionId;

	@Field("Institution")
	@JsonProperty("Institution")
	String institution;

	@Field("Access")
	@JsonProperty("Access")
	String access;

	@Field("DataType")
	@JsonProperty("DataType")
	String dataType;

	@Field("Availability")
	@JsonProperty("Availability")
	String availability;

	@Field("LayerDisplayName")
	@JsonProperty("LayerDisplayName")
	String layerDisplayName;

	@Field("Publisher")
	@JsonProperty("Publisher")
	String publisher;

	@Field("Originator")
	@JsonProperty("Originator")
	String originator;

	@Field("GeoReferenced")
	@JsonProperty("GeoReferenced")
	Boolean georeferenced;

	@Field("Abstract")
	@JsonProperty("Abstract")
	String description;

	@Field("Location")
	@JsonProperty("Location")
	String location;

	@Field("MaxY")
	@JsonProperty("MaxY")
	Double maxY;

	@Field("MinY")
	@JsonProperty("MinY")
	Double minY;

	@Field("MaxX")
	@JsonProperty("MaxX")
	Double maxX;

	@Field("MinX")
	@JsonProperty("MinX")
	Double minX;

	@Field("WorkspaceName")
	@JsonProperty("WorkspaceName")
	String workspaceName;

	@Field("ContentDate")
	@JsonProperty("ContentDate")
	Date contentDate;

	private static final List<String> fieldList = new ArrayList<>(Arrays.asList("LayerId", "Name", "CollectionId", "Institution",
			"Access", "DataType", "Availability", "LayerDisplayName", "Publisher", "Originator", "GeoReferenced",
			"Abstract", "Location", "MinX", "MinY", "MaxX", "MaxY", "WorkspaceName", "ContentDate"));

	public static String getFieldList() {
		return String.join(",", fieldList);
	}

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
	public String getCollectionId() {
		return collectionId;
	}
	public void setCollectionId(String collectionId) {
		this.collectionId = collectionId;
	}
	public String getInstitution() {
		return institution;
	}
	public void setInstitution(String institution) {
		this.institution = institution;
	}

	public String getAccess() {
		return access;
	}
	public void setAccess(String access) {
		this.access = access;
	}
	public String getDataType() {
		return dataType;
	}
	public void setDataType(String dataType) {
		this.dataType = dataType;
	}

	public String getAvailability() {
		return availability;
	}
	public void setAvailability(String availability) {
		this.availability = availability;
	}
	public String getLayerDisplayName() {
		return layerDisplayName;
	}
	public void setLayerDisplayName(String layerDisplayName) {
		this.layerDisplayName = layerDisplayName;
	}

	public String getPublisher() {
		return publisher;
	}
	public void setPublisher(String publisher) {
		this.publisher = publisher;
	}

	public String getOriginator() {
		return originator;
	}
	public void setOriginator(String originator) {
		this.originator = originator;
	}

	public Boolean getGeoreferenced() {
		return georeferenced;
	}
	public void setGeoreferenced(Boolean georeferenced) {
		this.georeferenced = georeferenced;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getLocation() {
		return location;
	}
	public void setLocation(String location) {
		this.location = location;
	}
	public Double getMaxY() {
		return maxY;
	}
	public void setMaxY(Double maxY) {
		this.maxY = maxY;
	}
	public Double getMinY() {
		return minY;
	}
	public void setMinY(Double minY) {
		this.minY = minY;
	}
	public Double getMaxX() {
		return maxX;
	}
	public void setMaxX(Double maxX) {
		this.maxX = maxX;
	}
	public Double getMinX() {
		return minX;
	}
	public void setMinX(Double minX) {
		this.minX = minX;
	}

	public String getWorkspaceName() {
		return workspaceName;
	}
	public void setWorkspaceName(String workspaceName) {
		this.workspaceName = workspaceName;
	}
	public Date getContentDate() {
		return contentDate;
	}
	public void setContentDate(Date contentDate) {
		this.contentDate = contentDate;
	}
	
	public Map<String,String> toMap(){
		Map<String,String> map = new HashMap<String,String>();
		map.put("LayerId", this.layerId);
		map.put("LayerName", this.name);
		map.put("Title", this.layerDisplayName);
		map.put("DataType", this.dataType);
		map.put("Access", this.access);
		map.put("Bounds", this.minX + "," + this.minY + "," + this.maxX + "," + this.maxY);
		map.put("Originator", this.originator);
		map.put("Publisher", this.publisher);
		return map;
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
