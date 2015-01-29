package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.geotools.data.DataStore;
import org.geotools.data.DataUtilities;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureStore;
import org.geotools.data.FileDataStoreFactorySpi;
import org.geotools.data.FileDataStoreFinder;
import org.geotools.data.Transaction;
import org.geotools.data.memory.MemoryDataStore;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.feature.FeatureCollection;
import org.opengis.feature.simple.SimpleFeatureType;

public class GeoJsonToShapeFileRetriever {
	
	private SimpleFeatureStore shpFeatureStore;
	
	public SimpleFeatureStore getShpFeatureStore() {
		return shpFeatureStore;
	}

	public void setShpFeatureStore(SimpleFeatureStore shpFeatureStore) {
		this.shpFeatureStore = shpFeatureStore;
		shpCreated = true;
	}

	private Boolean shpCreated = false;
	
	String directory;

	private File shpfile;
	
	
	public File getShpfile() {
		return shpfile;
	}

	public void setShpfile(File shpfile) {
		this.shpfile = shpfile;
	}

	public void appendToShp(InputStream is) throws IOException {     
		//input stream or String?
	    int decimals = 15; 
	   // GeometryJSON gjson = new GeometryJSON(decimals); 
	    //FeatureJSON fjson = new FeatureJSON(gjson);

	    //SimpleFeatureCollection fc = fjson.readFeatureCollection(is);
	    
	    //addToShpFeatureStore(fc);
	}
	
	
	
	public void createShpFeatureStore(SimpleFeatureType schema) throws IOException{
	    
	    String fileName = schema.getTypeName();
	    shpfile = new File(directory, fileName + ".shp");
	    
	    Map<String, java.io.Serializable> creationParams = new HashMap<String, java.io.Serializable>();
	    creationParams.put("url", DataUtilities.fileToURL(shpfile));
	    
	    FileDataStoreFactorySpi factory = FileDataStoreFinder.getDataStoreFactory("shp");
	    DataStore dataStore = factory.createNewDataStore(creationParams);
	    
	    dataStore.createSchema(schema);
	    
	    setShpFeatureStore( (SimpleFeatureStore) dataStore.getFeatureSource(schema.getTypeName()));
	}
		

	
	void addToShpFeatureStore(SimpleFeatureCollection collection) throws IOException{
	    
		if (!shpCreated){
			//if we need to create a shapefile
			SimpleFeatureType schema = (SimpleFeatureType) collection.getSchema(); 
			this.createShpFeatureStore(schema);
		}
		
	    Transaction t = new DefaultTransaction();
	    try {
	        getShpFeatureStore().addFeatures(collection);
	        t.commit(); // write it out
	    } catch (IOException eek) {
	        eek.printStackTrace();
	        try {
	            t.rollback();
	        } catch (IOException doubleEeek) {
	            // rollback failed?
	        }
	    } finally {
	        t.close();
	    }
	}

}
