package org.opengeoportal.download;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.opengeoportal.config.download.OgpDownloadConfigRetriever;
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

    @BeforeEach
    void setupTests() throws IOException {
        Resource resource = new ClassPathResource(downloadConfigJsonPath);

        OgpDownloadConfigRetriever dlConfigRetriever = new OgpDownloadConfigRetriever(resource);
        layerDownloaderProvider = new LayerDownloaderProvider(dlConfigRetriever);
        layerDownloaderProvider.init();
    }

    /**
     * Test to check that vector data type values from Solr generalize to the value used as a key in ogpDownloadConfig.json
     */
    @Test
    public void getGeneralizedDataTypeVectorTest() {
        List<String> testVector = List.of("Point", "Line", "Polygon", "Undefined", "random garbage");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            assertThat(actual).isEqualTo("vector");
        }
    }

    /**
     * Test to check that raster data type values from Solr generalize to the value used as a key in ogpDownloadConfig.json
     */
    @Test
    public void getGeneralizedDataTypeRasterTest() {
        List<String> testVector = List.of("Raster");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            assertThat(actual).isEqualTo("raster");

        }
    }

    /**
     * Test to check that scanned map data type values from Solr generalize to the value used
     * as a key in ogpDownloadConfig.json. For historical reasons, 'paper map' is the key used in the config object.
     */
    @Test
    public void getGeneralizedDataTypeScannedMapTest() {
        List<String> testVector = List.of("Scanned Map", "Paper Map", "ScannedMap");

        for (String testVal : testVector) {
            String actual = LayerDownloaderProvider.getGeneralizedDataType(testVal);
            assertThat(actual).isEqualTo("paper map");

        }
    }
}