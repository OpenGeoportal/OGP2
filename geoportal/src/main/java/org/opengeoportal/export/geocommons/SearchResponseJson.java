package org.opengeoportal.export.geocommons;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;


@JsonIgnoreProperties(ignoreUnknown=true)
public class SearchResponseJson {
/*{"totalResults": 1, "entries": [{"detail_link": "http://geocommons.com/overlays/218328", "pk": 218328, "type": "Overlay", 
	"title": "sde:GISPORTAL.GISOWNER01.USARAILSTATIONS04", "data_type": "Data Feed", "link": "http://geocommons.com/overlays/218328.json", 
	"contributor": {"name": "chrissbarnett", "uri": "http://geocommons.com/users/chrissbarnett"}, "geometry_types": "point", 
	"name": "sde:GISPORTAL.GISOWNER01.USARAILSTATIONS04", "created": "2012-03-21T20:15:57Z", "description": "test data", 
	"bbox": [25.68499, -122.98516, 47.94884, -70.66873], "feature_count": 2507, "unique_name": null, "icon_path": null, 
	"permissions": {"edit": true, "download": true, "view": true}, "layer_size": 5394854, 
	"tags": "(streetcars), and, automated, cable, car, cars, commuter, fixed-guideway, guideway, heavy, high-occupancy, inclined, lanes, light, local, monorail, plane, point, rail, railroad, railroads, railroads--united, states, states., stations., territories, transit, transportation, united, us, usa, vehicle", 
	"source": null, "author": {"name": "open geo portal", "uri": null}, "short_classification": null, "analyzable": true, "published": "2012-03-21T17:02:16-04:00", "id": "Overlay:218328"}], "itemsPerPage": 10}
	*/
	/*
	 * {"itemsPerPage": 10, 
	 * "entries": [
	 * {"analyzable": true, 
	 * 	"contributor": {"name": "chrissbarnett", "uri": "http://geocommons.com/users/chrissbarnett"}, 
	 * "type": "Overlay", 
	 * "data_type": "Dataset", 
	 * "title": "Counties MA 2010", 
	 * "pk": 251426, 
	 * "geometry_types": ["area"], 
	 * "link": "http://geocommons.com/overlays/251426.json", 
	 * "unique_name": null, "icon_path": null, 
	 * "bbox": [41.187054, -73.50814, 42.88679, -69.858864], 
	 * "name": "Counties MA 2010", "created": "2012-06-12T20:32:12Z", 
	 * "description": "This polygon data layer represents the 2010 TIGER/Line counties for Massachusetts.  \nThe TIGER/Line Files are shapefiles and related database files (.dbf) that are an extract of selected geographic and cartographic information from the U.S. Census Bureau's Master Address File / Topologically Integrated Geographic Encoding and Referencing (MAF/TIGER) Database (MTDB).  The MTDB represents a seamless national file with no overlaps or gaps between parts, however, each TIGER/Line File is designed to stand alone as an independent data set, or they can be combined to cover the entire nation.  The primary legal divisions of most States are termed counties.  In Louisiana, these divisions are known as parishes.  In Alaska, which has no counties, the equivalent entities are the organized boroughs, city and boroughs, and municipalities, and for the unorganized area, census areas.  The latter are delineated cooperatively for statistical purposes by the State of Alaska and the Census Bureau.  In four States (Maryland, Missouri, Nevada, and Virginia), there are one or more incorporated places that are independent of any county organization and thus constitute primary divisions of their States.  These incorporated places are known as independent cities and are treated as equivalent entities for purposes of data presentation.  The District of Columbia and Guam have no primary divisions, and each area is considered an equivalent entity for purposes of data presentation.  The Census Bureau treats the following entities as equivalents of counties for purposes of data presentation: Municipios in Puerto Rico, Districts and Islands in American Samoa, Municipalities in the Commonwealth of the Northern Mariana Islands, and Islands in the U.S. Virgin Islands.  The entire area of the United States, Puerto Rico, and the Island Areas is covered by counties or equivalent entities.  The 2010 Census boundaries for counties and equivalent entities a", 
	 * "short_classification": null, 
	 * "permissions": {"edit": true, "download": true, "view": true}, 
	 * "detail_link": "http://geocommons.com/overlays/251426", 
	 * "layer_size": 1025106, 
	 * "tags": ["25, administrative, and, barnstable, berkshire, boundaries, bristol, counties, county, divisions, dukes, entity, equivalent, essex, franklin, hampden, hampshire, ma, massachusetts, middlesex, nantucket, norfolk, or, plymouth, political, polygon, state, states, suffolk, u.s., united, worcester"], 
	 * "author": {"name": "open geo portal", "source": "United States. Bureau of the Census. Geography Division"}, 
	 * "published": "2012-06-12T16:53:54-04:00", "id": "overlay:251426", "feature_count": 14},
	 */

	@JsonProperty("totalResults")
	int totalResults;


	@JsonProperty("entries")
	public List<Entry> entries;// = new ArrayList<Entry>();
	
	public int getTotalResults() {
		return totalResults;
	}

	public void setTotalResults(int totalResults) {
		this.totalResults = totalResults;
	}

	public List<Entry> getEntries() {
		return entries;
	}

	public void setEntries(List<Entry> entries) {
		this.entries = entries;
	}
	
	/*public void setEntries(Entry entry){
		this.entries.add(entry);
	}*/
	@JsonIgnoreProperties(ignoreUnknown=true)
	public static class Entry {

		//analyzable
		//contributor obj
		//type
		//data_type
		//title
		//pk
		//geometry_types ["area"]
		//link
		//unique_name
		//icon_path
		//bbox []
		//name
		//created
		//description
		//short_classification
		//permissions obj
		//detail_link
		//layer_size
		//tags []
		//author obj
		//published 
		//id
		//feature_count
		@JsonProperty("detail_link")
		String detail_link;
		@JsonProperty("pk")
		String pk;
		@JsonProperty("type")
		String type;
		@JsonProperty("title")
		String title;
		@JsonProperty("data_type")
		String data_type;
		@JsonProperty("link")
		String link;
		@JsonProperty("name")
		String name;
		@JsonProperty("description")
		String description;
		/*@JsonProperty("bbox")
		ArrayList<Double> bbox;*/
		@JsonProperty("feature_count")
		int feature_count;
		@JsonProperty("unique_name")
		String unique_name;
		/*@JsonProperty("permissions")
		Permissions permissions;*/
		@JsonProperty("layer_size")
		int layer_size;
		@JsonProperty("published")
		String published;
		@JsonProperty("id")
		String id;
		/*
		Entry(){
			this.permissions = new Permissions();
		}*/
		
		/*public class Permissions {
			@JsonProperty("edit")
			Boolean edit;
			@JsonProperty("download")
			Boolean download;			
			@JsonProperty("view")
			Boolean view;
			
			public Boolean getEdit() {
				return edit;
			}
			public void setEdit(Boolean edit) {
				this.edit = edit;
			}
			public Boolean getDownload() {
				return download;
			}
			public void setDownload(Boolean download) {
				this.download = download;
			}
			public Boolean getView() {
				return view;
			}
			public void setView(Boolean view) {
				this.view = view;
			}
		}*/

		public String getDetail_link() {
			return detail_link;
		}

		public void setDetail_link(String detail_link) {
			this.detail_link = detail_link;
		}

		public String getPk() {
			return pk;
		}

		public void setPk(String pk) {
			this.pk = pk;
		}

		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		public String getTitle() {
			return title;
		}

		public void setTitle(String title) {
			this.title = title;
		}

		public String getData_type() {
			return data_type;
		}

		public void setData_type(String data_type) {
			this.data_type = data_type;
		}

		public String getLink() {
			return link;
		}

		public void setLink(String link) {
			this.link = link;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public String getDescription() {
			return description;
		}

		public void setDescription(String description) {
			this.description = description;
		}

		/*public ArrayList<Double> getBbox() {
			return bbox;
		}

		public void setBbox(ArrayList<Double> bbox) {
			this.bbox = bbox;
		}*/

		public int getFeature_count() {
			return feature_count;
		}

		public void setFeature_count(int feature_count) {
			this.feature_count = feature_count;
		}

		public String getUnique_name() {
			return unique_name;
		}

		public void setUnique_name(String unique_name) {
			this.unique_name = unique_name;
		}

		/*public Permissions getPermissions() {
			return permissions;
		}

		public void setPermissions(Permissions permissions) {
			this.permissions = permissions;
		}*/

		public int getLayer_size() {
			return layer_size;
		}

		public void setLayer_size(int layer_size) {
			this.layer_size = layer_size;
		}

		public String getPublished() {
			return published;
		}

		public void setPublished(String published) {
			this.published = published;
		}

		public String getId() {
			return id;
		}

		public void setId(String id) {
			this.id = id;
		}
	}
}
