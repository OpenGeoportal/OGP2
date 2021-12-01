package org.opengeoportal.controllers;

import org.opengeoportal.download.MetadataRetriever;
import org.opengeoportal.download.exception.MetadataParsingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
@RequestMapping("/metadata")
public class MetadataController {
    private final MetadataRetriever metadataRetriever;

    @Autowired
    public MetadataController(MetadataRetriever metadataRetriever) {
        this.metadataRetriever = metadataRetriever;
    }

    @GetMapping("{layerId}/attributeInfo")
    @ResponseBody Map<String,String> getAttributeInfoFromLayerId(@PathVariable("layerId") String layerId) throws MetadataParsingException {
        return metadataRetriever.getAttributeDescriptions(layerId);
    }
}
