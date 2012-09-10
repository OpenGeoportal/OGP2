package org.OpenGeoPortal.Proxy.Controllers;

import java.util.ArrayList;
import java.util.List;

import org.OpenGeoPortal.Download.Types.BoundingBox;
import org.OpenGeoPortal.Solr.SolrRecord;

public class ImageRequest {

	String srs;
	BoundingBox bounds;
	String format;
	int height;
	int width;
	List<LayerImage> layerImages = new ArrayList<LayerImage>();

	public String getSrs() {
		return srs;
	}

	public void setSrs(String srs) {
		this.srs = srs;
	}

	public BoundingBox getBounds() {
		return bounds;
	}

	public void setBounds(BoundingBox bounds) {
		this.bounds = bounds;
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
	}

	public int getHeight() {
		return height;
	}

	public void setHeight(int height) {
		this.height = height;
	}

	public int getWidth() {
		return width;
	}

	public void setWidth(int width) {
		this.width = width;
	}

	public void addLayerImage(LayerImage layerImage){
		this.layerImages.add(layerImage);
	}
	
	public List<LayerImage> getLayerImages(){
		return this.layerImages;
	}
	public class LayerImage implements Comparable<LayerImage> {
		String layerId;
		String sld;
		int opacity;
		int zIndex;
		String baseUrl;
		String queryString;
		SolrRecord solrRecord;

		public String getLayerId() {
			return layerId;
		}
		public void setLayerId(String layerId) {
			this.layerId = layerId;
		}
		public String getSld() {
			return sld;
		}
		public void setSld(String sld) {
			this.sld = sld;
		}
		public int getOpacity() {
			return opacity;
		}
		public void setOpacity(int opacity) {
			this.opacity = opacity;
		}
		public int getzIndex() {
			return zIndex;
		}
		public void setzIndex(int zIndex) {
			this.zIndex = zIndex;
		}

		public String getBaseUrl() {
			return baseUrl;
		}
		public void setBaseUrl(String baseUrl) {
			this.baseUrl = baseUrl;
		}
		public String getQueryString() {
			return queryString;
		}
		public void setQueryString(String queryString) {
			this.queryString = queryString;
		}
		public SolrRecord getSolrRecord() {
			return solrRecord;
		}
		public void setSolrRecord(SolrRecord solrRecord) {
			this.solrRecord = solrRecord;
		}
		@Override
		public int compareTo(LayerImage n) {
	        return (zIndex < n.zIndex ? -1 :
	               (zIndex == n.zIndex ? 0 : 1));
		}
		

	    public boolean equals(Object o) {
	        if (!(o instanceof LayerImage))
	            return false;
	        LayerImage n = (LayerImage) o;
	        return n.layerId.equals(layerId);
	    }
	}
}
