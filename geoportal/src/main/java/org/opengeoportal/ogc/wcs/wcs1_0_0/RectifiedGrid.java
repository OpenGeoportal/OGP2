package org.opengeoportal.ogc.wcs.wcs1_0_0;

import java.util.List;

public class RectifiedGrid {
	 // 	<gml:RectifiedGrid dimension="2" srsName="EPSG:4326"><gml:limits><gml:GridEnvelope><gml:low>0 0</gml:low><gml:high>2159 1079</gml:high></gml:GridEnvelope></gml:limits><gml:axisName>x</gml:axisName><gml:axisName>y</gml:axisName>
	int dimension;
	String srsName;
	List<String> axisName;
	int width;
	int height;
	Double resx;
	Double resy;
	
	public int getDimension() {
		return dimension;
	}
	public void setDimension(int dimension) {
		this.dimension = dimension;
	}
	public String getSrsName() {
		return srsName;
	}
	public void setSrsName(String srsName) {
		this.srsName = srsName;
	}
	public List<String> getAxisName() {
		return axisName;
	}
	public void setAxisName(List<String> axisName) {
		this.axisName = axisName;
	}
	public int getWidth() {
		return width;
	}
	public void setWidth(int width) {
		this.width = width;
	}
	public int getHeight() {
		return height;
	}
	public void setHeight(int height) {
		this.height = height;
	}
	public Double getResx() {
		return resx;
	}
	public void setResx(Double resx) {
		this.resx = resx;
	}
	public Double getResy() {
		return resy;
	}
	public void setResy(Double resy) {
		this.resy = resy;
	}
}
