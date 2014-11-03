package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

import org.geotools.data.DataStore;
import org.geotools.data.DataUtilities;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureSource;
import org.geotools.data.FileDataStoreFactorySpi;
import org.geotools.data.FileDataStoreFinder;
import org.geotools.data.Query;
import org.geotools.data.Transaction;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.factory.CommonFactoryFinder;
import org.geotools.factory.GeoTools;
import org.geotools.feature.FeatureCollection;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.OgpFileUtils;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.filter.FilterFactory;
import org.opengis.filter.spatial.BBOX;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.vividsolutions.jts.geom.Envelope;

public class FeatureSourceToShapeImpl {//implements FeatureSourceToShape {
	
	private FeatureSourceRetriever featureSourceRetriever;

	@Autowired
	protected DirectoryRetriever directoryRetriever;
	
	private SimpleFeatureStore shpFeatureStore;
	
	public SimpleFeatureStore getShpFeatureStore() {
		return shpFeatureStore;
	}

	public void setShpFeatureStore(SimpleFeatureStore shpFeatureStore) {
		this.shpFeatureStore = shpFeatureStore;
		shpCreated = true;
	}

	private Boolean shpCreated = false;
	
	private File shpfile;
	
	
	public File getShpfile() {
		return shpfile;
	}

	public void setShpfile(File shpfile) {
		this.shpfile = shpfile;
	}
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	//@Override
	public FeatureSourceRetriever getFeatureSourceRetriever() {
		return featureSourceRetriever;
	}

	public void setFeatureSourceRetriever(
			FeatureSourceRetriever featureSourceRetriever) {
		this.featureSourceRetriever = featureSourceRetriever;
	
	}
	
	
	public Set<File> getFromFeatureSource(Envelope bbox) throws IOException, Exception{
		SimpleFeatureSource featureSource = featureSourceRetriever.getFeatureSource();
		
		SimpleFeatureCollection featureCollection = null;
		
		if (bbox == null){
			featureCollection = featureSource.getFeatures();
		} else {
			featureCollection = featureSource.getFeatures(getBBoxQuery(bbox));
		}
		
		addToShpFeatureStore(featureCollection);
	
		return getShapefileSet();
	}
	
	/**
	 * set a FeatureCollection from a FeatureSource with a bbox query
	 * 
	 * @param typeName
	 * @param bbox
	 * @throws Exception 
	 */
	public Query getBBoxQuery(Envelope bbox) throws Exception {
		String geomName = "";
		try{
			//geomName = featureSource.getSchema().getGeometryDescriptor().getLocalName();
			logger.info(geomName);
		} catch (Exception e){
			
		}
		FilterFactory ff = CommonFactoryFinder.getFilterFactory( GeoTools.getDefaultHints() );
		CoordinateReferenceSystem crs = DefaultGeographicCRS.WGS84;
		
		BBOX filter = ff.bbox(geomName, bbox.getMinX(), bbox.getMinY(), bbox.getMaxX(), bbox.getMaxY(), crs.toWKT());
		logger.info(Boolean.toString(filter == null));
		
		String typeName = null;//featureSource.getSchema().getTypeName();
		logger.info(typeName);
		
		Query query = new Query( typeName, filter, new String[]{ geomName } );
		
		logger.info(Boolean.toString(query == null));
		
		return query;

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
	

	public void createShpFeatureStore(SimpleFeatureType schema) throws IOException{
	    
	    String fileName = schema.getTypeName();
		File directory = directoryRetriever.getDownloadDirectory();
	    shpfile = new File(directory, fileName + ".shp");
	    
	    Map<String, java.io.Serializable> creationParams = new HashMap<String, java.io.Serializable>();
	    creationParams.put("url", DataUtilities.fileToURL(shpfile));
	    
	    FileDataStoreFactorySpi factory = FileDataStoreFinder.getDataStoreFactory("shp");
	    DataStore dataStore = factory.createNewDataStore(creationParams);
	    
	    dataStore.createSchema(schema);
	    
	    setShpFeatureStore( (SimpleFeatureStore) dataStore.getFeatureSource(schema.getTypeName()));
	}
	
	
	public Set<File> getShapefileSet(){
		File directory = shpfile.getParentFile();
		String fileName = shpfile.getName().replace(".shp", "");
		
	    Set<File> shapeFileSet = new HashSet<File>();
	    File fileDBF = new File(directory, fileName + ".dbf");
	    File fileSHX = new File(directory, fileName + ".shx");
	    File filePRJ = new File(directory, fileName + ".prj");
	    
	    shapeFileSet.add(shpfile);
	    shapeFileSet.add(fileSHX);
	    shapeFileSet.add(filePRJ);
	    shapeFileSet.add(fileDBF);
	    
	    return shapeFileSet;
	}
	
}
