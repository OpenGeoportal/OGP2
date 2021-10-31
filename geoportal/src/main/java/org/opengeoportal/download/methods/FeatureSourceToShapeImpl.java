package org.opengeoportal.download.methods;

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureSource;
import org.geotools.data.Query;
import org.geotools.data.Transaction;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.factory.CommonFactoryFinder;
import org.geotools.feature.FeatureCollection;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.geotools.util.factory.GeoTools;
import org.locationtech.jts.geom.Envelope;
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


public class FeatureSourceToShapeImpl implements FeatureSourceToShape {
	private FeatureSourceRetriever featureSourceRetriever;

	@Autowired
	protected DirectoryRetriever directoryRetriever;
	
	FeatureCollection<SimpleFeatureType, SimpleFeature> featureCollection = null;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public FeatureSourceRetriever getFeatureSourceRetriever() {
		return featureSourceRetriever;
	}

	public void setFeatureSourceRetriever(
			FeatureSourceRetriever featureSourceRetriever) {
		this.featureSourceRetriever = featureSourceRetriever;
	
	}
	
	/**
	 * set a FeatureCollection from a FeatureSource with a bbox query
	 * 
	 * @param bbox
	 * @throws Exception 
	 */
	@Override
	public void setFeatureCollectionBBox(Envelope bbox) throws Exception{
		FeatureSource<SimpleFeatureType, SimpleFeature> featureSource = featureSourceRetriever.getFeatureSource();
		String geomName = "";
		try{
		 geomName = featureSource.getSchema().getGeometryDescriptor().getLocalName();
		logger.info(geomName);
		} catch (Exception e){
			
		}
		FilterFactory ff = CommonFactoryFinder.getFilterFactory( GeoTools.getDefaultHints() );
		//bbox(String propertyName, double minx, double miny, double maxx, double maxy, String srs) 
		CoordinateReferenceSystem crs = DefaultGeographicCRS.WGS84;
		BBOX filter = ff.bbox(geomName, bbox.getMinX(), bbox.getMinY(), bbox.getMaxX(), bbox.getMaxY(), crs.toWKT());
		// = ff.intersects( ff.property( geomName ), ff.literal( polygon ) );
		logger.info(Boolean.toString(filter == null));
		
		String typeName = featureSource.getSchema().getTypeName();
		logger.info(typeName);
		
		Query query = new Query( typeName, filter, new String[]{ geomName } );
		
		logger.info(Boolean.toString(query == null));
		if (query == null){
			featureCollection = featureSource.getFeatures();
		} else {
			featureCollection = featureSource.getFeatures(query);
		}
	}
	
	/**
	 * Copy Features from a FeatureCollection to a feature store.
	 * 
	 * @throws IOException
	 */
	protected void copyFeatures(SimpleFeatureSource featureSource, SimpleFeatureSource targetSource) throws IOException {

	    /*
         * Write the features to the shapefile
         */
        Transaction transaction = new DefaultTransaction("create");

        if (targetSource instanceof SimpleFeatureStore) {
            
            /*
             * SimpleFeatureStore has a method to add features from a
             * SimpleFeatureCollection object, so we use the ListFeatureCollection
             * class to wrap our list of features.
             */
        	SimpleFeatureStore targetStore = (SimpleFeatureStore) targetSource;
        	targetStore.setTransaction(transaction);
        	
            try {
            	SimpleFeatureCollection collection = featureSource.getFeatures();
            	//SimpleFeatureIterator collIter = collection.features();
            	
            	logger.info(collection.getSchema().toString());
            	logger.info(targetStore.getSchema().toString());
            	/*
            	 * 2013-11-04 17:11:12 FeatureSourceToShapeImpl [INFO] SimpleFeatureTypeImpl http://massgis.state.ma.us/featuretype:massgis:GISDATA.MBTA_ARC identified extends Feature(LINE:LINE,ROUTE:ROUTE,GRADE:GRADE,SHAPE:SHAPE)
2013-11-04 17:11:12 FeatureSourceToShapeImpl [INFO] SimpleFeatureTypeImpl GISDATA_MBTA_ARC identified extends lineFeature(the_geom:MultiLineString,LINE:LINE,ROUTE:ROUTE,GRADE:GRADE)
            	 */
                targetStore.addFeatures(collection);
                transaction.commit();

            } catch (Exception problem) {
                problem.printStackTrace();
                transaction.rollback();

            } finally {
                transaction.close();
            }
        } else {
            logger.error("Does not support read/write access");
            //System.exit(1);  //no, let's not do that! throw an exception?
        }
	}
	
	/**
	 * export a shapefile from a FeatureCollection
	 * 
	 * @return
	 * @throws Exception 
	 */
	@Override
	public Set<File> exportToShapefiles() throws Exception {
		
		File directory = directoryRetriever.getDownloadDirectory();

		SimpleFeatureSource featureSource = featureSourceRetriever.getFeatureSource();
	    SimpleFeatureType ft = featureSource.getSchema();
		
	    String typeName = ft.getTypeName();
	    String fileName = OgpFileUtils.filterName(typeName);
	    
	    File fileSHP = new File(directory, fileName + ".shp");
	    fileSHP.createNewFile();

        /*
         * Get an output file name and create the new shapefile
         */

        ShapefileDataStoreFactory dataStoreFactory = new ShapefileDataStoreFactory();

        Map<String, Serializable> params = new HashMap<String, Serializable>();
        params.put("url", fileSHP.toURI().toURL());
        params.put("create spatial index", Boolean.TRUE);

        ShapefileDataStore shpDataStore = (ShapefileDataStore) dataStoreFactory.createNewDataStore(params);
        //logger.info(ft.toString());
        shpDataStore.createSchema(ft);
        /*
         * You can comment out this line if you are using the createFeatureType method (at end of
         * class file) rather than DataUtilities.createType
         */
       // newDataStore.forceSchemaCRS(DefaultGeographicCRS.WGS84);
	    String[] typeNames = shpDataStore.getTypeNames();
        SimpleFeatureSource shpFeatureSource =shpDataStore.getFeatureSource(typeNames[0]);
        
	    logger.info("created schema");
	    logger.info("created feature store");
	    copyFeatures(featureSource, shpFeatureSource);
	    logger.info("copied features");
	    	    
	    Set<File> shapeFileSet = new HashSet<File>();
	    File fileDBF = new File(directory, fileName + ".dbf");
	    File fileSHX = new File(directory, fileName + ".shx");
	    File filePRJ = new File(directory, fileName + ".prj");
	    
	    shapeFileSet.add(fileSHP);
	    shapeFileSet.add(fileSHX);
	    shapeFileSet.add(filePRJ);
	    shapeFileSet.add(fileDBF);
	    
	    return shapeFileSet;
	}
}
