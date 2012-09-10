package org.OpenGeoPortal.Solr;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.apache.solr.client.solrj.beans.Field;

public class SolrExchangeRecord {
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
	Boolean georeferenced;
	@Field("Abstract")
	String description;
	@Field("Location")
	String location;
	@Field("MaxY")
	Double maxY;
	@Field("MinY")
	Double minY;
	@Field("MaxX")
	Double maxX;
	@Field("MinX")
	Double minX;
	@Field("CenterX")
	Double centerX;
	@Field("CenterY")
	Double centerY;
	@Field("HalfWidth")
	Double halfWidth;
	@Field("HalfHeight")
	Double halfHeight;
	@Field("Area")
	Double area;
	@Field("WorkspaceName")
	String workspaceName;
	@Field("ContentDate")
	Date contentDate;
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
	public Double getCenterX() {
		return centerX;
	}
	public void setCenterX(Double centerX) {
		this.centerX = centerX;
	}
	public Double getCenterY() {
		return centerY;
	}
	public void setCenterY(Double centerY) {
		this.centerY = centerY;
	}
	public Double getHalfWidth() {
		return halfWidth;
	}
	public void setHalfWidth(Double halfWidth) {
		this.halfWidth = halfWidth;
	}
	public Double getHalfHeight() {
		return halfHeight;
	}
	public void setHalfHeight(Double halfHeight) {
		this.halfHeight = halfHeight;
	}
	public Double getArea() {
		return area;
	}
	public void setArea(Double area) {
		this.area = area;
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
		//map.put("ContentDate", this.contentDate);
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
