package org.OpenGeoPortal.Solr;

import java.util.HashMap;
import java.util.Map;

import org.apache.solr.client.solrj.beans.Field;

public class SolrRecord {
	@Field("LayerId")
	String layerId;
	@Field("Name")
	String name;
	@Field("CollectionId")
	String collectionId;
	@Field("Institution")
	String institution;
	@Field("InstitutionSort")
	String institutionSort;
	@Field("Access")
	String access;
	@Field("DataType")
	String dataType;
	@Field("DataTypeSort")
	String dataTypeSort;
	@Field("Availability")
	String availability;
	@Field("LayerDisplayName")
	String layerDisplayName;
	@Field("LayerDisplayNameSort")
	String layerDisplayNameSort;
	@Field("Publisher")
	String publisher;
	@Field("PublisherSort")
	String publisherSort;
	@Field("Originator")
	String originator;
	@Field("OriginatorSort")
	String originatorSort;
	@Field("ThemeKeywords")
	String themeKeywords;
	@Field("PlaceKeywords")
	String placeKeywords;
	@Field("GeoReferenced")
	String georeferenced;
	@Field("Abstract")
	String description;
	@Field("Location")
	String location;
	@Field("MaxY")
	String maxY;
	@Field("MinY")
	String minY;
	@Field("MaxX")
	String maxX;
	@Field("MinX")
	String minX;
	@Field("CenterX")
	String centerX;
	@Field("CenterY")
	String centerY;
	@Field("HalfWidth")
	String halfWidth;
	@Field("HalfHeight")
	String halfHeight;
	@Field("Area")
	String area;
	@Field("WorkspaceName")
	String workspaceName;
	@Field("ContentDate")
	String contentDate;
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
	public String getInstitutionSort() {
		return institutionSort;
	}
	public void setInstitutionSort(String institutionSort) {
		this.institutionSort = institutionSort;
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
	public String getDataTypeSort() {
		return dataTypeSort;
	}
	public void setDataTypeSort(String dataTypeSort) {
		this.dataTypeSort = dataTypeSort;
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
	public String getLayerDisplayNameSort() {
		return layerDisplayNameSort;
	}
	public void setLayerDisplayNameSort(String layerDisplayNameSort) {
		this.layerDisplayNameSort = layerDisplayNameSort;
	}
	public String getPublisher() {
		return publisher;
	}
	public void setPublisher(String publisher) {
		this.publisher = publisher;
	}
	public String getPublisherSort() {
		return publisherSort;
	}
	public void setPublisherSort(String publisherSort) {
		this.publisherSort = publisherSort;
	}
	public String getOriginator() {
		return originator;
	}
	public void setOriginator(String originator) {
		this.originator = originator;
	}
	public String getOriginatorSort() {
		return originatorSort;
	}
	public void setOriginatorSort(String originatorSort) {
		this.originatorSort = originatorSort;
	}
	public String getThemeKeywords() {
		return themeKeywords;
	}
	public void setThemeKeywords(String themeKeywords) {
		this.themeKeywords = themeKeywords;
	}
	public String getPlaceKeywords() {
		return placeKeywords;
	}
	public void setPlaceKeywords(String placeKeywords) {
		this.placeKeywords = placeKeywords;
	}
	public String getGeoreferenced() {
		return georeferenced;
	}
	public void setGeoreferenced(String georeferenced) {
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
	public String getMaxY() {
		return maxY;
	}
	public void setMaxY(String maxY) {
		this.maxY = maxY;
	}
	public String getMinY() {
		return minY;
	}
	public void setMinY(String minY) {
		this.minY = minY;
	}
	public String getMaxX() {
		return maxX;
	}
	public void setMaxX(String maxX) {
		this.maxX = maxX;
	}
	public String getMinX() {
		return minX;
	}
	public void setMinX(String minX) {
		this.minX = minX;
	}
	public String getCenterX() {
		return centerX;
	}
	public void setCenterX(String centerX) {
		this.centerX = centerX;
	}
	public String getCenterY() {
		return centerY;
	}
	public void setCenterY(String centerY) {
		this.centerY = centerY;
	}
	public String getHalfWidth() {
		return halfWidth;
	}
	public void setHalfWidth(String halfWidth) {
		this.halfWidth = halfWidth;
	}
	public String getHalfHeight() {
		return halfHeight;
	}
	public void setHalfHeight(String halfHeight) {
		this.halfHeight = halfHeight;
	}
	public String getArea() {
		return area;
	}
	public void setArea(String area) {
		this.area = area;
	}
	public String getWorkspaceName() {
		return workspaceName;
	}
	public void setWorkspaceName(String workspaceName) {
		this.workspaceName = workspaceName;
	}
	public String getContentDate() {
		return contentDate;
	}
	public void setContentDate(String contentDate) {
		this.contentDate = contentDate;
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
		map.put("Title", this.layerDisplayName);
		map.put("DataType", this.dataType);
		map.put("Access", this.access);
		map.put("ContentDate", this.contentDate);
		map.put("Bounds", this.minX + "," + this.minY + "," + this.maxX + "," + this.maxY);
		map.put("Originator", this.originator);
		map.put("Publisher", this.publisher);
		return map;
	}
	public String toString(){
		Map<String, String> map = this.toMap();
		String s = "";
		for (String key: map.keySet()){
			s += key;
			s += ": ";
			s += map.get(key);
			s += ",";
		}
		return s;
	}
}
