package org.opengeoportal.download;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.opengeoportal.http.HttpRequester;
import org.opengeoportal.utilities.DirectoryRetriever;
import org.opengeoportal.utilities.OgpFileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class DownloadDirectoryTester {
    /***
     * Ensure that the download directory is readable and writable
     */

    Logger logger = LoggerFactory.getLogger(DownloadDirectoryTester.class);

    final
    DirectoryRetriever directoryRetriever;

    final HttpRequester httpRequester;

    @Autowired
    public DownloadDirectoryTester(DirectoryRetriever directoryRetriever, HttpRequester httpRequester) {
        this.directoryRetriever = directoryRetriever;
        this.httpRequester = httpRequester;
    }

    @PostConstruct
    public void testDirectory(){
        File downloadDirectory = directoryRetriever.getDownloadDirectory();

        logger.info("Download directory is: " + downloadDirectory.getAbsolutePath());
        assert downloadDirectory.isDirectory();
        assert downloadDirectory.canRead();
        assert downloadDirectory.canWrite();

        try {
            File testFile = OgpFileUtils.createNewFileFromDownload("test", "application/zip", downloadDirectory);
            //Path path = Paths.get(testFile.getAbsolutePath());
            //testDownload(path);
            testFile.delete();
        } catch (IOException e) {
            e.printStackTrace();
            logger.error("Failed to write test file to download directory.");
        }


    }

    public void testDownload(Path testFile) throws IOException {

        String request = "<wfs:GetFeature service=\"WFS\" version=\"1.0.0\" outputFormat=\"shape-zip\" xmlns:sde=\"http://sde.tufts.edu\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd\"><wfs:Query typeName=\"sde:GISPORTAL.GISOWNER01.MADISTRICTBOUNDARIES1213\"></wfs:Query></wfs:GetFeature>\n";
        String request2 = "<wfs:GetFeature service=\"WFS\" version=\"1.0.0\" outputFormat=\"shape-zip\" xmlns:massgis=\"http://massgis.state.ma.us/featuretype\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd\"><wfs:Query typeName=\"massgis:MORIS.PROT_CLP_POLY\"></wfs:Query></wfs:GetFeature>";

        InputStream inputStream = httpRequester.sendRequest("http://giswebservices.massgis.state.ma.us/geoserver/wfs", request2, "POST");


        BufferedInputStream bufferedIn = null;
        try {
            bufferedIn = new BufferedInputStream(inputStream);
            FileUtils.copyInputStreamToFile(bufferedIn, testFile.toFile());
        } finally {
            IOUtils.closeQuietly(bufferedIn);
        }
    }

}
