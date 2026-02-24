package dev.adolab.domain.workitem.dao;

import dev.adolab.domain.workitem.entity.SyncConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SyncConfigDao {

    List<SyncConfig> findAll();

    SyncConfig findById(@Param("id") Long id);

    void insert(@Param("name") String name,
                @Param("areaPath") String areaPath);

    void updateLastSynced(@Param("id") Long id, @Param("lastSynced") LocalDateTime lastSynced);

    void delete(@Param("id") Long id);
}
