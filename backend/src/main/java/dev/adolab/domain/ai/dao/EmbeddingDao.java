package dev.adolab.domain.ai.dao;

import dev.adolab.domain.workitem.entity.WorkItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmbeddingDao {

    void upsert(@Param("workItemId") Integer workItemId,
                @Param("syncConfigId") Long syncConfigId,
                @Param("summaryEn") String summaryEn,
                @Param("keywords") String[] keywords,
                @Param("embedding") String embedding,
                @Param("modelVersion") String modelVersion);

    List<WorkItem> findBySimilarity(@Param("syncConfigId") Long syncConfigId,
                                    @Param("queryEmbedding") String queryEmbedding,
                                    @Param("limit") int limit);

    List<WorkItem> smartSearch(@Param("syncConfigId") Long syncConfigId,
                               @Param("queryEmbedding") String queryEmbedding,
                               @Param("states") List<String> states,
                               @Param("notStates") List<String> notStates,
                               @Param("types") List<String> types,
                               @Param("assignee") String assignee,
                               @Param("dateFrom") String dateFrom,
                               @Param("dateTo") String dateTo,
                               @Param("stalenessDays") Integer stalenessDays,
                               @Param("sort") String sort,
                               @Param("limit") int limit);

    int countBySyncConfigId(@Param("syncConfigId") Long syncConfigId);
}
