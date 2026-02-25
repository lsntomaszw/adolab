package dev.adolab.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(
        String apiKey,
        String model,
        String embeddingModel
) {
    public String chatCompletionsUrl() {
        return "https://api.openai.com/v1/chat/completions";
    }

    public String embeddingsUrl() {
        return "https://api.openai.com/v1/embeddings";
    }
}
