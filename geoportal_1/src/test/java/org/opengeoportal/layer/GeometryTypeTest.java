package org.opengeoportal.layer;

import org.junit.Assert;
import org.junit.Test;

/**
 * Created by cbarne02 on 6/15/17.
 */
public class GeometryTypeTest {
    @Test
    public void getGeneralizedDataType() throws Exception {
    }

    @Test
    public void getGeneralizedDataTypeString() throws Exception {
    }

    @Test
    public void parseGeometryTypeLine() throws Exception {
        Assert.assertEquals(GeometryType.Line, GeometryType.parseGeometryType("Line"));
        Assert.assertEquals(GeometryType.Line, GeometryType.parseGeometryType("Line "));
        Assert.assertEquals(GeometryType.Line, GeometryType.parseGeometryType(" Line "));
        Assert.assertEquals(GeometryType.Line, GeometryType.parseGeometryType("line "));
        Assert.assertEquals(GeometryType.Line, GeometryType.parseGeometryType("line"));
    }

    @Test
    public void parseGeometryTypePoint() throws Exception {
        Assert.assertEquals(GeometryType.Point, GeometryType.parseGeometryType("Point"));
        Assert.assertEquals(GeometryType.Point, GeometryType.parseGeometryType("Point "));
        Assert.assertEquals(GeometryType.Point, GeometryType.parseGeometryType(" Point "));
        Assert.assertEquals(GeometryType.Point, GeometryType.parseGeometryType("point "));
        Assert.assertEquals(GeometryType.Point, GeometryType.parseGeometryType("point"));
    }

    @Test
    public void parseGeometryTypePolygon() throws Exception {
        Assert.assertEquals(GeometryType.Polygon, GeometryType.parseGeometryType("Polygon"));
        Assert.assertEquals(GeometryType.Polygon, GeometryType.parseGeometryType("Polygon "));
        Assert.assertEquals(GeometryType.Polygon, GeometryType.parseGeometryType(" Polygon "));
        Assert.assertEquals(GeometryType.Polygon, GeometryType.parseGeometryType("polygon "));
        Assert.assertEquals(GeometryType.Polygon, GeometryType.parseGeometryType("polygon"));
    }

    @Test
    public void parseGeometryTypeRaster() throws Exception {
        Assert.assertEquals(GeometryType.Raster, GeometryType.parseGeometryType("Raster"));
        Assert.assertEquals(GeometryType.Raster, GeometryType.parseGeometryType("Raster "));
        Assert.assertEquals(GeometryType.Raster, GeometryType.parseGeometryType(" Raster "));
        Assert.assertEquals(GeometryType.Raster, GeometryType.parseGeometryType("raster "));
        Assert.assertEquals(GeometryType.Raster, GeometryType.parseGeometryType("raster"));
    }

    @Test
    public void parseGeometryTypeScannedMap() throws Exception {
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("Scanned Map"));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("Scanned Map "));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType(" Scanned Map "));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("scanned map "));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("scanned map"));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("scanned  \n map "));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("scannedmap"));
        Assert.assertEquals(GeometryType.ScannedMap, GeometryType.parseGeometryType("ScannedMap"));

    }

    @Test
    public void parseGeometryTypePaperMap() throws Exception {
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType("Paper Map"));
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType("Paper Map "));
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType(" Paper  Map "));
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType("paper map "));
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType("papermap"));
        Assert.assertEquals(GeometryType.PaperMap, GeometryType.parseGeometryType("PaperMap"));

    }
}