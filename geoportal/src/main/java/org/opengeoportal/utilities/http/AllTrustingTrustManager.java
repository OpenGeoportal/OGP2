package org.opengeoportal.utilities.http;

import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import javax.net.ssl.X509TrustManager;

public class AllTrustingTrustManager implements X509TrustManager
{
  // concept from http://hc.apache.org/index.html

public void checkClientTrusted(X509Certificate[] arg0, String arg1)
		throws CertificateException {
	
}

public void checkServerTrusted(X509Certificate[] arg0, String arg1)
		throws CertificateException {
	
}

public X509Certificate[] getAcceptedIssuers() {
	return null;
}
}
