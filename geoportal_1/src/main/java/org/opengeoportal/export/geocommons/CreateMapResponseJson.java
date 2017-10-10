package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown=true)
public class CreateMapResponseJson {
//file 	returns a file of the type requested 	http://geocommons.com/maps/51541.json
	@JsonProperty("id")
	String id;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}


}
