package org.opengeoportal.layer;

public enum GeometryType {
		Point (DataType.Vector),
		Line (DataType.Vector),
		Polygon (DataType.Vector),
		Raster (DataType.Raster),
		ScannedMap (DataType.Raster),
		Undefined (DataType.Vector), //we're going to assume vector if unknown
		PaperMap (DataType.Paper), 
		LibraryRecord(DataType.Paper);
		
		private final DataType dataType;
		enum DataType {Raster, Vector, Paper, Undefined};

		GeometryType(DataType dataType){
			this.dataType = dataType;
		}
	
		public static GeometryType parseGeometryType(String geometryString){
			geometryString = geometryString.trim();
			geometryString.replace(" ", ""); //remove spaces
			for (GeometryType geomType : GeometryType.values()){
				if (geomType.toString().equalsIgnoreCase(geometryString)){
					return geomType;
				}
			}
			return GeometryType.Undefined;
		}
		
		public static Boolean isVector(GeometryType geometryType){
			if (geometryType.dataType.equals(DataType.Vector)){
				return true;
			} else {
				return false;
			}
		}
		
		public static Boolean isRaster(GeometryType geometryType){
			if (geometryType.dataType.equals(DataType.Raster)){
				return true;
			} else {
				return false;
			}
		}
}
