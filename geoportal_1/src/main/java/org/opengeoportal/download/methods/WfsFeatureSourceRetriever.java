package org.opengeoportal.download.methods;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.geotools.data.DataStore;
import org.geotools.data.DataStoreFinder;
import org.geotools.data.FeatureSource;
import org.geotools.data.Query;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.factory.CommonFactoryFinder;
import org.geotools.factory.GeoTools;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.utilities.LocationFieldUtils;
import org.opengeoportal.utilities.OgpUtils;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.filter.FilterFactory;
import org.opengis.filter.spatial.BBOX;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vividsolutions.jts.geom.Envelope;

public class WfsFeatureSourceRetriever implements FeatureSourceRetriever {
	SimpleFeatureSource featureSource = null;
	
	final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public void createFeatureSourceFromLayerRequest(LayerRequest layerRequest) throws Exception{
		setFeatureSource(layerRequest.getWfsUrl(), layerRequest.getLayerNameNS(), LocationFieldUtils.hasArcGISRestUrl(layerRequest.getLayerInfo().getLocation()));
	}
	
	void setFeatureSource(String wfsEndPoint, String layerName, Boolean isFromArcGISServer) throws Exception{
		String getCapabilities = OgpUtils.combinePathWithQuery(wfsEndPoint, "REQUEST=GetCapabilities&VERSION=1.1.0");

		// Both ArcGIS Server 9.3 and 10 are compliant with WFS 1.1.0, so hard-coding VERSION=1.1.0 should be fine. 
		
		Map<String, String> connectionParameters = new HashMap<String, String>();
		connectionParameters.put("WFSDataStoreFactory:GET_CAPABILITIES_URL", getCapabilities );
		
		if (isFromArcGISServer){
			connectionParameters.put("WFSDataStoreFactory:WFS_STRATEGY", "arcgis");
		}
/*
 * “WFSDataStoreFactory:GET_CAPABILITIES_URL” 	Link to capabilities document. The implementation supports both WFS 1.0 (read/write) and WFS 1.1 (read-only).
“WFSDataStoreFactory:PROTOCOL” 	Optional: True for Post, False for GET, null for auto
“WFSDataStoreFactory:USERNAME” 	Optional
“WFSDataStoreFactory:PASSWORD” 	Optional
“WFSDataStoreFactory:ENCODING” 	Optional with a default of UTF-8
“WFSDataStoreFactory:TIMEOUT” 	Optional with a 3000ms default
“WFSDataStoreFactory:BUFFER_SIZE” 	Optional number of features to read in one gulp, defaults of 10
“WFSDataStoreFactory:TRY_GZIP” 	Optional with a default of true, try compression if available
“WFSDataStoreFactory:LENIENT” 	

Optional default of true. WFS implementations are terrible for actually obeying their DescribeFeatureType schema, setting this to true will try a few tricks to support implementations that are mostly correct:

    Accepting the data in any order
    Not getting too upset if the case of the attributes is wrong

 * 
 * 
 */
		// Step 2 - connection
		DataStore data = DataStoreFinder.getDataStore( connectionParameters );

		// Step 3 - discovery
		String typeNames[] = data.getTypeNames();
		//find the typeName we're looking for
		String typeName = "";
		for (int i = 0; i < typeNames.length; i++){
				if (typeNames[i].contains(layerName)){
					typeName = typeNames[i];
					break;
			}
		}
		
		if (typeName.isEmpty()){
			throw new IOException("TypeName ['" + layerName + "'] was not found at: " + getCapabilities);
		}
		
		// Step 4 - target
		logger.info(typeName);
		
		featureSource = data.getFeatureSource( typeName );
	}
	
	


	@Override
	public SimpleFeatureSource getFeatureSource()
			throws Exception {
		return featureSource;
	}
 
}