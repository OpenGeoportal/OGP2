package org.opengeoportal.layer;

public enum AccessLevel {
	Public, Restricted;
	
	public static AccessLevel parseString(String accessString){
		if (accessString.equalsIgnoreCase("public")){
			return AccessLevel.Public;
		} else {
			return AccessLevel.Restricted;
		}
	}
}
