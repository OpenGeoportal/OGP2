package org.opengeoportal.download.controllers;

import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.metadata.AttributeDictionary;
import org.opengeoportal.metadata.AttributeDictionaryRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.Map;


/**
 * Created by cbarne02 on 5/27/15.
 */
@Controller
@RequestMapping("/layer")
public class LayerController {

    @Autowired
    private MetadataRetriever metadataRetriever;

    @Autowired
    private AttributeDictionaryRetriever attributeDictionaryRetriever;

    final Logger logger = LoggerFactory.getLogger(this.getClass());

    /**
     * if you want to keep extension management, set the useRegisteredSuffixPatternMatch property of
     * RequestMappingHandlerMapping bean in order to keep suffixPattern recognition activated but
     * limited to registered extensions.
     */
    /**
     * @param request
     * @return
     * @throws Exception
     */
    @RequestMapping(value = "/**", method = RequestMethod.GET)
    public
    @ResponseBody
    ResponseEntity getMetadata(@RequestHeader(value = "X-Requested-With", defaultValue = "standalone") String requestedWith,
                               HttpServletRequest request) throws Exception {
        //TODO: offer other response formats?;
        String uri$ = extractPathPrefix(request.getRequestURI());
        boolean embedded = true;
        if (requestedWith.equalsIgnoreCase("standalone")) {
            //if not from an ajax request, inject metadata.css
            embedded = false;
        }

        String metadataString = this.metadataRetriever.getMetadataAsHtml(uri$, embedded);
        if (metadataString.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentLength(metadataString.getBytes().length)
                .contentType(MediaType.TEXT_HTML)
                .body(metadataString);

    }

    private String extractPathPrefix(String uri) {
        String path = "/layer/";
        uri = uri.substring(uri.indexOf(path) + path.length());
        return uri;
    }

    @RequestMapping(value = "/**/attributes", method = RequestMethod.GET)
    public
    @ResponseBody
    AttributeDictionary getAttributeDictionary(HttpServletRequest request) throws Exception {
        String uri$ = extractPathPrefix(request.getRequestURI());
        uri$ = uri$.substring(0, uri$.indexOf("/attributes"));
        logger.info(uri$);
        AttributeDictionary attributeDictionary = attributeDictionaryRetriever.getAttributeDictionary(uri$);
        return attributeDictionary;
    }

    @ExceptionHandler(Exception.class)
    public
    @ResponseBody
    Map<String, String> handleException(Exception e) {
        Map<String, String> errorMap = new HashMap<String, String>();
        errorMap.put("error", e.getMessage());
        return errorMap;
    }

}
