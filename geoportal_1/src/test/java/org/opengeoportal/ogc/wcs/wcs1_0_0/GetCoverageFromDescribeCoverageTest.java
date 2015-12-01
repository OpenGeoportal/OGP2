package org.opengeoportal.ogc.wcs.wcs1_0_0;

import org.junit.Assert;
import org.junit.Test;
import org.opengeoportal.ogc.OwsInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;

/**
 * Created by cbarne02 on 11/27/15.
 */
public class GetCoverageFromDescribeCoverageTest {
    final Logger logger = LoggerFactory.getLogger(GetCoverageFromDescribeCoverageTest.class);

    private String coverageResponse = "wcsDescribeCoverage.xml";
    private String sparseResponse = "wcsDescribeCoverageSparseResponse.xml";
    private String errorResponse = "wcsDescribeCoverageServiceException.xml";

    private InputStream getResponse(String filename){
        return this.getClass().getResourceAsStream("/org/opengeoportal/ogc/wcs/wcs1_0_0/" + filename);
    }

    @Test
    public void testGetCoverageFromDescribeCoverage() throws Exception {
        WcsDescribeCoverage1_0_0 describe = new WcsDescribeCoverage1_0_0();
        OwsInfo info = describe.parseResponse(getResponse(sparseResponse));
        CoverageOffering1_0_0 offering = (CoverageOffering1_0_0) info.getOwsDescribeInfo();


        String request = WcsGetCoverage1_0_0.createWcsGetCoverageRequest("name", "GEOTIFF",
                offering.getLonLatEnvelope(), offering.getSupportedCRSs().get(0), offering);
        Assert.assertTrue("Invalid request String", !request.isEmpty());
        logger.info(request);
    }
}
