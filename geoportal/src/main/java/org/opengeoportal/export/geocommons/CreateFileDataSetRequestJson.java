package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonProperty;


public class CreateFileDataSetRequestJson {
	/*
	 * curl -i -X POST -u "user:password" -d
	 * "url=http://api.flickr.com/services/feedsgeo/?tags=glitter&lang=en-us&format=kml_nl"
	 * http://geocommons.com/datasets.json
	 */
	/*
	 * type type of file being uploaded csv,kml,rss,wms,tile title name of
	 * dataset Unemployment in the USA 2010 description description of what the
	 * dataset is This dataset shows the increase in unemployment in the USA
	 * between 2009-2010 author who created the dataset Bureau of Labor
	 * Statistics tags words that describe the dataset and relate it to others
	 * unemployment,labor,workforce metadata_url link to url containing metadata
	 * http://www.example.com citation_url link to the organization the data is
	 * from http://www.exampleorg.com contact_name person to contact about the
	 * data John Doe contact_address address of the organization the data is
	 * from 123 Main Street, Somewhere VA contact_phone phone number of
	 * organization creating the data 555-555-5555 process_notes additional
	 * notes about how you created the dataset Ran data through Google Refine to
	 * remove duplicates before uploading
	 */
	@JsonProperty("title")
	String title;
	@JsonProperty("description")
	String description;
	@JsonProperty("author")
	String author;
	@JsonProperty("tags")
	String tags;
	@JsonProperty("metadata_url")
	String metadata_url;
	/*@JsonProperty("citation_url")
	String citation_url;*/
	@JsonProperty("contact_name")
	String contact_name;
	@JsonProperty("contact_address")
	String contact_address;
	@JsonProperty("contact_phone")
	String contact_phone;
	/*@JsonProperty("process_notes")
	String process_notes;*/
/*
 * dataset[shp] 	Name of your file(s) you are uploading 	dataset[shp]=@elect_precincts.shp;

shp files require shp/shx/dbf files
 */

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getAuthor() {
		return author;
	}

	public void setAuthor(String author) {
		this.author = author;
	}

	public String getTags() {
		return tags;
	}

	public void setTags(String tags) {
		this.tags = tags;
	}

	public String getMetadata_url() {
		return metadata_url;
	}

	public void setMetadata_url(String metadata_url) {
		this.metadata_url = metadata_url;
	}

	/*public String getCitation_url() {
		return citation_url;
	}

	public void setCitation_url(String citation_url) {
		this.citation_url = citation_url;
	}*/

	public String getContact_name() {
		return contact_name;
	}

	public void setContact_name(String contact_name) {
		this.contact_name = contact_name;
	}

	public String getContact_address() {
		return contact_address;
	}

	public void setContact_address(String contact_address) {
		this.contact_address = contact_address;
	}

	public String getContact_phone() {
		return contact_phone;
	}

	public void setContact_phone(String contact_phone) {
		this.contact_phone = contact_phone;
	}

	/*public String getProcess_notes() {
		return process_notes;
	}

	public void setProcess_notes(String process_notes) {
		this.process_notes = process_notes;
	}*/
}
