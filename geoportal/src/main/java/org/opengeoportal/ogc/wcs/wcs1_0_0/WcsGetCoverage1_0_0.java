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
	
	public static String createWcsGetCoverageRequest(String layerName, CoverageOffering1_0_0 coverageOffering, BoundingBox bounds, int epsgCode, String outputFormat) throws Exception {
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
			
		    ReferencedEnvelope envelope = new ReferencedEnvelope(bounds.getMinX(), bounds.getMaxX(), bounds.getMinY(), bounds.getMaxY(), sourceCRS);
		    logger.info("requested Bounds: " + OgpUtils.referencedEnvelopeToString(envelope));
		    // Transform using 10 sample points around the envelope

		    CoordinateReferenceSystem targetCRS = factory.createCoordinateReferenceSystem(coverageOffering.getSupportedCRSs().get(0));

		    ReferencedEnvelope result = envelope.transform(targetCRS, true, 10);

		 String getCoverageRequest = "service=WCS&version=" + VERSION + 
		 		"&request=GetCoverage&coverage=" + layerName +
				"&bbox=" + OgpUtils.referencedEnvelopeToString(result) +
				"&crs=" + coverageOffering.getSupportedCRSs().get(0) + 
				"&format=" + outputFormat;
		 
		getCoverageRequest += generateSize(coverageOffering.getRectifiedGrid());
		
    	return getCoverageRequest;
	}
	
	private static String generateSize(RectifiedGrid rgrid) throws Exception{
		Double resx = rgrid.getResx();
		Double resy = rgrid.getResy();
		
		String size = "&";
		
		if (resx.isNaN() || resy.isNaN()){
			Integer width = rgrid.getWidth();
			Integer height = rgrid.getHeight();
			if (!width.equals(null) && !height.equals(null)){
				size += "width=";
				size += Integer.toString(width);
				size += "&height=";
				size += Integer.toString(height);
			} else {
				throw new Exception("invalid describe coverage response....could not form getCoverage request.");
			}

		} else {
			 size += "resx=";
			 size += Double.toString(resx);
			 size += "&resy=";
			 size += Double.toString(resy);
		}
		 

		 return size;
	}

}
