package dev.adolab.domain.workitem;

import dev.adolab.domain.workitem.dao.WorkItemCommentDao;
import dev.adolab.domain.workitem.dao.WorkItemDao;
import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemComment;
import dev.adolab.domain.workitem.entity.WorkItemFilter;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class WorkItemService {

    private final WorkItemDao workItemDao;
    private final WorkItemCommentDao commentDao;

    public WorkItemService(WorkItemDao workItemDao, WorkItemCommentDao commentDao) {
        this.workItemDao = workItemDao;
        this.commentDao = commentDao;
    }

    public List<WorkItem> search(WorkItemFilter filter) {
        return workItemDao.findByFilter(filter);
    }

    public WorkItem getById(Integer id, Long syncConfigId) {
        return workItemDao.findById(id, syncConfigId);
    }

    public List<WorkItem> getChildren(Integer parentId, Long syncConfigId) {
        return workItemDao.findChildren(parentId, syncConfigId);
    }

    public List<WorkItemComment> getComments(Integer workItemId, Long syncConfigId) {
        return commentDao.findByWorkItemId(workItemId, syncConfigId);
    }

    public Map<String, Object> getMetadata(Long syncConfigId) {
        return Map.of(
                "types", workItemDao.findDistinctTypes(syncConfigId),
                "states", workItemDao.findDistinctStates(syncConfigId),
                "assignees", workItemDao.findDistinctAssignees(syncConfigId),
                "iterations", workItemDao.findDistinctIterations(syncConfigId)
        );
    }

    public Map<String, Integer> getStateCounts(Long syncConfigId) {
        List<String> states = workItemDao.findDistinctStates(syncConfigId);
        Map<String, Integer> counts = new java.util.LinkedHashMap<>();
        for (String state : states) {
            counts.put(state, workItemDao.countByState(syncConfigId, state));
        }
        counts.put("total", workItemDao.countByState(syncConfigId, null));
        return counts;
    }
}
