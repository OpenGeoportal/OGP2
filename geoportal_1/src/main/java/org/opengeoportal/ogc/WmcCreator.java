package org.opengeoportal.ogc;

import java.io.OutputStream;
import java.util.Map;

import javax.xml.transform.Result;

import org.opengeoportal.layer.BoundingBox;
import org.opengeoportal.ogc.OwsInfo.OwsType;

public interface WmcCreator {

	Result getWmcResponse(Map<String, OwsType> idsAndFormats,
			BoundingBox bounds, OutputStream os) throws Exception;

}
