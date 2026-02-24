package dev.adolab.domain.workitem.dao;

import dev.adolab.domain.workitem.entity.WorkItemComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkItemCommentDao {

    List<WorkItemComment> findByWorkItemId(@Param("workItemId") Integer workItemId,
                                           @Param("syncConfigId") Long syncConfigId);

    void upsert(@Param("comment") WorkItemComment comment);

    void upsertBatch(@Param("comments") List<WorkItemComment> comments);

    void deleteByWorkItemId(@Param("workItemId") Integer workItemId,
                            @Param("syncConfigId") Long syncConfigId);

    void deleteBySyncConfigId(@Param("syncConfigId") Long syncConfigId);

    int countByWorkItemId(@Param("workItemId") Integer workItemId,
                          @Param("syncConfigId") Long syncConfigId);
}
