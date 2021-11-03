package org.opengeoportal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.solr.SolrAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@SpringBootApplication(exclude = SolrAutoConfiguration.class)
@EnableAsync
public class OGPApplication {
    // close the application context to shut down the custom ExecutorService
    public static void main(String[] args) {
        SpringApplication.run(OGPApplication.class, args);
    }

    @Value("${minPoolSize}")
    private int minPoolSize;

    @Value("${maxPoolSize}")
    private int maxPoolSize;

    @Value("${queueCapacity}")
    private int queueCapacity;

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(minPoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("OGP-");
        executor.initialize();
        return executor;
    }
}
