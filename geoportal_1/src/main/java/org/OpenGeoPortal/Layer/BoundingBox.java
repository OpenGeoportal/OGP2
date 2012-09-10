package org.OpenGeoPortal.Layer;

/**
 * A simple class that represents a bounding box in geodetic coordinates, with some convenience methods
 * @author chris
 *
 */
public class BoundingBox {
	private Double minX;
	private Double minY;
	private Double maxX;
	private Double maxY;
	
	/**
	 * BoundingBox constructor from Doubles
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public BoundingBox(Double minX, Double minY, Double maxX, Double maxY){
		this.init(minX, minY, maxX, maxY);
	}
	
	/**
	 * BoundingBox constructor from Strings
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public BoundingBox(String minX, String minY, String maxX, String maxY){
		this.init(Double.parseDouble(minX), Double.parseDouble(minY), Double.parseDouble(maxX), Double.parseDouble(maxY));
	}
	
	private void init(Double minX, Double minY, Double maxX, Double maxY){
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
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
	
	public Double getAspectRatio(){
		Double aspectRatio = (this.getMinX() - this.getMaxX())/(this.getMinY() - this.getMaxY());
		aspectRatio = Math.abs(aspectRatio);
		return aspectRatio;
	}
	
	public String generateGMLEnvelope(int epsgCode){
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
	public String generateGMLBox(int epsgCode){
   		String envelope = "<gml:Box srsName=\"http://www.opengis.net/gml/srs/epsg.xml#" + String.valueOf(epsgCode) + "\">"
   		+ "<gml:coordinates>" + Double.toString(this.getMinX()) + "," + Double.toString(this.getMinY())
   		+ " " + Double.toString(this.getMaxX()) + "," + Double.toString(this.getMaxY()) + "</gml:coordinates>"
   		+ "</gml:Box>";
   		return envelope;
	}
	
	public BoundingBox getIntersection(BoundingBox anotherBoundingBox){
		Double intersectionMinX = Math.max(this.getMinX(), anotherBoundingBox.getMinX());
		Double intersectionMaxX = Math.min(this.getMaxX(), anotherBoundingBox.getMaxX());
		Double intersectionMinY = Math.max(this.getMinY(), anotherBoundingBox.getMinY());
		Double intersectionMaxY = Math.min(this.getMaxY(), anotherBoundingBox.getMaxY());
		BoundingBox intersection = new BoundingBox(intersectionMinX, intersectionMinY, intersectionMaxX, intersectionMaxY);
		return intersection;
	}
	
	public Boolean isEquivalent(BoundingBox anotherBoundingBox){
		double acceptableDelta = .001;
		if ((Math.abs(this.minX - anotherBoundingBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBoundingBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBoundingBox.minX) < acceptableDelta)&&
				(Math.abs(this.minX - anotherBoundingBox.minX) < acceptableDelta)){
			return true;
		} else {
			return false;
		} 
	}

	private static Boolean isInRange(Double var, Double low, Double high){
		if (var >= low && var <= high){
			return true;
		} else return false;
	}
	
	public Boolean isValid(){
		if (isInRange(getMinX(), -180.0, 180.0) && isInRange(getMaxX(), -180.0, 180.0) &&
				isInRange(getMinY(), -90.0, 90.0) && isInRange(getMaxY(), -90.0, 90.0)){
			return true;
		} else {
			return false;
		}
	}
	
	public String toString1_3() {
		//wms 1.3 reverses the axes
		return Double.toString(this.minY) + "," + Double.toString(this.minX) + "," + Double.toString(this.maxY) + "," + Double.toString(this.maxX);
	}
	
}
