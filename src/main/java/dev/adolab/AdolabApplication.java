package dev.adolab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AdolabApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdolabApplication.class, args);
    }
}
