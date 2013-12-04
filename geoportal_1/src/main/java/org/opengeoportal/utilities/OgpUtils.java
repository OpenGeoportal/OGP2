package org.opengeoportal.utilities;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * A class containing utility methods that should be useful throughout the project
 * 
 * @author cbarne02
 *
 */

public class OgpUtils {
	final static Logger logger = LoggerFactory.getLogger(OgpUtils.class.getName());

	/**
	 * a method to determine if an email address is well-formed or not
	 * 
	 * Validity of an email address is very difficult to determine.  For now, at least, we must
	 * be content to ensure that an email address could actually be a real email address.
	 * 
	 * @param emailAddress	a String containing a potential email address
	 * @return a Boolean base on whether the email address appears to be well-formed or not
	 */
	public static Boolean isWellFormedEmailAddress(String emailAddress){
		//a very basic check of the email address
		emailAddress = emailAddress.trim();
		if (emailAddress.contains(" ")){
			return false;
		}
		String[] arr = emailAddress.split("@");
		if (arr.length != 2){
			return false;
		}
		if (!arr[1].contains(".")){
			return false;
		}

		return true;
	}
	
	
	/**
	 * a convenience method to get a url without the query string
	 * 
	 * @param url	a url String
	 * @return a url String without the query String
	 */
	public static String filterQueryString(String url){
	    if (url.contains("?")){
	    	//can happen with generic ows endpoint
	    	//get rid of everything after the query param 
	    	url = url.substring(0,url.indexOf("?"));
	    }

	    return url;
	}
	
	/**
	 * a convenience method that takes a Set of Strings of mixed case and returns a copy of the Set in all lowercase
	 * useful for String matching using Set.contains()
	 * 
	 * @param mixedCaseSet	a Set of Strings of arbitrary case
	 * @return a Set of Strings that is all lowercase
	 */
	public static Set<String> getSetAsLowerCase(Set<String> mixedCaseSet){
		  Set<String> lcSet = new HashSet<String>();
		  for (String name: mixedCaseSet){
			  lcSet.add(name.toLowerCase());
		  }
		  return lcSet;
	  }
	
	public static Boolean containsIgnoreCase(Collection<String> stringCollection, String testString){
		for (String curr: stringCollection){
			if (curr.equalsIgnoreCase(testString)){
				return true;
			}
		}
		return false;
	}
	
	/**
	 * a convenience method to get the fully qualified name for a layer (workspace name plus layer name)
	 * 
	 * In some cases, the workspace name may be embedded in the layer name (an ingest error) or there may be no workspace name.
	 * This allows code that requires a qualified layer name to be more fault tolerant.
	 * 
	 * @param workspaceName	the workspace name for a layer
	 * @param layerName		the layer name 
	 * @return the layer name with workspace name (fully qualified)
	 * @throws Exception
	 */
	public static String getLayerNameNS(String workspaceName, String layerName) throws Exception{
		workspaceName = workspaceName.trim();
		layerName = layerName.trim();
		
		String embeddedWSName = "";
		if (layerName.contains(":")){
			String[] layerNameArr = layerName.split(":");
			if (layerNameArr.length > 2){
				throw new Exception("Invalid layer name ['" + layerName + "']");
			}
			embeddedWSName = layerNameArr[0];
			layerName = layerNameArr[1];
		}
		if (!workspaceName.isEmpty()){
			//prefer the explicit workspaceName?
			return workspaceName + ":" + layerName;
		} else {
			if (embeddedWSName.isEmpty()){
				return layerName;
			} else {
				return embeddedWSName + ":" + layerName;
			}
		}
	}
	
	/**
	 * puts together a url with query string.
	 * 
	 * sometimes the provided url in the location field may contain query parameters.  This method removes
	 * duplicate parameters and determines whether a "?" is needed.  It may be better to replace this implementation
	 * using utility methods from Apache HttpComponents
	 * 
	 * @param path
	 * @param requestString
	 * @return combined URL
	 * @throws MalformedURLException
	 */
	public static String combinePathWithQuery(String path, String requestString) throws MalformedURLException{
		if (requestString.startsWith("?")){
			requestString = requestString.substring(requestString.indexOf("?"));
		}
		if (path.endsWith("?")){
			path = path.substring(0, path.indexOf("?"));
		}
		
		int count = StringUtils.countMatches(path, "?");
		if (count == 0){
			//we're good
		} else if (count == 1){

			//there are some embedded params
			String[] urlArr = path.split("\\?");
			path = urlArr[0];
			List<String> embeddedParams = new ArrayList<String>(Arrays.asList(urlArr[1].split("\\&")));
			List<String> queryParams = new ArrayList<String>(Arrays.asList(requestString.split("\\&")));
			List<String> duplicates = new ArrayList<String>();
			
			for (String mParam: embeddedParams){
				String mKey = mParam.split("=")[0];
				for (String qParam: queryParams){
					String qKey = qParam.split("=")[0];
					if (mKey.equalsIgnoreCase(qKey)){
						duplicates.add(mParam);
					}
				}
			}
			if (!duplicates.isEmpty()){
				embeddedParams.removeAll(duplicates);
			}
			if (!embeddedParams.isEmpty()){
				queryParams.addAll(embeddedParams);
			}
			requestString = StringUtils.join(queryParams, "&");
		} else if (count > 1){
			//something's really wrong here, or the path has parameters embedded in the path
			throw new MalformedURLException("This path is problematic: ['" + path + "']");
		}


		String combined = path + "?" + requestString;
		logger.info("Combined URL: " + combined);
		return combined;
	}

	
	/**
	 * Converts a Double to a String, rounding it to 7 decimal places.  Some OGC service endpoints have problems with 
	 * higher precision
	 * 
	 * @param value		Double to convert to String
	 * @return Double as a String, with rounding
	 */
	public static String doubleToString(Double value){
		logger.info(Double.toString(value));
	    BigDecimal valDec = new BigDecimal(value);
	    String valString = valDec.setScale(7, RoundingMode.HALF_UP).toPlainString();
	    return valString;
	}
	
	/**
	 * returns a bbox string from a ReferencedEnvelope object
	 * 
	 * @param env	ReferencedEnvelope
	 * @return bbox String
	 */
	public static String referencedEnvelopeToString(ReferencedEnvelope env){
		String envString = doubleToString(env.getMinX()) + ",";
		envString += doubleToString(env.getMinY()) + ",";
		envString += doubleToString(env.getMaxX()) + ",";
		envString += doubleToString(env.getMaxY());
		return envString;
	}
}
