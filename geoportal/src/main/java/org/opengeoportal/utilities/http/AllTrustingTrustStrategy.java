package org.opengeoportal.utilities.http;

import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import org.apache.http.conn.ssl.TrustStrategy;

public class AllTrustingTrustStrategy implements TrustStrategy {

	@Override
	public boolean isTrusted(X509Certificate[] arg0, String arg1)
			throws CertificateException {
		// accept all certs
		return true;
	}

}
