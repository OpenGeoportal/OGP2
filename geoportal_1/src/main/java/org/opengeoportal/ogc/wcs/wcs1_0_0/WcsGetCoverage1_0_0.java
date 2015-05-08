package org.opengeoportal.ogc.wcs.wcs1_0_0;

import java.util.List;

import org.geotools.factory.Hints;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.ReferencingFactoryFinder;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.utilities.OgpUtils;
import org.opengis.referencing.crs.CRSAuthorityFactory;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WcsGetCoverage1_0_0 {
	final static Logger logger = LoggerFactory.getLogger(WcsGetCoverage1_0_0.class.getName());

	private static final String VERSION = "1.0.0";
	
	public static String getMethod(){
		return "GET";
	}
	
	public static Boolean supports(List<String> supportedList, String testValue){
		for (String current: supportedList){
			logger.info(current);
			if (current.toLowerCase().contains(testValue)){
				return true;
			}
		}
		return false;
	}
	// BEN ADDED Envelope nativeBbox to method
	public static String createWcsGetCoverageRequest(String layerName, CoverageOffering1_0_0 coverageOffering, BoundingBox bounds, int epsgCode, String outputFormat, BoundingBox nativeBbox) throws Exception {
		//http://data.fao.org/maps/wcs?service=WCS&version=1.0.0&request=GetCoverage&coverage=lus_mna_31661&bbox=-13.166733,39.766613,12.099957,63.333236&crs=EPSG:4326&format=geotiff&width=917&height=331

			List<String> supportedFormats = coverageOffering.getSupportedFormats();
			if (!supports(supportedFormats, outputFormat)){
				throw new Exception("The remote server does not support the output format ['" + outputFormat + "']");
			}
			/*if (!supports(coverageOffering.getSupportedCRSs(), Integer.toString(epsgCode))){
				throw new Exception("The remote server does not support the SRS ['" + Integer.toString(epsgCode) + "']");
			}*/
			
			//reproject the requested bounds to raster's native projection/crs
			Hints hints = new Hints(Hints.FORCE_LONGITUDE_FIRST_AXIS_ORDER, Boolean.TRUE);
			CRSAuthorityFactory factory = ReferencingFactoryFinder.getCRSAuthorityFactory("EPSG", hints);
			CoordinateReferenceSystem sourceCRS = factory.createCoordinateReferenceSystem("EPSG:4326");
		    //The bounding box is created in EPSG 4326.  The line below takes the corrdinates given and references to the sourceCRS (EPSG:4326).
		    //The envelope is then transformed to the native (targetCRS) bounds below.		    
		    ReferencedEnvelope envelope = new ReferencedEnvelope(bounds.getMinX(), bounds.getMaxX(), bounds.getMinY(), bounds.getMaxY(), sourceCRS);
		    logger.info("requested Bounds: " + OgpUtils.referencedEnvelopeToString(envelope));
		    
		    // Transform using 10 sample points around the envelope
		    CoordinateReferenceSystem targetCRS = factory.createCoordinateReferenceSystem(coverageOffering.getSupportedCRSs().get(0));

		    ReferencedEnvelope result = envelope.transform(targetCRS, true, 10);

		// Pull min and max values from full coverage envelope
		ReferencedEnvelope nativeRefEnv = new ReferencedEnvelope(nativeBbox.getMinX(), nativeBbox.getMaxX(), nativeBbox.getMinY(), nativeBbox.getMaxY(), targetCRS);
		
		Double resX = coverageOffering.getRectifiedGrid().getResx();  //Get X Resolution of Raster
		Double resY = coverageOffering.getRectifiedGrid().getResy();  //Get Y Resolution of Raster

		Double xMin, yMin, xMax, yMax;

		// Sending a request for a bounding box which cut through pixels caused geotools to warp the coverage compromising the integrity and altering noData values
		// This was an an issue 8 bit unsigned 4 band rasters which were having noData values set to 0 causing noData values to be read where r,g,b,i were something like 50,0,190,89
		if ( nativeRefEnv.getMinimum(0) > result.getMinimum(0)){  //Checks if xMin is less than xMin of whole coverage.  If so, set xMin to xmin of whole coverage 
			xMin = nativeRefEnv.getMinimum(0);  
		} else {
			// This will get the difference between xMin calculated from portal and the raster file and divide by the resolution along x axis to return the number of pixels between input bbox and actual coverage envelope
			Double x_a = (Math.abs(result.getMinimum(0) - nativeRefEnv.getMinimum(0)))/resX;//
			// Coverts pixel difference value to integer to get whole pixels, re-multiply by resolution to get whole number difference.  Add back to bounding box of whole coverage to set xMin.
			xMin = nativeRefEnv.getMinimum(0) + (x_a.intValue() * resX);    }
		
		// Repeat xMin process for yMin
		if ( nativeRefEnv.getMinimum(1) > result.getMinimum(1)){
			yMin = nativeRefEnv.getMinimum(1);
		} else {
			Double y_a = (Math.abs(result.getMinimum(1) - nativeRefEnv.getMinimum(1)))/resY;
			yMin = nativeRefEnv.getMinimum(1) + (y_a.intValue() * resY);    }

		// Same as above for xMax and yMax, but subtract the whole number value width instead of adding.
		if ( nativeRefEnv.getMaximum(0) < result.getMaximum(0)){
			xMax = nativeRefEnv.getMaximum(0);
		} else {
			Double x_b = (Math.abs(result.getMaximum(0) - nativeRefEnv.getMaximum(0)))/resX;
			xMax = nativeRefEnv.getMaximum(0) - (x_b.intValue() * resX);    }


		if ( nativeRefEnv.getMaximum(1) < result.getMaximum(1)){
			yMax = nativeRefEnv.getMaximum(1);
		} else {
			Double y_b = (Math.abs(result.getMaximum(1) - nativeRefEnv.getMaximum(1)))/resY;
			yMax =  nativeRefEnv.getMaximum(1) - (y_b.intValue() * resY);   }

		String bbox = Double.toString(xMin) + "," + Double.toString(yMin) + "," + Double.toString(xMax) + "," + Double.toString(yMax);
		// Calculate width and height from bbox differences and resolutions
		Double dwidth = (Math.abs(xMax - xMin))/resX;
		Double dheight = (Math.abs(yMax - yMin))/resY;
		int width = dwidth.intValue();
		int height = dheight.intValue();
		
		String widthHeight = "&width=" + width + "&height=" + height;
		
		    String getCoverageRequest = "service=WCS&version=" + VERSION + 
		 		"&request=GetCoverage&coverage=" + layerName +
				"&bbox=" + bbox				
				"&crs=" + coverageOffering.getSupportedCRSs().get(0) + 
				"&format=" + outputFormat +
				widthHeight;
		
    	return getCoverageRequest;
	}
	
	
}
