package dev.adolab.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.util.Base64;

@Configuration
public class RestClientConfiguration {

    @Bean
    public RestClient azureDevOpsRestClient(AzureDevOpsProperties props) {
        String credentials = Base64.getEncoder()
                .encodeToString((":" + props.pat()).getBytes());

        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .defaultHeader("Authorization", "Basic " + credentials)
                .build();
    }

    @Bean
    public RestClient openAiRestClient(OpenAiProperties props) {
        return RestClient.builder()
                .baseUrl("https://api.openai.com")
                .defaultHeader("Authorization", "Bearer " + props.apiKey())
                .build();
    }
}
