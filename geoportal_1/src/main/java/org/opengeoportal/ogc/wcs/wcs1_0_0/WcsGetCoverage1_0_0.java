package org.opengeoportal.ogc.wcs.wcs1_0_0;

import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.opengeoportal.utilities.OgpUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WcsGetCoverage1_0_0 {
    final static Logger logger = LoggerFactory.getLogger(WcsGetCoverage1_0_0.class.getName());

    private static final String VERSION = "1.0.0";

    public static String getMethod() {
        return "GET";
    }


    /**
     * Generates a GET request for a coverage appropriate for GeoServer instances.
     * example: "http://data.fao.org/maps/wcs?service=WCS&version=1.0.0&request=GetCoverage&coverage=lus_mna_31661
     *              &bbox=-13.166733,39.766613,12.099957,63.333236&crs=EPSG:4326&format=geotiff&width=917&height=331"
     *
     * @param layerName
     * @param outputFormat
     * @param requestedBounds
     * @param epsgCode$
     * @param coverageOffering
     * @return
     * @throws Exception
     */
    public static String createWcsGetCoverageRequest(String layerName, String outputFormat, Envelope requestedBounds,
                                                     String epsgCode$,
                                                     CoverageOffering1_0_0 coverageOffering) throws Exception {

        if (requestedBounds == null){
            throw new Exception("requested bounds argument must not be null");
        }


        return generateBaseRequestString(layerName, epsgCode$, outputFormat) + generateSpatialString(coverageOffering, requestedBounds);
    }

    /**
     * Generates the bbox, width, and height query parameters as a String, when passed DescribeCoverage response and
     * requested bounds.
     *
     * @param coverageOffering
     * @param requestEnvelope
     * @return String
     * @throws Exception
     */
    static String generateSpatialString(CoverageOffering1_0_0 coverageOffering, Envelope requestEnvelope) throws Exception {
        RectifiedGrid rectifiedGrid = coverageOffering.getRectifiedGrid();
        if (rectifiedGrid == null){
            throw new Exception("Rectified Grid must not be null");
        }


        ReferencedEnvelope nativeEnvelope = coverageOffering.getNativeEnvelope();

        /*
        Previously, the bounding box would be passed regardless of raster pixel alignment. This would cause the raster
        to be transformed to coincide with the bounding box. Changes made allow for the bounding box to be snapped to
        the nearest raster pixel edge so that a transformation will not take place. This was causing a particular issue
        with multi-band raster where 0 values in a pixels R,G,B values (i.e. 145,0,79) would be set to the whole pixel
        to "no-data" in transformation, resulting in pixel holes throughout the image.
        --Ben
         */
        requestEnvelope = snapBoundsToGrid(requestEnvelope, nativeEnvelope, rectifiedGrid);

        //The requested bounds should be the request bounds sent from the client, transformed to the request SRS (ideally native),
        //intersected with the native bounds
        String bbox = "&bbox=" + OgpUtils.envelopeToString(requestEnvelope);

        //Using the ratio of the requestEnvelope to the nativeEnvelop (full layer), along with the sizes provided by the
        //DescribeCoverage response, we can generate the width and height for the request
        int width = getRequestWidth(requestEnvelope, nativeEnvelope, rectifiedGrid);
        int height = getRequestHeight(requestEnvelope, nativeEnvelope, rectifiedGrid);

        String query = "&width=" + Integer.toString(width) + "&height=" + Integer.toString(height) + bbox;
        return query;
    }


    static int getRequestWidth(Envelope requestedEnv, Envelope nativeEnv, RectifiedGrid rectifiedGrid){
        Double width = requestedEnv.getWidth() / nativeEnv.getWidth() * rectifiedGrid.getWidth();
        return width.intValue();
    }

    static int getRequestHeight(Envelope requestedEnv, Envelope nativeEnv, RectifiedGrid rectifiedGrid){
        Double height = requestedEnv.getHeight() / nativeEnv.getHeight() * rectifiedGrid.getHeight();
        return height.intValue();
    }

    static String generateBaseRequestString(String layerName, String crs, String outputFormat){

        String getCoverageRequest = "service=WCS&version=" + VERSION +
                "&request=GetCoverage&coverage=" + layerName +
                "&crs=" + crs +
                "&format=" + outputFormat;

        return getCoverageRequest;
    }


    static Envelope snapBoundsToGrid(Envelope requestedBounds, Envelope nativeBounds, RectifiedGrid rectifiedGrid){

        Double resX = rectifiedGrid.getResx();
        Double resY = rectifiedGrid.getResy();
        Double xMin = getMinimum(nativeBounds.getMinX(), requestedBounds.getMinX(), resX);
        Double yMin = getMinimum(nativeBounds.getMinY(), requestedBounds.getMinY(), resY);
        Double xMax = getMaximum(nativeBounds.getMaxX(), requestedBounds.getMaxX(), resX);
        Double yMax = getMaximum(nativeBounds.getMaxY(), requestedBounds.getMaxY(), resY);

        Envelope adjusted =  new Envelope(xMin, xMax, yMin, yMax);
        return adjusted;
    }


    static Double getMinimum(Double nMin, Double rMin, Double res){
        Double min = nMin;
        if (rMin > nMin) {
            Double y_a = (Math.abs(rMin - nMin)) / res;
            min = nMin + (y_a.intValue() * res);
        }
        return min;
    }

    static Double getMaximum(Double nMax, Double rMax, Double res){
        Double max = nMax;

        if (nMax > rMax) {
            Double x_b = (Math.abs(rMax - nMax)) / res;
            max = nMax - (x_b.intValue() * res);
        }

        return max;
    }



}
