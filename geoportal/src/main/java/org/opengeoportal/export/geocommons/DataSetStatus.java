package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


@JsonIgnoreProperties(ignoreUnknown=true)
public class DataSetStatus {
//{"data_attributes":null,"url_type":"kml","classification":null,"title":"City Boundary Somerville MA 2005",
	//"url":"http://geoserver01.uit.tufts.edu/wms?layers=sde:GISPORTAL.GISOWNER01.SOMERVILLECITYBOUNDARY05&request=getMap&format=kml&bbox=-71.134742,42.372537,-71.072298,42.418129&srs=EPSG:4326&width=1&height=1",
	//"calculation_params":null,"pagination":{"sort":null,"start":0,"limit":1000000,"total":1},"data_type":"Data Feed",
	//"link":"http://geocommons.com/overlays/216516.json",
	//"contributor":{"url":"http://geocommons.com/users/chrissbarnett","name":"chrissbarnett"},
	//"geometry_types":["point","area"],"name":"City Boundary Somerville MA 2005",
	//"state":"complete","icon_link":null,"description":"This polygon data layer represents the city boundary of Somerville, MA.",
	//"feature_count":1,"is_raster":false,"unique_name":null,"stats":{},"permissions":[],
	//"tags":"(mass.),administrative,and,basemaps,boundaries,cities,divisions,england,massachusetts,middlesex,new,planningcadastre,political,polygon,somerville",
	//"author":{"contact_phone":"replace with generic phone num","metadata":"http://geodata.tufts.edu/getMetadata?id=Tufts.SomervilleCityBoundary05",
		//"url":null,"contact_name":"open geo portal","source":"Camp, Dresser   McKee",
		//"contact_address":"replace with generic address"},
	//"source":null,
	//"extent":[-71.13455324,42.37254286,-71.07260225,42.41810655],"short_classification":"Y",
	//"published":"2012-03-15T18:34:41-04:00","id":216516,"stream_id":216516}
	/*String data_attributes;
	String url_type;
	String classification;
	String url;
	String calculation_params;
	Pagination pagination;*/
	String ogpLayerId;
	String data_type;
	String title;
	String link;
	/*Contributor contributer;
	ArrayList<String> geometry_types;*/
	String name;
	String state;
	/*String icon_link;
	String description;*/
	int feature_count;
	/*
	Boolean is_raster;
	String unique_name;
	Stats stats;
	ArrayList<String> permissions;
	String tags;
	Author author;
	String source;
	ArrayList<String> extent;
	String short_classification;
	String published;*/
	String id;
	//String stream_id;
	public String getLink() {
		return link;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public void setLink(String link) {
		this.link = link;
	}
	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getData_type() {
		return data_type;
	}
	public void setData_type(String data_type) {
		this.data_type = data_type;
	}
	public int getFeature_count() {
		return feature_count;
	}
	public void setFeature_count(int feature_count) {
		this.feature_count = feature_count;
	}
	public String getOgpLayerId() {
		return ogpLayerId;
	}
	public void setOgpLayerId(String ogpLayerId) {
		this.ogpLayerId = ogpLayerId;
	}
}
