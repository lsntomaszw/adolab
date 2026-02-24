package dev.adolab.domain.workitem.dao;

import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemFilter;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkItemDao {

    List<WorkItem> findByFilter(@Param("f") WorkItemFilter filter);

    WorkItem findById(@Param("id") Integer id, @Param("syncConfigId") Long syncConfigId);

    List<WorkItem> findBySyncConfigId(@Param("syncConfigId") Long syncConfigId);

    List<WorkItem> findChildren(@Param("parentId") Integer parentId, @Param("syncConfigId") Long syncConfigId);

    void upsert(@Param("item") WorkItem item);

    void upsertBatch(@Param("items") List<WorkItem> items);

    void deleteBySyncConfigId(@Param("syncConfigId") Long syncConfigId);

    void deleteByIds(@Param("ids") List<Integer> ids, @Param("syncConfigId") Long syncConfigId);

    List<Integer> findAllIds(@Param("syncConfigId") Long syncConfigId);

    int countByState(@Param("syncConfigId") Long syncConfigId, @Param("state") String state);

    List<String> findDistinctTypes(@Param("syncConfigId") Long syncConfigId);

    List<String> findDistinctStates(@Param("syncConfigId") Long syncConfigId);

    List<String> findDistinctAssignees(@Param("syncConfigId") Long syncConfigId);

    List<String> findDistinctIterations(@Param("syncConfigId") Long syncConfigId);
}
