package dev.adolab.domain.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.adolab.domain.ai.dao.EmbeddingDao;
import dev.adolab.domain.ai.dto.SearchPlan;
import dev.adolab.domain.ai.dto.SmartSearchResult;
import dev.adolab.domain.workitem.entity.WorkItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);

    private static final String QUERY_PLANNER_SYSTEM_PROMPT = """
            You decompose user queries about Azure DevOps work items into a structured search plan.
            Translate the user query to English regardless of the input language.

            Return ONLY valid JSON (no markdown) with this structure:
            {
              "response_type": "list" or "narrative",
              "semantic_query": "English search text for semantic matching, or null if not needed",
              "filters": {
                "states": [],
                "not_states": [],
                "types": [],
                "assignee": null,
                "date_from": null,
                "date_to": null,
                "staleness_days": null
              },
              "sort": "relevance" or "date" or "staleness",
              "explanation": "brief reasoning in the same language as user query"
            }

            Rules:
            - Use "narrative" when the user asks a question expecting a descriptive answer \
            (e.g. "what happened today?", "which tasks are ready to close?", "summarize progress", "status update").
            - Use "list" when the user is searching for items \
            (e.g. "tasks about validation", "show me bugs", "find issues related to X").
            - date_from/date_to should be ISO date strings (YYYY-MM-DD). Use today's date context.
            - staleness_days: number of days of inactivity (e.g. 30 for "not handled for a long time")
            - states/not_states: use Azure DevOps states like "New", "Active", "Resolved", "Closed", "Done", "Removed"
            - types: use types like "User Story", "Bug", "Task", "Feature", "Epic"
            - Always set semantic_query for conceptual/topic-based questions
            - For time-based queries without topic, set semantic_query to null
            - Keep explanation concise""";

    private static final String NARRATIVE_SYSTEM_PROMPT = """
            You are a helpful assistant that summarizes Azure DevOps work items.
            Given a user's question and a list of relevant work items with their summaries, \
            provide a clear, concise narrative answer in the SAME LANGUAGE as the user's question.

            Format your response in markdown. Be specific - reference work item IDs and titles.
            Keep it concise but informative. Focus on answering the user's actual question.""";

    private final OpenAiClient openAiClient;
    private final EmbeddingService embeddingService;
    private final EmbeddingDao embeddingDao;
    private final ObjectMapper objectMapper;

    public SearchService(OpenAiClient openAiClient, EmbeddingService embeddingService,
                         EmbeddingDao embeddingDao, ObjectMapper objectMapper) {
        this.openAiClient = openAiClient;
        this.embeddingService = embeddingService;
        this.embeddingDao = embeddingDao;
        this.objectMapper = objectMapper;
    }

    public SmartSearchResult smartSearch(String query, Long syncConfigId) {
        log.info("Smart search: '{}'", query);

        // Step 1: Query planning
        String today = java.time.LocalDate.now().toString();
        String plannerInput = "Today's date: " + today + "\nUser query: " + query;
        String planResponse = openAiClient.chatCompletion(QUERY_PLANNER_SYSTEM_PROMPT, plannerInput);

        SearchPlan plan;
        try {
            plan = objectMapper.readValue(planResponse, SearchPlan.class);
        } catch (Exception e) {
            log.warn("Failed to parse search plan: {}", planResponse, e);
            return SmartSearchResult.list(List.of(), "Failed to understand query");
        }

        log.info("Search plan: type={}, semantic='{}', sort={}, filters={}",
                plan.responseType(), plan.semanticQuery(), plan.sort(), plan.filters());

        // Step 2: Execute search
        String queryEmbedding = null;
        if (plan.semanticQuery() != null && !plan.semanticQuery().isBlank()) {
            queryEmbedding = embeddingService.embedQuery(plan.semanticQuery());
        }

        var filters = plan.filters() != null ? plan.filters() : new SearchPlan.SearchFilters(
                null, null, null, null, null, null, null);

        List<WorkItem> items = embeddingDao.smartSearch(
                syncConfigId,
                queryEmbedding,
                emptyIfNull(filters.states()),
                emptyIfNull(filters.notStates()),
                emptyIfNull(filters.types()),
                filters.assignee(),
                filters.dateFrom(),
                filters.dateTo(),
                filters.stalenessDays(),
                plan.sort() != null ? plan.sort() : "relevance",
                50
        );

        log.info("Smart search found {} items", items.size());

        // Step 3: If narrative mode, generate narrative response
        if ("narrative".equals(plan.responseType()) && !items.isEmpty()) {
            String narrative = generateNarrative(query, items);
            return SmartSearchResult.narrative(items, narrative, plan.explanation());
        }

        return SmartSearchResult.list(items, plan.explanation());
    }

    private String generateNarrative(String userQuery, List<WorkItem> items) {
        StringBuilder context = new StringBuilder();
        context.append("User question: ").append(userQuery).append("\n\n");
        context.append("Relevant work items (").append(items.size()).append("):\n\n");

        for (WorkItem item : items) {
            context.append("- #").append(item.id()).append(" [").append(item.workItemType()).append("] ");
            context.append(item.title());
            context.append(" (State: ").append(item.state());
            if (item.assignedTo() != null) {
                context.append(", Assigned: ").append(item.assignedTo());
            }
            if (item.changedDate() != null) {
                context.append(", Last changed: ").append(item.changedDate().toLocalDate());
            }
            context.append(")\n");
        }

        try {
            return openAiClient.chatCompletion(NARRATIVE_SYSTEM_PROMPT, context.toString());
        } catch (Exception e) {
            log.warn("Failed to generate narrative: {}", e.getMessage());
            return null;
        }
    }

    private List<String> emptyIfNull(List<String> list) {
        return list != null ? list : List.of();
    }
}
