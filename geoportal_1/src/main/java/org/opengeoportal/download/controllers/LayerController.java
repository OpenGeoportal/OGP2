package org.opengeoportal.download.controllers;

import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.metadata.AttributeDictionary;
import org.opengeoportal.metadata.AttributeDictionaryRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

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
     * @param layerId
     * @return
     * @throws Exception
     */
    @RequestMapping(value = "/{layerId:.+}", method = RequestMethod.GET)
    public
    @ResponseBody
    ResponseEntity<String> getMetadata(@RequestHeader(value = "X-Requested-With", defaultValue = "standalone") String requestedWith,
                                       @PathVariable String layerId) throws Exception {
        //TODO: offer other response formats?;

        logger.debug(layerId);
        boolean embedded = true;
        if (requestedWith.equalsIgnoreCase("standalone")) {
            //if not from an ajax request, inject metadata.css
            embedded = false;
        }

        String metadataString = this.metadataRetriever.getMetadataAsHtml(layerId, embedded);

        return ResponseEntity.ok()
                .contentLength(metadataString.getBytes().length)
                .contentType(MediaType.TEXT_HTML)
                .body(metadataString);

    }


    @RequestMapping(value = "/{layerId:.+}/attributes", method = RequestMethod.GET)
    public
    @ResponseBody
    AttributeDictionary getAttributeDictionary(@PathVariable String layerId) throws Exception {
        return attributeDictionaryRetriever.getAttributeDictionary(layerId);
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
