package org.opengeoportal.controllers;

import org.opengeoportal.metadata.MetadataRetriever;
import org.opengeoportal.metadata.exception.MetadataParsingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/catalog")
public class LayerController {
    private final MetadataRetriever metadataRetriever;


    @Autowired
    public LayerController(MetadataRetriever metadataRetriever) {
        this.metadataRetriever = metadataRetriever;
    }

    /**
     * if you want to keep extension management, set the useRegisteredSuffixPatternMatch property of
     * RequestMappingHandlerMapping bean in order to keep suffixPattern recognition activated but
     * limited to registered extensions.
     */
    /**
     * @return
     * @throws Exception
     */
    @RequestMapping(value = "/{layerId}/metadata", method = RequestMethod.GET)
    public
    @ResponseBody ResponseEntity getMetadata(@RequestHeader(value = "X-Requested-With", defaultValue = "standalone") String requestedWith,
                               @PathVariable String layerId) throws Exception {
        //TODO: offer other response formats?;
        //String uri$ = extractPathPrefix(request.getRequestURI());
        boolean withCss = false;
        if (requestedWith.equalsIgnoreCase("standalone")) {
            //if not from an ajax request, inject metadata.css
            withCss = true;
        }

        String metadataString = this.metadataRetriever.getMetadataAsHtml(layerId, withCss);
        if (metadataString.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentLength(metadataString.getBytes().length)
                .contentType(MediaType.TEXT_HTML)
                .body(metadataString);

    }


    @GetMapping("{layerId}/metadata/attributeInfo")
    @ResponseBody Map<String,String> getAttributeInfoFromLayerId(@PathVariable("layerId") String layerId) throws MetadataParsingException {
        return metadataRetriever.getAttributeDescriptions(layerId);
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
