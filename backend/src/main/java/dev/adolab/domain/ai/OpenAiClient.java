package dev.adolab.domain.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.adolab.config.OpenAiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final RestClient restClient;
    private final OpenAiProperties props;

    public OpenAiClient(RestClient openAiRestClient, OpenAiProperties props) {
        this.restClient = openAiRestClient;
        this.props = props;
    }

    public String chatCompletion(String systemPrompt, String userContent) {
        var request = new ChatRequest(
                props.model(),
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userContent)
                ),
                0.2
        );

        log.debug("OpenAI chat request: model={}, userContent length={}", props.model(), userContent.length());

        ChatResponse response = restClient.post()
                .uri("/v1/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(ChatResponse.class);

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new RuntimeException("Empty response from OpenAI chat API");
        }

        String content = response.choices().getFirst().message().content();
        log.debug("OpenAI chat response: {} tokens used", response.usage() != null ? response.usage().totalTokens() : "?");
        return content;
    }

    public List<Double> generateEmbedding(String text) {
        var request = Map.of(
                "model", props.embeddingModel(),
                "input", text
        );

        log.debug("OpenAI embedding request: model={}, text length={}", props.embeddingModel(), text.length());

        EmbeddingResponse response = restClient.post()
                .uri("/v1/embeddings")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(EmbeddingResponse.class);

        if (response == null || response.data() == null || response.data().isEmpty()) {
            throw new RuntimeException("Empty response from OpenAI embeddings API");
        }

        List<Double> embedding = response.data().getFirst().embedding();
        log.debug("OpenAI embedding response: {} dimensions", embedding.size());
        return embedding;
    }

    // --- DTOs ---

    record ChatRequest(String model, List<ChatMessage> messages, double temperature) {}

    record ChatMessage(String role, String content) {}

    record ChatResponse(
            List<Choice> choices,
            Usage usage
    ) {}

    record Choice(ChatMessage message) {}

    record Usage(
            @JsonProperty("prompt_tokens") int promptTokens,
            @JsonProperty("completion_tokens") int completionTokens,
            @JsonProperty("total_tokens") int totalTokens
    ) {}

    record EmbeddingResponse(List<EmbeddingData> data) {}

    record EmbeddingData(List<Double> embedding, int index) {}
}
