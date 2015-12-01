package org.opengeoportal.ogc.wcs.wcs1_0_0;

import org.junit.Test;

import java.io.InputStream;

/**
 * Created by cbarne02 on 11/25/15.
 */
public class WcsDescribeCoverage1_0_0Test {

    private String coverageResponse = "wcsDescribeCoverage.xml";
    private String sparseResponse = "wcsDescribeCoverageSparseResponse.xml";
    private String errorResponse = "wcsDescribeCoverageServiceException.xml";

    private InputStream getResponse(String filename){
        return this.getClass().getResourceAsStream("/org/opengeoportal/ogc/wcs/wcs1_0_0/" + filename);
    }

    @Test(expected = Exception.class)
    public void testCreateRequest() throws Exception {
        WcsDescribeCoverage1_0_0 describe = new WcsDescribeCoverage1_0_0();
        describe.createRequest(null);
    }

    @Test
    public void testParseResponse() throws Exception {
        WcsDescribeCoverage1_0_0 describe = new WcsDescribeCoverage1_0_0();
        describe.parseResponse(getResponse(coverageResponse));
    }

    @Test
    public void testParseResponseSparse() throws Exception {
        WcsDescribeCoverage1_0_0 describe = new WcsDescribeCoverage1_0_0();
        describe.parseResponse(getResponse(sparseResponse));

    }

    @Test(expected = Exception.class)
    public void testParseResponseError() throws Exception {
        WcsDescribeCoverage1_0_0 describe = new WcsDescribeCoverage1_0_0();
        describe.parseResponse(getResponse(errorResponse));

    }



}