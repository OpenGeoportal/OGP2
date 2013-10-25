package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonProperty;


public class CreateDataSetResponseJson {
/*
 * curl -i -X POST -u "user:password" -d "url=http://api.flickr.com/services/feedsgeo/?tags=glitter&lang=en-us&format=kml_nl" http://geocommons.com/datasets.json
 */
	/*
	 * type 	type of file being uploaded 	csv,kml,rss,wms,tile
	title 	name of dataset 	Unemployment in the USA 2010
	description 	description of what the dataset is 	This dataset shows the increase in unemployment in the USA between 2009-2010
	author 	who created the dataset 	Bureau of Labor Statistics
	tags 	words that describe the dataset and relate it to others 	unemployment,labor,workforce
	metadata_url 	link to url containing metadata 	http://www.example.com
	citation_url 	link to the organization the data is from 	http://www.exampleorg.com
	contact_name 	person to contact about the data 	John Doe
	contact_address 	address of the organization the data is from 	123 Main Street, Somewhere VA
	contact_phone 	phone number of organization creating the data 	555-555-5555
	process_notes 	additional notes about how you created the dataset 	Ran data through Google Refine to remove duplicates before uploading
	 */
	/*
	 * response: location returns the uri of the dataset
	 */
	@JsonProperty("location")
		String location;

		public String getLocation() {
			return location;
		}

		public void setLocation(String location) {
			this.location = location;
		}
}
