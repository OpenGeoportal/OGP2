package org.opengeoportal.search;

import java.util.Arrays;

public interface OGPRecord {
    static String getFieldList() {

        return String.join(",",  Arrays.asList("LayerId", "Name", "CollectionId", "Institution",
                "Access", "DataType", "Availability", "LayerDisplayName", "Publisher", "Originator", "GeoReferenced",
                "Abstract", "Location", "MinX", "MinY", "MaxX", "MaxY", "WorkspaceName", "ContentDate"));
    }

    String getLayerId();
    String getAccess();
    String getInstitution();
    String getDataType();
    String getName();
    String getWorkspaceName();
    String getLayerDisplayName();
    String getDescription();
    String getLocation();
    Double getMinX();
    Double getMinY();
    Double getMaxX();
    Double getMaxY();
}
