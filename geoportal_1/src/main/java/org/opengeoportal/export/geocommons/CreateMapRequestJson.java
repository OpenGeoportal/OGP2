package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonProperty;


public class CreateMapRequestJson {
	/*
	 * Required Parameters
Parameter 	Description 	Example
title 	the title of the map 	title=World%20Population
basemap 	the basemap provider 	basemap=“Acetate”
Optional Parameters
Parameter 	Description 	Example
description 	text description of a map 	description=This%20map%20shows
tags 	tags categorizing you map 	tags=economy
extent 	array of the area covered by the map order is west,south,east,north 	extent=-180,-90,180,90
//extent of exported layers
layers 	array of layers to add to the map 	layers[][source]=finder:98696
permissions 	{"permissions": [{"group_id": “everyone”, “permissions” : {"view":true,download,edit
	 */
	@JsonProperty("title")
	String title;
	@JsonProperty("basemap")
	String basemap;
	@JsonProperty("description")
	String description;
	@JsonProperty("tags")
	String tags;
	@JsonProperty("extent")
	String[] extent;
	
	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getBasemap() {
		return basemap;
	}

	public void setBasemap(String basemap) {
		this.basemap = basemap;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getTags() {
		return tags;
	}

	public void setTags(String tags) {
		this.tags = tags;
	}

	public String[] getExtent() {
		return extent;
	}

	public void setExtent(String[] extent) {
		this.extent = extent;
	}
}
