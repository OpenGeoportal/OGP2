package org.opengeoportal.layer;

/**
 * A simple class that represents a bounding box in geodetic coordinates, with some convenience methods
 * @author chris
 *
 */
public class Envelope {
	private Double minX;
	private Double minY;
	private Double maxX;
	private Double maxY;
	String epsgCode;
	/**
	 * BoundingBox constructor from Doubles
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public Envelope(Double minX, Double minY, Double maxX, Double maxY, String epsgCode){
		this.init(minX, minY, maxX, maxY, epsgCode);
	}
	
	/**
	 * BoundingBox constructor from Strings
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public Envelope(String minX, String minY, String maxX, String maxY, String epsgString){
		this.init(Double.parseDouble(minX), Double.parseDouble(minY), Double.parseDouble(maxX), Double.parseDouble(maxY), epsgString);
	}
	
	private void init(Double minX, Double minY, Double maxX, Double maxY, String epsgCode){
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
		this.epsgCode = epsgCode;
	}
	
	public Double getMinX(){
		return this.minX;
	}
	
	public Double getMaxX(){
		return this.maxX;
	}
	
	public Double getMinY(){
		return this.minY;
	}
	
	public Double getMaxY(){
		return this.maxY;
	}
	
	@Override
	public String toString(){
		return Double.toString(this.minX) + "," + Double.toString(this.minY) + "," +Double.toString(this.maxX) + "," + Double.toString(this.maxY);
	}
	
	public String toStringLatLon(){
		return Double.toString(this.minY) + "," + Double.toString(this.minX) + "," +Double.toString(this.maxY) + "," + Double.toString(this.maxX);
	}
	
	public Double getAspectRatio(){
		Double aspectRatio = (this.getMinX() - this.getMaxX())/(this.getMinY() - this.getMaxY());
		aspectRatio = Math.abs(aspectRatio);
		return aspectRatio;
	}
	
	public String generateOWSBoundingBox(){
		String bounds  = "<ows:BoundingBox crs=\"urn:ogc:def:crs:EPSG::" + epsgCode + "\">" +
				"<ows:LowerCorner>" + Double.toString(this.getMinY()) + " " + Double.toString(this.getMinX()) + "</ows:LowerCorner>" +
				"<ows:UpperCorner>" + Double.toString(this.getMaxY()) + " " + Double.toString(this.getMaxX()) + "</ows:UpperCorner>" +
			"</ows:BoundingBox>";
		return bounds;
	}
	
	public String generateGMLEnvelope(){
   		String envelope = "<gml:Envelope srsName=\"http://www.opengis.net/gml/srs/epsg.xml#" + String.valueOf(epsgCode) + "\">"
   		+ "<gml:pos>" + Double.toString(this.getMinX()) + " " + Double.toString(this.getMinY()) + "</gml:pos>"
   		+ "<gml:pos>" + Double.toString(this.getMaxX()) + " " + Double.toString(this.getMaxY()) + "</gml:pos>"
   		+ "</gml:Envelope>";
   		return envelope;
	}
	/*
	 *         <gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">
           <gml:coordinates>-75.102613,40.212597 -72.361859,41.512517</gml:coordinates>
        </gml:Box>
	 */
	public String generateGMLBox(){
   		String envelope = "<gml:Box srsName=\"http://www.opengis.net/gml/srs/epsg.xml#" + String.valueOf(epsgCode) + "\">"
   		+ "<gml:coordinates>" + Double.toString(this.getMinX()) + "," + Double.toString(this.getMinY())
   		+ " " + Double.toString(this.getMaxX()) + "," + Double.toString(this.getMaxY()) + "</gml:coordinates>"
   		+ "</gml:Box>";
   		return envelope;
	}
	
	public Envelope getIntersection(Envelope anotherBox) throws Exception{
		if (this.epsgCode == anotherBox.epsgCode){
			Double intersectionMinX = Math.max(this.getMinX(), anotherBox.getMinX());
			Double intersectionMaxX = Math.min(this.getMaxX(), anotherBox.getMaxX());
			Double intersectionMinY = Math.max(this.getMinY(), anotherBox.getMinY());
			Double intersectionMaxY = Math.min(this.getMaxY(), anotherBox.getMaxY());
			Envelope intersection = new Envelope(intersectionMinX, intersectionMinY, intersectionMaxX, intersectionMaxY, epsgCode);
			return intersection;
		} else {
			throw new Exception("Envelopes have different CRSs");
		}
	}
	
	public Boolean isEquivalent(Envelope anotherBox) throws Exception{
		if (this.epsgCode != anotherBox.epsgCode){
			throw new Exception("Envelopes have different CRSs");
		}
		double acceptableDelta = .001;
		if ((Math.abs(this.minX - anotherBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBox.minX) < acceptableDelta)){
			return true;
		} else {
			return false;
		} 
	}

	static Boolean isInRange(Double var, Double low, Double high){
		if (var >= low && var <= high){
			return true;
		} else return false;
	}
	
	
}
