package org.opengeoportal.download;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Lists;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.List;

/**
 * Created by cbarne02 on 6/14/17.
 */
public class LayerDownloaderProviderTest {

    String downloadConfigJsonPath = "org/opengeoportal/download/ogpDownloadConfig_default.json";
    LayerDownloaderProvider layerDownloaderProvider;

    @Before
    public void setupTests() throws IOException {
        Resource resource = new ClassPathResource(downloadConfigJsonPath);
        ObjectMapper mapper = new ObjectMapper();
        JsonNode downloadConfig = mapper.readTree(resource.getInputStream()).path("institutions");

        layerDownloaderProvider = new LayerDownloaderProvider();
        layerDownloaderProvider.setDownloadConfig(downloadConfig);
    }

    /**
     * Test to check that vector data type values from Solr generalize to the value used as a key in ogpDownloadConfig.json
     */
    @Test
    public void getGeneralizedDataTypeVectorTest() {
        List<String> testVector = Lists.newArrayList("Point", "Line", "Polygon", "Undefined", "random garbage");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            Assert.assertEquals("vector", actual);
        }
    }

    /**
     * Test to check that raster data type values from Solr generalize to the value used as a key in ogpDownloadConfig.json
     */
    @Test
    public void getGeneralizedDataTypeRasterTest() {
        List<String> testVector = Lists.newArrayList("Raster");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            Assert.assertEquals("raster", actual);
        }
    }

    /**
     * Test to check that scanned map data type values from Solr generalize to the value used
     * as a key in ogpDownloadConfig.json. For historical reasons, 'paper map' is the key used in the config object.
     */
    @Test
    public void getGeneralizedDataTypeScannedMapTest() {
        List<String> testVector = Lists.newArrayList("Scanned Map", "Paper Map", "ScannedMap");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            Assert.assertEquals("paper map", actual);
        }
    }
}