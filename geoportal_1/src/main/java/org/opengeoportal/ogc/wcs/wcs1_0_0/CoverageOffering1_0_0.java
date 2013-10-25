package org.opengeoportal.ogc.wcs.wcs1_0_0;

import java.util.List;

import org.opengeoportal.layer.Envelope;
import org.opengeoportal.ogc.OwsDescribeInfo;


public class CoverageOffering1_0_0 implements OwsDescribeInfo{
	//needed to form WCS getCoverage request
	// wcs:domainSet/wcs:spatialDomain/gml:RectifiedGrid/gml:limits/gml:GridEnvelope/gml:low & gml:high
	// wcs:domainSet/wcs:spatialDomain/gml:RectifiedGrid/gml:axisName (multiple)
	// wcs:supportedCRSs/wcs:requestResponseCRSs
	/*
	 * 
	 * <wcs:CoverageOffering>
	 * <wcs:description>Generated from GeoTIFF</wcs:description>
	 * <wcs:name>GEONETWORK:etref_may_5017</wcs:name>
	 * <wcs:label>Global map of montly reference evapotranspiration - 30 arc-min</wcs:label>
	 * <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84"><gml:pos>-180.0 -90.0</gml:pos><gml:pos>180.0 90.0</gml:pos></wcs:lonLatEnvelope>
	 * <wcs:keywords><wcs:keyword>WCS</wcs:keyword><wcs:keyword>GeoTIFF</wcs:keyword><wcs:keyword>etref_may_5017</wcs:keyword></wcs:keywords>
	 * ***location and time info
	 * <wcs:domainSet>
	 * 	<wcs:spatialDomain><gml:Envelope srsName="EPSG:4326"><gml:pos>-180.0 -90.0</gml:pos><gml:pos>180.0 90.0</gml:pos></gml:Envelope>
	 * 		<gml:RectifiedGrid dimension="2" srsName="EPSG:4326"><gml:limits><gml:GridEnvelope><gml:low>0 0</gml:low><gml:high>719 359</gml:high></gml:GridEnvelope></gml:limits><gml:axisName>x</gml:axisName><gml:axisName>y</gml:axisName>
	 * 			<gml:origin><gml:pos>-179.75 89.75</gml:pos></gml:origin>
	 * 			<gml:offsetVector>0.5 0.0</gml:offsetVector><gml:offsetVector>0.0 -0.5</gml:offsetVector>
	 * 		</gml:RectifiedGrid>
	 * 	</wcs:spatialDomain>
	 * </wcs:domainSet>
	 * "band" info
	 * <wcs:rangeSet><wcs:RangeSet><wcs:name>etref_may_5017</wcs:name><wcs:label>Global map of montly reference evapotranspiration - 30 arc-min</wcs:label>
	 * <wcs:axisDescription><wcs:AxisDescription><wcs:name>Band</wcs:name><wcs:label>Band</wcs:label><wcs:values><wcs:singleValue>1</wcs:singleValue></wcs:values></wcs:AxisDescription></wcs:axisDescription></wcs:RangeSet>
	 * </wcs:rangeSet>
	 * 
	 * supported crss
	 * <wcs:supportedCRSs><wcs:requestResponseCRSs>EPSG:4326</wcs:requestResponseCRSs></wcs:supportedCRSs>
	 * 
	 * supported formats
	 * <wcs:supportedFormats nativeFormat="GeoTIFF">
	 * 	<wcs:formats>ArcGrid</wcs:formats>
	 * 	<wcs:formats>GeoTIFF</wcs:formats>
	 * 	<wcs:formats>GIF</wcs:formats>
	 * 	<wcs:formats>Gtopo30</wcs:formats>
	 * 	<wcs:formats>ImageMosaic</wcs:formats>
	 * 	<wcs:formats>JPEG</wcs:formats>
	 * 	<wcs:formats>PNG</wcs:formats>
	 * 	<wcs:formats>TIFF</wcs:formats>
	 * </wcs:supportedFormats>
	 * 
	 * interpolations
	 * <wcs:supportedInterpolations default="nearest neighbor"><wcs:interpolationMethod>nearest neighbor</wcs:interpolationMethod><wcs:interpolationMethod>bilinear</wcs:interpolationMethod><wcs:interpolationMethod>bicubic</wcs:interpolationMethod></wcs:supportedInterpolations>
	 * 
	 * </wcs:CoverageOffering>
	 * 
	 */
	
	
	 /* 		<gml:RectifiedGrid dimension="2" srsName="EPSG:4326"><gml:limits><gml:GridEnvelope><gml:low>0 0</gml:low><gml:high>719 359</gml:high></gml:GridEnvelope></gml:limits><gml:axisName>x</gml:axisName><gml:axisName>y</gml:axisName>
	 * 			<gml:origin><gml:pos>-179.75 89.75</gml:pos></gml:origin>
	 * 			<gml:offsetVector>0.5 0.0</gml:offsetVector><gml:offsetVector>0.0 -0.5</gml:offsetVector>
	 * 		</gml:RectifiedGrid>
	 */

	
	String name;
	String description;
	String label;
	
	Envelope lonLatEnvelope;
	
	List<String> keywords;
	
	RectifiedGrid rectifiedGrid;
	
	List<String> supportedCRSs;
	
	String nativeFormat;
	List<String> supportedFormats;
	
	String defaultInterpolation;
	List<String> supportedInterpolations;
	
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
	public String getLabel() {
		return label;
	}
	public void setLabel(String label) {
		this.label = label;
	}
	public Envelope getLonLatEnvelope() {
		return lonLatEnvelope;
	}
	public void setLonLatEnvelope(Envelope lonLatEnvelope) {
		this.lonLatEnvelope = lonLatEnvelope;
	}
	public List<String> getKeywords() {
		return keywords;
	}
	public void setKeywords(List<String> keywords) {
		this.keywords = keywords;
	}
	public RectifiedGrid getRectifiedGrid() {
		return rectifiedGrid;
	}
	public void setRectifiedGrid(RectifiedGrid rectifiedGrid) {
		this.rectifiedGrid = rectifiedGrid;
	}
	public List<String> getSupportedCRSs() {
		return supportedCRSs;
	}
	public void setSupportedCRSs(List<String> supportedCRSs) {
		this.supportedCRSs = supportedCRSs;
	}
	public String getNativeFormat() {
		return nativeFormat;
	}
	public void setNativeFormat(String nativeFormat) {
		this.nativeFormat = nativeFormat;
	}
	public List<String> getSupportedFormats() {
		return supportedFormats;
	}
	public void setSupportedFormats(List<String> supportedFormats) {
		this.supportedFormats = supportedFormats;
	}
	public String getDefaultInterpolation() {
		return defaultInterpolation;
	}
	public void setDefaultInterpolation(String defaultInterpolation) {
		this.defaultInterpolation = defaultInterpolation;
	}
	public List<String> getSupportedInterpolations() {
		return supportedInterpolations;
	}
	public void setSupportedInterpolations(List<String> supportedInterpolations) {
		this.supportedInterpolations = supportedInterpolations;
	}
}
