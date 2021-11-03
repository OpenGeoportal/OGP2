package org.opengeoportal.layer;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.*;

/**
 * Created by cbarne02 on 6/15/17.
 */
public class GeometryTypeTest {
    @Test
    public void getGeneralizedDataType() {
    }

    @Test
    public void getGeneralizedDataTypeString() {
    }

    @Test
    public void parseGeometryTypeLine() {
        assertThat(GeometryType.parseGeometryType("Line")).isEqualTo(GeometryType.Line);
        assertThat(GeometryType.parseGeometryType("Line ")).isEqualTo(GeometryType.Line);
        assertThat(GeometryType.parseGeometryType(" Line ")).isEqualTo(GeometryType.Line);
        assertThat(GeometryType.parseGeometryType("line")).isEqualTo(GeometryType.Line);
        assertThat(GeometryType.parseGeometryType("line ")).isEqualTo(GeometryType.Line);
    }

    @Test
    public void parseGeometryTypePoint() {
        assertThat(GeometryType.parseGeometryType("Point")).isEqualTo(GeometryType.Point);
        assertThat(GeometryType.parseGeometryType("Point ")).isEqualTo(GeometryType.Point);
        assertThat(GeometryType.parseGeometryType(" Point ")).isEqualTo(GeometryType.Point);
        assertThat(GeometryType.parseGeometryType("point")).isEqualTo(GeometryType.Point);
        assertThat(GeometryType.parseGeometryType("point ")).isEqualTo(GeometryType.Point);
    }

    @Test
    public void parseGeometryTypePolygon() {
        assertThat(GeometryType.parseGeometryType("Polygon")).isEqualTo(GeometryType.Polygon);
        assertThat(GeometryType.parseGeometryType("Polygon ")).isEqualTo(GeometryType.Polygon);
        assertThat(GeometryType.parseGeometryType(" Polygon ")).isEqualTo(GeometryType.Polygon);
        assertThat(GeometryType.parseGeometryType("polygon")).isEqualTo(GeometryType.Polygon);
        assertThat(GeometryType.parseGeometryType("polygon ")).isEqualTo(GeometryType.Polygon);
    }

    @Test
    public void parseGeometryTypeRaster() {
        assertThat(GeometryType.parseGeometryType("Raster")).isEqualTo(GeometryType.Raster);
        assertThat(GeometryType.parseGeometryType("Raster ")).isEqualTo(GeometryType.Raster);
        assertThat(GeometryType.parseGeometryType(" Raster ")).isEqualTo(GeometryType.Raster);
        assertThat(GeometryType.parseGeometryType("raster")).isEqualTo(GeometryType.Raster);
        assertThat(GeometryType.parseGeometryType("raster ")).isEqualTo(GeometryType.Raster);
    }

    @Test
    public void parseGeometryTypeScannedMap() {
        assertThat(GeometryType.parseGeometryType("Scanned Map")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("Scanned Map ")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType(" Scanned Map ")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("scanned map")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("scanned map ")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("scanned  \n map ")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("scannedmap")).isEqualTo(GeometryType.ScannedMap);
        assertThat(GeometryType.parseGeometryType("ScannedMap")).isEqualTo(GeometryType.ScannedMap);
    }

    @Test
    public void parseGeometryTypePaperMap() {
        assertThat(GeometryType.parseGeometryType("Paper Map")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("Paper Map ")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType(" Paper Map ")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("paper map")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("paper map ")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("paper  \n map")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("papermap")).isEqualTo(GeometryType.PaperMap);
        assertThat(GeometryType.parseGeometryType("PaperMap")).isEqualTo(GeometryType.PaperMap);

    }
}