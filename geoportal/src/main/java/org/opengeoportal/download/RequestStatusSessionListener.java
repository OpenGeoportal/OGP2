package org.opengeoportal.download;

import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

public class RequestStatusSessionListener implements HttpSessionListener {

final Logger logger = LoggerFactory.getLogger(this.getClass());

   public void sessionDestroyed(HttpSessionEvent httpSessionEvent) {
	   //might make more sense to do this on a timer instead of a session listener?
	   HttpSession session = httpSessionEvent.getSession();
	   String sessionId = session.getId();
	   //unfortunately, there doesn't currently seem to be a nice way to inject this dependency in the regular fashion
       ApplicationContext ctx = WebApplicationContextUtils.getWebApplicationContext(session.getServletContext());
       RequestStatusManager requestStatusManager = (RequestStatusManager) ctx.getBean("requestStatusManager");
	   if (requestStatusManager != null){
		   requestStatusManager.removeRequestsBySessionId(sessionId);
		   logger.debug("Removing Status info for session: "+ sessionId);
	   } else {
		   logger.error("The ingestStatusManager has a null value here");
	   }
   }
 
	
public void sessionCreated(HttpSessionEvent httpSessionEvent) {
	// not doing anything here for now
	logger.debug("new session created");
}	


}
