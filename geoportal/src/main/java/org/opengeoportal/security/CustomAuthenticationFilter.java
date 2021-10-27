package org.opengeoportal.security;

import java.io.IOException;
import java.io.Writer;
 
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
 

 
public class CustomAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

	protected void onSuccessfulAuthentication(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain, Authentication authResult)
    throws IOException, ServletException {
		super.successfulAuthentication(request, response, chain, authResult); 
        HttpServletResponseWrapper responseWrapper = new HttpServletResponseWrapper(response);
 
        Writer out = responseWrapper.getWriter();
        
        //String targetUrl = determineTargetUrl( request );
        //out.write("{success:true, targetUrl : \'" + targetUrl + "\'}");
        out.close();
 
    }
 
    protected void onUnsuccessfulAuthentication( HttpServletRequest request,
            HttpServletResponse response, AuthenticationException failed )
    throws IOException {
 
        HttpServletResponseWrapper responseWrapper = new HttpServletResponseWrapper(response);
 
        Writer out = responseWrapper.getWriter();
 
        out.write("{ success: false, errors: { reason: 'Login failed. Try again.' }}");
        out.close();
 
    }

}
