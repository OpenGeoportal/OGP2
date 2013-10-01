package org.OpenGeoPortal.Ogc;

import java.io.OutputStream;
import java.util.Map;

import javax.xml.transform.Result;

import org.OpenGeoPortal.Ogc.OwsInfo.OwsType;

public interface WmcCreator {

	Result getWmcResponse(Map<String, OwsType> idsAndFormats, OutputStream os)
			throws Exception;

}
