package org.opengeoportal.layer;

/**
 * A simple class that represents a bounding box in geodetic coordinates, with some convenience methods
 * @author chris
 *
 */
public class BoundingBox extends Envelope{

	private final static String epsgCode = "4326";
	/**
	 * BoundingBox constructor from Doubles
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public BoundingBox(Double minX, Double minY, Double maxX, Double maxY){
		super(minX, minY, maxX, maxY, epsgCode);
	}
	
	/**
	 * BoundingBox constructor from Strings
	 * @param minX
	 * @param minY
	 * @param maxX
	 * @param maxY
	 */
	public BoundingBox(String minX, String minY, String maxX, String maxY){
		super(minX, minY, maxX, maxY, epsgCode);
	}
	
	public static BoundingBox getOrderedBox(BoundingBox box){
		Double minx = Math.min(box.getMinX(), box.getMaxX());
		Double maxx = Math.max(box.getMinX(), box.getMaxX());
		Double miny = Math.min(box.getMinY(), box.getMaxY());
		Double maxy = Math.max(box.getMinY(), box.getMaxY());
		return new BoundingBox(minx, miny, maxx, maxy);
	}
	
	public BoundingBox getIntersection(BoundingBox anotherBox) throws Exception{
			//make sure the boxes are in proper order to start with
			anotherBox = BoundingBox.getOrderedBox(anotherBox);
			BoundingBox currentBox = BoundingBox.getOrderedBox(this);
			Double intersectionMinX = Math.max(currentBox.getMinX(), anotherBox.getMinX());
			Double intersectionMaxX = Math.min(currentBox.getMaxX(), anotherBox.getMaxX());
			Double intersectionMinY = Math.max(currentBox.getMinY(), anotherBox.getMinY());
			Double intersectionMaxY = Math.min(currentBox.getMaxY(), anotherBox.getMaxY());
			BoundingBox intersection = new BoundingBox(intersectionMinX, intersectionMinY, intersectionMaxX, intersectionMaxY);
			
			return intersection;
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
		return this.toStringLatLon();
	}
	
	
}
