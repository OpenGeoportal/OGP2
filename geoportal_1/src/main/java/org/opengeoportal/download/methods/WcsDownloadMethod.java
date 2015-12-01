package org.opengeoportal.download.methods;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;

import java.util.List;
import java.util.Set;

import com.vividsolutions.jts.geom.Envelope;
import org.apache.commons.io.IOUtils;
import org.geotools.factory.Hints;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.CRS;
import org.geotools.referencing.ReferencingFactoryFinder;
import org.opengeoportal.download.types.LayerRequest;
import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.OgcInfoRequest;
import org.opengeoportal.ogc.OwsInfo;
import org.opengeoportal.ogc.wcs.wcs1_0_0.CoverageOffering1_0_0;
import org.opengeoportal.ogc.wcs.wcs1_0_0.WcsGetCoverage1_0_0;
import org.opengeoportal.utilities.OgpUtils;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CRSAuthorityFactory;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.operation.TransformException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * Download method that uses WCS 1.0.0 to retrieve a raster from a GeoServer instance. Performs a DescribeCoverage
 * request to get resolution info, native CRS, native bounds, then uses this info to generate a GetCoverage request.
 * Uses GET, rather than POSTing XML.
 */
public class WcsDownloadMethod extends AbstractDownloadMethod implements PerLayerDownloadMethod {
    private static final Boolean INCLUDES_METADATA = false;

    @Autowired
    @Qualifier("ogcInfoRequest.wcs_1_0_0")
    private OgcInfoRequest ogcInfoRequest;

    @Override
    public String getMethod() {
        return WcsGetCoverage1_0_0.getMethod();
    }

    @Override
    public Set<String> getExpectedContentType() {
        Set<String> expectedContentType = new HashSet<String>();
        expectedContentType.add("application/zip");
        expectedContentType.add("image/tiff");
        expectedContentType.add("image/tiff;subtype=\"geotiff\"");
        expectedContentType.add("image/tiff; subtype=\"geotiff\"");
        return expectedContentType;
    }

    /**
     * Retrieve the DescribeCoverage info if we don't already have it from a previous request.
     *
     * @return
     * @throws Exception
     */
    CoverageOffering1_0_0 lazyGetInfo() throws Exception {
        CoverageOffering1_0_0 describeLayerInfo = null;
        List<OwsInfo> infoList = this.currentLayer.getOwsInfo();
        if (infoList == null) {
            infoList = new ArrayList<>();
        }
        try {
            if (OwsInfo.hasOwsInfo(infoList, OwsInfo.OwsProtocol.WCS)) {
                describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(infoList).getOwsDescribeInfo();
            } else {
                infoList.add(getWcsDescribeCoverageInfo());
                describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(infoList).getOwsDescribeInfo();
            }
        } catch (Exception e) {
            infoList.add(getWcsDescribeCoverageInfo());
            describeLayerInfo = (CoverageOffering1_0_0) OwsInfo.findWcsInfo(infoList).getOwsDescribeInfo();
        }
        return describeLayerInfo;
    }

    public String getEpsgCode(CoverageOffering1_0_0 describeLayerInfo) throws Exception {
        String epsgCode$ = "";

        //try native projection
        ReferencedEnvelope nativeEnv = describeLayerInfo.getNativeEnvelope();
        Integer nativeCode = CRS.lookupEpsgCode(nativeEnv.getCoordinateReferenceSystem(), true);
        if (nativeCode != null) {
            epsgCode$ = Integer.toString(nativeCode);
        }

        if (!CoverageOffering1_0_0.supports(describeLayerInfo.getSupportedCRSs(), epsgCode$)) {
            logger.warn("The remote server does not support the native CRS ['" + epsgCode$ + "']");

            if (describeLayerInfo.getSupportedCRSs().isEmpty()) {
                throw new Exception("The remote server does not report any supported CRSs for this layer.");
            }
            String crs = describeLayerInfo.getSupportedCRSs().get(0);
            epsgCode$ = crs.replaceAll("[^0-9.]", "");
        }

        return epsgCode$;
    }

    /**
     * Check the DescribeCoverage response to make sure the requested format is supported by the WCS server
     *
     * @param describeLayerInfo
     * @return
     * @throws Exception
     */
    public String getFormat(CoverageOffering1_0_0 describeLayerInfo) throws Exception {
        String format = "geotiff";
        List<String> supportedFormats = describeLayerInfo.getSupportedFormats();
        if (!CoverageOffering1_0_0.supports(supportedFormats, format)) {
            throw new Exception("The remote server does not support the output format ['" + format + "']");
        }
        return format;
    }

    /**
     * Create the WCS GetCoverage request. To properly form the request, a DescribeCoverage request/response is required.
     *
     * @return
     * @throws Exception
     */
    public String createDownloadRequest() throws Exception {
        //info needed: geometry column, bbox coords, epsg code, workspace & layername
        //all client bboxes should be passed as lat-lon coords.  we will need to get the appropriate epsg code for the layer
        //in order to return the file in original projection to the user (will also need to transform the bbox)

        logger.debug("createDownloadRequest");
        logger.info("Getting WCS DescribeCoverage info...");
        CoverageOffering1_0_0 describeLayerInfo = lazyGetInfo();

        String format = getFormat(describeLayerInfo);

        String epsgCode$ = getEpsgCode(describeLayerInfo);


        //This is the bounds reported by the WCS service
        Envelope layerEnv = describeLayerInfo.getLonLatEnvelope();

        logger.debug("requestLatLon" + this.currentLayer.getRequestedBounds().toStringLatLon());
        logger.info("nativeLatLon: " + layerEnv.toString());

        ReferencedEnvelope nativeEnvelope = describeLayerInfo.getNativeEnvelope();
        Envelope effectiveEnv = generateRequestBounds(epsgCode$, nativeEnvelope, true);
        logger.debug("requestBounds: " + effectiveEnv.toString());

        String layerName = this.currentLayer.getLayerNameNS();

        return WcsGetCoverage1_0_0.createWcsGetCoverageRequest(layerName, format, effectiveEnv, "EPSG:" + epsgCode$, describeLayerInfo);

    }

    /**
     * Generates the bounds for the WCS GetCoverage request.
     * <p/>
     * Transforms the requested bounds from EPSG:4326 to the native CRS, then intersects with the layer's native bounds
     * to get the bounds used in the request.
     *
     * @param epsgCode$
     * @param nativeEnvelope
     * @param isNativeSrs
     * @return
     * @throws FactoryException
     * @throws TransformException
     */
    Envelope generateRequestBounds(String epsgCode$, ReferencedEnvelope nativeEnvelope, boolean isNativeSrs) throws FactoryException, TransformException {
        //reproject the requested bounds to raster's native projection/crs, or the first supported by the WCS service
        CoordinateReferenceSystem supportedCRS = CRS.decode("EPSG:" + epsgCode$);
        //ReferencedEnvelope adjustedBounds = getAdjustedBounds(coverageOffering.getNativeEnvelope(), requestedBounds, epsgCode$, resX, resY);

        Hints hints = new Hints(Hints.FORCE_LONGITUDE_FIRST_AXIS_ORDER, Boolean.TRUE);
        CRSAuthorityFactory factory = ReferencingFactoryFinder.getCRSAuthorityFactory("EPSG", hints);
        CoordinateReferenceSystem requestCRS = factory.createCoordinateReferenceSystem("EPSG:4326");

        //The bounding box is created in EPSG 4326.  The line below takes the coordinates given and references to the sourceCRS (EPSG:4326).
        //The envelope is then transformed to the native (targetCRS) bounds below.
        BoundingBox requestedBounds = this.currentLayer.getRequestedBounds();

        ReferencedEnvelope envelope = new ReferencedEnvelope(requestedBounds.getMinX(), requestedBounds.getMaxX(), requestedBounds.getMinY(),
                requestedBounds.getMaxY(), requestCRS);

        ReferencedEnvelope requestEnvelope = envelope.transform(supportedCRS, true);

        //now, intersect with the native bounds
        return requestEnvelope.intersection(nativeEnvelope);

    }

    @Override
    public List<String> getUrls(LayerRequest layer) throws Exception {
        String url = layer.getWcsUrl();
        this.checkUrl(url);
        return urlToUrls(url);
    }

    /**
     * Send the actual DescribeCoverage request
     *
     * @return
     * @throws Exception
     */
    OwsInfo getWcsDescribeCoverageInfo()
            throws Exception {
        InputStream inputStream = null;

        try {
            String layerName = this.currentLayer.getLayerNameNS();

            inputStream = this.httpRequester.sendRequest(OgpUtils.filterQueryString(this.getUrl(this.currentLayer)), ogcInfoRequest.createRequest(layerName), ogcInfoRequest.getMethod());
            //parse the returned XML and return needed info as a map
            return ogcInfoRequest.parseResponse(inputStream);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }


    @Override
    public Boolean includesMetadata() {
        return INCLUDES_METADATA;
    }


}
