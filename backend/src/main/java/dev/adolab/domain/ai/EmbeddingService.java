package dev.adolab.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.adolab.config.OpenAiProperties;
import dev.adolab.domain.ai.dao.EmbeddingDao;
import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemComment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private static final String SUMMARIZE_SYSTEM_PROMPT = """
            You summarize Azure DevOps work items in English. Given the title, description, \
            and comments of a work item, produce a JSON response with exactly this structure:
            {
              "summary": "2-3 sentence English summary covering the full context including key discussions from comments",
              "keywords": ["keyword1", "keyword2", "keyword3"],
              "detectedLanguage": "ISO 639-1 code of the primary language used in the description and comments (e.g. 'en', 'el', 'de')",
              "translationEn": "If the content is NOT in English, provide a thorough English translation of the description and key comment content. Preserve all meaningful information faithfully - this is a translation, not a summary. If the content is already in English, set this to null."
            }
            Include context from ALL comments - they often contain critical information about decisions, \
            blockers, and progress. Extract 5-10 meaningful keywords that capture the essence of the work item. \
            For detectedLanguage, detect the primary language of the description and comment text \
            (ignore metadata fields like State, Type which are always in English). \
            For translationEn, only produce a translation when the content language is NOT English. \
            The translation should faithfully render the description and substantive comment content into English. \
            Return ONLY valid JSON, no markdown formatting.""";

    private final OpenAiClient openAiClient;
    private final OpenAiProperties props;
    private final EmbeddingDao embeddingDao;
    private final ObjectMapper objectMapper;

    public EmbeddingService(OpenAiClient openAiClient, OpenAiProperties props,
                            EmbeddingDao embeddingDao, ObjectMapper objectMapper) {
        this.openAiClient = openAiClient;
        this.props = props;
        this.embeddingDao = embeddingDao;
        this.objectMapper = objectMapper;
    }

    public void generateForWorkItem(WorkItem item, List<WorkItemComment> comments) {
        String context = buildContext(item, comments);

        // Step 1: Generate English summary via LLM
        String llmResponse = openAiClient.chatCompletion(SUMMARIZE_SYSTEM_PROMPT, context);

        String summaryEn;
        String[] keywords;
        String detectedLanguage = null;
        String translationEn = null;
        try {
            JsonNode json = objectMapper.readTree(llmResponse);
            summaryEn = json.get("summary").asText();
            List<String> kwList = new ArrayList<>();
            if (json.has("keywords") && json.get("keywords").isArray()) {
                for (JsonNode kw : json.get("keywords")) {
                    kwList.add(kw.asText());
                }
            }
            keywords = kwList.toArray(new String[0]);
            if (json.has("detectedLanguage") && !json.get("detectedLanguage").isNull()) {
                detectedLanguage = json.get("detectedLanguage").asText();
            }
            if (json.has("translationEn") && !json.get("translationEn").isNull()) {
                translationEn = json.get("translationEn").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse LLM summary for work item {}, using raw response", item.id(), e);
            summaryEn = llmResponse;
            keywords = new String[0];
        }

        // Step 2: Generate embedding from summary
        List<Double> embedding = openAiClient.generateEmbedding(summaryEn);
        String embeddingStr = vectorToString(embedding);

        // Step 3: Store in DB
        embeddingDao.upsert(item.id(), item.syncConfigId(), summaryEn, keywords,
                embeddingStr, props.embeddingModel(), detectedLanguage, translationEn);

        log.debug("Generated embedding for work item {} (lang={}, summary: {} chars, {} keywords, translation: {})",
                item.id(), detectedLanguage, summaryEn.length(), keywords.length,
                translationEn != null ? translationEn.length() + " chars" : "none");
    }

    public String embedQuery(String query) {
        List<Double> embedding = openAiClient.generateEmbedding(query);
        return vectorToString(embedding);
    }

    private String buildContext(WorkItem item, List<WorkItemComment> comments) {
        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(item.title()).append("\n");
        sb.append("Type: ").append(item.workItemType()).append("\n");
        sb.append("State: ").append(item.state()).append("\n");

        if (item.assignedTo() != null) {
            sb.append("Assigned to: ").append(item.assignedTo()).append("\n");
        }
        if (item.tags() != null) {
            sb.append("Tags: ").append(item.tags()).append("\n");
        }

        if (item.description() != null && !item.description().isBlank()) {
            String desc = stripHtml(item.description());
            if (desc.length() > 3000) {
                desc = desc.substring(0, 3000) + "...";
            }
            sb.append("\nDescription:\n").append(desc).append("\n");
        }

        if (comments != null && !comments.isEmpty()) {
            sb.append("\nComments (").append(comments.size()).append("):\n");
            for (WorkItemComment c : comments) {
                String text = stripHtml(c.text());
                if (text.length() > 500) {
                    text = text.substring(0, 500) + "...";
                }
                sb.append("[").append(c.createdBy() != null ? c.createdBy() : "unknown").append("] ");
                sb.append(text).append("\n");
            }
        }

        return sb.toString();
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
    }

    static String vectorToString(List<Double> vector) {
        return "[" + vector.stream()
                .map(d -> String.valueOf(d.floatValue()))
                .collect(Collectors.joining(",")) + "]";
    }
}
