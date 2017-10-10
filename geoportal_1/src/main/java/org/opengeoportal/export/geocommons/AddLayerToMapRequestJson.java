package org.opengeoportal.export.geocommons;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;



/*
 * Required Parameters:
 Parameter 	Description 	Example
 source 	the source of the data layer for GeoIQ/GeoCommons layers it is “finder:xxxx” for external sources it is “url:http://example.com” 	source=finder:98765

 Optional Parameters:
 Parameter 	Description 	Example
 title 	the title of the layer 	title=“Population and Age”
 subtitle 	the subtitle of the layer 	subtitle="200 Census Demographics
 opacity 	the opacity of the layer default is 1.0 	opacity=.5
 styles 	the styling of the layer (see detailed styling information below) 	see style examples below
 visible 	sets if the layer is visible, or turned off 	visible=true
 "visibleLayers": ["sde:GISPORTAL.GISOWNER01.CACENSUSTRACTS10"]
 * 
 * 
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AddLayerToMapRequestJson {
	@JsonProperty("source")
	String source;
	@JsonProperty("visible")
	Boolean visible;
	@JsonProperty("title")
	String title;
	//@JsonProperty("styles")
	//Styles styles;

	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Boolean getVisible() {
		return visible;
	}

	public void setVisible(Boolean visible) {
		this.visible = visible;
	}

	/*public Styles getStyles() {
		return styles;
	}

	public void setStyles(Styles styles) {
		this.styles = styles;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public class Styles {
		String type;
		Stroke stroke;
		Fill fill;

		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		public Stroke getStroke() {
			return stroke;
		}

		public void setStroke(Stroke stroke) {
			this.stroke = stroke;
		}

		public Fill getFill() {
			return fill;
		}

		public void setFill(Fill fill) {
			this.fill = fill;
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public class Stroke {
			// defaults
			int alpha = 1;
			int weight = 1;
			int color = 16777215;

			public int getAlpha() {
				return alpha;
			}

			public void setAlpha(int alpha) {
				this.alpha = alpha;
			}

			public int getWeight() {
				return weight;
			}

			public void setWeight(int weight) {
				this.weight = weight;
			}

			public int getColor() {
				return color;
			}

			public void setColor(int color) {
				this.color = color;
			}
		}*/

		/*
		 * "type": "primitives", "stroke": {"alpha": 1, "weight": 1, "color":
		 * 16777215}, "fill": {"opacity": 0.75, "color": 542100}
		 */
		/*@JsonIgnoreProperties(ignoreUnknown = true)
		public class Fill {
			// defaults
			Double opacity = 0.75;
			int color = 542100;

			public Double getOpacity() {
				return opacity;
			}

			public void setOpacity(Double opacity) {
				this.opacity = opacity;
			}

			public int getColor() {
				return color;
			}

			public void setColor(int color) {
				this.color = color;
			}
		}
	}*/

}
