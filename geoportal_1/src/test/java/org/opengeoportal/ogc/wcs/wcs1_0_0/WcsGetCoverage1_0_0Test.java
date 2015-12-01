package org.opengeoportal.ogc.wcs.wcs1_0_0;

import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.CRS;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created by cbarne02 on 11/25/15.
 */
public class WcsGetCoverage1_0_0Test {
    final Logger logger = LoggerFactory.getLogger(WcsGetCoverage1_0_0Test.class);

    @Test(expected = Exception.class)
    public void testSupportsNullArgs() throws Exception {
        CoverageOffering1_0_0.supports(null, null);
    }

    @Test
    public void testSupportsEmptyArgs() throws Exception {
        List<String> list = new ArrayList<>();
        boolean supports = CoverageOffering1_0_0.supports(list, null);
        Assert.assertFalse("Supports should be false for an empty list", supports);
    }

    @Test(expected = Exception.class)
    public void testCreateWcsGetCoverageRequestNullArgs() throws Exception {
        WcsGetCoverage1_0_0.createWcsGetCoverageRequest(null, null, null, null, null);

    }


    @Test(expected = Exception.class)
    public void testCreateWcsGetCoverageRequestEmptyArgs() throws Exception {
        /**
         *
         * @param layerName
         * @param coverageOffering
         * @param bounds
         * @param epsgCode
         * @param outputFormat
         * @param nativeBbox
         * @return
         * @throws Exception
         */
        CoverageOffering1_0_0 offering = new CoverageOffering1_0_0();
        offering.setSupportedFormats(new ArrayList<String>());
        offering.setSupportedCRSs(new ArrayList<String>());
        String request = WcsGetCoverage1_0_0.createWcsGetCoverageRequest("", null, new Envelope(0.0,0.0,0.0,0.0), null,
                offering);
        Assert.assertTrue("Invalid request String", !request.isEmpty());
        logger.info(request);
    }

    @Test(expected = Exception.class)
    public void testCreateWcsGetCoverageRequestSparseArgs() throws Exception {

        CoverageOffering1_0_0 offering = new CoverageOffering1_0_0();
        offering.setSupportedFormats(new ArrayList<>(Arrays.asList("GEOTIFF")));
        offering.setSupportedCRSs(new ArrayList<>(Arrays.asList("4326")));
        String request = WcsGetCoverage1_0_0.createWcsGetCoverageRequest("name", "GEOTIFF",
                new Envelope(0.0,0.0,0.0,0.0), "EPSG:4326", offering);
        Assert.assertTrue("Invalid request String", !request.isEmpty());

        logger.info(request);

    }

    @Test
    public void testCreateWcsGetCoverageRequestMinimumArgs() throws Exception {

        CoverageOffering1_0_0 offering = new CoverageOffering1_0_0();
        offering.setSupportedFormats(new ArrayList<>(Arrays.asList("GEOTIFF")));
        offering.setSupportedCRSs(new ArrayList<>(Arrays.asList("4326")));
        RectifiedGrid grid = new RectifiedGrid();
        grid.setResx(0.0);
        grid.setResy(0.0);
        offering.setRectifiedGrid(grid);
        offering.setNativeEnvelope(new ReferencedEnvelope(0.0, 0.0, 0.0, 0.0, CRS.decode("EPSG:4326")));
        String request = WcsGetCoverage1_0_0.createWcsGetCoverageRequest("name", "GEOTIFF",
                new Envelope(0.0, 0.0, 0.0, 0.0), "EPSG:4326", offering);
        Assert.assertTrue("Invalid request String", !request.isEmpty());

        logger.info(request);

    }


}