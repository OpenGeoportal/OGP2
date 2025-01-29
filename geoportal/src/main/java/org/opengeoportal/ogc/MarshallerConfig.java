package org.opengeoportal.ogc;

import org.opengeoportal.ogc.wmc.jaxb.ViewContextType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

@Configuration
public class MarshallerConfig {

    @Bean
    Jaxb2Marshaller marshaller(){
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setClassesToBeBound(ViewContextType.class);
        return marshaller;
    }

}
